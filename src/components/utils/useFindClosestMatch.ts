import { useState, useEffect } from "react";

export interface MatchEvent {
  type: {
    id: string;
    text: string;
  };
  clock: {
    value: number;
    displayValue: string;
  };
  team: {
    id: string;
  };
  scoreValue?: number;
  scoringPlay?: boolean;
  redCard?: boolean;
  yellowCard?: boolean;
  penaltyKick?: boolean;
  ownGoal?: boolean;
  shootout?: boolean;
  athletesInvolved?: {
    id: string;
    displayName: string;
    shortName: string;
    fullName: string;
    jersey: string;
    team: {
      id: string;
    };
    position?: string;
    headshot?: string;
    links?: {
      rel: string[];
      href: string;
      isHidden: boolean;
    }[];
  }[];
}


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
  matchEvents: MatchEvent[];
  matchSummary: string;
  espnSummaryLink?: string;
  espnStatsLink?: string;
  espnRecapLink?: string;
  espnHighlightsLink?: string;
  tvBroadcasts: {
    network: string;
    region: string;
    language: string;
  }[];
  bettingOdds: {
    provider: string;
    homeOdds: number;
    awayOdds: number;
    drawOdds: number;
  }[];
}


const useFindClosestMatch = (eventId: string, matches: Match[]): Match | null => {
  const [closestMatch, setClosestMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (!eventId) {
      console.warn("⚠️ useFindClosestMatch: No eventId provided.");
      return;
    }

    if (!matches || matches.length === 0) {
      console.info("🟡 useFindClosestMatch: Waiting for matches to load.");
      return;
    }

    console.log("🔍 Looking for exact match using eventId:", eventId);

    const parts = eventId.split("_");
    if (parts.length < 4) {
      console.error("❌ Invalid eventId format:", eventId);
      return;
    }

    const eventHome = parts[2]?.toUpperCase() || "";
    const eventAway = parts[3]?.toUpperCase() || "";

    const exactMatches = matches.filter((match) => {
      const home = match.homeTeam?.toUpperCase();
      const away = match.awayTeam?.toUpperCase();
      return home === eventHome && away === eventAway;
    });

    if (exactMatches.length === 0) {
      console.warn("❌ No exact match found for eventId:", eventId);
      if (closestMatch !== null) setClosestMatch(null); // Clear stale match
      return;
    }

    const mostRecent = exactMatches.reduce((latest, current) =>
      new Date(current.date) > new Date(latest.date) ? current : latest
    );

    if (mostRecent?.id !== closestMatch?.id) {
      console.log("✅ Found closest exact match:", mostRecent);
      setClosestMatch(mostRecent);
    }

  }, [eventId, matches]);

  return closestMatch;
};

export default useFindClosestMatch;
