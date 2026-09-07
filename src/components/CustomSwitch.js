import { StyleSheet, View } from "react-native";
import ToggleSwitch from "toggle-switch-react-native";
import { COLORS } from "../utils/COLORS";

const CustomSwitch = ({
  setValue,
  value,
  marginRight,
  marginLeft,
  marginBottom,
  bgColor,
}) => {
  return (
    <View
      style={[
        styles.switchContainer,
        { marginLeft, marginRight, marginBottom },
      ]}
    >
      <ToggleSwitch
        isOn={value}
        onToggle={setValue}
        size="medium"
        onColor="#000"
        offColor="#000"
        thumbOnStyle={{
          backgroundColor: "#fff",
          height: 27,
          width: 27,
          borderRadius: 100,
          marginLeft: 2,
        }}
        thumbOffStyle={{
          backgroundColor: "#fff",
          height: 27,
          width: 27,
          borderRadius: 100,
          marginLeft: 2,
        }}
        trackOnStyle={{
          backgroundColor: bgColor || "#A19375",
          height: 31,
          width: 51,
          borderRadius: 100,
        }}
        trackOffStyle={{
          backgroundColor: COLORS.inputBg,
          height: 31,
          width: 51,
          borderRadius: 100,
        }}
      />
    </View>
  );
};

export default CustomSwitch;

const styles = StyleSheet.create({
  switchContainer: {
    // width: 48,
    // flexDirection: "row",
    // alignItems: "center",
  },
});
