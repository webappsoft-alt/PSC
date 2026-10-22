import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * Dashed rounded-rect border whose dashes travel around the perimeter
 * (ported from Viral's components/AnimatedDashedBorder.tsx). Drop it inside a
 * container; it measures itself and overlays the container's bounds.
 *
 * The dash length is fitted to the measured perimeter so the pattern tiles a
 * whole number of times — the loop and the corners never show a seam.
 */
export default function AnimatedDashedBorder({
  color,
  borderRadius = 0,
  strokeWidth = 1,
  dashLength = 8,
  gapLength = 8,
  speed = 7,
  direction = "clockwise",
  style,
}) {
  const [size, setSize] = useState(null);
  const offset = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev &&
      Math.abs(prev.width - width) < 0.5 &&
      Math.abs(prev.height - height) < 0.5
        ? prev
        : { width, height },
    );
  }, []);

  const geometry = useMemo(() => {
    if (!size || size.width <= strokeWidth || size.height <= strokeWidth) {
      return null;
    }
    // Stroke straddles the path: inset by half so it stays inside the box.
    const inset = strokeWidth / 2;
    const w = size.width - strokeWidth;
    const h = size.height - strokeWidth;
    const r = Math.max(0, Math.min(borderRadius - inset, Math.min(w, h) / 2));
    const perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
    if (perimeter <= 0) return null;

    const preferred = dashLength + gapLength;
    const repeats = Math.max(1, Math.round(perimeter / preferred));
    const period = perimeter / repeats;
    const dash = period * (dashLength / preferred);

    return {
      inset,
      w,
      h,
      r,
      period,
      dash,
      gap: period - dash,
      duration: Math.max(200, (period / Math.max(1, speed)) * 1000),
    };
  }, [size, strokeWidth, borderRadius, dashLength, gapLength, speed]);

  useEffect(() => {
    offset.value = 0;
    if (!geometry || reducedMotion) return undefined;
    const target =
      direction === "clockwise" ? -geometry.period : geometry.period;
    offset.value = withRepeat(
      withTiming(target, { duration: geometry.duration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(offset);
  }, [geometry, direction, reducedMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFillObject, style]}
    >
      {geometry && size ? (
        <Svg width={size.width} height={size.height}>
          <AnimatedRect
            x={geometry.inset}
            y={geometry.inset}
            width={geometry.w}
            height={geometry.h}
            rx={geometry.r}
            ry={geometry.r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${geometry.dash} ${geometry.gap}`}
            strokeLinecap="butt"
            animatedProps={animatedProps}
          />
        </Svg>
      ) : null}
    </View>
  );
}
