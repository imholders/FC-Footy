'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import frameSdk from '@farcaster/frame-sdk';
import { PrivyUser } from '../../types/gameTypes';

interface LinkedAccount {
  type: string;
  profileImage?: string;
  fid?: number; // Farcaster ID
  username?: string;
  [key: string]: unknown;
}

interface WalletConnectInfoProps {
  authenticated: boolean;
  address: string | undefined;
  isCorrectNetwork: boolean;
  currentNetwork: string;
  login: () => void;
  logout: () => void;
  user: PrivyUser | null;
}

const WalletConnectInfo: React.FC<WalletConnectInfoProps> = ({
  authenticated,
  address,
  isCorrectNetwork,
  currentNetwork,
  login,
  logout,
  user
}) => {
  // Track if we're inside a Farcaster frame
  const [isFarcasterFrame, setIsFarcasterFrame] = useState(false);

  useEffect(() => {
    const checkFarcasterContext = async () => {
      try {
        const context = await frameSdk.context;
        if (context) {
          console.log("✅ Farcaster Frame detected:", context);
          setIsFarcasterFrame(true);
        } else {
          console.log("❌ Not inside a Farcaster Frame.");
          setIsFarcasterFrame(false);
        }
      } catch (error) {
        console.error("⚠️ Error checking Farcaster context:", error);
        setIsFarcasterFrame(false);
      }
    };
    checkFarcasterContext();
  }, []);

  // Find the user's Farcaster profile if linked
  const farcasterAccount = user?.linkedAccounts?.find(
    (account: LinkedAccount) => account.type === 'farcaster'
  );

  const profileImage = farcasterAccount?.profileImage || '/defifa_spinner.gif';
  const fid = farcasterAccount?.fid;
  const username = farcasterAccount?.username;
  const displayName = username
    ? `@${username}`
    : address
      ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      : 'Not Connected';

  // Function to handle clicking on the avatar or username
  const handleProfileClick = async () => {
    if (typeof fid === 'number' && !isNaN(fid)) {
      try {
        if (isFarcasterFrame) {
          console.log("🟣 Opening Farcaster Profile via Frame SDK:", fid);
          await frameSdk.actions.viewProfile({ fid });
        } else {
          console.log("🌐 Opening Warpcast Profile:", username);
          window.open(`https://warpcast.com/${username}`, '_blank');
        }
      } catch (error) {
        console.error('❌ Error opening Farcaster profile:', error);
        if (username) {
          window.open(`https://warpcast.com/${username}`, '_blank');
        }
      }
    } else if (address) {
      console.log("🔗 Opening Basescan:", address);
      window.open(`https://basescan.org/address/${address}`, '_blank');
    }
  };

  return (
    <div className="w-full flex justify-end items-center p-2 bg-gray-900 rounded-lg shadow-md">
      {authenticated ? (
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <div 
            className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-700 flex items-center justify-center cursor-pointer"
            onClick={handleProfileClick} // Click opens social profile or Basescan
          >
            <Image 
              src={profileImage}
              alt="User Avatar"
              width={40}
              height={40}
              className="object-cover rounded-full"
              onError={(e) => {
                console.log('🛑 Image load error, falling back to default avatar');
                e.currentTarget.src = '/defifa_spinner.gif';
              }}
            />
          </div>

          {/* Address & Network Info */}
          <div className="flex flex-col">
            <span 
              className="text-sm text-lightPurple cursor-pointer hover:text-limeGreen"
              onClick={handleProfileClick} // Click opens social profile or Basescan
            >
              {displayName}
            </span>
            <span className={`text-xs ${isCorrectNetwork ? 'text-green-400' : 'text-yellow-400'}`}>
              {currentNetwork}
            </span>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={logout}
            className="px-3 py-1 bg-deepPink text-white rounded-lg text-xs hover:bg-fontRed transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={login}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnectInfo;
