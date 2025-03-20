import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import BlockchainScoreSquareDisplay from './BlockchainScoreSquareDisplay';
import { formatEther } from 'viem';
import { SCORE_SQUARE_ADDRESS } from '../lib/config';
import sportsData from './utils/sportsData';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { useGames, useSearchGames, useGameByEventId, useGameById } from '../hooks/useSubgraphData';

// ScoreSquare contract ABI
const SCORE_SQUARE_ABI = [{"inputs":[{"internalType":"address","name":"_communityWallet","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[],"name":"CommunityWalletLocked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newWallet","type":"address"}],"name":"CommunityWalletUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"gameId","type":"uint256"},{"indexed":false,"internalType":"address","name":"deployer","type":"address"},{"indexed":false,"internalType":"uint256","name":"squarePrice","type":"uint256"},{"indexed":false,"internalType":"string","name":"eventId","type":"string"},{"indexed":false,"internalType":"address","name":"referee","type":"address"},{"indexed":false,"internalType":"uint8","name":"deployerFeePercent","type":"uint8"}],"name":"GameCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"gameId","type":"uint256"},{"indexed":false,"internalType":"uint8[]","name":"winningSquares","type":"uint8[]"},{"indexed":false,"internalType":"uint8[]","name":"winnerPercentages","type":"uint8[]"}],"name":"GameFinalized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"gameId","type":"uint256"},{"indexed":false,"internalType":"address","name":"distributor","type":"address"}],"name":"PrizesDistributed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"gameId","type":"uint256"},{"indexed":false,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint8","name":"numTickets","type":"uint8"}],"name":"TicketsPurchased","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"gameId","type":"uint256"},{"indexed":false,"internalType":"uint8","name":"ticketsRefunded","type":"uint8"}],"name":"TicketsRefunded","type":"event"},{"inputs":[{"internalType":"uint256","name":"gameId","type":"uint256"},{"internalType":"uint8","name":"numTickets","type":"uint8"}],"name":"buyTickets","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"communityWallet","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"communityWalletLocked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_squarePrice","type":"uint256"},{"internalType":"string","name":"_eventId","type":"string"},{"internalType":"address","name":"_referee","type":"address"},{"internalType":"uint8","name":"_deployerFeePercent","type":"uint8"}],"name":"createGame","outputs":[{"internalType":"uint256","name":"gameId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"gameId","type":"uint256"}],"name":"distributeWinnings","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"gameId","type":"uint256"},{"internalType":"uint8[]","name":"_winningSquares","type":"uint8[]"},{"internalType":"uint8[]","name":"_winnerPercentages","type":"uint8[]"}],"name":"finalizeGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"gameCounter","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"gameId","type":"uint256"}],"name":"getAllTickets","outputs":[{"internalType":"uint8[]","name":"","type":"uint8[]"},{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getContractBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_eventId","type":"string"}],"name":"getGameIdByEventId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"gameId","type":"uint256"}],"name":"getGameStatus","outputs":[{"internalType":"bool","name":"active","type":"bool"},{"internalType":"address","name":"referee","type":"address"},{"internalType":"uint256","name":"squarePrice","type":"uint256"},{"internalType":"uint8","name":"ticketsSold","type":"uint8"},{"internalType":"uint256","name":"prizePool","type":"uint256"},{"internalType":"uint8[]","name":"winningSquares","type":"uint8[]"},{"internalType":"uint8[]","name":"winnerPercentages","type":"uint8[]"},{"internalType":"bool","name":"prizeClaimed","type":"bool"},{"internalType":"string","name":"eventId","type":"string"},{"internalType":"bool","name":"refunded","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lockCommunityWallet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newWallet","type":"address"}],"name":"setCommunityWallet","outputs":[],"stateMutability":"nonpayable","type":"function"}];

// Replace with your deployed contract address
// const SCORE_SQUARE_ADDRESS = "0x6147b9AB63496aCE7f3D270F8222e09038FD0870";

// Define types
interface Game {
  gameId: string;
  eventId: string;
  squarePrice: string;
  referee: string;
  deployerFeePercent: number;
  players: string[];
  status: number;
}

interface GameStatusResponse {
  active: boolean;
  referee: string;
  squarePrice: bigint;
  ticketsSold: number;
  prizePool: bigint;
  winningSquares: number[];
  winnerPercentages: number[];
  prizeClaimed: boolean;
  eventId: string;
  refunded: boolean;
}

