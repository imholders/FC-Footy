import React, { useState } from 'react';
import { createGame, getGame, GameData, TicketType } from '../lib/kvScoreSquare';
import { Info } from 'lucide-react';

interface ContestScoreSquareCreateProps {
  home: string;
  away: string;
  refereeId: number;
  onGameCreated: (gameId: string) => void; // Callback for updating state in App.tsx
}

const ContestScoreSquareCreate: React.FC<ContestScoreSquareCreateProps> = ({ home, away, refereeId, onGameCreated }) => {
  const [homeTeam, setHomeTeam] = useState<string>(home);
  const [awayTeam, setAwayTeam] = useState<string>(away);
  const [costPerTicket, setCostPerTicket] = useState<number>(1);
  const [serviceFee, setServiceFee] = useState<number>(0.04);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const gameId = `${homeTeam}-${awayTeam}-${Date.now()}`;

      const initialTickets: TicketType[] = Array(25).fill(null).map((_, index) => ({
        boughtRCPreShuffle: `${Math.floor(index / 5)} - ${index % 5}`,
        owner: null,
      }));

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
        refereeId: refereeId,
      };

      await createGame(newGame);
      setMessage(`Game created successfully!`);

      // 🔥 Fetch the new game data & update App state
      const createdGame = await getGame(gameId);
      if (createdGame) {
        onGameCreated(gameId); // Call the parent function to update state
      }
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
        <a href="https://hackmd.io/@kxf5aynZTPOR3a8ykiucig/fc-footy" target="_blank" rel="noopener noreferrer" className="ml-2">
          <Info className="w-4 h-4 text-deepPink hover:text-fontRed cursor-pointer" />
        </a>
      </h1>
      {message && <div className="mb-4 text-sm text-center">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 bg-darkPurple p-4 rounded">
        <div>
          <label className="block font-medium mb-1 text-notWhite">Home Team:</label>
          <input type="text" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple" required />
        </div>
        <div>
          <label className="block font-medium mb-1 text-notWhite">Away Team:</label>
          <input type="text" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple" required />
        </div>
        <div>
          <label className="block font-medium mb-1 text-notWhite">Cost per Ticket $:</label>
          <input type="number" value={costPerTicket} onChange={(e) => setCostPerTicket(Number(e.target.value))} className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple" required />
        </div>
        <div>
          <label className="block font-medium mb-1 text-notWhite">Deployer&apos;s Fee:</label>
          <select value={serviceFee} onChange={(e) => setServiceFee(Number(e.target.value))} className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple" required>
            {[...Array(10)].map((_, i) => (
              <option key={i} value={(i + 1) / 100}>{(i + 1)}%</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          {loading ? 'Creating Game...' : 'Create Game'}
        </button>
      </form>
    </div>
  );
};

export default ContestScoreSquareCreate;
