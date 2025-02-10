// ContestScoreSquareCreate.tsx
import React, { useState } from 'react';
import { createGame, GameData, TicketType } from '../lib/kvScoreSquare';
import { Info } from 'lucide-react';

interface ContestScoreSquareCreateProps {
  home: string;
  away: string;
  refereeId: number | null;
}
  
const ContestScoreSquareCreate: React.FC<ContestScoreSquareCreateProps> = ({ home, away, refereeId }) => {
      console.log('home', home, 'away', away, 'refereeId', refereeId);
  const [homeTeam, setHomeTeam] = useState<string>(home);
  const [awayTeam, setAwayTeam] = useState<string>(away);
  const [costPerTicket, setCostPerTicket] = useState<number>(1);
  // Default service fee is 4% (i.e. 0.04)
  const [serviceFee, setServiceFee] = useState<number>(0.04);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Generate a unique game id.
      const gameId = `${homeTeam}-${awayTeam}-${Date.now()}`;

      // Build the initial 25 tickets.
      const initialTickets: TicketType[] = Array(25)
        .fill(null)
        .map((_, index) => {
          const row = Math.floor(index / 5);
          const col = index % 5;
          return {
            score: `${homeTeam} ${row} - ${col} ${awayTeam}`,
            owner: null,
          };
        });

      const now = new Date().toISOString();
      const newGame: GameData = {
        gameId,
        homeTeam,
        awayTeam,
        costPerTicket,
        serviceFee,
        gameState: 'buying',
        tickets: initialTickets,
        createdAt: now,
        updatedAt: now,
        refereeId: refereeId || null,
      };

      await createGame(newGame);
      setMessage(`Game created successfully with id: ${gameId}`);
    } catch (error) {
      console.error('Error creating game:', error);
      setMessage('Failed to create game.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-purplePanel rounded shadow-md max-w-md mx-auto">
        <h1 className="flex items-center text-l text-notWhite font-bold mb-4">
        Create Score Square
        <a
            href="https://hackmd.io/@kxf5aynZTPOR3a8ykiucig/fc-footy"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2"
        >
            <Info className="w-4 h-4 text-deepPink hover:text-fontRed cursor-pointer" />
        </a>
        </h1>
        {message && <div className="mb-4 text-sm text-center">{message}</div>}
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
            <label className="block font-medium mb-1 text-notWhite">Cost per Ticket $:</label>
            <input
                type="number"
                value={costPerTicket}
                onChange={(e) => setCostPerTicket(Number(e.target.value))}
                className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple"
                required
            />
            </div>
            <div>
            <label className="block font-medium mb-1 text-notWhite">Deployer&apos;s Fee:</label>
            <select
                value={serviceFee}
                onChange={(e) => setServiceFee(Number(e.target.value))}
                className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple"
                required
            >
                {/* Option values are in decimal form */}
                <option value="0.01">1%</option>
                <option value="0.02">2%</option>
                <option value="0.03">3%</option>
                <option value="0.04">4%</option>
                <option value="0.05">5%</option>
                <option value="0.06">6%</option>
                <option value="0.07">7%</option>
                <option value="0.08">8%</option>
                <option value="0.09">9%</option>
                <option value="0.10">10%</option>
            </select>
            </div>
            <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
            {loading ? 'Creating Game...' : 'Create Game'}
            </button>
        </form>
    </div>
  );
};

export default ContestScoreSquareCreate;
