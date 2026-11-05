export const INTENTS = [
  "friendship_first",
  "serious_relationship",
  "marriage_after_graduation",
] as const;
export type Intent = (typeof INTENTS)[number];

export const INTENT_LABELS: Record<Intent, { en: string; bn: string; short: string }> = {
  friendship_first: { en: "Friendship first", bn: "বন্ধুত্ব দিয়ে শুরু", short: "Friendship" },
  serious_relationship: { en: "Serious relationship", bn: "গুরুতর সম্পর্ক", short: "Serious" },
  marriage_after_graduation: {
    en: "Marriage after graduation",
    bn: "গ্র্যাজুয়েশনের পর বিয়ে",
    short: "Marriage",
  },
};

export const RELIGIONS = [
  "islam",
  "hinduism",
  "buddhism",
  "christianity",
  "other",
  "prefer_not_to_say",
] as const;

export const RELIGION_LABELS: Record<string, { en: string; bn: string }> = {
  islam: { en: "Islam", bn: "ইসলাম" },
  hinduism: { en: "Hinduism", bn: "হিন্দুধর্ম" },
  buddhism: { en: "Buddhism", bn: "বৌদ্ধধর্ম" },
  christianity: { en: "Christianity", bn: "খ্রিস্টধর্ম" },
  other: { en: "Other", bn: "অন্যান্য" },
  prefer_not_to_say: { en: "Prefer not to say", bn: "বলতে চাই না" },
};

export const INTERESTS: { id: string; en: string; bn: string; emoji: string }[] = [
  { id: "reading", en: "Reading", bn: "বই পড়া", emoji: "📚" },
  { id: "poetry", en: "Poetry", bn: "কবিতা", emoji: "🖋️" },
  { id: "music", en: "Music", bn: "সংগীত", emoji: "🎧" },
  { id: "cricket", en: "Cricket", bn: "ক্রিকেট", emoji: "🏏" },
  { id: "football", en: "Football", bn: "ফুটবল", emoji: "⚽" },
  { id: "debate", en: "Debate", bn: "বিতর্ক", emoji: "🎤" },
  { id: "photography", en: "Photography", bn: "ফটোগ্রাফি", emoji: "📷" },
  { id: "travel", en: "Travel", bn: "ভ্রমণ", emoji: "🧭" },
  { id: "cooking", en: "Cooking", bn: "রান্না", emoji: "🍲" },
  { id: "art", en: "Art & design", bn: "শিল্প ও ডিজাইন", emoji: "🎨" },
  { id: "coding", en: "Coding", bn: "প্রোগ্রামিং", emoji: "💻" },
  { id: "volunteering", en: "Volunteering", bn: "স্বেচ্ছাসেবা", emoji: "🤝" },
  { id: "movies", en: "Films", bn: "সিনেমা", emoji: "🎬" },
  { id: "gaming", en: "Gaming", bn: "গেমিং", emoji: "🎮" },
  { id: "cycling", en: "Cycling", bn: "সাইক্লিং", emoji: "🚲" },
  { id: "gardening", en: "Gardening", bn: "বাগান", emoji: "🌿" },
  { id: "startups", en: "Startups", bn: "স্টার্টআপ", emoji: "🚀" },
  { id: "languages", en: "Languages", bn: "ভাষা শেখা", emoji: "🗣️" },
  { id: "history", en: "History", bn: "ইতিহাস", emoji: "🏛️" },
  { id: "calligraphy", en: "Calligraphy", bn: "ক্যালিগ্রাফি", emoji: "✒️" },
  { id: "badminton", en: "Badminton", bn: "ব্যাডমিন্টন", emoji: "🏸" },
  { id: "tea", en: "Tea & adda", bn: "চা ও আড্ডা", emoji: "☕" },
  { id: "nature", en: "Nature", bn: "প্রকৃতি", emoji: "🌱" },
  { id: "fitness", en: "Fitness", bn: "ফিটনেস", emoji: "🏃" },
];

export const INTEREST_MAP = Object.fromEntries(INTERESTS.map((i) => [i.id, i]));

