/**
 * Standardized team abbreviations for various leagues
 * This ensures consistent abbreviations across the application
 */

// Premier League (England)
const premierLeagueTeams: Record<string, string> = {
  'Arsenal': 'ARS',
  'Aston Villa': 'AVL',
  'Bournemouth': 'BOU',
  'Brentford': 'BRE',
  'Brighton': 'BHA',
  'Brighton and Hove Albion': 'BHA',
  'Brighton & Hove Albion': 'BHA',
  'Burnley': 'BUR',
  'Chelsea': 'CHE',
  'Crystal Palace': 'CRY',
  'Everton': 'EVE',
  'Fulham': 'FUL',
  'Ipswich': 'IPS',
  'Ipswich Town': 'IPS',
  'Leicester': 'LEI',
  'Leicester City': 'LEI',
  'Liverpool': 'LIV',
  'Luton': 'LUT',
  'Luton Town': 'LUT',
  'Manchester City': 'MCI',
  'Man City': 'MCI',
  'Manchester United': 'MUN',
  'Man United': 'MUN',
  'Man Utd': 'MUN',
  'Newcastle': 'NEW',
  'Newcastle United': 'NEW',
  'Nottingham Forest': 'NFO',
  'Nottm Forest': 'NFO',
  'Sheffield United': 'SHU',
  'Sheffield Utd': 'SHU',
  'Southampton': 'SOU',
  'Tottenham': 'TOT',
  'Tottenham Hotspur': 'TOT',
  'Spurs': 'TOT',
  'West Ham': 'WHU',
  'West Ham United': 'WHU',
  'Wolverhampton': 'WOL',
  'Wolverhampton Wanderers': 'WOL',
  'Wolves': 'WOL',
};

// La Liga (Spain)
const laLigaTeams: Record<string, string> = {
  'Alaves': 'ALA',
  'Deportivo Alaves': 'ALA',
  'Athletic Bilbao': 'ATH',
  'Athletic Club': 'ATH',
  'Atletico Madrid': 'ATM',
  'Atlético Madrid': 'ATM',
  'Atletico de Madrid': 'ATM',
  'Barcelona': 'BAR',
  'FC Barcelona': 'BAR',
  'Betis': 'BET',
  'Real Betis': 'BET',
  'Celta Vigo': 'CEL',
  'RC Celta': 'CEL',
  'Espanyol': 'ESP',
  'RCD Espanyol': 'ESP',
  'Getafe': 'GET',
  'Getafe CF': 'GET',
  'Girona': 'GIR',
  'Girona FC': 'GIR',
  'Granada': 'GRA',
  'Granada CF': 'GRA',
  'Las Palmas': 'LPA',
  'UD Las Palmas': 'LPA',
  'Mallorca': 'MAL',
  'RCD Mallorca': 'MAL',
  'Osasuna': 'OSA',
  'CA Osasuna': 'OSA',
  'Rayo Vallecano': 'RAY',
  'Real Madrid': 'RMA',
  'Real Sociedad': 'RSO',
  'Sevilla': 'SEV',
  'Sevilla FC': 'SEV',
  'Valencia': 'VAL',
  'Valencia CF': 'VAL',
  'Villarreal': 'VIL',
  'Villarreal CF': 'VIL',
};

// Bundesliga (Germany)
const bundesligaTeams: Record<string, string> = {
  'Augsburg': 'AUG',
  'FC Augsburg': 'AUG',
  'Bayer Leverkusen': 'B04',
  'Leverkusen': 'B04',
  'Bayern Munich': 'FCB',
  'Bayern': 'FCB',
  'FC Bayern München': 'FCB',
  'Bochum': 'BOC',
  'VfL Bochum': 'BOC',
  'Borussia Dortmund': 'BVB',
  'Dortmund': 'BVB',
  'Borussia Mönchengladbach': 'BMG',
  'Monchengladbach': 'BMG',
  'Gladbach': 'BMG',
  'Eintracht Frankfurt': 'SGE',
  'Frankfurt': 'SGE',
  'Freiburg': 'SCF',
  'SC Freiburg': 'SCF',
  'Heidenheim': 'HDH',
  '1. FC Heidenheim': 'HDH',
  'Hoffenheim': 'TSG',
  'TSG Hoffenheim': 'TSG',
  'Köln': 'KOE',
  'Koln': 'KOE',
  '1. FC Köln': 'KOE',
  'Mainz': 'M05',
  'Mainz 05': 'M05',
  'RB Leipzig': 'RBL',
  'Leipzig': 'RBL',
  'Stuttgart': 'VFB',
  'VfB Stuttgart': 'VFB',
  'Union Berlin': 'FCU',
  '1. FC Union Berlin': 'FCU',
  'Werder Bremen': 'SVW',
  'Bremen': 'SVW',
  'Wolfsburg': 'WOB',
  'VfL Wolfsburg': 'WOB',
};

