// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import frameSdk from "@farcaster/frame-sdk";
// import { FrameContext } from '@farcaster/frame-node';
import ScoreGrid from './ui/ScoreGrid';
import { usePrivy } from '@privy-io/react-auth';
// import GetBalance from './ui/Balance';
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
import { toPng } from 'html-to-image';

interface AppProps {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}

interface FanUserData {
  USER_DATA_TYPE_DISPLAY: string[]; // Adjust based on actual structure
  fid: number;
  username?: string;
  pfp?: string;
  [key: string]: unknown; // If there are additional unknown fields
}

export type ViewProfileOptions = {
  fid: string;
};

const App: React.FC<AppProps> = ({ home, away, homeScore, awayScore }) => {
  // Local state for game data
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [gameId, setCurrentGameId] = useState<string>(`${home}-${away}`);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [boardPositions, setBoardPositions] = useState<TicketType[]>([]);
  const [gameState, setGameState] = useState<GameState>('buying');
  const [costPerTicket, setCostPerTicket] = useState<number>(1);
  const [serviceFee, setServiceFee] = useState<number>(0.04);
  const [refereeId, setRefereeId] = useState<number>(4163); // kmacb1.eth as default
  const [homeTeam, setHomeTeam] = useState<string>("");
  const [awayTeam, setAwayTeam] = useState<string>("");
  // const [context, setContext] = useState<FrameContext | undefined>(undefined);
  const [isContextLoaded, setIsContextLoaded] = useState(false);

  // Other local state
  const [team1Score, setTeam1Score] = useState<number | null>(homeScore);
  const [team2Score, setTeam2Score] = useState<number | null>(awayScore);
  const [winningTicket, setWinningTicket] = useState<number | null>(null);
  const [cart, setCart] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refereeFcData, setRefereeFcData] = useState<FanUserData | null>(null);
  const [prizeClaimed, setPrizeClaimed] = useState<boolean>(false);
  const [prizePaid, setPrizePaid] = useState<boolean>(false);
  const [winnerFcData, setWinnerFcData] = useState<FanUserData | null>(null);

  const { user } = usePrivy();
  const farcasterAccount = user?.linkedAccounts.find(account => account.type === 'farcaster');
  const playerName = farcasterAccount?.username || '';
  const playerPfp = farcasterAccount?.pfp || '/default-avatar.png';
  const playerFid = farcasterAccount?.fid || 0;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current);
      // Option 1: Download the image immediately
      // saveAs(dataUrl, 'winning-card.png');
      console.log('Image data URL:', dataUrl);
      // Option 2: Or you can use the dataUrl in an <img> tag for preview/share
    } catch (error) {
      console.error('Failed to generate image', error);
    }
  };

  useEffect(() => {
    async function getRefereeData() {
      try {
        const profileData = await fetchFanUserData(refereeId);
        setRefereeFcData(profileData);
      } catch (error) {
        console.error("Error fetching referee data:", error);
      }
    }
    // Only fetch if we have a refereeId
    if (refereeId) {
      getRefereeData();
    }
  }, [refereeId]);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const ctx = await frameSdk.context;
        if (!ctx) {
          console.error("Farcaster context returned null or undefined.");
          return;
        }
        setIsContextLoaded(true); // Just mark it as loaded
      } catch (error) {
        console.error("Failed to load Farcaster context:", error);
      }
    };
  
    if (!isContextLoaded) {
      loadContext();
    }
  }, [isContextLoaded]);  
  
  // Load game data on mount.
  useEffect(() => {
    async function loadGame() {
      try {
        console.log('Loading games with prefix:', gameId);
        const games: GameData[] = await getGamesByPrefix(gameId);
        console.log('Loaded games array:', games);
        if (games.length > 0) {
          const game = games[0]; // TODO make it possible for more than one game to exist per match
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
            setTeam1Score(Number(game.finalScore.home)); // Ensure it's a number
            setTeam2Score(Number(game.finalScore.away)); // Ensure it's a number          
          }
          if (game.winningTicket !== undefined) {
            setWinningTicket(Number(game.winningTicket)); // Ensure winning ticket is stored as a number 0-24
          }
          if (typeof game.prizeClaimed === 'boolean') {
            setPrizeClaimed(game.prizeClaimed);
          }
          if (typeof game.prizeClaimed === 'boolean') {
            setPrizeClaimed(game.prizeClaimed);
          }
          if (typeof game.prizePaid === 'boolean') {
            setPrizePaid(game.prizePaid);
          }
        } else {
          console.error('No games found for prefix:', home, away);
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
    async function fetchWinnerData() {
      if (winningTicket !== null && boardPositions[winningTicket]?.owner) {
        try {
          const data = await fetchFanUserData(boardPositions[winningTicket].owner);
          setWinnerFcData(data); // This is where setWinnerFcData is used.
        } catch (error) {
          console.error("Error fetching winner fan user data:", error);
        }
      }
    }
    fetchWinnerData();
  }, [winningTicket, boardPositions]);

  if (loading) {
    return <div className="p-4">Loading game data...</div>;
  }

  // Ticket selection logic.
  const incrementCart = () => {
    for (let i = 0; i < tickets.length; i++) {
      if (!tickets[i].owner && !cart.includes(i)) {
        setCart((prevCart) => [...prevCart, i]);
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
      await purchaseTickets(gameId, cart, playerFid, playerPfp);
      const updatedGame = await getGame(gameId);
      if (updatedGame) {
        setTickets(updatedGame.tickets);
        if (updatedGame.tickets.every(ticket => ticket.owner !== null)) {
          console.log('All tickets purchased. Randomizing board...');
          await randomizeBoard(gameId);
          const randomizedGame = await getGame(gameId);
          console.log('Randomized game:', randomizedGame);
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
    } catch (error) {
      console.error('Error finalizing purchase:', error);
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
        setGameState(updatedGame.gameState);
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
      // After claiming, update state to remove the claim button.
      setPrizeClaimed(true);
      // Optionally, refetch game data here.
      const updatedGame = await getGame(gameId);
      if (updatedGame) {
        // Optionally update other state variables
        setBoardPositions(updatedGame.boardPositions || []);
        setGameState(updatedGame.gameState);
      }
    } catch (error) {
      console.error('Error claiming prize:', error);
    }
  };
  
  const handleAttestPrizePaid = async () => {
    try {
      await attestPrizePaid(gameId);
      // After attestation, update local state (optionally refetch game data)
      setPrizePaid(true);
      const updatedGame = await getGame(gameId);
      if (updatedGame) {
        setPrizePaid(updatedGame.prizePaid || false);
      }
    } catch (error) {
      console.error("Error attesting prize paid:", error);
    }
  };
  
  const getPotTotal = () => {
    const purchasedCount = tickets.filter(t => t.owner !== null).length;
    return purchasedCount * costPerTicket;
  };

  return (
    <div className="mb-4 bg-purplePanel">
      <div className="max-w-4xl mx-auto">
        {!selectedGameId ? (
          <div className="bg-purplePanel rounded-xl shadow-xl mb-4">
            <p className="text-sm text-center text-lightPurple mb-4">
              No Score Square games have been deployed for this match.
            </p>
            {/* governing who may deploy for now */}
            {user?.farcaster?.username === 'kmacb.eth' || user?.farcaster?.username === 'gabedev.eth' ? (
              <ContestScoreSquareCreate home={homeTeam} away={awayTeam} refereeId={user.farcaster.fid || 4163} />
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
                      // You can now directly use the already-fetched refereeFcData if needed
                      console.log('Referee Fan Data and refereeId:', refereeFcData, refereeId);
                      await frameSdk.actions.viewProfile({ fid: refereeId });
                    }}
                    className="text-lightPurple underline cursor-pointer ml-1"
                  >
                    {refereeFcData ? refereeFcData.USER_DATA_TYPE_DISPLAY[0] : refereeId || 'anon'}
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
                    <span className="font-semibold text-lg">{playerName}</span>
                    {/* <GetBalance /> */}
                    <p className="text-sm text-lightPurple">
                      Test Match. No money involved.
                    </p>
                  </div>
                </div>
                <div className="mb-3 text-left text-md text-lightPurple">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-2">
                      <Ticket className="h-10 w-10 rotate-90 text-limeGreenOpacity" />
                    </div>
                    <div>
                      <p>
                        <span className="font-bold">Step 1: Purchase a ticket.</span> Once all tickets are sold, the board will be randomized and revealed. Ticket with final score wins the pot!
                      </p>
                      <p className="text-fontRed mt-2">
                        <span className="text-fontRed font-bold">Note:</span> A service fee of {serviceFee * 100}% will be applied at payout.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mb-4 flex items-center justify-center gap-3">
                  <button onClick={decrementCart} className="px-2 py-1 bg-deepPink rounded hover:bg-fontRed transition">
                    –
                  </button>
                  <span className="text-lg font-bold">{cart.length}</span>
                  <button onClick={incrementCart} className="px-2 py-1 bg-deepPink rounded hover:bg-fontRed transition">
                    +
                  </button>
                  <button onClick={finalizePurchase} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
                    Buy Tickets
                  </button>
                </div>
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
                    <select
                      className="w-full px-2 py-1 border bg-darkPurple rounded text-xs"
                      value={team1Score || 0} 
                      onChange={(e) => setTeam1Score(Number(e.target.value))} // Convert to number
                      >
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-lightPurple mb-1">Away Team</label>
                    <select
                      className="w-full px-2 py-1 border bg-darkPurple rounded text-xs"
                      value={team2Score || 0} 
                      onChange={(e) => setTeam2Score(Number(e.target.value))} // Convert to number
                      >
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
              
              <div
                className="p-6 rounded-3xl border-4 border-double shadow-2xl"
                style={{
                  backgroundColor: '#010513', // purplePanel
                  borderColor: '#FEA282', // notWhite
                  fontFamily: '"VT323", monospace',
                }}
              >
              {/* Home & Away Teams */}
              <div className="mb-4 text-center">
                <h3
                  className="text-2xl font-bold uppercase tracking-wide"
                  style={{ color: '#FEA282' }} // notWhite
                >
                  {homeTeam} <span className="mx-2" style={{ color: '#EC017C' }}>vs</span> {awayTeam}
                </h3>
              </div>
              
              {/* Final Score Header */}
              <div className="mb-4 text-center">
                <h2 className="text-3xl font-extrabold drop-shadow-xl" style={{ color: '#FEA282' }}>
                  {team1Score} - {team2Score}
                </h2>
              </div>
              
              {/* Winner Info */}
              <div className="flex flex-col items-center space-y-3">
                <span className="text-lg font-bold uppercase tracking-widest" style={{ color: 'rgba(162, 230, 52, 0.7)' }}>
                  Game Winner
                </span>
                <a
                  href={`https://warpcast.com/~/profiles/${boardPositions[winningTicket]?.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative"
                >
                  <img
                    src={boardPositions[winningTicket]?.pfp || '/defifa_spinner.gif'}
                    alt="Ticket Owner"
                    className="w-24 h-24 rounded-full border-4 shadow-lg"
                    style={{ borderColor: '#FEA282' }}
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-dotted opacity-50" style={{ borderColor: '#FEA282' }}></div>
                </a>
                <div className="mt-2 text-xl font-semibold" style={{ color: '#FEA282' }}>
                  {winnerFcData ? winnerFcData.USER_DATA_TYPE_DISPLAY[0] : boardPositions[winningTicket]?.owner}
                </div>
              </div>
              
              {/* Game Stats */}
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
              
              {/* Status Display */}
              <div className="mt-6 text-center">
                <div className="text-lg font-bold" style={{ color: '#EC017C' }}>
                  Status: {!prizeClaimed ? 'Not Claimed' : prizeClaimed && !prizePaid ? 'Not Paid' : 'Paid'}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex flex-col space-y-3">
                
                {/* Claim Prize Button - Only shows if prize is NOT claimed and NOT paid */}
                {boardPositions[winningTicket]?.owner === playerFid && gameState === 'completed' && !prizeClaimed && (
                  <button
                    onClick={handleClaimPrize}
                    className="w-full py-3 rounded-xl font-bold transform hover:scale-105 transition duration-300"
                    style={{ backgroundColor: '#BD195D', color: '#FEA282' }} // deepPink
                  >
                    CLAIM YOUR GLORY
                  </button>
                )}


                {/* Attest Prize Paid Button - Only shows if prize is claimed but NOT paid */}
                {prizeClaimed && !prizePaid && user?.farcaster?.fid === refereeId && (
                  <button
                    onClick={handleAttestPrizePaid}
                    className="w-full py-3 rounded-xl font-bold transform hover:scale-105 transition duration-300"
                    style={{ backgroundColor: '#32CD32', color: '#181424' }} // limeGreen
                  >
                    ATTEST PRIZE PAID
                  </button>
                )}

                {/* Status Message When Prize is Paid */}
                {prizePaid && (
                  <div className="font-extrabold text-xl text-center" style={{ color: 'rgba(162, 230, 52, 0.7)' }}>
                    🎉 CONGRATS 🎉
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

            {/* Render Download Button ONLY if Prize is Claimed */}
            {prizeClaimed && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleDownloadImage}
                      className="bg-deepPink hover:bg-EC017C text-white py-2 px-4 rounded-xl  transition"
                    >
                      Collect Card (soon)<sup>™</sup>
                    </button>
                  </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
