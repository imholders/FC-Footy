import React from 'react';
import { GameProvider } from '../context/GameContext';
import BlockchainScoreSquareDisplayWrapped from './BlockchainScoreSquareDisplayWrapped';

interface BlockchainScoreSquareDisplayProps {
  eventId: string;
}

const BlockchainScoreSquareDisplay: React.FC<BlockchainScoreSquareDisplayProps> = ({ eventId }) => {
  return (
    <GameProvider eventId={eventId}>
      <BlockchainScoreSquareDisplayWrapped eventId={eventId} />
    </GameProvider>
  );
};

export default BlockchainScoreSquareDisplay;
