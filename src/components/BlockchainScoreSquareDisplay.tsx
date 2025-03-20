import React from 'react';
import { GameProvider } from '../context/GameContext';
import ActualBlockchainScoreSquareDisplay from './ActualBlockchainScoreSquareDisplay';

interface BlockchainScoreSquareDisplayProps {
  eventId: string;
}

const BlockchainScoreSquareDisplay: React.FC<BlockchainScoreSquareDisplayProps> = ({ eventId }) => {
  return (
    <GameProvider eventId={eventId}>
      <ActualBlockchainScoreSquareDisplay eventId={eventId} />
    </GameProvider>
  );
};

export default BlockchainScoreSquareDisplay;
