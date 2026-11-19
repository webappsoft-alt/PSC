import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

/**
 * Header / back icon button (ported from Viral components/HeaderIconButton):
 * the glyph is 64% idle, 82% hovered and 100% while pressed; the circular
 * fill stays at full strength.
 */
export const HEADER_ICON_OPACITY = {
  inactive: 0.64,
  hover: 0.82,
  pressed: 1,
};

// The opacity goes on the glyph container itself. The old per-child clone
// skipped View children ("badge dots stay full strength") — but
// GlassBackButton wraps its Icons glyph in a sizing View, so the 64% idle
// opacity never actually applied and every back chevron rendered 100% white
// (the client's "default 64%" complaint). No current caller draws a badge.

export default function HeaderIconButton({
  children,
  backdrop,
  onPress,
  style,
  disabled,
  fullOpacity,
  hitSlop,
  accessibilityLabel,
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const opacity = fullOpacity
    ? 1
    : pressed
    ? HEADER_ICON_OPACITY.pressed
    : hovered
    ? HEADER_ICON_OPACITY.hover
    : HEADER_ICON_OPACITY.inactive;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}
    >
      {backdrop}
      <View pointerEvents="none" collapsable={false} style={[styles.icon, { opacity }]}>
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
