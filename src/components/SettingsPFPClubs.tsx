"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePrivy, useFarcasterSigner } from "@privy-io/react-auth";
import Image from "next/image";
import { fetchTeamLogos } from "./utils/fetchTeamLogos";
import { getTeamPreferences } from "../lib/kvPerferences";
import frameSdk from "@farcaster/frame-sdk";
import toast, { Toaster } from "react-hot-toast";
import { Rnd } from "react-rnd";

const SNAPCHAIN_API = "https://snapchain.pinnable.xyz/v1/info";

interface Team {
  name: string;
  abbreviation: string;
  league: string;
  logoUrl: string;
}

interface SettingsPFPClubsProps {
  onTabChange: (tab: string) => void;
}

const getTeamId = (team: Team) => `${team.league}-${team.abbreviation}`;
const defaultLogoUrl = "/defifa_spinner.gif";

const SettingsPFPClubs: React.FC<SettingsPFPClubsProps> = ({ onTabChange }) => {
  const { getFarcasterSignerPublicKey, signFarcasterMessage } = useFarcasterSigner();
  const { user } = usePrivy();
  const { requestFarcasterSignerFromWarpcast } = useFarcasterSigner();
  const farcasterAccount = user?.linkedAccounts.find(
    (account) => account.type === "farcaster"
  );

  const [teams, setTeams] = useState<Team[]>([]);
  const [favTeams, setFavTeams] = useState<string[]>([]);
  const [renderedSrc, setRenderedSrc] = useState<string>(user?.farcaster?.pfp || defaultLogoUrl);
  const [footyClubSticker, setFootyClubSticker] = useState({
    visible: true,
    x: 20,
    y: 140,
    width: 100,
    height: 100,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (farcasterAccount) {
      const fid = Number(farcasterAccount.fid);
      getTeamPreferences(fid)
        .then((teamsFromRedis) => {
          if (teamsFromRedis) setFavTeams(teamsFromRedis);
        })
        .catch((err) => console.error("Error fetching team preferences:", err));
    }
    fetchTeamLogos().then((data) => setTeams(data));
  }, [farcasterAccount]);

  const favTeamObj = favTeams.length > 0 ? teams.find((team) => getTeamId(team) === favTeams[0]) : null;

  useEffect(() => {
    async function renderFinalImage() {
      try {
        if (!user?.farcaster?.pfp) throw new Error("No PFP URL found");

        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = user.farcaster.pfp;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (err) => reject(err);
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get 2D context");

        ctx.drawImage(img, 0, 0);

        if (footyClubSticker.visible && containerRef.current) {
          const footyImg = new window.Image();
          footyImg.crossOrigin = "anonymous";
          footyImg.src = favTeamObj?.logoUrl || defaultLogoUrl;

          await new Promise<void>((resolve, reject) => {
            footyImg.onload = () => resolve();
            footyImg.onerror = (err) => reject(err);
          });

          ctx.drawImage(
            footyImg,
            footyClubSticker.x,
            footyClubSticker.y,
            footyClubSticker.width,
            footyClubSticker.height
          );
        }

        const dataUrl = canvas.toDataURL("image/png");
        setRenderedSrc(dataUrl);
      } catch (err) {
        console.error(err);
        toast.error(`Error rendering image: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    renderFinalImage();
  }, [user?.farcaster?.pfp, footyClubSticker, favTeamObj]);

  // 🔥 **Implementasi Snapchain Client-Side Update**
  const setPfp = useCallback(async () => {
    const toastId = toast.loading("Setting new profile picture...");
    try {
      if (!renderedSrc) throw new Error("No PFP Image Found");

      const response = await fetch(SNAPCHAIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: renderedSrc }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const json = await response.json();
      console.log("PFP successfully updated on Snapchain:", json);
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error setting profile picture:", error);
      toast.error(
        `Error setting profile picture: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      toast.dismiss(toastId);
    }
  }, [renderedSrc]);

  return (
    <div className="w-full h-full overflow-y-auto">
      <Toaster />
      <div className="container prose mx-auto max-w-prose p-5">
        <div
          ref={containerRef}
          className="relative inline-block overflow-hidden"
          style={{ marginTop: "1rem" }}
        >
          <img className="aspect-square w-full object-cover" src={renderedSrc} alt="Filtered PFP" />
        </div>
        <button
          onClick={setPfp}
          className="w-full sm:w-38 bg-deepPink text-white py-2 px-4 rounded-lg transition-colors hover:bg-fontRed mt-4"
        >
          Update profile pic
        </button>
      </div>
    </div>
  );
};

export default SettingsPFPClubs;
