import { getTeamPreferences } from "~/lib/kv";
import axios from "axios";
/* 
export const fetchCasts = async (channel?: string) => {
    const selectedChannel = channel ?? "football";
  
    if (selectedChannel.startsWith("match:")) {
      const hash = selectedChannel.split(":")[1];
      return await fetchCastByHash(hash);
    }
  
    const response = await axios.get("https://api.neynar.com/v2/farcaster/feed/channels", {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_NEYNAR_API_KEY!,
        "accept": "application/json",
      },
      params: {
        channel_ids: channel,
        with_recasts: false,
        with_replies: false,
        members_only: true,
        limit: 10,
      },
    });
  
    const enriched = await Promise.all(
      (response.data.casts || []).map(async (cast: any) => {
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
}; */
export interface CastType {
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
            identifier: '0x4ab7832ecd907494ddfce5802c0cec1c00430c5a',
            type: "hash",
            reply_depth: 1,
            include_chronological_parent_casts: false,
            viewer_fid: 4163,
            sort_type: "chron", // "desc_chron" | "chron" ??
            limit: 10,
          },
        }
      );
  
      const root = response.data?.conversation?.cast;
      const replies = root?.direct_replies ?? [];
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