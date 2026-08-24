export type EmojiGroup = { name: string; icon: string; emoji: string[] };

/**
 * A curated set rather than the full Unicode table: enough to cover ordinary
 * conversation, small enough to ship as plain data with no dependency and no
 * image sprites. Rendering is left to the system emoji font.
 */
export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    name: "Smileys",
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
    icon: "❤️",
    emoji: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️",
      "💋", "💌", "🌹", "🥀", "💐", "🌷", "💍", "💒", "👩‍❤️‍👨", "🔥",
    ],
  },
  {
    name: "Animals",
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
    icon: "✨",
    emoji: [
      "✨", "⭐", "🌟", "💫", "⚡", "☀️", "🌤️", "⛅", "🌧️", "⛈️",
      "❄️", "🌈", "☔", "💧", "🌊", "🎉", "🎊", "🎁", "🎈", "🏳️",
      "✅", "❌", "❓", "❗", "💯", "🔔", "🔒", "🔑", "💡", "📌",
      "📎", "✂️", "📷", "🎥", "📱", "💻", "⌚", "💰", "🧿", "☮️",
    ],
  },
];

/** Every emoji in one list, for search. */
export const ALL_EMOJI = EMOJI_GROUPS.flatMap((group) => group.emoji);

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