// Serie A (Italy)
const serieATeams: Record<string, string> = {
  'Atalanta': 'ATA',
  'Bologna': 'BOL',
  'Cagliari': 'CAG',
  'Como': 'COM',
  'Empoli': 'EMP',
  'Fiorentina': 'FIO',
  'Genoa': 'GEN',
  'Hellas Verona': 'HEL',
  'Verona': 'HEL',
  'Inter': 'INT',
  'Inter Milan': 'INT',
  'Juventus': 'JUV',
  'Lazio': 'LAZ',
  'Lecce': 'LEC',
  'AC Milan': 'MIL',
  'Milan': 'MIL',
  'Monza': 'MON',
  'Napoli': 'NAP',
  'Parma': 'PAR',
  'Roma': 'ROM',
  'AS Roma': 'ROM',
  'Salernitana': 'SAL',
  'Sassuolo': 'SAS',
  'Torino': 'TOR',
  'Udinese': 'UDI',
  'Venezia': 'VEN',
};

// Ligue 1 (France)
const ligue1Teams: Record<string, string> = {
  'Angers': 'ANG',
  'Auxerre': 'AUX',
  'Brest': 'BRE',
  'Clermont': 'CLE',
  'Clermont Foot': 'CLE',
  'Le Havre': 'HAV',
  'Lens': 'LEN',
  'RC Lens': 'LEN',
  'Lille': 'LIL',
  'LOSC Lille': 'LIL',
  'Lorient': 'LOR',
  'FC Lorient': 'LOR',
  'Lyon': 'LYO',
  'Olympique Lyonnais': 'LYO',
  'Marseille': 'MAR',
  'Olympique de Marseille': 'MAR',
  'Monaco': 'MON',
  'AS Monaco': 'MON',
  'Montpellier': 'MTP',
  'Montpellier HSC': 'MTP',
  'Nantes': 'NAN',
  'FC Nantes': 'NAN',
  'Nice': 'NIC',
  'OGC Nice': 'NIC',
  'Paris Saint-Germain': 'PSG',
  'PSG': 'PSG',
  'Reims': 'REI',
  'Stade de Reims': 'REI',
  'Rennes': 'REN',
  'Stade Rennais': 'REN',
  'Saint-Etienne': 'STE',
  'AS Saint-Étienne': 'STE',
  'Strasbourg': 'STR',
  'RC Strasbourg': 'STR',
  'Toulouse': 'TOU',
  'Toulouse FC': 'TOU',
};

// MLS (USA)
const mlsTeams: Record<string, string> = {
  'Atlanta United': 'ATL',
  'Atlanta': 'ATL',
  'Austin FC': 'ATX',
  'Austin': 'ATX',
  'Charlotte FC': 'CLT',
  'Charlotte': 'CLT',
  'Chicago Fire': 'CHI',
  'Chicago': 'CHI',
  'FC Cincinnati': 'CIN',
  'Cincinnati': 'CIN',
  'Colorado Rapids': 'COL',
  'Colorado': 'COL',
  'Columbus Crew': 'CLB',
  'Columbus': 'CLB',
  'D.C. United': 'DC',
  'DC United': 'DC',
  'FC Dallas': 'DAL',
  'Dallas': 'DAL',
  'Houston Dynamo': 'HOU',
  'Houston': 'HOU',
  'Sporting Kansas City': 'SKC',
  'Kansas City': 'SKC',
  'LA Galaxy': 'LAG',
  'Los Angeles Galaxy': 'LA',
  'Los Angeles FC': 'LAFC',
  'LAFC': 'LAFC',
  'Inter Miami': 'MIA',
  'Miami': 'MIA',
  'Minnesota United': 'MIN',
  'Minnesota': 'MIN',
  'CF Montréal': 'MTL',
  'Montreal': 'MTL',
  'Nashville SC': 'NSH',
  'Nashville': 'NSH',
  'New England Revolution': 'NE',
  'New England': 'NE',
  'New York City FC': 'NYC',
  'NYCFC': 'NYC',
  'New York Red Bulls': 'RBNY',
  'NY Red Bulls': 'RBNY',
  'Orlando City': 'ORL',
  'Orlando': 'ORL',
  'Philadelphia Union': 'PHI',
  'Philadelphia': 'PHI',
  'Portland Timbers': 'POR',
  'Portland': 'POR',
  'Real Salt Lake': 'RSL',
  'Salt Lake': 'RSL',
  'San Jose Earthquakes': 'SJ',
  'San Jose': 'SJ',
  'Seattle Sounders': 'SEA',
  'Seattle': 'SEA',
  'St. Louis City SC': 'STL',
  'St. Louis': 'STL',
  'Toronto FC': 'TOR',
  'Toronto': 'TOR',
  'Vancouver Whitecaps': 'VAN',
  'Vancouver': 'VAN',
};

