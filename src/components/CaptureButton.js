import { StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import fonts from "../assets/fonts";

const CaptureButton = ({ onPress, title, subTitle }) => {
  return (
    <View style={styles.bottom}>
      <CustomText label={title} fontFamily={fonts.medium} fontSize={16} />
      <CustomText label={subTitle} marginBottom={20} color={COLORS.gray64} />
      <View style={styles.circle}>
        <TouchableOpacity style={styles.btn} onPress={onPress} />
      </View>
    </View>
  );
};

export default CaptureButton;

const styles = StyleSheet.create({
  bottom: {
    backgroundColor: COLORS.black,
    width: "100%",
    bottom: 0,
    position: "absolute",
    paddingTop: 16,
    paddingBottom: 46,
    zIndex: 4,
    paddingHorizontal: 20,
  },

  circle: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignSelf: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: COLORS.white,
    borderRadius: 100,
  },
  btn: {
    width: 56,
    height: 56,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 100,
  },
});
