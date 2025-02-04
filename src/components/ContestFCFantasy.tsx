import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import FantasyRow from './ContestFantasyRow';
import { fetchFantasyData } from './utils/fetchFantasyData';
import { usePrivy } from "@privy-io/react-auth";
// import html2canvas from 'html2canvas';

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
  // New state to hold the selected entry.
  const [selectedEntry, setSelectedEntry] = useState<FantasyEntry | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = usePrivy();
  const farcasterAccount = user?.linkedAccounts.find(
   (account) => account.type === "farcaster"
  );

  const defaultCardEntry = farcasterAccount
  ? fantasyData.find(
    (entry) =>
      entry.manager.toLowerCase() === farcasterAccount?.username?.toLowerCase()
  )
  : fantasyData.find((entry) => entry.rank === 1);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingFantasy(true);
      setErrorFantasy(null);
      setLoadingMessage(
        loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
      );

      try {
        const data = await fetchFantasyData();
        // Ensure each entry has a rank (if missing, default to its position + 1)
        const rankedData = data.map((item, i) => ({
          ...item,
          rank: item.rank ?? i + 1,
        }));
        setFantasyData(rankedData);
      } catch (error) {
        setErrorFantasy(
          error instanceof Error ? error.message : 'An unknown error occurred'
        );
      } finally {
        setLoadingFantasy(false);
      }
    };

    fetchData();
  }, []);

  // When a row is tapped, update the selectedEntry state and scroll to the top.
  const handleRowSelect = (selected: FantasyEntry) => {
    setSelectedEntry(selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

 /*  const handleShareCard = async () => {
    if (cardRef.current) {
      try {
        // Convert the card element to a canvas
        const canvas = await html2canvas(cardRef.current);
        // Get the base64-encoded image URL
        const imageDataUrl = canvas.toDataURL('image/png');
        // Build your Warpcast intent URL:
        // For example, we encode a message and embed two items: the captured image and farcaster.xyz
        const text = encodeURIComponent("Check out my Farcaster Footy card!");
        const embedImage = encodeURIComponent(imageDataUrl);
        const embedFallback = encodeURIComponent("https://farcaster.xyz");
        const warpcastURL = `https://warpcast.com/~/compose?text=${text}&embeds[]=${embedImage}&embeds[]=${embedFallback}`;
        
        // Open the Warpcast intent in a new tab/window
        window.open(warpcastURL, "_blank");
      } catch (err) {
        console.error("Error sharing card:", err);
      }
    }
  }; */
  
  // The card will show the selected entry if one exists; otherwise, default to the entry with rank === 1.
  //const cardEntry = selectedEntry || fantasyData.find((entry) => entry.rank === 1);
  const cardEntry = selectedEntry || defaultCardEntry;



  return (
    <div>
      <h2 className="font-2xl text-notWhite font-bold mb-2">Leaderboard</h2>

      {/* First Place Manager / Selected Manager Card */}
      {cardEntry && (
        <div ref={cardRef} className="relative bg-gray-800 p-6 rounded-lg shadow-xl mb-2 border-4 border-limeGreenOpacity overflow-hidden">
          {/* Manager Info */}
          <div className="flex items-center space-x-4 relative z-10">
            {/* Profile Image Container with Defifa Logo Overlay */}
            <div className="relative">
              <Image
                src={cardEntry.pfp || '/defifa_spinner.gif'}
                alt="Manager Avatar"
                className="rounded-full w-20 h-20"
                width={80}
                height={80}
              />
              {/* Defifa logo overlay in bottom-right corner */}
              <div className="absolute bottom-0 right-0">
                <Image
                  src="/defifa_spinner.gif"
                  alt="Defifa Logo"
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-3xl tracking-wider font-vt323">
                {cardEntry.manager}
              </p>
              <p className="text-gray-300 text-2xl font-vt323">
                {cardEntry.team.name}
              </p>
              <p className="text-white text-2xl font-vt323">
                Rank: {cardEntry.rank}
              </p>
              <p className="text-white text-md font-vt323">
                Points: {cardEntry.total}
              </p>
            </div>
          </div>

          {/* Manager's Favorite Team Logo Overlay (Watermark) */}
          {cardEntry.team.logo && (
            <div className="absolute top-0 right-0 opacity-20">
              <Image
                src={cardEntry.team.logo || '/default-team-logo.png'}
                alt="Team Logo"
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      {loadingFantasy ? (
        <div className="text-lightPurple text-center animate-pulse">
          <div>{loadingMessage}</div>
        </div>
      ) : errorFantasy ? (
        <div className="text-red-500">{errorFantasy}</div>
      ) : fantasyData.length > 0 ? (
        <div className="bg-purplePanel p-1 rounded-md">
          {/* Mint Button above table (if desired) */}
          <div className="mb-4 relative z-10 flex justify-center">
            {/* <button 
              onClick={handleShareCard}
              className="bg-deepPink px-4 py-2 rounded-md text-lightPurple font-bold">
              Share
            </button> */}
          </div>
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
                <FantasyRow
                  key={index}
                  entry={entry}
                  onRowClick={handleRowSelect}
                />
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
