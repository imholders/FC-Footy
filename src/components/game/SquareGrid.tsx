/* eslint-disable */

import React, { useState, useEffect } from 'react';
import { zeroAddress } from 'viem';
import frameSdk from "@farcaster/frame-sdk";
import FarcasterAvatar from '../FarcasterAvatar';
import { fetchFarcasterProfileByAddress } from '../../utils/fetchFarcasterProfile';
import LoadingSpinner from '../game/LoadingSpinner';
import { useGameContext } from '../../context/GameContext';

interface SquareGridProps {
  players: (string | null)[];
  cart?: number[];
  isReferee: boolean;
  handleSquareClick: (index: number) => void;
  handleTapSquare: (index: number) => void;
  gameState: "waiting for VAR" | "active" | "completed" | "loading" | "cancelled";  
  selectedWinners: {
    halftime: number | null;
    final: number | null;
  };
}

const SquareGrid: React.FC<SquareGridProps> = ({ 
  players, 
  cart = [],  
  isReferee,
  handleTapSquare, 
  handleSquareClick,
  gameState,
  selectedWinners,
}) => {
  const { homeScore, awayScore, gameDataState } = useGameContext();
  const ticketsSold = gameDataState?.ticketsSold || 0;
  const homeTeam = gameDataState?.eventId?.split("_")[2] ?? "HOME";
  const awayTeam = gameDataState?.eventId?.split("_")[3] ?? "AWAY";

  const [profiles, setProfiles] = useState<Record<string, { username: string; pfp: string; fid?: number }>>({});
  const [isFrameContext, setIsFrameContext] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const isValidScore = (value: string | number) => !isNaN(Number(value)) && value !== '-';
  const currentWinningSquare =
    ticketsSold >= 25 && isValidScore(homeScore) && isValidScore(awayScore)
      ? Number(homeScore) * 5 + Number(awayScore)
      : null; // ✅ Stop showing match square if ticketsSold < 25

  // ✅ Persist finalized winners
  const finalizedWinners = gameDataState?.winningSquares ?? [];

  useEffect(() => {
    const checkFrameContext = async () => {
      try {
        const context = await frameSdk.context;
        setIsFrameContext(!!context);
      } catch (error) {
        setIsFrameContext(false);
      }
    };
    console.log(isFrameContext);  //remove this line
    checkFrameContext();
  }, []);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (hasLoaded) return;
      setLoading(true);

      const validPlayers = players
        .filter((player): player is string => !!player && player !== zeroAddress)
        .filter((player, index, self) => self.indexOf(player) === index);

      if (validPlayers.length === 0) {
        setLoading(false);
        return;
      }

      const profileUpdates: Record<string, { username: string; pfp: string }> = {};
      for (const address of validPlayers) {
        if (!profiles[address]) { 
          const profile = await fetchFarcasterProfileByAddress(address);
          profileUpdates[address] = {
            username: profile?.username || "Anon",
            pfp: profile?.pfp ?? "/defifa_spinner.gif",
          };
        }
      }

      setProfiles(prevProfiles => ({ ...prevProfiles, ...profileUpdates }));
      setLoading(false);
      setHasLoaded(true);
    };

    fetchProfiles();
    const interval = setInterval(fetchProfiles, 5000);
    return () => clearInterval(interval);
  }, [players, hasLoaded]);

  if (loading && !hasLoaded) {
    return (
      <div className="flex flex-col items-center w-full">
        <LoadingSpinner gameDataState={null} loadingStartTime={Date.now()} setLoading={setLoading} setError={() => {}} />
        <p className="mt-2 text-gray-400">Fetching players & profiles...</p>
      </div>
    );
  }

  // ✅ Add column and row labels ONLY if tickets are sold out (>=25)
  const showLabels = ticketsSold >= 25;
  const columnLabels = ["0", "1", "2", "3", "4+"];
  const rowLabels = ["0", "1", "2", "3", "4+"];

  return (
    <div className="flex flex-col items-center w-full">
      {showLabels && (
        <div className="text-center mb-2 text-gray-400">
          <p>Each square represents a possible scoreline, with <b>{homeTeam}</b> score along the side and <b>{awayTeam}</b> score along the top.</p>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: showLabels ? "auto repeat(5, 1fr)" : "repeat(5, 1fr)" }}>
        {/* Column Labels (Home Scores) */}
        {showLabels && <div></div>} {/* Empty space for alignment */}
        {showLabels && columnLabels.map((label, i) => (
          <div key={`col-${i}`} className="text-center text-gray-400 font-semibold">
            {label}
          </div>
        ))}

        {/* Grid with Row Labels */}
        {players.map((player, index) => { 
          const rowIndex = Math.floor(index / 5);
          const colIndex = index % 5;
          
          // ✅ Winning square logic
          const isHalftimeWinner = selectedWinners?.halftime === index || finalizedWinners[0] === index;
          const isFinalWinner = selectedWinners?.final === index || finalizedWinners[1] === index;
          const isWinningSquare = finalizedWinners.includes(index);
          const isSelected = cart.includes(index);
          const isOwned = !!player && player !== zeroAddress;
          const profile = profiles[player || ""];

          return (
            <React.Fragment key={index}>
              {/* Row Labels (Away Scores) */}
              {colIndex === 0 && showLabels && (
                <div className="text-right text-gray-400 font-semibold flex items-center justify-end">
                  <span>{rowLabels[rowIndex]}</span>
                </div>
              )}

              <button
                onClick={() => {
                  if (isReferee && gameState === "waiting for VAR") {
                    handleTapSquare(index);
                  } else {
                    handleSquareClick(index);
                  }
                }}
                disabled={isOwned && !isReferee}
                className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg border 
                  ${
                    // ✅ Ensure finalized winners **always show their color**
                    isWinningSquare ? 'bg-green-600 border-green-400' :
                    isHalftimeWinner ? 'bg-blue-600 border-blue-400' :
                    isFinalWinner ? 'bg-yellow-600 border-yellow-400' :
                    (ticketsSold >= 25 && currentWinningSquare === index) ? 'bg-limeGreen border-limeGreenOpacity animate-pulse' :
                    isSelected ? 'bg-gray-700 border-gray-600' :
                    'bg-gray-900 border-gray-800'}
                `}
              >
                {isOwned ? (
                  <div className="flex flex-col items-center">
                    <FarcasterAvatar address={player as string} size={32} className="mb-1" />
                  </div>
                ) : (
                  <span className="text-gray-600">{index}</span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default SquareGrid;
