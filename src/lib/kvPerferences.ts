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
 */
export async function getTeamPreferences(fid: number): Promise<string[] | null> {
  const res = await redis.get<string[]>(getTeamPreferencesKey(fid));
  console.log("getTeamPreferences", res);
  return res;
}

/**
 * Set the team preferences for a user.
 */
export async function setTeamPreferences(fid: number, teams: string[]): Promise<void> {
  console.log("setTeamPreferences", teams, fid);
  await redis.set(getTeamPreferencesKey(fid), teams);
}

/**
 * Delete the team preferences for a user.
 */
export async function deleteTeamPreferences(fid: number): Promise<void> {
  await redis.del(getTeamPreferencesKey(fid));
}

/**
 * Get all fan FIDs for a given team from KV.
 * This function scans keys with the prefix "fc-footy:preference:" and returns an array
 * of FIDs for which the stored preferences include the given teamAbbreviation.
 */
export async function getFansForTeam(teamAbbreviation: string): Promise<number[]> {
  console.log("Scanning keys for fans of team:", teamAbbreviation);
  const keys = await redis.keys("fc-footy:preference:*");
  console.log("Found keys:", keys);
  const matchingFids: number[] = [];
  for (const key of keys) {
    const preferences = await redis.get<string[]>(key);
    if (preferences && preferences.includes(teamAbbreviation)) {
      // key should be in the form "fc-footy:preference:{fid}"
      const parts = key.split(":");
      const fidStr = parts[parts.length - 1];
      const fid = Number(fidStr);
      if (!isNaN(fid)) {
        matchingFids.push(fid);
      }
    }
  }
  console.log("Matching fan FIDs for team", teamAbbreviation, matchingFids);
  return matchingFids;
}
