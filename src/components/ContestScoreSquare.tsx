import React, { useState, useEffect, useRef } from 'react';
import frameSdk from "@farcaster/frame-sdk";
import ScoreGrid from './ui/ScoreGrid';
import { usePrivy } from '@privy-io/react-auth';
import { Ticket } from 'lucide-react';
import {
  getGame,
  getGamesByPrefix,
  purchaseTickets,
  randomizeBoard,
  submitFinalScore,
  claimPrize,
  attestPrizePaid,
  GameState,
  TicketType,
  GameData,
} from '../lib/kvScoreSquare';
import ContestScoreSquareCreate from './ContestScoreSquareCreate';
import WarpcastShareButton from './ui/WarpcastShareButton';
import { fetchFanUserData } from './utils/fetchFCProfile';
// import { toPng } from 'html-to-image';
import { ethers } from 'ethers';
import { useSendTransaction, useWaitForTransactionReceipt, useAccount } from 'wagmi';
// import GetBalance from './ui/Balance';

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const erc20ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)"
];

interface AppProps {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}

interface FanUserData {
  fid: number;
  USER_DATA_TYPE_DISPLAY: string[];
  username: string;
  pfp: string;
  [key: string]: unknown;
}

interface TransactionError extends Error {
  code?: string; // Optional error code (if applicable)
  reason?: string; // Specific reason for transaction failure
  details?: string; // Additional details
}

interface DatabaseError extends Error {
  code?: string;
  details?: string;
}

interface PayoutError extends Error {
  code?: string; // Optional error code for specific blockchain errors
  reason?: string; // Human-readable reason for failure
  details?: string; // Any additional technical details
}

export type ViewProfileOptions = {
  fid: string;
};

// Animated dots component.
const LoadingDots: React.FC = () => {
  return (
    <span className="loading-dots inline-block">
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
      <style jsx>{`
        .loading-dots .dot {
          opacity: 0;
          animation: blink 1.4s infinite both;
          margin: 0 2px;
          font-weight: bold;
        }
        .loading-dots .dot:nth-child(1) { animation-delay: 0s; }
        .loading-dots .dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%, 20%, 100% { opacity: 0; } 50% { opacity: 1; } }
      `}</style>
    </span>
  );
};

// Utility function to truncate addresses/hashes.
const truncateAddress = (address: string, len = 10): string =>
  `${address.substring(0, len)}...${address.substring(address.length - len)}`;

