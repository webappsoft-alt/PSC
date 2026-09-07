import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const EventDetailCardSkeleton = ({ borderTopWidth = 4 }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const animatedValue = useRef(new Animated.Value(0)).current;

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
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
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
    <View style={[styles.container, { borderTopWidth }]}>
      {/* Left Date Container */}
      <View style={styles.dateContainer}>
        <SkeletonBox width={36} height={16} borderRadius={4} />
        <SkeletonBox
          width={36}
          height={30}
          borderRadius={4}
          style={{ marginTop: 4 }}
        />
      </View>

      {/* Right Container */}
      <View style={styles.rightContainer}>
        {/* Main Image */}
        <SkeletonBox width="100%" height={170} borderRadius={8} />

        {/* Sub-row: tiny image + button-like blocks */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <SkeletonBox
            width={62}
            height={62}
            borderRadius={8}
            style={{ marginTop: 10 }}
          />

          <View style={styles.btnRow}>
            {/* Remind Me Block */}
            <SkeletonBox width={90} height={50} borderRadius={10} />
            {/* Info Block */}
            <SkeletonBox width={60} height={50} borderRadius={10} />
          </View>
        </View>

        {/* Coming On Text */}
        <SkeletonBox
          width={150}
          height={16}
          borderRadius={4}
          style={{ marginTop: 12 }}
        />

        {/* Event Name */}
        <SkeletonBox
          width="80%"
          height={32}
          borderRadius={4}
          style={{ marginTop: 8 }}
        />

        {/* Guest Expectation */}
        <SkeletonBox
          width="90%"
          height={14}
          borderRadius={4}
          style={{ marginTop: 8 }}
        />

        {/* About Project (2 lines) */}
        <SkeletonBox
          width="100%"
          height={14}
          borderRadius={4}
          style={{ marginTop: 8 }}
        />
        <SkeletonBox
          width="70%"
          height={14}
          borderRadius={4}
          style={{ marginTop: 4 }}
        />

        {/* Tags Row */}
        <View style={styles.tagsRow}>
          <SkeletonBox width={60} height={16} borderRadius={4} />
          <SkeletonBox width={80} height={16} borderRadius={4} />
          <SkeletonBox width={70} height={16} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

export default EventDetailCardSkeleton;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderTopColor: colors.surfaceAlt,
  },
  dateContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: 45,
  },
  rightContainer: {
    flex: 1,
    marginLeft: 10,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },
});
