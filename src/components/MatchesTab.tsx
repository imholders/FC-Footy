/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import EventCard from "./MatchEventCard";
import useEventsData from "./utils/useEventsData";
import sportsData from "./utils/sportsData";

interface MatchesTabProps {
  setSelectedTab: (tab: string) => void;
  league: string;
  setSelectedLeague: (league: string) => void;
}

const MatchesTab: React.FC<MatchesTabProps> = ({ setSelectedTab, league, setSelectedLeague }) => {
  // Fetch events based on the currently selected league.
  const { events, loading, error } = useEventsData(league);

  // When a league button is clicked, update the league via the parent.
  const handleLeagueClick = (leagueId: string) => {
    console.log("Selected league:", leagueId);
    setSelectedLeague(leagueId);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="ml-1 font-xl text-notWhite font-bold mb-4">
          Select league
        </h2>
        <button
          onClick={() => setSelectedTab("settings")}
          className="mb-3 flex items-center text-sm text-fontRed hover:underline focus:outline-none"
        >
          <span>Follow teams 🔔</span>
        </button>
      </div>
      {/* Horizontal Scrollable Menu for Leagues */}
      <div className="flex overflow-x-auto space-x-4 mb-4">
        {sportsData.map((sport) => (
          <button
            key={sport.sportId}
            onClick={() => handleLeagueClick(sport.sportId)}
            className={`flex-shrink-0 py-1 px-6 text-sm font-semibold cursor-pointer rounded-full border-2 ${
              league === sport.sportId
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
        ) : events && events.length > 0 ? (
          events.map((event: any) => (
            <EventCard key={event.id} event={event} sportId={league} />
          ))
        ) : (
          <div>No events available for {league}</div>
        )}
      </div>
    </div>
  );
};

export default MatchesTab;
