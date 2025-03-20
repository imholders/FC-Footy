/* eslint-disable */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameData } from '../types/gameTypes';
import { apolloClient } from '../lib/apollo-client';
import { GET_GAME_BY_EVENT_ID } from '../lib/graphql/queries';
import useEventsData from '../components/utils/useEventsData';
import useFindClosestMatch from '../components/utils/useFindClosestMatch';

interface GameContextType {
  gameDataState: GameData | null;
  homeScore: string | number;
  awayScore: string | number;
  gameClock: string;
  gameStatus: string;
  setGameDataState: (data: GameData | null) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  error: string | null;
  setError: (value: string | null) => void;
  winnerProfiles: Record<string, { username: string; pfp: string }>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};

interface Match {
  id: string;
  date: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeLogo: string;
  awayLogo: string;
  matchClock: string;
  matchStatus: string;
  matchCompleted: boolean;
  matchEvents: any[];
  matchSummary: string;
  tvBroadcasts?: {
    network: string;
    region: string;
    language: string;
  }[];
  bettingOdds?: {
    provider: string;
    homeOdds: number;
    awayOdds: number;
    drawOdds: number;
  }[];
}

export const GameProvider: React.FC<{ children: ReactNode; eventId: string }> = ({ children, eventId }) => {
  const [gameDataState, setGameDataState] = useState<GameData | null>(null);
  const [homeScore, setHomeScore] = useState<string | number>('-');
  const [awayScore, setAwayScore] = useState<string | number>('-');
  const [gameClock, setGameClock] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [winnerProfiles, setWinnerProfiles] = useState<Record<string, { username: string; pfp: string }>>({});
  console.log("🏟️ GameProvider rendering with eventId:", eventId);
  // Extract `leagueId` from `eventId`
  const extractLeagueId = (eventId: string): string => {
    const parts = eventId.split("_");
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : "default.league";
  };

  const leagueId = extractLeagueId(eventId);
  const { events, loading: eventsLoading, error: eventsError } = useEventsData(leagueId);

  // Format Matches
  const formattedMatches = events.map(event => ({
    id: event.id,
    date: event.date,
    venue: event.venue?.displayName || "Unknown Venue",
    homeTeam: event.competitions?.[0]?.competitors?.[0]?.team?.abbreviation || "UNK",
    awayTeam: event.competitions?.[0]?.competitors?.[1]?.team?.abbreviation || "UNK",
    homeScore: Number(event.competitions?.[0]?.competitors?.[0]?.score ?? 0),
    awayScore: Number(event.competitions?.[0]?.competitors?.[1]?.score ?? 0),
    homeLogo: event.competitions?.[0]?.competitors?.[0]?.team?.logo || "",
    awayLogo: event.competitions?.[0]?.competitors?.[1]?.team?.logo || "",
    matchClock: event.competitions?.[0]?.status?.displayClock || "",
    matchStatus: event.competitions?.[0]?.status?.type?.detail || "Unknown",
    matchCompleted: event.competitions?.[0]?.status?.type?.completed ?? false,
    matchEvents: event.competitions?.[0]?.details || [],
    matchSummary: event.competitions?.[0]?.headlines?.[0]?.description || "",
    tvBroadcasts: event.competitions?.[0]?.geoBroadcasts || [],
    bettingOdds: event.competitions?.[0]?.odds || [],          // Ensure it exists
  }));
  

  // Find the Closest Match
  const closestMatch = useFindClosestMatch(eventId, formattedMatches);

  // Fetch game data from subgraph
  const fetchGameData = async () => {
    try {
      console.log("🔄 Fetching fresh game data from subgraph...");
      const { data } = await apolloClient.query({
        query: GET_GAME_BY_EVENT_ID,
        variables: { eventId },
        fetchPolicy: 'network-only', // Ensure fresh data from the subgraph
      });

      if (!data?.games || data.games.length === 0) {
        console.warn("⚠️ No game data found in subgraph.");
        setError("No game data found.");
        setGameDataState(null);
        return;
      }

      console.log("✅ Updated game data received:", data.games[0]);
      setGameDataState(data.games[0]);

      // ✅ Stop polling if match is completed
      if (data.games[0].prizeClaimed) {
        console.log("🏆 Prize claimed! Stopping polling.");
        return;
      }

    } catch (err) {
      console.error("❌ Error fetching game data:", err);
      setError("Error loading game data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId || !closestMatch) return;

    setLoading(true);
    setError(null);
    fetchGameData();

    const intervalId = closestMatch.matchCompleted || gameDataState?.prizeClaimed ? null : setInterval(fetchGameData, 30000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [eventId, closestMatch, gameDataState?.prizeClaimed]);

  // Ensure match status updates even after game completion
  useEffect(() => {
    if (!closestMatch) return;

    setHomeScore(prev => (prev === closestMatch.homeScore ? prev : closestMatch.homeScore));
    setAwayScore(prev => (prev === closestMatch.awayScore ? prev : closestMatch.awayScore));
    setGameClock(prev => (prev === closestMatch.matchClock ? prev : closestMatch.matchClock));
    setGameStatus(prev => (prev === closestMatch.matchStatus ? prev : closestMatch.matchStatus));

    if (closestMatch.matchCompleted) {
      console.log("⚠️ Match is at Full-Time. Stopping updates.");
    }
  }, [closestMatch]);

  // Listen for manual refresh event
  useEffect(() => {
    const refreshHandler = () => {
      console.log("🔄 Refreshing game data...");
      fetchGameData();
    };

    window.addEventListener("refreshGameData", refreshHandler);
    return () => window.removeEventListener("refreshGameData", refreshHandler);
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameDataState,
        homeScore,
        awayScore,
        gameClock,
        gameStatus,
        setGameDataState,
        loading,
        setLoading,
        error,
        setError,
        winnerProfiles,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
