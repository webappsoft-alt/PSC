import { Platform, StyleSheet, Switch, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { COLORS } from "../utils/COLORS";

/** Same as Viral's CustomSwitch: the platform switch, accent-coloured when on. */
// iOS 26 draws the (Liquid Glass) switch 64pt wide, but React Native still
// lays it out with the old 51pt box, so it spills 13pt past its slot and gets
// clipped at the edge of rows/sheets. Reserve the real width.
const IOS_SWITCH_OVERFLOW =
  Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26
    ? 13
    : 0;

const CustomSwitch = ({
  setValue,
  value,
  marginRight,
  marginLeft,
  marginBottom,
  bgColor,
}) => {
  const { isDark } = useTheme();
  const onTint = bgColor || COLORS.buttonColor;
  const androidTrackOff = isDark ? "#39393D" : "#E5E5EA";

  return (
    <View
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
        value={!!value}
        onValueChange={setValue}
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
    </View>
  );
};

export default CustomSwitch;

const styles = StyleSheet.create({
  switchContainer: {
    justifyContent: "center",
  },
});
