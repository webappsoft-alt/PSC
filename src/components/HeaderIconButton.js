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

function withGlyphOpacity(children, opacity) {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    // Badge dots stay full strength; fading a parent View blanks SVG/images on iOS.
    if (child.type === View) return child;
    return React.cloneElement(child, {
      style: [child.props.style, { opacity }],
    });
  });
}

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
      <View pointerEvents="none" collapsable={false} style={styles.icon}>
        {withGlyphOpacity(children, opacity)}
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
