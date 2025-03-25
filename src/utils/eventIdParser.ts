/**
 * Utility functions for parsing eventId strings
 * 
 * EventId format can be one of:
 * 1. LEAGUE_HOMETEAM_AWAYTEAM_DATE - Example: "EPL_ARS_MUN_20230915"
 * 2. COUNTRY_LEAGUEID_HOMETEAM_AWAYTEAM_DATETIME - Example: "usa_1_CLB_HOU_20250307223123"
 */

interface EventDetails {
  league: string;
  leagueId: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  formattedDate: string;
}

// eventIdParser.ts

/**
 * Extracts and formats the game deployment date from eventId.
 * Event ID format: "eng_1_MNC_BHA_20250312141541"
 * Extracts: YYYYMMDDHHMMSS → Returns: "March 12, 2025"
 */
export function formatEventDate(eventId: string): string {
  if (!eventId) {
    console.error("❌ formatEventDate: Missing eventId.");
    return "Unknown Date";
  }

  const parts = eventId.split("_");
  if (parts.length < 5) {
    console.error(`❌ formatEventDate: Invalid eventId format - ${eventId}`);
    return "Invalid Date";
  }

  // Extract the date component (YYYYMMDDHHMMSS)
  const dateStr = parts[4];
  if (dateStr.length < 8) {
    console.error(`❌ formatEventDate: Date string too short - ${dateStr}`);
    return "Invalid Date";
  }

  // Parse date
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  // Format date to readable format
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * **League ID to Name Mapping**
 * 
 * - Keys follow the `country.leagueId` format (e.g., `eng.1`, `usa.1`)
 * - Values are the human-readable names (e.g., "EPL", "MLS")
 */
export const leagueMap: Record<string, string> = {
  "uefa.champions": "UCL",
  "uefa.europa": "UEL",
  "fra.1": "Ligue 1",
  "eng.1": "EPL",
  "eng.2": "EFL Championship",
  "esp.1": "La Liga",
  "ger.1": "Bundesliga",
  "ita.1": "Serie A",
  "usa.1": "MLS",
  "fifa.worldq.conmebol": "WC Qualifiers",
  "fifa.worldq.uefa": "WC Qualifiers",
  "fifa.worldq.concacaf": "WC Qualifiers",
  "fifa.worldq.afc": "WC Qualifiers"
};

/**
 * Parses an eventId into its components: league, teams, and date.
 * @param eventId - Example: "eng_1_MNC_BHA_20250312152929" or "uefa.champions_LIV_BAY_20230915"
 * @returns EventDetails object with structured properties
 */
export function parseEventId(eventId: string): EventDetails | null {
  if (!eventId) return null;
  // console.log("Parsing eventId:", eventId);
  const parts = eventId.split('_');
  if (parts.length < 4) return null;

  let country = "";
  let leagueId, homeTeam, awayTeam, dateStr;
  // console.log("Parsed parts:", parts);
  if (parts.length === 5) {
    // **Format: "usa_1_CLB_HOU_20250307223123"**
    [country, leagueId, homeTeam, awayTeam, dateStr] = parts;
    leagueId = `${country}.${leagueId}`; // ✅ Ensure "usa.1", "eng.1", etc.
  } else {
    // **Format: "uefa.champions_LIV_BAY_20230915"**
    [leagueId, homeTeam, awayTeam, dateStr] = parts;
  }
  // console.log("Parsed details:", { leagueId, homeTeam, awayTeam, dateStr });
  // **Map `leagueId` correctly**
  const league = leagueMap[leagueId] || leagueId; // ✅ Use the map if available, fallback to original
  // console.log("Final parsed details:", { league, leagueId, country, homeTeam, awayTeam, dateStr });
  return {
    league,
    leagueId,
    country,
    homeTeam,
    awayTeam,
    date: dateStr,
    formattedDate: formatDate(dateStr),
  };
}

/**
 * Converts a YYYYMMDDHHMMSS string into a readable date format.
 * @param dateStr - Example: "20250307223123"
 * @returns Formatted date string (e.g., "Mar 7, 2025 22:31")
 */
export function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return "Invalid Date";

  try {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);

    const formattedDate = new Date(`${year}-${month}-${day}`);

    if (isNaN(formattedDate.getTime())) return "Invalid Date";

    let formatted = formattedDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (dateStr.length >= 12) {
      const hour = dateStr.substring(8, 10);
      const minute = dateStr.substring(10, 12);
      formatted += ` ${hour}:${minute}`;
    }

    return formatted;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date Error";
  }
}

/**
 * Get a formatted match display string
 * 
 * @param eventId - The eventId string
 * @returns A formatted string like "ARS v MUN"
 */
export function getMatchDisplay(eventId: string): string {
  const details = parseEventId(eventId);
  if (!details) return eventId;
  
  return `${details.homeTeam} v ${details.awayTeam}`;
}

/**
 * Get a full formatted match display string with league and date
 * 
 * @param eventId - The eventId string
 * @returns A formatted string like "EPL: ARS v MUN - Sep 15, 2023"
 */
export function getFullMatchDisplay(eventId: string): string {
  const details = parseEventId(eventId);
  if (!details) return eventId;
  
  return `${details.league}: ${details.homeTeam} v ${details.awayTeam} - ${details.formattedDate}`;
}
