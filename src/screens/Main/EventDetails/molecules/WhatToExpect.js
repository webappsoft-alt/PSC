import { StyleSheet, View } from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { useTheme } from "../../../../contexts/ThemeContext";

const bulletPoints = [
  "8+ hours of non-stop music",
  "3 different stages",
  "Food trucks and vendors",
];

const WhatToExpect = ({ content }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  return (
    <View style={styles.container}>
      <CustomText
        label={"What To Expect There"}
        fontFamily={fonts.semiBold}
        fontSize={22}
      />

      <CustomText
        label={content}
        fontFamily={fonts.medium}
        fontSize={14}
        color={colors.iconMuted}
      />
    </View>
  );
};

export default WhatToExpect;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    padding: 12,
    paddingTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
    paddingHorizontal: 7,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 3,
    backgroundColor: colors.iconMuted,
    marginRight: 9,
  },
});
