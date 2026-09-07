import { StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../assets/fonts";
import CustomText from "./CustomText";
import Icons from "./Icons";
import { COLORS } from "../utils/COLORS";

const DateTimeBox = ({
  label,
  date,
  onPress,
  style,
  iconColor = COLORS.darkPurple,
  showIcon = true,
}) => {
  return (
    <View style={[styles.box, style]}>
      <View>
        <CustomText
          fontSize={12}
          marginBottom={2}
          label={label}
          lineHeight={1.4 * 12}
          color={COLORS.subtitle}
          fontFamily={fonts.medium}
        />
        <View style={styles.row}>
          <Icons name={"calendar"} family={"Entypo"} size={16} />
          <CustomText
            fontSize={16}
            lineHeight={1.4 * 16}
            label={date}
            fontFamily={fonts.medium}
          />
        </View>
      </View>
      {showIcon && (
        <TouchableOpacity style={styles.icon} onPress={onPress}>
          <Icons
            size={14}
            name={"calendar"}
            family={"Entypo"}
            color={iconColor}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.lightGray,
    padding: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  icon: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.low,
    borderRadius: 50,
    width: 32,
    height: 32,
  },
});

export default DateTimeBox;