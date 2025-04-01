import { getTeamPreferences } from "~/lib/kv";
const DEFAULT_CHANNEL_HASH = process.env.NEXT_PUBLIC_DEFAULT_CHANNEL_HASH || "0x09c73260a2d39cb44fac1f488751fddd6b9fc0c0";
import axios from "axios";

export interface CastType {
  timestamp: number;
  hash: string;
  text: string;
  author: {
    fid: string;
    username: string;
    pfp_url: string;
  };
  direct_replies?: CastType[];
  teamBadgeUrl?: string | null;
  // Add any additional fields as needed
}


export const fetchCastByHash = async (): Promise<CastType[]> => {
  try {
      const response = await axios.get(
        `https://api.neynar.com/v2/farcaster/cast/conversation`,
        {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_NEYNAR_API_KEY!,
            "accept": "application/json",
          },
          params: {
            identifier: DEFAULT_CHANNEL_HASH, // The Gantry hash in /football
            type: "hash",
            reply_depth: 1,
            include_chronological_parent_casts: false,
            sort_type: "desc_chron", // "desc_chron" | "chron" ??
            limit: 10,
          },
        }
      );
  
      const root = response.data?.conversation?.cast;
      const replies = (root?.direct_replies ?? []).reverse();
      const casts = [root, ...replies];
      const enriched = await Promise.all(
        casts.map(async (cast: CastType): Promise<CastType> => {
          const teamIds = await getTeamPreferences(cast.author.fid.toString());
          const teamBadgeUrl =
            teamIds?.[0] && teamIds[0].includes("-")
              ? `https://tjftzpjqfqnbtvodsigk.supabase.co/storage/v1/object/public/d33m_images/teams/leagues/${teamIds[0].replace("-", "/")}.png`
              : null;
  
          return {
            ...cast,
            teamBadgeUrl,
          };
        })
      );
  
      return enriched;
    } catch (err) {
      console.error("Failed to fetch conversation by hash:", err);
      return [];
    }
  };