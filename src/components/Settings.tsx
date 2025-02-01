'use client'
import React, { useState, useEffect } from 'react';
import { useFarcasterSigner, usePrivy } from '@privy-io/react-auth';
import Image from 'next/image'; 
import { ExternalEd25519Signer } from '@standard-crypto/farcaster-js';
import axios from 'axios';
import { fetchTeamLogos } from './utils/fetchEPLTable';
import pinToIPFS from './utils/pinToIPFS'; 
import { useUserUpdateMutation } from '~/hooks/fhub/useUserUpdateMutation';
import * as Account from 'fhub/Account'

interface Team {
  name: string;
  abbreviation: string;
  logoUrl: string;
}

const Settings = () => {
  const [status, setStatus] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);  
  const [userProfile, setUserProfile] = useState<any>(null); 
  const [favTeams, setFavTeams] = useState<string[]>([]); // Support multiple favorite teams
  const { user } = usePrivy();
  const farcasterAccount = user?.linkedAccounts.find((account) => account.type === 'farcaster'); 
  const { getFarcasterSignerPublicKey, signFarcasterMessage } = useFarcasterSigner();
  const privySigner = new ExternalEd25519Signer(signFarcasterMessage, getFarcasterSignerPublicKey);
  const useUserUpdateMutation1 = useUserUpdateMutation();

  useEffect(() => {
    if (farcasterAccount) {
      fetchUserProfile(farcasterAccount.username)
        .then((data) => {
          console.log("User profile fetched:", data);
          setUserProfile(data); 

          const footyApp = data?.apps?.find(app => app.domain === "fc-footy.vercel.app");
          const favTeamsData = footyApp?.data?.filter(item => item.name === "fav_team").map(item => item.value) || [];

          setFavTeams(favTeamsData);
        })
        .catch(async (error) => {
          console.warn("User profile fetch failed. Using default template.");

          const defaultProfile = {
            version: "1.1.0",
            schemaVersion: "1.0.0",
            userName: farcasterAccount.username,
            apps: [
              {
                appName: "Footy App",
                domain: "fc-footy.vercel.app",
                data: [],
                lastUpdated: new Date().toISOString(),
              }
            ],
            lastUpdated: new Date().toISOString(),
          };

          setUserProfile(defaultProfile);
          setFavTeams([]);

          try {
            const cid = await pinToIPFS(defaultProfile);
            console.log("Default profile pinned with CID:", cid);
          } catch (ipfsError) {
            console.error("Error saving default profile to IPFS:", ipfsError);
          }
        });
    }

    fetchTeamLogos().then((data) => setTeams(data));
  }, [farcasterAccount]);

  const fetchUserProfile = async (farcasterUserName: string) => {
    const url = `https://${farcasterUserName}.furl.pro`;
    console.log('Fetching user profile from:', url);
  
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const handleRowClick = async (team: Team) => {
    if (!userProfile) {
      setStatus("User profile is not set. Try again.");
      return;
    }

    let updatedFavTeams;
    if (favTeams.includes(team.abbreviation)) {
      // Remove team if already selected
      setStatus(`Removing ${team.name} as favorite`);
      updatedFavTeams = favTeams.filter(t => t !== team.abbreviation);
    } else {
      // Add team to favorites
      setStatus(`Attesting that ${team.name} is your favorite club`);
      updatedFavTeams = [...favTeams, team.abbreviation];
    }

    const updatedApps = userProfile.apps.map(app => {
      if (app.domain === "fc-footy.vercel.app") {
        return {
          ...app,
          data: updatedFavTeams.map(fav => ({ name: "fav_team", value: fav })), // Store multiple favorites
          lastUpdated: new Date().toISOString(),
        };
      }
      return app;
    });

    const appExists = userProfile.apps.some(app => app.domain === "fc-footy.vercel.app");
    if (!appExists) {
      updatedApps.push({
        appName: "Footy App",
        domain: "fc-footy.vercel.app",
        data: updatedFavTeams.map(fav => ({ name: "fav_team", value: fav })),
        lastUpdated: new Date().toISOString(),
      });
    }

    const updatedProfile = { 
      ...userProfile, 
      apps: updatedApps,
      lastUpdated: new Date().toISOString(),
    };

    try {
      const cid = await pinToIPFS(updatedProfile);
      console.log("Profile updated and pinned with CID:", cid);
      setStatus(`Profile updated`);
      setFavTeams(updatedFavTeams);
      setUserProfile(updatedProfile);
      useUserUpdateMutation1.mutate(
        { 
          account: Account.fromEd25519Signer({
            fid : farcasterAccount?.fid || 0,
            signer: {
              getSignerKey: getFarcasterSignerPublicKey,
              signMessageHash: signFarcasterMessage,
            },
          }),
          data: {
            type: 'url',
            value: `ipfs://${cid?.IpfsHash}`,
          }
        }
      );
    } catch (error) {
      console.error("Error saving updated profile to IPFS:", error);
      setStatus("Error saving profile");
    }
  };

  return (
    <div>
      <div>{status && <p className='text-fontRed'>{status}</p>}</div>

      {favTeams.length > 0 && (
        <div className="mb-4 text-center text-notWhite font-semibold">
          Favorite Team: {favTeams[0]} <span role="img" aria-label="notification">🔔</span>
        </div>
      )}

      <div className="w-full h-full overflow-y-auto p-2 pr-2 pl-2">
        <table className="w-full bg-darkPurple border border-limeGreenOpacity rounded-lg shadow-lg overflow-hidden">
          <thead>
            <tr className="bg-darkPurple text-notWhite text-center border-b border-limeGreenOpacity">
              <th className="py-1 px-1 font-medium"></th>
              <th className="py-0 px-0 font-medium">Select clubs get notifications</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr
                key={team.abbreviation}
                onClick={() => handleRowClick(team)}
                className={`border-b border-limeGreenOpacity hover:bg-purplePanel transition-colors text-lightPurple text-sm cursor-pointer ${
                  favTeams.includes(team.abbreviation) ? 'bg-purplePanel' : ''
                }`}
              >
                <td className="py-1 px-1 text-center">
                  <span className="mb-1">{index + 1}</span>
                </td>
                <td className="py-1 px-1">
                  <div className="flex items-center justify-left space-x-2">
                    <span>{team.name}</span>
                    {favTeams.includes(team.abbreviation) && (
                      <span role="img" aria-label="notification" className="ml-2">🔔</span>
                    )}
                  </div>
                </td>
                <td className="py-1 px-1 text-center">
                  <Image src={team.logoUrl} alt={team.name} width={30} height={30} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Settings;
