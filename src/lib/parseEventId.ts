/**
 * Utility function to parse team names from event ID
 * @param eventId The event ID string in format league_gameNumber_HOME_AWAY_timestamp
 * @param team Which team to extract ('home' or 'away')
 * @returns The team name
 */
export const parseTeamFromEventId = (eventId: string, team: 'home' | 'away'): string => {
  try {
    // Check if eventId is empty or undefined
    if (!eventId || eventId.trim() === '') {
      console.log(`[DEBUG] Empty event ID provided, using default team names`);
      return team === 'home' ? 'Home' : 'Away';
    }
    
    // Split the event ID by underscores
    const parts = eventId.split('_');
    
    console.log(`[DEBUG] Parsing team from event ID: ${eventId}`);
    console.log(`[DEBUG] Event ID parts:`, parts);
    
    // Format should be: league_gameNumber_HOME_AWAY_timestamp
    // Example: usa_1_VAN_LA_726827
    if (parts.length >= 5) {
      // Get the home or away team based on the parameter
      const homeTeam = parts[2];
      const awayTeam = parts[3];
      
      console.log(`[DEBUG] Extracted teams - Home: ${homeTeam}, Away: ${awayTeam}`);
      return team === 'home' ? homeTeam : awayTeam;
    }
    
    // Fallback to default if format doesn't match
    console.log(`[DEBUG] Using default team names due to unexpected format`);
    return team === 'home' ? 'Home' : 'Away';
  } catch (error) {
    console.error('[DEBUG] Error parsing team from event ID:', error);
    return team === 'home' ? 'Home' : 'Away';
  }
};

/**
 * Parses an event ID into its component parts
 * @param eventId - The event ID to parse (e.g., "usa_1_VAN_LA_726827")
 * @returns An object with league, home, and away team names
 */
export const parseEventId = (eventId: string): { league: string, home: string, away: string } => {
  try {
    // Split the event ID by underscores
    const parts = eventId.split('_');
    
    console.log(`[DEBUG] Parsing event ID: ${eventId}`);
    console.log(`[DEBUG] Event ID parts:`, parts);
    
    // Format should be: league_gameNumber_HOME_AWAY_timestamp
    // Example: usa_1_VAN_LA_726827
    if (parts.length >= 5) {
      const result = {
        league: `${parts[0]}_${parts[1]}`,
        home: parts[2],
        away: parts[3]
      };
      console.log(`[DEBUG] Extracted teams - Home: ${result.home}, Away: ${result.away}`);
      return result;
    } else if (parts.length >= 3) {
      // Fallback for older format
      const result = {
        league: parts[0],
        home: parts[1],
        away: parts[2]
      };
      console.log(`[DEBUG] Extracted teams (fallback) - Home: ${result.home}, Away: ${result.away}`);
      return result;
    }
  } catch (err) {
    console.error("[DEBUG] Error parsing eventId:", err);
  }
  
  console.log(`[DEBUG] Using default team names due to unexpected format`);
  return { league: '', home: 'Home', away: 'Away' };
}; 