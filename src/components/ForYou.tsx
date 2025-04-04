import React, { useState } from "react";
import ForYouComponent from "./ForYouComponent";

const ForYou = () => {
  const [selectedTab, setSelectedTab] = useState<string>("fellowFollowers");
  const [showLiveChat, setShowLiveChat] = useState(false);

  return (
    <div className="mb-4">
      {/* Horizontal Scrollable Menu for Tabs */}
      <h2 className="font-2xl text-notWhite font-bold mb-4">Fan Experience</h2>        
      <div className="flex overflow-x-auto space-x-4 mb-4">
        {showLiveChat ? (
            <button
            onClick={() => setShowLiveChat(false)}
            className="flex-shrink-0 py-1 px-6 text-sm font-semibold cursor-pointer rounded-full border-2 border-limeGreenOpacity text-lightPurple"
            >
            ← Back
            </button>
        ) : (
            <button
            onClick={() => setSelectedTab("fellowFollowers")}
            className={`flex-shrink-0 py-1 px-6 text-sm font-semibold cursor-pointer rounded-full border-2 ${
                selectedTab === "fellowFollowers"
                ? "border-limeGreenOpacity text-lightPurple"
                : "border-gray-500 text-gray-500"
            }`}
            >
            Follow Teams
            </button>
        )}
        </div>

      <div className="bg-purplePanel text-lightPurple rounded-lg p-2 overflow-hidden">        
      {selectedTab === "fellowFollowers" && (
        <ForYouComponent
            showLiveChat={showLiveChat}
            setShowLiveChat={setShowLiveChat}
        />
        )}
      </div>
    </div>
  );
};

export default ForYou;
