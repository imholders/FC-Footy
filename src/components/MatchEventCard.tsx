import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RAGameContext from './ai/RAGameContext';
import { WarpcastShareButton } from './ui/WarpcastShareButton';
import { getFansForTeam } from '../lib/kvPerferences';
import { fetchFanPfp } from './utils/fetchFCProfile';

interface Detail {
  athletesInvolved: Array<{ displayName: string }>;
  type: { text: string };
  clock: { displayValue: string };
  team: { id: string; abbreviation: string };
}

interface KeyMoment {
  action: string;
  teamName?: string;
  logo: string;
  playerName: string;
  times: string[];
}

interface EventCardProps {
  sportId: string;
  event: {
    id: string;
    shortName: string;
    name: string;
    date: string;
    status: { displayClock: string; type: { detail: string } };
    competitions: {
      competitors: {
        team: { logo: string; id: string; abbreviation: string };
        score: number;
      }[];
      details: Detail[];
    }[];
  };
}

interface SelectedMatch {
  homeTeam: string;
  awayTeam: string;
  competitorsLong: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number;
  awayScore: number;
  clock: string;
  eventStarted: boolean;
  keyMoments: string[];
}

const MatchEventCard: React.FC<EventCardProps> = ({ event, sportId }) => {
  const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(null);
  const [gameContext, setGameContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [setIsAiSummaryGenerated] = useState(false);
  // State for fan avatar rows for team1 and team2
  const [matchFanAvatarsTeam1, setMatchFanAvatarsTeam1] = useState<Array<{ fid: number; pfp: string }>>([]);
  const [matchFanAvatarsTeam2, setMatchFanAvatarsTeam2] = useState<Array<{ fid: number; pfp: string }>>([]);
  const elementRef = useRef<HTMLDivElement | null>(null);

  // Extract match info from event data.
  const competitorsLong = event.name;
  const homeTeam = event.shortName.slice(6, 9);
  const awayTeam = event.shortName.slice(0, 3);
  const eventStarted = new Date() >= new Date(event.date);
  const clock = event.status.displayClock + ' ' + event.status.type.detail || '00:00';

  const homeTeamLogo = event.competitions[0]?.competitors[0]?.team.logo;
  const awayTeamLogo = event.competitions[0]?.competitors[1]?.team.logo;
  const homeScore = event.competitions[0]?.competitors[0]?.score;
  const awayScore = event.competitions[0]?.competitors[1]?.score;

  const keyMoments: KeyMoment[] = event.competitions[0]?.details
    ?.sort((a: Detail, b: Detail) => {
      const timeA = a.clock.displayValue || "00:00";
      const timeB = b.clock.displayValue || "00:00";
      const secondsA = timeA.split(":").reduce((min, sec) => min * 60 + parseInt(sec, 10), 0);
      const secondsB = timeB.split(":").reduce((min, sec) => min * 60 + parseInt(sec, 10), 0);
      return secondsA - secondsB;
    })
    ?.reduce((acc: KeyMoment[], detail: Detail) => {
      const playerName = detail.athletesInvolved?.[0]?.displayName || "Coaching staff";
      const action = detail.type.text;
      const time = detail.clock.displayValue || "00:00";
      const teamId = detail.team.id;

      let teamLogo = "";
      let teamName = "";
      if (teamId === event.competitions[0]?.competitors[0]?.team.id) {
        teamLogo = homeTeamLogo;
        teamName = homeTeam;
      } else {
        teamLogo = awayTeamLogo;
        teamName = awayTeam;
      }

      acc.push({
        playerName,
        times: [time],
        action:
          action === "Goal" || action === "Goal - Header" || action === "Penalty - Scored" ||
          action === "Goal - Volley" || action === "Goal - Free-kick" || action === "Own Goal"
            ? action === "Own Goal" ? `🔴` : `⚽️`
            : action === "Yellow Card"
            ? `🟨`
            : action === "Red Card"
            ? `🟥`
            : `${action} ${teamName}`,
        logo: teamLogo,
        teamName,
      });
      return acc;
    }, []) || [];

  const handleSelectMatch = () => {
    const keyMomentStrings = keyMoments.map((moment) => {
      const formattedTime = moment.times?.join(", ") || "No time provided";
      return `${moment.action} ${moment.teamName} by ${moment.playerName} at ${formattedTime}`;
    });
    setSelectedMatch({
      homeTeam,
      awayTeam,
      competitorsLong,
      homeLogo: homeTeamLogo,
      awayLogo: awayTeamLogo,
      homeScore,
      awayScore,
      clock,
      eventStarted,
      keyMoments: keyMomentStrings,
    });
  };

  const fetchAiSummary = async () => {
    if (selectedMatch) {
      try {
        setLoading(true);
        const data = await RAGameContext(event.id, sportId, competitorsLong);
        if (data && typeof data === 'string') {
          setGameContext(data);
          setIsAiSummaryGenerated(true);
        } else {
          setGameContext('Failed to fetch AI context.');
        }
      } catch (error) {
        setGameContext('Failed to fetch game context.');
        console.error('Failed to fetch game context:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const readMatchSummary = () => {
    if (gameContext) {
      const utterance = new SpeechSynthesisUtterance(gameContext);
      utterance.rate = 1.5;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  // When key moments are toggled on, fetch fan avatars for each team separately.
  useEffect(() => {
    const fetchTeamFanAvatars = async () => {
      const team1 = event.competitions[0]?.competitors[0]?.team;
      const team2 = event.competitions[0]?.competitors[1]?.team;
      if (team1 && team2) {
        try {
          console.log("Fetching fans for team1:", team1.abbreviation.toLowerCase());
          const fanFidsTeam1 = await getFansForTeam(team1.abbreviation.toLowerCase());
          console.log("Fan FIDs for team1:", fanFidsTeam1);
          const fanPfpPromises1 = fanFidsTeam1.map(async (fid) => {
            const pfp = await fetchFanPfp(fid);
            console.log(`Fetched pfp for fid ${fid} (team1):`, pfp);
            return pfp ? { fid, pfp } : null;
          });
          const fanResults1 = await Promise.all(fanPfpPromises1);
          const validFans1 = fanResults1.filter((fan) => fan !== null) as Array<{ fid: number; pfp: string }>;
          console.log("Valid fans for team1:", validFans1);
          setMatchFanAvatarsTeam1(validFans1);

          console.log("Fetching fans for team2:", team2.abbreviation.toLowerCase());
          const fanFidsTeam2 = await getFansForTeam(team2.abbreviation.toLowerCase());
          console.log("Fan FIDs for team2:", fanFidsTeam2);
          const fanPfpPromises2 = fanFidsTeam2.map(async (fid) => {
            const pfp = await fetchFanPfp(fid);
            console.log(`Fetched pfp for fid ${fid} (team2):`, pfp);
            return pfp ? { fid, pfp } : null;
          });
          const fanResults2 = await Promise.all(fanPfpPromises2);
          const validFans2 = fanResults2.filter((fan) => fan !== null) as Array<{ fid: number; pfp: string }>;
          console.log("Valid fans for team2:", validFans2);
          setMatchFanAvatarsTeam2(validFans2);
        } catch (error) {
          console.error("Error fetching match fan avatars:", error);
        }
      } else {
        console.error("Match teams not defined.");
      }
    };

    if (showDetails) {
      fetchTeamFanAvatars();
    } else {
      setMatchFanAvatarsTeam1([]);
      setMatchFanAvatarsTeam2([]);
    }
  }, [showDetails, event]);

  // Combine both teams' fan avatars into one array.
  const combinedFanAvatars = [...matchFanAvatarsTeam1, ...matchFanAvatarsTeam2];

  return (
    <div key={event.id} className="sidebar">
      <div className="cursor-pointer border border-darkPurple">
        <button
          onClick={() => {
            handleSelectMatch();
            toggleDetails();
          }}
          className="dropdown-button cursor-pointer flex items-center mb-2 w-full"
        >
          <div className="cursor-pointer text-lightPurple mr-4">
            {showDetails ? "▼" : "▷"}
          </div>
          <span className="flex justify-center space-x-4 ml-2 mr-2">
            <div className="flex flex-col items-center space-y-1">
              <Image
                src={homeTeamLogo || "/assets/defifa_spinner.gif"}
                alt="Home Team Logo"
                className="w-8 h-8"
                width={20}
                height={20}
              />
              <span>{homeTeam}</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              {eventStarted ? (
                <>
                  <span className="text-white font-bold text-2xl">
                    {homeScore} - {awayScore}
                  </span>
                  <span className="text-lightPurple text-xs">{clock}</span>
                </>
              ) : (
                <span className="flex flex-col items-center">
                  <span>Kickoff:</span>
                  <span className="text-sm text-lightPurple">
                    {new Date(event.date).toLocaleString("en-GB", {
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              )}
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Image
                src={awayTeamLogo || "/assets/defifa_spinner.gif"}
                alt="Away Team Logo"
                className="w-8 h-8"
                width={20}
                height={20}
              />
              <span>{awayTeam}</span>
            </div>
          </span>
        </button>
      </div>

      {showDetails && selectedMatch && (
        <div ref={elementRef} className="mt-2 bg-purplePanel p-4 rounded-lg">
          {keyMoments.length > 0 && (
            <>
              <h4 className="text-notWhite font-semibold mb-2">Key Moments:</h4>
              <div className="space-y-1">
                {keyMoments.map((moment, index) => (
                  <div key={index} className="text-sm text-lightPurple flex items-center">
                    <span className="mr-2 font-bold">{moment.action}</span>
                    <Image
                      src={moment.logo || "/assets/defifa_spinner.gif"}
                      alt={`${moment.teamName} Logo`}
                      className="w-6 h-6 mr-2"
                      width={15}
                      height={15}
                    />
                    <span>{moment.playerName}</span>
                    <span className="text-xs ml-1">{moment.times.join(", ")}</span>
                  </div>
                ))}
              </div>

              {/* Combined Fan Avatars Section */}
              <div className="mt-4">
                <h4 className="text-notWhite font-semibold mb-1">
                  Fans ({combinedFanAvatars.length})
                </h4>
                <div className="flex space-x-1 overflow-x-auto">
                  {combinedFanAvatars.length > 0 ? (
                    combinedFanAvatars.map((fan) => (
                      <Link key={fan.fid} href={`https://warpcast.com/~/profiles/${fan.fid}`}>
                        <Image
                          src={fan.pfp}
                          alt={`Fan ${fan.fid}`}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      </Link>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No fans found.</span>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="mt-4 flex flex-row gap-4 justify-center items-center">
            <button
              className="w-full sm:w-38 bg-deepPink text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-deepPink hover:bg-fontRed"
              onClick={fetchAiSummary}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 2.577 1.03 4.91 2.709 6.709l1.291-1.418z"
                    ></path>
                  </svg>
                  Waiting for VAR...
                </div>
              ) : (
                eventStarted ? "Summary" : "Preview"
              )}
            </button>

            <WarpcastShareButton
              selectedMatch={selectedMatch}
              targetElement={elementRef.current}
            />
          </div>

          {gameContext && (
            <div className="mt-4 text-lightPurple bg-purplePanel">
              <h2 className="font-2xl text-notWhite font-bold mb-4">
                <button onClick={readMatchSummary}>
                  {eventStarted ? `[AI] Match Summary 🗣️🎧1.5x` : `[AI] Match Preview 🗣️🎧1.5x`}
                </button>
              </h2>
              <pre className="text-sm whitespace-pre-wrap break-words mb-4">{gameContext}</pre>
              <WarpcastShareButton
                selectedMatch={selectedMatch}
                targetElement={elementRef.current}
              />
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default MatchEventCard;
