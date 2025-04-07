import { getTeamPreferences } from "../../lib/kvPerferences";
import { getTeamLogo } from "./fetchTeamLogos";
import { fetchFanUserData } from "./fetchFCProfile";

export interface FanPair {
  fid1: number;
  fid2: number;
  overlap: number;
  shared: string[];
  pfp?: string;
  teamLogos?: string[];
}

export const getAlikeFanMatches = async (
  currentFid: number | undefined,
  fellowFollowers: number[]
): Promise<FanPair[]> => {
  if (!currentFid || fellowFollowers.length <= 1) return [];

  const preferences: Record<number, string[]> = {};
  for (const fid of fellowFollowers) {
    const teams = await getTeamPreferences(fid);
    preferences[fid] = teams || [];
  }

  const pairs: FanPair[] = [];

  for (const fid of fellowFollowers) {
    if (fid === currentFid) continue;
    const shared = preferences[currentFid].filter(team => preferences[fid]?.includes(team));
    if (shared.length > 0) {
      const userData = await fetchFanUserData(fid);
      const pfp = userData?.USER_DATA_TYPE_PFP?.[0] || "";
      const teamLogos = shared.map(team => {
        const [league, abbr] = team.split("-");
        return getTeamLogo(abbr, league);
      });

      pairs.push({ fid1: currentFid, fid2: fid, overlap: shared.length, shared, pfp, teamLogos });
    }
  }

  pairs.sort((a, b) => b.overlap - a.overlap);
  return pairs.slice(0, 8);
};
