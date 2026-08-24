export type EmojiGroup = {
  name: string;
  icon: string;
  /** Words people type when looking for this group. */
  keywords: string[];
  emoji: string[];
};

/**
 * A curated set rather than the full Unicode table: enough to cover ordinary
 * conversation, small enough to ship as plain data with no dependency and no
 * image sprites. Rendering is left to the system emoji font.
 */
export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    name: "Smileys",
    keywords: ["face", "smile", "happy", "sad", "cry", "laugh", "angry", "emotion"],
    icon: "🙂",
    emoji: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "😋", "😛", "😜", "🤪", "😝", "🤗", "🤭", "🤔", "🤐", "😐",
      "😑", "😶", "😏", "😒", "🙄", "😬", "😌", "😔", "😪", "😴",
      "😷", "🤒", "🥵", "🥶", "😵", "🤯", "🤠", "🥳", "😎", "🤓",
      "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "😦", "😧",
      "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓",
      "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "💀", "🤡",
    ],
  },
  {
    name: "Gestures",
    keywords: ["hand", "thumb", "wave", "clap", "point", "finger", "body"],
    icon: "👋",
    emoji: [
      "👋", "🤚", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟",
      "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎", "✊",
      "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪",
      "🦾", "👀", "👁️", "🧠", "🫀", "👂", "👃", "👄", "🦷",
    ],
  },
  {
    name: "Hearts",
    keywords: ["heart", "love", "kiss", "romance", "flower", "rose"],
    icon: "❤️",
    emoji: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️",
      "💋", "💌", "🌹", "🥀", "💐", "🌷", "💍", "💒", "👩‍❤️‍👨", "🔥",
    ],
  },
  {
    name: "Animals",
    keywords: ["animal", "pet", "dog", "cat", "bird", "fish", "nature"],
    icon: "🐶",
    emoji: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦉",
      "🦄", "🐝", "🦋", "🐌", "🐞", "🐢", "🐍", "🐙", "🦀", "🐳",
      "🐬", "🐟", "🦈", "🐊", "🐘", "🦒", "🦓", "🐎", "🦌", "🐐",
    ],
  },
  {
    name: "Food",
    keywords: ["food", "eat", "drink", "fruit", "coffee", "beer", "meal"],
    icon: "🍕",
    emoji: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
      "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🍆", "🥕",
      "🌽", "🌶️", "🥒", "🥬", "🧄", "🧅", "🍄", "🥔", "🍞", "🥐",
      "🥨", "🧀", "🥚", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮",
      "🍜", "🍝", "🍣", "🍰", "🎂", "🍫", "🍬", "🍿", "☕", "🍺",
      "🍻", "🥂", "🍷", "🥃", "🍸", "🧉", "🥤", "🧊",
    ],
  },
  {
    name: "Travel",
    keywords: ["travel", "car", "plane", "train", "holiday", "place", "boat"],
    icon: "✈️",
    emoji: [
      "🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒", "🚲", "🛴",
      "🏍️", "🚂", "✈️", "🚀", "🛸", "🚁", "⛵", "🚤", "🛳️", "⚓",
      "🏔️", "⛰️", "🌋", "🏕️", "🏖️", "🏝️", "🏞️", "🌅", "🌄", "🌆",
      "🌉", "🗼", "🏰", "⛺", "🧭", "🗺️", "🎡", "🎢", "🎪",
    ],
  },
  {
    name: "Activity",
    keywords: ["sport", "game", "music", "ball", "hobby", "activity"],
    icon: "⚽",
    emoji: [
      "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸",
      "🥅", "⛳", "🏹", "🎣", "🥊", "🥋", "⛸️", "🎿", "⛷️", "🏂",
      "🏋️", "🤸", "🤺", "🤼", "🏊", "🚴", "🧗", "🧘", "🏆", "🥇",
      "🎯", "🎮", "🎲", "🎸", "🎹", "🥁", "🎺", "🎧", "🎬", "🎨",
    ],
  },
  {
    name: "Symbols",
    keywords: ["symbol", "weather", "star", "sun", "party", "sign"],
    icon: "✨",
    emoji: [
      "✨", "⭐", "🌟", "💫", "⚡", "☀️", "🌤️", "⛅", "🌧️", "⛈️",
      "❄️", "🌈", "☔", "💧", "🌊", "🎉", "🎊", "🎁", "🎈", "🏳️",
      "✅", "❌", "❓", "❗", "💯", "🔔", "🔒", "🔑", "💡", "📌",
      "📎", "✂️", "📷", "🎥", "📱", "💻", "⌚", "💰", "🧿", "☮️",
    ],
  },
];

/** Every emoji in one list. */
export const ALL_EMOJI = EMOJI_GROUPS.flatMap((group) => group.emoji);

/**
 * Emoji matching a typed query.
 *
 * The search used to compare typed letters against the emoji characters
 * themselves, so it never matched anything. Names and keywords are what people
 * actually type.
 */
export function searchEmoji(query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const groups = EMOJI_GROUPS.filter(
    (group) =>
      group.name.toLowerCase().includes(needle) ||
      group.keywords.some((word) => word.includes(needle) || needle.includes(word)),
  );

  // Pasting an emoji should find it too.
  const literal = ALL_EMOJI.filter((emoji) => emoji.includes(query.trim()));

  return [...new Set([...groups.flatMap((group) => group.emoji), ...literal])];
}

/** Split text into grapheme clusters so multi-codepoint emoji count as one. */
function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

const EMOJI_ONLY = /^[\p{Extended_Pictographic}\p{Emoji_Component}️‍]+$/u;

/**
 * True when a message is nothing but a few emoji, which chat apps render large
 * and without a bubble. Capped so a wall of emoji stays normal size.
 */
export function isEmojiOnly(text: string, max = 3): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const parts = graphemes(trimmed).filter((part) => part.trim().length > 0);
  if (parts.length === 0 || parts.length > max) return false;

  return parts.every((part) => EMOJI_ONLY.test(part));
}

/** The quick reactions offered on a long-press / hover, as in most chat apps. */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;
