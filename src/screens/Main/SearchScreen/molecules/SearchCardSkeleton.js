import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { COLORS } from "../../../../utils/COLORS";
import Divider from "../../../../components/Divider";
import { useTheme } from "../../../../contexts/ThemeContext";

const SearchCardSkeleton = ({ isChange }) => {
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
    <View>
      <View style={styles.container}>
        {/* Avatar/Image */}
        <SkeletonBox width={56} height={56} borderRadius={isChange ? 99 : 12} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.row}>
            <SkeletonBox width={120} height={14} borderRadius={4} />
            {isChange && (
              <View style={[styles.row, { marginLeft: 8 }]}>
                <SkeletonBox width={14} height={14} borderRadius={99} />
                <SkeletonBox
                  width={60}
                  height={10}
                  borderRadius={4}
                  style={{ marginLeft: 4 }}
                />
              </View>
            )}
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <SkeletonBox
              width={isChange ? 80 : 60}
              height={12}
              borderRadius={4}
            />
            {isChange && (
              <>
                <View style={styles.dot} />
                <SkeletonBox width={40} height={12} borderRadius={4} />
              </>
            )}
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <SkeletonBox width={100} height={10} borderRadius={4} />
          </View>
        </View>

        {/* Action/Chevron */}
        <View style={styles.rightAction}>
          {isChange ? (
            <View style={styles.row}>
              <SkeletonBox width={22} height={22} borderRadius={99} />
              <SkeletonBox
                width={40}
                height={40}
                borderRadius={99}
                style={{ marginLeft: 8 }}
              />
            </View>
          ) : (
            <SkeletonBox width={20} height={20} borderRadius={4} />
          )}
        </View>
      </View>
      <Divider marginVertical={8} />
    </View>
  );
};

export default SearchCardSkeleton;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    height: 4,
    width: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 99,
    marginHorizontal: 6,
  },
  rightAction: {
    marginLeft: 8,
  },
});
