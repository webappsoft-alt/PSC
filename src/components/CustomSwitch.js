import { Platform, StyleSheet, Switch, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { COLORS } from "../utils/COLORS";

/** Same as Viral's CustomSwitch: the platform switch, accent-coloured when on. */
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
        { marginLeft, marginRight, marginBottom },
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
