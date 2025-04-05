import {BASE_URL} from '../../../lib/config';
export async function GET() {
  const appUrl = BASE_URL || 'https://fc-footy.vercel.app';
  const header = process.env.NEXT_PUBLIC_HEADER;
  const payload = process.env.NEXT_PUBLIC_PAYLOAD;
  const signature = process.env.NEXT_PUBLIC_SIGNATURE;

  const config = {
    "accountAssociation": {
      "header": header,
      "payload": payload,
      "signature": signature
    },
    frame: {
      version: "0.0.1",
      name: "Footy App",
      iconUrl: `${appUrl}/512.png`,
      splashImageUrl: `${appUrl}/defifa_spinner.gif`,
      splashBackgroundColor: "#010513",
      homeUrl: appUrl,
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}

export const runtime = 'edge';