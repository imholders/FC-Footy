import React, { useState, useEffect } from 'react';
import FantasyRow from './ContestFantasyRow';
import { fetchFantasyData } from './utils/fetchFantasyData';

interface FantasyEntry {
  rank: number;
  pfp: string | null;
  team: {
    name: string | null;
    logo: string | null;
  };
  manager: string;
  entry_name: string | null;
  last_name: string | null;
  fav_team: number | null;
  total: number | null;
}

const loadingMessages = [
  "Waiting is the hardest part...",
  "It’s the hope that kills you.",
  "Loading... like a VAR check.",
  "Still faster than a Tottenham rebuild.",
  "Patience is a virtue, but this is ridiculous."
];

const ContestFCFantasy = () => {
  const [fantasyData, setFantasyData] = useState<FantasyEntry[]>([]);
  const [loadingFantasy, setLoadingFantasy] = useState(false);
  const [errorFantasy, setErrorFantasy] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  console.log("Fantasy Data", fantasyData);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingFantasy(true);
      setErrorFantasy(null);
      setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
      
      try {
        const data = await fetchFantasyData();
        setFantasyData(data.map(item => ({ ...item, rank: item.rank ?? 0 as number })));
      } catch (error) {
        setErrorFantasy(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoadingFantasy(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2 className="font-2xl text-notWhite font-bold mb-4">Leaderboard</h2>

      {loadingFantasy ? (
        <div className="text-lightPurple text-center animate-pulse">
          <div>{loadingMessage}</div>
        </div>
      ) : errorFantasy ? (
        <div className="text-red-500">{errorFantasy}</div>
      ) : fantasyData.length > 0 ? (
        <div className="bg-purplePanel p-1 rounded-md">
          <table className="w-full bg-darkPurple border border-limeGreenOpacity rounded-lg shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-darkPurple text-notWhite text-center border-b border-limeGreenOpacity">
                <th className="py-1 px-1 font-medium">Rank</th>
                <th className="py-1 px-1 font-medium">Profile</th>
                <th className="py-0 px-0 font-medium text-left">Manager</th>
                <th className="py-1 px-1 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {fantasyData.map((entry, index) => (
                <FantasyRow key={index} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>No fantasy data available.</div>
      )}
    </div>
  );
};

export default ContestFCFantasy;
