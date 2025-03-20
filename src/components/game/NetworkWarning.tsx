import React from 'react';

interface NetworkWarningProps {
  isCorrectNetwork: boolean;
  authenticated: boolean;
  currentNetwork: string;
  isNetworkSwitching: boolean;
  handleSwitchToBase: () => void;
  handleSwitchToBaseSepolia: () => void;
}

const NetworkWarning: React.FC<NetworkWarningProps> = ({
  isCorrectNetwork,
  authenticated,
  currentNetwork,
  isNetworkSwitching,
  handleSwitchToBase,
  handleSwitchToBaseSepolia
}) => {
  if (!authenticated || isCorrectNetwork) {
    return null;
  }
  
  return (
    <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
      <h3 className="font-bold text-lg mb-2">Wrong Network Detected</h3>
      <p className="mb-2">Score Square requires the Base or Base Sepolia network. Please switch your network:</p>
      <p className="mb-3 text-sm">Current network: <span className="font-semibold">{currentNetwork}</span></p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSwitchToBase}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isNetworkSwitching}
        >
          {isNetworkSwitching ? 'Switching...' : 'Switch to Base'}
        </button>
        <button
          onClick={handleSwitchToBaseSepolia}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          disabled={isNetworkSwitching}
        >
          {isNetworkSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
        </button>
      </div>
    </div>
  );
};

export default NetworkWarning; 