const App: React.FC<AppProps> = ({ home, away, homeScore, awayScore }) => {
  // Game-related state.
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [gameId, setCurrentGameId] = useState<string>(`${home}-${away}`);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [boardPositions, setBoardPositions] = useState<TicketType[]>([]);
  const [gameState, setGameState] = useState<GameState>('buying');
  const [costPerTicket, setCostPerTicket] = useState<number>(1);
  const [serviceFee, setServiceFee] = useState<number>(0.04);
  const [refereeId, setRefereeId] = useState<number>(4163);
  const [homeTeam, setHomeTeam] = useState<string>("");
  const [awayTeam, setAwayTeam] = useState<string>("");
  const [isContextLoaded, setIsContextLoaded] = useState<boolean>(false);

  // Other game state.
  const [team1Score, setTeam1Score] = useState<number | null>(homeScore);
  const [team2Score, setTeam2Score] = useState<number | null>(awayScore);
  const [winningTicket, setWinningTicket] = useState<number | null>(null);
  const [cart, setCart] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refereeFcData, setRefereeFcData] = useState<FanUserData | null>(null);
  const [prizeClaimed, setPrizeClaimed] = useState<boolean>(false);
  const [prizePaid, setPrizePaid] = useState<boolean>(false);
  const [winnerFcData, setWinnerFcData] = useState<FanUserData | null>(null);

  // Transaction state.
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>("");
  const [txStatusType, setTxStatusType] = useState<"failure" | "success" | "info">("info");
  // "buy" for ticket purchase, "payout" for winner payout.
  const [txType, setTxType] = useState<"buy" | "payout">("buy");

  const { user } = usePrivy();
  const { address: walletAddress } = useAccount();
  const farcasterAccount = user?.linkedAccounts.find(account => account.type === 'farcaster');
  const playerName = farcasterAccount?.username || '';
  const playerPfp = farcasterAccount?.pfp || '/default-avatar.png';
  const playerFid = farcasterAccount?.fid || 0;
  const cardRef = useRef<HTMLDivElement>(null);
  
  // The payment address (recipient for ticket purchase) remains fixed.
  const PAYMENT_ADDRESS = "0xDf087B724174A3E4eD2338C0798193932E851F1b";

  // Calculate USDC amount.
  const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
  const effectiveCostPerTicket = TEST_MODE ? 1e-6 : costPerTicket;
  const totalCostUSDC = cart.length * effectiveCostPerTicket;
  const totalCostUSDCUnits = TEST_MODE
    ? BigInt(1)
    : BigInt(Math.floor(totalCostUSDC * 1e6));

  // Create an ethers Interface to encode transfer calls.
  const contractInterface = new ethers.Interface(erc20ABI);
  // For ticket purchase.
  const purchaseData = contractInterface.encodeFunctionData("transfer", [PAYMENT_ADDRESS, totalCostUSDCUnits]);
  // Use useSendTransaction to send transactions.
  const { sendTransaction, data: txData, error: txError, status } = useSendTransaction();
  // Wait for transaction receipt.
  const isTxLoading = status === 'pending';
  // Wait for transaction receipt.
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
  useWaitForTransactionReceipt({ hash: txData as `0x${string}` });
  // When a transaction is initiated.

  useEffect(() => {
    if (txData) {
      setTxHash(txData as string);
      setTxStatus(txType === "buy" ? "Transaction sent, waiting for confirmation..." : "Payout transaction sent, waiting for confirmation...");
      setTxStatusType("info");
    }
  }, [txData, txType]);

  // When the transaction is confirmed.
  useEffect(() => {
    if (txHash && isConfirmed) {
      if (txType === "buy") {
        (async () => {
          try {
            setTxStatus("Transaction confirmed! Updating tickets...");
            setTxStatusType("info");
            // Update tickets in KV DB with wallet address and tx hash.
            await purchaseTickets(gameId, cart, playerFid, playerPfp, walletAddress, txHash);
            const updatedGame = await getGame(gameId);
            if (updatedGame) {
              setTickets(updatedGame.tickets);
              if (updatedGame.tickets.every(ticket => ticket.owner !== null)) {
                await randomizeBoard(gameId);
                const randomizedGame = await getGame(gameId);
                if (randomizedGame) {
                  setBoardPositions(randomizedGame.boardPositions || []);
                  setGameState(randomizedGame.gameState);
                  setTimeout(() => {
                    setGameState('playing');
                  }, 3000);
                }
              }
            }
            setCart([]);
            setTxStatus("Purchase successful!");
            setTxStatusType("success");
            setTxHash(null);
          } catch (dbError: unknown) {
            if ((dbError as DatabaseError).code) {
              const customError = dbError as DatabaseError;
              console.error(`DB Error Code: ${customError.code}, Details: ${customError.details}`);
            } else if (dbError instanceof Error) {
              console.error("Standard DB Error:", dbError.message);
            } else {
              console.error("Unknown DB Error:", dbError);
            }
          }
        })();
      } else if (txType === "payout") {
        (async () => {
          try {
            setTxStatus("Payout transaction confirmed! Marking prize as paid...");
            setTxStatusType("info");
            // Update the DB to mark the prize as paid.
            await attestPrizePaid(gameId);
            const updatedGame = await getGame(gameId);
            if (updatedGame) {
              setPrizePaid(updatedGame.prizePaid || false);
            }
            setTxStatus("Payout successful!");
            setTxStatusType("success");
            setTxHash(null);
          } catch (dbError: unknown) {
            if ((dbError as DatabaseError).code) {
              const customError = dbError as DatabaseError;
              console.error(`DB Error Code: ${customError.code}, Details: ${customError.details}`);
              setTxStatus(`Database error: ${customError.details}`);
              setTxStatusType("failure");
            } else if (dbError instanceof Error) {
              console.error("Standard Error during payout:", dbError.message);
              setTxStatus("Payout failed: " + dbError.message);
              setTxStatusType("failure");
            } else {
              console.error("Unknown Error Type:", dbError);
              setTxStatus("An unknown error occurred during payout.");
              setTxStatusType("failure");
            }
          }
        })();
      }
    }
  }, [txHash, isConfirmed, txType, gameId, cart, playerFid, playerPfp, walletAddress]);

  // Handle transaction errors.
  useEffect(() => {
    if (txError) {
      console.error("Transaction error:", txError);
      setTxStatus("Transaction failed: " + txError.message);
      setTxStatusType("failure");
    }
  }, [txError]);

  // handleDownloadImage remains unchanged.
