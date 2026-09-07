import { StyleSheet, View, Image, Dimensions } from "react-native";
import React from "react";
import { BlurView } from "@react-native-community/blur";

const { width, height } = Dimensions.get("window");

// How many segments to use for the progressive blur.
// More segments = smoother transition, but slightly more views.
const SEGMENTS = 20;
// Height of each blur region (top and bottom) in points.
const BLUR_REGION_HEIGHT = 150;

const ProgressiveBlur = () => {
  // Calculate intensity for each segment.
  // For the top region: segment 0 (topmost) gets max intensity,
  // segment SEGMENTS-1 (closest to center) gets min intensity.
  const topSegments = Array.from({ length: SEGMENTS }).map((_, index) => {
    // Linear interpolation from maxIntensity at index 0 to 0 at last index.
    const intensity = Math.round(80 * (1 - index / (SEGMENTS - 1)));
    return { intensity, index };
  });

  // Bottom region is similar but the order is reversed (highest intensity at the bottom edge).
  const bottomSegments = Array.from({ length: SEGMENTS }).map((_, index) => {
    const intensity = Math.round(80 * (index / (SEGMENTS - 1)));
    return { intensity, index };
  });

  return (
    <View style={styles.container}>
      {/* Sample image – fills the whole screen */}
      <Image
        source={{ uri: "https://picsum.photos/800/1200?grayscale" }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Top progressive blur region */}
      <View style={[styles.topBlurContainer, { height: BLUR_REGION_HEIGHT }]}>
        {topSegments.map(({ intensity, index }) => (
          <BlurView
            key={`top-${index}`}
            intensity={intensity}
            tint="dark" // Adjust tint as needed (light, dark, default)
            style={[
              styles.blurSegment,
              {
                height: BLUR_REGION_HEIGHT / SEGMENTS,
                top: (index * BLUR_REGION_HEIGHT) / SEGMENTS,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom progressive blur region */}
      <View
        style={[
          styles.bottomBlurContainer,
          { height: BLUR_REGION_HEIGHT, bottom: 0 },
        ]}
      >
        {bottomSegments.map(({ intensity, index }) => (
          <BlurView
            key={`bottom-${index}`}
            intensity={intensity}
            tint="dark"
            style={[
              styles.blurSegment,
              {
                height: BLUR_REGION_HEIGHT / SEGMENTS,
                top: (index * BLUR_REGION_HEIGHT) / SEGMENTS,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default ProgressiveBlur;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  topBlurContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  bottomBlurContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  blurSegment: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
