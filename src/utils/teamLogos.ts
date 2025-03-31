/**
 * Utility functions for handling team logos
 */

/**
 * Gets the league code from an event ID
 * @param eventId The event ID string (e.g., "usa_1_CLB_HOU_20250307223123")
 * @returns The league code (e.g., "usa")
 */
export const getLeagueCode = (eventId: string): string => {
  const parts = eventId.split('_');
  return parts.length > 0 ? parts[0].toLowerCase() : 'generic';
};

/**
 * Gets the team logo URL based on team name and league
 * @param teamName The team name (e.g., "CLB" for Columbus Crew)
 * @param leagueCode The league code (e.g., "usa" for MLS)
 * @returns The URL to the team logo
 */
export const getTeamLogo = (teamName: string, leagueCode: string): string => {
  // Default fallback image
  const DEFAULT_LOGO = '/defifa_spinner.gif';
  console.log('teamName', teamName, 'leagueCode', leagueCode);
  if (!teamName) return DEFAULT_LOGO;
  
  // Normalize team name
  const normalizedTeam = teamName.toLowerCase();
  
  // Determine the logo path prefix based on league code
  let leaguePrefix = 'generic';
  if (leagueCode === 'usa') {
    leaguePrefix = 'usa.1';
  } else if (leagueCode === 'eng.1') {
    leaguePrefix = 'premier-league';
  } else if (leagueCode === 'esp') {
    leaguePrefix = 'la-liga';
  } else if (leagueCode === 'ita') {
    leaguePrefix = 'serie-a';
  } else if (leagueCode === 'ger') {
    leaguePrefix = 'bundesliga';
  } else if (leagueCode === 'fra') {
    leaguePrefix = 'ligue-1';
  }
  
  // MLS team mappings
  const mlsTeams: Record<string, string> = {
    'atl': `${leaguePrefix}/atlanta-united.png`,
    'aus': `${leaguePrefix}/austin-fc.png`,
    'clb': `${leaguePrefix}/columbus-crew.png`,
    'chi': `${leaguePrefix}/chicago-fire.png`,
    'cin': `${leaguePrefix}/fc-cincinnati.png`,
    'col': `${leaguePrefix}/colorado-rapids.png`,
    'dal': `${leaguePrefix}/fc-dallas.png`,
    'dc': `${leaguePrefix}/dc-united.png`,
    'hou': `${leaguePrefix}/houston-dynamo.png`,
    'kc': `${leaguePrefix}/sporting-kc.png`,
    'la': `${leaguePrefix}/la.png`,
    'lafc': `${leaguePrefix}/los-angeles-fc.png`,
    'mia': `${leaguePrefix}/inter-miami.png`,
    'min': `${leaguePrefix}/minnesota-united.png`,
    'mtl': `${leaguePrefix}/cf-montreal.png`,
    'ne': `${leaguePrefix}/new-england-revolution.png`,
    'nsh': `${leaguePrefix}/nashville-sc.png`,
    'ny': `${leaguePrefix}/new-york-red-bulls.png`,
    'nyc': `${leaguePrefix}/new-york-city-fc.png`,
    'orl': `${leaguePrefix}/orlando-city.png`,
    'phi': `${leaguePrefix}/philadelphia-union.png`,
    'por': `${leaguePrefix}/portland-timbers.png`,
    'rsl': `${leaguePrefix}/real-salt-lake.png`,
    'sea': `${leaguePrefix}/seattle-sounders.png`,
    'sj': `${leaguePrefix}/san-jose-earthquakes.png`,
    'stl': `${leaguePrefix}/st-louis-city.png`,
    'tor': `${leaguePrefix}/toronto-fc.png`,
    'van': `${leaguePrefix}/vancouver-whitecaps.png`
  };
  
  // Premier League team mappings
  const premierLeagueTeams: Record<string, string> = {
    'ars': `${leaguePrefix}/arsenal.png`,
    'avl': `${leaguePrefix}/aston-villa.png`,
    'bou': `${leaguePrefix}/bournemouth.png`,
    'bre': `${leaguePrefix}/brentford.png`,
    'bha': `${leaguePrefix}/brighton.png`,
    'bur': `${leaguePrefix}/burnley.png`,
    'che': `${leaguePrefix}/chelsea.png`,
    'cry': `${leaguePrefix}/crystal-palace.png`,
    'eve': `${leaguePrefix}/everton.png`,
    'ful': `${leaguePrefix}/fulham.png`,
    'liv': `${leaguePrefix}/liverpool.png`,
    'lut': `${leaguePrefix}/luton.png`,
    'mci': `${leaguePrefix}/manchester-city.png`,
    'mun': `${leaguePrefix}/manchester-united.png`,
    'new': `${leaguePrefix}/newcastle.png`,
    'nfo': `${leaguePrefix}/nottingham-forest.png`,
    'sou': `${leaguePrefix}/southampton.png`,
    'tot': `${leaguePrefix}/tottenham.png`,
    'whu': `${leaguePrefix}/west-ham.png`,
    'wol': `${leaguePrefix}/wolves.png`
  };
  
  // Select the appropriate team mapping based on league code
  let teamMapping: Record<string, string> = {};
  if (leagueCode === 'usa') {
    teamMapping = mlsTeams;
  } else if (leagueCode === 'eng') {
    teamMapping = premierLeagueTeams;
  }
  
  // Return the logo path or the default fallback if not found
  return teamMapping[normalizedTeam] || DEFAULT_LOGO;
};

/**
 * Gets both team logos from an event ID
 * @param eventId The event ID string (e.g., "usa_1_CLB_HOU_20250307223123")
 * @returns An object with home and away team logo URLs
 */
export const getTeamLogosFromEventId = (eventId: string): { home: string; away: string } => {
  // Default fallback image
  const DEFAULT_LOGO = '/defifa_spinner.gif';
  
  if (!eventId) {
    return {
      home: DEFAULT_LOGO,
      away: DEFAULT_LOGO
    };
  }
  
  const parts = eventId.split('_');
  if (parts.length < 4) {
    return {
      home: DEFAULT_LOGO,
      away: DEFAULT_LOGO
    };
  }
  
  const leagueCode = parts[0];
  const homeTeam = parts[2];
  const awayTeam = parts[3];
  
  return {
    home: getTeamLogo(homeTeam, leagueCode),
    away: getTeamLogo(awayTeam, leagueCode)
  };
}; 