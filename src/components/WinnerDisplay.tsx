'use client';

import React from 'react';
import FarcasterAvatar from './FarcasterAvatar';
import { formatAddress } from '../utils/formatters';

interface Winner {
  squareIndex: number;
  percentage: number;
}

interface WinnerDisplayProps {
  winner: Winner;
  address?: string;
  className?: string;
}

/**
 * WinnerDisplay - Displays a winner's score, percentage, and Farcaster info.
 */
const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ 
  winner,
  address = '0x0000000000000000000000000000000000000000',
  className = ''
}) => {
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
