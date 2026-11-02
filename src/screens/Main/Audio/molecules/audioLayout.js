import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  GlassFill,
  Glyph,
  baseline,
  capGap,
  fitLine,
} from "../../TvShow/molecules/showsLayout";

/**
 * Figma › Social Feed › "AUDIO POST" section (Radio-Detail 5095:1636,
 * Audio-Post-Detail 7624:1206, record states 7593:3302 / 3533 / 3642).
 * Values are Figma inspect values. Texts use Figma's cap-trimmed boxes, so
 * one-line texts sit in their Figma row with `fitLine(size, box)` and gaps
 * between trimmed texts go through `capGap` (same conversion as Shows).
 */
export { GlassFill, Glyph, baseline, capGap, fitLine };

export const MS = "MaterialSymbolsRounded";
export const MSF = "MaterialSymbolsRoundedFilled";

export const AUDIO = {
  black: "#000000",
  dark: "#121212",
  surface: "#262626",
  tile: "rgba(18, 18, 18, 0.48)", // backdrop grid tiles
  gradTop: "#0F2029", // detail / recorder gradient top
  white: "#FFFFFF",
  share: "#F8F9FB",
  white01: "rgba(255, 255, 255, 0.01)",
  white04: "rgba(255, 255, 255, 0.04)",
  white16: "rgba(255, 255, 255, 0.16)",
  white48: "rgba(255, 255, 255, 0.48)",
  white64: "rgba(255, 255, 255, 0.64)",
  dark64: "rgba(18, 18, 18, 0.64)",
  blue: "#007BFF",
  red: "#EE1045",
  gold: "#A19375",
  gold16: "rgba(161, 147, 117, 0.16)",
};

/**
 * Figma 24pt texts use a 125% line height (30). RN clips the 3.6 overflow of
 * the 33.6 Poppins line from the top only (measured on device), so the cap
 * top sits 4.87 below the box top and the box ends 8.4 below the baseline.
 */
export const TITLE_LINE = 30;
export const TITLE_CAP_TOP = -(24 * 0.353 - (24 * 1.4 - TITLE_LINE)); // −4.87
export const TITLE_BASELINE = -(24 * 0.35); // −8.4

// Poppins letter-spacing: Figma % of the font size
export const ls = (fontSize, percent) => (fontSize * percent) / 100;

