import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../../contexts/ThemeContext";
import { getNavBarClearance } from "../../../../navigation/TabStack";
import {
  ACTIONS_ABOVE_NAV,
  ACTIONS_HEIGHT,
  BARS_HEIGHT,
  BARS_TOP_FROM_INSET,
  CARD_PAD_H,
  INFO_ABOVE_ACTIONS,
  TITLES_GAP,
  TITLES_HEIGHT,
} from "./matchLayout";

// Mirrors the New-Home card (MatchCard) so nothing jumps when it loads
const ACTION_SIZES = [48, 56, 64, 56, 48];

const MatchCardSkeleton = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const Box = ({ width, height, radius = 100, style }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );

  const navClearance = getNavBarClearance(insets.bottom);
  const actionsBottom = navClearance + ACTIONS_ABOVE_NAV;
  const barsTop = insets.top + BARS_TOP_FROM_INSET;

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* story bars */}
      <View style={[styles.barsRow, { top: barsTop }]}>
        {[0, 1, 2].map((i) => (
          <Box key={i} height={BARS_HEIGHT} style={styles.flex} />
        ))}
      </View>

      {/* VERIFIED INDIVIDUAL · score */}
      <View
        style={[
          styles.titlesRow,
          { top: barsTop + BARS_HEIGHT + TITLES_GAP },
        ]}
      >
        <View style={styles.row}>
          <Box width={18} height={18} />
          <Box width={130} height={10} radius={4} style={{ marginLeft: 4 }} />
        </View>
        <Box width={50} height={TITLES_HEIGHT} />
      </View>

      {/* info column (Figma 454…630 on an 812 frame) */}
      <View
        style={[
          styles.info,
          { bottom: actionsBottom + ACTIONS_HEIGHT + INFO_ABOVE_ACTIONS },
        ]}
      >
        <Box width={200} height={31} radius={8} />
        <Box width={130} height={12} radius={4} style={{ marginTop: 12 }} />
        <Box width={190} height={12} radius={4} style={{ marginTop: 12 }} />
        <Box width={142} height={8} radius={4} style={{ marginTop: 12 }} />
        <Box width={300} height={8} radius={4} style={{ marginTop: 12 }} />
        <Box width={180} height={8} radius={4} style={{ marginTop: 9 }} />
        <View style={[styles.row, { marginTop: 12, gap: 4 }]}>
          <Box width={95} height={28} radius={16} />
          <Box width={72} height={28} radius={16} />
          <Box width={60} height={28} radius={16} />
        </View>
      </View>

      {/* action row */}
      <View style={[styles.actionsRow, { bottom: actionsBottom }]}>
        {ACTION_SIZES.map((size, i) => (
          <Box key={i} width={size} height={size} />
        ))}
      </View>
    </View>
  );
};

export default MatchCardSkeleton;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  barsRow: {
    position: "absolute",
    left: CARD_PAD_H,
    right: CARD_PAD_H,
    flexDirection: "row",
    gap: 6,
  },
  titlesRow: {
    position: "absolute",
    left: CARD_PAD_H,
    right: CARD_PAD_H,
    height: TITLES_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  info: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  actionsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ACTIONS_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});
