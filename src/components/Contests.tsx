import React, { useState } from "react";
import ContestFCFantasy from "./ContestFCFantasy";
import FavoriteTeamLeaderboard from "./ContestFavoriteTeamLeaderboard";

const Contests = () => {
  const [selectedTab, setSelectedTab] = useState<string>("fCFantasy");

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);
  };

  return (
    <div className="mb-4">
      {/* Horizontal Scrollable Menu for Tabs */}
      <h2 className="font-2xl text-notWhite font-bold mb-4">Leaderboards</h2>        
      <div className="flex overflow-x-auto space-x-4 mb-4">
        <button
          onClick={() => handleTabSelect("fCFantasy")}
          className={`flex-shrink-0 py-1 px-6 text-sm font-semibold cursor-pointer rounded-full border-2 ${
            selectedTab === "fCFantasy" ? "border-limeGreenOpacity text-lightPurple" : "border-gray-500 text-gray-500"
          }`}
        >
          FC FEPL
        </button>

        <button
          onClick={() => handleTabSelect("scoreSquare")}
          className={`flex-shrink-0 py-1 px-6 text-sm font-semibold cursor-pointer rounded-full border-2 ${
            selectedTab === "scoreSquare" ? "border-limeGreenOpacity text-lightPurple" : "border-gray-500 text-gray-500"
          }`}
        >
          Fan Clubs
        </button>
      </div>

      <div className="bg-purplePanel text-lightPurple rounded-lg p-1">
        {selectedTab === "fCFantasy" && <ContestFCFantasy />}
        {selectedTab === "scoreSquare" && <FavoriteTeamLeaderboard />}

      </div>
    </div>
  );
};

export default Contests;
