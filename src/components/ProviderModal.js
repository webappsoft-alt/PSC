import {
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  View,
} from "react-native";

import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import ImageFast from "./ImageFast";

import { PNGIcons } from "../assets/images/icons";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";
import Icons from "./Icons";
import LinearGradient from "react-native-linear-gradient";
import CustomSwitch from "./CustomSwitch";
import { useState } from "react";

const ProviderModaltype = ({ isVisible, onDisable, title, actionClick }) => {
  const [Pref, setPref] = useState(false);
  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View style={styles.mainContainer}>
        <CustomText
          label={title || "Enable VTC"}
          fontFamily={fonts.semiBold}
          fontSize={24}
          lineHeight={1.4 * 24}
        />
        <TouchableOpacity onPress={actionClick} style={styles.dismissIcon}>
          <Image source={PNGIcons.cross} style={{ width: 24, height: 24 }} />
        </TouchableOpacity>

        <TouchableOpacity onPress={actionClick} style={styles.gender}>
          <View>
            <View style={[styles.row, { gap: 4 }]}>
              <ImageFast
                source={Images.male}
                resizeMode={"contain"}
                style={styles.icon}
              />
              <ImageFast
                source={Images.female}
                resizeMode={"contain"}
                style={styles.icon}
              />
            </View>

            <CustomText
              label={"I would Like Both"}
              fontFamily={fonts.semiBold}
              fontSize={16}
              lineHeight={1.4 * 16}
              marginTop={12}
              color={COLORS.black}
            />
          </View>

          <Icons
            name={"chevron-right"}
            family={"Feather"}
            size={24}
            color={COLORS.subtitle}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={actionClick} style={styles.gender}>
          <LinearGradient
            colors={["rgba(238, 16, 69, 0.16)", "rgba(238, 16, 69, 0)"]}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View>
            <ImageFast
              source={Images.male}
              resizeMode={"contain"}
              style={styles.icon}
            />

            <CustomText
              label={"I would Like Women Only"}
              fontFamily={fonts.semiBold}
              fontSize={16}
              lineHeight={1.4 * 16}
              marginTop={12}
              color={COLORS.black}
            />
          </View>

          <Icons
            name={"chevron-right"}
            family={"Feather"}
            size={24}
            color={COLORS.subtitle}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={actionClick} style={styles.gender}>
          <LinearGradient
            colors={["rgba(67, 71, 255, 0.16)", "rgba(67, 71, 255, 0)"]}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View>
            <ImageFast
              source={Images.female}
              resizeMode={"contain"}
              style={styles.icon}
            />

            <CustomText
              label={"I would Like Men Only"}
              fontFamily={fonts.semiBold}
              fontSize={16}
              lineHeight={1.4 * 16}
              marginTop={12}
              color={COLORS.black}
            />
          </View>

          <Icons
            name={"chevron-right"}
            family={"Feather"}
            size={24}
            color={COLORS.subtitle}
          />
        </TouchableOpacity>

        <View
          style={[
            styles.row,
            {
              marginTop: 16,
              justifyContent: "space-between",
            },
          ]}
        >
          <CustomText
            label={"Save as preference"}
            fontFamily={fonts.semiBold}
            fontSize={16}
            lineHeight={1.4 * 16}
            color={COLORS.black}
          />
          <CustomSwitch value={Pref} setValue={setPref} />
        </View>
      </View>
    </CustomModal>
  );
};

export default ProviderModaltype;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,

    paddingTop: 16,
    paddingBottom: 50,
  },
  icon: {
    height: 32,
    width: 32,
  },

  gender: {
    width: "100%",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#1212120A",
    overflow: "hidden",
    marginTop: 16,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  blurView: {
    borderRadius: 28,
  },
  coloredIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lowPurple,
    borderRadius: 100,
    marginRight: 12,
  },
  colored: {
    width: 16,
    height: 16,
  },
  qrcode: {
    width: 20,
    height: 20,
    marginBottom: 2,
    marginRight: 8,
  },

  dismissIcon: {
    height: 48,
    width: 48,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lightGray,
    position: "absolute",
    top: -60,
    left: "50%",
    transform: [{ translateX: -24 }],
  },
});
