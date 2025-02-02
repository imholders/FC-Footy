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
      console.error("User not authenticated");
      return;
    }

    const fid = Number(farcasterAccount.fid);
    let updatedFavTeams: string[];

    if (favTeams.includes(team.abbreviation)) {
      console.log(`Removing ${team.name} from notifications`);
      updatedFavTeams = favTeams.filter((t) => t !== team.abbreviation);
    } else {
      console.log(`Adding ${team.name} as favorite`);
      updatedFavTeams = [...favTeams, team.abbreviation];
    }
    // Update the preferences in Redis
    await setTeamPreferences(fid, updatedFavTeams);
    setFavTeams(updatedFavTeams);

    // Clear the search term if any
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
          const aFav = favTeams.includes(a.abbreviation);
          const bFav = favTeams.includes(b.abbreviation);
          if (aFav === bFav) return 0;
          return aFav ? -1 : 1;
        })
      : filteredTeams;

  // Look up the full team object for the favorite team (if any)
  const favTeamObj =
    favTeams.length > 0
      ? teams.find((team) => team.abbreviation === favTeams[0])
      : null;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {favTeams.length > 0 && (
        <div className="mb-2 text-center text-notWhite font-semibold">
          Favorite Team: {favTeamObj ? favTeamObj.name : favTeams[0]}{" "}
          {favTeamObj && (
            <Image
              src={favTeamObj.logoUrl}
              alt={favTeamObj.name}
              width={30}
              height={30}
              className="inline-block ml-2"
            />
          )}
        </div>
      )}

      {/* Search input aligned with table */}
      <div className="mb-4 w-full">
        <input
          type="text"
          placeholder="Search clubs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-darkPurple p-2 border rounded-md border-limeGreenOpacity focus:outline-none focus:ring-2 focus:ring-darkPurple"
        />
      </div>

      {/* Scrollable table container */}
      <div className="w-full h-[500px] overflow-y-auto">
        <table className="w-full bg-darkPurple">
          {/* Conditionally render header only when no favorite team is selected */}
          {favTeams.length === 0 && (
            <thead className="bg-darkPurple">
              <tr className="text-fontRed text-center border-b border-limeGreenOpacity">
                <th className="py-1 text-left font-medium">
                  Select clubs to get notifications
                </th>
              </tr>
            </thead>
          )}
          <tbody>
            {orderedTeams.map((team) => (
              <tr
                key={team.abbreviation}
                onClick={() => handleRowClick(team)}
                className={`hover:bg-purplePanel transition-colors text-lightPurple text-sm cursor-pointer ${
                  favTeams.includes(team.abbreviation) ? "bg-purplePanel" : ""
                }`}
              >
                <td className="py-1 px-4 border-b border-limeGreenOpacity">
                  <div className="flex items-center space-x-2">
                    <span>{team.name}</span>
                    {favTeams.includes(team.abbreviation) && (
                      <span
                        role="img"
                        aria-label="notification"
                        className="ml-2"
                      >
                        <img
                          src="/banny_goal.png"
                          alt="goal emoji"
                          className="inline-block w-6 h-6"
                        />
                        <img
                          src="/banny_redcard.png"
                          alt="red card emoji"
                          className="inline-block w-6 h-6"
                        />
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-1 px-4 border-b border-limeGreenOpacity text-center">
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
