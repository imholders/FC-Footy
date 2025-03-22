/* eslint-disable */

import React, { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import Image from "next/image";
import BlockchainScoreSquare from "./BlockchainScoreSquareCreateDetails";
import { useSearchParams, useRouter } from "next/navigation";

const BASE_CHAIN_ID = 8453;
const BASE_SEPOLIA_CHAIN_ID = 84532;

const BlockchainScoreSquareCreate: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const scoreTab = searchParams?.get("scoreTab") || "create";
  const [activeTab, setActiveTab] = useState<"create" | "browse">(
    scoreTab === "browse" ? "browse" : "create"
  );

  const [latestCreatedGameId, setLatestCreatedGameId] = useState<string | undefined>(
    searchParams?.get("gameId") || undefined
  );
  const [latestCreatedEventId, setLatestCreatedEventId] = useState<string | undefined>(
    searchParams?.get("eventId") || undefined
  );

  const { login, authenticated, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();

  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>("Unknown");
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  /**
   * Fetch Farcaster Profile Picture
   * If user has a Farcaster-linked account, return the profile picture URL.
   * Otherwise, return the default spinner image.
   */
  const findFarcasterPfp = useCallback((): string => {
    const farcasterAccount = user?.linkedAccounts?.find((account) => account.type === "farcaster");
    return farcasterAccount?.pfp ?? "/defifa_spinner.gif";
  }, [user]);

  /**
   * Check if user is on the correct blockchain network
   */
  useEffect(() => {
    const checkNetwork = () => {
      if (isConnected && wallets?.length > 0) {
        try {
          const activeWallet = wallets[0];
          const chainId = activeWallet.chainId;
          const numericChainId = parseInt(chainId.split(":")[1], 10);

          setIsCorrectNetwork(
            numericChainId === BASE_CHAIN_ID || numericChainId === BASE_SEPOLIA_CHAIN_ID
          );

          setCurrentNetwork(
            numericChainId === BASE_CHAIN_ID
              ? "Base"
              : numericChainId === BASE_SEPOLIA_CHAIN_ID
              ? "Base Sepolia"
              : `Chain ID: ${numericChainId}`
          );
        } catch (error) {
          console.error("Error checking network:", error);
          setIsCorrectNetwork(false);
          setCurrentNetwork("Unknown");
        }
      } else {
        setIsCorrectNetwork(false);
        setCurrentNetwork("Not Connected");
      }
    };

    checkNetwork();
    const intervalId = setInterval(checkNetwork, 2000);
    return () => clearInterval(intervalId);
  }, [isConnected, wallets]);

  return (
    <div className="bg-purplePanel rounded shadow-md max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-gray-800/70 p-4 rounded-lg shadow-md border border-gray-700">
        {authenticated ? (
          <div className="flex items-center gap-3 bg-gray-900 p-2 rounded-lg shadow">
            <div className="w-8 h-8 relative mr-2 rounded-full overflow-hidden">
              <Image
                src={findFarcasterPfp()}
                alt="User PFP"
                width={32}
                height={32}
                className="object-cover"
                onError={(e) => {
                  console.log("Image load error, falling back to spinner");
                  e.currentTarget.src = "/defifa_spinner.gif";
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-lightPurple">
                {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ""}
              </span>
              <span className={`text-xs ${isCorrectNetwork ? "text-green-400" : "text-yellow-400"}`}>
                {currentNetwork}
              </span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1 bg-deepPink text-white rounded hover:bg-fontRed text-sm"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="px-4 py-2 bg-deepPink text-white rounded hover:bg-fontRed"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* Show network warning if wrong network */}
      {authenticated && !isCorrectNetwork && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
          <h3 className="font-bold text-lg mb-2">Wrong Network Detected</h3>
          <p className="mb-2">Score Square requires the Base network. Please switch your Warpcast mobile.</p>
          <p className="mb-3 text-sm">
            Current network: <span className="font-semibold">{currentNetwork}</span>
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => console.log("Switch to Base")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Switch to Base
            </button>
            <button
              onClick={() => console.log("Switch to Base Sepolia")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Switch to Base Sepolia
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
        <BlockchainScoreSquare home="" away="" sportId="eng.1" onGameCreated={() => {}} />

      <div className="mt-6 text-center text-xs text-gray-400">
        <p>All games are stored on the Base blockchain.</p>
        <p>
          Contract:{" "}
          <a
            href="https://basescan.org/address/0x6147b9AB63496aCE7f3D270F8222e09038FD0870"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-500"
          >
            0x6147b9AB63496aCE7f3D270F8222e09038FD0870
          </a>
        </p>
      </div>
    </div>
  );
};

export default BlockchainScoreSquareCreate;
