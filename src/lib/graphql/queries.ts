import { gql } from '@apollo/client';

// Query to get all games
export const GET_GAMES = gql`
  query GetGames($first: Int = 10, $skip: Int = 0) {
    games(
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
      where: { refunded: false }
    ) {
      id
      gameId
      eventId
      deployer
      squarePrice
      referee
      deployerFeePercent
      ticketsSold
      prizePool
      prizeClaimed
      refunded
      createdAt
      winners {
        id
        squareIndex
        percentage
        finalizedAt
      }
      tickets {
        id
        buyer
        squareIndex
        purchasedAt
      }
    }
  }
`;

// Query to get a specific game by ID
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
      prizeClaimed
      refunded
      createdAt
      tickets {
        id
        buyer
        squareIndex
        purchasedAt
      }
      winners {
        id
        squareIndex
        percentage
        finalizedAt
      }
    }
  }
`;

// Query to get a game by event ID
export const GET_GAME_BY_EVENT_ID = gql`
  query GetGameByEventId($eventId: String!) {
    games(where: { eventId: $eventId }) {
    id
    gameId
    eventId
    deployer
    squarePrice
    referee
    deployerFeePercent
    ticketsSold
    prizePool
    prizeClaimed
    refunded
    createdAt
    tickets {
      buyer
      squareIndex
      purchasedAt
      id
    }
    winnerPercentages
    winningSquares
    winners {
      percentage
      squareIndex
    }
  }
}
`;

// Query to get overall statistics
export const GET_GAME_STATS = gql`
  query GetGameStats {
    gameStat(id: "1") {
      totalGames
      totalTicketsSold
      totalPrizePool
      lastGameCreatedAt
    }
  }
`;

// Query to search for games
export const SEARCH_GAMES = gql`
  query SearchGames($searchTerm: String!) {
    games(where: { eventId_contains: $searchTerm }, orderBy: createdAt, orderDirection: desc) {
      id
      gameId
      eventId
      deployer
      squarePrice
      referee
      deployerFeePercent
      ticketsSold
      prizePool
      prizeClaimed
      refunded
      createdAt
    }
  }
`;

// Query to get Score Square games by prefix
export const GET_SS_GAMES = gql`
  query GetSSGames($prefix: String!, $ticketsSold: Int = 25) {
    games(
      where: {
        refunded: false
        prizeClaimed: false
        ticketsSold_lt: $ticketsSold
        eventId_contains: $prefix
      }
      orderBy: createdAt
      orderDirection: desc
    ) {
      gameId
      eventId
      referee
      squarePrice
      deployerFeePercent
    }
  }
`;