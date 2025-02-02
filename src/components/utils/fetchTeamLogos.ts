interface Team {
  name: string;
  abbreviation: string;
  league: string;
  logoUrl: string;
}

// Team abbreviations and names grouped by league
const teamsByLeague: { [league: string]: { team: string; abbr: string }[] } = {
  "eng.1": [
    { team: "Arsenal", abbr: "ars" },
    { team: "Aston Villa", abbr: "avl" },
    { team: "Bournemouth", abbr: "bou" },
    { team: "Brentford", abbr: "bre" },
    { team: "Brighton", abbr: "bha" },
    { team: "Chelsea", abbr: "che" },
    { team: "Crystal Palace", abbr: "cry" },
    { team: "Everton", abbr: "eve" },
    { team: "Fulham", abbr: "ful" },
    { team: "Ipswich", abbr: "ips" },
    { team: "Leicester", abbr: "lei" },
    { team: "Liverpool", abbr: "liv" },
    { team: "Man City", abbr: "mnc" },
    { team: "Man Utd", abbr: "man" },
    { team: "Newcastle", abbr: "new" },
    { team: "Nott'm Forest", abbr: "nfo" },
    { team: "Southampton", abbr: "sou" },
    { team: "Spurs", abbr: "tot" },
    { team: "West Ham", abbr: "whu" },
    { team: "Wolves", abbr: "wol" }
  ],
  "esp.1": [
    { team: "Athletic Bilbao", abbr: "ath" },
    { team: "Atlético de Madrid", abbr: "atm" },
    { team: "CA Osasuna", abbr: "osa" },
    { team: "CD Leganés", abbr: "leg" },
    { team: "Celta de Vigo", abbr: "cel" },
    { team: "Deportivo Alavés", abbr: "alv" },
    { team: "FC Barcelona", abbr: "bar" },
    { team: "Getafe CF", abbr: "get" },
    { team: "Girona FC", abbr: "gir" },
    { team: "RCD Espanyol Barcelona", abbr: "esp" },
    { team: "RCD Mallorca", abbr: "mal" },
    { team: "Rayo Vallecano", abbr: "ray" },
    { team: "Real Betis Balompié", abbr: "bet" },
    { team: "Real Madrid", abbr: "rma" },
    { team: "Real Sociedad", abbr: "rso" },
    { team: "Real Valladolid CF", abbr: "vll" },
    { team: "Sevilla FC", abbr: "sev" },
    { team: "UD Las Palmas", abbr: "lpa" },
    { team: "Valencia CF", abbr: "val" },
    { team: "Villarreal CF", abbr: "vil" }
  ],
  "fra.1": [
    { team: "AJ Auxerre", abbr: "aja" },
    { team: "Angers SCO", abbr: "ang" },
    { team: "AS Monaco", abbr: "asm" },
    { team: "AS Saint-Étienne", abbr: "ste" },
    { team: "FC Nantes", abbr: "nte" },
    { team: "FC Toulouse", abbr: "tol" },
    { team: "Le Havre AC", abbr: "lhv" },
    { team: "LOSC Lille", abbr: "lil" },
    { team: "Montpellier HSC", abbr: "mtp" },
    { team: "OGC Nice", abbr: "nic" },
    { team: "Olympique Lyon", abbr: "lyo" },
    { team: "Olympique Marseille", abbr: "mar" },
    { team: "Paris Saint-Germain", abbr: "psg" },
    { team: "RC Lens", abbr: "len" },
    { team: "RC Strasbourg Alsace", abbr: "str" },
    { team: "Stade Brestois 29", abbr: "bre" },
    { team: "Stade Reims", abbr: "rei" },
    { team: "Stade Rennais FC", abbr: "ren" }
  ],
  "ger.1": [
    { team: "1.FC Heidenheim 1846", abbr: "hei" },
    { team: "1.FC Union Berlin", abbr: "ubn" },
    { team: "1.FSV Mainz 05", abbr: "mai" },
    { team: "Bayer 04 Leverkusen", abbr: "lev" },
    { team: "Bayern Munich", abbr: "bay" },
    { team: "Borussia Dortmund", abbr: "bvb" },
    { team: "Borussia Mönchengladbach", abbr: "mgl" },
    { team: "Eintracht Frankfurt", abbr: "eff" },
    { team: "FC Augsburg", abbr: "aug" },
    { team: "FC St. Pauli", abbr: "stp" },
    { team: "Holstein Kiel", abbr: "kie" },
    { team: "RB Leipzig", abbr: "rbl" },
    { team: "SC Freiburg", abbr: "fri" },
    { team: "SV Werder Bremen", abbr: "wer" },
    { team: "TSG 1899 Hoffenheim", abbr: "tsg" },
    { team: "VfB Stuttgart", abbr: "stu" },
    { team: "VfL Bochum", abbr: "boc" },
    { team: "VfL Wolfsburg", abbr: "wol" }
  ],
  "ita.1": [
    { team: "AC Milan", abbr: "mil" },
    { team: "AC Monza", abbr: "mon" },
    { team: "ACF Fiorentina", abbr: "fio" },
    { team: "AS Roma", abbr: "rom" },
    { team: "Atalanta BC", abbr: "ata" },
    { team: "Bologna FC 1909", abbr: "bol" },
    { team: "Cagliari Calcio", abbr: "cal" },
    { team: "Como 1907", abbr: "com" },
    { team: "FC Empoli", abbr: "emp" },
    { team: "Genoa CFC", abbr: "gen" },
    { team: "Hellas Verona", abbr: "ver" },
    { team: "Inter Milan", abbr: "int" },
    { team: "Juventus FC", abbr: "juv" },
    { team: "Parma Calcio 1913", abbr: "par" },
    { team: "SS Lazio", abbr: "laz" },
    { team: "SSC Napoli", abbr: "nap" },
    { team: "Torino FC", abbr: "tor" },
    { team: "US Lecce", abbr: "lec" },
    { team: "Udinese Calcio", abbr: "udi" },
    { team: "Venezia FC", abbr: "ven" }
  ],
  "usa.1": [
    { team: "Atlanta United", abbr: "atl" },
    { team: "Austin FC", abbr: "atx" },
    { team: "Chicago Fire", abbr: "chi" },
    { team: "FC Cincinnati", abbr: "cin" },
    { team: "Columbus Crew", abbr: "clb" },
    { team: "Charlotte FC", abbr: "clt" },
    { team: "Colorado Rapids", abbr: "col" },
    { team: "FC Dallas", abbr: "dal" },
    { team: "D.C. United", abbr: "dcu" },
    { team: "Houston Dynamo", abbr: "hou" },
    { team: "Juarez", abbr: "jua" },
    { team: "LA Galaxy", abbr: "lag" },
    { team: "LAFC", abbr: "laf" },
    { team: "Inter Miami", abbr: "mia" },
    { team: "Minnesota United", abbr: "min" },
    { team: "New England Revolution", abbr: "ner" },
    { team: "Nashville SC", abbr: "nsh" },
    { team: "New York City FC", abbr: "nyc" },
    { team: "New York Red Bulls", abbr: "nyr" },
    { team: "Orlando City SC", abbr: "orl" },
    { team: "Philadelphia Union", abbr: "phi" },
    { team: "Portland Timbers", abbr: "por" },
    { team: "Real Salt Lake", abbr: "rsl" },
    { team: "San Jose Earthquakes", abbr: "sj" },
    { team: "Seattle Sounders", abbr: "sea" },
    { team: "Sporting Kansas City", abbr: "skc" },
    { team: "St. Louis City SC", abbr: "stl" },
    { team: "Toronto FC", abbr: "tor" },
    { team: "Vancouver Whitecaps", abbr: "van" }
  ]
};

export const fetchTeamLogos = async (): Promise<Team[]> => {
  try {
    const teamData: Team[] = [];

    // Iterate over each league and its teams.
    for (const [league, teams] of Object.entries(teamsByLeague)) {
      teams.forEach(({ team, abbr }) => {
        // Construct the logo URL using the league as part of the path.
        const logoUrl = `https://tjftzpjqfqnbtvodsigk.supabase.co/storage/v1/object/public/d33m_images/teams/leagues/${league}/${abbr.toLowerCase()}.png`;
        // Push the team data, including the league.
        teamData.push({ name: team, abbreviation: abbr, league, logoUrl });
      });
    }

    return teamData;
  } catch (error) {
    console.error("Error fetching team logos:", error);
    throw new Error("Error fetching team logos");
  }
};
