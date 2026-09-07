import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const SelectLocation = ({
  type = "loc",
  error,
  showSuccessColor,
  placeholder,
  value,
  onPress,
  code,
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surfaceAlt }]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={{ flex: 1, marginTop: 8 }}>
        <CustomText
          label={type == "loc" ? "Location" : "Country"}
          color={
            error ? "#EE1045" : showSuccessColor ? "#64CD75" : colors.iconMuted
          }
          fontFamily={fonts.medium}
          fontSize={12}
          textTransform={"uppercase"}
          lineHeight={12 * 1.4}
        />
        <View style={[styles.row, { gap: 4 }]}>
          {type == "loc" && (
            <Image
              resizeMode="contain"
              source={Images.LocationPin}
              style={[styles.icon, { tintColor: colors.text }]}
            />
          )}
          <CustomText
            label={value || placeholder}
            color={value ? colors.text : colors.iconMuted}
            fontFamily={value ? fonts.medium : fonts.regular}
            fontSize={16}
            lineHeight={16 * 1.4}
            numberOfLines={1}
            marginRight={28}
          />
        </View>
      </View>
      <View style={{ alignSelf: "center" }}>
        {type == "loc" ? (
          <View style={styles.locationIcon}>
            <Image source={Images.LocationArrow} style={styles.icon} />
          </View>
        ) : (
          <Icons
            style={{ color: colors.iconMuted, fontSize: 20 }}
            family="Entypo"
            name="chevron-down"
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default SelectLocation;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    marginBottom: 8,
    height: 56,
  },
  locationIcon: {
    height: 32,
    width: 32,
    borderRadius: 99,
    backgroundColor: "#A1937529",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    height: 16,
    width: 16,
    resizeMode: "contain",
    // tintColor: COLORS.white,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 1,
  },
  roundFlagContainer: {
    height: 16,
    width: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  roundFlag: {
    height: "100%",
    width: "100%",
    borderRadius: 14,
  },
});
