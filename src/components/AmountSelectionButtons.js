import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import CustomText from "./CustomText";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";

/**
 * AmountSelectionButtons component for selecting predefined amount values
 * @param {Array} amounts - Array of amount strings to display as options
 * @param {string} selectedAmount - Currently selected amount
 * @param {function} onSelectAmount - Callback function when an amount is selected
 * @param {function} onCustomAmountChange - Callback function to update custom amount input
 * @param {number} gap - Gap between buttons (default: 10)
 * @param {Object} containerStyle - Additional styles for the container
 */
const AmountSelectionButtons = ({
  amounts = [],
  selectedAmount = "",
  onSelectAmount,
  onCustomAmountChange,
  gap = 10,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, { gap }, containerStyle]}>
      {amounts?.map((item, index) => {
        const isSelected = selectedAmount === item;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.amountButton, isSelected && styles.selectedButton]}
            onPress={() => {
              onSelectAmount(item);
              if (onCustomAmountChange && typeof item === "string") {
                if (
                  item.charAt(0) === "$" ||
                  item.charAt(0) === "€" ||
                  item.charAt(0) === "£"
                ) {
                  onCustomAmountChange(item.substring(1));
                } else {
                  onCustomAmountChange(item);
                }
              }
            }}
          >
            <CustomText
              label={item}
              fontFamily={fonts.medium}
              color={isSelected ? COLORS.white : COLORS.black}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default AmountSelectionButtons;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  amountButton: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 100,
    padding: 12,
    paddingHorizontal: 16,
  },
  selectedButton: {
    backgroundColor: COLORS.black,
  },
});
