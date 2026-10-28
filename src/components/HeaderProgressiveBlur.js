import { BlurView } from "@react-native-community/blur";
import MaskedView from "@react-native-masked-view/masked-view";
import { memo, useCallback, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../contexts/ThemeContext";

/**
 * Header background for headers that float over scrolling content (client
 * rule: "the header has progressive blur everywhere").
 *
 * At rest it is exactly the Figma header: the page colour (#121212 dark /
 * #FAFAFA light) — no visible band. Content that scrolls up dissolves into
 * it through a progressive edge at the header's bottom: background blur 16 → 0
 * (Figma Header › Background blur › Progressive, radius 16) together with a
 * page-colour fade, over the same 32pt progressive band the Figma bottom-nav
 * container uses (#121212 0% → 100%, mirrored here). Above that band the
 * header stays opaque, so titles, buttons and chips never sit on top of raw
 * content.
 *
 * Fills its parent (absoluteFill); the parent must span the whole header,
 * status bar included.
 */
export const HEADER_BLUR_RADIUS = 16;
export const HEADER_PROGRESSIVE_BAND = 32;
const STEPS = 10;
const smooth = (t) => t * t * (3 - 2 * t);

const toRgb = (color) => {
  if (typeof color !== "string") return "18, 18, 18";
  const hex = color.replace("#", "");
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ");
  }
  const m = color.match(/rgba?\(([^)]+)\)/);
  return m ? m[1].split(",").slice(0, 3).join(",") : "18, 18, 18";
};

const HeaderProgressiveBlur = ({ style, color }) => {
  const { themeMode, colors } = useTheme();
  const isLight = themeMode === "light";
  const [height, setHeight] = useState(0);
  const onLayout = useCallback((e) => {
    const h = Math.round(e.nativeEvent.layout.height);
    setHeight((prev) => (prev === h ? prev : h));
  }, []);

  const rgb = toRgb(color || colors?.background || (isLight ? "#FAFAFA" : "#121212"));
  // where the progressive band starts (0 → 1 down the header)
  const bandStart =
    height > HEADER_PROGRESSIVE_BAND
      ? (height - HEADER_PROGRESSIVE_BAND) / height
      : 0;

  const fade = useMemo(() => {
    const colorsOut = [`rgba(${rgb}, 1)`];
    const locations = [0];
    for (let i = 0; i <= STEPS; i += 1) {
      const u = i / STEPS;
      colorsOut.push(`rgba(${rgb}, ${(1 - smooth(u)).toFixed(3)})`);
      locations.push(bandStart + (1 - bandStart) * u);
    }
    return { colors: colorsOut, locations };
  }, [rgb, bandStart]);

  const tint =
    Platform.OS === "ios"
      ? isLight
        ? "ultraThinMaterialLight"
        : "ultraThinMaterialDark"
      : isLight
        ? "light"
        : "dark";

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, style]}
    >
      {height > 0 ? (
        <>
          {/* Figma progressive background blur: full radius down to the
              band, then 16 → 0 across it */}
          <MaskedView
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={["#000", "#000", "rgba(0, 0, 0, 0)"]}
                locations={[0, bandStart, 1]}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType={tint}
              blurAmount={HEADER_BLUR_RADIUS}
              overlayColor="transparent"
              reducedTransparencyFallbackColor={`rgb(${rgb})`}
            />
          </MaskedView>
          <LinearGradient
            pointerEvents="none"
            colors={fade.colors}
            locations={fade.locations}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        // first frame, before the header is measured: plain page colour
        <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgb(${rgb})` }]} />
      )}
    </View>
  );
};

export default memo(HeaderProgressiveBlur);

/**
 * For screens that don't use ScreenWrapper's header: floats `children` over
 * the content at y 0 (adds the status-bar inset unless `includeStatusBar` is
 * false because the header already handles it) with the progressive blur
 * behind, and reports its total height so the scroll content can start below
 * it (contentContainerStyle paddingTop / progressViewOffset).
 */
export const FloatingBlurHeader = ({
  children,
  onHeightChange,
  includeStatusBar = true,
  style,
  color,
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
      <HeaderProgressiveBlur color={color} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  floating: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});
