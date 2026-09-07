import { TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const OptionSelector = ({
  arrow = "down",
  error,
  showSuccessColor,
  placeHolder,
  label,
  onPress,
  value,
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surfaceAlt }]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <CustomText
          label={label}
          color={
            error ? "#EE1045" : showSuccessColor ? "#64CD75" : colors.iconMuted
          }
          fontFamily={fonts.medium}
          fontSize={12}
          textTransform={"uppercase"}
          lineHeight={12 * 1.4}
        />
        <CustomText
          label={value || placeHolder}
          color={value ? colors.text : colors.iconMuted}
          fontFamily={value ? fonts.medium : fonts.regular}
          fontSize={16}
          marginTop={1}
        />
      </View>
      <View style={{ alignSelf: "center" }}>
        <Icons
          style={{ color: colors.iconMuted, fontSize: 20 }}
          family={arrow == "down" ? "Entypo" : "Ionicons"}
          name={arrow == "down" ? "chevron-down" : "chevron-forward-outline"}
        />
      </View>
    </TouchableOpacity>
  );
};

export default OptionSelector;

const styles = {
  container: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    height: 56,
    borderRadius: 12,
  },
};
