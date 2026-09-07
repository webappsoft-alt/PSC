import { Images } from "../assets/images";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import Blur from "./Blur";

const SelfiPreview = ({ selfi, handleCancel, handleVerify }) => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, marginBottom: 20 }}>
        <Image
          style={styles.img}
          resizeMode={"contain"}
          source={{ uri: selfi }}
        />
      </View>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={handleCancel}
          style={styles.retake}
        >
          <Blur />
          <Image
            source={Images.refresh}
            style={{ height: 24, width: 24, tintColor: "#fff" }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleVerify}
          style={styles.outerContinueButton}
        >
          <View style={styles.continueButton}>
            <CustomText
              fontSize={16}
              fontFamily={fonts.medium}
              color={COLORS.black}
              label="Continue with this Selfie"
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SelfiPreview;

const styles = StyleSheet.create({
  img: {
    width: "100%",
    height: "100%",
    marginTop: "20%",
  },
  actionButtonsContainer: {
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    columnGap: 10,
  },
  retake: {
    width: 52,
    height: 52,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  outerContinueButton: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.48)",
    padding: 2,
    borderRadius: 99,
    flex: 1,
  },
  continueButton: {
    flex: 1,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
