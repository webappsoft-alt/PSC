import { BlurView } from "@react-native-community/blur";
import { memo, useCallback, useState } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../contexts/ThemeContext";

/**
 * Figma "Header" / nav container background — a frosted overlay, never a
 * solid hide (client rule): the content stays visible through it, blurred.
 *
 * Behind the header's own content the blur is full strength (Figma radius
 * 16, plus a light #121212 tint so titles and chips stay readable); past the
 * header's inner edge it eases out over a `fade` band (Figma: progressive
 * blur 16 → 0) that hangs over the content.
 *
 * iOS renders a UIVisualEffectView under a masked parent unblurred (that was
 * the "progressive blur is completely off" bug): on iOS the mask now sits on
 * the effect view itself (patches/@react-native-community+blur — props
 * progressiveDirection / progressiveStart); Android steps the band down in
 * thin strips.
 *
 * Client rule: the blur is there only while content sits under the header /
 * footer. Pass `visible` (an Animated 0 → 1 value from useScrollEdgeBlur);
 * without it the blur is always on (headers over full-bleed media).
 */
export const HEADER_BLUR_RADIUS = 16;
// fade band past the header / footer edge (Figma nav container band: 32)
export const EDGE_FADE = 24;
// tint behind the header content: frosted, not a solid fill
export const HEADER_FILL_ALPHA = 0.64;
// strips the fade band is cut into
const BAND_STRIPS = 8;
// Figma Home-Feed nav container: #121212 0% → 64%
export const FOOTER_FILL_ALPHA = 0.64;

const toRgb = (color, fallback) => {
  if (typeof color !== "string") return fallback;
  const hex = color.replace("#", "");
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ");
  }
  const m = color.match(/rgba?\(([^)]+)\)/);
  return m ? m[1].split(",").slice(0, 3).join(",") : fallback;
};

