import { StyleSheet, View } from "react-native";
import React from "react";

import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import DualText from "../../../../components/DualText";

import { Images } from "../../../../assets/images";
import { COLORS } from "../../../../utils/COLORS";
import fonts from "../../../../assets/fonts";

const SignatureComponent = () => {
  return (
    <View>
      <View style={styles.row}>
        <CustomText
          label={`move.`}
          fontSize={40}
          fontFamily={fonts.bold}
          color={COLORS.white}
          alignSelf={"center"}
        />
        <CustomButton
          title={"BETA"}
          height={20}
          width={36}
          backgroundColor={COLORS.white}
          color={COLORS.black}
          fontSize={10}
        />
      </View>
      <DualText
        title={"By"}
        secondTitle={"Viktor Sola"}
        marginTop={-8}
        marginBottom={2}
      />

      <ImageFast
        source={Images.sign}
        style={{ height: 30, width: 160 }}
        resizeMode={"contain"}
      />
    </View>
  );
};

export default SignatureComponent;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
