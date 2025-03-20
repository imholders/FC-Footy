/**
 * DEBUG COMPONENT - COMMENTED OUT TO PREVENT LINTER/BUILD ISSUES
 * This file contains a debug component for the ScoreSquare contract.
 * To use this component, uncomment it and ensure any imports are properly handled.
 */

/*
import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { SCORE_SQUARE_ADDRESS } from '../lib/config';

// Define types for the game data
interface GameData {
  gameId: string;
  eventId: string;
  squarePrice: string;
  referee: string;
  deployerFeePercent: number;
  players: string[];
  status: number;
}

// Define types for the game status
interface GameStatus {
  active: boolean;
  referee: string;
  squarePrice: string;
  ticketsSold: number;
  prizePool: string;
  winningSquares: number[];
  winnerPercentages: number[];
  prizeClaimed: boolean;
  eventId: string;
  refunded: boolean;
}

// Define types for Ethereum provider requests
interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

// Define a simplified type for Ethereum provider
interface EthereumProvider {
  isMetaMask?: boolean;
  request?: (args: RequestArguments) => Promise<unknown>;
  on?: (event: string, callback: (params: unknown) => void) => void;
  removeListener?: (event: string, callback: (params: unknown) => void) => void;
  selectedAddress?: string;
  chainId?: string;
}

const DebugGameComponent: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [gameId, setGameId] = useState<string>('');
  const [eventId, setEventId] = useState<string>('usa_1_VAN_LA_726827');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [tickets, setTickets] = useState<{index: number, owner: string}[]>([]);
  const [provider, setProvider] = useState<EthereumProvider | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Privy hooks
  const { authenticated } = usePrivy();
  
  // Initialize provider
  useEffect(() => {
    checkEthereumProvider();
  }, []);
  
  // Check for Ethereum provider
    const checkEthereumProvider = () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        setProvider(window.ethereum);
        
        if (window.ethereum.selectedAddress) {
          setConnected(true);
          setAddress(window.ethereum.selectedAddress);
        }
        
        if (window.ethereum.chainId) {
          setChainId(window.ethereum.chainId);
        }
        
        addLog("Ethereum provider detected");
      } else {
        addLog("No Ethereum provider detected");
      }
    };
  
  // Add a log message
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  const debugGame = async () => {
    if (!provider || !provider.request) {
      addLog("No provider available");
      return;
    }
    
    setLoading(true);
    addLog("Starting debug process...");
    
    try {
      // Check if contract exists
      addLog("Checking if contract exists...");
      const code = await provider.request({
        method: 'eth_getCode',
        params: [SCORE_SQUARE_ADDRESS, 'latest']
      });
      
      if (code && code !== '0x') {
        addLog(`Contract exists! Code length: ${(code as string).length - 2} bytes`);
      } else {
        addLog("Contract does not exist at the specified address");
        setLoading(false);
        return;
      }
      
      // Try to get game ID by event ID
      if (eventId) {
        addLog(`Fetching game ID for event: ${eventId}`);
        
        try {
          // Encode function call for getGameIdByEventId
          const functionSelector = '0x2a5a0575'; // keccak256("getGameIdByEventId(string)") first 4 bytes
          
          // Encode the string parameter
          const encoder = new TextEncoder();
          const eventIdBytes = encoder.encode(eventId);
          const eventIdHex = Array.from(eventIdBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          
          // Calculate the offset for the dynamic string parameter (32 bytes)
          const offsetHex = '0000000000000000000000000000000000000000000000000000000000000020';
          
          // Calculate the length of the string (in bytes)
          const lengthHex = eventIdBytes.length.toString(16).padStart(64, '0');
          
          // Pad the string data to a multiple of 32 bytes
          const paddedEventIdHex = eventIdHex.padEnd(Math.ceil(eventIdHex.length / 64) * 64, '0');
          
          // Construct the full calldata
          const calldata = functionSelector + offsetHex + lengthHex + paddedEventIdHex;
          
          // Make the eth_call
          const result = await provider.request({
            method: 'eth_call',
            params: [{
              to: SCORE_SQUARE_ADDRESS,
              data: '0x' + calldata
            }, 'latest']
          });
          
          // Parse the result
          const gameIdFromEvent = parseInt((result as string).slice(2), 16);
          addLog(`Game ID from getGameIdByEventId: ${gameIdFromEvent}`);
          
          if (gameIdFromEvent === 0) {
            addLog("No game found for event ID");
          } else {
            setGameId(gameIdFromEvent.toString());
            
            // Get game status
            await fetchGameStatus(gameIdFromEvent);
            
            // Get tickets
            await fetchTickets(gameIdFromEvent);
          }
        } catch (error) {
          addLog(`Error getting game ID by event ID: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Try to get game by ID
      if (gameId) {
        addLog(`Fetching game with ID: ${gameId}`);
        
        try {
          // Encode function call for getGame
          const functionSelector = '0xc4c2bfdc'; // keccak256("getGame(uint256)") first 4 bytes
          
          // Encode the uint256 parameter
          const gameIdHex = parseInt(gameId).toString(16).padStart(64, '0');
          
          // Construct the full calldata
          const calldata = functionSelector + gameIdHex;
          
          // Make the eth_call
          const result = await provider.request({
            method: 'eth_call',
            params: [{
              to: SCORE_SQUARE_ADDRESS,
              data: '0x' + calldata
            }, 'latest']
          });
          
          // Parse the result
          // This is complex because the result is a tuple with dynamic arrays
          // For simplicity, we'll just log the raw result
          addLog(`Raw game data: ${result}`);
          
          // TODO: Implement proper parsing of the complex return data
        } catch (error) {
          addLog(`Error fetching game by ID: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      addLog(`Error in debug process: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchGameStatus = async (gameId: number) => {
    if (!provider || !provider.request) return;
    
    addLog(`Fetching game status for ID: ${gameId}`);
    
    try {
      // Encode function call for getGameStatus
      const functionSelector = '0x0f1bf454'; // keccak256("getGameStatus(uint256)") first 4 bytes
      
      // Encode the uint256 parameter
      const gameIdHex = gameId.toString(16).padStart(64, '0');
      
      // Construct the full calldata
      const calldata = functionSelector + gameIdHex;
      
      // Make the eth_call
      const result = await provider.request({
        method: 'eth_call',
        params: [{
          to: SCORE_SQUARE_ADDRESS,
          data: '0x' + calldata
        }, 'latest']
      });
      
      // Parse the result
      // This is complex because the result includes dynamic arrays and strings
      // For simplicity, we'll just log the raw result
      addLog(`Raw game status: ${result}`);
      
      // TODO: Implement proper parsing of the complex return data
    } catch (error) {
      addLog(`Error fetching game status: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const fetchTickets = async (gameId: number) => {
    if (!provider || !provider.request) return;
    
    addLog(`Fetching tickets for game ID: ${gameId}`);
    
    try {
      // Encode function call for getTickets
      const functionSelector = '0x85d6bb81'; // keccak256("getAllTickets(uint256)") first 4 bytes
      
      // Encode the uint256 parameter
      const gameIdHex = gameId.toString(16).padStart(64, '0');
      
      // Construct the full calldata
      const calldata = functionSelector + gameIdHex;
      
      // Make the eth_call
      const result = await provider.request({
        method: 'eth_call',
        params: [{
          to: SCORE_SQUARE_ADDRESS,
          data: '0x' + calldata
        }, 'latest']
      });
      
      // Parse the result
      // This is complex because the result is a tuple of two dynamic arrays
      // For simplicity, we'll just log the raw result
      addLog(`Raw tickets data: ${result}`);
      
      // TODO: Implement proper parsing of the complex return data
    } catch (error) {
      addLog(`Error fetching tickets: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const connectWallet = async () => {
    if (!provider || !provider.request) {
      addLog("No provider available");
      return;
    }
    
    try {
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });
      
      if (Array.isArray(accounts) && accounts.length > 0) {
        setConnected(true);
        setAddress(accounts[0] as string);
        addLog(`Connected to wallet: ${accounts[0]}`);
      }
    } catch (error) {
      addLog(`Error connecting wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Contract Information</h2>
        <p>Contract: {SCORE_SQUARE_ADDRESS.substring(0, 6)}...{SCORE_SQUARE_ADDRESS.substring(SCORE_SQUARE_ADDRESS.length - 4)}</p>
        <p>Wallet: {connected ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "Not connected"}</p>
        <p>Chain ID: {chainId || "Unknown"}</p>
        
        {!connected && (
          <button 
            onClick={connectWallet}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Connect Wallet
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Debug by Event ID</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Event ID (e.g., usa_1_VAN_LA_726827)"
              className="flex-1 px-3 py-2 bg-gray-800 rounded text-white"
            />
            <button
              onClick={debugGame}
              disabled={loading || !eventId}
              className={`px-4 py-2 rounded ${loading || !eventId ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Debug
            </button>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-2">Debug by Game ID</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Game ID (e.g., 1)"
              className="flex-1 px-3 py-2 bg-gray-800 rounded text-white"
            />
            <button
              onClick={debugGame}
              disabled={loading || !gameId}
              className={`px-4 py-2 rounded ${loading || !gameId ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Debug
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Debug Logs</h2>
        <div className="bg-gray-800 p-4 rounded h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Click Debug to start.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 font-mono text-sm">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugGameComponent;
*/ 