import React, { useCallback } from 'react';
// import html2canvas from 'html2canvas';
import sdk from "@farcaster/frame-sdk";
import { BASE_URL } from '~/lib/config';

interface SelectedMatch {
  competitorsLong: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  clock: string;
  homeLogo: string;
  awayLogo: string;
  eventStarted: boolean;
  keyMoments?: string[]; // Include key moments in the selected match
}

interface WarpcastShareButtonProps {
  selectedMatch: SelectedMatch;
  targetElement?: HTMLElement | null;
}

export function WarpcastShareButton({ selectedMatch, targetElement }: WarpcastShareButtonProps) {
   // UseCallback hook for openWarpcastUrl to handle URL opening
   const openWarpcastUrl = useCallback(() => {
    if (selectedMatch) {
      const frameUrl = BASE_URL || 'fc-footy.vercel.app';
      const {
        competitorsLong,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        clock,
        homeLogo,
        awayLogo,
        eventStarted,
        keyMoments,
      } = selectedMatch;

      const keyMomentsText = keyMoments && keyMoments.length > 0
      ? `\n\nKey Moments:\n${keyMoments.join('\n')}`
      : "";

      const matchSummary = `${competitorsLong}\n${homeTeam} ${eventStarted ? homeScore : ''} - ${eventStarted ? awayScore : ''} ${awayTeam.toUpperCase()}\n${eventStarted ? `Clock: ${clock}` : `Kickoff: ${clock}`}${keyMomentsText}\n\nUsing the FC Footy mini-app warpcast.com/~/frames/launch?domain=${frameUrl.replace(/^https?:\/\//, "")} cc @gabedev.eth @kmacb.eth`;

      const encodedSummary = encodeURIComponent(matchSummary);
      const url = `https://warpcast.com/~/compose?text=${encodedSummary}&channelKey=football&embeds[]=${homeLogo}&embeds[]=${awayLogo}`;
      sdk.actions.openUrl(url);
    }
  }, [selectedMatch]);
  console.log('targetElement', targetElement); // TODO: Remove this console.log
  // Function to capture screenshot
/*   const takeScreenshot = async () => {
    try {
      if (!targetElement) {
        alert("No element found to capture.");
        return;
      }

      // Capture the passed target element
      const canvas = await html2canvas(targetElement);

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve)
      );
      if (!blob) throw new Error("Screenshot failed");

      // Write blob to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      alert("Screenshot copied to clipboard!");

      // Proceed with the cast after screenshot is taken
      openWarpcastUrl();
    } catch (error) {
      console.error("Failed to take screenshot:", error);
      alert("Failed to take screenshot. Please try again.");
    }
  }; */

  return (
    <button
      onClick={openWarpcastUrl} // Call takeScreenshot on click
      className={`flex-1 sm:flex-none w-full sm:w-48 bg-deepPink text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-deepPink hover:bg-fontRed`}
    >
      Share
    </button>
  );
};

export default WarpcastShareButton;
