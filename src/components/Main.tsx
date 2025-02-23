"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import frameSdk from "@farcaster/frame-sdk";
import TabNavigation from "./TabNavigation";
import MatchesTab from "./MatchesTab";
import Contests from "./Contests";
import ContentTab from "./ContentTab";
import Scout from "./Scout";
import Settings from "./Settings";
import { usePrivy } from "@privy-io/react-auth";
import { useLoginToFrame } from "@privy-io/react-auth/farcaster";
// import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { FrameContext } from "@farcaster/frame-node";

export default function Main() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Set initial tab based on the "tab" query parameter (default to "matches")
  const [selectedTab, setSelectedTab] = useState(() => searchParams.get("tab") || "matches");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { ready, authenticated, user, createWallet, login } = usePrivy();
  //const { client } = useSmartWallets();
  const { initLoginToFrame, loginToFrame } = useLoginToFrame();
  const [showH2, setShowH2] = useState(true);
  const [context, setContext] = useState<FrameContext>();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  console.log("selectedTab", selectedTab);
  // Load Frame SDK context on mount
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

  // Login to Frame automatically using Privy
  useEffect(() => {
    if (ready && !authenticated) {
      const doLogin = async () => {
        const { nonce } = await initLoginToFrame();
        const result = await frameSdk.actions.signIn({ nonce });
        await loginToFrame({
          message: result.message,
          signature: result.signature,
        });
      };
      doLogin();
    }
  }, [ready, authenticated]);

  // Hide the h2 after 3 seconds
  useEffect(() => {
    if (showH2) {
      const timer = setTimeout(() => setShowH2(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showH2]);

  // Create wallet if needed
  useEffect(() => {
    if (
      authenticated &&
      ready &&
      user &&
      user.linkedAccounts.filter(
        (account) =>
          account.type === "wallet" && account.walletClientType === "privy"
      ).length === 0
    ) {
      createWallet();
    }
  }, [authenticated, ready, user]);

  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await login();
    } catch (error) {
      console.error(error);
      setErrorMessage("Login failed. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Update the URL query string when the selected tab changes
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (selectedTab !== currentTab) {
      router.push(`/?tab=${selectedTab}`);
    }
  }, [selectedTab, router, searchParams]);

  // (Optional) Sync state if the user manually changes the query parameter
  useEffect(() => {
    const tabFromQuery = searchParams.get("tab");
    if (tabFromQuery && tabFromQuery !== selectedTab) {
      setSelectedTab(tabFromQuery);
    }
  }, [searchParams]);

  // Show a loading indicator until ready
  if (!ready || isAuthenticating) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Render the main UI
  return (
    <div className="w-[380px] mx-auto py-4 px-2">
      {context === undefined && showH2 && (
        <h2 className="text-2xl font-bold text-center text-notWhite">
          The Footy App. Match previews, summaries, fantasy EPL, analysis and money games.
        </h2>
      )}
      {!authenticated ? (
        <div className="text-center text-lg text-fontRed">
          <button
            className="flex-1 sm:flex-none w-full sm:w-48 bg-deepPink text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-deepPink hover:bg-fontRed"
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
            {selectedTab === "matches" && <MatchesTab setSelectedTab={setSelectedTab} />}
            {selectedTab === "contests" && <Contests />}
            {selectedTab === "scout Players" && <Scout />}
            {selectedTab === "extra Time" && <ContentTab />}
            {selectedTab === "settings" && <Settings />}
            {!["matches", "contests", "scout Players", "extra Time", "settings"].includes(selectedTab) && (
              <div className="text-center text-lg text-fontRed">Coming soon...</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
