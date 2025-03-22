'use client';

import React from 'react';
import { useGameReferee } from '../hooks/useGameReferee';
import FarcasterAvatar from './FarcasterAvatar';
import { formatAddress } from '../utils/formatters';

interface RefereeDisplayProps {
  gameId: string;
  fallbackReferee: string;
  size?: number;
  className?: string;
}

/**
 * RefereeDisplay - A component that displays the referee information from the blockchain
 * Falls back to the provided fallbackReferee if the blockchain data is not available
 */
const RefereeDisplay: React.FC<RefereeDisplayProps> = ({ 
  gameId, 
  fallbackReferee,
  size = 20,
  className = ''
}) => {
  // Use the useGameReferee hook to get the referee from the blockchain
  const { referee: onchainReferee, isLoading } = useGameReferee(gameId);
  
  // Use the onchain referee if available, otherwise fall back to the provided fallback
  const refereeAddress = onchainReferee || fallbackReferee;

  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-5 h-5 mr-1">
        {isLoading ? (
          <div className="w-5 h-5 rounded-full bg-gray-600 animate-pulse"></div>
        ) : (
          <FarcasterAvatar address={refereeAddress} size={size} />
        )}
      </div>
      <span className="text-sm text-fontRed">
        {formatAddress(refereeAddress)}
      </span>
    </div>
  );
};

export default RefereeDisplay; 