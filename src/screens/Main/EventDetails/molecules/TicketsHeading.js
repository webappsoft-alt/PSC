import {StyleSheet, View} from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import Text from "../../../../components/ScaledText";

const TicketsHeading = ({ title, subTitle }) => {
  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 20 }}>
      <CustomText label={title} fontFamily={fonts.semiBold} fontSize={22} />
      <CustomText label={subTitle} color={COLORS.gray48} fontSize={14} />
    </View>
  );
};

export default TicketsHeading;

const styles = StyleSheet.create({});
