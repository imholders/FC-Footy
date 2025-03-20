import React from 'react';

interface NoGameDataProps {
  refreshGameData: () => void;
}

const NoGameData: React.FC<NoGameDataProps> = ({
  refreshGameData
}) => {
  return (
    <div className="bg-yellow-900/30 p-6 rounded-xl border border-yellow-700/50 text-yellow-300">
      <h3 className="text-xl font-bold mb-2">No Game Data</h3>
      <p>Unable to load game data. This could be due to network issues or the game may not exist.</p>
      <button 
        onClick={refreshGameData} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Retry Loading
      </button>
    </div>
  );
};

export default NoGameData; 