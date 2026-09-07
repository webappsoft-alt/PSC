import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";

const PostCardSkeleton = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <SkeletonBox width={44} height={44} borderRadius={99} />
          <View style={styles.userInfo}>
            <SkeletonBox width={120} height={16} borderRadius={4} />
            <View style={{ height: 4 }} />
            <SkeletonBox width={80} height={12} borderRadius={4} />
          </View>
        </View>
        <SkeletonBox width={70} height={32} borderRadius={8} />
      </View>

      {/* Hashtags */}
      <View style={styles.hashtagsRow}>
        <SkeletonBox width={80} height={24} borderRadius={99} />
        <SkeletonBox width={100} height={24} borderRadius={99} />
        <SkeletonBox width={70} height={24} borderRadius={99} />
      </View>

      {/* Investment Card */}
      <SkeletonBox
        width={180}
        height={20}
        borderRadius={4}
        style={{ marginHorizontal: 12, marginTop: 8 }}
      />

      {/* Description */}
      <View style={styles.description}>
        <SkeletonBox width={screenWidth - 24} height={14} borderRadius={4} />
        <View style={{ height: 6 }} />
        <SkeletonBox width={screenWidth - 60} height={14} borderRadius={4} />
        <View style={{ height: 6 }} />
        <SkeletonBox width={screenWidth - 100} height={14} borderRadius={4} />
      </View>

      {/* Media Container */}
      <View style={styles.mediaContainer}>
        <SkeletonBox
          width={screenWidth - 24}
          height={screenWidth}
          borderRadius={16}
        />
      </View>

      {/* Pagination Dots */}
      <View style={styles.paginationDots}>
        <SkeletonBox width={30} height={6} borderRadius={99} />
        <SkeletonBox width={6} height={6} borderRadius={99} />
        <SkeletonBox width={6} height={6} borderRadius={99} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <SkeletonBox width={55} height={28} borderRadius={4} />
        <SkeletonBox width={55} height={28} borderRadius={4} />
        <SkeletonBox width={55} height={28} borderRadius={4} />
        <SkeletonBox width={55} height={28} borderRadius={4} />
        <SkeletonBox width={55} height={28} borderRadius={4} />
        <SkeletonBox width={55} height={28} borderRadius={4} />
      </View>

      {/* Footer Info */}
      <View style={styles.footerInfo}>
        <SkeletonBox width={200} height={14} borderRadius={4} />
      </View>
      <View style={styles.footerInfo}>
        <SkeletonBox width={180} height={14} borderRadius={4} />
      </View>
      <View style={styles.footerInfo}>
        <SkeletonBox width={150} height={12} borderRadius={4} />
      </View>
      <View style={styles.footerInfo}>
        <SkeletonBox width={100} height={12} borderRadius={4} />
      </View>
    </View>
  );
};

export default PostCardSkeleton;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: 12,
  },
  hashtagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  description: {
    paddingHorizontal: 12,
    marginBottom: 8,
    marginTop: 6,
  },
  mediaContainer: {
    alignItems: "center",
    marginVertical: 6,
  },
  paginationDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "center",
    marginVertical: 4,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  footerInfo: {
    paddingHorizontal: 12,
    marginTop: 4,
  },
});