/*   const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current);
      console.log('Image data URL:', dataUrl);
    } catch (error) {
      console.error('Failed to generate image', error);
    }
  }; */

  const handleGameCreated = async (newGameId: string) => {
    setSelectedGameId(newGameId);
    setCurrentGameId(newGameId);
    try {
      const createdGame = await getGame(newGameId);
      if (createdGame) {
        setTickets(createdGame.tickets);
        setBoardPositions(createdGame.boardPositions || []);
        setGameState(createdGame.gameState);
        setCostPerTicket(createdGame.costPerTicket);
        setServiceFee(createdGame.serviceFee);
      }
    } catch (error) {
      console.error('Error loading newly created game:', error);
    }
  };

  useEffect(() => {
    const getRefereeData = async () => {
      if (!refereeId) return;
      try {
        const profileData = await fetchFanUserData(refereeId);
        const formattedData: FanUserData = {
          fid: refereeId,
          USER_DATA_TYPE_DISPLAY: Array.isArray(profileData.USER_DATA_TYPE_DISPLAY)
            ? profileData.USER_DATA_TYPE_DISPLAY
            : [],
          username: typeof profileData.username === "string"
            ? profileData.username
            : profileData.USER_DATA_TYPE_DISPLAY?.[0] || "Unknown",
          pfp: typeof profileData.pfp === "string" ? profileData.pfp : "/default-avatar.png",
          ...profileData,
        };
        setRefereeFcData(formattedData);
      } catch (error) {
        console.error("Error fetching referee data:", error);
      }
    };
    getRefereeData();
  }, [refereeId]);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const ctx = await frameSdk.context;
        console.log("Farcaster context loaded:",JSON.stringify(ctx, null, 2));
        if (!ctx) {
          console.log("Farcaster context returned null or undefined.");
          return;
        }
        setIsContextLoaded(true);
      } catch (error) {
        console.error("Failed to load Farcaster context:", error);
      }
    };
    if (!isContextLoaded) {
      loadContext();
    }
  }, [isContextLoaded]);

  useEffect(() => {
    async function loadGame() {
      try {
        const games: GameData[] = await getGamesByPrefix(gameId);
        if (games.length > 0) {
          const game = games[0];
          setCurrentGameId(game.gameId);
          setSelectedGameId(game.gameId);
          setTickets(game.tickets);
          setBoardPositions(game.boardPositions || []);
          setGameState(game.gameState);
          setCostPerTicket(game.costPerTicket);
          setServiceFee(game.serviceFee);
          setRefereeId(game.refereeId);
          setHomeTeam(game.homeTeam);
          setAwayTeam(game.awayTeam);
          if (game.finalScore) {
            setTeam1Score(Number(game.finalScore.home));
            setTeam2Score(Number(game.finalScore.away));
          }
          if (game.winningTicket !== undefined) {
            setWinningTicket(Number(game.winningTicket));
          }
          if (typeof game.prizeClaimed === 'boolean') {
            setPrizeClaimed(game.prizeClaimed);
          }
          if (typeof game.prizePaid === 'boolean') {
            setPrizePaid(game.prizePaid);
          }
        } else {
          setHomeTeam(home);
          setAwayTeam(away);
        }
      } catch (error) {
        console.error('Error loading game:', error);
      } finally {
        setLoading(false);
      }
    }
    loadGame();
  }, [gameId, home, away, homeScore, awayScore]);

  useEffect(() => {
    const fetchWinnerData = async () => {
      if (winningTicket === null || !boardPositions[winningTicket]?.owner) {
        console.warn("Skipping winner fetch: No valid winning ticket or owner.");
        return;
      }
  
      try {
        console.log("Fetching winner profile for:", boardPositions[winningTicket]?.owner);
        const profileData = await fetchFanUserData(boardPositions[winningTicket].owner);
  
        const formattedData: FanUserData = {
          fid: boardPositions[winningTicket].owner,
          USER_DATA_TYPE_DISPLAY: Array.isArray(profileData.USER_DATA_TYPE_DISPLAY)
            ? profileData.USER_DATA_TYPE_DISPLAY
            : [],
          username: typeof profileData.username === "string"
            ? profileData.username
            : profileData.USER_DATA_TYPE_DISPLAY?.[0] || "Unknown",
          pfp: typeof profileData.pfp === "string" ? profileData.pfp : "/defifa_spinner.png",
          ...profileData,
        };
  
        setWinnerFcData(formattedData);
        console.log("Winner data set:", formattedData);
      } catch (error) {
        console.error("Error fetching winner fan user data:", error);
      }
    };
  
    if (gameState === 'completed' && winningTicket !== null) {
      fetchWinnerData();
    }
  }, [winningTicket, boardPositions, gameState]);

  const TransactionMessages = () => (
    <>
      {txStatus && (
        <TransactionStatus
          status={txStatus}
          txHash={txHash}
          statusType={txStatusType}
          onClear={clearTxStatus}
        />
      )}
  
      {isTxLoading && (
        <p className="text-lightPurple text-center my-2">
          ⚽️ Warming up on the sidelines... your transaction is about to score!
        </p>
      )}

      {isConfirming && (
        <p className="text-lightPurple text-center my-2">
          🧐 VAR is checking the on-chain replay... hold tight for confirmation!
        </p>
      )}
    </>
  );
  
  if (loading) {
    return <div className="p-4">Loading game data...</div>;
  }

  const incrementCart = () => {
    for (let i = 0; i < tickets.length; i++) {
      if (!tickets[i].owner && !cart.includes(i)) {
        setCart(prevCart => [...prevCart, i]);
        break;
      }
    }
  };

  const decrementCart = () => {
    if (cart.length > 0) {
      const newCart = [...cart];
      newCart.pop();
      setCart(newCart);
    }
  };

  // Ticket purchase: send USDC transaction.
  const finalizePurchase = async () => {
    if (!playerName) {
      alert('Please login with Farcaster first');
      return;
    }
    if (cart.length === 0) {
      alert('Please select at least one ticket');
      return;
    }
    try {
      setTxStatus("");
      setTxHash(null);
      setTxType("buy");
      // Send the transaction with the encoded purchase call.
      sendTransaction({ to: USDC_ADDRESS, data: purchaseData as `0x${string}` });
      console.log("USDC transaction initiated for ticket purchase");
    } catch (error: unknown) {
      if ((error as TransactionError).code) {
        const txError = error as TransactionError;
        console.error(`Transaction Error Code: ${txError.code}, Reason: ${txError.reason}, Details: ${txError.details}`);
        setTxStatus(`Transaction failed: ${txError.reason || txError.message}`);
        setTxStatusType("failure");
      } else if (error instanceof Error) {
        console.error("Transaction error:", error.message);
        setTxStatus("Transaction failed: " + error.message);
        setTxStatusType("failure");
      } else {
        console.error("Unknown transaction error:", error);
        setTxStatus("An unknown error occurred during the transaction.");
        setTxStatusType("failure");
      }
    }    
  };

  // Payout: Trigger a USDC transfer to the winner's wallet.
  const handlePayout = async () => {
    if (user?.farcaster?.fid !== refereeId) {
      alert('Only the referee can perform the payout.');
      return;
    }
    const winningTicketData = boardPositions[winningTicket || 0];
    if (!winningTicketData?.walletAddress) {
      alert('No winning ticket wallet address found.');
      return;
    }
    const pot = getPotTotal();
    const payoutAmount = pot * (1 - serviceFee); // Calculate payout as pot * (1 - fee)
    const payoutAmountUnits = BigInt(Math.floor(payoutAmount * 1e6));
    const winnerWallet = winningTicketData.walletAddress;
    const payoutData = contractInterface
    .encodeFunctionData("transfer", [winnerWallet, payoutAmountUnits]) as `0x${string}`;
  
  
    try {
      setTxStatus("");
      setTxHash(null);
      setTxType("payout");
      // Send the payout transaction. This will trigger a wallet popup for the referee.
      sendTransaction({ to: USDC_ADDRESS, data: payoutData });
      console.log("USDC payout transaction initiated");
    } catch (error: unknown) {
      if ((error as PayoutError).code) {
        const payoutError = error as PayoutError;
        console.error(
          `Payout Error Code: ${payoutError.code}, Reason: ${payoutError.reason}, Details: ${payoutError.details}`
        );
        setTxStatus(`Payout failed: ${payoutError.reason || payoutError.message}`);
        setTxStatusType("failure");
      } else if (error instanceof Error) {
        console.error("Payout transaction error:", error.message);
        setTxStatus("Payout transaction failed: " + error.message);
        setTxStatusType("failure");
      } else {
        console.error("Unknown payout error:", error);
        setTxStatus("An unknown error occurred during the payout transaction.");
        setTxStatusType("failure");
      }
    }    
  };

  const handleSubmitScore = async () => {
    if (user?.farcaster?.fid !== refereeId) {
      alert('Only the referee can submit the score.');
      return;
    }
    if (team1Score === null || team2Score === null) {
      alert('Please enter both scores');
      return;
    }
    try {
      await submitFinalScore(gameId, { home: Number(team1Score), away: Number(team2Score) }, refereeId);
      const updatedGame = await getGame(gameId);
      if (updatedGame) {
        setWinningTicket(updatedGame.winningTicket || null);
        setGameState('completed');
        setSelectedGameId(updatedGame.gameId);
        setBoardPositions(updatedGame.boardPositions || []);
        if (updatedGame.finalScore) {
          setTeam1Score(updatedGame.finalScore.home);
          setTeam2Score(updatedGame.finalScore.away);
        }
      }
    } catch (error) {
      console.error('Error submitting final score:', error);
    }
  };

  const handleClaimPrize = async () => {
    try {
      await claimPrize(gameId);
      setPrizeClaimed(true);
      const updatedGame = await getGame(gameId);
      if (updatedGame) {
        setBoardPositions(updatedGame.boardPositions || []);
        setGameState(updatedGame.gameState);
      }
      if (refereeId && winnerFcData) {
        const winnerUsername = winnerFcData?.username || `FID:${winnerFcData?.fid}`;
        const castText = `🏆 @${winnerUsername} has claimed their prize for ${homeTeam} vs ${awayTeam}!
        Please settle the payout in https://warpcast.com/~/frames/launch?domain=fc-footy.vercel.app ⚡`;
        const warpcastUrl = `https://warpcast.com/~/inbox/create/${refereeId}?text=${encodeURIComponent(castText)}`;
        frameSdk.actions.openUrl(warpcastUrl);
      }
    } catch (error) {
      console.error("Error claiming prize:", error);
    }
  };

  const getPotTotal = () => {
    const purchasedCount = tickets.filter(t => t.owner !== null).length;
    return purchasedCount * costPerTicket;
  };

  const TransactionStatus: React.FC<{
    status: string;
    txHash: string | null;
    statusType: "failure" | "success" | "info";
    onClear: () => void;
  }> = ({ status, txHash, statusType, onClear }) => {
    let textColorClass = "";
    if (statusType === "failure") {
      textColorClass = "text-fontRed";
    } else if (statusType === "success") {
      textColorClass = "text-limeGreen";
    } else if (statusType === "info") {
      textColorClass = "text-notWhite";
    }
    return (
      txStatus && (
        <div className={`mb-4 p-2 bg-darkPurple ${textColorClass} text-sm flex items-center justify-between`}>
          <div className="flex-1 overflow-hidden">
            <span
              className="truncate block max-w-full"
              title={status} // Tooltip with full message on hover
            >
              {status}{" "}
              {txHash && (
                <span>
                  (Tx Hash: {truncateAddress(txHash)})
                </span>
              )}
            </span>
          </div>
    
          {/* Buttons Side by Side */}
          <div className="flex items-center gap-2 ml-2">
            {txHash && (
              <button
                onClick={() => window.open(`https://basescan.org/tx/${txHash}`, "_blank")}
                className="text-limeGreen underline"
              >
                View on BaseScan
              </button>
            )}
            <button onClick={onClear} className="text-blue-600 underline">
              Clear
            </button>
          </div>
        </div>
      )
    );
    
         
  };

  const clearTxStatus = () => {
    setTxStatus("");
    setTxHash(null);
  };

  return (
    <div className="mb-4 bg-purplePanel">
      <div className="max-w-4xl mx-auto">
        {!selectedGameId ? (
          <div className="bg-purplePanel rounded-xl shadow-xl mb-4">
            <p className="text-sm text-center text-lightPurple mb-4">
              No Score Square games have been deployed for this match.
            </p>
            {user?.farcaster?.username === 'kmacb.eth' || user?.farcaster?.username === 'gabedev.eth' ? (
              <ContestScoreSquareCreate
                home={homeTeam}
                away={awayTeam}
                refereeId={user.farcaster.fid || 4163}
                onGameCreated={handleGameCreated}
              />
            ) : (
              <WarpcastShareButton
                selectedMatch={{
                  competitorsLong: `${home} vs ${away}`,
                  homeTeam: "ffs why can't I deploy a Score Square game?",
                  awayTeam: "Thought kmac was a decentralization maxi?!",
                  homeScore: 0,
                  awayScore: 0,
                  clock: "NOW! Get this deployed now! devs do something ",
                  homeLogo: "",
                  awayLogo: "",
                  eventStarted: false,
                  keyMoments: []
                }}
                buttonText="Deploy Game"
              />
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold text-notWhite flex items-center gap-1">
                  {homeTeam} vs {awayTeam}
                </h1>
                <span className="text-sm text-lightPurple">
                  Referee: 
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      await frameSdk.actions.viewProfile({ fid: refereeId });
                    }}
                    className="text-lightPurple underline cursor-pointer ml-1"
                  >
                    {refereeFcData
                      ? refereeFcData.USER_DATA_TYPE_DISPLAY[0]
                      : <LoadingDots />}
                  </button>
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xl text-limeGreenOpacity font-semibold">
                  Pot: ${getPotTotal()}
                </span>
                <span className="text-sm text-lightPurple">
                  Tickets: ${costPerTicket}
                </span>
              </div>
            </div>
            {gameState === 'buying' && (
              <>
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex items-center gap-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <img src={playerPfp} alt="Player Avatar" className="rounded-full w-10 h-10" />
                    <span className="font-semibold text-lg">{playerName}
                    <p className="text-sm text-limeGreenOpacity">
                      games use USDC on Base. You are trusting the referee!
                    </p></span>
                  </div>
                </div>

                <div className="mb-3 text-left text-md text-lightPurple">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-2">
                      <Ticket className="h-10 w-10 rotate-90 text-limeGreenOpacity" />
                    </div>
                    <div>
                      <p>
                        <span className="font-bold">Step 1: Grab your ticket!</span> Once every square is claimed, the board will shuffle and reveal its final layout. The ticket matching the final score takes home the pot!
                      </p>
                      <p className="text-fontRed mt-2">
                        <span className="text-fontRed font-bold">Heads up:</span> there’s a {serviceFee * 100}% service fee on payouts. Gotta keep the lights on!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex flex-col items-center gap-4">
  {/* Ticket Counter Display */}
  <div className="flex items-center gap-4 bg-darkPurple p-3 rounded-lg shadow-lg">
    <button
      onClick={decrementCart}
      className="w-10 h-10 bg-deepPink rounded-full flex items-center justify-center text-xl text-white hover:bg-fontRed transition"
    >
      –
    </button>
    <span className="text-2xl font-extrabold text-notWhite w-12 text-center">
      {cart.length}
    </span>
    <button
      onClick={incrementCart}
      className="w-10 h-10 bg-deepPink rounded-full flex items-center justify-center text-xl text-white hover:bg-fontRed transition"
    >
      +
    </button>
  </div>

  {/* Purchase Button */}
  <button
    onClick={finalizePurchase}
    className="w-full max-w-xs py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg text-lg font-bold"
  >
    Buy Tickets
  </button>
</div>


                {/* Transaction status and loading messages */}
                <TransactionMessages />
              </>
            )}


            {gameState === 'playing' && (
              <div className="mb-3 text-left text-sm text-fontRed">
                <span className="font-bold mr-1">Step 2:</span> 
                The referee enters the final scores for each team. The winning ticket is determined by the grid cell corresponding to these scores.
              </div>
            )}
            {gameState === 'completed' && (
              <div className="mb-3 text-center text-xs text-fontRed">
                <p>Game Complete! The highlighted ticket is the winner.</p>
              </div>
            )}
            <div className="flex mb-4">
              <ScoreGrid
                homeScore={homeScore}
                awayScore={awayScore}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                tickets={tickets}
                boardPositions={boardPositions}
                gameState={gameState}
                winningTicket={winningTicket}
              />
            </div>
            {gameState === 'placing' && (
              <div className="text-center text-base font-semibold text-fontRed animate-pulse">
                Randomly placing tickets on the board...
              </div>
            )}
            {gameState === 'playing' && (
              <div className="bg-darkPurple p-3 rounded-lg">
                <h2 className="text-base text-notWhite font-semibold mb-3">Referee submits Final Score</h2>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-lightPurple mb-1">Home Team</label>
                    <select className="w-full px-2 py-1 border bg-darkPurple rounded text-xs" value={team1Score || 0} onChange={(e) => setTeam1Score(Number(e.target.value))}>
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-lightPurple mb-1">Away Team</label>
                    <select className="w-full px-2 py-1 border bg-darkPurple rounded text-xs" value={team2Score || 0} onChange={(e) => setTeam2Score(Number(e.target.value))}>
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                </div>
                  {gameState === 'playing' && user?.farcaster?.fid === refereeId && (
                    <button
                      onClick={handleSubmitScore}
                      className="w-full bg-deepPink text-white py-2 p-4 rounded-lg hover:bg-fontRed transition text-s"
                    >
                      Submit Final Score
                    </button>
                  )}
              </div>
            )}
            {gameState === 'playing' && user?.farcaster?.fid !== refereeId && (
              <div className="bg-darkPurple p-3 rounded-lg text-center text-xs text-lightPurple">
                Final score submission is only available to the referee. Please contact {refereeId}
              </div>
            )}
            <div ref={cardRef}>
              {gameState === 'completed' && winningTicket !== null && (
                <div className="p-6 rounded-3xl border-4 border-double shadow-2xl" style={{ backgroundColor: '#010513', borderColor: '#FEA282', fontFamily: '"VT323", monospace' }}>
                  <div className="mb-4 text-center">
                    <h3 className="text-2xl font-bold uppercase tracking-wide" style={{ color: '#FEA282' }}>
                      {homeTeam} <span className="mx-2" style={{ color: '#EC017C' }}>vs</span> {awayTeam}
                    </h3>
                  </div>
                  <div className="mb-4 text-center">
                    <h2 className="text-3xl font-extrabold drop-shadow-xl" style={{ color: '#FEA282' }}>
                      {team1Score} - {team2Score}
                    </h2>
                  </div>
                  <div className="flex flex-col items-center space-y-3">
                    <span className="text-lg font-bold uppercase tracking-widest" style={{ color: 'rgba(162, 230, 52, 0.7)' }}>
                      Game Winner
                    </span>
                    {winnerFcData ? (
                      <a href={`https://warpcast.com/~/profiles/${winnerFcData.fid}`} target="_blank" rel="noopener noreferrer" className="relative">
                        <img
                        src={
                          Array.isArray(winnerFcData.USER_DATA_TYPE_PFP) && winnerFcData.USER_DATA_TYPE_PFP.length > 0
                            ? winnerFcData.USER_DATA_TYPE_PFP[0]
                            : '/defifa_spinner.gif'
                        }
                        
                          onError={(e) => {
                            console.error("Broken image URL:", winnerFcData?.pfp);
                            e.currentTarget.src = '/defifa_spinner.gif';
                          }}
                          alt="Winner Profile Picture"
                          className="w-24 h-24 rounded-full border-4 shadow-lg"
                          style={{ borderColor: '#FEA282' }}
                        />
                        <div className="absolute inset-0 rounded-full border-2 border-dotted opacity-50" style={{ borderColor: '#FEA282' }}></div>
                      </a>
                    ) : (
                      <div className="w-24 h-24 flex items-center justify-center">
                        <LoadingDots />
                      </div>
                    )}
                    <div className="mt-2 text-xl font-semibold" style={{ color: '#FEA282' }}>
                    {winnerFcData ? (
                      Array.isArray(winnerFcData.USER_DATA_TYPE_DISPLAY) && winnerFcData.USER_DATA_TYPE_DISPLAY.length > 0
                        ? winnerFcData.USER_DATA_TYPE_DISPLAY[0]
                        : 'Unknown User'
                    ) : (
                      <LoadingDots />
                    )}
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center" style={{ color: '#FEA282' }}>
                    <div>
                      <p className="font-bold text-2xl">${getPotTotal()}</p>
                      <p className="text-sm uppercase tracking-wide">Pot Size</p>
                    </div>
                    <div>
                      <p className="text-lg">${serviceFee * 100}%</p>
                      <p className="text-xs uppercase tracking-wide">Fee</p>
                    </div>
                    <div>
                      <p className="font-bold text-2xl">${getPotTotal() * (1 - serviceFee)}</p>
                      <p className="text-sm uppercase tracking-wide">Payout</p>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <div className="text-lg font-bold" style={{ color: '#EC017C' }}>
                      Status: {!prizeClaimed ? 'Not Claimed' : prizeClaimed && !prizePaid ? 'Not Paid' : 'Paid'}
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col space-y-3">
                    {boardPositions[winningTicket]?.owner === playerFid && gameState === 'completed' && !prizeClaimed && (
                      <button onClick={handleClaimPrize} className="w-full py-3 rounded-xl font-bold transform hover:scale-105 transition duration-300" style={{ backgroundColor: '#BD195D', color: '#FEA282' }}>
                        CLAIM YOUR GLORY
                      </button>
                    )}
                  </div>
                    {gameState === 'completed' && prizeClaimed && !prizePaid && user?.farcaster?.fid === refereeId && (
                      <button
                        onClick={handlePayout}
                        className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-800 transition"
                      >
                        Referee - Pay Winner
                      </button>
                    )}
                </div>
              )}
            </div>
            {prizeClaimed && (
              <div className="mt-6 text-center">
{/*                 <button onClick={handleDownloadImage} className="bg-deepPink hover:bg-EC017C text-white py-2 px-4 rounded-xl transition">
                  Collect Card (soon)<sup>™</sup>
                </button> */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
