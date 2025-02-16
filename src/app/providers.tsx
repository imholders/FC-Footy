"use client";

import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base, optimism } from "wagmi/chains";
import { frameConnector } from "~/lib/connector";
import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"

// Dynamically import PrivyProvider 
const PrivyProvider = dynamic(
  () => import("~/components/providers/PrivyProvider"),
  {
    ssr: false,
  }
);

export const config = createConfig({
  chains: [base, optimism],
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
  },
  connectors: [frameConnector()],
});

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider session={session}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
            <PrivyProvider>{children}</PrivyProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
