/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import sdk, { FrameContext, FrameNotificationDetails } from "@farcaster/frame-sdk";
import TabNavigation from './TabNavigation';
import MatchesTab from './MatchesTab';
import FantasyTab from './FantasyTab';
import FalseNineContent from './FalseNineContent';
import Watchalong from './Watchalong';
import Scout from "./Scout";

export default function Main() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext | undefined>(undefined);
  const [selectedTab, setSelectedTab] = useState("matches"); 
  const [notificationDetails, setNotificationDetails] =
  useState<FrameNotificationDetails | null>(null);

const [lastEvent, setLastEvent] = useState("");

const [addFrameResult, setAddFrameResult] = useState("");
const [sendNotificationResult, setSendNotificationResult] = useState("");

useEffect(() => {
  setNotificationDetails(context?.client.notificationDetails ?? null);
}, [context]);

  useEffect(() => {
    const load = async () => {
      const ctx = await sdk.context;
      setContext(ctx);
      
      sdk.on("frameAdded", ({ notificationDetails }) => {
        setLastEvent(
          `frameAdded${!!notificationDetails ? ", notifications enabled" : ""}`
        );

        if (notificationDetails) {
          setNotificationDetails(notificationDetails);
        }
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        setLastEvent(`frameAddRejected, reason ${reason}`);
      });

      sdk.on("frameRemoved", () => {
        setLastEvent("frameRemoved");
        setNotificationDetails(null);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        setLastEvent("notificationsEnabled");
        setNotificationDetails(notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        setLastEvent("notificationsDisabled");
        setNotificationDetails(null);
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      sdk.actions.ready();
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const addFrame = useCallback(async () => {
    try {
      setNotificationDetails(null);

      const result = await sdk.actions.addFrame();

      if (result.added) {
        if (result.notificationDetails) {
          setNotificationDetails(result.notificationDetails);
        }
        setAddFrameResult(
          result.notificationDetails
            ? `Added, got notificaton token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
            : "Added, got no notification details"
        );
      } else {
        setAddFrameResult(`Not added: ${result.reason}`);
      }
    } catch (error) {
      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  const sendNotification = useCallback(async () => {
    setSendNotificationResult("");
    console.log(notificationDetails)
    if (!notificationDetails || !context) {
      return;
    }

    try {

      console.log('lolojo')
      const response = await fetch("/api/send-notification", {
        method: "POST",
        mode: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: context.user.fid,
          notificationDetails,
        }),
      });
      console.log('lolojo')

      console.log('HEHEHEHEHEH',notificationDetails)

      if (response.status === 200) {
        setSendNotificationResult("Success");
        return;
      } else if (response.status === 429) {
        setSendNotificationResult("Rate limited");
        return;
      }

      const data = await response.text();
      setSendNotificationResult(`Error: ${data}`);
    } catch (error) {
      setSendNotificationResult(`Error: ${error}`);
    }
  }, [context, notificationDetails]);

  if (!isSDKLoaded) return <div>Waiting for VAR...</div>;

  if (!context) {
    return (
      <div className="w-[375px] mx-auto py-4 px-2">
        <h2 className="text-2xl font-bold text-center text-notWhite">FC Footy mini-app. Live match summaries, fantasy league, analysis and more.</h2>
        <p className="text-center mt-4 text-fontRed">Open in a Farcaster app</p>
        <a href="https://warpcast.com/kmacb.eth/0x7c34ec7d" target="_blank" rel="noreferrer" className="block text-center mt-4 text-lightPurple underline">Go to Warpcast</a>
      </div>
    );
  }

  return (
    <div className="w-[400px] mx-auto py-4 px-2">
      <div className="mb-4 p-2 rounded-lg">
          <button onClick={sendNotification} disabled={!notificationDetails}>
            Send notification
          </button>
        </div>
        <button onClick={addFrame} >
            Add frame to client
          </button>
      <TabNavigation selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      <div className="bg-darkPurple p-4 rounded-md text-white">
        {selectedTab === 'matches' && <MatchesTab />}
        {selectedTab === 'FC FEPL' && <FantasyTab />}
        {selectedTab === 'falseNine' && <FalseNineContent />}
        {selectedTab === 'live Chat' && <Watchalong />}
        {selectedTab === 'scout Players' && <Scout />}
        {/* Show generic "Coming soon" message if tab is unrecognized */}
        {['matches', 'FC FEPL', 'live Chat', 'scout Players', 'falseNine'].indexOf(selectedTab) === -1 && (
          <div className="text-center text-lg text-fontRed">Coming soon...</div>
        )}
      </div>
      
    </div>
  );
};
