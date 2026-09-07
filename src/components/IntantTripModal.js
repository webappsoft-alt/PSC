import { TouchableOpacity, StyleSheet, Image, View } from "react-native";
import { BlurView } from "@react-native-community/blur";

import CustomButton from "./CustomButton";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import ImageFast from "./ImageFast";
import Icons from "./Icons";

import { PNGIcons } from "../assets/images/icons";
import { formatPrice } from "../utils/constants";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";

const IntantTripModal = ({
  isVisible,
  onPress,
  onTripCancel,
  orderDetails,
}) => {
  const array = [
    orderDetails?.orderDetails?.metadata?.order?.startAddress?.address,
    `${
      Object.keys(orderDetails?.orderDetails?.metadata?.order?.steps || {})
        .length
    } stops`,
    orderDetails?.orderDetails?.metadata?.order?.endAddress?.address,
  ];

  return (
    <CustomModal isChange isVisible={isVisible}>
      <View
        style={{
          padding: 5,
          width: "95%",
          alignSelf: "center",
          borderRadius: 24,
          marginBottom: 12,
          maxHeight: "100%",
          borderWidth: 1,
          backgroundColor: "#FFFFFF29",
          borderColor: "rgba(255, 255, 255, 0.16)",
        }}
      >
        <BlurView
          style={{
            maxHeight: "100%",
            width: "100%",
            borderRadius: 24,
          }}
          blurType="light"
          blurAmount={26}
          reducedTransparencyFallbackColor="#FFFFFF29"
        />
        <View style={styles.mainContainer}>
          <View style={styles.row}>
            <View style={{ flexDirection: "row" }}>
              <View style={styles.coloredIcon}>
                <ImageFast
                  source={Images.finder}
                  resizeMode="contain"
                  style={styles.colored}
                />
              </View>
              <CustomText
                label="Instant Trip"
                fontFamily={fonts.semiBold}
                fontSize={24}
              />
            </View>
            <TouchableOpacity
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
            style={[
              styles.row,
              { justifyContent: "start", gap: 6, marginTop: 16 },
            ]}
          >
            <View style={styles.buttonBg}>
              <CustomText
                label="4.8"
                fontFamily={fonts.semiBold}
                color={COLORS.black}
                fontSize={12}
              />
            </View>
            <View style={[styles.buttonBg, { flexDirection: "row", gap: 4 }]}>
              <Image source={Images.verified} style={styles.icon} />
              <CustomText
                label="VERIFIED"
                fontFamily={fonts.semiBold}
                color={COLORS.black}
                fontSize={12}
              />
            </View>
            <View
              style={[styles.buttonBg, { backgroundColor: COLORS.lowPurple }]}
            >
              <CustomText
                label="LVL. 3"
                fontFamily={fonts.semiBold}
                color={COLORS.blue}
                fontSize={12}
              />
            </View>
          </View>

          <View
            style={[
              styles.row,
              { justifyContent: "space-between", marginTop: 16, width: "100%" },
            ]}
          >
            <CustomText
              label={`$${formatPrice(orderDetails?.orderDetails?.totalPrice)}`}
              fontFamily={fonts.bold}
              color={COLORS.black}
              fontSize={44}
            />
            <CustomButton
              title="Net without Tip"
              width="48%"
              height={32}
              fontSize={13}
              backgroundColor={COLORS.bgGray}
              color={COLORS.black}
              icon={require("../assets/images/RideWarn.png")}
            />
          </View>

          <CustomText
            label="EXPECTED DELIVERY TIME"
            fontFamily={fonts.medium}
            color={COLORS.subtitle}
            fontSize={12}
          />

          <View style={styles.map}>
            <Icons
              name="map-marker-alt"
              family="FontAwesome5"
              size={16}
              color={COLORS.black}
              style={{ marginRight: 8, marginBottom: 3 }}
            />
            <CustomText
              label={`21 min (${array?.[1]})(4.0 mi) total`}
              fontFamily={fonts.semiBold}
              color={COLORS.black}
              fontSize={16}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.mainContainer2}>
              <View style={styles.dotContainer}>
                {array.map((_, i) => (
                  <View style={{ alignItems: "center" }} key={i}>
                    <View style={styles.dot} />
                    {i === array.length - 1 ? null : (
                      <View style={styles.line} />
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.contentContainer}>
                {array.map((item, i) => (
                  <View
                    style={{ marginBottom: i === array.length - 1 ? 0 : 18 }}
                    key={i}
                  >
                    <CustomText
                      label={item}
                      fontFamily={fonts.medium}
                      lineHeight={14 * 1.4}
                      numberOfLines={2}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Icons
              family="Feather"
              name="info"
              color={COLORS.gray1}
              size={14}
              marginBottom={2}
            />
            <CustomText
              label="Confirm details with the Customer before starting."
              fontSize={12}
              color={COLORS.gray}
              fontFamily={fonts.medium}
              marginLeft={5}
            />
          </View>

          <View style={[styles.row, { justifyContent: "center", gap: 10 }]}>
            <TouchableOpacity
              onPress={onTripCancel}
              style={{
                height: 48,
                width: 48,
                borderRadius: 99,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.lightGray,
              }}
            >
              <Icons
                name="close"
                family="AntDesign"
                size={20}
                color={COLORS.red}
              />
            </TouchableOpacity>
            <CustomButton title="Accept Order" onPress={onPress} width="85%" />
          </View>
        </View>
      </View>
    </CustomModal>
  );
};

export default IntantTripModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    padding: 12,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
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
  buttonBg: {
    backgroundColor: "#1212120A",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    height: 20,
    paddingHorizontal: 8,
  },
  map: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  card: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.inputBg,
    marginVertical: 12,
  },
  mainContainer2: {
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#12121229",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 100,
    backgroundColor: COLORS.black,
  },
  dotContainer: {
    width: "8%",
  },
  contentContainer: {
    width: "92%",
  },
  line: {
    width: 1,
    height: 34,
    backgroundColor: "#12121229",
    marginVertical: 4,
  },
});
