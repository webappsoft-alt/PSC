import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Solid gradient outline (Figma stroke: 1px inside, linear gradient), e.g.
 * the election chip's blue → white → red border. With `spin` the gradient
 * turns around the box (same idea as the app's moving outlines, but a
 * solid line). Drop it as the first child of a container; `fill` is the
 * container's own (opaque) background, drawn inside the line.
 */
export default function GradientBorder({
  colors,
  borderRadius = 0,
  strokeWidth = 1,
  fill = "#1C1C1C",
  spin = true,
  duration = 4000,
  style,
}) {
  const [size, setSize] = useState(null);
  const angle = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!spin || reduced) return undefined;
    angle.value = 0;
    angle.value = withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(angle);
  }, [spin, reduced, duration, angle]);

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

  // the rotating square must cover the box at every angle
  const d = size ? Math.ceil(Math.hypot(size.width, size.height)) + 2 : 0;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { borderRadius, overflow: "hidden" }, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((p) => (p && Math.abs(p.width - width) < 0.5 && Math.abs(p.height - height) < 0.5 ? p : { width, height }));
      }}
    >
      {size ? (
        <Animated.View
          style={[
            { position: "absolute", width: d, height: d, left: (size.width - d) / 2, top: (size.height - d) / 2 },
            spinStyle,
          ]}
        >
          <LinearGradient colors={colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
      <View
        style={{
          position: "absolute",
          top: strokeWidth,
          left: strokeWidth,
          right: strokeWidth,
          bottom: strokeWidth,
          borderRadius: Math.max(0, borderRadius - strokeWidth),
          backgroundColor: fill,
        }}
      />
    </View>
  );
}
