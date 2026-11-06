import { StyleSheet, View } from "react-native";
import { BlurView } from "@react-native-community/blur";
import { useTheme } from "../contexts/ThemeContext";
import HeaderIconButton from "./HeaderIconButton";
import Icons from "./Icons";

/**
 * Shared back / header circle button — the ONE back button of PSC.
 *
 * Figma standard (Header back button, used across Onboarding, Profile,
 * Social Feed, Chat, Shows, Matching, Poll detail):
 *   40 × 40, r100, fill white 4% (dark) / #121212 4% (light),
 *   BACKGROUND_BLUR 16, Material Symbols Rounded "chevron_left" 24,
 *   glyph white @64% idle (HeaderIconButton: 82% hover, 100% pressed).
 * Figma variants on photos / colour headers use a stronger fill
 * (white 8% / 16%) → `fill` prop. 48 pt footer variant → `size` /
 * `iconSize`. Client rule "opacity = blur": the fill always gets the blur.
 *
 * `backdrop` (optional) replaces the live blur with a pre-rendered blurred
 * copy of what is behind the button (e.g. the election hero photo), which
 * matches the Figma background blur exactly.
 */
export const GLASS_FILL = "rgba(255, 255, 255, 0.04)";
const GLASS_FILL_LIGHT = "rgba(18, 18, 18, 0.04)";

export const GlassSurface = ({ borderRadius = 100, fill, children }) => {
  const { isDark } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius, overflow: "hidden" }]}
    >
      {children || (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? "dark" : "xlight"}
          blurAmount={16}
          overlayColor="transparent"
          reducedTransparencyFallbackColor={
            isDark ? "rgba(18, 18, 18, 0.64)" : "rgba(255, 255, 255, 0.64)"
          }
        />
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: fill || (isDark ? GLASS_FILL : GLASS_FILL_LIGHT) },
        ]}
      />
    </View>
  );
};

const GlassBackButton = ({
  onPress,
  backdrop,
  fill,
  size = 40,
  icon = "chevron_left",
  iconSize = 24,
  color,
  fullOpacity,
  disabled,
  style,
  accessibilityLabel = "Back",
}) => {
  const { isDark } = useTheme();
  return (
    <HeaderIconButton
      onPress={onPress}
      disabled={disabled}
      fullOpacity={fullOpacity}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      backdrop={<GlassSurface fill={fill}>{backdrop}</GlassSurface>}
      style={[styles.circle, { width: size, height: size }, style]}
    >
      <View style={{ width: iconSize, height: iconSize }}>
        <Icons
          family="MaterialSymbolsRounded"
          name={icon}
          size={iconSize}
          color={color || (isDark ? "#FFFFFF" : "#121212")}
          style={{
            position: "absolute",
            left: 0,
            top: -0.1 * iconSize,
            width: iconSize,
            height: 1.2 * iconSize,
            lineHeight: 1.2 * iconSize,
            textAlign: "center",
          }}
        />
      </View>
    </HeaderIconButton>
  );
};

const styles = StyleSheet.create({
  circle: {
    borderRadius: 100,
    overflow: "hidden",
  },
});

export default GlassBackButton;
