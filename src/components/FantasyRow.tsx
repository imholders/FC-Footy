/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import frameSdk from "@farcaster/frame-sdk";
import { BASE_URL } from '~/lib/config';
import { FrameContext } from '@farcaster/frame-node';

interface FantasyEntry {
  pfp: string | null;
  team: {
    name: string | null;
    logo: string | null;
  };
  manager: string;
  entry_name: string | null;
  rank: number | null;
  last_name: string | null;
  fav_team: number | null;
  total: number | null;
}

const FantasyRow: React.FC<{ entry: FantasyEntry }> = ({ entry }) => {
  const { manager, rank, total, fav_team, team } = entry;
  const [context, setContext] = useState<FrameContext | undefined>(undefined);
  const [isContextLoaded, setIsContextLoaded] = useState(false);
  const frameUrl = BASE_URL || 'fc-footy.vercel.app';

  useEffect(() => {
    const loadContext = async () => {
      try {
        setContext((await frameSdk.context) as FrameContext);
        setIsContextLoaded(true);
      } catch (error) {
        console.error("Failed to load Farcaster context:", error);
      }
    };

    if (!isContextLoaded) {
      loadContext();
    }
  }, [isContextLoaded]);

  const handleCastClick = () => {
    const summary = fav_team
      ? `FC-FEPL @${manager} supports ${team.name}. They are ranked #${rank} in the FC fantasy league with ${total} points.`
      : `FC-FEPL @${manager} has no favorite team. They are ranked #${rank} in the FC fantasy league with ${total} points.`;

    const encodedSummary = encodeURIComponent(summary);
    const url = `https://warpcast.com/~/compose?text=${encodedSummary}&channelKey=football&embeds[]=${encodeURIComponent(team.logo || '')}&embeds[]=${frameUrl}`;
    if (context === undefined) {
      window.open(url, '_blank');
    } else {
      frameSdk.actions.openUrl(url);
    }
  };

  const handleRowClick = team.logo ? () => {
    handleCastClick();
  } : undefined;

  return (
    <tr className="border-b border-limeGreenOpacity hover:bg-purplePanel transition-colors text-lightPurple text-sm cursor-pointer" onClick={handleRowClick}>
      <td className="py-2 px-2 text-center text-lightPurple font-bold">{entry.rank ?? 'N/A'}</td>
      <td className="py-2 px-2 flex items-center space-x-2">
        <Image src={entry.pfp || '/defifa_spinner.gif'} alt="Home Team Logo" className="rounded-full w-8 h-8" width={30} height={30} />
        {team.logo && team.logo !== '/defifa_spinner.gif' && (
          <Image src={team.logo || '/default-team-logo.png'} alt="Team Logo" className="rounded-full w-6 h-6" width={24} height={24} loading="lazy" />
        )}
      </td>
      <td className="py-2 px-2 text-lightPurple font-medium text-left">{entry.manager}</td>
      <td className="py-2 px-2 text-center text-lightPurple">{entry.total ?? 'N/A'}</td>
    </tr>
  );
};

export default FantasyRow;
