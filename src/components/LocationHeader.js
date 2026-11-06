import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import GlassBackButton from "./GlassBackButton";
import { PNGIcons } from "../assets/images/icons";
import CustomText from "./CustomText";
import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";

const LocationHeader = ({ isVisible }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.mainContainer}>
      <GlassBackButton
        onPress={() => navigation.goBack()}
        fill={COLORS.white}
        size={48}
        iconSize={26}
        color={COLORS.darkPurple}
        fullOpacity
        style={styles.backIcon}
      />
      <TouchableOpacity
        onPress={isVisible}
        activeOpacity={0.8}
        style={styles.titleContainer}
      >
        <View style={styles.row}>
          <Image source={PNGIcons.pin} style={styles.pinIcon} />
          <CustomText
            fontSize={16}
            numberOfLines={1}
            fontFamily={fonts.medium}
            lineHeight={16 * 1.4}
            label="Chemin du Centurion 11, 1209, Gen"
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <CustomText
            label="12.10.25 - 12.10.25"
            fontFamily={fonts.medium}
            fontSize={12}
            color={"#121212A3"}
            lineHeight={12 * 1.4}
          />
          <View style={styles.dot}></View>
          <CustomText
            label="2 Cars"
            fontFamily={fonts.medium}
            fontSize={12}
            color={"#121212A3"}
            lineHeight={12 * 1.4}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default LocationHeader;

const styles = StyleSheet.create({
  mainContainer: {
    padding: 12,
    marginTop: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "absolute",
  },
  backIcon: {
    marginRight: 10,
  },
  titleContainer: {
    backgroundColor: "#FFFFFFA3",
    width: "84%",
    height: 56,
    borderRadius: 12,
    padding: 12,
    flex: 1,
    paddingRight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  pinIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
    marginLeft: -2,
    tintColor: COLORS.black,
    resizeMode: "contain",
  },

  dot: {
    backgroundColor: "#12121229",
    width: 3,
    height: 3,
    borderRadius: 100,
  },
});
