import React from 'react';
import { useGames, useGameStats } from '../hooks/useSubgraphData';
import { formatEther } from 'viem';

// Define the type for a game from the subgraph
interface SubgraphGame {
  id: string;
  gameId: string;
  eventId: string;
  deployer: string;
  squarePrice: string;
  referee: string;
  deployerFeePercent: number;
  ticketsSold: number;
  prizePool: string;
  prizeClaimed: boolean;
  refunded: boolean;
  createdAt: string;
}

/**
 * SubgraphGamesList - A component that demonstrates how to use the subgraph data
 * 
 * This component fetches and displays a list of games from the subgraph.
 * It also shows overall statistics about the games.
 */
const SubgraphGamesList: React.FC = () => {
  // Fetch games from the subgraph
  const { data: gamesData, loading: gamesLoading, error: gamesError } = useGames();
  
  // Fetch overall statistics from the subgraph
  const { data: statsData, loading: statsLoading, error: statsError } = useGameStats();

  // Handle loading state
  if (gamesLoading || statsLoading) {
    return <div className="p-4">Loading games from the blockchain...</div>;
  }

  // Handle error state
  if (gamesError || statsError) {
    return (
      <div className="p-4 text-red-500">
        Error loading games: {gamesError?.message || statsError?.message}
      </div>
    );
  }

  // Handle no games state
  if (!gamesData?.games || gamesData.games.length === 0) {
    return <div className="p-4">No games found.</div>;
  }

  return (
    <div className="p-4">
      {/* Display overall statistics */}
      {statsData?.gameStat && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Overall Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Games</p>
              <p className="text-lg font-semibold">{statsData.gameStat.totalGames.toString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Tickets Sold</p>
              <p className="text-lg font-semibold">{statsData.gameStat.totalTicketsSold.toString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Prize Pool</p>
              <p className="text-lg font-semibold">{formatEther(BigInt(statsData.gameStat.totalPrizePool))} ETH</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Game Created</p>
              <p className="text-lg font-semibold">
                {new Date(parseInt(statsData.gameStat.lastGameCreatedAt) * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Display games list */}
      <h2 className="text-xl font-bold mb-4">Recent Games</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {gamesData.games.map((game: SubgraphGame) => (
          <div key={game.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg mb-2">{game.eventId}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Game ID</p>
                <p>{game.gameId}</p>
              </div>
              <div>
                <p className="text-gray-500">Square Price</p>
                <p>{formatEther(BigInt(game.squarePrice))} ETH</p>
              </div>
              <div>
                <p className="text-gray-500">Tickets Sold</p>
                <p>{game.ticketsSold} / 100</p>
              </div>
              <div>
                <p className="text-gray-500">Prize Pool</p>
                <p>{formatEther(BigInt(game.prizePool))} ETH</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p>{game.prizeClaimed ? 'Completed' : 'Active'}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p>{new Date(parseInt(game.createdAt) * 1000).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubgraphGamesList; 