import React, { useState, useEffect } from 'react';
import { useGames } from '../hooks/useSubgraphData';
import { formatEther } from 'viem';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useLoginToFrame } from "@privy-io/react-auth/farcaster";
import BlockchainScoreSquareDisplay from './BlockchainScoreSquareDisplay';
import { parseEventId } from '../utils/eventIdParser';
import { getTeamLogo, getLeagueCode } from './utils/fetchTeamLogos';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import frameSdk from "@farcaster/frame-sdk";
import RefereeDisplay from './RefereeDisplay';
import WinnerDisplay from './WinnerDisplay';

// Base Mainnet and Base Sepolia chain IDs
const BASE_CHAIN_ID = 8453;
const BASE_SEPOLIA_CHAIN_ID = 84532;

// Define the type for a winner from the subgraph
interface SubgraphWinner {
  id: string;
  squareIndex: number;
  percentage: number;
  finalizedAt: string;
}

// Define the type for a ticket from the subgraph
interface SubgraphTicket {
  id: string;
  buyer: string;
  squareIndex: number;
  purchasedAt: string;
}

// Define the type for a game from the subgraph
interface SubgraphGame {
  id: string;
  gameId: string;
  eventId: string;
  deployer: string;
  squarePrice: string;
  referee: string;
  deployerFeePercent: number;
  ticketsSold: number;
  prizePool: string;
  prizeClaimed: boolean;
  refunded: boolean;
  createdAt: string;
  winners?: SubgraphWinner[];
  tickets?: SubgraphTicket[];
}

interface CompletedGamesBrowserProps {
  initialGameId?: string | null;
}

/**
 * CompletedGamesBrowser - A component for browsing completed (finalized) games
 * 
 * This component fetches games from the subgraph and filters to show only
 * completed games (games that have been finalized).
 */
