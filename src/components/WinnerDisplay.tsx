'use client';

import React from 'react';
import FarcasterAvatar from './FarcasterAvatar';
import { formatAddress } from '../utils/formatters';

// Types
interface SubgraphTicket {
  id: string;
  buyer: string;
  squareIndex: number;
  purchasedAt: string;
}

interface Winner {
  id: string;
  squareIndex: number;
  percentage: number;
  finalizedAt: string;
}

interface WinnerDisplayProps {
  winner: Winner;
  tickets: SubgraphTicket[];
  className?: string;
}

/**
 * WinnerDisplay - A component that displays a winner's information
 */
const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ 
  winner,
  tickets,
  className = ''
}) => {
  const ticket = tickets.find(t => t.squareIndex === winner.squareIndex);
  const address = ticket?.buyer || '0x0000000000000000000000000000000000000000';

  const home = Math.floor(winner.squareIndex / 5);
  const away = winner.squareIndex % 5;
  const formattedScore = `${home}-${away === 4 ? '4+' : away}`;

  return (
    <div className={`flex items-center text-sm text-notWhite gap-2 ${className}`}>
      <FarcasterAvatar address={address} size={20} showName fallbackName={formatAddress(address)} />
      <span className="text-lime-400">{formattedScore}</span>
      <span className="text-lime-400">{winner.percentage}%</span>
    </div>
  );
};

export default WinnerDisplay;
