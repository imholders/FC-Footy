import { NextRequest } from 'next/server';
//import PinataClient from '@pinata/sdk';


export async function POST(request: NextRequest) {
  return new Response('Hello, world!',request);
}
/*
// Initialize Pinata SDK using JWT for authentication
const pinata = new PinataClient({
  jwt: process.env.PINATA_JWT, // Use JWT for authentication
});

// Edge function to handle the POST request
export async function POST(request: NextRequest) {
  try {
    // Validate the API key from the request headers
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.NEXT_PUBLIC_PINATA_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Parse the incoming JSON data
    const { data } = await request.json();

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: "No data provided" }),
        { status: 400 }
      );
    }

    // Pin the JSON data to Pinata
    const pinResult = await pinata.pinJSONToIPFS(data);

    // Return the CID of the pinned data
    return new Response(
      JSON.stringify({
        success: true,
        cid: pinResult.IpfsHash,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server Error" }),
      { status: 500 }
    );
  }
}
*/
// Specify that this should run on the Edge runtime
export const runtime = 'edge';