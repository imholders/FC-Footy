import React, { useState, useEffect } from 'react';
import FantasyRow from './FantasyRow';
import { fetchFantasyData } from './utils/fetchFantasyData';

interface FantasyEntry {
  pfp: string | null;
  team: {
    name: string | null;
    logo: string | null;
  };
  manager: string;
  entry_name: string | null;
  rank: number | null;
  last_name: string | null;
  fav_team: number | null;
  total: number | null;
}

const loadingMessages = [
  "Waiting for VAR is the hardest part...",
  "It is the hope that kills you.",
  "Loading... like a VAR check.",
  "Still faster than a Tottenham rebuild.",
  "Patience is a virtue, ask a ManU fan.",
  "Like VAR but with less drama"
];

const FantasyTab = () => {
  const [fantasyData, setFantasyData] = useState<FantasyEntry[]>([]);
  const [loadingFantasy, setLoadingFantasy] = useState<boolean>(false);
  const [errorFantasy, setErrorFantasy] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoadingFantasy(true);
      setErrorFantasy(null);
      setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
      
      try {
        const data = await fetchFantasyData();
        handleFetchedData(data);
      } catch (error) {
        if (error instanceof Error) {
          setErrorFantasy(error.message);
        } else {
          setErrorFantasy('An unknown error occurred');
        }
      } finally {
        setLoadingFantasy(false);
      }
    };

    fetchData();
  }, []);

  const handleFetchedData = (data: FantasyEntry[]) => {
    const updatedData = data.map(item => ({
      ...item,
      rank: item.rank ?? 0,
    }));
    setFantasyData(updatedData);
  };

  return (
    <div>
      <h2 className="font-2xl text-notWhite font-bold mb-4">FC Fantasy League Table</h2>

      {loadingFantasy ? (
        <div className="text-lightPurple text-center animate-pulse">
          <div>{loadingMessage}</div>
        </div>
      ) : errorFantasy ? (
        <div className="text-red-500">{errorFantasy}</div>
      ) : fantasyData.length > 0 ? (
        <div className="bg-purplePanel p-2 rounded-md">
          <table className="w-full bg-darkPurple border border-limeGreenOpacity rounded-lg shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-darkPurple text-notWhite text-center border-b border-limeGreenOpacity">
                <th className="py-1 px-1 font-medium">Rank</th>
                <th className="py-1 px-1 font-medium">Profile</th>
                <th className="py-0 px-0 font-medium">Manager</th>
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

export default FantasyTab;
