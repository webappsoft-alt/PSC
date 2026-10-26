import { Images } from "../assets/images";
import { COUNTRIES } from "./COUNTRIES";

/**
 * Profile look per subscription (Figma "Profile" / "Profile-Premium" /
 * "Profile-Premium+"):
 *  - regular  → black header (#121212 64% + 32 background blur), gold accent
 *  - premium  → radial #121212 64% → #9AAAC0 header, silver accent
 *  - premium+ → radial #121212 64% → #A19375 header, gold accent
 * Driven by the user's `accountType` (backend enum: user | premium | premiumPlus …).
 */
export const PROFILE_TIERS = {
  regular: {
    key: "regular",
    accent: "161, 147, 117", // #A19375 (Figma "Profile" tabs)
    headerColor: null,
    star: null,
  },
  premium: {
    key: "premium",
    accent: "154, 170, 192", // #9AAAC0
    headerColor: "#9AAAC0",
    star: Images.pscStarPremium,
  },
  premiumPlus: {
    key: "premiumPlus",
    accent: "161, 147, 117", // #A19375
    headerColor: "#A19375",
    star: Images.pscStarPremiumPlus,
  },
};

export const getProfileTier = (user) => {
  const type = String(user?.accountType || "").toLowerCase();
  if (type === "premiumplus") return PROFILE_TIERS.premiumPlus;
  if (type === "premium") return PROFILE_TIERS.premium;
  return PROFILE_TIERS.regular;
};

/** `rgba(accent, a)` helper for the tier accent. */
export const accentA = (tier, a = 1) => `rgba(${tier?.accent || "161, 147, 117"}, ${a})`;

/** Figma counts: 333.1K / 1.5M */
export const formatProfileCount = (value) => {
  const n = Number(value) || 0;
  if (n < 1000) return `${Math.max(n, 0)}`;
  const fmt = (v) => `${Math.round(v * 10) / 10}`.replace(/\.0$/, "");
  if (n < 1000000) return `${fmt(n / 1000)}K`;
  return `${fmt(n / 1000000)}M`;
};

/** "CH" from "CH" | "Switzerland" (location.country is stored either way). */
export const getCountryCode = (country) => {
  if (!country || typeof country !== "string") return null;
  const value = country.trim();
  if (/^[A-Za-z]{2}$/.test(value)) return value.toUpperCase();
  const found = COUNTRIES.find(
    (c) => c?.name?.toLowerCase() === value.toLowerCase(),
  );
  return found?.code || null;
};
