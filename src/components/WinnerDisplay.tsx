'use client';

import React from 'react';
import FarcasterAvatar from './FarcasterAvatar';
import { formatAddress } from '../utils/formatters';

interface Winner {
  id: string;
  squareIndex: number;
  percentage: number;
  finalizedAt: string;
}

interface WinnerDisplayProps {
  winner: Winner;
  className?: string;
}

/**
 * WinnerDisplay - A component that displays a winner's information
 */
const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ 
  winner,
  className = ''
}) => {
  // Extract the address from the winner ID (format: "gameId-address")
  const address = winner.id.split('-')[1];

  return (
    <div className={`flex items-center mb-1 ${className}`}>
      <div className="w-5 h-5 mr-1">
        <FarcasterAvatar address={address} size={20} />
      </div>
      <span>
        {formatAddress(address)}: {winner.percentage}%
      </span>
    </div>
  );
};

export default WinnerDisplay; 