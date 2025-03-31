import React, { useEffect, useState } from 'react';
import { getTeamPreferences } from "../lib/kvPerferences";
import { usePrivy } from "@privy-io/react-auth";
import { getTeamLogo } from "../components/utils/fetchTeamLogos";
import { getFansForTeam } from '../lib/kvPerferences'; // Assuming these functions are imported from a relevant file
import { fetchFanUserData } from './utils/fetchFCProfile';
import { fetchFollowers } from './utils/fetchCheckIfFollowing';
import { fetchCheckIfFollowing } from './utils/fetchCheckIfFollowing';

const ForYouComponent: React.FC = () => {
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [teamLinks, setTeamLinks] = useState<Record<string, any[]>>({});
  const { user } = usePrivy();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [favoriteTeamFans, setFavoriteTeamFans] = useState<Array<{ fid: number; pfp: string; mutual: boolean }>>([]);

  // Fetch the user's favorite teams from Redis
  useEffect(() => {
    const fetchFavoriteTeams = async () => {
      try {
        const farcasterAccount = user?.linkedAccounts.find(
          (account) => account.type === "farcaster"
        );
        const fid = farcasterAccount?.fid;

        if (!fid) {
          setError("No Farcaster FID found in Privy account");
          return;
        }

        const preferences = await getTeamPreferences(fid);
        if (preferences) {
          console.log("Fetched team preferences:", preferences);
          setFavoriteTeams(preferences);
        } else {
          setFavoriteTeams([]);
        }
      } catch (error: any) {
        console.error("Error fetching team preferences:", error);
        setError("Error fetching team preferences");
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteTeams();
  }, [user]);

  useEffect(() => {
    if (favoriteTeams.length === 0) return;

    const leagueMap: Record<string, string[]> = {};

    favoriteTeams.forEach((teamId) => {
      const [league, abbr] = teamId.split("-");
      if (!leagueMap[league]) {
        leagueMap[league] = [];
      }
      leagueMap[league].push(abbr);
    });

    Object.entries(leagueMap).forEach(([league, abbrs]) => {
      fetchTeamLinksByLeague(league, abbrs);
    });
  }, [favoriteTeams]);

  const getTeamLogoUrl = (teamId: string): string => {
    const [league, abbr] = teamId.split("-");
    return getTeamLogo(abbr, league);
  };

  const fetchTeamLinksByLeague = async (league: string, teamAbbrs: string[]) => {
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams`);
      const data = await res.json();
      const teams = data?.sports?.[0]?.leagues?.[0]?.teams || [];

      const newLinks: Record<string, any[]> = {};
      teamAbbrs.forEach((abbr) => {
        const matched = teams.find(
          (t: any) => t.team.abbreviation.toLowerCase() === abbr.toLowerCase()
        );
        if (matched?.team?.links) {
          newLinks[abbr] = matched.team.links;
        }
      });

      setTeamLinks((prev) => ({
        ...prev,
        ...newLinks
      }));
    } catch (err) {
      console.error(`Failed to fetch team links for league ${league}`, err);
    }
  };

  useEffect(() => {
    const fetchFans = async () => {
      if (!selectedTeam) return;
      const [, abbr] = selectedTeam.split("-");
      const fanFids = await getFansForTeam(selectedTeam.toLowerCase());
      const currentFid = user?.linkedAccounts.find((a) => a.type === "farcaster")?.fid;
      const fans = [];
      for (const fidString of fanFids) {
        const fid = Number(fidString);
        const userData = await fetchFanUserData(fid);
        const pfp = userData?.USER_DATA_TYPE_PFP?.[0];
        if (pfp && currentFid) {
          const mutual = !!(await fetchCheckIfFollowing(currentFid, fid));
          fans.push({ fid, pfp, mutual });
        }
      }
      setFavoriteTeamFans(fans);
    };
    fetchFans();
  }, [selectedTeam]);

  if (loading) return <div>For you today</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2 className='text-notWhite'>Teams you follow</h2>
      <div className="flex overflow-x-auto gap-4 py-4">
        {favoriteTeams.map((teamId) => {
          const [league, abbr] = teamId.split("-");
          return (
            <div
              key={teamId}
              onClick={() => setSelectedTeam(teamId)}
              className={`flex-none w-[120px] border ${
                teamId === selectedTeam ? "border-limeGreenOpacity shadow-[0_0_10px_2px_rgba(173,255,47,0.5)]" : "border-lightPurple"
              } rounded-lg p-2 text-center bg-purplePanel cursor-pointer`}
            >
              <img
                src={getTeamLogoUrl(teamId)}
                alt={teamId}
                className="w-[60px] h-[60px] object-contain mb-2 mx-auto"
              />
            </div>
          );
        })}
      </div>
      {selectedTeam && (() => {
        const matched = favoriteTeams.find(id => id === selectedTeam);
        const fullName = matched ? getTeamLogoUrl(matched).split('/').pop()?.replace('.png', '').replace(/-/g, ' ') : abbr;
        const [, abbr] = selectedTeam.split("-");
        const links = teamLinks[abbr];
        if (!links) return null;

        return (
          <div className="mt-4 px-2 relative rounded-lg overflow-hidden">
            <h3 className="text-notWhite mb-2">Lastest context</h3>
            <div className="space-y-1">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lightPurple hover:underline block text-sm"
                >
                  {link.text || link.shortText}
                </a>
              ))}
            </div>
            <div className="mt-6">
              <h3 className="text-notWhite mb-1">Team Followers ({favoriteTeamFans.length})</h3>
              <div className="grid grid-cols-10 gap-1">
                {favoriteTeamFans.length > 0 ? (
                  favoriteTeamFans.map((fan) => (
                    <a key={fan.fid} href={`https://warpcast.com/~/profiles/${fan.fid}`} target="_blank" rel="noopener noreferrer">
                      <img
                        src={fan.pfp}
                        alt={`Fan ${fan.fid}`}
                        className={`rounded-full w-7 h-7 ring-2 ${fan.mutual ? 'ring-limeGreen' : 'ring-fontRed'}`}
                      />
                    </a>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">No fans found.</span>
                )}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-notWhite mb-1">Fan memorabilia (8) mints</h3>
            </div>
            <div className="aspect-w-16 aspect-h-9 w-full">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/JvkcfYolhAw?si=2EkYxV2lxjeMydAp"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ForYouComponent;