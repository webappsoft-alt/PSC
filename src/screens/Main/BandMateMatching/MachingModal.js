import {
  ImageBackground,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";
import CustomText from "../../../components/CustomText";
import ImageFast from "../../../components/ImageFast";
import { COLORS } from "../../../utils/COLORS";

const MatchingModal = ({ isVisible, onClose }) => {
  const { height } = useWindowDimensions();
  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onClose}>
      <View style={[styles.container, { height: height * 0.66 }]}>
        <ImageBackground source={Images.short3} style={styles.imageBackground}>
          <View style={styles.overlay} />
          <View style={styles.innerContainer}>
            <View style={styles.row}>
              <ImageFast
                source={Images.verifiedBadge}
                style={styles.verifyStar}
              />
              <CustomText
                label={"MEMBER"}
                fontSize={12}
                marginLeft={6}
                fontFamily={fonts.medium}
              />
            </View>

            <View style={styles.matchContainer}>
              <ImageFast source={Images.checkGreen} style={styles.checkGreen} />
              <CustomText
                label={"It’s a Match!"}
                fontSize={44}
                fontFamily={fonts.bold}
              />
              <CustomText
                label={"You and Myles like each other"}
                marginTop={-6}
              />
            </View>

            <View style={styles.profileContainer}>
              <View style={styles.profileItem}>
                <ImageFast source={Images.person} style={styles.profile} />
                <CustomText
                  label={"You"}
                  fontFamily={fonts.medium}
                  fontSize={12}
                />
              </View>
              <View style={styles.profileItem}>
                <ImageFast source={Images.person} style={styles.profile} />
                <CustomText
                  label={"Myles"}
                  fontFamily={fonts.medium}
                  fontSize={12}
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <CustomButton
                title={"Say hi!"}
                backgroundColor={COLORS.white}
                height={56}
              />
              <CustomButton
                title={"Keep Swiping"}
                color={COLORS.white}
                height={56}
                backgroundColor={"transparent"}
                borderWidth={1}
                borderColor={COLORS.white}
                bgBlur
              />
            </View>
          </View>
          <LinearGradient
            colors={["rgba(100, 205, 117, 1)", "rgba(100, 205, 117, 0)"]}
            style={styles.linearGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            locations={[1, 0.6]}
          />
        </ImageBackground>
      </View>
    </CustomModal>
  );
};

export default MatchingModal;

const styles = StyleSheet.create({
  container: {
    width: "95%",
    alignSelf: "center",
    borderRadius: 24,
    overflow: "hidden",
  },
  imageBackground: {
    height: "100%",
    width: "100%",
  },
  overlay: {
    position: "absolute",
    height: "100%",
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifyStar: {
    height: 22,
    width: 22,
  },
  innerContainer: {
    flex: 1,
    justifyContent: "space-between",
    padding: 12,
  },
  checkGreen: {
    height: 64,
    width: 64,
  },
  matchContainer: {
    alignItems: "center",
  },
  profileContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },
  profile: {
    height: 84,
    width: 84,
    borderRadius: 99,
  },
  buttonContainer: {
    rowGap: 8,
    zIndex: 99,
  },
  linearGradient: {
    position: "absolute",
    height: "100%",
    width: "100%",
    zIndex: 1,
    top: 0,
    left: 0,
    right: 0,
  },
  profileItem: {
    alignItems: "center",
    rowGap: 8,
  },
});
