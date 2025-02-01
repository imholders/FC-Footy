import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL,
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN,
});

function getTeamPreferencesKey(fid: number): string {
  return `fc-footy:preference:${fid}`;
}

/**
 * Get the team preferences for a user.
 *
 * @param fid - The user's unique identifier.
 * @returns An array of team abbreviations or null if not set.
 */
export async function getTeamPreferences(fid: number): Promise<string[] | null> {
  const res = await redis.get<string[]>(getTeamPreferencesKey(fid));
  console.log("getTeamPreferences", res);
  console.log("redis", redis);

  return res;
}

/**
 * Set the team preferences for a user.
 *
 * @param fid - The user's unique identifier.
 * @param teams - An array of team abbreviations to store.
 */
export async function setTeamPreferences(fid: number, teams: string[]): Promise<void> {
  console.log("setTeamPreferences", teams, fid);
  await redis.set(getTeamPreferencesKey(fid), teams);
}

/**
 * Delete the team preferences for a user.
 *
 * @param fid - The user's unique identifier.
 */
export async function deleteTeamPreferences(fid: number): Promise<void> {
  await redis.del(getTeamPreferencesKey(fid));
}