// Define types for subgraph data
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
  tickets?: SubgraphTicket[];
  winners?: SubgraphWinner[];
}

interface SubgraphTicket {
  id: string;
  buyer: string;
  squareIndex: number;
  purchasedAt: string;
}

interface SubgraphWinner {
  id: string;
  squareIndex: number;
  percentage: number;
  finalizedAt: string;
}

interface BlockchainScoreSquareBrowserProps {
  setActiveTab?: (tab: 'browse' | 'create') => void;
  latestCreatedEventId?: string;
  latestCreatedGameId?: string;
}

const BlockchainScoreSquareBrowser: React.FC<BlockchainScoreSquareBrowserProps> = ({ 
  setActiveTab,
  latestCreatedEventId,
  latestCreatedGameId
}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSportId, setSelectedSportId] = useState<string>("eng.1");
  const [showSearchNotification, setShowSearchNotification] = useState<boolean>(false);

  // Privy hooks
  const { login, authenticated } = usePrivy();
  
  // Wagmi hooks
  // const { isConnected } = useAccount();

  // GraphQL queries
  const { data: allGamesData } = useGames();
  const { data: searchData } = useSearchGames(searchQuery);
  const { data: eventIdData } = useGameByEventId(latestCreatedEventId || '');
  const { data: gameIdData } = useGameById(latestCreatedGameId || '');

  // Set search query when latestCreatedEventId changes
  useEffect(() => {
    if (latestCreatedEventId) {
      setSearchQuery(latestCreatedEventId);
      setShowSearchNotification(true);
    }
  }, [latestCreatedEventId]);

  // Load games from subgraph
  const loadGames = useCallback(() => {
    setLoading(true);
    setError("");
    
    // Check if wallet is connected
    if (!authenticated) {
      setError("Please connect your wallet to view games");
      setLoading(false);
      return;
    }
    
    try {
      // If we have search results, use those
      if (searchQuery && searchData?.games) {
        const formattedGames = searchData.games.map((game: SubgraphGame) => ({
          gameId: game.gameId,
          eventId: game.eventId,
          squarePrice: formatEther(BigInt(game.squarePrice)),
          referee: game.referee,
          deployerFeePercent: game.deployerFeePercent,
          players: [], // Not available in the subgraph query
          status: game.prizeClaimed ? 0 : 1 // Convert prizeClaimed to status
        }));
        setGames(formattedGames);
      }
      // If we have a specific game by ID, use that
      else if (latestCreatedGameId && gameIdData?.game) {
        const game = gameIdData.game as SubgraphGame;
        const formattedGame = {
          gameId: game.gameId,
          eventId: game.eventId,
          squarePrice: formatEther(BigInt(game.squarePrice)),
          referee: game.referee,
          deployerFeePercent: game.deployerFeePercent,
          players: [], // Not available in the subgraph query
          status: game.prizeClaimed ? 0 : 1 // Convert prizeClaimed to status
        };
        setGames([formattedGame]);
      }
      // If we have a specific game by event ID, use that
      else if (latestCreatedEventId && eventIdData?.games) {
        const formattedGames = eventIdData.games.map((game: SubgraphGame) => ({
          gameId: game.gameId,
          eventId: game.eventId,
          squarePrice: formatEther(BigInt(game.squarePrice)),
          referee: game.referee,
          deployerFeePercent: game.deployerFeePercent,
          players: [], // Not available in the subgraph query
          status: game.prizeClaimed ? 0 : 1 // Convert prizeClaimed to status
        }));
        setGames(formattedGames);
      }
      // Otherwise, use all games
      else if (allGamesData?.games) {
        const formattedGames = allGamesData.games.map((game: SubgraphGame) => ({
          gameId: game.gameId,
          eventId: game.eventId,
          squarePrice: formatEther(BigInt(game.squarePrice)),
          referee: game.referee,
          deployerFeePercent: game.deployerFeePercent,
          players: [], // Not available in the subgraph query
          status: game.prizeClaimed ? 0 : 1 // Convert prizeClaimed to status
        }));
        setGames(formattedGames);
      }
    } catch (err) {
      console.error("Error loading games from subgraph:", err);
      setError("Error loading games. Please try again.");
      
      // Fallback to direct contract calls if subgraph fails
      loadGamesFromContract();
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchData, gameIdData, eventIdData, allGamesData, latestCreatedGameId, latestCreatedEventId, authenticated]);

  // Fallback function to load games directly from the contract
  const loadGamesFromContract = async () => {
    try {
      // Create a viem public client
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });
      
      // If we have a latest created game ID, try to load it directly
      if (latestCreatedGameId) {
        try {
          console.log("Trying to load latest created game:", latestCreatedGameId);
          
          // Check if latestCreatedGameId is a transaction hash
          if (latestCreatedGameId.startsWith('0x') && latestCreatedGameId.length === 66) {
            console.log("Latest created game ID appears to be a transaction hash, not a game ID");
            console.log("Will try to load games by event ID instead");
          } else {
            // It's a numeric game ID, try to load it
            const gameId = latestCreatedGameId;
            
            // Use viem's readContract function
            const game = await publicClient.readContract({
              address: SCORE_SQUARE_ADDRESS as `0x${string}`,
              abi: SCORE_SQUARE_ABI,
              functionName: 'getGameStatus',
              args: [BigInt(gameId)]
            }) as GameStatusResponse;
            
            const loadedGame = {
              gameId: gameId,
              eventId: game.eventId,
              squarePrice: formatEther(game.squarePrice),
              referee: game.referee,
              deployerFeePercent: 0, // Not available in getGameStatus
              players: [], // Not available in getGameStatus
              status: game.active ? 1 : 0 // Convert active boolean to status number
            };
            
            console.log("Successfully loaded latest game:", loadedGame);
            setGames([loadedGame]);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Error loading game by ID:", err);
        }
      }
      
      // If we have a latest created event ID or if loading by game ID failed, try to load by event ID
      if (latestCreatedEventId) {
        try {
          console.log("Trying to load game by event ID:", latestCreatedEventId);
          
          // Use viem's readContract function
          const gameId = await publicClient.readContract({
            address: SCORE_SQUARE_ADDRESS as `0x${string}`,
            abi: SCORE_SQUARE_ABI,
            functionName: 'getGameIdByEventId',
            args: [latestCreatedEventId]
          }) as bigint;
          
          if (gameId > BigInt(0)) {
            // Game found, now get its details
            const game = await publicClient.readContract({
              address: SCORE_SQUARE_ADDRESS as `0x${string}`,
              abi: SCORE_SQUARE_ABI,
              functionName: 'getGameStatus',
              args: [gameId]
            }) as GameStatusResponse;
            
            const loadedGame = {
              gameId: gameId.toString(),
              eventId: game.eventId,
              squarePrice: formatEther(game.squarePrice),
              referee: game.referee,
              deployerFeePercent: 0, // Not available in getGameStatus
              players: [], // Not available in getGameStatus
              status: game.active ? 1 : 0 // Convert active boolean to status number
            };
            
            console.log("Successfully loaded game by event ID:", loadedGame);
            setGames([loadedGame]);
            setLoading(false);
            return;
          } else {
            console.log("No game found for event ID:", latestCreatedEventId);
          }
        } catch (err) {
          console.error("Error loading game by event ID:", err);
        }
      }
      
      // If we get here, we couldn't load by game ID or event ID, so just show an error
      setError("Could not find the specified game. Please try again or browse all games.");
      setLoading(false);
    } catch (err) {
      console.error("Error in fallback loading:", err);
      setError("Error loading games. Please try again.");
      setLoading(false);
    }
  };

  // Load games when component mounts or when dependencies change
  useEffect(() => {
    loadGames();
  }, [loadGames, latestCreatedGameId, latestCreatedEventId]);

  // Update the handleSearch function to automatically fetch game data
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setShowSearchNotification(true);
      setTimeout(() => setShowSearchNotification(false), 3000);
      return;
    }
    
    console.log("Searching for event ID:", searchQuery);
    
    // Reset state
    setSelectedGameId(null);
    setSelectedEventId(null);
    setError(null);
    
    // Create a public client to interact with the blockchain
    const publicClient = createPublicClient({
      chain: base,
      transport: http()
    });
    
    // First, try to get the game ID from the event ID
    console.log("Calling getGameIdByEventId with:", searchQuery);
    publicClient.readContract({
      address: SCORE_SQUARE_ADDRESS as `0x${string}`,
      abi: SCORE_SQUARE_ABI,
      functionName: 'getGameIdByEventId',
      args: [searchQuery]
    }).then((gameId: unknown) => {
      const gameIdBigInt = gameId as bigint;
      if (gameIdBigInt && (gameIdBigInt.toString ? gameIdBigInt.toString() !== "0" : false)) {
        const gameIdStr = gameIdBigInt.toString();
        console.log("Game ID from getGameIdByEventId:", gameIdStr);
        
        // Check if we already have this game in our local state
        const existingGame = games.find(g => g.gameId === gameIdStr);
        if (existingGame) {
          // We have the game, just select it
          setSelectedGameId(gameIdStr);
          setSelectedEventId(searchQuery);
        } else {
          // We don't have the game, fetch it from the contract
          console.log("Game not found in local state, fetching from contract...");
          setLoading(true);
          fetchGameById(gameIdStr).then(game => {
            if (game) {
              setSelectedGameId(gameIdStr);
              setSelectedEventId(searchQuery);
            }
          });
        }
      } else {
        console.log("Game not found for event ID:", searchQuery);
        setError(`No game found for event ID: ${searchQuery}`);
      }
    }).catch((error: unknown) => {
      console.error("Error in search:", 
        error instanceof Error ? error.message : "Unknown error");
      setError(`Error searching for game: ${error instanceof Error ? error.message : "Unknown error"}`);
    });
  };

  // Update the handleAutoSearch function to automatically fetch game data
  const handleAutoSearch = function() {
    if (!latestCreatedEventId) return;
    
    console.log("Auto-searching for latest created event ID:", latestCreatedEventId);
    
    // Reset state
    setSelectedGameId(null);
    setSelectedEventId(null);
    setError(null);
    
    const eventId = latestCreatedEventId;
    
    // Create a public client to interact with the blockchain
    const publicClient = createPublicClient({
      chain: base,
      transport: http()
    });
    
    // First, try to get the game ID from the event ID
    publicClient.readContract({
      address: SCORE_SQUARE_ADDRESS as `0x${string}`,
      abi: SCORE_SQUARE_ABI,
      functionName: 'getGameIdByEventId',
      args: [eventId]
    }).then((gameId: unknown) => {
      const gameIdBigInt = gameId as bigint;
      if (gameIdBigInt && (gameIdBigInt.toString ? gameIdBigInt.toString() !== "0" : false)) {
        const gameIdStr = gameIdBigInt.toString();
        
        // Check if we already have this game in our local state
        const existingGame = games.find(g => g.gameId === gameIdStr);
        if (existingGame) {
          // We have the game, just select it
          setSelectedEventId(eventId);
          setSelectedGameId(null);
          setShowSearchNotification(false);
        } else {
          // We don't have the game, fetch it from the contract
          console.log("Game not found in local state, fetching from contract...");
          setLoading(true);
          fetchGameById(gameIdStr).then(game => {
            if (game) {
              setSelectedEventId(eventId);
              setSelectedGameId(null);
              setShowSearchNotification(false);
            }
          });
        }
      } else {
        console.log("Game not found for auto-search event ID:", eventId);
        setError(`No game found for event ID: ${eventId}`);
        setSelectedGameId(null);
        setSelectedEventId(null);
      }
    }).catch((error: unknown) => {
      console.error("Error in auto-search:", 
        error instanceof Error ? error.message : "Unknown error");
      setError(`Error searching for game: ${error instanceof Error ? error.message : "Unknown error"}`);
    });
  };

  // Handle game selection
  const handleSelectGame = (gameId: string) => {
    // Find the game in our local state
    const game = games.find(g => g.gameId === gameId);
    if (game) {
      // Set both the game ID and event ID
      setSelectedGameId(gameId);
      setSelectedEventId(game.eventId);
      console.log(`[DEBUG] Selected game ${gameId} with event ID ${game.eventId}`);
    } else {
      // If game not found, just set the game ID and fetch it
      setSelectedGameId(gameId);
      setSelectedEventId(null);
      console.log(`[DEBUG] Selected game ${gameId} but couldn't find event ID in local state`);
      // Optionally fetch the game data
      fetchGameById(gameId);
    }
  };

  // Handle back button click with error reset
  const handleBackToGames = () => {
    setSelectedEventId(null);
    setSelectedGameId(null);
    // Clear any errors when returning to the game list
    setError(null);
  };

  // Handle refresh button click
