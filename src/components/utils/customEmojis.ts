export interface EmojiPack {
  name: string;
  label: string;
  logo: string;
  emojis: {
    code: string; // e.g. "footy::goal"
    url: string;
  }[];
}

export const emojiPacks: EmojiPack[] = [
  {
    name: "footy",
    label: "Footy",
    logo: "/defifa_spinner.gif",
    emojis: [
      { code: "footy::goal", url: "/assets/banny_goal.png" },
      { code: "footy::wow", url: "/assets/banny_wow.png" },
      { code: "footy::popcorn", url: "/assets/banny_popcorn.png" },
      { code: "footy::lfg", url: "/assets/banny_lfg.png" },
      { code: "footy::redcard", url: "/assets/banny_redcard.png" },
      { code: "footy::scores", url: "/assets/banny_scores.gif" },
    ],
  },
  {
    name: "arsenal",
    label: "Arsenal",
    logo: "/assets/logos/ars.png",
    emojis: [
      { code: "ars::boom", url: "/assets/banny_stoned.png" },
      { code: "footy::redcard", url: "/assets/banny_redcard.png" },
    ],
  },
  {
    name: "chelsea",
    label: "Chelsea",
    logo: "/assets/logos/che.png",
    emojis: [
      { code: "chelsea::boom", url: "/assets/chelsea_boom.png" },
      { code: "footy::redcard", url: "/assets/banny_redcard.png" },
    ],
  },
  {
    name: "liverpool",
    label: "Liverpool",
    logo: "/assets/logos/liv.png",
    emojis: [
      { code: "lfc::boom", url: "/assets/lfc_boom.png" },
      { code: "footy::redcard", url: "/assets/banny_redcard.png" },
    ],
  },
];

// Optional helper if you still need flat lookup by code
export const customEmojis = Object.fromEntries(
  emojiPacks.flatMap(pack => pack.emojis.map(e => [e.code, e.url]))
);