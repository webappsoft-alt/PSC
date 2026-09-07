import { StyleSheet, Image, TouchableOpacity, View } from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import ImageFast from "../../../../components/ImageFast";
import { PNGIcons } from "../../../../assets/images/icons";
import { COLORS } from "../../../../utils/COLORS";

const PortableFridgeCard = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.mainContainer}>
      <View style={styles.row}>
        <ImageFast
          source={PNGIcons.fridge}
          style={{ height: 32, width: 32, marginRight: 8 }}
        />
        <CustomText
          label={"Get a Portable Fridge"}
          fontFamily={fonts.medium}
          fontSize={16}
          lineHeight={16 * 1.4}
        />
      </View>
      <View style={styles.row}>
        <CustomText
          label={"See THE OFFER"}
          fontFamily={fonts.semiBold}
          color={COLORS.gray1}
          fontSize={12}
          lineHeight={12 * 1.4}
        />
        <View style={styles.forwardContainer}>
          <Image
            source={PNGIcons.forward}
            style={{
              height: 14,
              width: 14,
              tintColor: COLORS.darkPurple,
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PortableFridgeCard;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  forwardContainer: {
    height: 16,
    width: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
    backgroundColor: COLORS.lightGray,
    marginLeft: 4,
  },
});
