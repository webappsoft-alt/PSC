import {Image, StyleSheet, TouchableOpacity, View} from "react-native";
import React from "react";
import SearchInput from "../../../../components/SearchInput";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import { useNavigation } from "@react-navigation/native";
import { PNGIcons } from "../../../../assets/images/icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import Text from "../../../../components/ScaledText";
const SearchEventHeader = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <SearchInput
          placeholder={"Search Location..."}
          borderRadius={99}
          isCross
        />
      </View>

      <TouchableOpacity
        style={styles.iconContainer}
        activeOpacity={0.8}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={PNGIcons.white_cross}
          style={{
            height: 20,
            width: 20,
            marginTop: 2,
            tintColor: colors.text,
          }}
        />
      </TouchableOpacity>
    </View>
  );
};

export default SearchEventHeader;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  iconContainer: {
    borderRadius: 99,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
});
