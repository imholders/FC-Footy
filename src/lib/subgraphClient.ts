// This file will be used once you have deployed your subgraph
// For now, it's set up as a placeholder
// To use this file, you'll need to install Apollo Client:
// yarn add @apollo/client graphql

import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// Replace with your actual subgraph URL after deployment
const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/YOUR_GITHUB_USERNAME/fc-footy-subgraph';

export const subgraphClient = new ApolloClient({
  uri: SUBGRAPH_URL,
  cache: new InMemoryCache(),
});

// Example queries
export const GET_RECENT_GAMES = gql`
  query GetRecentGames($limit: Int = 10) {
    games(first: $limit, orderBy: createdAt, orderDirection: desc) {
      id
      gameId
      eventId
      squarePrice
      ticketsSold
      prizePool
      active
      winningSquares
      winnerPercentages
      prizeClaimed
      createdAt
    }
  }
`;

export const GET_GAME_BY_ID = gql`
  query GetGameById($id: ID!) {
    game(id: $id) {
      id
      gameId
      eventId
      deployer
      squarePrice
      referee
      deployerFeePercent
      ticketsSold
      prizePool
      active
      winningSquares
      winnerPercentages
      prizeClaimed
      refunded
      createdAt
      tickets {
        id
        buyer
        squareIndex
        purchasedAt
      }
    }
  }
`;

export const GET_USER_ACTIVITY = gql`
  query GetUserActivity($address: ID!) {
    user(id: $address) {
      id
      address
      totalSpent
      totalWon
      gamesDeployed {
        id
        eventId
        createdAt
      }
      ticketsPurchased {
        id
        game {
          id
          eventId
        }
        squareIndex
        purchasedAt
      }
    }
  }
`;

export const GET_GLOBAL_STATS = gql`
  query GetGlobalStats {
    globalStats(id: "global") {
      totalGames
      totalTicketsSold
      totalVolume
      totalPrizesClaimed
    }
  }
`;

// Example function to fetch recent games
export async function fetchRecentGames(limit = 10) {
  try {
    const { data } = await subgraphClient.query({
      query: GET_RECENT_GAMES,
      variables: { limit },
    });
    return data.games;
  } catch (error) {
    console.error('Error fetching recent games:', error);
    return [];
  }
}

// Example function to fetch a game by ID
export async function fetchGameById(id: string) {
  try {
    const { data } = await subgraphClient.query({
      query: GET_GAME_BY_ID,
      variables: { id },
    });
    return data.game;
  } catch (error) {
    console.error(`Error fetching game with ID ${id}:`, error);
    return null;
  }
}

// Example function to fetch user activity
export async function fetchUserActivity(address: string) {
  try {
    const { data } = await subgraphClient.query({
      query: GET_USER_ACTIVITY,
      variables: { address: address.toLowerCase() },
    });
    return data.user;
  } catch (error) {
    console.error(`Error fetching activity for user ${address}:`, error);
    return null;
  }
}

// Example function to fetch global stats
export async function fetchGlobalStats() {
  try {
    const { data } = await subgraphClient.query({
      query: GET_GLOBAL_STATS,
    });
    return data.globalStats;
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return null;
  }
} 