/* eslint-disable */
// Game data type from the blockchain response
// Game data type from the blockchain response
export interface Winner {
  address: any;
  percentage: number;
  squareIndex: number;
}

export interface Ticket {
  buyer: string;
  squareIndex: number;
  purchasedAt: string;
  id: string;
}

export interface GameData {
  gameId: number;
  referee: string;
  squarePrice: number;
  ticketsSold: number;
  prizePool: number;
  winningSquares?: number[];
  winnerPercentages?: number[];
  winners?: Winner[];
  tickets?: Ticket[]; // ✅ Add tickets array
  prizeClaimed: boolean;
  eventId: string;
  refunded: boolean;
  active: boolean;
  deployerFeePercent: number;
}
// Game status response type - this maps directly to the contract's `getGameStatus(uint256)` response
export interface GameStatusResponse {
  active: boolean;
  referee: string;
  squarePrice: bigint;
  ticketsSold: number;
  prizePool: bigint;
  winningSquares: number[];
  winnerPercentages: number[];
  prizeClaimed: boolean;
  eventId: string;
  refunded: boolean;
}

// Game state type - derived from `GameStatusResponse`
export type GameState = 'waiting for VAR' | 'active' | 'completed' | 'loading' | 'cancelled';

// User type for Privy authentication
export interface PrivyUser {
  id: string;
  linkedAccounts: Array<{
    type: string;
    [key: string]: unknown;
  }>;
  email?: {
    address: string;
    verified: boolean;
  };
  wallet?: {
    address: string;
  };
  farcaster?: {
    displayName?: string;
    username?: string;
    pfp?: string;
  };
}
