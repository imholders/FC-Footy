import React from 'react';
import Image from 'next/image';
import sdk from '@farcaster/frame-sdk'; // Import the Farcaster SDK

interface Players {
  photo: string;
  id: number;
  webName: string;
  teamLogo: string;
  position: string;
  xgi90: number;
  xgc90: number;
  expected_goals_per_90: number;
  expected_assists_per_90: number;
  minutes: number;
  team: string;
}

interface ScoutAttackersFwdsProps {
  playersIn: Players[]; // Define the expected type for the playersIn prop
}

const ScoutAttackersFwds: React.FC<ScoutAttackersFwdsProps> = ({ playersIn }) => {
  // const BASE_URL = 'fc-footy.vercel.app'; // Example base URL for embedding

  const handleCastClick = (player: Players, rank: number) => {
    // Construct the base URL dynamically using window.location
    const baseUrl = window.location.origin + window.location.pathname;
    
    // Construct the share URL with the scoutPlayers tab
    const shareUrl = `${baseUrl}?tab=scoutPlayers&league=eng.1`;
    
    // Prepare the summary text
    const summary = `FC-FEPL: ${player.webName} from ${player.team} is #${rank} in attacker rank and has an enhanced eXpected Goal Involvement (xGI) of ${
      (player.expected_assists_per_90 * 3 + player.expected_goals_per_90 * 5).toFixed(2)
    }. \n \nThe xGI for a player per 90 minutes is calculated by weighting assists (x3) and goals (x5). Larger values are better.\n \nCheck out the full list of top attackers in the FC Footy app cc @gabedev.eth @kmacb.eth`;
  
    // Encode the summary and share URL
    const encodedSummary = encodeURIComponent(summary);
    const encodedShareUrl = encodeURIComponent(shareUrl);
    
    // Construct the player image URL
    const playerImageUrl = encodeURIComponent(`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.photo.replace(/\.[^/.]+$/, '.png')}`);
    
    // Build the Warpcast intent URL with the share URL and player image
    const castIntentUrl = `https://warpcast.com/~/compose?text=${encodedSummary}&channelKey=football&embeds[]=${encodedShareUrl}&embeds[]=${playerImageUrl}`;
    
    console.log("Cast Intent URL: ", castIntentUrl);
    
    // Open the URL using the Farcaster SDK
    sdk.actions.openUrl(castIntentUrl);
  };

  const filteredPlayers = playersIn.filter(player => player.minutes > 400 && player.position === 'Fwd');

  // Sort the players based on expected goals per 90 minutes
  const sortedPlayers = filteredPlayers.sort((a, b) => {
    const xgiPer90A = (a.expected_assists_per_90 * 3) + (a.expected_goals_per_90 * 5);
    const xgiPer90B = (b.expected_assists_per_90 * 3) + (b.expected_goals_per_90 * 5);
    return xgiPer90B - xgiPer90A; // Sort in descending order
  });

  // Only take the top 20 players
  const topPlayers = sortedPlayers.slice(0, 20);

  return (
    <div className="w-full h-full overflow-y-auto p-2 pr-2 pl-2">
      <table className="w-full bg-darkPurple border border-limeGreenOpacity rounded-lg shadow-lg overflow-hidden">
        <thead>
          <tr className="bg-darkPurple text-notWhite text-center border-b border-limeGreenOpacity">
            <th className="py-1 px-1 font-medium">Rank</th>
            <th className="py-0 px-0 font-medium">Player</th>
            <th className="py-1 px-1 font-medium">Team</th>
            <th className="py-1 px-1 font-medium" title="Enhanced expected Goal Involvement uses FEPL points">ExGI</th>
            <th className="py-1 px-1 font-medium"title="Expected Goal Involvement uses assists and shots on goal.">xGI 90m</th>
          </tr>
        </thead>
        <tbody>
          {topPlayers.map((player, index) => (
            <tr
              key={player.id}
              onClick={() => handleCastClick(player, index + 1)}
              className="border-b border-limeGreenOpacity hover:bg-purplePanel transition-colors text-lightPurple text-sm cursor-pointer"
            >
              <td className="py-1 px-1 text-center">
                <span className="mb-1">{index + 1}</span>
              </td>
              <td className="py-1 px-1">
                <div className="flex items-center justify-left space-x-2">
                  <span>{player.webName}</span>
                </div>
              </td>
              <td className="py-1 px-1 text-center">
                <Image src={player.teamLogo} alt={player.team} width={30} height={30} />
              </td>
              <td className="py-1 px-1 text-center">
                {((player.expected_assists_per_90 * 3) + (player.expected_goals_per_90 * 5)).toFixed(2)}
              </td>
              <td className="py-1 px-1 text-center">{player.xgi90.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScoutAttackersFwds;
