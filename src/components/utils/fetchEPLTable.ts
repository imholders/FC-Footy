interface Team {
  name: string;
  abbreviation: string;
  logoUrl: string;
}

// Team abbreviations and names
const teams: { [key: string]: string } = {
  'Arsenal': 'ars',
  'Aston Villa': 'avl',
  'Bournemouth': 'bou',
  'Brentford': 'bre',
  'Brighton': 'bha',
  'Chelsea': 'che',
  'Crystal Palace': 'cry',
  'Everton': 'eve',
  'Fulham': 'ful',
  'Ipswich': 'ips',
  'Leicester': 'lei',
  'Liverpool': 'liv',
  'Man City': 'mci',
  'Man Utd': 'mun',
  'Newcastle': 'new',
  "Nott'm Forest": 'not',
  'Southampton': 'sou',
  'Spurs': 'tot',
  'West Ham': 'whu',
  'Wolves': 'wol',
};

export const fetchTeamLogos = async () => {
  try {
    // Creating a list of team names with their corresponding logo URLs
    const teamData: Team[] = Object.entries(teams).map(([teamName, abbreviation]) => {
      const logoUrl = `https://tjftzpjqfqnbtvodsigk.supabase.co/storage/v1/object/public/d33m_images/teams/${abbreviation}.png`;
      return { name: teamName, abbreviation, logoUrl };
    });

    return teamData;
  } catch (error) {
    console.error('Error fetching team logos:', error);
    throw new Error('Error fetching team logos');
  }
};
