/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import EventCard from "./MatchEventCard";
import useEventsData from "./utils/useEventsData";
import sportsData from "./utils/sportsData";

interface MatchesTabProps {
  setSelectedTab: (tab: string) => void;
}

const MatchesTab = ({ setSelectedTab }: MatchesTabProps) => {
  const [selectedSport, setSelectedSport] = useState<string>(sportsData[0].sportId);
  const { events, loading, error } = useEventsData(selectedSport);

  const handleTabClick = (sportId: string) => {
    console.log("Selected sport:", sportId);
    setSelectedSport(sportId);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="ml-1 font-xl text-notWhite font-bold mb-4">
          Select league
        </h2>
        <button
          onClick={() => setSelectedTab("settings")}
          className="mb-2 flex items-center text-sm text-fontRed hover:underline focus:outline-none"
        >
          <span>Follow clubs 🔔</span>
        </button>
      </div>
      {/* Horizontal Scrollable Menu for Sports */}
      <div className="flex overflow-x-auto space-x-4 mb-4">
        {sportsData.map((sport) => (
          <button
            key={sport.sportId}
            onClick={() => handleTabClick(sport.sportId)}
            className={`flex-shrink-0 py-1 px-6 text-sm font-semibold cursor-pointer rounded-full border-2 ${
              selectedSport === sport.sportId
                ? "border-limeGreenOpacity text-lightPurple"
                : "border-gray-500 text-gray-500"
            }`}
          >
            {sport.name}
          </button>
        ))}
      </div>
      {/* Matches Content */}
      <div className="p-4 mt-2 bg-purplePanel text-lightPurple rounded-lg">
        {loading ? (
          <div>Loading match context...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : events.length > 0 ? (
          events.map((event:any) => (
            <EventCard key={event.id} event={event} sportId={selectedSport} />
          ))
        ) : (
          <div>No events available for {selectedSport}</div>
        )}
      </div>
    </div>
  );
};

export default MatchesTab;
