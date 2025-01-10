import { NextRequest } from "next/server";
import { getUserNotificationDetails } from "~/lib/kv";
import { sendFrameNotification } from "~/lib/notifications";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function POST(request: NextRequest) {
    // Validate API key from headers
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.NEXT_PUBLIC_NOTIFICATION_API_KEY) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const { title, body } = await request.json();

  // Scan Redis to fetch all user notification keys
  const userKeys = await redis.keys("fc-footy:user:*");
  const notificationResults = [];

  for (const key of userKeys) {
    const fid = parseInt(key.split(":").pop()!); // Extract FID from the key
    const notificationDetails = await getUserNotificationDetails(fid);

    if (notificationDetails) {
      const result = await sendFrameNotification({ fid, title, body });
      notificationResults.push({ fid, result });
    }
  }

  return Response.json({
    success: true,
    notificationResults,
  });
}
export const runtime = 'edge';