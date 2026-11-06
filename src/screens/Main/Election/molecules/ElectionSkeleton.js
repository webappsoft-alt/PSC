import { Animated, StyleSheet, View } from "react-native";
import { EL } from "./electionLayout";

/**
 * Loading state of the election page — the app's pulsing skeleton blocks
 * (as ShowDetailSkeleton) in this page's layout: hero, info, SI Summary,
 * map / territory card, candidate rows.
 */
const Box = ({ opacity, style }) => (
  <Animated.View style={[{ backgroundColor: EL.white04, opacity }, style]} />
);

/** `variant="topic"`: the topic hub — 5 tabs, key points + 2×2 facts instead of the map */
const ElectionSkeleton = ({ opacity, heroHeight, isDepartement, variant }) => (
  <View style={styles.page}>
    <View style={[styles.block, { height: heroHeight, justifyContent: "flex-end", padding: 12, paddingBottom: 8, overflow: "hidden" }]}>
      <View style={styles.row}>
        {(variant === "topic" ? [94, 79, 72, 84, 94] : [90, 118, 107]).map((w, i) => (
          <Box key={i} opacity={opacity} style={{ width: w, height: 32, borderRadius: 100 }} />
        ))}
      </View>
    </View>
    {!isDepartement ? (
      <View style={[styles.block, { paddingTop: 16, gap: 16 }]}>
        <Box opacity={opacity} style={{ height: 32, borderRadius: 8 }} />
        <Box opacity={opacity} style={{ width: 260, height: 20, borderRadius: 4 }} />
        <View style={styles.row}>
          {[36, 64, 97, 86].map((w) => (
            <Box key={w} opacity={opacity} style={{ width: w, height: 28, borderRadius: 100 }} />
          ))}
        </View>
      </View>
    ) : null}
    <View style={[styles.block, { gap: 12 }]}>
      <Box opacity={opacity} style={{ width: 140, height: 18, borderRadius: 4 }} />
      {[351, 320, 340, 200].map((w, i) => (
        <Box key={i} opacity={opacity} style={{ maxWidth: w, height: 12, borderRadius: 4 }} />
      ))}
    </View>
    {variant === "topic" ? (
      <>
        <View style={[styles.block, { gap: 12 }]}>
          <Box opacity={opacity} style={{ width: 80, height: 14, borderRadius: 4 }} />
          {[300, 260].map((w) => (
            <Box key={w} opacity={opacity} style={{ maxWidth: w, height: 12, borderRadius: 4 }} />
          ))}
        </View>
        <View style={[styles.block, { gap: 8 }]}>
          {[0, 1].map((r) => (
            <View key={r} style={[styles.row, { gap: 8 }]}>
              <Box opacity={opacity} style={{ flex: 1, height: 42, borderRadius: 8 }} />
              <Box opacity={opacity} style={{ flex: 1, height: 42, borderRadius: 8 }} />
            </View>
          ))}
        </View>
      </>
    ) : (
      <View style={[styles.block, { gap: 12 }]}>
        <Box opacity={opacity} style={{ width: 160, height: 18, borderRadius: 4 }} />
        <Box opacity={opacity} style={{ height: isDepartement ? 351 : 344 }} />
      </View>
    )}
    <View style={[styles.block, { gap: 6 }]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} opacity={opacity} style={{ height: 40, borderRadius: 12 }} />
      ))}
    </View>
  </View>
);

export default ElectionSkeleton;

const styles = StyleSheet.create({
  page: { gap: 1, backgroundColor: EL.page },
  block: { padding: 12, backgroundColor: EL.section },
  row: { flexDirection: "row", gap: 4 },
});
