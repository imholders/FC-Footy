/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import axios, { AxiosError } from "axios";
import { sendFrameNotification } from "~/lib/notifications";
import { getFansForTeams } from "~/lib/kvPerferences";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL,
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export async function POST(request: NextRequest) {
  const scoreboardUrl =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";

  let liveEvents: any[] = [];
  const leagueId = "eng.1";

  const fetchWithRetry = async (url: string, retries: number): Promise<any> => {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      if (!response.data.events) {
        throw new Error("No events data returned from API");
      }
      return response.data.events;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Attempt ${MAX_RETRIES - retries + 1} failed:`, {
        message: axiosError.message,
        status: axiosError.response?.status,
      });
      if (retries > 1) {
        if (axiosError.response?.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * 2));
        } else {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
        return fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  };

  try {
    liveEvents = await fetchWithRetry(scoreboardUrl, MAX_RETRIES);
    liveEvents = liveEvents.filter(
      (event: any) =>
        event.competitions?.[0]?.status?.type?.state === "in"
    );
    console.log(`Found ${liveEvents.length} live event(s).`);
  } catch (error) {
    console.error("Failed to fetch scoreboard after retries:", error);
    return new NextResponse(
      JSON.stringify({
        success: true,
        notificationsSent: 0,
        goalNotifications: [],
        message: "No live events or API temporarily unavailable",
      }),
      { status: 200 }
    );
  }

  const goalNotifications: string[] = [];

  for (const event of liveEvents) {
    const matchId = event.id;
    const competition = event.competitions?.[0];
    if (!competition) {
      console.warn(`No competition data for match ${matchId}. Skipping.`);
      continue;
    }

    const homeTeam = competition.competitors?.find(
      (c: any) => c.homeAway === "home"
    );
    const awayTeam = competition.competitors?.find(
      (c: any) => c.homeAway === "away"
    );
    if (!homeTeam || !awayTeam) {
      console.warn(`Missing team data for match ${matchId}. Skipping.`);
      continue;
    }
    const homeScore = parseInt(homeTeam.score, 10);
    const awayScore = parseInt(awayTeam.score, 10);

    // Fetch previous state from Redis
    let previousState: any;
    try {
      previousState = await redis.hgetall(`fc-footy:match:${matchId}`);
    } catch (err) {
      console.error(`Error fetching Redis data for match ${matchId}`, err);
      continue;
    }

    // Initialize match in Redis if not found
    if (!previousState || Object.keys(previousState).length === 0) {
      console.log(
        `Initializing Redis for match ${matchId} with scores: ${homeScore}-${awayScore}`
      );
      await redis.hset(`fc-footy:match:${matchId}`, {
        homeScore,
        awayScore,
        goals: JSON.stringify([]), // Initialize goal history
      });
      continue;
    }

    const previousGoals: Array<{
      player: string;
      time: string;
      homeScore: number;
      awayScore: number;
    }> = previousState.goals ? JSON.parse(previousState.goals) : [];

    // Check for score change
    const previousHomeScore = Number(previousState.homeScore);
    const previousAwayScore = Number(previousState.awayScore);
    if (previousHomeScore === homeScore && previousAwayScore === awayScore) {
      continue;
    }

    // Extract goal details
    let newGoals: Array<{
      player: string;
      time: string;
      homeScore: number;
      awayScore: number;
    }> = [...previousGoals];
    let message = "";
    let isGoalDisallowed = false;

    if (competition.details && Array.isArray(competition.details)) {
      const keyMoments = competition.details
        .filter((detail: any) => detail.type?.text === "Goal") // Adjust based on API
        .sort((a: any, b: any) => {
          const timeA = a.clock?.displayValue || "00:00";
          const timeB = b.clock?.displayValue || "00:00";
          const secondsA = timeA
            .split(":")
            .reduce((acc: number, val: string) => acc * 60 + parseInt(val, 10), 0);
          const secondsB = timeB
            .split(":")
            .reduce((acc: number, val: string) => acc * 60 + parseInt(val, 10), 0);
          return secondsA - secondsB;
        });

      // Check for new goals or VAR overturns
      const totalGoals = homeScore + awayScore;
      if (keyMoments.length > previousGoals.length) {
        // New goal detected
        const latestMoment = keyMoments[keyMoments.length - 1];
        const scoringPlayer =
          latestMoment.athletesInvolved?.[0]?.displayName || "Unknown";
        const clockTime = latestMoment.clock?.displayValue || "00:00";

        newGoals.push({
          player: scoringPlayer,
          time: clockTime,
          homeScore,
          awayScore,
        });

        message = `${
          homeTeam.team?.shortDisplayName || homeTeam.team?.displayName
        } ${homeScore} - ${awayScore} ${
          awayTeam.team?.shortDisplayName || awayTeam.team?.displayName
        } | ${scoringPlayer} scored at ${clockTime}`;
      } else if (keyMoments.length < previousGoals.length || totalGoals < previousGoals.length) {
        // Goal disallowed (VAR)
        isGoalDisallowed = true;
        newGoals = newGoals.slice(0, totalGoals); // Remove latest goal
        message = `${
          homeTeam.team?.shortDisplayName || homeTeam.team?.displayName
        } ${homeScore} - ${awayScore} ${
          awayTeam.team?.shortDisplayName || awayTeam.team?.displayName
        } | Goal disallowed after VAR review`;
      }
    } else {
      console.warn(`No detailed moments found for match ${matchId}.`);
      // Fallback for score change without details
      message = `${
        homeTeam.team?.shortDisplayName || homeTeam.team?.displayName
      } ${homeScore} - ${awayScore} ${
        awayTeam.team?.shortDisplayName || awayTeam.team?.displayName
      } | Score updated`;
    }

    if (message) {
      goalNotifications.push(message);
      console.log(`Notification for match ${matchId}: ${message}`);

      // Fetch fans
      let homeFans: number[] = [];
      let awayFans: number[] = [];
      const homeTeamId = `${leagueId}-${homeTeam.team?.abbreviation}`;
      const awayTeamId = `${leagueId}-${awayTeam.team?.abbreviation}`;

      try {
        homeFans = await getFansForTeams([homeTeamId.toLowerCase()]);
        awayFans = await getFansForTeams([awayTeamId.toLowerCase()]);
      } catch (err) {
        console.error(`Error fetching fans for match ${matchId}`, err);
      }
      const uniqueFansToNotify = new Set([...homeFans, ...awayFans]);

      let userKeys: string[] = [];
      try {
        userKeys = await redis.keys("fc-footy:user:*");
      } catch (err) {
        console.error("Error fetching user keys from Redis", err);
      }
      const fidsToNotify = Array.from(uniqueFansToNotify).filter((fid) =>
        userKeys.some((key) => key.endsWith(`:${fid}`))
      );

      // Send notifications
      const batchSize = 40;
      for (let i = 0; i < fidsToNotify.length; i += batchSize) {
        const batch = fidsToNotify.slice(i, i + batchSize);
        const notificationPromises = batch.map(async (fid) => {
          try {
            await sendFrameNotification({
              fid,
              title: isGoalDisallowed ? "VAR Decision" : "Goal! Goal! Goal!",
              body: message,
            });
          } catch (error) {
            console.error(`Failed to send notification to FID: ${fid}`, error);
          }
        });
        await Promise.all(notificationPromises);
      }
    }

    // Update Redis
    await redis.hset(`fc-footy:match:${matchId}`, {
      homeScore,
      awayScore,
      goals: JSON.stringify(newGoals),
    });
  }

  return new NextResponse(
    JSON.stringify({
      success: true,
      notificationsSent: goalNotifications.length,
      goalNotifications,
    }),
    { status: 200 }
  );
}

export const runtime = "edge";