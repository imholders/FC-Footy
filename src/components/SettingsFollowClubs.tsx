import React, { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import { fetchTeamLogos } from "./utils/fetchTeamLogos";
import {
  getTeamPreferences,
  setTeamPreferences,
} from "../lib/kvPerferences";

interface Team {
  name: string;
  abbreviation: string;
  league: string;
  logoUrl: string;
}

interface SettingsFollowClubsProps {
  onSave?: (newFavorites: string[]) => void;
}

const appUrl = process.env.NEXT_PUBLIC_URL;
const altImage =`${appUrl}/512.png`

// Helper function to generate a unique ID for each team.
const getTeamId = (team: Team) => `${team.league}-${team.abbreviation}`;

const SettingsFollowClubs: React.FC<SettingsFollowClubsProps> = ({ onSave }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [favTeams, setFavTeams] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loadingTeamIds, setLoadingTeamIds] = useState<string[]>([]);
  const { user } = usePrivy();
  const farcasterAccount = user?.linkedAccounts.find(
    (account) => account.type === "farcaster"
  );

  useEffect(() => {
    if (farcasterAccount) {
      const fid = Number(farcasterAccount.fid);
      getTeamPreferences(fid)
        .then((teamsFromRedis) => {
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
      console.error("User not authenticated");
      return;
    }
    const teamId = getTeamId(team);
    const fid = Number(farcasterAccount.fid);

    // Prevent new clicks if any update is in progress
    if (loadingTeamIds.length > 0) return;

    // Mark this team as loading
    setLoadingTeamIds((prev) => [...prev, teamId]);

    let updatedFavTeams: string[];

    if (favTeams.includes(teamId)) {
      // Remove team
      updatedFavTeams = favTeams.filter((id) => id !== teamId);
    } else {
      // Add team
      updatedFavTeams = [...favTeams, teamId];
    }

    await setTeamPreferences(fid, updatedFavTeams);
    setFavTeams(updatedFavTeams);
    onSave?.(updatedFavTeams);
    
    // Remove the loading state for this team
    setLoadingTeamIds((prev) => prev.filter((id) => id !== teamId));
    
    // Clear search term if needed
    if (searchTerm.trim() !== "") {
      setSearchTerm("");
    }
  };

  // Filter teams based on the search term (case-insensitive)
  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // When there is no search term, order the teams so that those with notifications appear first.
  const orderedTeams =
    searchTerm.trim() === ""
      ? [...filteredTeams].sort((a, b) => {
          const aFav = favTeams.includes(getTeamId(a));
          const bFav = favTeams.includes(getTeamId(b));
          if (aFav === bFav) return 0;
          return aFav ? -1 : 1;
        })
      : filteredTeams;

  // Lookup the full team object for the first favorite team (if any).
  const favTeamObj =
    favTeams.length > 0
      ? teams.find((team) => getTeamId(team) === favTeams[0])
      : null;

  return (
    <div className="w-full h-full overflow-y-auto">
      {favTeams.length > 0 && (
        <div className="mb-2 text-center text-notWhite font-semibold">
          Favorite Team: {favTeamObj ? favTeamObj.name : favTeams[0]}{" "}
          {favTeamObj && (
            <Image
              src={favTeamObj.logoUrl || altImage}
              alt={favTeamObj.name}
              width={30}
              height={30}
              className="inline-block ml-2"
            />
          )}
        </div>
      )}

      {/* Search input */}
      <div className="mb-4 w-full">
        <input
          type="text"
          placeholder="Search teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-darkPurple p-2 border rounded-md border-limeGreenOpacity focus:outline-none focus:ring-2 focus:ring-darkPurple"
        />
      </div>

      {/* Scrollable table container */}
      <div className="w-full h-[500px] overflow-y-auto">
        <table className="w-full bg-darkPurple">
          {favTeams.length === 0 && (
            <thead className="bg-darkPurple">
              <tr className="text-fontRed text-center border-b border-limeGreenOpacity">
                <th className="py-1 text-left font-medium">
                  Select your favorite team first
                </th>
                <th className="py-1 text-center font-medium"></th>
                <th className="py-1 text-right font-medium"></th>
              </tr>
            </thead>
          )}
          <tbody>
            {orderedTeams.map((team) => {
              const teamId = getTeamId(team);
              const isLoading = loadingTeamIds.includes(teamId);
              return (
                <tr
                  key={teamId}
                  // Only allow row clicks if no row is loading.
                  onClick={() => {
                    if (!isLoading && loadingTeamIds.length === 0) {
                      handleRowClick(team);
                    }
                  }}
                  className={`hover:bg-purplePanel transition-colors text-lightPurple text-sm cursor-pointer ${
                    favTeams.includes(teamId) ? "bg-purplePanel" : ""
                  }`}
                >
                  <td className="py-1 px-4 border-b border-limeGreenOpacity text-left">
                    <div className="flex items-center space-x-2">
                      <span>{team.name}</span>
                      {favTeams.includes(teamId) && (
                        <span role="img" aria-label="notification" className="ml-2">
                          🔔
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-1 px-4 border-b border-limeGreenOpacity text-center">
                    {isLoading ? (
                      <Image
                        src="/defifa_spinner.gif"
                        alt="loading"
                        width={30}
                        height={30}
                      />
                    ) : (
                      <Image
                        src={team.logoUrl || altImage}
                        alt={team.name}
                        width={30}
                        height={30}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SettingsFollowClubs;
