import React from 'react';

interface NoGameDataProps {
  refreshGameData: () => void;
  message?: string;
  contractAddress?: string;
  gameId?: number;
  hideRetryButton?: boolean;
}

const NoGameData: React.FC<NoGameDataProps> = ({
  refreshGameData,
  message = "Unable to load game data. This could be due to network issues or the game was created in a different app using a different eventId format or it may not exist.",
  contractAddress,
  gameId,
  hideRetryButton = false
}) => {
  return (
    <div className="bg-yellow-900/30 p-6 rounded-xl border border-yellow-700/50 text-yellow-300">
      <h3 className="text-xl font-bold mb-2">No Game Data</h3>
      <p className="mb-2">{message}</p>

      {contractAddress && (
        <p className="text-sm mb-2">
          View on&nbsp;
          <a
            href={`https://basescan.org/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            BaseScan
          </a>
          {gameId !== undefined && ` · gameId: ${gameId}`}
        </p>
      )}

      {!hideRetryButton && (
        <button
          onClick={refreshGameData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Retry Loading
        </button>
      )}
    </div>
  );
};

export default NoGameData;
