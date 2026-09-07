import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const ConversationBoxSkeleton = () => {
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
      ])
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
    <View style={styles.card}>
      <SkeletonBox width={40} height={40} borderRadius={100} />
      <View style={styles.textBox}>
        <View style={styles.rowBetween}>
          <SkeletonBox width={120} height={16} borderRadius={4} />
          <SkeletonBox width={50} height={12} borderRadius={4} />
        </View>
        <View style={[styles.rowBetween, { marginTop: 6 }]}>
          <SkeletonBox width={180} height={12} borderRadius={4} />
          <SkeletonBox width={20} height={20} borderRadius={10} />
        </View>
      </View>
    </View>
  );
};

export default ConversationBoxSkeleton;

const createStyles = (colors, isDark) => StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#262626" : colors.border,
    paddingHorizontal: 15,
  },
  textBox: {
    flex: 1,
    marginLeft: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
