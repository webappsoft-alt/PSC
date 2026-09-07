import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const ShortsSkeleton = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  useEffect(() => {
    Animated.loop(
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
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.55],
  });

  const SkeletonBox = ({ width, height, borderRadius = 8, style }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Full-screen dark background ── */}
      <View style={[styles.bg, { backgroundColor: colors.background }]} />

      {/* ── Top gradient shimmer ── */}
      <View style={styles.topGradient}>
        {/* HomeHeader row */}
        <View style={[styles.headerRow, { marginTop: insets.top }]}>
          {/* Left: back-ish area / logo placeholder */}
          {/* <SkeletonBox width={32} height={32} borderRadius={99} /> */}
          <View style={{ flex: 1 }} />
          {/* Right: camera icon */}
          {/* <SkeletonBox width={32} height={32} borderRadius={99} /> */}
        </View>

        {/* TopTab row (compass + pills) */}
        {/* <View style={styles.tabRow}>
          <SkeletonBox width={40} height={34} borderRadius={8} />
          <SkeletonBox width={90} height={34} borderRadius={8} />
          <SkeletonBox width={72} height={34} borderRadius={8} />
          <SkeletonBox width={64} height={34} borderRadius={8} />
          <SkeletonBox width={80} height={34} borderRadius={8} />
        </View> */}
      </View>

      {/* ── Username row (top-right, absolute ~130 from top) ── */}
      <View style={styles.usernameRow}>
        {/* Linked icon */}
        <SkeletonBox width={16} height={16} borderRadius={4} />
        <SkeletonBox width={80} height={14} borderRadius={4} />
      </View>

      {/* ── Right bottom overlay ── */}
      <View style={[styles.rightOverlay, { bottom: insets.bottom + 100 }]}>
        {/* Share button + count */}
        <SkeletonBox width={40} height={40} borderRadius={99} />
        <SkeletonBox
          width={24}
          height={12}
          borderRadius={4}
          style={styles.countGap}
        />

        {/* Repost button + count */}
        <SkeletonBox
          width={40}
          height={40}
          borderRadius={99}
          style={styles.actionGap}
        />
        <SkeletonBox
          width={24}
          height={12}
          borderRadius={4}
          style={styles.countGap}
        />

        {/* Comment button + count */}
        <SkeletonBox
          width={40}
          height={40}
          borderRadius={99}
          style={styles.actionGap}
        />
        <SkeletonBox
          width={20}
          height={12}
          borderRadius={4}
          style={styles.countGap}
        />

        {/* Like button + count */}
        <SkeletonBox
          width={40}
          height={40}
          borderRadius={99}
          style={styles.actionGap}
        />
        <SkeletonBox
          width={20}
          height={12}
          borderRadius={4}
          style={styles.countGap}
        />
      </View>

      {/* ── Left bottom overlay ── */}
      <View style={[styles.leftOverlay, { bottom: insets.bottom + 100 }]}>
        {/* Description (2 lines) */}
        <SkeletonBox width={SCREEN_WIDTH * 0.55} height={14} borderRadius={4} />
        <View style={{ height: 6 }} />
        <SkeletonBox width={SCREEN_WIDTH * 0.4} height={14} borderRadius={4} />

        {/* Hashtag pills */}
        <View style={styles.hashtagRow}>
          <SkeletonBox width={80} height={24} borderRadius={99} />
          <SkeletonBox
            width={70}
            height={24}
            borderRadius={99}
            style={{ marginLeft: 6 }}
          />
          <SkeletonBox
            width={60}
            height={24}
            borderRadius={99}
            style={{ marginLeft: 6 }}
          />
        </View>

        {/* Creator info row: avatar + name + follow */}
        <View style={styles.creatorRow}>
          <SkeletonBox width={40} height={40} borderRadius={99} />
          <SkeletonBox
            width={100}
            height={16}
            borderRadius={4}
            style={{ marginLeft: 10 }}
          />
          {/* Verified icon */}
          <SkeletonBox
            width={14}
            height={14}
            borderRadius={99}
            style={{ marginLeft: 6 }}
          />
          {/* Follow button */}
          <SkeletonBox
            width={64}
            height={32}
            borderRadius={99}
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>

      {/* ── Bottom gradient shimmer + input bar ── */}
      <View style={[styles.bottomBar, { bottom: insets.bottom }]}>
        {/* Message input */}
        <SkeletonBox
          width="100%"
          height={48}
          borderRadius={99}
          style={{ marginBottom: 8 }}
        />
        {/* Reload icon + scrubber */}
        <View style={styles.scrubberRow}>
          {/* Reload icon */}
          <SkeletonBox width={24} height={24} borderRadius={4} />
          {/* Scrubber track */}
          <SkeletonBox
            width={SCREEN_WIDTH - 16 - 24 - 8 - 32}
            height={4}
            borderRadius={2}
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>
    </View>
  );
};

export default ShortsSkeleton;

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    position: "relative",
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  /* top gradient region */
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 10,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 0,
  },
  /* top-right username row */
  usernameRow: {
    position: "absolute",
    top: 160,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 20,
  },
  /* right action buttons */
  rightOverlay: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    zIndex: 20,
  },
  actionGap: {
    marginTop: 4,
  },
  countGap: {
    marginTop: 4,
    marginBottom: 2,
  },
  /* left creator info */
  leftOverlay: {
    position: "absolute",
    left: 16,
    right: 100,
    zIndex: 20,
  },
  hashtagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  /* bottom input + scrubber */
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 20,
  },
  scrubberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
});
