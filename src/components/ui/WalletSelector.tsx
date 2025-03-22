import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Base Mainnet and Base Sepolia chain IDs
const BASE_CHAIN_ID = 8453;
const BASE_SEPOLIA_CHAIN_ID = 84532;

interface WalletSelectorProps {
  onWalletChange?: (address: string) => void;
  showBalance?: boolean;
  showNetworkSwitcher?: boolean;
}

/**
 * WalletSelector - A component for selecting and managing wallets
 * 
 * This component allows users to:
 * - See their connected wallet
 * - Switch between wallets
 * - Connect a wallet if none is connected
 * - Switch networks (optional)
 * - View wallet balance (optional)
 */
const WalletSelector: React.FC<WalletSelectorProps> = ({
  onWalletChange,
  showBalance = true,
  showNetworkSwitcher = true
}) => {
  const { login, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  
  const [selectedWalletIndex, setSelectedWalletIndex] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<string>('');
  const [isNetworkSwitching, setIsNetworkSwitching] = useState<boolean>(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>('Unknown');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  
  // Check if user is on the correct network
  useEffect(() => {
    const checkNetwork = async () => {
      if (authenticated && wallets.length > 0) {
        try {
          const activeWallet = wallets[selectedWalletIndex]; // Get the selected wallet
          const chainId = activeWallet.chainId;
          // CAIP-2 chain IDs are in the format 'eip155:chainId'
          const numericChainId = parseInt(chainId.split(':')[1]);
          
          setIsCorrectNetwork(
            numericChainId === BASE_CHAIN_ID || numericChainId === BASE_SEPOLIA_CHAIN_ID
          );
          
          // Set current network name
          if (numericChainId === BASE_CHAIN_ID) {
            setCurrentNetwork('Base');
          } else if (numericChainId === BASE_SEPOLIA_CHAIN_ID) {
            setCurrentNetwork('Base Sepolia');
          } else {
            setCurrentNetwork(`Chain ID: ${numericChainId}`);
          }
        } catch (error) {
          console.error("Error checking network:", error);
          setIsCorrectNetwork(false);
          setCurrentNetwork('Unknown');
        }
      } else {
        setIsCorrectNetwork(false);
        setCurrentNetwork('Not Connected');
      }
    };

    checkNetwork();
    
    // Check periodically for network changes
    const intervalId = setInterval(checkNetwork, 2000);
    return () => clearInterval(intervalId);
  }, [authenticated, wallets, selectedWalletIndex]);
  
  // Get wallet balance
  useEffect(() => {
    const getBalance = async () => {
      if (authenticated && wallets.length > 0) {
        try {
          const activeWallet = wallets[selectedWalletIndex];
          const provider = await activeWallet.getEthereumProvider();
          const balanceResult = await provider.request({
            method: 'eth_getBalance',
            params: [activeWallet.address, 'latest']
          });
          
          // Format the balance
          const balanceStr = balanceResult as string;
          const formattedBalance = (Number(balanceStr) / 10 ** 18).toFixed(4);
          setWalletBalance(formattedBalance);
        } catch (error) {
          console.error("Error getting balance:", error);
          setWalletBalance('Error');
        }
      } else {
        setWalletBalance('');
      }
    };
    
    if (showBalance) {
      getBalance();
    }
  }, [authenticated, wallets, selectedWalletIndex, showBalance]);
  
  // Notify parent component when wallet changes
  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      const activeWallet = wallets[selectedWalletIndex];
      onWalletChange?.(activeWallet.address);
    }
  }, [authenticated, wallets, selectedWalletIndex, onWalletChange]);
  
  // Function to switch to Base network
  const handleSwitchToBase = async () => {
    if (wallets.length > 0) {
      try {
        setIsNetworkSwitching(true);
        const activeWallet = wallets[selectedWalletIndex];
        await activeWallet.switchChain(BASE_CHAIN_ID);
        setCurrentNetwork('Base');
      } catch (error) {
        console.error('Error switching to Base network:', error);
      } finally {
        setIsNetworkSwitching(false);
      }
    } else {
      alert('No wallet connected. Please connect your wallet first.');
    }
  };
  
  // Function to switch to Base Sepolia network
  const handleSwitchToBaseSepolia = async () => {
    if (wallets.length > 0) {
      try {
        setIsNetworkSwitching(true);
        const activeWallet = wallets[selectedWalletIndex];
        await activeWallet.switchChain(BASE_SEPOLIA_CHAIN_ID);
        setCurrentNetwork('Base Sepolia');
      } catch (error) {
        console.error('Error switching to Base Sepolia network:', error);
      } finally {
        setIsNetworkSwitching(false);
      }
    } else {
      alert('No wallet connected. Please connect your wallet first.');
    }
  };
  
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Handle wallet selection
  const handleWalletSelect = (index: number) => {
    setSelectedWalletIndex(index);
    setIsDropdownOpen(false);
  };
  
  return (
    <div className="relative">
      {authenticated ? (
        <div className="flex flex-col">
          {/* Wallet selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 bg-purplePanel border border-limeGreenOpacity rounded-md text-lightPurple hover:bg-opacity-90"
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>
                  {wallets.length > 0 
                    ? formatAddress(wallets[selectedWalletIndex].address)
                    : 'No wallet connected'}
                </span>
              </div>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-purplePanel border border-limeGreenOpacity rounded-md shadow-lg z-10">
                {wallets.map((wallet, index) => (
                  <button
                    key={wallet.address}
                    onClick={() => handleWalletSelect(index)}
                    className={`w-full px-3 py-2 text-left hover:bg-opacity-90 ${
                      index === selectedWalletIndex 
                        ? 'bg-darkPurple text-lightPurple' 
                        : 'text-gray-300'
                    }`}
                  >
                    {formatAddress(wallet.address)}
                    {wallet.walletClientType === 'privy' && (
                      <span className="ml-2 text-xs text-gray-400">(Embedded)</span>
                    )}
                  </button>
                ))}
                <div className="border-t border-limeGreenOpacity my-1"></div>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full px-3 py-2 text-left text-red-400 hover:bg-opacity-90"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
          
          {/* Network and balance info */}
          <div className="mt-2 flex flex-col text-xs">
            <div className={`${isCorrectNetwork ? 'text-green-400' : 'text-yellow-400'}`}>
              Network: {currentNetwork}
            </div>
            {showBalance && walletBalance && (
              <div className="text-gray-300">
                Balance: {walletBalance} ETH
              </div>
            )}
          </div>
          
          {/* Network switcher */}
          {showNetworkSwitcher && !isCorrectNetwork && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleSwitchToBase}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isNetworkSwitching}
              >
                {isNetworkSwitching ? 'Switching...' : 'Switch to Base'}
              </button>
              <button
                onClick={handleSwitchToBaseSepolia}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={isNetworkSwitching}
              >
                {isNetworkSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => login()}
          className="px-4 py-2 bg-deepPink text-white rounded hover:bg-fontRed"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

// Set default props
WalletSelector.defaultProps = {
  showBalance: true,
  showNetworkSwitcher: true
};

export default WalletSelector; 