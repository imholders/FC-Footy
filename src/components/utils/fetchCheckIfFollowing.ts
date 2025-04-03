export interface NeynarFollower {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

export interface NeynarFollowersResponse {
  users: NeynarFollower[];
  next: {
    cursor: string | null;
  };
}

export const fetchFollowers = async (
  fid: number,
  cursor: string | null = null
): Promise<NeynarFollowersResponse | null> => {
  const url = new URL('https://api.neynar.com/v2/farcaster/user/followers');
  url.searchParams.append('fid', fid.toString());
  if (cursor) url.searchParams.append('cursor', cursor);

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-neynar-experimental': 'true',
      'x-api-key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY || ''
    }
  };

  try {
    const res = await fetch(url.toString(), options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching followers:', err);
    return null;
  }
};

export const followUser = async (fid: number, viewerFid: number) => {
    const res = await fetch("https://api.neynar.com/v2/farcaster/user/follow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
      },
      body: JSON.stringify({
        fid: viewerFid,
        target_fid: fid,
      }),
    });
    return res.ok;
  };
  
export const unfollowUser = async (fid: number, viewerFid: number) => {
  const res = await fetch("https://api.neynar.com/v2/farcaster/user/unfollow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
    },
    body: JSON.stringify({
      fid: viewerFid,
      target_fid: fid,
    }),
  });
  return res.ok;
};

export const fetchCheckIfFollowing = async (
  viewerFid: number,
  targetFid: number
): Promise<boolean> => {
  const res = await fetchFollowers(viewerFid);
  if (!res) return false;
  return res.users.some((user) => user.fid === targetFid);
};

export async function fetchMutualFollowers(viewerFid: number, fanFids: number[]): Promise<Record<number, boolean>> {
  const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fanFids.join(",")}&viewer_fid=${viewerFid}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
    },
  });

  const data = await res.json();

  const result: Record<number, boolean> = {};
  for (const user of data.users) {
    result[user.fid] = user.viewer_context?.following || false;
  }

  return result;
}