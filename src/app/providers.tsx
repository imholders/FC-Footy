"use client";

import dynamic from "next/dynamic";
// testing privy and wagmi but keeping fucntion name wagmi for now
const WagmiProvider = dynamic(
  () => import("~/components/providers/PrivyProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return <WagmiProvider>{children}</WagmiProvider>;
}
