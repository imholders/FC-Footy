import { useState } from 'react';
import { ExternalEd25519Signer } from '@standard-crypto/farcaster-js';
import { usePrivy, useFarcasterSigner } from '@privy-io/react-auth';
import { Message, makeCastAdd, HubResult } from '@farcaster/core';
import { CastType } from '@farcaster/core';
import { CastAddBody } from '@farcaster/core';

export default function Cast() {
  const [text, setText] = useState('');
  const { user } = usePrivy();
  const { getFarcasterSignerPublicKey, signFarcasterMessage, requestFarcasterSignerFromWarpcast } = useFarcasterSigner();

  const farcasterAccount = user?.linkedAccounts.find(
    (account) => account.type === 'farcaster'
  );

  class FarcasterCoreCompatibleSigner {
    constructor(private signer: ExternalEd25519Signer) {}

    async signMessageHash(messageHash: Uint8Array): Promise<HubResult<Uint8Array>> {
      return this.signer.signMessageHash(messageHash);
    }

    async getSignerKey(): Promise<HubResult<Uint8Array>> {
      return this.signer.getSignerKey();
    }
  }

  async function submitCastViaFetch({ text, farcasterAccount, signer }) {
    const castParams: CastAddBody = {
      type: CastType.CAST,
      text,
      embeds: [],
      embedsDeprecated: [],
      mentions: [],
      mentionsPositions: [],
      parentCastId: undefined,
      parentUrl: undefined,
    };

    const fid = farcasterAccount?.fid;
    if (!fid) {
      console.error("Missing FID from farcasterAccount.");
      return null;
    }
    const dataOptions = {
      fid,
      network: 1, // Mainnet Farcaster
    };

    const result = await makeCastAdd(castParams, dataOptions, signer);
    if (!result.isOk()) {
      console.error("makeCastAdd failed:", result.error?.message);
      return null;
    }
    const signedMessage = result.value;
    const encoded = Message.encode(signedMessage).finish();

    try {
      const res = await fetch('https://snapchain-api.neynar.com/v1/submitMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-api-key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY!,
        },
        body: encoded,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Error sending cast:', err);
        return null;
      }

      const result = await res.json();
      return result;
    } catch (err) {
      console.error("Submit error:", err);
      return null;
    }
  }

  async function sendCast() {
    if (!farcasterAccount) {
      console.log("No Farcaster account linked.");
      return;
    }

    const rawSigner = new ExternalEd25519Signer(
      signFarcasterMessage,
      getFarcasterSignerPublicKey
    );
    const signer = new FarcasterCoreCompatibleSigner(rawSigner);

    const result = await submitCastViaFetch({ text, farcasterAccount, signer });
    if (result) {
      console.log("Cast submitted:", result);
      if (result.hash) {
        const castUrl = `https://warpcast.com/~/cast/${result.hash}`;
        console.log("Cast URL:", castUrl);
      }
      setText("");
    }
  }

  async function fetchSnapchainInfo() {
    try {
      const response = await fetch('https://snapchain-api.neynar.com/v1/info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          //'x-api-key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NEYNAR_API_KEY!}`,
        },
      });

      const result = await response.json();
      console.log("Snapchain info:", result);
    } catch (error) {
      console.error("Failed to fetch Snapchain info:", error);
    }
  }

  return (
    <>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={sendCast} disabled={!farcasterAccount}>Send Cast</button>
      <button
        onClick={() => requestFarcasterSignerFromWarpcast()}
        //disabled={!farcasterAccount || Boolean(farcasterAccount.signerPublicKey)}
      >
        Authorize my Farcaster signer from Warpcast
      </button>
      <button onClick={fetchSnapchainInfo}>Test Snapchain Info</button>
    </>
  );
}
