import { Image, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import { PNGIcons } from "../../../../assets/images/icons";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";
const LatestRelease = () => {
  return (
    <View style={styles.container}>
      <CustomText
        label={"Latest release"}
        fontFamily={fonts.medium}
        color={COLORS.white}
        fontSize={17}
        marginBottom={12}
      />
      <ImageFast source={Images.latest_rel} style={styles.imgStyle}>
        <LinearGradient
          colors={["#14141499", "#14141440", "#14141499"]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.bottomGradient}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 18,
            gap: 8,
          }}
        >
          <Image
            source={Images.profile}
            style={{ height: 24, width: 24, borderRadius: 99 }}
          />

          <CustomText
            label={"Posted by Artist"}
            fontFamily={fonts.medium}
            color={COLORS.white}
            fontSize={14}
            lineHeight={14 * 1.4}
            // marginTop={16}
            // marginLeft={40}
          />
        </View>
        <View style={styles.bottomContent}>
          <View style={styles.bottonRow}>
            <View style={styles.row}>
              <Image source={Images.thumbnail} style={styles.thumbnail} />
              <View>
                <CustomText
                  label={"The Car"}
                  fontFamily={fonts.medium}
                  color={COLORS.white}
                  fontSize={12}
                  lineHeight={12 * 1.4}
                />
                <CustomText
                  label={"Album"}
                  fontFamily={fonts.medium}
                  color={"#cfd2d1"}
                  fontSize={12}
                  lineHeight={12 * 1.4}
                />
              </View>
            </View>
            <Image
              source={PNGIcons.forward}
              style={styles.forwardIcon}
              tintColor={"#b3b3b3"}
            />
          </View>
        </View>
      </ImageFast>
    </View>
  );
};

export default LatestRelease;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  imgStyle: {
    width: "100%",
    height: 261,
    resizeMode: "cover",
    borderRadius: 4,
  },
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,

    bottom: 0,
  },
  bottomContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  bottonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  thumbnail: {
    height: 54,
    width: 54,
    resizeMode: "contain",
    marginRight: 16,
  },
  forwardIcon: {
    height: 40,
    width: 28,
  },
});
