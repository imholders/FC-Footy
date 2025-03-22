/**
 * Utility functions for fetching Farcaster profile data using the Neynar API
 */
// Remove the Node.js SDK import
// import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: {
    url: string;
  };
  profile: {
    bio: {
      text: string;
    };
  };
  followerCount: number;
  followingCount: number;
  activeStatus: string;
  verifications: string[];
}

/**
 * Fetch Farcaster profile data for an Ethereum address
 * 
 * @param address - The Ethereum address to look up
 * @returns The Farcaster user data or null if not found
 */
export async function fetchFarcasterProfileByAddress(address: string): Promise<FarcasterUser | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || '';
    if (!apiKey) {
      return null;
    }

    // Normalize the address to lowercase
    const normalizedAddress = address.toLowerCase();
    
    // Use the correct endpoint with address_types parameter
    const endpoint = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${normalizedAddress}&address_types=ethereum`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': apiKey
        }
      });
      
      if (!response.ok) {
        return null;
      }
      
      const responseData = await response.json();
      // console.log('Response data:', responseData);
      // The response is an object with the address as the key and an array of users as the value
      if (!responseData || Object.keys(responseData).length === 0) {
        return null;
      }
      
      // Get the first user from the response
      const users = responseData[normalizedAddress];
      if (!users || users.length === 0) {
        return null;
      }
      
      const userData = users[0];
      
      // Create a result object with the data we have
      const result: FarcasterUser = {
        fid: userData.fid,
        username: userData.username || '',
        displayName: userData.display_name || '',
        pfp: {
          url: userData.pfp_url || ''
        },
        profile: {
          bio: {
            text: userData.profile?.bio?.text || ''
          }
        },
        followerCount: userData.follower_count || 0,
        followingCount: userData.following_count || 0,
        activeStatus: 'active',
        verifications: userData.verifications || []
      };
      // console.log('Returning result:', result);
      return result;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Get a default profile picture URL for addresses without Farcaster profiles
 * 
 * @returns A URL to the default avatar
 */
export function getDefaultProfilePicture(): string {
  // Use the defifa_spinner.gif as the default avatar
  return '/defifa_spinner.gif';
} 