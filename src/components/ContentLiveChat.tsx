import React, { useEffect, useState, useRef } from "react";
import { usePrivy, useLogin, useFarcasterSigner } from "@privy-io/react-auth";
import axios from "axios";
import * as Account from "fhub/Account";
import { useCastCreateMutation } from "~/hooks/fhub/useCastCreateMutation";
import { emojiPacks } from "~/components/utils/customEmojis";
import { getTeamPreferences } from "~/lib/kv";

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
    const foundEmoji = Object.values(emojiPacks).flatMap(pack => pack.emojis).find(emoji => emoji.code === emojiCode);
    if (foundEmoji) {
      nodes.push(
        <img
          key={match.index}
          src={foundEmoji.url}
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

function getTeamLogoFromId(teamId: string): string {
  const abbr = teamId.split("-")[1]; // e.g., "ars" from "eng.1-ars"
  return `/assets/logos/${abbr}.png`;
}

const ChatInput = ({
  message,
  setMessage,
  onSubmit,
  showEmojiPanel,
  setShowEmojiPanel,
  selectedPack,
  setSelectedPack,
  searchTerm,
  setSearchTerm,
  showPackDropdown,
  setShowPackDropdown,
  addEmoji,
}: {
  message: string;
  setMessage: (msg: string) => void;
  onSubmit: () => void;
  showEmojiPanel: boolean;
  setShowEmojiPanel: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPack: string;
  setSelectedPack: (pack: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showPackDropdown: boolean;
  setShowPackDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  addEmoji: (emojiCode: string) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <div className="border-t border-gray-700 pt-3 relative">
      <button
        onClick={() => setShowEmojiPanel((prev) => !prev)}
        className="group absolute bottom-2 left-4 flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-white text-sm transition-all duration-200 ease-out hover:scale-105 hover:shadow-md"
        title="Kick off with a footy emoji"
      >
        <span role="img" aria-label="footy emoji" className="transition-transform duration-200 ease-out group-hover:rotate-6">⚽</span>
        <span className="hidden sm:inline">Kick off</span>
      </button>
      {showEmojiPanel && (
        <div className="absolute bottom-full left-0 p-2 bg-gray-700 rounded space-y-2 z-20 w-full max-h-[240px] overflow-y-auto shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
            <div className="relative inline-block text-left">
              <button
                className="flex items-center gap-2 px-2 py-1 text-sm text-white bg-gray-800 rounded"
                onClick={() => setShowPackDropdown((prev) => !prev)}
              >
                <img
                  src={emojiPacks.find((p) => p.name === selectedPack)?.logo}
                  alt=""
                  className="w-4 h-4"
                />
                {emojiPacks.find((p) => p.name === selectedPack)?.label}
              </button>
              {showPackDropdown && (
                <ul className="absolute z-20 top-full mt-2 w-48 bg-gray-800 rounded shadow-lg max-h-60 overflow-y-auto">
                  {emojiPacks.map((pack) => (
                    <li
                      key={pack.name}
                      onClick={() => {
                        setSelectedPack(pack.name);
                        setShowPackDropdown(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer"
                    >
                      <img src={pack.logo} alt="" className="w-4 h-4" />
                      {pack.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search emojis..."
              className="text-sm px-2 py-1 rounded bg-gray-800 text-white w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {(searchTerm
              ? emojiPacks.flatMap((pack) =>
                  pack.emojis
                    .filter((emoji) =>
                      emoji.code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((emoji) => ({
                      ...emoji,
                      packLabel: pack.label,
                    }))
                )
              : (emojiPacks.find((pack) => pack.name === selectedPack)?.emojis || [])
                  .map((emoji) => ({
                    ...emoji,
                    packLabel: emojiPacks.find((p) => p.name === selectedPack)?.label || '',
                  }))
            ).map((emoji) => (
              <img
                key={`${emoji.packLabel}::${emoji.code}`}
                src={emoji.url}
                alt={emoji.code}
                title={`${emoji.packLabel}`}
                className="w-6 h-6 cursor-pointer"
                onClick={() => addEmoji(emoji.code)}
              />
            ))}
          </div>
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => {
          const newValue = e.target.value;
          if (newValue.length <= 390) {
            setMessage(newValue);
          }
        }}
        maxLength={390}
        placeholder="Type your message... (use footy::smile for custom emoji)"
        className="w-full px-4 py-2 rounded-md bg-gray-800 text-white outline-none resize-none overflow-hidden pb-12"
      />
      <button
        onClick={onSubmit}
        className="absolute bottom-2 right-4 h-10 px-4 rounded-md bg-limeGreen text-black font-bold"
      >
        <img src={emojiPacks.find((p) => p.name === selectedPack)?.logo} alt="Send" className="w-6 h-6" />
      </button>
    </div>
  );
};

const ContentLiveChat = () => {
  const [casts, setCasts] = useState<unknown[]>([]);
  const [message, setMessage] = useState("");
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [selectedPack, setSelectedPack] = useState(emojiPacks[0].name);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPackDropdown, setShowPackDropdown] = useState(false);
  const [backgroundLogo, setBackgroundLogo] = useState<string | null>(null);

  const { authenticated, user } = usePrivy();
  
  useEffect(() => {
    const fetchUserTeamLogo = async () => {
      if (user?.farcaster?.fid) {
        const teamIds = await getTeamPreferences(user.farcaster.fid.toString());
        console.log("Team IDs:", teamIds);
        const logo = teamIds?.[0] ? getTeamLogoFromId(teamIds[0]) : null;
        console.log("Background logo:", logo);
        setBackgroundLogo(logo);
      }
    };
    fetchUserTeamLogo();
  }, [user]);

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
      const enriched = await Promise.all(
        (response.data.casts || []).map(async (cast: any) => {
          const teamIds = await getTeamPreferences(cast.author.fid.toString());
          const teamBadgeUrl = teamIds?.[0] ? getTeamLogoFromId(teamIds[0]) : null;
          console.log("FID:", cast.author.fid, "Team IDs:", teamIds, "Badge URL:", teamBadgeUrl);
          return {
            ...cast,
            teamBadgeUrl,
          };
        })
      );
      setCasts(enriched);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Failed to fetch casts", err);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCasts();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

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
      console.log("createCast:", createCast);
      createCast.mutate({
        account: Account.fromEd25519Signer({
          fid: BigInt(fid),
          signer,
        }),
        cast: {
          text: {
            value: message,
            embeds: [],
            parent_url: "https://warpcast.com/~/channel/football",
          },
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
    setMessage((prev) => {
      const newMessage = prev + `${emojiCode} `;
      return newMessage.length <= 390 ? newMessage : prev;
    });
  };

  console.log("background logo:", backgroundLogo   );
  return (
    <div className="h-[500px] relative p-4 rounded-lg flex flex-col bg-darkPurple/80 bg-no-repeat bg-contain bg-center" >
      <div className="flex-1 overflow-y-auto space-y-3">
       {casts.slice().reverse().map((cast, idx) => (
        <div key={idx} className="flex items-start text-sm text-white space-x-3 transition-all duration-300 ease-out">
            <div className="relative w-6 h-6">
              <img src={cast.author.pfp_url} alt="pfp" className="w-6 h-6 rounded-full" />
              {cast.teamBadgeUrl && (
                <img
                  src={cast.teamBadgeUrl}
                  alt="team badge"
                  className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white"
                />
              )}
            </div>
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
      <div className="mt-4 flex-shrink-0">
        <ChatInput
          message={message}
          setMessage={setMessage}
          onSubmit={postMessage}
          showEmojiPanel={showEmojiPanel}
          setShowEmojiPanel={setShowEmojiPanel}
          selectedPack={selectedPack}
          setSelectedPack={setSelectedPack}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showPackDropdown={showPackDropdown}
          setShowPackDropdown={setShowPackDropdown}
          addEmoji={addEmoji}
        />
      </div>
    </div>
  );
};

export default ContentLiveChat;