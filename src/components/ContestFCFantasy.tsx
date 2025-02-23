import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import frameSdk from "@farcaster/frame-sdk";
import FantasyRow from './ContestFantasyRow';
import { fetchFantasyData } from './utils/fetchFantasyData';
import { usePrivy } from '@privy-io/react-auth';
import { toPng } from 'html-to-image';
import dayjs from 'dayjs';
// import { useWaitForTransactionReceipt } from 'wagmi';
// import { ethers } from 'ethers';
// import MintButton from './ui/MintButton';
// const testing = true; // Toggle this for testing - will not mint NFTs
//const CONTRACT_ADDRESS = '0xdCc32F6Efce28B595f255363ae6EEAA6Cd4B9499';
/* const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      }
    ],
    "name": "mintAsWhitelisted",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];
 */
const ContestFCFantasy = () => {
  const [fantasyData, setFantasyData] = useState<FantasyEntry[]>([]);
  const [loadingFantasy, setLoadingFantasy] = useState(false);
  const [errorFantasy, setErrorFantasy] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<FantasyEntry | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | JSX.Element>('');
  // const [setMintingInProgress] = useState(false);
  // const [txHash, setTxHash] = useState(null);
  const [isContextLoaded, setIsContextLoaded] = useState<boolean>(false);
  const [sharingInProgress, setSharingInProgress] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  interface FantasyEntry {
    rank: number;
    pfp: string | null;
    team: {
      name: string | null;
      logo: string | null;
    };
    manager: string;
    entry_name: string | null;
    last_name: string | null;
    fav_team: number | null;
    total: number | null;
    location: string | null;
    fid: number | null;
  }
  const cardRef = useRef(null);
  const { user } = usePrivy();

  const farcasterAccount = user?.linkedAccounts.find(
    (account) => account.type === 'farcaster'
  );

  // const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    const loadContext = async () => {
      try {
        const ctx = await frameSdk.context;
        console.log("Farcaster context loaded:",JSON.stringify(ctx, null, 2));
        if (!ctx) {
          console.log("Farcaster context returned null or undefined.");
          return;
        }
        setIsContextLoaded(true);
      } catch (error) {
        console.error("Failed to load Farcaster context:", error);
      }
    };
    if (!isContextLoaded) {
      loadContext();
    }
  }, [isContextLoaded]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingFantasy(true);
      try {
        const data = await fetchFantasyData();
        const rankedData = data.map((item, i) => ({
          ...item,
          rank: item.rank ?? i + 1,
        }));
        setFantasyData(rankedData);
      } catch (error) {
        setErrorFantasy(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoadingFantasy(false);
      }
    };

    fetchData();
  }, []);

/*   useWaitForTransactionReceipt({
    hash: txHash,
    onSuccess: (receipt) => {
      console.log('✅ NFT Minted:', receipt);
      setStatusMessage(`🎉 NFT Minted! Tx: https://basescan.org/tx/${txHash}`);
      setMintingInProgress(false); // ✅ Reset minting flag
      setTxHash(null); // ✅ Clear transaction hash for the next mint
    },
    onError: (error) => {
      console.error('❌ Transaction failed:', error);
      setStatusMessage('❌ Transaction failed. Try again.');
      setMintingInProgress(false); // ✅ Reset minting flag
    },
  }); */

  const forceDOMUpdate = (): Promise<void> => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve(); // Resolves with no value (undefined), which satisfies void
      });
    });
  };
  
  
  const defaultCardEntry = farcasterAccount
    ? fantasyData.find((entry) =>
        entry.manager.toLowerCase() === farcasterAccount?.username?.toLowerCase()
      )
    : fantasyData.find((entry) => entry.rank === 1);

    const waitForImagesToLoad = async (ref: React.RefObject<HTMLElement>): Promise<void> => {
      if (!ref.current) return;
    
      const images = ref.current.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
      const promises: Promise<void>[] = [];
    
      images.forEach((img) => {
        if (!img.complete || img.naturalHeight === 0) {
          promises.push(
            new Promise((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
          );
        }
      });
    
      await Promise.all(promises);
    };
    
    
    
  
    const waitForDOMUpdate = (): Promise<void> => {
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          resolve(); // Explicitly resolves the Promise with 'void'
        });
      });
    };
    
  
    const handleRowSelect = async (selected: FantasyEntry) => {
      setSelectedEntry(selected);
      setStatusMessage(''); // Clear previous message
      setRenderKey((prev) => prev + 1); // Force a re-render
    
      await forceDOMUpdate(); // Wait for DOM updates
      await waitForImagesToLoad(cardRef); // Wait for images to load
    
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
  
/*   const uploadMetadataToIPFS = async (imageCid: any, cardEntry: { manager: any; rank: any; total: any; } | undefined) => {
    try {
      const metadata = {
        name: `FC Footy NFT - ${cardEntry.manager}`,
        description: `Fantasy Football rank card for ${cardEntry.manager}.`,
        image: `ipfs://${imageCid}`,
        attributes: [
          { trait_type: 'License', value: 'CC0' },
          { trait_type: 'Theme', value: 'FC Footy Retro' },
          { trait_type: 'Rank', value: cardEntry.rank || 'Unranked' },
          { trait_type: 'Points', value: cardEntry.total || 0 },
        ],
      };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: metadataBlob,
      });
      const result = await response.json();
      return response.ok ? result.ipfsHash : null;
    } catch (error) {
      console.error('Metadata upload failed', error);
      return null;
    }
  }; */

/*   const handleMintImage = async () => {
    if (!cardRef.current) return;
  
    setMintingInProgress(true);
    setStatusMessage('🖼️ Converting card to image...');
  
    try {
      // 1️⃣ Convert the card to PNG
      await waitForDOMUpdate(); // ✅ Ensure DOM updates with selectedEntry
      await waitForImagesToLoad(cardRef); // ✅ Ensure images are loaded

      const dataUrl = await toPng(cardRef.current, {
        style: { fontFamily: 'VT323, monospace' },
        cacheBust: true,
      });
  
      // 2️⃣ Upload image to IPFS
      const blob = await (await fetch(dataUrl)).blob();
      const response = await fetch('/api/upload', { method: 'POST', body: blob });
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error('Image upload failed');
      }
  
      const imageCid = result.ipfsHash;
      console.log('✅ Image uploaded to IPFS:', imageCid);
      setStatusMessage(
        <div className="truncate max-w-xs bg-gray-800 text-white p-3 rounded-lg">
          ✅ Image uploaded! CID: {imageCid}
        </div>
      );
        
      // 3️⃣ Upload metadata
      const metadataCid = await uploadMetadataToIPFS(imageCid, cardEntry);
  
      if (!metadataCid) throw new Error('Metadata upload failed');
  
      console.log('✅ Metadata uploaded to IPFS:', metadataCid);

      if (testing) {
        console.log('🚫 Skipping minting since testing is enabled.');
        setStatusMessage('🧪 Testing mode: Uploaded to IPFS, skipping mint.');
        return;
      }
  
      setStatusMessage('🚀 Minting NFT... On web? Check external wallet.');
  
      // 4️⃣ Mint NFT using `writeContractAsync`
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'mintAsWhitelisted',
        args: [`ipfs://${metadataCid}`], // Ensure this includes the full URI
        value: ethers.parseEther('0.0007'), // Mint fee
      });
  
      // 5️⃣ Save the transaction hash for monitoring
      console.log('📝 Transaction hash:', tx.hash);
      setTxHash(tx.hash);
      setStatusMessage(`⏳ Waiting for confirmation... Tx Hash: ${tx.hash}`);
    } catch (error) {
      console.error('❌ Minting failed:', error);
      setStatusMessage(`❌ Minting failed: ${error.message}`);
    } finally {
      setMintingInProgress(false);
    }
  }; */
  
  const cardEntry = selectedEntry || defaultCardEntry;

  return (
    <div>
      <div className="text-md font-bold mb-2">Closed League</div>
      
      {cardEntry && (
        <div
          ref={cardRef}
          key={renderKey} // 🔄 This forces React to fully re-render the element
          className="relative font-vt323 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-6 rounded-3xl shadow-2xl border-8 border-neonGreen pixel-border overflow-hidden"
        >
          {/* Card Title */}
          <h1 className="text-yellow-300 text-center text-4xl font-vt323 font-pixel mb-4">
            FC FEPL 24/25
          </h1>

          {/* Manager Info */}
          <div className="flex items-center space-x-4 relative z-10">
            <div className="relative">
              <img
                src={cardEntry.pfp || '/defifa_spinner.gif'}
                alt="Manager Avatar"
                className="rounded-full w-24 h-24 border-4 border-white"
                onLoad={() => console.log(`✅ Image loaded for: ${cardEntry.manager}`)}
                onError={() => console.log(`🔄 Fallback image used for: ${cardEntry.manager}`)}
              />
              <div className="absolute bottom-0 right-0">
                <Image
                  src="/defifa_spinner.gif"
                  alt="Defifa Logo"
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              </div>
            </div>
            <div>
              <p className="text-white font-pixel text-2xl tracking-wider">
                {cardEntry.manager}
              </p>
              <p className="text-gray-300 text-lg font-pixel">{cardEntry.team.name}</p>
              <p className="text-white text-xl font-pixel">Rank: {cardEntry.rank}</p>
              <p className="text-white text-lg font-pixel">Points: {cardEntry.total}</p>
            </div>
          </div>

          {/* Favorite Team Logo as Watermark */}
          {cardEntry.team.logo && (
            <div className="absolute top-0 right-0 opacity-30">
              <img
                src={cardEntry.team.logo || '/default-team-logo.png'}
                alt="Team Logo"
                className="object-contain w-[120px] h-[120px]"
                onLoad={() => console.log(`✅ Team logo loaded for: ${cardEntry.team.name}`)}
                onError={() => console.log(`🔄 Fallback team logo used for: ${cardEntry.team.name}`)}
              />

            </div>
          )}

          {/* Date */}
          <div className="absolute bottom-4 left-10 mt-4 text-yellow-300 font-pixel text-sm">
            {dayjs().format('MMM DD, YYYY')}
          </div>
        </div>
      )}

      {!loadingFantasy && (
        <div className="flex space-x-4 mt-4">
{/*           <button
            onClick={handleMintImage}
            disabled={mintingInProgress || !cardEntry}
            className={`w-full max-w-xs py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg text-lg font-bold ${
              mintingInProgress ? 'opacity-50' : ''
            }`}
          >
            {mintingInProgress ? 'Minting...' : 'Mint NFT'}
          </button> */}

          {/* Share Button */}
          {!loadingFantasy && (
            <button
              onClick={async () => {
                if (!cardRef.current) {
                  setStatusMessage('❌ No card selected to share.');
                  return;
                }
                setSharingInProgress(true); // ✅ Start sharing
                setStatusMessage('🔄 Uploading image for sharing...');

                try {
                  // Convert the card to PNG
                  await waitForDOMUpdate(); // ✅ Ensure the latest selection is rendered
                  await waitForImagesToLoad(cardRef); // ✅ Ensure images are loaded
                  const dataUrl = await toPng(cardRef.current, {
                    style: { fontFamily: 'VT323, monospace' },
                    cacheBust: true,
                  });

                  // Upload image to IPFS
                  const blob = await (await fetch(dataUrl)).blob();
                  const response = await fetch('/api/upload', { method: 'POST', body: blob });
                  const result = await response.json();

                  if (!response.ok) {
                    throw new Error('Image upload failed');
                  }

                  const imageCid = result.ipfsHash;
                  console.log('✅ Image uploaded to IPFS for sharing:', imageCid);

                  if (!cardEntry) {
                    setStatusMessage('❌ No card selected for sharing.');
                    return;
                  }
                  
                  // Create Cast text based on user stats
                  const castText = `🏆 Fantasy Football Card for @${cardEntry.manager}!\n📊 Rank: ${cardEntry.rank}\n⚽ Points: ${cardEntry.total}\nCheck out the latest dickbutt FC Fantasy League manager cards. \nThe dickbutt FC Fantasy League is moving on @base 🚀 rsn`; 
                  // Encode cast texthttps://warpcast.com/~/frames/launch?url=https://fc-footy.vercel.app
                  const encodedText = encodeURIComponent(castText);
                  const encodedEmbed1 = encodeURIComponent(`https://tan-hidden-whippet-249.mypinata.cloud/ipfs/${imageCid}`);
                  const encodedEmbed2 = encodeURIComponent(`https://fc-footy.vercel.app`);
                  // Generate Warpcast URL with embed and cast text
                  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodedText}&channelKey=football&embeds[]=${encodedEmbed1}&embeds[]=${encodedEmbed2}`;

                  // Open Warpcast share intent
                  frameSdk.actions.openUrl(warpcastUrl);
                  setSharingInProgress(false); // ✅ Start sharing

                  setStatusMessage('🚀 Shared on Warpcast! (check popup blocker)');
                } catch (error) {
                  console.error('❌ Sharing failed:', error);
                  if (error instanceof Error) {
                    setStatusMessage(`❌ Sharing failed: ${error.message}`);
                  } else {
                    setStatusMessage('❌ Sharing failed: An unknown error occurred.');
                  }
                  setSharingInProgress(false); // ✅ Reset sharing flag
                }
            }}
            disabled={sharingInProgress || !cardEntry}
            className={`w-full max-w-xs py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg text-lg font-bold ${
              sharingInProgress ? 'opacity-50' : ''
            }`}
          >
              {sharingInProgress ? 'Sharing...' : 'Share'}
            </button>
          )}   
        </div>
      )}

      {statusMessage && <div className="mt-4 bg-gray-800 text-white p-3 rounded-lg">{statusMessage}</div>}
        <div className="mt-6">
          {loadingFantasy ? (
            <div className="text-center">Loading...</div>
          ) : errorFantasy ? (
            <div className="text-red-500">{errorFantasy}</div>
          ) : fantasyData.length > 0 ? (
            <table className="w-full bg-darkPurple rounded-lg">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Profile</th>
                  <th>Manager</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {fantasyData.map((entry, index) => (
                  <FantasyRow key={index} entry={entry} onRowClick={handleRowSelect} />
                ))}
              </tbody>
            </table>
          ) : (
            <div>No fantasy data available.</div>
          )}
        </div>
    </div>
  );
};

export default ContestFCFantasy;
