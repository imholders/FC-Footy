import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useContractRead } from 'wagmi';
import { debounce } from 'lodash';

// Import context
import { useGameContext } from '../context/GameContext';

// Import components
import GameMetadataCard from './game/GameMetadataCard';
import SquareGrid from './game/SquareGrid';
import CartSection from './game/CartSection';
import LoadingSpinner from './game/LoadingSpinner';
import ErrorDisplay from './game/ErrorDisplay';
import NoGameData from './game/NoGameData';
import RefereeCard from './game/RefereeCard';
import RefereeControls from './game/RefereeControls';

// Import contract config
import { SCORE_SQUARE_ADDRESS } from '../lib/config';

interface BlockchainScoreSquareDisplayProps {
  eventId: string;
}

const ABI = [
  {
    name: "getAllTickets",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gameId", type: "uint256" }],
    outputs: [
      { name: "ticketNumbers", type: "uint8[]" },
      { name: "owners", type: "address[]" }
    ],
  },
];

const ActualBlockchainScoreSquareDisplay: React.FC<BlockchainScoreSquareDisplayProps> = ({ eventId }) => {
  const { gameDataState, loading, setLoading, error, setError } = useGameContext();

  const [cart, setCart] = useState<number[]>([]);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [derivedPlayers, setDerivedPlayers] = useState<(string | null)[]>(Array(25).fill(null));
  const [selectedWinners, setSelectedWinners] = useState<{ halftime: number | null; final: number | null }>({
    halftime: null,
    final: null,
  });
  const [forceUpdate, setForceUpdate] = useState(0);
  const ticketsSold = gameDataState?.ticketsSold ?? 0; // ✅ Extract ticketsSold safely

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const { isLoading: isTxPending, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash ? (txHash as `0x${string}`) : undefined,
  });

  const isReferee = gameDataState?.referee?.toLowerCase() === address?.toLowerCase();
  const gameState = gameDataState
    ? gameDataState.refunded
      ? "cancelled"
      : gameDataState.prizeClaimed
      ? "completed"
      : gameDataState.ticketsSold === 25
      ? "waiting for VAR"
      : "active"
    : "loading";

  // Fetch on-chain tickets
  const { data: onChainTickets, refetch: refetchOnChainTickets } = useContractRead({
    address: SCORE_SQUARE_ADDRESS as `0x${string}`,
    abi: ABI,
    functionName: "getAllTickets",
    args: gameDataState?.gameId ? [gameDataState.gameId] : undefined,
  });

  const safeOnChainTickets: [number[], string[]] = Array.isArray(onChainTickets) && onChainTickets.length === 2
    ? (onChainTickets as [number[], string[]])
    : [[], []];

  const updatePlayers = debounce((tickets: [number[], string[]]) => {
    if (!Array.isArray(tickets) || tickets.length !== 2) return;
    
    const updatedPlayers: (string | null)[] = Array(25).fill(null);
    tickets[0].forEach((squareIndex: number, i: number) => {
      updatedPlayers[squareIndex] = tickets[1][i] || null;
    });
    setDerivedPlayers(updatedPlayers);
  }, 5000);

  // ✅ FIXED: Prevent infinite loop
  useEffect(() => {
    if (safeOnChainTickets[0].length > 0) {
      setForceUpdate(prev => prev + 1);
    }
  }, [safeOnChainTickets]);

  // ✅ FIXED: Prevent unnecessary re-renders
  useEffect(() => {
    if (isTxConfirmed) {
      setTxStatus("✅ Tickets successfully purchased!");
      setCart([]);
      setTimeout(() => setTxStatus(null), 5000);
    }
  }, [isTxConfirmed]);

  useEffect(() => {
    updatePlayers(safeOnChainTickets);
  }, [safeOnChainTickets]);

  // ✅ FIXED: Ensure polling stops when needed
  useEffect(() => {
    if (!gameDataState || gameDataState.prizeClaimed) return;

    const interval = setInterval(() => {
      refetchOnChainTickets();
    }, 5000);

    return () => clearInterval(interval);
  }, [gameDataState?.prizeClaimed]);

  const handleBuyTickets = async () => {
    if (!gameDataState || cart.length === 0) {
      alert("Please select at least one square.");
      return;
    }

    try {
      setTxStatus("⏳ Waiting for wallet confirmation...");
      setLoadingStartTime(Date.now());

      const txResponse = await writeContractAsync({
        address: SCORE_SQUARE_ADDRESS as `0x${string}`,
        abi: [
          {
            name: "buyTickets",
            type: "function",
            stateMutability: "payable",
            inputs: [{ name: "gameId", type: "uint256" }, { name: "numTickets", type: "uint8" }],
            outputs: [],
          },
        ],
        functionName: "buyTickets",
        args: [BigInt(gameDataState.gameId), cart.length],
        value: BigInt(gameDataState.squarePrice) * BigInt(cart.length),
      });

      if (!txResponse) {
        throw new Error("❌ Transaction failed or was rejected.");
      }

      setTxHash(txResponse);
      setTxStatus("🚀 Transaction submitted! Waiting for confirmation...");
    } catch (error) {
      console.error("❌ Error in handleBuyTickets:", error);
      setTxStatus("❌ Transaction failed or rejected.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {loading ? (
        <LoadingSpinner 
          gameDataState={gameDataState} 
          loadingStartTime={loadingStartTime} 
          setLoading={setLoading} 
          setError={setError}
        />
      ) : error ? (
        <ErrorDisplay error={error} hasValidEventId={!!eventId} refreshGameData={refetchOnChainTickets} />
      ) : !gameDataState ? (
        <NoGameData refreshGameData={refetchOnChainTickets} />
      ) : (
        <div>
          <GameMetadataCard />
          <RefereeCard referee={gameDataState.referee} />

          {txStatus && <p className="text-center text-lg font-semibold text-blue-500">{txStatus}</p>}
          
          {isReferee && gameState === "waiting for VAR" && (
            <RefereeControls
              gameId={gameDataState.gameId}
              refetchOnChainTickets={() => refetchOnChainTickets().then(() => {})} // ✅ Ensures Promise<void>
              selectedWinners={selectedWinners}
              clearWinners={() => setSelectedWinners({ halftime: null, final: null })}
            />
          )}

          <SquareGrid
            key={forceUpdate}
            players={derivedPlayers}
            cart={cart}
            isReferee={isReferee}
            gameState={gameState}
            selectedWinners={selectedWinners}
            handleSquareClick={(index) => setCart([...cart, index])}
            handleTapSquare={(index) => {
              if (isReferee && gameState === "waiting for VAR") {
                setSelectedWinners((prev) => ({
                  ...prev,
                  halftime: index,
                }));
              }
            }}
          />
          {ticketsSold < 25 && (

          <CartSection
            cart={cart}
            squarePrice={BigInt(gameDataState.squarePrice || "0")} // ✅ Ensures valid `BigInt`
            handleBuyTickets={handleBuyTickets}
            isBuying={isTxPending}
            removeFromCart={(index) => setCart(cart.filter(i => i !== index))}
            clearCart={() => setCart([])}
          />
          )}
        </div>
      )}
    </div>
  );
};

export default ActualBlockchainScoreSquareDisplay;
