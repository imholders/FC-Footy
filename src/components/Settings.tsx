import React, { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import { fetchTeamLogos } from "./utils/fetchEPLTable";
import {
  getTeamPreferences,
  setTeamPreferences,
} from "../lib/kvPerferences";

interface Team {
  name: string;
  abbreviation: string;
  logoUrl: string;
}

const Settings = () => {
  const [status, setStatus] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [favTeams, setFavTeams] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { user } = usePrivy();
  const farcasterAccount = user?.linkedAccounts.find(
    (account) => account.type === "farcaster"
  );

  useEffect(() => {
    if (farcasterAccount) {
      const fid = Number(farcasterAccount.fid);
      // Fetch team preferences from Redis
      getTeamPreferences(fid)
        .then((teamsFromRedis) => {
          console.log("Existing team preferences:", teamsFromRedis);
          if (teamsFromRedis) {
            setFavTeams(teamsFromRedis);
          }
        })
        .catch((err) => {
          console.error("Error fetching team preferences:", err);
        });
    }

    fetchTeamLogos().then((data) => setTeams(data));
  }, [farcasterAccount]);

  const handleRowClick = async (team: Team) => {
    if (!farcasterAccount) {
      setStatus("User not authenticated");
      // Clear status after 2 seconds
      setTimeout(() => setStatus(""), 2000);
      return;
    }

    const fid = Number(farcasterAccount.fid);
    let updatedFavTeams: string[];

    if (favTeams.includes(team.abbreviation)) {
      setStatus(`Removing ${team.name} from notifications`);
      updatedFavTeams = favTeams.filter((t) => t !== team.abbreviation);
    } else {
      setStatus(`Adding ${team.name} as favorite`);
      updatedFavTeams = [...favTeams, team.abbreviation];
    }
    // Update the preferences in Redis
    await setTeamPreferences(fid, updatedFavTeams);
    setFavTeams(updatedFavTeams);

    // Clear the search term if any
    if (searchTerm.trim() !== "") {
      setSearchTerm("");
    }

    // Clear status message after 2 seconds
    setTimeout(() => setStatus(""), 2000);
  };

  // Filter teams based on the search term (case-insensitive)
  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // When there is no search term, order the teams so that those with notifications appear first.
  const orderedTeams =
    searchTerm.trim() === ""
      ? [...filteredTeams].sort((a, b) => {
          const aFav = favTeams.includes(a.abbreviation);
          const bFav = favTeams.includes(b.abbreviation);
          if (aFav === bFav) return 0;
          return aFav ? -1 : 1;
        })
      : filteredTeams;

  return (
    <div className="p-4">
      {/* Fixed status container */}
      <div className="min-h-[2rem]">
        {status && <p className="text-fontRed">{status}</p>}
      </div>

      {favTeams.length > 0 && (
        <div className="mb-4 text-center text-notWhite font-semibold">
          Favorite Team: {favTeams[0]}{" "}
          <span role="img" aria-label="notification">
            🔔
          </span>
        </div>
      )}

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search clubs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-darkPurple p-2 border rounded-md border-limeGreenOpacity focus:outline-none focus:ring-2 focus:ring-darkPurple"
        />
      </div>

      {/* Scrollable table container */}
      <div className="w-full h-[400px] overflow-y-auto p-2">
        <table className="w-full bg-darkPurple border border-limeGreenOpacity rounded-lg shadow-lg">
          <thead className="bg-darkPurple">
            <tr className="text-notWhite text-center border-b border-limeGreenOpacity">
              <th className="py-1 px-1 font-medium">
                Select clubs to get notifications
              </th>
            </tr>
          </thead>
          <tbody>
            {orderedTeams.map((team) => (
              <tr
                key={team.abbreviation}
                onClick={() => handleRowClick(team)}
                className={`border-b border-limeGreenOpacity hover:bg-purplePanel transition-colors text-lightPurple text-sm cursor-pointer ${
                  favTeams.includes(team.abbreviation) ? "bg-purplePanel" : ""
                }`}
              >
                <td className="py-1 px-1">
                  <div className="flex items-center space-x-2">
                    <span>{team.name}</span>
                    {favTeams.includes(team.abbreviation) && (
                      <span
                        role="img"
                        aria-label="notification"
                        className="ml-2"
                      >
                        🔔
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-1 px-1 text-center">
                  <Image
                    src={team.logoUrl}
                    alt={team.name}
                    width={30}
                    height={30}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Settings;
