/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { sendFrameNotification } from "~/lib/notifications";
import { getFansForTeams } from "~/lib/kvPerferences";

export const runtime = "edge";

// Initialize Redis
const redis = new Redis({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL!,
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN!,
});

// Retry & timeout settings
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;        // ms
const REQUEST_TIMEOUT = 10000;   // ms

// Bind fetch to globalThis to avoid "Illegal invocation"
const boundFetch = fetch.bind(globalThis);

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const res = await boundFetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data.events)) {
      throw new Error("No events data returned from API");
    }

    return data.events;
  } catch (err: any) {
    if (retries > 1) {
      const isRateLimit = err.name === 'AbortError' || err.message.includes('429');
      await new Promise((r) => setTimeout(r, RETRY_DELAY * (isRateLimit ? 2 : 1)));
      return fetchWithRetry(url, retries - 1);
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const scoreboardUrl =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";

  // 1. Fetch live events
  let liveEvents: any[] = [];
  const leagueId = "eng.1";
  try {
    liveEvents = await fetchWithRetry(scoreboardUrl);
    liveEvents = liveEvents.filter(
      (event) => event.competitions?.[0]?.status?.type?.state === "in"
    );
    console.log(`Found ${liveEvents.length} live event(s).`);
  } catch (error) {
    console.error("Failed to fetch scoreboard after retries:", error);
    return NextResponse.json(
      { success: true, notificationsSent: 0, goalNotifications: [], message: "No live events or API temporarily unavailable" },
      { status: 200 }
    );
  }

  const goalNotifications: string[] = [];

  // 2. Process each live match
  for (const event of liveEvents) {
    const matchId = event.id;
    const competition = event.competitions?.[0];
    if (!competition) continue;

    const homeTeam = competition.competitors?.find((c: any) => c.homeAway === "home");
    const awayTeam = competition.competitors?.find((c: any) => c.homeAway === "away");
    if (!homeTeam || !awayTeam) continue;

    const homeScore = parseInt(homeTeam.score, 10);
    const awayScore = parseInt(awayTeam.score, 10);

    // 2a. Load previous state from Redis
    let previousState: any = {};
    try {
      previousState = await redis.hgetall(`fc-footy:match:${matchId}`);
    } catch (err) {
      console.error(`Error fetching Redis data for match ${matchId}`, err);
      continue;
    }

    // 2b. Initialize if first time
    if (!previousState || Object.keys(previousState).length === 0) {
      await redis.hset(`fc-footy:match:${matchId}`, {
        homeScore,
        awayScore,
        goals: JSON.stringify([]),
      });
      continue;
    }

    const previousGoals = previousState.goals ? JSON.parse(previousState.goals) : [];
    const prevHome = Number(previousState.homeScore);
    const prevAway = Number(previousState.awayScore);

    // 2c. Skip if no change
    if (prevHome === homeScore && prevAway === awayScore) continue;

    // 2d. Detect new goals or VAR
    let newGoals = [...previousGoals];
    let message = "";
    let isGoalDisallowed = false;

    if (Array.isArray(competition.details)) {
      const keyMoments = competition.details
        .filter((d: any) => d.type?.text === "Goal")
        .sort((a: any, b: any) => {
          const toSeconds = (tm = "00:00") => tm.split(':').reduce((ac, v) => ac * 60 + parseInt(v, 10), 0);
          return toSeconds(a.clock?.displayValue) - toSeconds(b.clock?.displayValue);
        });

      const totalGoals = homeScore + awayScore;
      if (keyMoments.length > previousGoals.length) {
        // New goal
        const latest = keyMoments[keyMoments.length - 1];
        const scorer = latest.athletesInvolved?.[0]?.displayName || "Unknown";
        const clockTime = latest.clock?.displayValue || "00:00";
        newGoals.push({ player: scorer, time: clockTime, homeScore, awayScore });
        message = `${homeTeam.team?.shortDisplayName || homeTeam.team?.displayName} ${homeScore} - ${awayScore} ${awayTeam.team?.shortDisplayName || awayTeam.team?.displayName} | ${scorer} scored at ${clockTime}`;
      } else if (keyMoments.length < previousGoals.length || totalGoals < previousGoals.length) {
        // VAR disallowed
        isGoalDisallowed = true;
        newGoals = newGoals.slice(0, totalGoals);
        message = `${homeTeam.team?.shortDisplayName || homeTeam.team?.displayName} ${homeScore} - ${awayScore} ${awayTeam.team?.shortDisplayName || awayTeam.team?.displayName} | Goal disallowed after VAR review`;
      }
    } else {
      // Fallback
      message = `${homeTeam.team?.shortDisplayName || homeTeam.team?.displayName} ${homeScore} - ${awayScore} ${awayTeam.team?.shortDisplayName || awayTeam.team?.displayName} | Score updated`;
    }

    // 2e. Notify fans if there's a message
    if (message) {
      goalNotifications.push(message);
      console.log(`Notify: ${message}`);

      const homeId = `${leagueId}-${homeTeam.team?.abbreviation}`.toLowerCase();
      const awayId = `${leagueId}-${awayTeam.team?.abbreviation}`.toLowerCase();

      let homeFans: number[] = [];
      let awayFans: number[] = [];
      try {
        homeFans = await getFansForTeams([homeId]);
        awayFans = await getFansForTeams([awayId]);
      } catch (err) {
        console.error(`Error fetching fans for ${matchId}`, err);
      }

      const uniqueFans = new Set([...homeFans, ...awayFans]);
      let userKeys: string[] = [];
      try {
        userKeys = await redis.keys("fc-footy:user:*");
      } catch (err) {
        console.error("Error fetching user keys from Redis", err);
      }

      const fidsToNotify = Array.from(uniqueFans).filter((fid) =>
        userKeys.some((key) => key.endsWith(`:${fid}`))
      );

      const batchSize = 40;
      for (let i = 0; i < fidsToNotify.length; i += batchSize) {
        const batch = fidsToNotify.slice(i, i + batchSize);
        await Promise.all(
          batch.map((fid) =>
            sendFrameNotification({
              fid,
              title: isGoalDisallowed ? "VAR Decision" : "Goal! Goal! Goal!",
              body: message,
            }).catch((e) => console.error(`Failed ${fid}:`, e))
          )
        );
      }
    }

    // 2f. Persist updated state
    await redis.hset(`fc-footy:match:${matchId}`, {
      homeScore,
      awayScore,
      goals: JSON.stringify(newGoals),
    });
  }

  // 3. Return summary
  return NextResponse.json(
    { success: true, notificationsSent: goalNotifications.length, goalNotifications },
    { status: 200 }
  );
}
