import { StyleSheet, TouchableOpacity, View } from "react-native";

import CustomText from "../CustomText";
import Icons from "../Icons";

import fonts from "../../assets/fonts";
import { COLORS } from "../../utils/COLORS";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Glyphs for the alternative-login-method rows — the exact Google Material
 * Symbols (Rounded / Rounded Filled) used in the Figma design.
 * type: "pin" | "faceid" | "otp" | "password"
 */
export const MethodIcon = ({ type, color }) => {
  switch (type) {
    case "pin":
      return (
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name="pin"
          size={24}
          color="#8C8C8C"
        />
      );
    case "faceid":
      return (
        <Icons
          family="MaterialSymbolsRounded"
          name="familiar_face_and_zone"
          size={22}
          color={color}
        />
      );
    case "otp":
      return (
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name="verified_user"
          size={20}
          color={color}
        />
      );
    case "password":
      return (
        <Icons
          family="MaterialSymbolsRounded"
          name="password"
          size={22}
          color={color}
        />
      );
    default:
      return null;
  }
};

export const AuthMethodRow = ({ type, label, onPress, marginTop }) => {
  const { colors, isDark } = useTheme();
  const color = isDark ? COLORS.white : colors.text;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.row, { marginTop }]}
    >
      <View style={styles.iconWrap}>
        <MethodIcon type={type} color={color} />
      </View>
      <CustomText
        label={label}
        fontFamily={fonts.medium}
        fontSize={16}
        lineHeight={16 * 1.4}
        letterSpacing={-0.08}
        color={color}
      />
    </TouchableOpacity>
  );
};

// Figma: the methods block is a vertical auto-layout with a 20px gap, and
// "Or" is Poppins Regular 14 @ 64% white. The parent container supplies the
// 20px gap — this component adds no margins of its own.
export const OrSeparator = () => {
  const { colors, isDark } = useTheme();
  return (
    <CustomText
      label="Or"
      alignSelf="center"
      fontSize={14}
      letterSpacing={-0.28}
      color={isDark ? COLORS.gray64 : colors.textSecondary}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
  iconWrap: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
