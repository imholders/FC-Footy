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
  const scoreboardUrl =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";

  let events;
  const leagueId = "eng.1";
  try {
    const response = await axios.get(scoreboardUrl);
    if (!response.data.events) {
      throw new Error("No events data returned from API");
    }
    events = response.data.events;
    console.log(`Found ${events.length} event(s).`);
  } catch (error) {
    console.error("Error fetching scoreboard:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "Failed to fetch scoreboard" }),
      { status: 500 }
    );
  }

  const notifications: string[] = [];

  for (const event of events) {
    const matchId = event.id;
    const competition = event.competitions?.[0];
    if (!competition) {
      console.warn(`No competition data for match ${matchId}. Skipping.`);
      continue;
    }

    const homeTeam = competition.competitors?.find((c: any) => c.homeAway === "home");
    const awayTeam = competition.competitors?.find((c: any) => c.homeAway === "away");
    if (!homeTeam || !awayTeam) {
      console.warn(`Missing team data for match ${matchId}. Skipping.`);
      continue;
    }

    const homeScore = parseInt(homeTeam.score, 10);
    const awayScore = parseInt(awayTeam.score, 10);
    const matchState = competition.status?.type?.state; // "pre", "in", "post"
    const statusName = competition.status?.type?.name; // e.g., "STATUS_HALF_TIME"
    const isCompleted = competition.status?.type?.completed;

    // Fetch previous match data from Redis
    let previousMatchData: any;
    try {
      previousMatchData = await redis.hgetall(`fc-footy:match:${matchId}`) || {};
    } catch (err) {
      console.error(`Error fetching Redis data for match ${matchId}`, err);
      continue;
    }

    // Initialize match in Redis if not found
    if (!previousMatchData || Object.keys(previousMatchData).length === 0) {
      console.log(`Initializing Redis for match ${matchId}`);
      await redis.hset(`fc-footy:match:${matchId}`, {
        homeScore: homeScore,
        awayScore: awayScore,
        matchState: matchState,
        startDate: event.date,
        kickoffNotified: "false",
        halftimeNotified: "false",
        fulltimeNotified: "false",
        yellowCardEvents: JSON.stringify([]),
        redCardEvents: JSON.stringify([]),
      });
      continue; // Skip notifications on initialization
    }

    const homeTeamName = homeTeam.team?.shortDisplayName || homeTeam.team?.displayName;
    const awayTeamName = awayTeam.team?.shortDisplayName || awayTeam.team?.displayName;
    const matchSummary = `${homeTeamName} ${homeScore} - ${awayScore} ${awayTeamName}`;

    // Fetch fans for both teams
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
    const userKeys = await redis.keys("fc-footy:user:*");
    const fidsToNotify = Array.from(uniqueFansToNotify).filter((fid) =>
      userKeys.some((key) => key.endsWith(`:${fid}`))
    );

    // Helper function to send notifications
    const notifyFans = async (title: string, body: string) => {
      const batchSize = 40;
      for (let i = 0; i < fidsToNotify.length; i += batchSize) {
        const batch = fidsToNotify.slice(i, i + batchSize);
        const notificationPromises = batch.map((fid) =>
          sendFrameNotification({ fid, title, body }).catch((error) =>
            console.error(`Failed to send notification to FID: ${fid}`, error)
          )
        );
        await Promise.all(notificationPromises);
      }
      notifications.push(body);
      console.log(`Notified ${fidsToNotify.length} fans: ${body}`);
    };

    // Kickoff Notification
    if (
      previousMatchData.matchState === "pre" &&
      matchState === "in" &&
      previousMatchData.kickoffNotified === "false"
    ) {
      await notifyFans("Match Kickoff!", `${matchSummary} has started!`);
      await redis.hset(`fc-footy:match:${matchId}`, { kickoffNotified: "true" });
    }

    // Halftime Notification
    if (
      statusName === "STATUS_HALF_TIME" &&
      previousMatchData.halftimeNotified === "false"
    ) {
      await notifyFans("Halftime!", `${matchSummary} - Halftime`);
      await redis.hset(`fc-footy:match:${matchId}`, { halftimeNotified: "true" });
    }

    // Fulltime Notification
    if (
      (matchState === "post" || isCompleted) &&
      previousMatchData.fulltimeNotified === "false"
    ) {
      await notifyFans("Fulltime!", `${matchSummary} - Match Ended`);
      await redis.hset(`fc-footy:match:${matchId}`, { fulltimeNotified: "true" });
    }

    // Goal Notification
    if (
      Number(previousMatchData.homeScore) !== homeScore ||
      Number(previousMatchData.awayScore) !== awayScore
    ) {
      let scoringPlayer = "Baller";
      let clockTime = "00:00";
      if (competition.details?.length > 0) {
        const latestMoment = competition.details.sort((a: any, b: any) => {
          const timeA = a.clock?.displayValue || "00:00";
          const timeB = b.clock?.displayValue || "00:00";
          const secondsA = timeA.split(":").reduce((acc: number, val: string) => acc * 60 + parseInt(val, 10), 0);
          const secondsB = timeB.split(":").reduce((acc: number, val: string) => acc * 60 + parseInt(val, 10), 0);
          return secondsA - secondsB;
        }).pop();
        if (latestMoment.type?.text === "Goal") {
          scoringPlayer = latestMoment.athletesInvolved?.[0]?.displayName || scoringPlayer;
          clockTime = latestMoment.clock?.displayValue || clockTime;
        }
      }
      const goalMessage = `${matchSummary} | ${scoringPlayer} scored at ${clockTime}`;
      await notifyFans("Goal! Goal! Goal!", goalMessage);
    }

    // Yellow and Red Card Notifications
    if (competition.details?.length > 0) {
      // Safely parse previous card events with a fallback
      let previousYellowCards: { player: string; time: string }[] = [];
      let previousRedCards: { player: string; time: string }[] = [];
      try {
        previousYellowCards = previousMatchData.yellowCardEvents
          ? JSON.parse(previousMatchData.yellowCardEvents)
          : [];
      } catch (err) {
        console.error(`Invalid yellowCardEvents for match ${matchId}: ${previousMatchData.yellowCardEvents}`, err);
        previousYellowCards = [];
      }
      try {
        previousRedCards = previousMatchData.redCardEvents
          ? JSON.parse(previousMatchData.redCardEvents)
          : [];
      } catch (err) {
        console.error(`Invalid redCardEvents for match ${matchId}: ${previousMatchData.redCardEvents}`, err);
        previousRedCards = [];
      }

      const currentYellowCards: { player: string; time: string }[] = [];
      const currentRedCards: { player: string; time: string }[] = [];

      // Extract card events from details
      competition.details.forEach((detail: any) => {
        const player = detail.athletesInvolved?.[0]?.displayName || "Unknown Player";
        const time = detail.clock?.displayValue || "00:00";
        if (detail.type?.text === "Yellow Card") {
          currentYellowCards.push({ player, time });
        } else if (detail.type?.text === "Red Card") {
          currentRedCards.push({ player, time });
        }
      });

      // Detect new yellow cards
      const newYellowCards = currentYellowCards.filter(
        (card) =>
          !previousYellowCards.some(
            (prev) => prev.player === card.player && prev.time === card.time
          )
      );
      for (const card of newYellowCards) {
        await notifyFans(
          "Yellow Card!",
          `${matchSummary} | ${card.player} booked at ${card.time}`
        );
      }

      // Detect new red cards
      const newRedCards = currentRedCards.filter(
        (card) =>
          !previousRedCards.some(
            (prev) => prev.player === card.player && prev.time === card.time
          )
      );
      for (const card of newRedCards) {
        await notifyFans(
          "Red Card!",
          `${matchSummary} | ${card.player} sent off at ${card.time}`
        );
      }

      // Update Redis with current card events
      await redis.hset(`fc-footy:match:${matchId}`, {
        yellowCardEvents: JSON.stringify(currentYellowCards),
        redCardEvents: JSON.stringify(currentRedCards),
      });
    }

    // Update match data in Redis
    await redis.hset(`fc-footy:match:${matchId}`, {
      homeScore: homeScore,
      awayScore: awayScore,
      matchState: matchState,
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