/*   const handleRefresh = () => {
    loadGames();
  }; */

  // Parse event ID to extract team names
  const parseEventId = (eventId: string): { league: string, home: string, away: string } => {
    try {
      // Split the event ID by underscores
      const parts = eventId.split('_');
      
      console.log(`[DEBUG] Parsing event ID in browser: ${eventId}`);
      console.log(`[DEBUG] Event ID parts:`, parts);
      
      // Format should be: league_gameNumber_HOME_AWAY_timestamp
      // Example: usa_1_VAN_LA_726827
      if (parts.length >= 5) {
        const result = {
          league: `${parts[0]}_${parts[1]}`,
          home: parts[2],
          away: parts[3]
        };
        console.log(`[DEBUG] Extracted teams in browser - Home: ${result.home}, Away: ${result.away}`);
        return result;
      } else if (parts.length >= 3) {
        // Fallback for older format
        const result = {
          league: parts[0],
          home: parts[1],
          away: parts[2]
        };
        console.log(`[DEBUG] Extracted teams (fallback) in browser - Home: ${result.home}, Away: ${result.away}`);
        return result;
      }
    } catch (err) {
      console.error("[DEBUG] Error parsing eventId in browser:", err);
    }
    
    console.log(`[DEBUG] Using default team names in browser due to unexpected format`);
    return { league: '', home: 'Home', away: 'Away' };
  };

  // Get league name from sportId
  const getLeagueName = (sportId: string): string => {
    const sport = sportsData.find(s => s.sportId === sportId.replace(/_/g, '.'));
    return sport ? sport.name : sportId;
  };

  // Get game status text
  const getGameStatusText = (status: number): string => {
    switch (status) {
      case 0: return 'Buying';
      case 1: return 'Playing';
      case 2: return 'Completed';
      default: return 'Unknown';
    }
  };

  // Debug function to test event ID
  /**
   * Debug function - commented out to prevent linter errors
   * Uncomment if needed for testing
   */
  /*
  const debugTestEventId = async function() {
    try {
      // Create a viem public client
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });
      
      const result = await publicClient.readContract({
        address: SCORE_SQUARE_ADDRESS as `0x${string}`,
        abi: SCORE_SQUARE_ABI,
        functionName: 'getGameIdByEventId',
        args: [searchQuery]
      }) as bigint;
      
      if (result) {
        console.log("Game ID for event:", result ? result.toString() : "0");
        alert(`Game ID for event ${searchQuery}: ${result ? result.toString() : "0"}`);
      } else {
        console.log("Game ID is undefined");
        alert(`Game ID for event ${searchQuery}: Not found`);
      }
    } catch (error: unknown) {
      console.error("Error testing event ID:", 
        error instanceof Error ? error.message : "Unknown error");
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  */

  // Handle buy tickets
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBuyTickets = async () => {
    if (!selectedGameId) return;
    
    try {
      // Use viem/wagmi instead of ethers
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });
      
      // Implementation will be added later
      console.log("Buy tickets functionality not implemented yet");
    } catch (err: unknown) {
      console.error("Error buying tickets:", 
        err instanceof Error ? err.message : "Unknown error");
    }
  };
  
  // Handle refund game
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRefundGame = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gameId: string
  ) => {
    try {
      // Use viem/wagmi instead of ethers
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });
      
      // Implementation will be added later
      console.log("Refund functionality not implemented yet");
    } catch (err: unknown) {
      console.error("Error refunding game:", 
        err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Add a function to fetch a specific game by ID from the contract
  const fetchGameById = async (gameId: string) => {
    try {
      console.log(`[DEBUG] Fetching game data directly from contract for game ID: ${gameId}`);
      setLoading(true);
      
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });
      
      // Get game status from contract
      const rawResponse = await publicClient.readContract({
        address: SCORE_SQUARE_ADDRESS as `0x${string}`,
        abi: SCORE_SQUARE_ABI,
        functionName: 'getGameStatus',
        args: [BigInt(gameId)]
      });
      
      console.log(`[DEBUG] Raw response from contract:`, rawResponse);
      console.log(`[DEBUG] Raw response type:`, typeof rawResponse);
      console.log(`[DEBUG] Raw response is array:`, Array.isArray(rawResponse));
      
      if (Array.isArray(rawResponse)) {
        console.log(`[DEBUG] Raw response length:`, rawResponse.length);
        console.log(`[DEBUG] Raw response elements:`, rawResponse.map((item, index) => `[${index}]: ${item} (${typeof item})`));
      }
      
      // Cast the response to GameStatusResponse
      let gameStatus: GameStatusResponse;
      
      if (Array.isArray(rawResponse)) {
        // If the response is an array, map it to the GameStatusResponse interface
        gameStatus = {
          active: rawResponse[0] !== undefined ? rawResponse[0] as boolean : false,
          referee: rawResponse[1] !== undefined ? rawResponse[1] as string : "0x0000000000000000000000000000000000000000",
          squarePrice: rawResponse[2] !== undefined ? rawResponse[2] as bigint : BigInt(0),
          ticketsSold: rawResponse[3] !== undefined ? rawResponse[3] as number : 0,
          prizePool: rawResponse[4] !== undefined ? rawResponse[4] as bigint : BigInt(0),
          winningSquares: rawResponse[5] !== undefined ? rawResponse[5] as number[] : [],
          winnerPercentages: rawResponse[6] !== undefined ? rawResponse[6] as number[] : [],
          prizeClaimed: rawResponse[7] !== undefined ? rawResponse[7] as boolean : false,
          eventId: rawResponse[8] !== undefined ? rawResponse[8] as string : "",
          refunded: rawResponse[9] !== undefined ? rawResponse[9] as boolean : false
        };
        console.log(`[DEBUG] Converted array response to GameStatusResponse:`, gameStatus);
      } else {
        // If the response is already an object, just cast it
        gameStatus = rawResponse as GameStatusResponse;
      }
      
      if (!gameStatus) {
        console.error(`[ERROR] Game status not found for game ID: ${gameId}`);
        setError(`Game with ID ${gameId} could not be loaded from the contract.`);
        setLoading(false);
        return null;
      }
      
      console.log(`[DEBUG] Game status from contract:`, gameStatus);
      
      // Add more detailed logging for the event ID
      console.log(`[DEBUG] Event ID from contract: "${gameStatus.eventId}"`);
      console.log(`[DEBUG] Event ID type:`, typeof gameStatus.eventId);
      console.log(`[DEBUG] Is event ID empty:`, !gameStatus.eventId);
      console.log(`[DEBUG] Is event ID undefined:`, gameStatus.eventId === undefined);
      console.log(`[DEBUG] Is event ID null:`, gameStatus.eventId === null);
      console.log(`[DEBUG] Event ID length:`, gameStatus.eventId ? gameStatus.eventId.length : 0);
      console.log(`[DEBUG] Is event ID the string "undefined":`, gameStatus.eventId === "undefined");
      
      // If the event ID is missing from the game status, try to find it
      // Check for null, undefined, empty string, or the string "undefined"
      let eventId = gameStatus.eventId;
      if (eventId === undefined || eventId === null || eventId === "" || eventId === "undefined") {
        console.log(`[DEBUG] Event ID missing or invalid from game status, trying to find it...`);
        
        // This is a workaround - in a real app, you might need to store this mapping elsewhere
        // For now, we'll use a placeholder
        eventId = `unknown_game_${gameId}`;
      } else {
        console.log(`[DEBUG] Found valid event ID in game status: "${eventId}"`);
      }
      
      console.log(`[DEBUG] Final event ID being used: "${eventId}"`);
      
      // Create a game object from the contract data
      const game: Game = {
        gameId: gameId,
        eventId: eventId,
        squarePrice: gameStatus && gameStatus.squarePrice ? formatEther(gameStatus.squarePrice) : "0",
        referee: gameStatus && gameStatus.referee ? gameStatus.referee : "0x0000000000000000000000000000000000000000",
        deployerFeePercent: 5, // Default value
        players: [], // We don't need players for display
        status: gameStatus && gameStatus.active ? 1 : 
                gameStatus && gameStatus.winningSquares && gameStatus.winningSquares.length > 0 ? 2 : 0
      };
      
      console.log(`[DEBUG] Created game object:`, game);
      
      // Add the game to the games array
      setGames(prevGames => {
        // Check if the game already exists in the array
        const existingGameIndex = prevGames.findIndex(g => g.gameId === gameId);
        
        if (existingGameIndex >= 0) {
          // Update the existing game
          const updatedGames = [...prevGames];
          updatedGames[existingGameIndex] = game;
          return updatedGames;
        } else {
          // Add the new game
          return [...prevGames, game];
        }
      });
      
      // Set the selected game ID and event ID
      setSelectedGameId(gameId);
      setSelectedEventId(eventId);
      
      console.log(`[DEBUG] Set selected game ID: ${gameId}, event ID: ${eventId}`);
      
      // Set loading to false
      setLoading(false);
      
      return game;
    } catch (error) {
      console.error(`[ERROR] Failed to fetch game ${gameId} from contract:`, error);
      setError(`Failed to load game ${gameId} from the contract. ${error}`);
      setLoading(false);
      return null;
    }
  };

  // Render game browser or selected game
  if (selectedGameId) {
    const game = games.find(g => g.gameId === selectedGameId);
    
    // Show loading state if we're fetching data
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-6 text-gray-300 font-medium">Loading game data from blockchain...</p>
          <button 
            onClick={handleBackToGames}
            className="mt-4 px-3 py-1 bg-deepPink text-white rounded hover:bg-fontRed"
          >
            ← Browse
          </button>
        </div>
      );
    }

    // If game is not found, show an error message with option to fetch from contract
    if (!game) {
      console.log("Game not found in games array for game ID:", selectedGameId);
      
      return (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300">
          <h3 className="font-semibold mb-2">Error Loading Game</h3>
          <p>Game with ID {selectedGameId} was not found in the local cache.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button 
              onClick={handleBackToGames}
              className="px-3 py-1 bg-deepPink text-white rounded hover:bg-fontRed"
            >
              ← Browse
            </button>
            <button 
              onClick={() => fetchGameById(selectedGameId)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Fetch from Blockchain
            </button>
          </div>
        </div>
      );
    }
    
    // Game was found, display it
    // Check if the game has an event ID, if not, fetch it
    if (!game.eventId) {
      console.log(`[DEBUG] Game ${game.gameId} has no event ID, fetching from contract...`);
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-6 text-gray-300 font-medium">Loading game data from blockchain...</p>
          <button 
            onClick={handleBackToGames}
            className="mt-4 px-3 py-1 bg-deepPink text-white rounded hover:bg-fontRed"
          >
            ← Browse
          </button>
        </div>
      );
    }

    // Make sure we have a valid event ID
    const eventIdToUse = game.eventId || `unknown_game_${game.gameId}`;
    console.log(`[DEBUG] Rendering game ${game.gameId} with event ID: ${eventIdToUse}`);

    return (
      <div>
        <button 
          onClick={handleBackToGames}
          className="mb-4 px-3 py-1 bg-deepPink text-white rounded hover:bg-fontRed"
        >
          ← Browse
        </button>
        
        <BlockchainScoreSquareDisplay 
          eventId={eventIdToUse} 
        />
      </div>
    );
  }

  if (selectedEventId) {
    // Make sure we have a valid event ID
    console.log(`[DEBUG] Rendering with selected event ID: ${selectedEventId}`);
    
    return (
      <div>
        <button 
          onClick={handleBackToGames}
          className="mb-4 px-3 py-1 bg-deepPink text-white rounded hover:bg-fontRed"
        >
          ← Browse
        </button>
        
        <BlockchainScoreSquareDisplay eventId={selectedEventId} />
      </div>
    );
  }

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-limeGreen mb-4"></div>
        <p className="text-lightPurple">Loading games...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded text-red-800 mb-4">
        <p className="font-semibold">{error}</p>
        
        {error.includes("connect your wallet") && !authenticated && (
          <div className="mt-4">
            <p className="font-semibold">Wallet Connection Required</p>
            <ul className="list-disc pl-5 mt-2">
              <li className="mb-1">Connect your wallet to view games</li>
              <li className="mb-1">Make sure you&apos;re connected to the Base or Base Sepolia network</li>
            </ul>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => login()}
                className="px-4 py-2 bg-deepPink text-white rounded hover:bg-fontRed"
              >
                Connect Wallet
              </button>
              <button
                onClick={() => {
                  setError("");
                  setLoading(true);
                  loadGames();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-purplePanel rounded shadow-md max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl text-notWhite font-bold">
          Score Square Games
        </h1>
        
{/*         <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-deepPink text-white rounded hover:bg-fontRed text-sm"
        >
          Refresh Games
        </button> */}
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-indigo-900 border border-indigo-700 text-white rounded">
          <p className="font-medium mb-2">{error}</p>
          {error.includes("No games found") && (
            <div className="mt-2 text-sm">
              <p>You can be the first to create a Score Square game!</p>
              {setActiveTab && (
                <button
                  onClick={() => setActiveTab('browse')}
                  className="mt-2 px-3 py-1 bg-deepPink text-white rounded hover:bg-fontRed text-sm"
                >
                  Create a Game
                </button>
              )}
            </div>
          )}
          {error.includes("network") && (
            <p className="text-sm mt-2">
              Please switch your wallet to the Base or Base Sepolia network and try again.
            </p>
          )}
        </div>
      )}
      
      <div className="mb-6">
        
        {showSearchNotification && (
          <div className="mb-3 p-3 bg-green-900 border border-green-700 text-white rounded">
            <p className="text-sm">Your game has been created! Click the Search button to view it.</p>
            <button
              onClick={handleAutoSearch}
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              View My Game
            </button>
          </div>
        )}
        
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <select
              value={selectedSportId}
              onChange={(e) => setSelectedSportId(e.target.value)}
              className="w-full p-2 bg-darkPurple border border-limeGreenOpacity rounded"
            >
              {sportsData.map(sport => (
                <option key={sport.sportId} value={sport.sportId}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Team name or full event ID"
              className={`w-full p-2 bg-darkPurple border ${showSearchNotification ? 'border-green-500' : 'border-limeGreenOpacity'} rounded text-lightPurple`}
            />
          </div>
          
          <button
            type="submit"
            className={`px-4 py-2 ${showSearchNotification ? 'bg-green-600 hover:bg-green-700 animate-pulse' : 'bg-deepPink hover:bg-fontRed'} text-white rounded`}
          >
            Search
          </button>
        </form>
        
        <p className="text-xs text-gray-400 mt-1">
          Search by team name (e.g. &quot;CHI&quot;) or paste the full event ID (e.g. &quot;usa_1_CHI_DC_1740847664685&quot;)
        </p>
      </div>
      
      <div>
        <h2 className="text-lg text-notWhite font-semibold mb-2">
          Recent Games
        </h2>
        
        {loading ? (
          <div className="text-center p-4">Loading games from blockchain...</div>
        ) : games.length === 0 ? (
          <div className="text-center p-4 bg-darkPurple rounded">
            <p className="text-lightPurple mb-2">No games found yet.</p>
            <p className="text-xs text-gray-400">Be the first to create a Score Square game!</p>
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('browse')}
                className="mt-3 px-4 py-2 bg-deepPink text-white rounded hover:bg-fontRed"
              >
                Create a Game
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {games.map(game => {
              const { league, home, away } = parseEventId(game.eventId);
              const leagueName = getLeagueName(league);
              
              return (
                <div 
                  key={game.gameId}
                  onClick={() => handleSelectGame(game.gameId)}
                  className="p-3 bg-darkPurple rounded cursor-pointer hover:bg-indigo-900 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-400">{leagueName}</span>
                      <h3 className="text-notWhite font-medium">
                        {home} vs {away}
                      </h3>
                      <p className="text-xs text-lightPurple">
                        Game ID: {game.gameId}
                      </p>
                      <p className="text-xs text-gray-400">
                        Event ID: {game.eventId}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${
                        game.status === 2 
                          ? 'bg-green-900 text-green-200' 
                          : game.status === 1 
                            ? 'bg-yellow-900 text-yellow-200' 
                            : 'bg-blue-900 text-blue-200'
                      }`}>
                        {getGameStatusText(game.status)}
                      </span>
                      <p className="text-sm text-limeGreenOpacity mt-1">
                        {game.squarePrice} ETH
                      </p>
                      <p className="text-xs text-lightPurple">
                        Players: {game.players.length}/25
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainScoreSquareBrowser; 