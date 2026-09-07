import { View, StyleSheet } from "react-native";
import React from "react";

import CustomText from "./CustomText";
import ImageFast from "./ImageFast";

import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";

const DriverInfoCard = ({ vehicle, acceptedBy }) => {
  return (
    <View style={[styles.rowItem, { justifyContent: "space-between" }]}>
      <View style={[styles.rowItem, { gap: 8 }]}>
        <ImageFast
          source={Images.UserDemo}
          resizeMode={"cover"}
          style={{ width: 56, height: 56, borderRadius: 100 }}
        />
        <View>
          <CustomText
            label={`${acceptedBy?.first_name} ${acceptedBy?.sur_name}`}
            color={COLORS.black}
            fontFamily={fonts.semiBold}
            fontSize={16}
            lineHeight={16 * 1.4}
          />
          <View style={[styles.rowItem, { gap: 4 }]}>
            <View style={[styles.red, { backgroundColor: vehicle?.color }]} />
            <CustomText
              label={vehicle?.color}
              color={COLORS.black}
              fontFamily={fonts.medium}
              fontSize={12}
              lineHeight={12 * 1.4}
            />
            <View style={styles.Dotgrey} />
            <CustomText
              label={vehicle?.model}
              color={COLORS.black}
              fontFamily={fonts.medium}
              fontSize={12}
              lineHeight={12 * 1.4}
            />
          </View>
          <View style={[styles.rowItem, { gap: 4 }]}>
            <View style={styles.rating}>
              <ImageFast
                source={Images.blackStar}
                resizeMode={"contain"}
                style={{ width: 12, height: 12 }}
              />
              <CustomText
                label={vehicle?.rattingAverage || 0}
                color={COLORS.black}
                fontFamily={fonts.semiBold}
                fontSize={12}
                lineHeight={12 * 1.4}
              />
            </View>
            <View style={styles.Dotgrey} />
            <CustomText
              label={`${vehicle?.distance || 0} km`}
              color="#1212127A"
              fontFamily={fonts.medium}
              fontSize={12}
              lineHeight={12 * 1.4}
            />
            <View style={styles.Dotgrey} />
            <CustomText
              label={`${vehicle?.totalRides || 0} Rides`}
              color="#1212127A"
              fontFamily={fonts.medium}
              fontSize={12}
              lineHeight={12 * 1.4}
            />
          </View>
        </View>
      </View>

      <ImageFast
        source={
          vehicle?.vehicleImages?.length > 0
            ? { uri: vehicle?.vehicleImages?.[0] }
            : Images.DemoCar
        }
        resizeMode="cover"
        style={{ height: 56, width: 90 }}
      />
    </View>
  );
};

export default DriverInfoCard;

const styles = StyleSheet.create({
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  red: {
    width: 10,
    height: 10,
    borderRadius: 100,
  },
  Dotgrey: {
    backgroundColor: "#12121229",
    width: 3,
    height: 3,
    borderRadius: 100,
  },
  rating: {
    paddingRight: 4,
    paddingLeft: 2,
    paddingVertical: 2,
    backgroundColor: "#1212120A",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    width: 38,
  },
});
