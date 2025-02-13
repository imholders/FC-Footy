// App.tsx
import React, { useState, useEffect } from 'react';
import frameSdk from "@farcaster/frame-sdk";
import { FrameContext } from '@farcaster/frame-node';

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
  GameState,
  TicketType,
  GameData,
} from '../lib/kvScoreSquare';
import ContestScoreSquareCreate from './ContestScoreSquareCreate';
import WarpcastShareButton from './ui/WarpcastShareButton';

interface AppProps {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}

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
  const [context, setContext] = useState<FrameContext | undefined>(undefined);
  const [isContextLoaded, setIsContextLoaded] = useState(false);

  // Other local state
  const [team1Score, setTeam1Score] = useState<number | null>(homeScore);
  const [team2Score, setTeam2Score] = useState<number | null>(awayScore);
  const [winningTicket, setWinningTicket] = useState<number | null>(null);
  const [cart, setCart] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { user } = usePrivy();
  const farcasterAccount = user?.linkedAccounts.find(account => account.type === 'farcaster');
  const playerName = farcasterAccount?.username || '';
  const playerPfp = farcasterAccount?.pfp || '/default-avatar.png';
  const playerFid = farcasterAccount?.fid || 0;
  
  // constant variables for grid headers
  const colHeaders = ['0', '1', '2', '3', '4+'];
  const rowHeaders = ['0', '1', '2', '3', '4+'];

  useEffect(() => {
    const loadContext = async () => {
      try {
        setContext((await frameSdk.context) as FrameContext);
        setIsContextLoaded(true);
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
            setWinningTicket(Number(game.winningTicket)); // Ensure winning ticket is stored as a number
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
      alert('Only the referee can submit the score. Please tell @kmacb.eth');
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
      //alert('Prize Claimed!'); 
      const updatedGame = await getGame(gameId);
      if (updatedGame) {
        // Optionally update state after claiming prize.
         // Construct and open the URL
        const winnerProfile = `https://warpcast.com/~/profiles/${boardPositions[winningTicket || 0 ]?.owner}`
        const matchSummary = `Hey ${winnerProfile} won the Score Score \n${gameId} please verify and send the money`;
        const encodedSummary = encodeURIComponent(matchSummary);
        const url = `https://warpcast.com/~/inbox/create/${420564}?text=${encodedSummary}`;
        console.log(context);
        if (context === undefined) {
          window.open(url, '_blank');
        } else {
          frameSdk.actions.openUrl(url);
        }
      }
    } catch (error) {
      console.error('Error claiming prize:', error);
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
            {user?.farcaster?.username === 'kmacb.eth' || user?.farcaster?.username === 'gabedev.eth' ? (
              <ContestScoreSquareCreate home={homeTeam} away={awayTeam} refereeId={user?.farcaster?.fid} />
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
                  Referee: {user?.farcaster?.displayName || 'anon'}
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
                <p>
                  <span className="font-bold">Step 2:</span> The referee is {refereeId}. They will enter the final scores for each team. The winning ticket is determined by the grid cell corresponding to these scores.
                </p>
              </div>
            )}

            {gameState === 'completed' && (
              <div className="mb-3 text-center text-xs text-fontRed">
                <p>Game Complete! The highlighted ticket is the winner.</p>
              </div>
            )}
  
            <div className="flex mb-4">
              <div className="flex items-center justify-center">
                {/* The away score label is on the left side */}
                <span
                  className={`rotate-[-90deg] text-xs font-bold whitespace-nowrap ${
                    awayScore < 4
                      ? rowHeaders[0] === awayScore.toString() && awayScore.toString() === rowHeaders[0]
                        ? 'text-limeGreenOpacity'
                        : 'text-notWhite'
                      : rowHeaders[0] === '4+' ? 'text-limeGreenOpacity' : 'text-notWhite'
                  }`}
                >
                <div className="mb-1 mb-4 text-center font-bold text-notWhite text-xs">
                  {awayTeam} Score
                </div>
                </span>
              </div>
              <div>
                <div className="mb-1 mb-4 text-center font-bold text-notWhite text-xs">
                  {homeTeam} Score
                </div>
                <div
                  className="grid gap-1 mb-4"
                  style={{
                    gridTemplateColumns: gameState === 'buying' ? 'repeat(5, 45px)' : '1px repeat(5, 45px)',
                  }}
                >
                  {gameState !== 'buying' && (
                    <>
                      <div></div>
                      {colHeaders.map((header, colIdx) => {
                        // Highlight the header if it matches homeScore.
                        const isHomeScoreHighlight =
                          homeScore < 4 ? header === homeScore.toString() : header === '4+';
                        return (
                          <div
                            key={`col-${colIdx}`}
                            className={`flex items-center justify-center text-center font-bold text-xs ${
                              isHomeScoreHighlight ? 'text-limeGreenOpacity' : 'text-notWhite'
                            }`}
                          >
                            {header}
                          </div>
                        );
                      })}
                    </>
                  )}
                  {Array.from({ length: 5 }, (_, rowIdx) => (
                    <React.Fragment key={`row-${rowIdx}`}>
                      {gameState !== 'buying' && (
                        <div
                          className={`flex items-center justify-center text-center font-bold text-xs ${
                            (awayScore < 4
                              ? rowHeaders[rowIdx] === awayScore.toString()
                              : rowHeaders[rowIdx] === '4+') 
                              ? 'text-limeGreenOpacity'
                              : 'text-notWhite'
                          }`}
                        >
                          {rowHeaders[rowIdx]}
                        </div>
                      )}
                      {Array.from({ length: 5 }, (_, colIdx) => {
                        const ticketIndex = rowIdx * 5 + colIdx;
                        const currentTicket =
                          gameState === 'buying' ? tickets[ticketIndex] : boardPositions[ticketIndex];

                        // Convert header values to numbers (treat "4+" as 4)
                        const rowVal = rowHeaders[rowIdx] === '4+' ? 4 : parseInt(rowHeaders[rowIdx]);
                        const colVal = colHeaders[colIdx] === '4+' ? 4 : parseInt(colHeaders[colIdx]);

                        // Determine if this cell should be highlighted based on score
                        const shouldHighlight = rowVal < awayScore || colVal < homeScore;
                        const isScoreMatch =
                          (homeScore < 4
                            ? colHeaders[colIdx] === homeScore.toString()
                            : colHeaders[colIdx] === '4+') &&
                          (awayScore < 4
                            ? rowHeaders[rowIdx] === awayScore.toString()
                            : rowHeaders[rowIdx] === '4+');

                        // Only apply score styles when the game is not in the "buying" state.
                        const applyScoreStyles = gameState !== 'buying';
                        const cellBgClass = applyScoreStyles && isScoreMatch ? 'bg-limeGreenOpacity' : '';
                        const imgBorderClass = applyScoreStyles && shouldHighlight ? 'border border-2 border-fontRed' : '';

                        if (!currentTicket) {
                          return (
                            <div
                              key={ticketIndex}
                              className={`aspect-square rounded p-1 flex items-center justify-center bg-darkPurple border border-lightPurple ${cellBgClass}`}
                            />
                          );
                        }

                        return gameState === 'buying' ? (
                          <div
                            key={ticketIndex}
                            className="aspect-square rounded p-1 flex items-center justify-center bg-darkPurple transition-all duration-200 border border-lightPurple"
                          >
                            {currentTicket.owner && (
                              <a
                                href={`https://warpcast.com/~/profiles/${currentTicket.fid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={currentTicket.pfp}
                                  alt="Ticket Owner"
                                  className="w-8 h-8 rounded-full"
                                />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div
                            key={ticketIndex}
                            className={`aspect-square rounded p-1 flex flex-col items-center justify-center border border-lightPurple transition-all duration-200 
                              ${cellBgClass} ${currentTicket.owner ? 'text-lightPurple' : 'bg-gray-100'} 
                              ${winningTicket === ticketIndex && gameState === 'completed' ? 'ring-2 ring-limeGreenOpacity' : ''}
                              ${gameState === 'placing' ? 'animate-pulse' : ''}`}
                          >
                            {currentTicket.owner && (
                              <a
                                href={`https://warpcast.com/~/profiles/${currentTicket.fid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={currentTicket.pfp}
                                  alt="Ticket Owner"
                                  className={`w-8 h-8 rounded-full ${imgBorderClass}`}
                                />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}

                </div>
              </div>
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

            {gameState === 'playing' && user?.farcaster?.username !== 'kmacb1.eth' && (
              <div className="bg-darkPurple p-3 rounded-lg text-center text-xs text-lightPurple">
                Final score submission is only available to the referee. Please contact {refereeId}
              </div>
            )}

            {gameState === 'completed' && winningTicket !== null && (
              <div className="bg-darkPurple p-3 rounded-lg border border-limeGreenOpacity">
                <h2 className="text-base font-semibold text-notWhite mb-2">
                  Final Score: {team1Score} - {team2Score}
                </h2>
                <div className="flex flex-col items-center my-2">
                  <span className="text-xs text-lightPurple font-bold">Winner:</span>
                  <a
                    href={`https://warpcast.com/~/profiles/${boardPositions[winningTicket]?.owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={boardPositions[winningTicket]?.pfp || '/defifa_spinner.gif'}
                      alt="Ticket Owner"
                      className="mt-1 w-20 h-20 rounded-full border-2 border-white shadow-lg"
                    />
                  </a>
                </div>
                <p className="text-m text-lightPurple">
                  Pot size: <span className="font-bold">${getPotTotal()}</span>
                </p>
                <p className="text-m text-lightPurple">
                  Service fee: <span className="font-bold">{serviceFee * 100}%</span>
                </p>
                <p className="text-m text-lightPurple">
                  Payout: <span className="font-bold">${getPotTotal() * (1 - serviceFee)}</span>
                </p>
                {boardPositions[winningTicket]?.owner === playerFid && (
                  <button
                    onClick={handleClaimPrize}
                    className="mt-4 w-full bg-deepPink text-white text-xs py-1 h-10 rounded hover:bg-fontRed transition"
                  >
                    Claim Prize
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
