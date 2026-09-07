import MaskedView from "@react-native-masked-view/masked-view";
import LinearGradient from "react-native-linear-gradient";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "@react-native-community/blur";
import { getPalette } from "@somesoap/react-native-image-palette";
import React from "react";
import { isColorDark } from "../utils/constants";

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

  const { colors, locations } = getEasedGradient(direction);

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

  return (
    <View
      pointerEvents={pointerEvents}
      style={[styles.container, size, { borderRadius, marginTop }, style]}
    >
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={colors}
            locations={locations}
            start={getGradientStart(direction)}
            end={getGradientEnd(direction)}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView
          blurAmount={blurAmount}
          blurType={blurType}
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>
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
  childrenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
