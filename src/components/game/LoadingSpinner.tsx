import React, { useEffect } from 'react';
import { GameData } from '../../types/gameTypes';

interface LoadingSpinnerProps {
  gameDataState: GameData | null;
  loadingStartTime: number | null;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  gameDataState,
  loadingStartTime,
  setLoading,
  setError
}) => {
  // ✅ Automatically cancel loading after 10 seconds
  useEffect(() => {
    setLoading(true);
    return () => setLoading(false);
  }, [setLoading]);

  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-300">Loading game data...</p>
      <p className="mt-2 text-gray-400 text-sm">
        {gameDataState ? "Initializing game..." : "Fetching from blockchain..."}
      </p>

      {/* ✅ Allow users to cancel loading after 8 seconds */}
      {loadingStartTime && (Date.now() - loadingStartTime > 8000) && (
        <button 
          onClick={() => {
            setLoading(false);
            setError("Loading was cancelled. You can try refreshing the game data.");
          }} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Cancel Loading
        </button>
      )}
    </div>
  );
};

export default LoadingSpinner;
