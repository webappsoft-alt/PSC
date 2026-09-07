import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const AddImgBtn = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.outerRing, { borderColor: colors.surfaceAlt }]}
    >
      <View style={[styles.innerRing, { borderColor: colors.surfaceAlt }]}>
        <Image source={Images.camera1} style={[styles.icon, { tintColor: colors.iconMuted }]} />
        <CustomText
          label={title}
          color={colors.iconMuted}
          fontFamily={fonts.medium}
          fontSize={8}
        />
      </View>
    </TouchableOpacity>
  );
};

export default AddImgBtn;

const styles = StyleSheet.create({
  outerRing: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    width: 64,
  },
  innerRing: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBg,
    borderStyle: "dashed",
    height: 58,
    width: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    height: 20,
    width: 20,
    resizeMode: "contain",
    tintColor: COLORS.gray64,
  },
});
