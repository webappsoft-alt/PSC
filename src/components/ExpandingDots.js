import { memo } from "react";
import { Animated, StyleSheet, View } from "react-native";

/**
 * Expanding pagination dots (the client's reference:
 * react-native-animated-pagination-dots › ExpandingDot). Driven by the
 * carousel's scroll position, so while you swipe the current dot shrinks and
 * the next one stretches continuously — no jump when the page settles.
 *
 * scrollX: Animated.Value fed by the ScrollView's contentOffset.x
 * pageWidth: distance between two pages (the snap interval)
 */
const ExpandingDots = ({
  scrollX,
  count,
  pageWidth,
  dotSize = 6,
  activeWidth = 30,
  gap = 4,
  inactiveColor,
  activeColor = "#A19375",
  // reference lib default: inactive dots keep the colour at 40% opacity
  inactiveOpacity = 0.4,
  style,
}) => {
  if (!scrollX || !pageWidth || count < 2) return null;
  return (
    <View pointerEvents="none" style={[styles.row, { gap }, style]}>
      {Array.from({ length: count }).map((_, i) => {
        const inputRange = [(i - 1) * pageWidth, i * pageWidth, (i + 1) * pageWidth];
        const width = scrollX.interpolate({
          inputRange,
          outputRange: [dotSize, activeWidth, dotSize],
          extrapolate: "clamp",
        });
        const inactive = inactiveColor || activeColor;
        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: [inactive, activeColor, inactive],
          extrapolate: "clamp",
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [inactiveOpacity, 1, inactiveOpacity],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={i}
            style={{
              width,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor,
              opacity,
            }}
          />
        );
      })}
    </View>
  );
};

export default memo(ExpandingDots);

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
});
