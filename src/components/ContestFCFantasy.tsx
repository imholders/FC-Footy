import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import FantasyRow from './ContestFantasyRow';
import { fetchFantasyData } from './utils/fetchFantasyData';
import { usePrivy } from "@privy-io/react-auth";
// import { fetchCountryFromGeo } from './CountryFlags';

interface FantasyEntry {
  rank: number | null;  // Allow null for rank if needed
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
  location: string | null;  // location can be string or null
  fid: number | null;
}



const loadingMessages = [
  "Loading... just like Arsenal's defense.",
  "Waiting is the hardest part... like Chelsea's signings.",
  "It’s the hope that kills you... like Liverpool's injuries.",
  "Slower than VAR... and that’s City’s attack.",
  "Patience is a virtue, but this is United.",
  "Loading... like Tottenham’s rebuild.",
  "It’s the hope that kills you... like Leicester’s fairytale.",
  "Patience is a virtue... just like West Ham’s top-four hopes.",
  "Waiting is the hardest part... like Everton’s play.",
  "Slower than VAR... like Leeds' pressing."
];

const ContestFCFantasy = () => {
  const [fantasyData, setFantasyData] = useState<FantasyEntry[]>([]);
  const [loadingFantasy, setLoadingFantasy] = useState(false);
  const [errorFantasy, setErrorFantasy] = useState<string | null>(null);
  const [loadingMessage1, setLoadingMessage] = useState("");
  // New state to hold the selected entry.
  const [selectedEntry, setSelectedEntry] = useState<FantasyEntry | null>(null);
  // const [country, setCountry] = useState<{ name: string; code: string } | null>(null);
  // const [countryCache, setCountryCache] = useState<Record<string, { name: string; code: string }>>({});

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

  const handleRowSelect = (selected: FantasyEntry) => {
    setSelectedEntry(selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cardEntry = selectedEntry || defaultCardEntry;
  console.log("Selected entry:", cardEntry);
/*   useEffect(() => {
    if (cardEntry?.location?.startsWith("geo:")) {
      if (countryCache[cardEntry.location]) {
        setCountry(countryCache[cardEntry.location]);
        console.log("Country from cache:", countryCache[cardEntry.location]); // remove if not going to use flags
      } else {
        fetchCountryFromGeo(cardEntry.location).then((result) => {
          const newCountry = result || { name: "Unknown", code: "unknown" }; // Default to Unknown
          setCountryCache((prev) => ({ ...prev, [cardEntry.location]: newCountry }));
          setCountry(newCountry);
        });
      }
    } else {
      setCountry({ name: "Unknown", code: "unknown" }); // Set default when no location
    }
    }, [cardEntry?.location, countryCache]);
 */
  return (
    <div>
      <h2 className="font-2xl text-notWhite font-bold mb-2">FEPL 2024/25 Leaderboard - Closed League</h2>
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
    <div>{loadingMessage1}</div> {/* Display the random loading message */}
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
          <FantasyRow key={index} entry={entry as FantasyEntry} onRowClick={handleRowSelect} />
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
