import { BlurView } from "@react-native-community/blur";
import MaskedView from "@react-native-masked-view/masked-view";
import { memo } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

/**
 * Figma post media — bottom controls frame (367 × 56, pad 16/8/8/8):
 * progressive "Background blur" + "Linear" fill at 16%.
 *
 * The Figma blur keeps the media's own colours (no white/grey wash) and
 * grows stronger towards the bottom edge. A UIBlurEffect always adds a tint,
 * so for images we blur the image itself (Image.blurRadius = pure Gaussian)
 * and reveal it through an eased gradient mask — the same masking idea as
 * Viral's ProgressiveBlur. Videos can't be re-drawn blurred, so they use the
 * thinnest native material through the same mask.
 */
const STEPS = 20;
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
// mask alpha: 0 at the top of the band → 1 at the bottom edge
const MASK_COLORS = [];
const MASK_LOCATIONS = [];
for (let i = 0; i <= STEPS; i += 1) {
  const p = i / STEPS;
  MASK_COLORS.push(`rgba(0, 0, 0, ${easeInOutCubic(p).toFixed(3)})`);
  MASK_LOCATIONS.push(p);
}
// `edge="top"`: the same band mirrored (strongest at the top edge), e.g. the
// Shows "Create An Episode" preview's top frame
const MASK_COLORS_TOP = [...MASK_COLORS].reverse();

export const MEDIA_BLUR_BAND = 56;

const MediaBottomBlur = ({
  uri,
  isVideo = false,
  width,
  mediaHeight,
  height = MEDIA_BLUR_BAND,
  blurRadius = 12,
  borderBottomLeftRadius = 8,
  borderBottomRightRadius = 8,
  edge = "bottom",
  // Figma "Linear" fill colour (#121212 on the Shows preview, black on posts)
  tint = "0, 0, 0",
}) => {
  const top = edge === "top";
  const radii = top
    ? { borderTopLeftRadius: borderBottomLeftRadius, borderTopRightRadius: borderBottomRightRadius }
    : { borderBottomLeftRadius, borderBottomRightRadius };
  const mask = (
    <LinearGradient
      colors={top ? MASK_COLORS_TOP : MASK_COLORS}
      locations={MASK_LOCATIONS}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );

  let blurred = null;
  if (!isVideo && uri) {
    blurred = (
      <MaskedView style={StyleSheet.absoluteFill} maskElement={mask}>
        <Image
          source={{ uri }}
          blurRadius={blurRadius}
          resizeMode="cover"
          style={{
            position: "absolute",
            left: 0,
            top: top ? 0 : -(mediaHeight - height),
            width,
            height: mediaHeight,
          }}
        />
      </MaskedView>
    );
  } else if (isVideo && Platform.OS === "ios") {
    blurred = (
      <MaskedView style={StyleSheet.absoluteFill} maskElement={mask}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="ultraThinMaterialDark"
          blurAmount={10}
        />
      </MaskedView>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.band, top ? styles.bandTop : styles.bandBottom, { height }, radii]}
    >
      {blurred}
      {/* Figma "Linear" fill @16%: clear at the inner edge → dark at the outer */}
      <LinearGradient
        colors={
          top
            ? [`rgba(${tint}, 0.16)`, `rgba(${tint}, 0)`]
            : [`rgba(${tint}, 0)`, `rgba(${tint}, 0.16)`]
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

export default memo(MediaBottomBlur);

const styles = StyleSheet.create({
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
    zIndex: 1,
  },
  bandBottom: {
    bottom: 0,
  },
  bandTop: {
    top: 0,
  },
});
