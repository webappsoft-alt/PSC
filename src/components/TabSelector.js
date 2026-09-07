import { StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../assets/fonts";
import CustomText from "./CustomText";
import { COLORS } from "../utils/COLORS";

const TabSelector = ({
  tabs = [],
  selectedTab,
  onTabSelect,
  style,
  buttonStyle,
  activeButtonStyle,
  inactiveButtonStyle,
  textStyle,
  activeTextStyle,
  inactiveTextStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      {tabs.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.button,
            buttonStyle,
            selectedTab === item
              ? [styles.activeButton, activeButtonStyle]
              : [styles.inactiveButton, inactiveButtonStyle],
          ]}
          onPress={() => onTabSelect(item)}
        >
          <CustomText
            label={item}
            fontFamily={fonts.medium}
            lineHeight={14 * 1.4}
            color={selectedTab === item ? COLORS.white : COLORS.black}
            style={[
              textStyle,
              selectedTab === item ? activeTextStyle : inactiveTextStyle,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: COLORS.black,
  },
  inactiveButton: {
    backgroundColor: COLORS.lightGray,
  },
});

export default TabSelector;