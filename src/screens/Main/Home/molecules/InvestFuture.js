import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import ImageFast from "../../../../components/ImageFast";

const InvestFuture = ({ onPress }) => {
  return (
    <View style={styles.mainContainer}>
      <View style={[styles.row, { marginBottom: 12 }]}>
        <Image source={Images.futureAi} style={{ height: 14, width: 14 }} />
        <CustomText
          label={"INVEST"}
          color={COLORS.gray2}
          fontFamily={fonts.medium}
        />
        <CustomText
          label={"IN THE FUTURE"}
          color={COLORS.white}
          fontFamily={fonts.medium}
        />

        <Image
          source={Images.investCross}
          style={{ height: 16, width: 16, marginLeft: "auto" }}
        />
      </View>
      <ImageFast
        onPress={onPress}
        removeLoading
        style={{ height: 190, width: "100%" }}
        source={Images.InvestBg}
        resizeMode="contain"
      >
        {/* <View style={styles.purpleInner}>
          <CustomText
            label={
              "We are a non-profit company aiming to provide better services and products to Humans across the world. You can take part of this journey and leverage our shared ascension."
            }
            textTransform={"uppercase"}
            fontFamily={fonts.medium}
            fontSize={12}
            marginTop={10}
          />
          <CustomText
            label={"Up to 60% ROI."}
            fontFamily={fonts.semiBold}
            fontSize={24}
            marginTop={10}
            marginBottom={10}
          />

          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <CustomText
              label={"Thank you!"}
              fontFamily={fonts.medium}
              fontSize={12}
              textTransform={"uppercase"}
            />
            <Image
              source={Images.sign}
              style={{ height: 24, width: 90 }}
              resizeMode="contain"
            />
          </View>
        </View> */}
      </ImageFast>
    </View>
  );
};

export default InvestFuture;

const styles = StyleSheet.create({
  mainContainer: { backgroundColor: COLORS.black, paddingHorizontal: 12, marginBottom:12 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  purple: {
    borderWidth: 2,
    borderColor: "#AF2FFF",
    borderRadius: 12,
  },
  purpleInner: {
    borderRadius: 10,
    justifyContent: "center",
  },
});
