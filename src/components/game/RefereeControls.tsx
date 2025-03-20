'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { SCORE_SQUARE_ADDRESS } from '../../lib/config';
import { useGameContext } from '../../context/GameContext'; // ✅ Import Game Context

interface RefereeControlsProps {
  gameId: number;
  refetchOnChainTickets: () => Promise<void>;
  selectedWinners: { halftime: number | null; final: number | null };
  clearWinners: () => void;
}

const RefereeControls: React.FC<RefereeControlsProps> = ({
  gameId,
  refetchOnChainTickets,
  selectedWinners,
  clearWinners,
}) => {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  // ✅ Use game context instead of managing state separately
  const { gameDataState } = useGameContext();

  const { writeContractAsync } = useWriteContract();

  // console.log("🟢 [RefereeControls] Rendering with gameId:", gameId);
  // console.log("🏟️ Game Data State:", gameDataState);
  // ✅ Use gameDataState instead of separate fetch
  const prizePool = gameDataState?.prizePool ?? BigInt(0);
  const prizeClaimed = gameDataState?.prizeClaimed ?? false;
  const isFinalized = Array.isArray(gameDataState?.winners) && gameDataState.winners.length > 0;
  const showDistributePrizes = isFinalized && prizePool > BigInt(0) && !prizeClaimed;
  // const deployerFeePercent = gameDataState?.deployerFeePercent ?? 0; // Extract deployer fee from state

// Convert fees from percentages to decimal values
// const communityFee = (Number(prizePool) * 4) / 100;
// const deployerFee = (Number(prizePool) * deployerFeePercent) / 100;

// Calculate final prize pool after fees
// const netPrizePool = Number(prizePool) - communityFee - deployerFee;


  const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash ? (txHash as `0x${string}`) : undefined,
  });

  useEffect(() => {
    if (isFinalized && !prizeClaimed) {
      console.log("🔄 Re-fetching game data to ensure distribute button visibility...");
      refetchOnChainTickets();
    }
  }, [isFinalized, prizeClaimed]);
  
  useEffect(() => {
    if (isTxConfirmed) {
      // console.log("🎉 Transaction confirmed! Refreshing game data...");
      setTxStatus('success');

      // ✅ Re-fetch Subgraph & On-Chain
      refetchOnChainTickets();
      setTimeout(() => {
        setTxHash(null); // ✅ Clear TX hash after refresh
      }, 3000);
    }
  }, [isTxConfirmed]);

  // ✅ Finalize Game (Step 1)
  const handleFinalizeGame = async () => {
    try {
      const winners = [];
      if (selectedWinners.halftime !== null) winners.push(selectedWinners.halftime);
      if (selectedWinners.final !== null) winners.push(selectedWinners.final);

      if (winners.length === 0) {
        alert("⚠️ Please select at least one winner before finalizing.");
        return;
      }

      const winnerPercentages = winners.length === 1 ? [100] : [25, 75];

      // console.log("⏳ Finalizing game with winners:", winners, "Percentages:", winnerPercentages);
      setTxStatus("pending");

      const tx = await writeContractAsync({
        address: SCORE_SQUARE_ADDRESS as `0x${string}`,
        abi: [
          {
            name: "finalizeGame",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "gameId", type: "uint256" },
              { name: "winningSquares", type: "uint8[]" },
              { name: "winnerPercentages", type: "uint8[]" },
            ],
            outputs: [],
          },
        ],
        functionName: "finalizeGame",
        args: [BigInt(gameId), winners, winnerPercentages],
      });

      // console.log("✅ finalizeGame Transaction Submitted:", tx);
      setTxHash(tx);
    } catch (error) {
      console.error("❌ Error calling finalizeGame:", error);
      setTxStatus("error");
    }
  };

  // ✅ Distribute Winnings (Step 2)
  const handleDistributeWinnings = async () => {
    try {
      // console.log("⏳ Distributing winnings for gameId:", gameId);
      setTxStatus("pending");
  
      const tx = await writeContractAsync({
        address: SCORE_SQUARE_ADDRESS as `0x${string}`,
        abi: [
          {
            name: "distributeWinnings",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [{ name: "gameId", type: "uint256" }],
            outputs: [],
          },
        ],
        functionName: "distributeWinnings",
        args: [BigInt(gameId)],
      });
  
      // console.log("✅ distributeWinnings Transaction Submitted:", tx);
      setTxHash(tx);
    } catch (error) {
      console.error("❌ Error calling distributeWinnings:", error);
      setTxStatus("error");
    }
  };
  
  // ✅ Ensure UI updates after distribute transaction
  useEffect(() => {
    if (isTxConfirmed) {
      // console.log("🎉 Transaction confirmed! Refreshing game data...");
      setTxStatus('success');
  
      // ✅ Re-fetch Game Data to update Grid
      refetchOnChainTickets();
  
      setTimeout(() => {
        setTxHash(null); // ✅ Clear TX hash after refresh
      }, 3000);
    }
  }, [isTxConfirmed]);
  
  // console.log("🎯 showDistributePrizes:", showDistributePrizes);

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-6 border border-yellow-500">
      <h3 className="text-xl font-bold text-white mb-3">Referee Controls</h3>

      {txStatus === "pending" && <p className="text-blue-400">⏳ Processing transaction...</p>}
      {txStatus === "success" && <p className="text-green-400">✅ Transaction confirmed!</p>}
      {txStatus === "error" && <p className="text-red-400">❌ Transaction failed.</p>}

      {/* Show Finalize Game & Cancel Buttons if game is active */}
      {!showDistributePrizes && (
        <>
          <div className="mt-4">
            <span className="text-gray-400">
              Select the halftime score first, then the final score. If the same score at the end of each half, only select one square.
            </span>
          </div>
          <button
            onClick={handleFinalizeGame}
            className="w-full py-2 px-4 rounded mt-4 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Finalize Game
          </button>

          <button
            onClick={clearWinners}
            className="w-full py-2 px-4 rounded mt-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </>
      )}

      {/* ✅ Show Distribute Prizes Button once game is finalized */}
      {showDistributePrizes && (
        <button
          onClick={handleDistributeWinnings}
          className="w-full py-2 px-4 rounded mt-4 bg-green-600 text-white hover:bg-green-700 transition-colors"
          disabled={txStatus === "pending"}
        >
          {txStatus === "pending" ? "Distributing..." : "Distribute Prizes"}
        </button>
      )}
    </div>
  );
};

export default RefereeControls;
