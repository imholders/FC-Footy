import { useQuery } from '@apollo/client';
import { 
  GET_GAMES, 
  GET_GAME_BY_ID, 
  GET_GAME_BY_EVENT_ID, 
  GET_GAME_STATS,
  SEARCH_GAMES
} from '../lib/graphql/queries';

// Hook to get all games
export function useGames(first = 10, skip = 0) {
  return useQuery(GET_GAMES, {
    variables: { first, skip },
    notifyOnNetworkStatusChange: true,
  });
}

// Hook to get a specific game by ID
export function useGameById(id: string) {
  return useQuery(GET_GAME_BY_ID, {
    variables: { id },
    skip: !id,
    notifyOnNetworkStatusChange: true,
  });
}

// Hook to get a game by event ID
export function useGameByEventId(eventId: string) {
  return useQuery(GET_GAME_BY_EVENT_ID, {
    variables: { eventId },
    skip: !eventId,
    notifyOnNetworkStatusChange: true,
  });
}

// Hook to get overall statistics
export function useGameStats() {
  return useQuery(GET_GAME_STATS, {
    notifyOnNetworkStatusChange: true,
  });
}

// Hook to search for games
export function useSearchGames(searchTerm: string) {
  return useQuery(SEARCH_GAMES, {
    variables: { searchTerm },
    skip: !searchTerm,
    notifyOnNetworkStatusChange: true,
  });
} 