import { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Switch, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { COLORS } from "../utils/COLORS";

/**
 * The one toggle used across PSC. It stays the platform switch (as Viral) so
 * it keeps the iOS 26 Liquid Glass knob, drag-to-toggle and haptics — the
 * Figma "Toggle - Switch" is the iOS and iPadOS 26 kit, i.e. this control.
 *
 * Figma has "Show AX Label" on (client), which iOS only draws when the user
 * turns on Settings › Accessibility › On/Off Labels. We draw the same labels
 * over the native switch, at the kit's positions on the 64×28 control:
 *   on  → 1×10 white bar at (12, 9)
 *   off → 10×10 ring, 1px #B3B3B3, at (47, 9)
 * They hide while a finger is on the switch (the knob slides over them
 * during a drag) and fade back in once the knob has settled.
 */

const IOS = Platform.OS === "ios";
const IOS_26 = IOS && parseInt(String(Platform.Version), 10) >= 26;

// iOS 26 draws the (Liquid Glass) switch 64pt wide, but React Native still
// lays it out with the old 51pt box, so it spills 13pt past its slot and gets
// clipped at the edge of rows/sheets. Reserve the real width.
const IOS_SWITCH_OVERFLOW = IOS_26 ? 13 : 0;

// Drawn control size and AX label positions (iOS 26 kit / classic iOS)
const LAYOUT_H = 31; // RN's layout box height for UISwitch
const DRAWN = IOS_26 ? { w: 64, h: 28 } : { w: 51, h: 31 };
const AX_ON = IOS_26 ? { x: 12, y: 9 } : { x: 12, y: 10.5 };
const AX_OFF = IOS_26 ? { x: 47, y: 9 } : { x: 34, y: 10.5 };

const CustomSwitch = ({
  setValue,
  value,
  marginRight,
  marginLeft,
  marginBottom,
  bgColor,
  disabled,
}) => {
  const { isDark } = useTheme();
  const onTint = bgColor || COLORS.buttonColor;
  const androidTrackOff = isDark ? "#39393D" : "#E5E5EA";
  const on = !!value;

  const [touching, setTouching] = useState(false);
  const labelOpacity = useRef(new Animated.Value(1)).current;

  // hide while touched / while the knob is moving, then fade back in
  useEffect(() => {
    labelOpacity.stopAnimation();
    if (touching) {
      labelOpacity.setValue(0);
      return;
    }
    labelOpacity.setValue(0);
    Animated.timing(labelOpacity, {
      toValue: 1,
      duration: 160,
      delay: 180, // knob travel
      useNativeDriver: true,
    }).start();
  }, [on, touching, labelOpacity]);

  return (
    <View
      // touch events from the native switch bubble up to this view
      onTouchStart={IOS ? () => setTouching(true) : undefined}
      onTouchEnd={IOS ? () => setTouching(false) : undefined}
      onTouchCancel={IOS ? () => setTouching(false) : undefined}
      style={[
        styles.switchContainer,
        {
          marginLeft,
          marginRight: (marginRight || 0) + IOS_SWITCH_OVERFLOW,
          marginBottom,
        },
      ]}
    >
      <Switch
        value={on}
        onValueChange={setValue}
        disabled={disabled}
        // iOS: only the "on" tint (as Viral). Setting the off colour or
        // ios_backgroundColor paints a second layer behind the native
        // switch — the two-tone off state.
        trackColor={
          Platform.OS === "android"
            ? { false: androidTrackOff, true: onTint }
            : { true: onTint }
        }
        thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
      />

      {IOS && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.axLayer,
            {
              width: DRAWN.w,
              height: DRAWN.h,
              top: (LAYOUT_H - DRAWN.h) / 2,
              opacity: labelOpacity,
            },
          ]}
        >
          {on ? (
            <View style={[styles.axOn, { left: AX_ON.x, top: AX_ON.y }]} />
          ) : (
            <View style={[styles.axOff, { left: AX_OFF.x, top: AX_OFF.y }]} />
          )}
        </Animated.View>
      )}
    </View>
  );
};

export default CustomSwitch;

const styles = StyleSheet.create({
  switchContainer: {
    justifyContent: "center",
  },
  axLayer: {
    position: "absolute",
    left: 0,
  },
  axOn: {
    position: "absolute",
    width: 1,
    height: 10,
    backgroundColor: COLORS.white,
  },
  axOff: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#B3B3B3",
  },
});
