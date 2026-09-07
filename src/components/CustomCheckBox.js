import { StyleSheet, TouchableOpacity, View } from "react-native";

import Icons from "./Icons";

import { COLORS } from "../utils/COLORS";
import { useTheme } from "../contexts/ThemeContext";

const CustomCheckbox = ({ value, onValueChange }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.checkboxContainer, { borderColor: colors.gray48 }]}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
    >
      {value && (
        <View
          style={{
            backgroundColor: COLORS.buttonColor,
            height: "100%",
            width: "100%",
            borderRadius: 99,
          }}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkboxContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 20,
    height: 20,
    borderWidth: 2,
    padding: 3,
    overflow: "hidden",
    borderRadius: 100,
    borderColor: COLORS.gray48,
  },
  checkbox: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    backgroundColor: COLORS.black,
  },
});

export default CustomCheckbox;
