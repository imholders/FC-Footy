'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import frameSdk from "@farcaster/frame-sdk";
import { fetchFarcasterProfileByAddress, getDefaultProfilePicture } from '../utils/fetchFarcasterProfile';

// Cache for Farcaster profiles to avoid redundant API calls
const profileCache: Record<string, {
  imageUrl: string;
  username: string;
  fid?: number;
  timestamp: number;
}> = {};

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

interface FarcasterAvatarProps {
  address: string;
  size?: number;
  className?: string;
  onClick?: () => void; // Optional custom onClick handler
  disableClick?: boolean; // Disable clickable functionality (e.g., in referee mode)
}

/**
 * FarcasterAvatar - A component that displays a Farcaster profile picture for an Ethereum address
 * 
 * If the address has a Farcaster profile, it shows their profile picture.
 * Otherwise, it shows a default avatar generated from the address.
 * The avatar is clickable and opens the user's Farcaster profile when clicked.
 * The clickable functionality can be disabled with the disableClick prop.
 */
const FarcasterAvatar: React.FC<FarcasterAvatarProps> = ({ 
  address, 
  size = 24,
  className = '',
  onClick,
  disableClick = false
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [fid, setFid] = useState<number | null>(null);
  const [isFrameContext, setIsFrameContext] = useState<boolean>(false);

  // Check if we're in a frame context
  useEffect(() => {
    const checkFrameContext = async () => {
      try {
        const context = await frameSdk.context;
        setIsFrameContext(!!context);
      } catch (error) {
        console.error('Error checking frame context:', error);
        setIsFrameContext(false);
      }
    };

    checkFrameContext();
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      // console.log('Fetching Farcaster profile for', address);
      if (!address) {
        const defaultImage = getDefaultProfilePicture();
        // console.log('No address provided, using default image:', defaultImage);
        setImageUrl(defaultImage);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const normalizedAddress = address.toLowerCase();
      const cachedProfile = profileCache[normalizedAddress];
      const now = Date.now();

      if (cachedProfile && (now - cachedProfile.timestamp) < CACHE_EXPIRATION) {
        // Use cached data if it's not expired
        // console.log('Using cached profile for', normalizedAddress, cachedProfile);
        setImageUrl(cachedProfile.imageUrl);
        setUsername(cachedProfile.username);
        if (cachedProfile.fid) setFid(cachedProfile.fid);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // console.log('Fetching Farcaster profile for', normalizedAddress);
        const profile = await fetchFarcasterProfileByAddress(normalizedAddress);
        // console.log('Farcaster profile result:', profile);
        
        let resultImageUrl: string;
        let resultUsername: string = '';
        let resultFid: number | undefined = undefined;
        
        if (profile && profile.pfp && profile.pfp.url) {
          resultImageUrl = profile.pfp.url;
          resultUsername = profile.username || profile.displayName || '';
          resultFid = profile.fid;
          // console.log('Using Farcaster profile image:', resultImageUrl);
          setFid(profile.fid);
        } else {
          resultImageUrl = getDefaultProfilePicture();
          // console.log('No Farcaster profile found, using default image:', resultImageUrl);
          setFid(null);
        }
        
        // Update state
        setImageUrl(resultImageUrl);
        setUsername(resultUsername);
        
        // Update cache
        profileCache[normalizedAddress] = {
          imageUrl: resultImageUrl,
          username: resultUsername,
          fid: resultFid,
          timestamp: now
        };
      } catch (error) {
        console.error('Error fetching Farcaster profile:', error);
        const defaultImage = getDefaultProfilePicture();
        setImageUrl(defaultImage);
        setFid(null);
        
        // Cache the default image too to avoid repeated failures
        profileCache[normalizedAddress] = {
          imageUrl: defaultImage,
          username: '',
          timestamp: now
        };
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [address]);

  // Handle click on the avatar
  const handleClick = async () => {
    // If clicking is disabled, do nothing
    if (disableClick) {
      return;
    }
    
    // If custom onClick is provided, use that
    if (onClick) {
      onClick();
      return;
    }

    // If we have a Farcaster ID and we're in a frame context, use the SDK
    if (fid && isFrameContext) {
      try {
        await frameSdk.actions.viewProfile({ fid: fid });
      } catch (error) {
        console.error('Error opening Farcaster profile:', error);
        // Fallback to Basescan if frame SDK fails
        window.open(`https://basescan.org/address/${address}`, '_blank');
      }
    } else if (username) {
      // If we have a username but no frame context, open Warpcast
      window.open(`https://warpcast.com/${username}`, '_blank');
    } else {
      // Otherwise, link to Basescan
      window.open(`https://basescan.org/address/${address}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div 
        className={`rounded-full bg-gray-300 animate-pulse ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  // Check if the image is the default spinner
  const isDefaultSpinner = imageUrl.includes('defifa_spinner.gif');
  const hasFarcasterProfile = !!username;
  const isClickable = hasFarcasterProfile && !disableClick;

  return (
    <div 
      className={`relative ${className} ${isClickable ? 'cursor-pointer' : ''}`} 
      title={username ? `@${username}` : `View on Basescan`}
      style={{ width: `${size}px`, height: `${size}px`, overflow: 'hidden' }}
      onClick={isClickable ? handleClick : undefined}
    >
      {isDefaultSpinner ? (
        // For the default spinner, use a regular img tag to avoid Next.js Image optimization issues
        <div className="relative">
          <img
            src={imageUrl}
            alt="Default avatar"
            width={size}
            height={size}
            className="w-full h-full object-contain"
          />
          {!hasFarcasterProfile && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-gray-800" title="No Farcaster profile found" />
          )}
        </div>
      ) : (
        // For Farcaster profile pictures, use Next.js Image component
        <Image
          src={imageUrl}
          alt={username || 'Profile'}
          width={size}
          height={size}
          className="rounded-full"
          onError={(e) => {
            console.error('Error loading image:', imageUrl);
            e.currentTarget.src = getDefaultProfilePicture();
          }}
        />
      )}
      {username && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-gray-800" title="Farcaster profile found" />
      )}
    </div>
  );
};

export default FarcasterAvatar; 