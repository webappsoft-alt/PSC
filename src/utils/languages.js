/**
 * Language list of Figma Matching/Jobs › "App-language" (8276:9334): name ·
 * native name, with a flag image (FlagImage country code). Shared by the
 * app Language screen, the job offer "LANGUAGE" field, the Job-Detail
 * "Language" rows and the profile languages.
 */
export const LANGUAGES = [
  { code: "sq", name: "Albanian", native: "Shqiptar", flag: "al" },
  { code: "zh", name: "Mandarin Chinese", native: "普通话 (Pǔtōnghuà)", flag: "cn" },
  { code: "en", name: "English (US)", native: "English (US)", flag: "us" },
  { code: "hi", name: "Hindi", native: "हिंदी (Hindī)", flag: "in" },
  { code: "bn", name: "Bengali", native: "বাংলা (Bāṅlā)", flag: "bd" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "pt" },
  { code: "ru", name: "Russian", native: "Русский (Russkiy)", flag: "ru" },
  { code: "ja", name: "Japanese", native: "日本語 (Nihongo)", flag: "jp" },
  { code: "ar", name: "Standard Arabic", native: "العربية (Al-‘Arabīyah)", flag: "sa" },
  { code: "fr", name: "French", native: "Français", flag: "fr" },
  { code: "de", name: "German", native: "Deutsch", flag: "de" },
  { code: "ko", name: "Korean", native: "한국어 (Hanguk-eo)", flag: "kr" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "vn" },
  { code: "te", name: "Telugu", native: "తెలుగు (Telugu)", flag: "in" },
  { code: "mr", name: "Marathi", native: "मराठी (Marāṭhī)", flag: "in" },
  { code: "ta", name: "Tamil", native: "தமிழ் (Tamil)", flag: "in" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "se" },
  { code: "sr", name: "Serbian", native: "Српски (Srpski)", flag: "rs" },
  { code: "it", name: "Italian", native: "Italiano", flag: "it" },
  { code: "hr", name: "Croatian", native: "Hrvatski", flag: "hr" },
  // not in the Figma list, but already offered by the app before
  { code: "es", name: "Spanish", native: "Español", flag: "es" },
  { code: "ur", name: "Urdu", native: "اردو (Urdū)", flag: "pk" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "id" },
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "ke" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "tr" },
];

/** Figma field value: "French (FR)", "English (US)" */
export const languageLabel = (lang) => {
  if (!lang) return "";
  return lang.name.includes("(") ? lang.name : `${lang.name} (${lang.flag.toUpperCase()})`;
};

export const languageOf = (codeOrName) => {
  const v = String(codeOrName || "").toLowerCase();
  if (!v) return null;
  return (
    LANGUAGES.find((l) => l.code === v) ||
    LANGUAGES.find((l) => l.name.toLowerCase() === v || l.name.toLowerCase().startsWith(`${v} `)) ||
    null
  );
};

// Figma "Language Proficiency" sheet
export const LANGUAGE_PROFICIENCIES = [
  "Any",
  "Elementary",
  "Limited Working",
  "Professional Working",
  "Full Professional",
  "Native/Bilingual",
];
