import {StyleSheet, View} from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { useTheme } from "../../../../contexts/ThemeContext";
import Text from "../../../../components/ScaledText";

const AboutEvent = ({ about }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <CustomText
        label={"About This Event"}
        fontFamily={fonts.semiBold}
        fontSize={22}
      />
      <CustomText
        label={
          about ||
          "Experience the magic of live music at our Summer Music Festival 2026. This year's lineup features an incredible mix of established and emerging artists across multiple genres. From indie rock to electronic dance music, there's something for every music lover."
        }
        fontFamily={fonts.medium}
        fontSize={14}
        color={colors.iconMuted}
      />
    </View>
  );
};

export default AboutEvent;

const styles = StyleSheet.create({
  container: {
    padding: 12,
    paddingTop: 8,
  },
});
