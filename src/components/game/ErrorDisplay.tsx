import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  hasValidEventId: boolean;
  refreshGameData: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  hasValidEventId,
  refreshGameData
}) => {
  if (!error) {
    return null;
  }
  
  return (
    <div className="bg-red-900/30 p-6 rounded-xl border border-red-700/50 text-red-300">
      <h3 className="text-xl font-bold mb-2">Error</h3>
      <p>{error}</p>
      {!hasValidEventId && (
        <p className="mt-4">No valid event ID was provided. Cannot load game data.</p>
      )}
      <button 
        onClick={refreshGameData} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Retry Loading
      </button>
    </div>
  );
};

export default ErrorDisplay; 