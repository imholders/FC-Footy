/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import frameSdk from "@farcaster/frame-sdk";
import TabNavigation from "./TabNavigation";
import MatchesTab from "./MatchesTab";
import FantasyTab from "./FantasyTab";
import ContentTab from "./ContentTab";
import Scout from "./Scout";
import Settings from "./Settings";
// import MoneyGames from "./MoneyGames";
import { usePrivy } from "@privy-io/react-auth";
import { useLoginToFrame } from "@privy-io/react-auth/farcaster";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { FrameContext } from "@farcaster/frame-node";

export default function Main() {
  const [selectedTab, setSelectedTab] = useState("matches");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { ready, authenticated, user, createWallet, login} = usePrivy();
  const { client } = useSmartWallets();
  const { initLoginToFrame, loginToFrame } = useLoginToFrame();
  const [showH2, setShowH2] = useState(true); // State to control visibility of h2

  // UI state
  const [context, setContext] = useState<FrameContext>();
  const [errorMessage, setErrorMessage] = useState("");

  // Loading states
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  // Derived state
  const smartWallet = user?.linkedAccounts.find(
    (account) => account.type === "smart_wallet",
  );

  useEffect(() => {
    const load = async () => {
      setContext((await frameSdk.context) as FrameContext);
      frameSdk.actions.ready({});
    };
    if (frameSdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  // Login to Frame with Privy automatically
  useEffect(() => {
    if (ready && !authenticated) {
      const login = async () => {
        const { nonce } = await initLoginToFrame();
        const result = await frameSdk.actions.signIn({ nonce: nonce });
        await loginToFrame({
          message: result.message,
          signature: result.signature,
        });
      };
      login();
    } else if (ready && authenticated) {
    }
  }, [ready, authenticated]);

  useEffect(() => {
    if (showH2) {
      const timer = setTimeout(() => {
        setShowH2(false); // Hide h2 after 3 seconds
      }, 3000);

      return () => clearTimeout(timer); // Cleanup the timer if component is unmounted
    }
  }, [showH2]);

  useEffect(() => {
    if (
      authenticated &&
      ready &&
      user &&
      user.linkedAccounts.filter(
        (account) =>
          account.type === "wallet" && account.walletClientType === "privy",
      ).length === 0
    ) {
      createWallet();
    }
  }, [authenticated, ready, user]);

  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await login(); // Use Privy's login method
    } catch (error) {
      console.error(error);
      setErrorMessage("Login failed. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Render loading state
  if (!ready || isAuthenticating) {
    return <div className="w-full h-full flex items-center justify-center">Loading...</div>;
  }
  
  // Render main app UI
  return (
    <div className="w-[400px] mx-auto py-4 px-2">
      {context === undefined && showH2 && (
        <h2 className="text-2xl font-bold text-center text-notWhite">
          The Footy App. Match previews, summaries, fantasy EPL, analysis and money games.
        </h2>
      )}
      {!authenticated ? (
        <div className="text-center text-lg text-fontRed">
          <button
            className={`flex-1 sm:flex-none w-full sm:w-48 bg-deepPink text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-deepPink hover:bg-fontRed`}
            onClick={handleLogin}
          >
            Login
          </button>
          {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
        </div>
      ) : (
        <>
          <TabNavigation selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          <div className="bg-darkPurple p-4 rounded-md text-white">
            {selectedTab === "matches" && <MatchesTab />}
            {selectedTab === "FC FEPL" && <FantasyTab />}
            {selectedTab === "scout Players" && <Scout />}
            {selectedTab === "extra Time" && <ContentTab />}
            {selectedTab === "settings" && <Settings />}
           {/* {selectedTab === "money Games" && <MoneyGames />}
            {/* Show generic "Coming soon" message if tab is unrecognized */}
            {!["matches", "FC FEPL", "scout Players", "extra Time", "settings"].includes(selectedTab) && (
              <div className="text-center text-lg text-fontRed">Coming soon...</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