export const EdgeProgressiveBlur = memo(
  ({
    edge = "top",
    visible,
    color,
    fillAlpha = HEADER_FILL_ALPHA,
    // band (pt) over which the blur eases out at the inner edge
    fade = EDGE_FADE,
    // how far the band hangs past the parent (0 = the band is inside it)
    overhang = fade,
    style,
  }) => {
    const { themeMode, colors } = useTheme();
    const isLight = themeMode === "light";
    const [total, setTotal] = useState(0);
    const onLayout = useCallback((e) => {
      const h = Math.round(e.nativeEvent.layout.height);
      setTotal((prev) => (prev === h ? prev : h));
    }, []);
    const rgb = toRgb(
      color || colors?.background,
      isLight ? "250, 250, 250" : "18, 18, 18",
    );
    const blurType =
      Platform.OS === "ios"
        ? isLight
          ? "ultraThinMaterialLight"
          : "ultraThinMaterialDark"
        : isLight
          ? "light"
          : "dark";
    const top = edge === "top";
    const body = Math.max(0, total - fade);
    // outer edge → inner edge: full blur behind the header content, then
    // the band is cut into thin strips whose blur fades out step by step
    // (radius and opacity), so there is no hard edge where it ends. The
    // layers sit side by side (never stacked) so the material tint is even.
    const strip = Math.max(1, Math.round(fade / BAND_STRIPS));
    const bodyPx = Math.round(body);
    const layers =
      total > 0
        ? [
            {
              key: "body",
              start: 0,
              height: bodyPx,
              radius: HEADER_BLUR_RADIUS,
              opacity: 1,
            },
            ...Array.from({ length: BAND_STRIPS }, (_, i) => {
              const t = (i + 1) / (BAND_STRIPS + 1);
              return {
                key: `band${i}`,
                // whole points, edge to edge: an overlap reads as a line
                start: bodyPx + strip * i,
                height: strip,
                radius: Math.max(1, Math.round(HEADER_BLUR_RADIUS * (1 - t))),
                opacity: 1 - t,
              };
            }),
          ]
        : [];
    const fadeStart = total > 0 ? body / total : 1;
    const tint = top
      ? {
          colors: [
            `rgba(${rgb}, ${fillAlpha})`,
            `rgba(${rgb}, ${fillAlpha})`,
            `rgba(${rgb}, 0)`,
          ],
          locations: [0, fadeStart, 1],
        }
      : {
          colors: [
            `rgba(${rgb}, 0)`,
            `rgba(${rgb}, ${fillAlpha})`,
            `rgba(${rgb}, ${fillAlpha})`,
          ],
          locations: [0, 1 - fadeStart, 1],
        };

    return (
      <Animated.View
        pointerEvents="none"
        onLayout={onLayout}
        style={[
          styles.fill,
          top ? { bottom: -overhang } : { top: -overhang },
          visible != null ? { opacity: visible } : null,
          style,
        ]}
      >
        {Platform.OS === "ios" ? (
          // iOS: one blur with a gradient mask on the effect view itself
          // (patched @react-native-community/blur): full strength behind the
          // header content, easing to 0 across the band — a true progressive
          // edge, no seams
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            blurType={blurType}
            blurAmount={HEADER_BLUR_RADIUS}
            progressiveDirection={edge}
            progressiveStart={total > 0 ? fadeStart : 0.6}
            overlayColor="transparent"
            reducedTransparencyFallbackColor={`rgba(${rgb}, 0.9)`}
          />
        ) : (
          layers.map((layer) => (
            <BlurView
              key={layer.key}
              pointerEvents="none"
              style={[
                styles.layer,
                top ? { top: layer.start } : { bottom: layer.start },
                { height: layer.height, opacity: layer.opacity },
              ]}
              blurType={blurType}
              blurAmount={layer.radius}
              overlayColor="transparent"
              reducedTransparencyFallbackColor={`rgba(${rgb}, 0.9)`}
            />
          ))
        )}
        {fillAlpha > 0 ? (
          <LinearGradient
            pointerEvents="none"
            colors={tint.colors}
            locations={tint.locations}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
      </Animated.View>
    );
  },
);

/** Header background (Figma Header › progressive background blur). */
const HeaderProgressiveBlur = ({ style, color, visible, fade, overhang }) => (
  <EdgeProgressiveBlur
    edge="top"
    visible={visible}
    color={color}
    fade={fade}
    overhang={overhang}
    style={style}
  />
);

export default memo(HeaderProgressiveBlur);

/** Footer background (Figma nav container: blur 0 → 16 + #121212 0 → 64%). */
export const FooterProgressiveBlur = memo(
  ({ style, color, visible, fillAlpha, fade, overhang }) => (
    <EdgeProgressiveBlur
      edge="bottom"
      visible={visible}
      color={color}
      fillAlpha={fillAlpha ?? FOOTER_FILL_ALPHA}
      fade={fade}
      overhang={overhang}
      style={style}
    />
  ),
);

/**
 * For screens that don't use ScreenWrapper's header: floats `children` over
 * the content at y 0 (adds the status-bar inset unless `includeStatusBar` is
 * false because the header already handles it) with the progressive blur
 * behind, and reports its total height so the scroll content can start below
 * it (contentContainerStyle paddingTop / progressViewOffset). Pass `visible`
 * from useScrollEdgeBlur so the blur only shows over scrolled content.
 */
export const FloatingBlurHeader = ({
  children,
  onHeightChange,
  includeStatusBar = true,
  style,
  color,
  visible,
}) => {
  const insets = useSafeAreaInsets();
  const onLayout = useCallback(
    (e) => onHeightChange?.(Math.round(e.nativeEvent.layout.height)),
    [onHeightChange],
  );
  return (
    <View
      pointerEvents="box-none"
      onLayout={onLayout}
      style={[
        styles.floating,
        { paddingTop: includeStatusBar ? insets.top : 0 },
        style,
      ]}
    >
      <HeaderProgressiveBlur color={color} visible={visible} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  floating: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});
