'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { base, degen, mainnet, optimism } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
//import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import PrivyProvider  from '../components/providers/PrivyProvider';
import { frameConnector } from '~/lib/connector';
import { Session } from 'next-auth'; // Correct import
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '../lib/apollo-client';

/**
 * 1. Configure chains and clients for Wagmi.
 *    - We define our chains and transport (RPC) methods here.
 *    - We also define our connectors, e.g. farcasterFrame().
 */
export const config = createConfig({
  // The chains we want to support
  chains: [base, optimism, mainnet, degen],
  // The HTTP transport for each chain
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
    [mainnet.id]: http(),
    [degen.id]: http(),
  },
  // The connector(s) we want to use
  connectors: [frameConnector()],
});

/**
 * 2. Create a single QueryClient instance for React Query.
 */

/**
 * 3. Wrap everything in Providers:
 *    - <SessionProvider> for NextAuth
 *    - <WagmiProvider> for Wagmi (with our config)
 *    - <QueryClientProvider> for React Query
 *    - <ApolloProvider> for GraphQL queries to our subgraph
 *    - <PrivyProvider> for Privy Auth
 */
export function Providers({
  session,
  children,
}: {
  session?: Session;   // or `session?: Session` if you import the Session type
  children: React.ReactNode;
}) {
  const [queryClient] = React.useState(() => new QueryClient ());
  return (
    <SessionProvider session={session}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ApolloProvider client={apolloClient}>
            <PrivyProvider>
              {children}
            </PrivyProvider>
          </ApolloProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
