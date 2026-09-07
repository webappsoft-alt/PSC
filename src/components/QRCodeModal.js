import QRCode from "react-native-qrcode-svg";
import {
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  View,
} from "react-native";

import CustomButton from "./CustomButton";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import ImageFast from "./ImageFast";

import { PNGIcons } from "../assets/images/icons";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";

const { width } = Dimensions.get("window");

const QRCodeModal = ({ isVisible, onDisable, onPress, title, value }) => {
  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View style={styles.borderView}>
        <View style={styles.mainContainer}>
          <View style={styles.row}>
            <View style={{ flexDirection: "row" }}>
              <View style={styles.coloredIcon}>
                <ImageFast
                  source={Images.finder}
                  resizeMode={"contain"}
                  style={styles.colored}
                />
              </View>
              <CustomText
                label={title || "Enable VTC"}
                fontFamily={fonts.semiBold}
                fontSize={24}
              />
            </View>
            <TouchableOpacity
              onPress={onPress}
              style={{
                height: 32,
                width: 32,
                borderRadius: 99,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.lightGray,
              }}
            >
              <Image source={PNGIcons.cross} style={styles.icon} />
            </TouchableOpacity>
          </View>
          <View
            style={{ marginTop: 24, marginBottom: 24, alignItems: "center" }}
          >
            <QRCode
              value={value}
              size={240}
              backgroundColor="transparent"
              foregroundColor="black"
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <ImageFast
              source={Images.qrcode}
              resizeMode={"contain"}
              style={styles.qrcode}
            />
            <CustomText
              label={"Show to the Customer to Scan"}
              fontSize={16}
              color={COLORS.black}
              fontFamily={fonts.medium}
              marginLeft={5}
            />
          </View>

          <CustomButton
            title="Cancel"
            onPress={onPress}
            backgroundColor={COLORS.inputBg}
            color={COLORS.black}
          />
        </View>
      </View>
    </CustomModal>
  );
};

export default QRCodeModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: width * 0.9,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 24,
  },
  icon: {
    height: 16,
    width: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  borderView: {
    borderWidth: 1,
    borderColor: "#7f7f7f",
    padding: 4,
    alignSelf: "center",
    borderRadius: 28,
    overflow: "hidden",
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
});
