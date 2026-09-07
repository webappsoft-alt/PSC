import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const NotificationSkeleton = () => {
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
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Avatar Skeleton */}
          <SkeletonBox
            width={38}
            height={38}
            borderRadius={99}
            style={styles.avatarSkeleton}
          />
          {/* Title Skeleton */}
          <SkeletonBox width={"60%"} height={16} borderRadius={4} />
        </View>

        {/* Description Skeleton */}
        <SkeletonBox
          width={"80%"}
          height={14}
          borderRadius={4}
          style={{ marginTop: 8 }}
        />
        {/* Time Skeleton */}
        <SkeletonBox
          width={"30%"}
          height={12}
          borderRadius={4}
          style={{ marginTop: 6 }}
        />
      </View>

      {/* Chevron Skeleton */}
      <SkeletonBox width={20} height={20} borderRadius={10} />
    </View>
  );
};

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      marginBottom: 8,
      // borderWidth: 1,
      borderColor: isDark ? "#FFFFFF0A" : colors.border,
      marginHorizontal: 12,
    },
    avatarSkeleton: {
      marginRight: 8,
    },
  });

export default NotificationSkeleton;
