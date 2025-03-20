import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { zeroAddress } from 'viem';

// Import types
import { GameData, GameState, PrivyUser } from '../../types/gameTypes';

// Import components
import GameMetadataCard from './GameMetadataCard';
import SquareGrid from './SquareGrid';
import RefereeCard from './RefereeCard';
import CartSection from './CartSection';
import NetworkWarning from './NetworkWarning';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import NoGameData from './NoGameData';
import WalletConnectInfo from './WalletConnectInfo';

// Import utilities
import { checkBaseNetwork } from '../../utils/networkUtils';

interface BlockchainScoreSquareDisplayProps {
  eventId: string;
}

const RefactoredBlockchainScoreSquareDisplay: React.FC<BlockchainScoreSquareDisplayProps> = ({ 
  eventId
}) => {
  // Define component state
  const [gameDataState] = useState<GameData | null>(null);
  const [homeTeam] = useState<string>('Home Team');
  const [awayTeam] = useState<string>('Away Team');
  const [squarePrice] = useState<string>("0");
  const [referee] = useState<string>(zeroAddress);
  const [players] = useState<string[]>(Array(25).fill(zeroAddress));
  const [cart, setCart] = useState<number[]>([]);
  const [gameState] = useState<GameState>('loading');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [isSelectingWinners, setIsSelectingWinners] = useState<boolean>(false);
  const [hasValidEventId] = useState<boolean>(!!eventId);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState<boolean>(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(Date.now());

  // Privy hooks
  const { login, authenticated, logout, user } = usePrivy();
  const { wallets } = useWallets();
  
  // Wagmi hooks
  const { address } = useAccount();
  const chainId = useChainId();
  
  // Check if user is the referee
  const isReferee = address?.toLowerCase() === referee?.toLowerCase();
  const isGameStatusReferee = gameDataState?.referee.toLowerCase() === address?.toLowerCase();

  // Network switching functions
  const handleSwitchToBase = async () => {
    if (wallets.length > 0) {
      try {
        setIsNetworkSwitching(true);
        await wallets[0].switchChain(8453); // Base Mainnet
        setCurrentNetwork('Base');
        setIsCorrectNetwork(true);
      } catch (error) {
        console.error('Error switching to Base:', error);
      } finally {
        setIsNetworkSwitching(false);
      }
    }
  };

  const handleSwitchToBaseSepolia = async () => {
    if (wallets.length > 0) {
      try {
        setIsNetworkSwitching(true);
        await wallets[0].switchChain(84532); // Base Sepolia
        setCurrentNetwork('Base Sepolia');
        setIsCorrectNetwork(true);
      } catch (error) {
        console.error('Error switching to Base Sepolia:', error);
      } finally {
        setIsNetworkSwitching(false);
      }
    }
  };

  // Cart functions
  const addToCart = (index: number) => {
    if (players[index] !== zeroAddress) {
      return; // Square already taken
    }
    
    if (cart.includes(index)) {
      return; // Already in cart
    }
    
    setCart([...cart, index]);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter(i => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Function to handle buying tickets
  const handleBuyTickets = async () => {
    // Implementation would go here
    console.log("Buying tickets:", cart);
    setIsBuying(true);
    
    // Simulate a transaction
    setTimeout(() => {
      setIsBuying(false);
      clearCart();
    }, 2000);
  };

  // Function to handle claiming winnings
  const handleClaimWinnings = async () => {
    // Implementation would go here
    console.log("Claiming winnings");
  };

  // Function to get username for an address
  const getUsername = (address: string): string => {
    // Implementation would go here
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };

  // Function to get score for a square
  const getScoreForSquare = (index: number): string => {
    // Implementation would go here
    return `${index % 5} - ${Math.floor(index / 5)}`;
  };

  // Function to format address
  const formatAddress = (address: string): string => {
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };

  // Function to find Farcaster profile picture
  const findFarcasterPfp = (): string => {
    // Implementation would go here
    return '/defifa_spinner.gif';
  };

  // Function to handle square click
  const handleSquareClick = (index: number) => {
    if (gameState === 'buying' && players[index] === zeroAddress) {
      addToCart(index);
    } else if (gameState === 'playing' && isReferee && isSelectingWinners) {
      // Toggle square selection
      console.log("Toggling square selection:", index);
    }
  };

  // Function to manually refresh game data
  const refreshGameData = () => {
    console.log("[DEBUG] Manual refresh triggered");
    
    // Reset states
    setLoading(true);
    setLoadingStartTime(Date.now());
    setError(null);
    
    // Set a timeout to ensure loading state is cleared
    setTimeout(() => {
      if (loading) {
        console.log("[DEBUG] Manual refresh timeout triggered");
        setLoading(false);
      }
    }, 15000);
  };

  // Add a useEffect to handle loading timeout
  useEffect(() => {
    if (loading && loadingStartTime === null) {
      setLoadingStartTime(Date.now());
    }

    if (!loading && loadingStartTime !== null) {
      setLoadingStartTime(null);
    }

    // Set a maximum loading time of 15 seconds
    let loadingTimeout: NodeJS.Timeout | null = null;
    if (loading && loadingStartTime !== null) {
      loadingTimeout = setTimeout(() => {
        if (loading) {
          console.log("Loading timeout reached, forcing loading state to false");
          setLoading(false);
          setError("Loading timeout reached. Please try refreshing the game data.");
        }
      }, 15000);
    }

    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loading, loadingStartTime]);

  // Add a useEffect to automatically clear loading state after a timeout
  useEffect(() => {
    if (loading) {
      const maxLoadingTimeout = setTimeout(() => {
        console.log("[DEBUG] Maximum loading time reached, forcing loading state to false");
        setLoading(false);
        
        // If we still don't have game data, set an error
        if (!gameDataState && !error) {
          setError("Loading timed out. Please try refreshing the page.");
        }
      }, 10000);
      
      return () => clearTimeout(maxLoadingTimeout);
    }
  }, [loading, gameDataState, error]);

  // Add network check
  useEffect(() => {
    const networkCheck = checkBaseNetwork(chainId);
    if (!networkCheck.isBase) {
      setError(networkCheck.error || "Please connect to Base network");
    }
  }, [chainId]);

  // Render the component
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Navigation & Network Connection Area */}
      <div className="border-gray-700">
        <div className="flex justify-between items-center">
          {/* Back button placeholder - will be populated by parent component */}
          <div className="w-1/4">
            {/* This space is reserved for the back button */}
          </div>
          
          {/* Wallet Connection Info */}
          <WalletConnectInfo 
            authenticated={authenticated}
            address={address}
            isCorrectNetwork={isCorrectNetwork}
            currentNetwork={currentNetwork}
            login={login}
            logout={logout}
            user={user as PrivyUser | null}
            findFarcasterPfp={findFarcasterPfp}
          />
        </div>
      </div>
      
      {/* Network Warning */}
      <NetworkWarning 
        isCorrectNetwork={isCorrectNetwork}
        authenticated={authenticated}
        currentNetwork={currentNetwork}
        isNetworkSwitching={isNetworkSwitching}
        handleSwitchToBase={handleSwitchToBase}
        handleSwitchToBaseSepolia={handleSwitchToBaseSepolia}
      />

      {loading ? (
        <LoadingSpinner 
          gameDataState={gameDataState}
          loadingStartTime={loadingStartTime}
          setLoading={setLoading}
          setError={setError}
        />
      ) : error ? (
        <ErrorDisplay 
          error={error}
          hasValidEventId={hasValidEventId}
          refreshGameData={refreshGameData}
        />
      ) : !gameDataState ? (
        <NoGameData 
          refreshGameData={refreshGameData}
        />
      ) : (
        <div>
          {/* Game content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Game Info */}
            <div className="md:col-span-1">
              <GameMetadataCard 
                gameDataState={gameDataState}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                squarePrice={squarePrice}
                gameState={gameState}
              />
              
              <div className="mt-6">
                <RefereeCard 
                  referee={referee}
                  isReferee={isReferee}
                  gameState={gameState}
                  formatAddress={formatAddress}
                  isSelectingWinners={isSelectingWinners}
                  setIsSelectingWinners={setIsSelectingWinners}
                  handleClaimWinnings={handleClaimWinnings}
                  gameDataState={gameDataState}
                />
              </div>
              
              {gameState === 'buying' && (
                <div className="mt-6">
                  <CartSection 
                    cart={cart}
                    squarePrice={gameDataState.squarePrice}
                    removeFromCart={removeFromCart}
                    clearCart={clearCart}
                    handleBuyTickets={handleBuyTickets}
                    isBuying={isBuying}
                  />
                </div>
              )}
            </div>
            
            {/* Right Column - Game Grid */}
            <div className="md:col-span-2">
              <SquareGrid 
                players={players}
                cart={cart}
                winningSquares={gameDataState.winningSquares || []}
                winnerPercentages={gameDataState.winnerPercentages || []}
                isReferee={isReferee}
                isGameStatusReferee={isGameStatusReferee}
                getUsername={getUsername}
                handleSquareClick={handleSquareClick}
                getScoreForSquare={getScoreForSquare}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefactoredBlockchainScoreSquareDisplay; 