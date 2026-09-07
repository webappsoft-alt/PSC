import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const SkeletonBox = ({ width, height, borderRadius = 8, style, opacity, colors }) => (
  <Animated.View
    style={[
      { width, height, borderRadius, backgroundColor: colors.surfaceAlt, opacity },
      style,
    ]}
  />
);

const ProfileCardSkeleton = () => {
  const { colors } = useTheme();
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

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SkeletonBox width={28} height={28} borderRadius={99} opacity={opacity} colors={colors} />
        <SkeletonBox
          width={160}
          height={20}
          borderRadius={4}
          style={{ marginLeft: 8 }}
          opacity={opacity}
          colors={colors}
        />
      </View>

      <View style={[styles.row, { marginTop: 12 }]}>
        <SkeletonBox width={16} height={16} borderRadius={99} opacity={opacity} colors={colors} />
        <SkeletonBox
          width={100}
          height={14}
          borderRadius={4}
          style={{ marginLeft: 6 }}
          opacity={opacity}
          colors={colors}
        />
        <SkeletonBox
          width={80}
          height={14}
          borderRadius={4}
          style={{ marginLeft: 4 }}
          opacity={opacity}
          colors={colors}
        />
      </View>

      <View style={[styles.row, { marginTop: 8 }]}>
        <SkeletonBox width={16} height={16} borderRadius={99} opacity={opacity} colors={colors} />
        <SkeletonBox
          width={60}
          height={14}
          borderRadius={4}
          style={{ marginLeft: 6 }}
          opacity={opacity}
          colors={colors}
        />
        <SkeletonBox
          width={40}
          height={14}
          borderRadius={4}
          style={{ marginLeft: 4 }}
          opacity={opacity}
          colors={colors}
        />
        <SkeletonBox
          width={80}
          height={14}
          borderRadius={4}
          style={{ marginLeft: 4 }}
          opacity={opacity}
          colors={colors}
        />
      </View>

      <View style={[styles.row, { marginTop: 8 }]}>
        <SkeletonBox width={16} height={16} borderRadius={99} opacity={opacity} colors={colors} />
        <SkeletonBox
          width={120}
          height={14}
          borderRadius={4}
          style={{ marginLeft: 6 }}
          opacity={opacity}
          colors={colors}
        />
      </View>

      <View style={[styles.row, { marginTop: 12 }]}>
        <SkeletonBox width={50} height={14} borderRadius={4} opacity={opacity} colors={colors} />
        <SkeletonBox
          width={60}
          height={14}
          borderRadius={4}
          style={{ marginLeft: 8 }}
          opacity={opacity}
          colors={colors}
        />
      </View>

      <View style={[styles.row, { marginTop: 12 }]}>
        <SkeletonBox
          width={70}
          height={26}
          borderRadius={6}
          opacity={opacity}
          colors={colors}
        />
        <SkeletonBox
          width={90}
          height={26}
          borderRadius={6}
          style={{ marginLeft: 6 }}
          opacity={opacity}
          colors={colors}
        />
        <SkeletonBox
          width={60}
          height={26}
          borderRadius={6}
          style={{ marginLeft: 6 }}
          opacity={opacity}
          colors={colors}
        />
      </View>

      <SkeletonBox
        width={"80%"}
        height={14}
        borderRadius={4}
        style={{ marginTop: 12 }}
        opacity={opacity}
        colors={colors}
      />

      <SkeletonBox
        width="49%"
        height={40}
        borderRadius={8}
        style={{ marginTop: 16 }}
        opacity={opacity}
        colors={colors}
      />
    </View>
  );
};

export default ProfileCardSkeleton;

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
