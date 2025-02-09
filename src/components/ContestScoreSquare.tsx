// App.tsx
import React, { useState, useEffect } from 'react';
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
}

const App: React.FC<AppProps> = ({ home, away }) => {
  // Testing data

  // Local state for game data
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [gameId, setCurrentGameId] = useState<string>(`${home}-${away}`);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [boardPositions, setBoardPositions] = useState<TicketType[]>([]);
  const [gameState, setGameState] = useState<GameState>('buying');
  const [costPerTicket, setCostPerTicket] = useState<number>(1);
  const [serviceFee, setServiceFee] = useState<number>(0.04);
  const [homeTeam, setHomeTeam] = useState<string>("");
  const [awayTeam, setAwayTeam] = useState<string>("");

  // Other local state
  const [team1Score, setTeam1Score] = useState<number | null>(null);
  const [team2Score, setTeam2Score] = useState<number | null>(null);
  const [winningTicket, setWinningTicket] = useState<number | null>(null);
  const [cart, setCart] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { user } = usePrivy();
  const farcasterAccount = user?.linkedAccounts.find(account => account.type === 'farcaster');
  const playerName = farcasterAccount?.username || '';
  const playerPfp = farcasterAccount?.pfp || '/default-avatar.png';
  const playerFid = farcasterAccount?.fid || 0;
  // constant variables 
  const colHeaders = ['0', '1', '2', '3', '4+'];
  const rowHeaders = ['0', '1', '2', '3', '4+'];
  
  // When the component mounts, load the game data from the DB using the gameId prop.
  useEffect(() => {
    async function loadGame() {
      try {
        // Retrieve all games that match the prefix.
        console.log('Loading games with prefix:', gameId);
        const games: GameData[] = await getGamesByPrefix(gameId);
        console.log('Loaded games array:', games);
        if (games.length > 0) {
          const game = games[0]; // Use the first game entry
          setCurrentGameId(game.gameId);
          setSelectedGameId(game.gameId);
          // Update game data state from the game object...
          setTickets(game.tickets);
          setBoardPositions(game.boardPositions || []);
          setGameState(game.gameState);
          setCostPerTicket(game.costPerTicket);
          setServiceFee(game.serviceFee);
          setHomeTeam(game.homeTeam);
          setAwayTeam(game.awayTeam);
          if (game.finalScore) {
            setTeam1Score(game.finalScore.home);
            setTeam2Score(game.finalScore.away);
          }
          if (game.winningTicket !== undefined) {
            setWinningTicket(game.winningTicket);
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
  }, [gameId]);

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
        // Check if all tickets have been purchased.
        if (updatedGame.tickets.every(ticket => ticket.owner !== null)) {
          // Call randomizeBoard to shuffle the tickets.
          console.log('All tickets purchased. Randomizing board...');
          await randomizeBoard(gameId);
          const randomizedGame = await getGame(gameId);
          console.log('Randomized game:', randomizedGame);
          if (randomizedGame) {
            setBoardPositions(randomizedGame.boardPositions || []);
            setGameState(randomizedGame.gameState);
            // Transition to "playing" state after a brief pause.
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
    if (user?.farcaster?.username !== 'kmacb.eth') {
      alert('Only the referee can submit the score');
      return;
    }
    if (team1Score === null || team2Score === null) {
      alert('Please enter both scores');
      return;
    }
    try {
      await submitFinalScore(gameId, { home: team1Score, away: team2Score }, user.farcaster.username);
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
      alert('Prize Claimed!');
      const updatedGame = await getGame(gameId);
      if (updatedGame) {
        // Optionally update state after claiming prize.
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
      { !selectedGameId ? (
        <div className="bg-purplePanel rounded-xl shadow-xl mb-4">
          <p className="text-sm text-center text-lightPurple mb-4">
            No Score Square games have been deployed for this match.
          </p>
          {user?.farcaster?.username === 'kmacb.eth' ? (
            <ContestScoreSquareCreate home={homeTeam} away={awayTeam} />
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
          // Otherwise, render the rest of the UI for all game phases.
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
                  <span className="font-bold">Step 2:</span> The referee is @kmacb.eth. They will enter the final scores for each team. The winning ticket is determined by the grid cell corresponding to these scores.
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
                <span className="rotate-[-90deg] text-xs font-bold text-notWhite whitespace-nowrap">
                  {awayTeam} Score
                </span>
              </div>
              <div>
                <div className="mb-1 mb-4 text-center font-bold text-notWhite text-xs">
                  {homeTeam} Score
                </div>
                <div
                  className="grid gap-1 mb-4"
                  style={{
                    gridTemplateColumns: gameState === 'buying' ? 'repeat(5, 45px)' : '12px repeat(5, 45px)',
                  }}
                >
                  {gameState !== 'buying' && (
                    <>
                      <div></div>
                      {colHeaders.map((header, colIdx) => (
                        <div
                          key={`col-${colIdx}`}
                          className="flex items-center justify-center text-center font-bold text-notWhite text-xs"
                        >
                          {header}
                        </div>
                      ))}
                    </>
                  )}
                  {Array.from({ length: 5 }, (_, rowIdx) => (
                    <React.Fragment key={`row-${rowIdx}`}>
                      {gameState !== 'buying' && (
                        <div className="flex items-center justify-center text-center font-bold text-notWhite text-xs">
                          {rowHeaders[rowIdx]}
                        </div>
                      )}
                      {Array.from({ length: 5 }, (_, colIdx) => {
                        const ticketIndex = rowIdx * 5 + colIdx;
                        const currentTicket =
                          gameState === 'buying'
                            ? tickets[ticketIndex]
                            : boardPositions[ticketIndex];
  
                        if (!currentTicket) {
                          return (
                            <div
                              key={ticketIndex}
                              className="aspect-square rounded p-1 flex items-center justify-center bg-darkPurple border border-lightPurple"
                            />
                          );
                        }
  
                        return gameState === 'buying' ? (
                          <div
                            key={ticketIndex}
                            className="aspect-square rounded p-1 flex items-center justify-center bg-darkPurple transition-all duration-200 border border-lightPurple"
                          >
                            {currentTicket.owner ? (
                              <img
                                src={currentTicket.pfp}
                                alt="Ticket Owner"
                                className="w-6 h-6 rounded-full"
                              />
                            ) : null}
                          </div>
                        ) : (
                          <div
                            key={ticketIndex}
                            className={`
                              aspect-square rounded p-1 flex flex-col items-center justify-center border border-lightPurple
                              ${currentTicket.owner ? 'text-lightPurple' : 'bg-gray-100'}
                              ${winningTicket === ticketIndex && gameState === 'completed' ? 'bg-limeGreenOpacity ring-2 ring-limeGreenOpacity' : ''}
                              ${gameState === 'placing' ? 'animate-pulse' : ''}
                              transition-all duration-200
                            `}
                          >
                            {currentTicket.owner && (
                              <img
                                src={currentTicket.pfp}
                                alt="Ticket Owner"
                                className="mt-1 w-8 h-8 rounded-full"
                              />
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
                      onChange={(e) => setTeam1Score(parseInt(e.target.value))}
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
                      onChange={(e) => setTeam2Score(parseInt(e.target.value))}
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                </div>
                {gameState === 'playing' && user?.farcaster?.username === 'kmacb.eth' && (

                <button
                  onClick={handleSubmitScore}
                  className="w-full bg-deepPink text-lightPurple py-1 p-4 rounded-lg hover:bg-fontRed transition text-xs"
                >
                  Submit Final Score
                </button>
                )}
              </div>
            )}
  
            {gameState === 'playing' && user?.farcaster?.username !== 'kmacb.eth' && (
              <div className="bg-darkPurple p-3 rounded-lg text-center text-xs text-lightPurple">
                Final score submission is only available to the referee.
              </div>
            )}
  
            {gameState === 'completed' && winningTicket !== null && (
              <div className="bg-darkPurple p-3 rounded-lg border border-limeGreenOpacity">
                <h2 className="text-base font-semibold text-notWhite mb-2">
                  Final Score: {team1Score} - {team2Score}
                </h2>
                <div className="flex flex-col items-center my-2">
                  <span className="text-xs text-lightPurple font-bold">Winner:</span>
                  <img
                    src={boardPositions[winningTicket]?.pfp || '/default-avatar.png'}
                    alt="Ticket Owner"
                    className="mt-1 w-20 h-20 rounded-full border-2 border-white shadow-lg"
                  />
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
                <button
                  onClick={handleClaimPrize}
                  className="mt-4 w-full bg-deepPink text-white text-xs py-1 h-10 rounded hover:bg-fontRed transition"
                >
                  Claim Prize
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
  
}

export default App;
