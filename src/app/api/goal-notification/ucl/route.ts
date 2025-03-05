/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import axios from "axios";
import { sendFrameNotification } from "~/lib/notifications";
import { getFansForTeamAbbr } from "~/lib/kvPerferences"; // Import the new function

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL,
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN,
});

export async function POST(request: NextRequest) {
  const scoreboardUrl =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard";

  let liveEvents;
  try {
    const response = await axios.get(scoreboardUrl);
    if (!response.data.events) {
      throw new Error("No events data returned from API");
    }
    liveEvents = response.data.events.filter(
      (event: any) => event.competitions?.[0]?.status?.type?.state === "in"
    );
    console.log(`Found ${liveEvents.length} live event(s) in UCL.`);
  } catch (error) {
    console.error("Error fetching UCL scoreboard:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "Failed to fetch scoreboard" }),
      { status: 500 }
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

    let previousScore;
    try {
      previousScore = await redis.hgetall(`fc-footy:ucl:match:${matchId}`);
    } catch (err) {
      console.error(`Error fetching Redis data for UCL match ${matchId}`, err);
      continue;
    }

    if (!previousScore || Object.keys(previousScore).length === 0) {
      console.log(
        `Initializing Redis for UCL match ${matchId} with scores: ${homeScore}-${awayScore}`
      );
      await redis.hset(`fc-footy:ucl:match:${matchId}`, { homeScore, awayScore });
      continue;
    }

    if (
      Number(previousScore.homeScore) === homeScore &&
      Number(previousScore.awayScore) === awayScore
    ) {
      continue;
    }

    let scoringPlayer = "Baller";
    let clockTime = "00:00";
    if (competition.details && Array.isArray(competition.details)) {
      const keyMoments = competition.details.sort((a: any, b: any) => {
        const timeA = a.clock?.displayValue || "00:00";
        const timeB = b.clock?.displayValue || "00:00";
        const secondsA = timeA
          .split(":")
          .reduce(
            (acc: number, val: string) => acc * 60 + parseInt(val, 10),
            0
          );
        const secondsB = timeB
          .split(":")
          .reduce(
            (acc: number, val: string) => acc * 60 + parseInt(val, 10),
            0
          );
        return secondsA - secondsB;
      });
      if (keyMoments.length > 0) {
        const latestMoment = keyMoments[keyMoments.length - 1];
        scoringPlayer =
          latestMoment.athletesInvolved?.[0]?.displayName || scoringPlayer;
        clockTime = latestMoment.clock?.displayValue || clockTime;
      }
    }

    const homeTeamAbbr = homeTeam.team?.abbreviation?.toLowerCase();
    const awayTeamAbbr = awayTeam.team?.abbreviation?.toLowerCase();

    const message = `${
      homeTeam.team?.shortDisplayName || homeTeam.team?.displayName
    } ${homeScore} - ${awayScore} ${
      awayTeam.team?.shortDisplayName || awayTeam.team?.displayName
    } | ${scoringPlayer} scored at ${clockTime} (UCL)`;
    goalNotifications.push(message);
    console.log(`Goal detected in UCL match ${matchId}: ${message}`);

    // Fetch fans using team abbreviations
    let homeFans: number[] = [];
    let awayFans: number[] = [];
    try {
      homeFans = await getFansForTeamAbbr(homeTeamAbbr);
      awayFans = await getFansForTeamAbbr(awayTeamAbbr);
      console.log(`Fans for ${homeTeamAbbr}: ${homeFans.length}, ${awayTeamAbbr}: ${awayFans.length}`);
    } catch (err) {
      console.error(`Error fetching fans for UCL match ${matchId}`, err);
    }

    const uniqueFansToNotify = new Set([...homeFans, ...awayFans]);
    const fidsToNotify = Array.from(uniqueFansToNotify);

    console.log(`Notifying ${fidsToNotify.length} fans for UCL match ${matchId}`);

    const batchSize = 40;
    for (let i = 0; i < fidsToNotify.length; i += batchSize) {
      const batch = fidsToNotify.slice(i, i + batchSize);
      const notificationPromises = batch.map(async (fid) => {
        try {
          await sendFrameNotification({
            fid,
            title: "Goal! Goal! Goal! (UCL)",
            body: message,
          });
        } catch (error) {
          console.error(`Failed to send UCL notification to FID: ${fid}`, error);
        }
      });
      await Promise.all(notificationPromises);
    }

    await redis.hset(`fc-footy:ucl:match:${matchId}`, { homeScore, awayScore });
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

