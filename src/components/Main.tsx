"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

import TabNavigation from "./TabNavigation";
import MatchesTab from "./MatchesTab";
import Contests from "./Contests";
import ContentTab from "./ContentTab";
import Scout from "./Scout";
import Settings from "./Settings";
import { tabDisplayMap } from "../lib/navigation";

export default function Main() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedTab = searchParams.get("tab") || "matches";
  const selectedLeague = searchParams.get("league") || "eng.1";

// Now handleTabChange matches React.Dispatch<SetStateAction<string>>
const handleTabChange: Dispatch<SetStateAction<string>> = (value) => {
  const newTab =
    typeof value === "function" ? value(selectedTab) : value;
  const league = searchParams.get("league") || "eng.1";
  router.push(`/?tab=${newTab}&league=${league}`);
};
  const handleLeagueChange = (league: string) => {
    const tab = searchParams.get("tab") || "matches";
    router.push(`/?tab=${tab}&league=${league}`);
  };

  // Optional: Log to check the selected tab
  console.log("Selected Tab (raw):", selectedTab);
  console.log("Display Label:", tabDisplayMap[selectedTab]);

  return (
    <div className="w-[380px] mx-auto py-4 px-2">
      <TabNavigation
        selectedTab={selectedTab}
        setSelectedTab={handleTabChange}
        selectedLeague={selectedLeague}
        setSelectedLeague={handleLeagueChange}
        // Pass the mapping so the navigation can show display labels.
        tabDisplayMap={tabDisplayMap}
      />
      <div className="bg-darkPurple p-4 rounded-md text-white">
        {selectedTab === "matches" && (
          <MatchesTab
            league={selectedLeague}
            setSelectedTab={handleTabChange}
            setSelectedLeague={handleLeagueChange}
          />
        )}
        {selectedTab === "contests" && <Contests  />}
        {selectedTab === "scoutPlayers" && <Scout />}
        {selectedTab === "extraTime" && <ContentTab />}
        {selectedTab === "settings" && <Settings />}
        {!["matches", "contests", "scoutPlayers", "extraTime", "settings"].includes(selectedTab) && (
          <div className="text-center text-lg text-fontRed">Coming soon...</div>
        )}
      </div>
    </div>
  );
}