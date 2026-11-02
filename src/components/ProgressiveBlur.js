import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "@react-native-community/blur";
import { getPalette } from "@somesoap/react-native-image-palette";
import React from "react";
import { isColorDark } from "../utils/constants";

const STRIPS = 8;

export default function ProgressiveBlur({
  intensity = 80,
  direction = "bottom",
  tint = "light",
  height = 120,
  width,
  borderRadius = 10,
  style,
  children,
  imageUri,
  marginTop,
  pointerEvents,
}) {
  const isVertical = direction === "top" || direction === "bottom";
  const size = isVertical ? { height } : { width };


  const [detectedTint, setDetectedTint] = useState(null);

  useEffect(() => {
    if (!imageUri) {
      setDetectedTint(null);
      return;
    }
    getPalette(imageUri)
      .then((palette) => {
        if (palette?.vibrant) {
          setDetectedTint(isColorDark(palette.vibrant) ? "dark" : "light");
        }
      })
      .catch(() => {});
  }, [imageUri]);

  // Map Expo intensity/tint to Community Blur props
  const blurAmount = intensity;
  const blurType = detectedTint || (tint === "default" ? "light" : tint);

  // iOS renders a UIVisualEffectView under a masked parent unblurred, so the
  // progression is built from thin strips laid side by side from the strong
  // edge ("top" = strongest at the top), each with a weaker blur and a lower
  // opacity — no mask, no stacked tints, no hard edge. Capped: beyond ~32
  // the blur only washes the content out.
  const strength = Math.min(blurAmount, 32);
  const layers = Array.from({ length: STRIPS }, (_, i) => {
    const t = i / STRIPS;
    return {
      key: i,
      start: `${t * 100}%`,
      // 1% overlap hides the seams between strips
      size: `${100 / STRIPS + 1}%`,
      radius: Math.max(1, Math.round(strength * (1 - t))),
      opacity: 1 - t,
    };
  });
  const edgeKey =
    direction === "bottom"
      ? "bottom"
      : direction === "left"
        ? "left"
        : direction === "right"
          ? "right"
          : "top";

  return (
    <View
      pointerEvents={pointerEvents}
      style={[styles.container, size, { borderRadius, marginTop }, style]}
    >
      {Platform.OS === "ios" ? (
        // gradient mask on the effect view itself (patched community blur)
        <BlurView
          pointerEvents="none"
          blurAmount={strength}
          blurType={blurType}
          progressiveDirection={edgeKey}
          progressiveStart={0}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        layers.map((layer) => (
          <BlurView
            key={layer.key}
            pointerEvents="none"
            blurAmount={layer.radius}
            blurType={blurType}
            style={[
              styles.layer,
              isVertical
                ? { left: 0, right: 0, height: layer.size }
                : { top: 0, bottom: 0, width: layer.size },
              { [edgeKey]: layer.start, opacity: layer.opacity },
            ]}
          />
        ))
      )}
      {children && <View style={styles.childrenContainer}>{children}</View>}
    </View>
  );
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getEasedGradient(direction) {
  const steps = 20;
  const colors = [];
  const locations = [];

  for (let i = 0; i <= steps; i++) {
    const linearPosition = i / steps;
    const easedValue = easeInOutCubic(linearPosition);

    let opacity;
    switch (direction) {
      case "top":
      case "bottom":
      case "left":
        opacity = 1 - easedValue;
        break;
      case "right":
        opacity = easedValue;
        break;
      default:
        opacity = 1 - easedValue;
    }

    colors.push(`rgba(0, 0, 0, ${opacity})`);
    locations.push(linearPosition);
  }

  return { colors, locations };
}

function getGradientStart(direction) {
  switch (direction) {
    case "top":
      return { x: 0.5, y: 0 };
    case "bottom":
      return { x: 0.5, y: 1 };
    case "left":
      return { x: 0, y: 0.5 };
    case "right":
      return { x: 1, y: 0.5 };
    default:
      return { x: 0.5, y: 1 };
  }
}

function getGradientEnd(direction) {
  switch (direction) {
    case "top":
      return { x: 0.5, y: 1 };
    case "bottom":
      return { x: 0.5, y: 0 };
    case "left":
      return { x: 1, y: 0.5 };
    case "right":
      return { x: 0, y: 0.5 };
    default:
      return { x: 0.5, y: 0 };
  }
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  layer: {
    position: "absolute",
  },
  childrenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
