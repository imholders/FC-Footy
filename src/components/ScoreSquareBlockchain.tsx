import React, { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, isAddress, encodeFunctionData } from 'viem';
import { Info } from 'lucide-react';
import { createGame, GameData, GameState } from '../lib/kvScoreSquare';
import { SCORE_SQUARE_ADDRESS } from '../lib/config';

// ScoreSquare contract ABI (partial, only what we need for createGame)
const SCORE_SQUARE_ABI = [
  "function createGame(uint256 _squarePrice, string calldata _eventId, address _referee, uint8 _deployerFeePercent) external returns (uint256 gameId)",
  "function getGameIdByEventId(string calldata _eventId) external view returns (uint256)",
  "function getGameStatus(uint256 gameId) external view returns (bool active, address referee, uint256 squarePrice, uint8 ticketsSold, uint256 prizePool, uint8[] winningSquares, uint8[] winnerPercentages, bool prizeClaimed, string eventId, bool refunded)"
];

interface ScoreSquareBlockchainProps {
  home: string;
  away: string;
  refereeAddress?: string;
  onGameCreated: (gameId: string, contractGameId: string, deployerFee: number, refereeAddress: string) => void;
}

const ScoreSquareBlockchain: React.FC<ScoreSquareBlockchainProps> = ({ 
  home, 
  away, 
  refereeAddress = "",
  onGameCreated 
}) => {
  const [homeTeam, setHomeTeam] = useState<string>(home);
  const [awayTeam, setAwayTeam] = useState<string>(away);
  const [squarePrice, setSquarePrice] = useState<string>("0.01");
  const [deployerFeePercent, setDeployerFeePercent] = useState<number>(4);
  const [referee, setReferee] = useState<string>(refereeAddress);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { address } = useAccount();
  
  const { sendTransaction } = useSendTransaction({
    mutation: {
      onSuccess(data) {
        setTxHash(data);
        setMessage("Transaction submitted. Waiting for confirmation...");
        setLoading(true);
      },
      onError(error) {
        console.error("Error sending transaction:", error);
        setError(`Failed to send transaction: ${error instanceof Error ? error.message : String(error)}`);
        setLoading(false);
      }
    }
  });
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash: txHash,
    });
    
  // Effect to handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      setMessage("Game created successfully on the blockchain!");
      finalizeGameCreation(txHash);
    }
  }, [isConfirmed, txHash]);

  // Function to create the game in the local database after blockchain confirmation
  const finalizeGameCreation = async (transactionHash: `0x${string}`) => {
    try {
      // Create a unique game ID that includes the transaction hash
      const gameId = `${homeTeam}-${awayTeam}-${transactionHash.substring(0, 10)}`;
      
      // Initialize tickets
      const initialTickets = Array(25).fill(null).map((_, index) => ({
        boughtRCPreShuffle: `${Math.floor(index / 5)} - ${index % 5}`,
        owner: null,
      }));
      
      // Create the game in the local database
      const gameData: GameData = {
        gameId: gameId,
        homeTeam,
        awayTeam,
        costPerTicket: parseFloat(squarePrice),
        serviceFee: deployerFeePercent / 100,
        gameState: 'buying' as GameState,
        tickets: initialTickets,
        refereeId: 0, // Using refereeAddress for blockchain
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await createGame(gameData);
      
      // Call the onGameCreated callback
      onGameCreated(gameId, "pending", deployerFeePercent, referee);
      
      setLoading(false);
    } catch (err) {
      console.error("Error finalizing game creation:", err);
      setError("Failed to save game data after blockchain confirmation.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    
    if (!address) {
      setError("Please connect your wallet first");
      setLoading(false);
      return;
    }
    
    if (!referee || !isAddress(referee)) {
      setError("Please enter a valid referee address");
      setLoading(false);
      return;
    }

    try {
      // Create event ID from team names and timestamp
      console.log("Using refereeAddress for eventId:", referee);
      const eventId = `${homeTeam.replace(/[^a-zA-Z0-9]/g, '')}_vs_${awayTeam.replace(/[^a-zA-Z0-9]/g, '')}`;
      console.log("Generated eventId:", eventId);
      
      // Convert square price to wei
      const squarePriceWei = parseEther(squarePrice);
      
      // Prepare contract call data
      const data = encodeFunctionData({
        abi: SCORE_SQUARE_ABI,
        functionName: 'createGame',
        args: [
          squarePriceWei,
          eventId,
          referee,
          deployerFeePercent
        ]
      });
      
      // Call the contract method
      setMessage("Please confirm the transaction in your wallet...");
      
      // Execute the transaction
      sendTransaction({
        to: SCORE_SQUARE_ADDRESS as `0x${string}`,
        data: data as `0x${string}`,
      });
    } catch (err) {
      console.error("Error creating game:", err);
      setError(`Failed to create game: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  // Get block explorer URL based on network
  const getBlockExplorerUrl = () => {
    // This is a simplified version - in production, you'd detect the network
    return "https://basescan.org";
  };

  return (
    <div className="bg-purplePanel rounded shadow-md max-w-md mx-auto">
      <h1 className="flex items-center text-l text-notWhite font-bold mb-4">
        Create Score Square (Blockchain)
        <a href="https://hackmd.io/@kxf5aynZTPOR3a8ykiucig/fc-footy" target="_blank" rel="noopener noreferrer" className="ml-2">
          <Info className="w-4 h-4 text-deepPink hover:text-fontRed cursor-pointer" />
        </a>
      </h1>
      
      {message && <div className="mb-4 text-sm text-center text-green-500">{message}</div>}
      {error && <div className="mb-4 text-sm text-center text-red-500">{error}</div>}
      
      {isConfirming && txHash && (
        <div className="mb-4 text-sm text-center text-blue-500">
          Confirming transaction... 
          <a 
            href={`${getBlockExplorerUrl()}/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 underline"
          >
            View on Explorer
          </a>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-darkPurple p-4 rounded">
        <div>
          <label className="block font-medium mb-1 text-notWhite">Home Team:</label>
          <input 
            type="text" 
            value={homeTeam} 
            onChange={(e) => setHomeTeam(e.target.value)} 
            className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple" 
            required 
          />
        </div>
        
        <div>
          <label className="block font-medium mb-1 text-notWhite">Away Team:</label>
          <input 
            type="text" 
            value={awayTeam} 
            onChange={(e) => setAwayTeam(e.target.value)} 
            className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple" 
            required 
          />
        </div>
        
        <div>
          <label className="block font-medium mb-1 text-notWhite">Square Price (ETH):</label>
          <input 
            type="text" 
            value={squarePrice} 
            onChange={(e) => setSquarePrice(e.target.value)} 
            className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple" 
            required 
          />
        </div>
        
        <div>
          <label className="block font-medium mb-1 text-notWhite">Referee Address:</label>
          <input 
            type="text" 
            value={referee} 
            onChange={(e) => setReferee(e.target.value)} 
            placeholder="0x..." 
            className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple" 
            required 
          />
        </div>
        
        <div>
          <label className="block font-medium mb-1 text-notWhite">Deployer Fee (%):</label>
          <select 
            value={deployerFeePercent} 
            onChange={(e) => setDeployerFeePercent(Number(e.target.value))} 
            className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple" 
            required
          >
            {[...Array(10)].map((_, i) => (
              <option key={i} value={i + 1}>{i + 1}%</option>
            ))}
          </select>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          <p>Note: Creating a game requires a blockchain transaction.</p>
          <p>Community fee: 4% (fixed)</p>
          <p>Your wallet: {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "Not connected"}</p>
        </div>
        
        <button 
          type="submit" 
          disabled={loading || isConfirming || !address} 
          className={`w-full px-4 py-2 rounded ${
            loading || isConfirming || !address 
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white`}
        >
          {loading || isConfirming 
            ? 'Processing...' 
            : !address 
              ? 'Connect Wallet First' 
              : 'Create Game on Blockchain'}
        </button>
      </form>
    </div>
  );
};

export default ScoreSquareBlockchain; 