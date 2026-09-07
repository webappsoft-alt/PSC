import { Dimensions, Image, StyleSheet, View } from "react-native";

import CustomText from "./CustomText";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";

const NoDataFound = ({ title, marginTop, source, desc, height = 400 }) => {
  return (
    <View style={[styles.mainContainer, { height }]}>
      <Image
        style={[styles.image, { marginTop: marginTop || 80 }]}
        source={source || Images.noShow}
      />
      <CustomText
        label={title || "noDataFound"}
        textTransform={"default"}
        fontFamily={fonts.semiBold}
        fontSize={18}
        lineHeight={18 * 1.4}
        textAlign="center"
        marginTop={12}
      />
      <CustomText
        label={desc}
        fontFamily={fonts.medium}
        fontSize={16}
        textAlign="center"
        color={COLORS.authText}
        lineHeight={16 * 1.4}
      />
    </View>
  );
};

export default NoDataFound;

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: Dimensions.get("window").width - 40,
    paddingHorizontal: 35,
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
});
