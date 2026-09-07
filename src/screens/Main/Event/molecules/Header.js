import {Image, StyleSheet, TouchableOpacity, View} from "react-native";
import React from "react";
import { PNGIcons } from "../../../../assets/images/icons";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";
import Text from "../../../../components/ScaledText";

const Header = ({ onSearchPress, onFilterPress }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  return (
    <View style={styles.container}>
      <View style={[styles.container, { flex: 1 }]}>
        <TouchableOpacity
          style={styles.iconWarpper}
          activeOpacity={0.8}
          onPress={onSearchPress}
        >
          <Image source={PNGIcons.search} style={[styles.icon, { tintColor: colors.text }]} />
        </TouchableOpacity>
        <CustomText
          label={"Events"}
          fontSize={28}
          lineHeight={28 * 1.4}
          fontFamily={fonts.abril}
          marginLeft={12}
        />
      </View>
      <TouchableOpacity
        style={styles.iconWarpper}
        activeOpacity={0.8}
        onPress={onFilterPress}
      >
        <Image source={PNGIcons.preference} style={[styles.icon, { tintColor: colors.text }]} />
      </TouchableOpacity>
    </View>
  );
};

export default Header;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginTop: 7,
    marginBottom: 8,
  },
  iconWarpper: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 99,
    backgroundColor: colors.surfaceAlt,
  },
  icon: {
    height: 20,
    width: 20,
    resizeMode: "contain",
  },
});
