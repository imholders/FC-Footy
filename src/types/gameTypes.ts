/* eslint-disable */

export type Address = string;

// 🟩 Ticket buyer info
export interface Ticket {
  buyer: Address;
  squareIndex: number;
  purchasedAt: string;
  id: string;
}

// 🟩 Winner info from on-chain
export interface Winner {
  address: Address;
  percentage: number;
  squareIndex: number;
}

// 🟩 Game status response from contract
export interface GameStatusResponse {
  active: boolean;
  referee: Address;
  squarePrice: bigint;
  ticketsSold: number;
  prizePool: bigint;
  winningSquares: number[];
  winnerPercentages: number[];
  prizeClaimed: boolean;
  eventId: string;
  refunded: boolean;
}

// 🟩 Enriched local game object
export interface GameData {
  gameId: number;
  referee: Address;
  squarePrice: number;
  ticketsSold: number;
  prizePool: number;
  winningSquares?: number[];
  winnerPercentages?: number[];
  winners?: Winner[];
  tickets?: Ticket[];
  prizeClaimed: boolean;
  eventId: string;
  refunded: boolean;
  active: boolean;
  deployerFeePercent: number;
}

// 🟩 Status key derived from contract data
export type GameState = 'waiting for VAR' | 'active' | 'completed' | 'loading' | 'cancelled';

// 🟪 Farcaster / Privy integration
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
    address: Address;
  };
  farcaster?: {
    displayName?: string;
    username?: string;
    pfp?: string;
  };
}

// 🟦 Subgraph types
export interface SubgraphWinner {
  id: string;
  squareIndex: number;
  percentage: number;
  finalizedAt: string;
}

export interface SubgraphGame {
  id: string;
  gameId: string;
  eventId: string;
  deployer: Address;
  squarePrice: string;
  referee: Address;
  deployerFeePercent: number;
  ticketsSold: number;
  prizePool: string;
  prizeClaimed: boolean;
  refunded: boolean;
  createdAt: string;
  winners?: SubgraphWinner[];
}

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

export interface Detail {
  athletesInvolved: { displayName: string }[];
  type: string;
  clock: string;
  team: string;
}

export interface MatchEvent {
  id: string;
  shortName: string;
  name: string;
  date: string;
  status: {
    displayClock: string;
    type: {
      detail: string;
    };
  };
  competitions: {
    competitors: {
      team: {
        logo: string;
        id: string;
        abbreviation: string;
      };
      score: number;
    }[];
    details: Detail[];
  }[];
}

