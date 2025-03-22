/* eslint-disable */
import { useState, useEffect } from "react";

// ✅ Define the Match interface based on the API response
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

/**
 * Hook to find the closest match based on event identifier
 * @param eventId The event ID to compare
 * @param matches The dataset of matches
 * @returns Closest match or null if not found
 */
const useFindClosestMatch = (eventId: string, matches: Match[]): Match | null => {
  const [closestMatch, setClosestMatch] = useState<Match | null>(null);

  useEffect(() => {
    console.log("✅ Closest Match:", closestMatch);
  }, [closestMatch]);

  useEffect(() => {
    if (!eventId) {
      console.warn("⚠️ useFindClosestMatch: No eventId provided.");
      return;
    }

    if (!matches || matches.length === 0) {
      console.info("🟡 useFindClosestMatch: Waiting on matches to load for eventId:", eventId);
      return;
    }

    console.log("🔍 Processing matches for eventId:", eventId);

    let bestMatch: Match | null = matches[0];
    let highestScore = 0;

    // ✅ Extract teams from eventId (expected format: league_game_Home_Away_Timestamp)
    const parts = eventId.split("_");
    if (parts.length < 4) {
      console.error("❌ Invalid eventId format:", eventId);
      return;
    }

    const eventHome = parts[2]?.toUpperCase() || "";
    const eventAway = parts[3]?.toUpperCase() || "";

    matches.forEach((match) => {
      const homeAbbr = match.homeTeam.toUpperCase();
      const awayAbbr = match.awayTeam.toUpperCase();

      if (!homeAbbr || !awayAbbr) {
        console.warn("⚠️ Missing home or away team in match:", match);
        return;
      }

      const score =
        (eventHome === homeAbbr ? 1 : 0) +
        (eventAway === awayAbbr ? 1 : 0);

      const isMoreRecent = new Date(match.date) > new Date(bestMatch?.date || 0);

      if (score > highestScore || (score === highestScore && isMoreRecent)) {
        highestScore = score;
        bestMatch = match;
      }
    });

    if (bestMatch && bestMatch.id !== closestMatch?.id) {
      console.log("✅ Found closest match:", bestMatch);
      setClosestMatch(bestMatch);
    }
  }, [eventId, matches, closestMatch]);

  return closestMatch;
};

export default useFindClosestMatch;
