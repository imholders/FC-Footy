'use client';

import { PrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId="cm65szfzb040lo63kwt7dnyxm"
      config={{
        embeddedWallets: {
          createOnLogin: "all-users",
        },
        appearance: {
          walletList: ["detected_wallets"],
          theme: 'light',
          accentColor: '#676FFF',
          logo: 'defifa_spinner.gif',
        },
      }}
    >
      <SmartWalletsProvider>{children}</SmartWalletsProvider>
    </PrivyProvider>
  );
}