const CompletedGamesBrowser: React.FC<CompletedGamesBrowserProps> = ({ initialGameId }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State for the selected game
  const [selectedGame, setSelectedGame] = useState<string | null>(
    initialGameId || searchParams?.get('gameId') || null
  );
  
  // State for loading individual games
  const [isLoadingGame, setIsLoadingGame] = useState<boolean>(false);
  
  // State for network
  const [isNetworkSwitching, setIsNetworkSwitching] = useState<boolean>(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>('Unknown');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  
  // Farcaster context state
  const [isFarcasterFrame, setIsFarcasterFrame] = useState<boolean>(false);
  
  // Fetch games from the subgraph
  const { data, loading, error } = useGames(100, 0); // Get up to 100 games
  
  // Privy hooks
  const { login, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { initLoginToFrame, loginToFrame } = useLoginToFrame();

  // Check for Farcaster context
  useEffect(() => {
    const checkFarcasterContext = async () => {
      try {
        const context = await frameSdk.context;
        if (context) {
          console.log("Farcaster context loaded:", JSON.stringify(context, null, 2));
          setIsFarcasterFrame(true);
        } else {
          console.log("Farcaster context returned null or undefined.");
          setIsFarcasterFrame(false);
        }
      } catch (error) {
        console.error("Failed to load Farcaster context:", error);
        setIsFarcasterFrame(false);
      }
    };
    
    checkFarcasterContext();
  }, []);

  // Login to Frame with Privy automatically if in a Farcaster frame
  useEffect(() => {
    if (isFarcasterFrame && !authenticated) {
      const loginWithFarcaster = async () => {
        try {
          const { nonce } = await initLoginToFrame();
          const result = await frameSdk.actions.signIn({ nonce: nonce });
          await loginToFrame({
            message: result.message,
            signature: result.signature,
          });
        } catch (error) {
          console.error("Error logging in with Farcaster:", error);
        }
      };
      
      loginWithFarcaster();
    }
  }, [isFarcasterFrame, authenticated, initLoginToFrame, loginToFrame]);

  // Filter for completed games (prizeClaimed or refunded)
  const completedGames = data?.games
    ? data.games
        .filter((game: SubgraphGame) => game.prizeClaimed || game.refunded)
        .sort((a: SubgraphGame, b: SubgraphGame) => 
          // Sort by creation date (newest first)
          parseInt(b.createdAt) - parseInt(a.createdAt)
        )
    : [];
  
  // Get the appropriate wallet based on priority:
  // 1. Farcaster wallet if available
  // 2. Connected wallet from Privy
  // 3. Embedded wallet from Privy
  const getActiveWallet = () => {
    if (!authenticated) {
      return null;
    }
    
    // If no wallets are connected, return null
    if (wallets.length === 0) {
      return null;
    }
    
    // Check for Farcaster wallet
    const farcasterWallet = wallets.find(wallet => 
      wallet.walletClientType === 'privy' && 
      user?.linkedAccounts.some(account => 
        account.type === 'farcaster' && 
        wallet.address
      )
    );
    
    if (farcasterWallet) {
      console.log("Using Farcaster wallet:", farcasterWallet.address);
      return farcasterWallet;
    }
    
    // Check for connected wallets (non-embedded)
    const connectedWallet = wallets.find(wallet => 
      wallet.walletClientType !== 'embedded'
    );
    
    if (connectedWallet) {
      console.log("Using connected wallet:", connectedWallet.address);
      return connectedWallet;
    }
    
    // Otherwise use the first wallet (likely embedded)
    console.log("Using first available wallet:", wallets[0].address);
    return wallets[0];
  };
  
  // Check if user is on the correct network
  useEffect(() => {
    const checkNetwork = async () => {
      const activeWallet = getActiveWallet();
      
      if (authenticated && activeWallet) {
        try {
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
  }, [authenticated, wallets, user]);

  // Function to switch to Base network
  const handleSwitchToBase = async () => {
    const activeWallet = getActiveWallet();
    
    if (activeWallet) {
      try {
        setIsNetworkSwitching(true);
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
    const activeWallet = getActiveWallet();
    
    if (activeWallet) {
      try {
        setIsNetworkSwitching(true);
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
  
  // Handle game selection
  const handleGameSelect = (gameId: string) => {
    // Show loading state
    setIsLoadingGame(true);
    
    // Update state without page reload
    setSelectedGame(gameId);
    
    // Update URL without causing a page reload
    const params = new URLSearchParams(searchParams?.toString());
    params.set('gameId', gameId);
    
    // Get the current path and update the URL
    const currentPath = window.location.pathname;
    router.replace(`${currentPath}?${params.toString()}`, { scroll: false });
    
    // Hide loading state after a short delay to ensure UI updates
    setTimeout(() => {
      setIsLoadingGame(false);
    }, 300);
  };
  
  // Handle back button
  const handleBack = () => {
    // Show loading state
    setIsLoadingGame(true);
    
    // Update state without page reload
    setSelectedGame(null);
    
    // Update URL without causing a page reload
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('gameId');
    
    // Get the current path and update the URL
    const currentPath = window.location.pathname;
    router.replace(`${currentPath}?${params.toString()}`, { scroll: false });
    
    // Hide loading state after a short delay to ensure UI updates
    setTimeout(() => {
      setIsLoadingGame(false);
    }, 300);
  };

  // Function to copy shareable link to clipboard
  const copyShareableLink = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    // Create URL with gameId parameter
    const params = new URLSearchParams(searchParams?.toString());
    params.set('gameId', gameId);
    
    // Get the current path for the shareable URL
    const currentPath = window.location.pathname;
    const shareableUrl = `${window.location.origin}${currentPath}?${params.toString()}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableUrl)
      .then(() => {
        alert('Shareable link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Failed to copy link. Please try again.');
      });
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Completed Games</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded w-full"></div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
        </div>
        <p className="mt-4 text-gray-500 text-center">Loading completed games...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Completed Games</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error.message || 'Failed to load games'}</span>
        </div>
        <p className="mt-4 text-gray-500 text-center">Please try again later.</p>
      </div>
    );
  }

  // If a game is selected, show the game display
  if (selectedGame) {
    const game = completedGames.find((g: SubgraphGame) => g.gameId === selectedGame);
    
    if (!game) {
      return (
        <div className="p-4">
          <button 
            onClick={handleBack}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            ← Back
          </button>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Game not found!</strong>
            <span className="block sm:inline"> The selected game could not be found.</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        {isLoadingGame ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md shadow-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-center mt-2">Loading game...</p>
            </div>
          </div>
        ) : null}
        
        <div className="flex justify-between items-center mb-2
        ">
          <button 
            onClick={handleBack}
            className="px-4 py-2 text-notWhite"
          >
            ← Completed Games
          </button>
          
          {/* The wallet info will be displayed by the BlockchainScoreSquareDisplay component */}
        </div>
        
        <BlockchainScoreSquareDisplay eventId={game.eventId} />
      </div>
    );
  }

  // Show the list of completed games
  return (
    <div className="p-4 overflow-x-hidden w-full">
      {isLoadingGame ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-center mt-2">Loading game...</p>
          </div>
        </div>
      ) : null}
      
      {/* Header with Wallet Info */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-notWhite font-bold">
          Completed Games
        </h1>
        
        {authenticated ? (
          <div className="flex items-center gap-2">
          {/*  <div className="flex flex-col items-end">
              <span className="text-sm text-lightPurple">
                 {(() => {
                  const activeWallet = getActiveWallet();
                  if (activeWallet) {
                    const address = activeWallet.address;
                    const isFarcaster = user?.linkedAccounts.some(account => 
                      account.type === 'farcaster'
                    );
                    
                    return (
                      <>
                        {isFarcaster && <span className="text-xs text-blue-400 mr-1">[FC]</span>}
                        {formatAddress(address)}
                      </>
                    );
                  }
                  return 'No wallet connected';
                })()} 
              </span>
              <span className={`text-xs ${isCorrectNetwork ? 'text-green-400' : 'text-yellow-400'}`}>
                {currentNetwork}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="px-3 py-1 bg-deepPink text-white rounded hover:bg-fontRed text-sm"
            >
              Disconnect
            </button>
            */}
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
      
      {/* Network Warning */}
      {authenticated && !isCorrectNetwork && (
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
      )}
      
      {completedGames.length === 0 ? (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
          <p className="font-bold">No completed games found.</p>
          <p>There are currently no completed games available. Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-full">
          {completedGames.map((game: SubgraphGame) => {
            const eventDetails = parseEventId(game.eventId);
            const hasWinners = game.winners && game.winners.length > 0;
            
            return (
              <div 
                key={game.id} 
                className="bg-purplePanel rounded-lg shadow-md p-4 cursor-pointer hover:bg-opacity-90 transition-colors"
                onClick={() => handleGameSelect(game.gameId)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    {eventDetails ? (
                      <div className="flex items-center">
                        {/* Home team logo and abbreviation */}
                        <div className="flex items-center">
                          <div className="w-8 h-8 relative mr-1">
                            <Image 
                              src={getTeamLogo(eventDetails.homeTeam, getLeagueCode(eventDetails.leagueId))} 
                              alt={eventDetails.homeTeam}
                              width={32}
                              height={32}
                              className="object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/defifa_spinner.gif';
                              }}
                            />
                          </div>
                          <span className="font-bold text-white">{eventDetails.homeTeam}</span>
                        </div>
                        
                        {/* vs */}
                        <span className="mx-2 text-gray-400">v</span>
                        
                        {/* Away team abbreviation and logo */}
                        <div className="flex items-center">
                          <span className="font-bold text-white">{eventDetails.awayTeam}</span>
                          <div className="w-8 h-8 relative ml-1">
                            <Image 
                              src={getTeamLogo(eventDetails.awayTeam, getLeagueCode(eventDetails.leagueId))} 
                              alt={eventDetails.awayTeam}
                              width={32}
                              height={32}
                              className="object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/defifa_spinner.gif';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-white">{game.eventId}</span>
                    )}
                    
                    {eventDetails && (
                      <div className="text-sm text-gray-400 mt-1">
                        <span className="ml-2 px-2 py-0.5 bg-blue-900 text-blue-200 rounded-full text-xs">
                          {eventDetails.league}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Prize Pool</div>
                    <div className="text-lg font-bold text-green-400">
                      {(() => {
                        // Calculate the full prize pool (25 * squarePrice)
                        const squarePriceEth = parseFloat(formatEther(BigInt(game.squarePrice)));
                        const fullPool = squarePriceEth * 25;
                        
                        // Calculate fees (deployerFeePercent for deployer + 5% for community)
                        const deployerFeePercent = game.deployerFeePercent || 0;
                        const communityFeePercent = 5; // Default community fee is 5%
                        const totalFeePercent = deployerFeePercent + communityFeePercent;
                        
                        // Calculate final prize pool after fees
                        const finalPool = fullPool * (1 - (totalFeePercent / 100));
                        
                        return `${finalPool.toFixed(4)} ETH`;
                      })()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {parseFloat(formatEther(BigInt(game.squarePrice))).toFixed(4)} ETH per square
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Squares Filled</span>
                    <span className="text-white">{game.ticketsSold}/25</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(game.ticketsSold / 25) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Referee information */}
                <div className="mb-2 flex items-center">
                  <span className="text-gray-400 text-sm mr-2">Referee:</span>
                  <RefereeDisplay gameId={game.gameId} fallbackReferee={game.referee} />
                </div>
                
                {/* Date information */}
                {eventDetails && (
                  <div className="mb-3 text-sm text-gray-400">
                    <span className="text-gray-400 text-sm mr-2">Date:</span>
                    {(() => {
                      // Parse the date from eventDetails.formattedDate
                      const dateParts = eventDetails.formattedDate.split(' ')[0].split('/');
                      if (dateParts.length === 3) {
                        const [month, day, year] = dateParts;
                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
                        const monthName = date.toLocaleDateString('en-US', { month: 'long' });
                        return `${dayOfWeek} - ${day} - ${monthName}`;
                      }
                      return eventDetails.formattedDate.split(' ')[0];
                    })()}
                  </div>
                )}
                
                {/* Game status */}
                <div className="mb-3">
                  {game.refunded ? (
                    <div className="bg-red-900 bg-opacity-40 p-2 rounded-md text-xs text-red-200">
                      <p className="font-semibold">⚠️ Game Refunded</p>
                      <p>This game was refunded because not all squares were filled.</p>
                    </div>
                  ) : hasWinners ? (
                    <div className="bg-green-900 bg-opacity-40 p-2 rounded-md text-xs text-green-200">
                      <p className="font-semibold">🏆 Winners Determined</p>
                      <div className="mt-1">
                        {game.winners?.map((winner) => (
                          <WinnerDisplay key={winner.id} winner={winner} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-900 bg-opacity-40 p-2 rounded-md text-xs text-yellow-200">
                      <p className="font-semibold">⏳ Game Finalized</p>
                      <p>This game has been finalized but no winners were determined.</p>
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGameSelect(game.gameId);
                    }}
                  >
                    View Results
                  </button>
                  
                  <button
                    className="py-2 px-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors text-sm"
                    onClick={(e) => copyShareableLink(game.gameId, e)}
                    title="Copy shareable link"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
                
                {/* Debug info - can be removed after fixing */}
                <div className="text-xs text-gray-500 mt-2 truncate">
                  ID: {game.eventId}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Set default props
CompletedGamesBrowser.defaultProps = {
  initialGameId: null
};

export default CompletedGamesBrowser; 