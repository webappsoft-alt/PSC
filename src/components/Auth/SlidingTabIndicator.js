import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

/**
 * Discord / Instagram style sliding pill. `progress` is a decimal tab index
 * (0, 0.35, 1 ...). Mid-travel the pill stretches; at rest it matches the
 * active slot. The pill never leaves the padded inset.
 *
 * Ported from the Viral app (SlidingTabIndicator.tsx) to PSC (JS) so the
 * auth tab switch animates identically across both apps.
 */
export function SlidingTabIndicator({
  count,
  progress,
  color,
  height,
  top = 0,
  padding = 0,
  gap = 0,
  gapValue,
  chipWidth,
  trackWidth,
  style,
}) {
  const measuredW = useSharedValue(0);
  const trackW = trackWidth ?? measuredW;
  const countSV = useSharedValue(count);
  const padSV = useSharedValue(padding);
  const staticGapSV = useSharedValue(gap);
  const gapSV = gapValue ?? staticGapSV;
  const chipSV = useSharedValue(chipWidth ?? 0);
  const heightSV = useSharedValue(height);

  useEffect(() => {
    countSV.value = count;
    padSV.value = padding;
    staticGapSV.value = gap;
    chipSV.value = chipWidth ?? 0;
    heightSV.value = height;
  }, [
    chipWidth,
    count,
    countSV,
    gap,
    staticGapSV,
    height,
    heightSV,
    padSV,
    padding,
    chipSV,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const n = Math.max(1, countSV.value);
    const pad = padSV.value;
    const inner = Math.max(0, trackW.value - pad * 2);
    const slot = n > 1 ? (inner - gapSV.value * (n - 1)) / n : inner;
    const chip = chipSV.value > 0 ? Math.min(chipSV.value, slot) : slot;
    if (trackW.value <= 0 || chip <= 0) {
      return {
        width: 0,
        height: heightSV.value,
        transform: [{ translateX: 0 }],
      };
    }
    const maxIndex = n - 1;
    const p = Math.min(maxIndex, Math.max(0, progress.value));
    const i0 = Math.min(maxIndex, Math.floor(p));
    const i1 = Math.min(maxIndex, i0 + 1);
    const t = p - i0;
    const x0 = pad + i0 * (slot + gapSV.value) + (slot - chip) / 2;
    const x1 = pad + i1 * (slot + gapSV.value) + (slot - chip) / 2;
    const x = x0 + (x1 - x0) * t;
    const stretch = 4 * t * (1 - t) * chip * 0.42;
    const minX = pad;
    const maxRight = trackW.value - pad;
    let width = chip + stretch;
    let translateX = x - stretch / 2;
    if (translateX < minX) {
      width -= minX - translateX;
      translateX = minX;
    }
    if (translateX + width > maxRight) {
      width = Math.max(0, maxRight - translateX);
    }
    return {
      width,
      height: heightSV.value,
      transform: [{ translateX }],
    };
  });

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      onLayout={(event) => {
        if (!trackWidth) {
          measuredW.value = event.nativeEvent.layout.width;
        }
      }}
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          top,
          height,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            height,
            borderRadius: 999,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    left: 0,
  },
});
