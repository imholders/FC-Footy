'use client';

import React from 'react';
import { useGames } from '../hooks/useSubgraphData';
import { formatEther } from 'viem';
import { parseEventId } from '../utils/eventIdParser';
import { getTeamLogo, getLeagueCode } from './utils/fetchTeamLogos';
import Image from 'next/image';
import FarcasterAvatar from './FarcasterAvatar';
import WinnerDisplay from './WinnerDisplay';

interface SubgraphWinner {
  id: string;
  squareIndex: number;
  percentage: number;
  finalizedAt: string;
}

interface SubgraphTicket {
  id: string;
  buyer: string;
  squareIndex: number;
  purchasedAt: string;
}

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
  winners?: SubgraphWinner[];
  tickets?: SubgraphTicket[];
}

const CompletedGamesBrowser: React.FC = () => {
  const { data, loading, error } = useGames(100, 0);
  const completedGames = data?.games
    ? data.games
        .filter((g: SubgraphGame) => g.prizeClaimed || g.refunded)
        .sort((a: { createdAt: string }, b: { createdAt: string }) => parseInt(b.createdAt) - parseInt(a.createdAt))
    : [];

  if (loading) return <div className="p-4 text-gray-400">Loading completed games...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="p-4 flex flex-col gap-4 items-center">
      {completedGames.map((game: SubgraphGame) => {
        const eventDetails = parseEventId(game.eventId);
        const hasWinners = game.winners && game.winners.length > 0;
  
        return (
          <div
            key={game.id}
            className="w-full max-w-md bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-limeGreenOpacity transition-colors cursor-pointer flex flex-col justify-between"
            >
            <div className="flex justify-between items-start">
              <div>
                {eventDetails ? (
                  <div className="flex items-center gap-1">
                    <Image
                      src={getTeamLogo(eventDetails.homeTeam, getLeagueCode(eventDetails.leagueId))}
                      alt={eventDetails.homeTeam}
                      width={20}
                      height={20}
                      className="object-contain"
                      onError={(e) => (e.currentTarget.src = '/assets/defifa_spinner.gif')}
                    />
                    <span className="font-bold text-notWhite text-sm">{eventDetails.homeTeam}</span>
                    <span className="mx-1 text-lightPurple text-xs">v</span>
                    <span className="font-bold text-notWhite text-sm">{eventDetails.awayTeam}</span>
                    <Image
                      src={getTeamLogo(eventDetails.awayTeam, getLeagueCode(eventDetails.leagueId))}
                      alt={eventDetails.awayTeam}
                      width={20}
                      height={20}
                      className="object-contain"
                      onError={(e) => (e.currentTarget.src = '/assets/defifa_spinner.gif')}
                    />
                  </div>
                ) : (
                  <span className="text-notWhite text-xs">{game.eventId}</span>
                )}
                {eventDetails && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-900 text-blue-200 rounded-full text-[10px]">
                      {eventDetails.league}
                    </span>
                    <span className="text-lightPurple text-xs flex items-center gap-1">
                      REF:
                      <FarcasterAvatar address={game.referee} size={16} className="rounded-full" />
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-[11px] text-lightPurple">PRIZE POOL</div>
                <div className="text-base font-semibold text-limeGreenOpacity">
                  {(() => {
                    const squarePriceEth = parseFloat(formatEther(BigInt(game.squarePrice)));
                    const fullPool = squarePriceEth * 25;
                    const totalFeePercent = (game.deployerFeePercent || 0) + 5;
                    const finalPool = fullPool * (1 - totalFeePercent / 100);
                    return `${finalPool.toFixed(4)} ETH`;
                  })()}
                </div>
              </div>
            </div>

            <div>
              {game.refunded ? (
                <div className="bg-red-900 bg-opacity-40 px-2 py-1 rounded text-[11px] text-red-200">
                  <strong>⚠️ Refunded:</strong> Not all squares filled.
                </div>
              ) : hasWinners ? (
                <div className="px-2 py-1 rounded text-sm text-limeGreenOpacity">
                  <p className="font-semibold text-notWhite text-[13px] mb-1">🏆 Winners</p>
                  <div className="space-y-1">
                    {game.winners?.map((winner: SubgraphWinner) => (
                      <WinnerDisplay
                        key={winner.id}
                        winner={winner}
                        tickets={game.tickets || []}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-900 bg-opacity-40 px-2 py-1 rounded text-[11px] text-yellow-200">
                  ⏳ Finalized, no winners.
                </div>
              )}
            </div>

            <div className="text-[10px] text-gray-500 truncate">ID: {game.eventId}</div>
          </div>
        );
      })}
    </div>
  );
};

export default CompletedGamesBrowser;