// Combine all teams into a single map
const allTeams: Record<string, string> = {
  ...premierLeagueTeams,
  ...laLigaTeams,
  ...bundesligaTeams,
  ...serieATeams,
  ...ligue1Teams,
  ...mlsTeams,
};

// Map teams to their leagues
const teamToLeague: Record<string, string> = {};

// Add Premier League teams
Object.keys(premierLeagueTeams).forEach(team => {
  teamToLeague[team.toLowerCase()] = 'eng';
});

// Add La Liga teams
Object.keys(laLigaTeams).forEach(team => {
  teamToLeague[team.toLowerCase()] = 'esp';
});

// Add Bundesliga teams
Object.keys(bundesligaTeams).forEach(team => {
  teamToLeague[team.toLowerCase()] = 'ger';
});

// Add Serie A teams
Object.keys(serieATeams).forEach(team => {
  teamToLeague[team.toLowerCase()] = 'ita';
});

// Add Ligue 1 teams
Object.keys(ligue1Teams).forEach(team => {
  teamToLeague[team.toLowerCase()] = 'fra';
});

// Add MLS teams
Object.keys(mlsTeams).forEach(team => {
  teamToLeague[team.toLowerCase()] = 'usa';
});

/**
 * Get the standardized abbreviation for a team name
 * @param teamName The full team name
 * @param defaultLength The default length to use if no standard abbreviation is found (2-4)
 * @returns The standardized abbreviation or a generated one based on the team name
 */
export function getTeamAbbreviation(teamName: string, defaultLength: number = 3): string {
  // Clean the team name for lookup
  const cleanName = teamName.trim();
  
  // Check if we have a standard abbreviation
  if (allTeams[cleanName]) {
    return allTeams[cleanName];
  }
  
  // If not found, try case-insensitive search
  const lowerName = cleanName.toLowerCase();
  for (const [key, value] of Object.entries(allTeams)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // If still not found, generate an abbreviation
  // Remove non-alphanumeric characters and take the first N characters
  const generatedAbbr = cleanName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, defaultLength)
    .toUpperCase();
  
  console.log(`No standard abbreviation found for "${teamName}", using generated: ${generatedAbbr}`);
  return generatedAbbr;
}

/**
 * Detect the league prefix based on team names
 * @param homeTeam The home team name
 * @param awayTeam The away team name
 * @param defaultLeague The default league to use if detection fails
 * @returns The detected league prefix (e.g., "eng", "usa", "esp")
 */
export function detectLeagueFromTeams(homeTeam: string, awayTeam: string, defaultLeague: string = 'eng'): string {
  // Clean the team names
  const homeClean = homeTeam.trim().toLowerCase();
  const awayClean = awayTeam.trim().toLowerCase();
  
  // Check if we can find the home team in our mapping
  if (teamToLeague[homeClean]) {
    return teamToLeague[homeClean];
  }
  
  // Check if we can find the away team in our mapping
  if (teamToLeague[awayClean]) {
    return teamToLeague[awayClean];
  }
  
  // Try partial matching for home team
  for (const [team, league] of Object.entries(teamToLeague)) {
    if (homeClean.includes(team) || team.includes(homeClean)) {
      return league;
    }
  }
  
  // Try partial matching for away team
  for (const [team, league] of Object.entries(teamToLeague)) {
    if (awayClean.includes(team) || team.includes(awayClean)) {
      return league;
    }
  }
  
  // If we can't detect the league, use the default
  console.log(`Could not detect league for teams "${homeTeam}" and "${awayTeam}", using default: ${defaultLeague}`);
  return defaultLeague;
}

export default getTeamAbbreviation; 