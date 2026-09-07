import { Image, StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";

const InfoCard = ({ name, showIcon, type, marginBottom = 20 }) => {
  return (
    <View style={[styles.container, { marginBottom: marginBottom }]}>
      {showIcon && <Image source={Images.music} style={styles.icon} />}
      <CustomText
        label={name}
        fontFamily={fonts.medium}
        color={COLORS.white}
        fontSize={14}
      />
    </View>
  );
};

export default InfoCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#313131",
    borderRadius: 99,
    paddingVertical: 7,
    paddingHorizontal: 12.8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  icon: {
    height: 12,
    width: 12,
    tintColor: COLORS.white,
    resizeMode: "contain",
    marginRight: 4,
  },
});
