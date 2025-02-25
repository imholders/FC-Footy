/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import axios from "axios";
import { sendFrameNotification } from "~/lib/notifications";
import { getFansForTeams } from "~/lib/kvPerferences";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL,
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN,
});

export async function POST(request: NextRequest) {
  const scoreboardUrl = "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";

  let liveEvents;
  const leagueId = "eng.1";
  try {
    const response = await axios.get(scoreboardUrl);
    if (!response.data.events) {
      throw new Error("No events data returned from API");
    }
    liveEvents = response.data.events;
    console.log(`Found ${liveEvents.length} event(s).`);
  } catch (error) {
    console.error("Error fetching scoreboard:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "Failed to fetch scoreboard" }),
      { status: 500 }
    );
  }

  const notifications: string[] = [];

  for (const event of liveEvents) {
    const matchId = event.id;
    const competition = event.competitions?.[0];
    if (!competition) continue;

    const homeTeam = competition.competitors?.find((c: any) => c.homeAway === "home");
    const awayTeam = competition.competitors?.find((c: any) => c.homeAway === "away");
    if (!homeTeam || !awayTeam) continue;

    const homeScore = parseInt(homeTeam.score, 10) || 0;
    const awayScore = parseInt(awayTeam.score, 10) || 0;
    const currentStatus = competition.status?.type?.state || "unknown";
    const period = competition.status?.period || 0;
    const statusType = competition.status?.type?.name || "unknown";

    // Fetch previous state and event history from Redis
    let previousState: any = {};
    let eventHistory: any = {};
    try {
      previousState = (await redis.hgetall(`fc-footy:match:${matchId}`)) || {};
      eventHistory = (await redis.hgetall(`fc-footy:match:${matchId}:events`)) || {};
    } catch (err) {
      console.error(`Error fetching Redis data for match ${matchId}`, err);
      continue;
    }

    // Initialize match in Redis if not found
    if (!previousState || Object.keys(previousState).length === 0) {
      console.log(`Initializing Redis for match ${matchId}`);
      await redis.hset(`fc-footy:match:${matchId}`, {
        status: currentStatus,
        period: period.toString(), // Store as string to avoid null issues
        homeScore: homeScore.toString(),
        awayScore: awayScore.toString(),
      });
      continue;
    }

    let notificationMessage = "";

    // 1. Kickoff Notification
    if (
      currentStatus === "in" &&
      previousState.status !== "in" &&
      !eventHistory.kickoff
    ) {
      notificationMessage = `Kickoff! ${homeTeam.team.shortDisplayName} vs ${awayTeam.team.shortDisplayName}`;
      await redis.hset(`fc-footy:match:${matchId}:events`, { kickoff: true });
    }

    // 2. Halftime Notification
    if (
      currentStatus === "in" &&
      period === 2 &&
      Number(previousState.period) < 2 &&
      !eventHistory.halftime
    ) {
      notificationMessage = `Halftime: ${homeTeam.team.shortDisplayName} ${homeScore} - ${awayScore} ${awayTeam.team.shortDisplayName}`;
      await redis.hset(`fc-footy:match:${matchId}:events`, { halftime: true });
    }

    // 3. Fulltime Notification
    if (
      statusType === "STATUS_FINAL" &&
      previousState.status !== "fulltime" &&
      !eventHistory.fulltime
    ) {
      notificationMessage = `Fulltime: ${homeTeam.team.shortDisplayName} ${homeScore} - ${awayScore} ${awayTeam.team.shortDisplayName}`;
      await redis.hset(`fc-footy:match:${matchId}:events`, { fulltime: true });
    }

    if (notificationMessage) {
      console.log(`Notification for match ${matchId}: ${notificationMessage}`);
      notifications.push(notificationMessage);

      const homeTeamId = `${leagueId}-${homeTeam.team?.abbreviation}`;
      const awayTeamId = `${leagueId}-${awayTeam.team?.abbreviation}`;
      let homeFans: number[] = [];
      let awayFans: number[] = [];
      try {
        homeFans = await getFansForTeams([homeTeamId.toLowerCase()]);
        awayFans = await getFansForTeams([awayTeamId.toLowerCase()]);
      } catch (err) {
        console.error(`Error fetching fans for match ${matchId}`, err);
      }

      const uniqueFansToNotify = new Set([...homeFans, ...awayFans]);
      const batchSize = 40;
      for (let i = 0; i < uniqueFansToNotify.size; i += batchSize) {
        const batch = Array.from(uniqueFansToNotify).slice(i, i + batchSize);
        const notificationPromises = batch.map(async (fid) => {
          try {
            await sendFrameNotification({
              fid,
              title: "Match Update",
              body: notificationMessage,
            });
          } catch (error) {
            console.error(`Failed to send notification to FID: ${fid}`, error);
          }
        });
        await Promise.all(notificationPromises);
      }
    }

    await redis.hset(`fc-footy:match:${matchId}`, {
      status: currentStatus,
      period: period.toString(),
      homeScore: homeScore.toString(),
      awayScore: awayScore.toString(),
    });
  }

  return new NextResponse(
    JSON.stringify({
      success: true,
      notificationsSent: notifications.length,
      notifications,
    }),
    { status: 200 }
  );
}

export const runtime = "edge";