export const CITIES = [
  { id: "dhaka", en: "Dhaka", bn: "ঢাকা" },
  { id: "chattogram", en: "Chattogram", bn: "চট্টগ্রাম" },
  { id: "sylhet", en: "Sylhet", bn: "সিলেট" },
  { id: "rajshahi", en: "Rajshahi", bn: "রাজশাহী" },
  { id: "khulna", en: "Khulna", bn: "খুলনা" },
  { id: "barishal", en: "Barishal", bn: "বরিশাল" },
  { id: "rangpur", en: "Rangpur", bn: "রংপুর" },
  { id: "mymensingh", en: "Mymensingh", bn: "ময়মনসিংহ" },
];

export const CITY_LABELS: Record<string, { en: string; bn: string }> = Object.fromEntries(
  CITIES.map((c) => [c.id, { en: c.en, bn: c.bn }])
);

export const STUDY_ABROAD_LABELS: Record<string, { en: string; bn: string }> = {
  yes: { en: "Planning to study abroad", bn: "বিদেশে পড়ার পরিকল্পনা" },
  maybe: { en: "Maybe study abroad", bn: "বিদেশে পড়া নিয়ে অনিশ্চিত" },
  no: { en: "Staying in Bangladesh", bn: "বাংলাদেশেই থাকব" },
  unsure: { en: "Not decided yet", bn: "এখনো ঠিক করিনি" },
};

export const RELOCATION_LABELS: Record<string, { en: string; bn: string }> = {
  stay_bd: { en: "Prefers to stay in Bangladesh", bn: "বাংলাদেশে থাকতে চান" },
  open: { en: "Open to relocating", bn: "প্রয়োজনে দেশের বাইরে যেতে রাজি" },
  must_relocate: { en: "Plans to relocate abroad", bn: "বিদেশে থাকার পরিকল্পনা" },
};

export const HABIT_LABELS: Record<string, { en: string; bn: string }> = {
  never: { en: "Never", bn: "কখনো না" },
  sometimes: { en: "Sometimes", bn: "মাঝে মাঝে" },
  regularly: { en: "Regularly", bn: "নিয়মিত" },
  prefer_not_to_say: { en: "Prefer not to say", bn: "বলতে চাই না" },
};

export const DEALBREAKERS = [
  { id: "smoking", en: "Smoking", bn: "ধূমপান" },
  { id: "drinking", en: "Drinking", bn: "মদ্যপান" },
  { id: "religion", en: "Different religion", bn: "ভিন্ন ধর্ম" },
  { id: "relocation", en: "Won't relocate", bn: "স্থান পরিবর্তন নয়" },
  { id: "study_abroad", en: "Plans to go abroad", bn: "বিদেশে যাওয়ার পরিকল্পনা" },
  { id: "long_distance", en: "Long distance", bn: "দূরসম্পর্ক" },
];

export const REPORT_CATEGORIES = [
  { id: "fake_profile", en: "Fake profile / catfish", bn: "ভুয়া প্রোফাইল", priority: "p2" },
  { id: "harassment", en: "Harassment or threats", bn: "হয়রানি বা হুমকি", priority: "p1" },
  { id: "underage", en: "Appears to be under 18", bn: "১৮ বছরের কম মনে হচ্ছে", priority: "p0" },
  { id: "nudity", en: "Nudity or sexual content", bn: "অশ্লীল বা যৌন কনটেন্ট", priority: "p0" },
  { id: "scam", en: "Scam or money request", bn: "প্রতারণা বা টাকা চাওয়া", priority: "p1" },
  { id: "spam", en: "Spam", bn: "স্প্যাম", priority: "p2" },
  { id: "other", en: "Something else", bn: "অন্য কিছু", priority: "p2" },
];

export const REPORT_PRIORITY_SLA_HOURS: Record<string, number> = { p0: 2, p1: 24, p2: 72 };

export const GENDERS = ["woman", "man"] as const;
export const LOOKING_FOR = ["women", "men", "everyone"] as const;

export const INTEREST_DAILY_LIMIT = 5;
export const DAILY_MATCH_COUNT = 6;
export const MIN_COMPLETENESS = 60;

export const CAMPUS_ADJACENCY: Record<string, string[]> = {
  dhaka: ["dhaka", "gazipur", "narayanganj"],
};
