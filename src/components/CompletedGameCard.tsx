'use client';

import React from 'react';
import { useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { getTeamLogo, getLeagueCode } from './utils/fetchTeamLogos';
import { parseEventId } from '../utils/eventIdParser';
import WinnerDisplay from './WinnerDisplay';
import FarcasterAvatar from './FarcasterAvatar';
import Image from 'next/image';
import { SCORE_SQUARE_ADDRESS } from '../lib/config';

import type { SubgraphGame, SubgraphWinner } from '../types/gameTypes';

const SCORE_SQUARE_ABI = [
  {
    name: 'getAllTickets',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      { name: 'ticketNumbers', type: 'uint8[]' },
      { name: 'owners', type: 'address[]' },
    ],
  },
];

const CompletedGameCard: React.FC<{ game: SubgraphGame }> = ({ game }) => {
  const eventDetails = parseEventId(game.eventId);
  const hasWinners = game.winners && game.winners.length > 0;

  const { data: onChainTickets } = useContractRead({
    address: SCORE_SQUARE_ADDRESS as `0x${string}`,
    abi: SCORE_SQUARE_ABI,
    functionName: 'getAllTickets',
    args: [BigInt(game.gameId)],
    chainId: 8453,
  });

  const derivedPlayers = Array(25).fill(null);
  if (Array.isArray(onChainTickets) && onChainTickets.length === 2) {
    const [indexes, owners] = onChainTickets as [number[], string[]];
    indexes.forEach((idx, i) => {
      derivedPlayers[idx] = owners[i] || null;
    });
  }

  return (
    <div className="w-full max-w-md bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-limeGreenOpacity transition-colors cursor-pointer flex flex-col justify-between">
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
                  address={derivedPlayers[winner.squareIndex] || undefined}
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
};

export default CompletedGameCard;