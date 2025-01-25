/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import axios from "axios";
import { sendFrameNotification } from "~/lib/notifications";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL,
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN,
});

export async function POST(request: NextRequest) {
  // Validate API key
//   const apiKey = request.headers.get("x-api-key");
//   if (apiKey !== process.env.NEXT_PUBLIC_NOTIFICATION_API_KEY) {
//     return new Response(
//       JSON.stringify({ success: false, error: "Unauthorized" }),
//       { status: 401 }
//     );
//   }

  // Fetch live scoreboard from ESPN API
  const scoreboardUrl =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";

  let liveEvents;
  try {
    const response = await axios.get(scoreboardUrl);
    liveEvents = response.data.events;
  } catch (error) {
    console.error("Error fetching scoreboard:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch scoreboard" }),
      { status: 500 }
    );
  }

  // Process live events to detect goal changes
  const goalNotifications: string[] = [];
  for (const event of liveEvents) {
    const matchId = event.id;
    const homeTeam = event.competitions[0].competitors.find(
      (c: any) => c.homeAway === "home"
    );
    const awayTeam = event.competitions[0].competitors.find(
      (c: any) => c.homeAway === "away"
    );

    const homeScore = parseInt(homeTeam.score, 10);
    const awayScore = parseInt(awayTeam.score, 10);

    // Fetch previous scores from Redis
    const previousScore = await redis.hgetall(`fc-footy:match:${matchId}`);

    if (!previousScore || Object.keys(previousScore).length === 0) {
      // Initialize the match in Redis if it doesn't exist
      console.log(`No previous data for match ${matchId}. Initializing scores.`);
      await redis.hset(`fc-footy:match:${matchId}`, { homeScore, awayScore });
    } else {
      // Compare scores to detect a change
      if (
        Number(previousScore.homeScore) !== homeScore ||
        Number(previousScore.awayScore) !== awayScore
      ) {
        // Extract player who scored
        const scoringEvent = event.competitions[0].status.detail; // Assuming event details are here
        const scoringPlayer =
          scoringEvent?.athletesInvolved?.[0]?.displayName || "";

        // Goal detected
        const message = `${homeTeam.team.shortDisplayName} ${homeScore} - ${awayScore} ${awayTeam.team.shortDisplayName}`;
        goalNotifications.push(message);

       // Send notifications to all subscribed users
        const userKeys = await redis.keys("fc-footy:user:*");

        for (const key of userKeys) {
            const notificationPromises = userKeys.map(async (key) => {
                const fid = parseInt(key.split(":").pop()!);
                try {
                  await sendFrameNotification({ fid, title: "Goal! Goal! Goal!", body: message });
                } catch (error) {
                  console.error(`Failed to send notification to FID: ${fid}`, error);
                }
              });
              await Promise.all(notificationPromises);
            }


        // Update Redis with the new scores
        await redis.hset(`fc-footy:match:${matchId}`, { homeScore, awayScore });
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      notificationsSent: goalNotifications.length,
      goalNotifications,
    }),
    { status: 200 }
  );
}

