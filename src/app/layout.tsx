import type { Metadata } from "next";
import { getSession } from "../auth";

import "~/app/globals.css";
import { Providers } from "~/app/providers";

export const metadata: Metadata = {
  title: "Farcaster Footy App",
  description: "Farcaster Footy App: Live Match Summaries, Fantasy League, Banter bot, Collectables & Contests",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession()

  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Import Bebas Neue */}
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
      <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
