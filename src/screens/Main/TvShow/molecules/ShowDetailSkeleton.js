import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SHOWS } from "./showsLayout";

/**
 * Loading state for the Show detail page — the same pulsing blocks as the
 * feed skeleton, in the detail layout (hero 375, creator row 52, buy row 53,
 * tabs 48, info, about, one 240-card rail).
 */
const Box = ({ opacity, style }) => (
  <Animated.View style={[{ backgroundColor: SHOWS.white04, opacity }, style]} />
);

const ShowDetailSkeleton = ({ headerHeight = 100 }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={styles.page}>
      {/* hero */}
      <View style={styles.hero} />
      {/* creator row */}
      <View style={[styles.block, styles.creator]}>
        <Box opacity={opacity} style={{ width: 28, height: 28, borderRadius: 14 }} />
        <Box opacity={opacity} style={{ width: 140, height: 11, borderRadius: 4 }} />
        <View style={{ flex: 1 }} />
        <Box opacity={opacity} style={{ width: 40, height: 40, borderRadius: 20 }} />
      </View>
      {/* subscribe / buy */}
      <View style={[styles.block, styles.buy]}>
        <Box opacity={opacity} style={{ flex: 1, height: 37, borderRadius: 100 }} />
        <Box opacity={opacity} style={{ flex: 1, height: 37, borderRadius: 100 }} />
      </View>
      {/* tabs */}
      <View style={[styles.block, styles.tabs]}>
        {[76, 60, 59].map((w, i) => (
          <Box key={i} opacity={opacity} style={{ width: w, height: 28, borderRadius: 100 }} />
        ))}
      </View>
      {/* info */}
      <View style={[styles.block, { padding: 12, gap: 12 }]}>
        <Box opacity={opacity} style={{ width: 200, height: 20, borderRadius: 4 }} />
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Box opacity={opacity} style={{ width: 39, height: 24, borderRadius: 100 }} />
          <Box opacity={opacity} style={{ width: 77, height: 24, borderRadius: 100 }} />
        </View>
        <Box opacity={opacity} style={{ width: 240, height: 17, borderRadius: 4 }} />
        <Box opacity={opacity} style={{ width: 109, height: 24, borderRadius: 100 }} />
      </View>
      {/* about */}
      <View style={[styles.block, { paddingVertical: 16, paddingHorizontal: 12, gap: 12 }]}>
        <Box opacity={opacity} style={{ width: 190, height: 15, borderRadius: 4 }} />
        <Box opacity={opacity} style={{ width: "100%", height: 10, borderRadius: 4 }} />
        <Box opacity={opacity} style={{ width: "100%", height: 10, borderRadius: 4 }} />
        <Box opacity={opacity} style={{ width: "72%", height: 10, borderRadius: 4 }} />
      </View>
      {/* rail */}
      <View style={[styles.block, { padding: 12, gap: 12 }]}>
        <Box opacity={opacity} style={{ width: 155, height: 11, borderRadius: 4 }} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[0, 1].map((i) => (
            <View key={i} style={{ width: 240, gap: 8 }}>
              <Box opacity={opacity} style={{ width: 240, height: 135, borderRadius: 12 }} />
              <Box opacity={opacity} style={{ width: 120, height: 10, borderRadius: 4 }} />
              <Box opacity={opacity} style={{ width: 180, height: 8, borderRadius: 4 }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default ShowDetailSkeleton;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: SHOWS.page,
    gap: 4,
  },
  hero: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: SHOWS.section,
  },
  block: {
    backgroundColor: SHOWS.section,
  },
  creator: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buy: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 6,
  },
  tabs: {
    height: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
