import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const CommentSkeleton = () => {
  const { colors, isDark } = useTheme();
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
  }, []);

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
    <View style={styles.container}>
      <View style={styles.userRow}>
        <View style={styles.leftSection}>
          <SkeletonBox width={32} height={32} borderRadius={16} />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <SkeletonBox width={80} height={14} borderRadius={4} />
              <SkeletonBox width={60} height={12} borderRadius={4} />
            </View>
            <SkeletonBox
              width={100}
              height={10}
              borderRadius={4}
              style={{ marginTop: 4 }}
            />
          </View>
        </View>
        <SkeletonBox width={60} height={14} borderRadius={4} />
      </View>

      <View style={styles.commentContent}>
        <SkeletonBox width="90%" height={14} borderRadius={4} />
        <SkeletonBox
          width="60%"
          height={14}
          borderRadius={4}
          style={{ marginTop: 6 }}
        />
      </View>

      <View style={styles.actionRow}>
        <SkeletonBox width={40} height={14} borderRadius={4} />
        <View style={styles.statsRow}>
          <SkeletonBox width={50} height={14} borderRadius={4} />
          <SkeletonBox width={50} height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

export default CommentSkeleton;

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentContent: {
    marginTop: 8,
    marginLeft: 40,
  },
  actionRow: {
    marginTop: 8,
    marginLeft: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
});
