interface PinataUserData {
  type: string;
  value: string;
}

interface PinataData {
  userDataBody?: PinataUserData;
}

interface PinataMessage {
  data: PinataData;
  // You can add other fields if needed.
}

interface PinataResponse {
  messages: PinataMessage[];
  nextPageToken?: string;
}

/**
 * Fetch the farcaster profile picture (pfp) for a fan using their fid.
 * This calls the Pinata endpoint and looks for the USER_DATA_TYPE_PFP message.
 *
 * @param fanFid - The fan's fid.
 * @returns The pfp URL if found, otherwise null.
 */
export async function fetchFanPfp(fanFid: number): Promise<string | null> {
  try {
    const response = await fetch(`https://hub.pinata.cloud/v1/userDataByFid?fid=${fanFid}`);
    const data: PinataResponse = await response.json();
    if (data.messages && data.messages.length > 0) {
      const pfpMessage = data.messages.find(
        (msg) => msg.data.userDataBody?.type === "USER_DATA_TYPE_PFP"
      );
      if (pfpMessage && pfpMessage.data.userDataBody?.value) {
        return pfpMessage.data.userDataBody.value;
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching fan pfp for fid:", fanFid, error);
    return null;
  }
}
