/* eslint-disable */

import { useReadContract } from 'wagmi';
import { SCORE_SQUARE_ADDRESS, SCORE_SQUARE_ABI } from '../constants/contracts';

/**
 * Custom hook to fetch the referee information from the blockchain
 * This ensures we always get the most up-to-date referee information directly from the contract
 * @param gameId The ID of the game to fetch the referee for
 * @returns An object containing the referee address and loading/error states
 */
export function useGameReferee(gameId: string | bigint | undefined) {
  // Convert string gameId to bigint if needed
  const parsedGameId = typeof gameId === 'string' ? BigInt(gameId) : gameId;
  
  // Use the useReadContract hook to get game status
  const { data: gameStatusData, isError, isLoading, refetch } = useReadContract({
    address: SCORE_SQUARE_ADDRESS as `0x${string}`,
    abi: SCORE_SQUARE_ABI,
    functionName: 'getGameStatus',
    args: parsedGameId ? [parsedGameId] : undefined,
    query: {
      enabled: !!parsedGameId
    }
  });

  // Extract the referee from the game status data
  let referee: string | undefined;
  
  if (gameStatusData) {
    if (Array.isArray(gameStatusData) && gameStatusData.length > 1) {
      referee = gameStatusData[1] as string;
    } else if (typeof gameStatusData === 'object' && 'referee' in gameStatusData) {
      referee = (gameStatusData as any).referee;
    }
  }

  return {
    referee,
    isLoading,
    isError,
    refetch
  };
} 