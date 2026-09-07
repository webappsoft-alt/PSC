import { Image, StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const Heading = ({ lable, showIcon = false }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {showIcon && <Image source={Images.LocationPin} style={[styles.icon, { tintColor: colors.text }]} />}

      <CustomText
        label={lable}
        fontFamily={fonts.medium}
        fontSize={18}
        lineHeight={18 * 1.4}
      />
    </View>
  );
};

export default Heading;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginVertical: 16,
  },
  icon: {
    height: 16,
    width: 16,
    resizeMode: "contain",
    tintColor: COLORS.white,
  },
});
