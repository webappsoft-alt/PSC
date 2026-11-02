import { StyleSheet, View, useWindowDimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { AUDIO } from "./audioLayout";

/**
 * Figma "Background" + "Frame 2085663880" of every Audio Post / Radio frame:
 * black page · 5 rows of r32 tiles (#121212 48%, 180 tall, 4 apart; rows
 * 2 and 4 = 160 + one 324 tile) starting at (−108.5, −80) · a vertical
 * gradient at 64% opacity on top — #0F2029 → #121212 (radio / recorder) or
 * → the creator's dominant profile-picture colour (Audio-Post-Detail).
 */
const ROWS = [
  [160, 160, 160],
  [160, 324],
  [160, 160, 160],
  [160, 324],
  [160, 160, 160],
];

// Figma frame: 375 × 812. The grid is laid out in those points and scaled
// with the screen, so it reaches the edges on every device like in Figma
// (the right column ends at 379.5, past the 375 edge).
const FIGMA_W = 375;
const FIGMA_H = 812;

const AudioBackdrop = ({ bottomColor = AUDIO.dark }) => {
  const { width, height } = useWindowDimensions();
  const k = Math.max(width / FIGMA_W, height / FIGMA_H);
  return (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[StyleSheet.absoluteFill, { backgroundColor: AUDIO.black }]} />
    <View style={[styles.grid, { left: -108.5 * k, top: -80 * k, gap: 4 * k }]}>
      {ROWS.map((row, r) => (
        <View key={r} style={[styles.row, { gap: 4 * k }]}>
          {row.map((w, i) => (
            <View
              key={i}
              style={[
                styles.tile,
                { width: w * k, height: 180 * k, borderRadius: 32 * k },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
    {/* Opacity lives on a plain View: on Fabric the legacy-interop
        LinearGradient applies a style opacity twice (0.64² ≈ 0.41). */}
    <View style={[StyleSheet.absoluteFill, styles.gradient]}>
      <LinearGradient
        colors={[AUDIO.gradTop, bottomColor || AUDIO.dark]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  </View>
  );
};

export default AudioBackdrop;

const styles = StyleSheet.create({
  grid: { position: "absolute" },
  row: { flexDirection: "row" },
  tile: { backgroundColor: AUDIO.tile },
  gradient: { opacity: 0.64 },
});
