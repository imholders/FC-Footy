import React, { useEffect, useState, useRef } from "react";
import { usePrivy, useLogin, useFarcasterSigner } from "@privy-io/react-auth";
import axios from "axios";
import * as Account from "fhub/Account";
import { useCastCreateMutation } from "~/hooks/fhub/useCastCreateMutation";
import { customEmojis } from "~/components/utils/customEmojis";

// Helper function to parse text and replace emoji codes with images
const renderMessageWithEmojis = (message: string) => {
  const emojiRegex = /([a-zA-Z0-9]+::[a-zA-Z0-9_]+)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = emojiRegex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(message.substring(lastIndex, match.index));
    }
    const emojiCode = match[1];
    if (customEmojis[emojiCode]) {
      nodes.push(
        <img
          key={match.index}
          src={customEmojis[emojiCode]}
          alt={emojiCode}
          className="inline w-4 h-4"
        />
      );
    } else {
      nodes.push(emojiCode);
    }
    lastIndex = emojiRegex.lastIndex;
  }
  if (lastIndex < message.length) {
    nodes.push(message.substring(lastIndex));
  }
  return nodes;
};

const ContentLiveChat = () => {
  const [casts, setCasts] = useState<unknown[]>([]);
  const [message, setMessage] = useState("");
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);

  const { authenticated, user } = usePrivy();
  const { login } = useLogin();
  const { getFarcasterSignerPublicKey, signFarcasterMessage } = useFarcasterSigner();
  const { requestFarcasterSignerFromWarpcast } = useFarcasterSigner();
  const farcasterAccount = user?.linkedAccounts.find(
    (account) => account.type === "farcaster"
  );

  const createCast = useCastCreateMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchCasts = async () => {
    console.log("Fetching casts...");
    try {
      const response = await axios.get("https://api.neynar.com/v2/farcaster/feed/channels", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_NEYNAR_API_KEY!,
          "accept": "application/json",
        },
        params: {
          channel_ids: "football",
          with_recasts: false,
          with_replies: false,
          members_only: true,
          limit: 10,
        },
      });
      console.log("Fetched casts:", response.data.casts);
      setCasts(response.data.casts || []);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Failed to fetch casts", err);
    }
  };

  useEffect(() => {
    fetchCasts();
  }, []);

  const postMessage = async () => {
    if (!authenticated) {
      login();
      return;
    }
    if (farcasterAccount) {
      const fid = Number(farcasterAccount.fid);
      const signer = {
        getSignerKey: getFarcasterSignerPublicKey,
        signMessageHash: (messageHash: Uint8Array) =>
          signFarcasterMessage(messageHash),
      };
      createCast.mutate({
        account: Account.fromEd25519Signer({
          fid: BigInt(fid),
          signer,
        }),
        cast: {
          text: {
            value: message,
            embeds: [
              /* {
                type: "url",
                url: "https://fc-footy.vercel.app/?tab=moneyGames&gameType=scoreSquare&eventId=eng_1_ARS_FUL_20250324214052",
              }, */
            ],
          },
          // parentUrl: "https://warpcast.com/~/channel/football",
          isLong: false,
        },
      }, {
        onSuccess: () => {
          console.log("Cast sent successfully!");
          setMessage("");
          setTimeout(fetchCasts, 3000);
        },
        onError: (error) => {
          console.error("Error sending cast:", error);
        }
      });
    } else {
      console.log("Failed to auth");
    }
  };

  // Append an emoji code to the current message
  const addEmoji = (emojiCode: string) => {
    setMessage((prev) => prev + `${emojiCode}`);
  };

  return (
    <div className="h-[500px] overflow-y-auto bg-darkPurple p-4 rounded-lg flex flex-col justify-between">
      <div className="space-y-3 overflow-y-auto">
        {casts.slice().reverse().map((cast, idx) => (
          <div key={idx} className="flex items-start text-sm text-white space-x-3">
            <img src={cast.author.pfp_url} alt="pfp" className="w-6 h-6 rounded-full flex-shrink-0" />
            <div className="flex-1 text-lightPurple break-words">
              <span className="font-bold text-notWhite">@{cast.author.username}</span>{" "}
              {cast.text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                part.match(/https?:\/\/[^\s]+/) ? (
                  <span key={i} className="text-fontRed">[Link]</span>
                ) : (
                  renderMessageWithEmojis(part).map((node, j) => (
                    <React.Fragment key={j}>{node}</React.Fragment>
                  ))
                )
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {user?.farcaster && !user.farcaster?.signerPublicKey && (
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={() => requestFarcasterSignerFromWarpcast()}
            className="w-full sm:w-38 bg-deepPink text-white py-2 px-4 rounded-lg transition-colors hover:bg-fontRed"
          >
            Authorize casting
          </button>
        </div>
      )}
      <div className="mt-4">
        <div className="flex justify-start mb-2">
          <button
            onClick={() => setShowEmojiPanel((prev) => !prev)}
            className="px-4 py-2 rounded-md bg-blue-500 text-white font-bold"
          >
            {showEmojiPanel ? "Hide Emojis" : "Show Emojis"}
          </button>
        </div>
        {showEmojiPanel && (
          <div className="flex flex-wrap gap-2 p-2 bg-gray-700 rounded mb-2">
            {Object.entries(customEmojis).map(([emojiCode, url]) => (
              <img
                key={emojiCode}
                src={url}
                alt={emojiCode}
                className="w-6 h-6 cursor-pointer"
                onClick={() => addEmoji(emojiCode)}
              />
            ))}
          </div>
        )}
        <div className="border-t border-gray-700 pt-3 flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message... (use footy::smile for custom emoji)"
            className="flex-1 px-4 py-2 rounded-md bg-gray-800 text-white outline-none"
          />
          <button
            onClick={postMessage}
            className="px-4 py-2 rounded-md bg-limeGreen text-black font-bold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentLiveChat;