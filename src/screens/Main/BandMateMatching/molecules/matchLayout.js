import { BlurView } from "@react-native-community/blur";
import { StyleSheet, View } from "react-native";

/**
 * Figma › Matching › New-Home (375 × 812, 44pt status bar, nav bar 20 from
 * the bottom). Vertical positions are expressed relative to the safe-area
 * top / the nav bar so they hold on every device.
 */
export const HEADER_TOP_GAP = 8; // Header paddingTop 52 − 44 status bar
export const HEADER_PAD_H = 16;
export const HEADER_ROW_HEIGHT = 40;
export const HEADER_PAD_BOTTOM = 12;
export const TOGGLE_HEIGHT = 40;
// Toggle bottom (144) → story bars (156) → title row (168)
export const BARS_GAP = 12;
export const BARS_HEIGHT = 4;
export const TITLES_GAP = 8;
export const TITLES_HEIGHT = 28;
export const CARD_PAD_H = 12; // bars / title row x 12…363
export const INFO_PAD_H = 24; // info column x 24…351 (327 wide)

// Story bars sit right under the toggle: 52 + 40 + 12 + 40 + 12 = 156
export const BARS_TOP_FROM_INSET =
  HEADER_TOP_GAP +
  HEADER_ROW_HEIGHT +
  HEADER_PAD_BOTTOM +
  TOGGLE_HEIGHT +
  BARS_GAP; // 112 → 44 + 112 = 156

// Bottom stack: nav bar top (732) − 14 → action row (654–718) − 24 → info
export const ACTIONS_ABOVE_NAV = 14;
export const ACTIONS_HEIGHT = 64;
export const INFO_ABOVE_ACTIONS = 24;

/**
 * Figma texts use "vertical trim" (cap height → baseline), CustomText draws a
 * 1.4 × fontSize line box. For Poppins (ascender 1.05, descender 0.35, cap
 * height 0.697 em) the box adds 0.353 em above the cap top and 0.35 em below
 * the baseline, so a Figma gap between two trimmed texts becomes:
 */
const ABOVE_CAP = 0.353;
const BELOW_BASELINE = 0.35;
export const capGap = (gap, fontSizeAbove = 0, fontSizeBelow = 0) =>
  gap - fontSizeAbove * BELOW_BASELINE - fontSizeBelow * ABOVE_CAP;

/**
 * Translucent surface. Client rule: opacity = blur — every translucent fill
 * sits on a background blur, automatically (same BlurView as FloatingSheet's
 * glass). `fill` is the Figma fill on top, `blurAmount` the Figma blur.
 */
export const GlassFill = ({
  borderRadius = 100,
  fill = "rgba(255, 255, 255, 0.04)",
  blurAmount = 16,
}) => (
  <View
    pointerEvents="none"
    style={[StyleSheet.absoluteFill, { borderRadius, overflow: "hidden" }]}
  >
    <BlurView
      style={StyleSheet.absoluteFill}
      blurType="dark"
      blurAmount={blurAmount}
      // Android: no extra tint, the Figma fill below is the only colour
      overlayColor="transparent"
      reducedTransparencyFallbackColor="rgba(18, 18, 18, 0.64)"
    />
    <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
  </View>
);
