import { View } from "react-native";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import {
  GlassFill,
  capGap,
} from "../../BandMateMatching/molecules/matchLayout";

/**
 * Figma › Shows (page 2212:4347). Values below are the Figma inspect values;
 * text offsets convert Figma's cap-trimmed text boxes to CustomText's
 * 1.4 × fontSize line box (Poppins: 0.353 em above the cap, 0.35 em below
 * the baseline) — same conversion as the Matching screens.
 */
export { GlassFill, capGap };

export const ABOVE_CAP = 0.353;
export const BELOW_BASELINE = 0.35;
/** pull a text up so its cap top sits on the box top */
export const capTop = (fontSize) => -fontSize * ABOVE_CAP;
/** pull the next box up so it starts at this text's baseline */
export const baseline = (fontSize) => -fontSize * BELOW_BASELINE;
/**
 * Vertical margin that fits a one-line text (1.4 × fontSize line box) into a
 * Figma row of `box` pt. Rows must NOT get a fixed height smaller than the
 * line box instead — iOS measures the text against that height and clips
 * descenders ("Only" → "Onlv").
 */
export const fitLine = (fontSize, box) => (box - fontSize * 1.4) / 2;

export const SHOWS = {
  page: "#262626", // Show-Feed fill, shows as the 1pt section separators
  section: "#121212",
  gold: "#A19375",
  green: "#1D9053",
  greenSoft: "rgba(29, 144, 83, 0.16)",
  white: COLORS.white,
  white64: "rgba(255, 255, 255, 0.64)",
  white48: "rgba(255, 255, 255, 0.48)",
  white08: "rgba(255, 255, 255, 0.08)",
  white16: "rgba(255, 255, 255, 0.16)",
  white04: "rgba(255, 255, 255, 0.04)",
  dark64: "rgba(18, 18, 18, 0.64)",
  purple: "#750C73",
  blue: "#007BFF",
  red: "#EE1045",
};

// Show-Feed: sections 375 wide, pad 12 / 12 / 16 / 12, gap 16, 1pt apart
export const SECTION_PAD_H = 12;
export const SECTION_PAD_TOP = 12;
export const SECTION_PAD_BOTTOM = 16;
export const SECTION_GAP = 16;
export const SECTION_SEPARATOR = 1;

/** "648488" → "648,488" (no Intl on older Hermes) */
export const formatCount = (n = 0) =>
  String(Math.max(0, Math.round(Number(n) || 0))).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );

/**
 * Material Symbols icon locked to a `size` × `size` box.
 * The font's line box is 1.2 em (ascent 1056 / descent 96 on a 960 em), so
 * a bare <Icons> is 1.2 × size tall; inside a row shorter than that iOS
 * measures it against the row and draws the glyph ~0.1 em low (e.g. the
 * stars next to the rating numbers). Here the text is positioned so its em
 * box is exactly the box, wherever it sits.
 */
export const Glyph = ({ size = 24, style, ...props }) => (
  <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
    <Icons
      size={size}
      {...props}
      style={{
        position: "absolute",
        left: 0,
        top: -0.1 * size,
        width: size,
        height: 1.2 * size,
        lineHeight: 1.2 * size,
        textAlign: "center",
      }}
    />
  </View>
);