/** 1234 ms → "0:01"; 474000 → "7:54" */
export const formatClock = (ms = 0) => {
  const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/** 12300 → "12.3K", 1500000 → "1.5M" */
export const formatCompact = (n = 0) => {
  const v = Math.max(0, Number(n) || 0);
  const fmt = (x, suffix) =>
    `${(Math.round(x * 10) / 10).toString().replace(/\.0$/, "")}${suffix}`;
  if (v >= 1e6) return fmt(v / 1e6, "M");
  if (v >= 1e3) return fmt(v / 1e3, "K");
  return String(Math.round(v));
};

export const getDisplayName = (user) =>
  user?.profile?.displayName ||
  user?.displayName ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.username ||
  "";

/** Figma "OpenAI_logo_2025_(symbol)" 12 × 12 (brand mark, no Material glyph) */
const OPENAI_PATH =
  "M 6.9 12 C 6.5 12 6.13 11.92 5.77 11.77 C 5.41 11.62 5.09 11.41 4.82 11.14 C 4.51 11.24 4.2 11.29 3.88 11.29 C 3.36 11.3 2.85 11.16 2.4 10.9 C 1.95 10.63 1.58 10.26 1.31 9.82 C 1.04 9.36 0.9 8.83 0.9 8.29 C 0.9 8.06 0.94 7.81 1 7.54 C 0.69 7.25 0.44 6.9 0.26 6.52 C 0.09 6.13 0 5.71 0 5.28 C 0 4.85 0.1 4.43 0.27 4.04 C 0.45 3.65 0.71 3.3 1.04 3.01 C 1.37 2.72 1.76 2.51 2.19 2.4 C 2.27 1.95 2.46 1.53 2.74 1.18 C 3.02 0.81 3.37 0.52 3.78 0.31 C 4.19 0.1 4.64 0 5.1 0 C 5.5 0 5.88 0.08 6.23 0.23 C 6.59 0.38 6.91 0.59 7.18 0.86 C 7.49 0.76 7.8 0.71 8.12 0.71 C 8.65 0.71 9.15 0.84 9.6 1.1 C 10.04 1.36 10.42 1.74 10.68 2.18 C 10.96 2.64 11.1 3.15 11.1 3.71 C 11.1 3.94 11.06 4.19 11 4.46 C 11.32 4.76 11.56 5.1 11.74 5.5 C 11.91 5.88 12 6.28 12 6.71 C 12 7.14 11.91 7.56 11.73 7.96 C 11.54 8.36 11.28 8.71 10.95 9 C 10.63 9.29 10.23 9.49 9.81 9.6 C 9.73 10.05 9.54 10.47 9.25 10.82 C 8.98 11.19 8.62 11.48 8.22 11.69 C 7.81 11.9 7.36 12 6.9 12 M 3.96 10.5 C 4.36 10.5 4.7 10.42 4.99 10.25 L 7.23 8.95 C 7.27 8.93 7.3 8.89 7.32 8.85 C 7.34 8.81 7.35 8.77 7.35 8.72 L 7.35 7.69 L 4.47 9.36 C 4.39 9.41 4.3 9.44 4.21 9.44 C 4.12 9.44 4.03 9.41 3.95 9.36 L 1.7 8.05 C 1.7 8.08 1.7 8.11 1.69 8.14 L 1.69 8.28 C 1.69 8.69 1.78 9.06 1.97 9.41 C 2.17 9.74 2.45 10.01 2.8 10.2 C 3.15 10.4 3.55 10.51 3.96 10.5 M 4.08 8.54 C 4.12 8.57 4.16 8.58 4.21 8.58 C 4.25 8.58 4.29 8.57 4.33 8.54 L 5.22 8.03 L 2.36 6.35 C 2.27 6.3 2.2 6.23 2.16 6.15 C 2.11 6.07 2.09 5.97 2.09 5.88 L 2.09 3.28 C 1.7 3.45 1.38 3.72 1.14 4.09 C 0.91 4.45 0.78 4.86 0.79 5.29 C 0.79 5.68 0.88 6.06 1.08 6.42 C 1.28 6.78 1.54 7.05 1.86 7.24 L 4.08 8.54 Z M 6.9 11.21 C 7.32 11.21 7.7 11.11 8.04 10.92 C 8.38 10.73 8.66 10.45 8.86 10.11 C 9.05 9.78 9.15 9.39 9.15 9 L 9.15 6.41 C 9.15 6.36 9.14 6.32 9.12 6.28 C 9.1 6.24 9.06 6.21 9.03 6.19 L 8.12 5.66 L 8.12 9.01 C 8.13 9.11 8.1 9.2 8.06 9.28 C 8.01 9.37 7.94 9.43 7.86 9.48 L 5.61 10.79 C 5.99 11.06 6.44 11.21 6.9 11.21 M 7.35 6.82 L 7.35 5.18 L 6.01 4.42 L 4.65 5.18 L 4.65 6.82 L 6.01 7.58 L 7.35 6.82 Z M 3.88 2.99 C 3.87 2.89 3.9 2.8 3.94 2.72 C 3.99 2.63 4.06 2.57 4.14 2.52 L 6.39 1.21 C 6.01 0.94 5.56 0.79 5.1 0.79 C 4.68 0.79 4.3 0.89 3.96 1.08 C 3.63 1.27 3.35 1.54 3.15 1.87 C 2.96 2.22 2.86 2.61 2.87 3 L 2.87 5.58 C 2.87 5.68 2.91 5.75 2.99 5.81 L 3.88 6.34 L 3.88 2.99 Z M 9.92 8.72 C 10.32 8.55 10.63 8.28 10.86 7.91 C 11.1 7.54 11.22 7.14 11.22 6.71 C 11.21 6.31 11.11 5.92 10.92 5.58 C 10.72 5.22 10.46 4.95 10.15 4.76 L 7.92 3.47 C 7.87 3.44 7.83 3.42 7.79 3.43 C 7.75 3.43 7.71 3.44 7.67 3.47 L 6.78 3.97 L 9.66 5.66 C 9.74 5.71 9.81 5.77 9.85 5.86 C 9.9 5.93 9.92 6.03 9.92 6.12 L 9.92 8.72 Z M 7.53 2.63 C 7.61 2.57 7.7 2.54 7.79 2.54 C 7.88 2.54 7.98 2.57 8.05 2.63 L 10.31 3.96 L 10.31 3.74 C 10.31 3.36 10.22 3 10.03 2.65 C 9.85 2.3 9.57 2.01 9.23 1.81 C 8.89 1.6 8.49 1.5 8.04 1.5 C 7.64 1.5 7.3 1.58 7.01 1.75 L 4.77 3.05 C 4.73 3.07 4.7 3.11 4.68 3.15 C 4.66 3.19 4.65 3.23 4.65 3.28 L 4.65 4.31 L 7.53 2.63 Z";

export const OpenAILogo = ({ size = 12, color = AUDIO.white64 }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12">
    <Path d={OPENAI_PATH} fill={color} />
  </Svg>
);

/**
 * A Material glyph drawn at `size` and centred in a Figma icon frame of
 * `frame` pt. Some Figma icons come from the older Material Icons set, whose
 * vectors are a little smaller than the Material Symbols glyph at the frame
 * size — `size` is the glyph size whose ink matches the Figma vector.
 */
export const FrameIcon = ({ frame, size, style, ...props }) => (
  <View
    pointerEvents="none"
    style={[
      { width: frame, height: frame, alignItems: "center", justifyContent: "center" },
      style,
    ]}
  >
    <Glyph size={size} {...props} />
  </View>
);
