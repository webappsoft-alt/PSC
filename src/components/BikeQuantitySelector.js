import { useState } from "react";
import { StyleSheet, View } from "react-native";
import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import CustomButton from "./CustomButton";
import CustomText from "./CustomText";

const BikeQuantitySelector = ({
  title = "HOW MANY BIKES",
  onQuantityChange,
  initialQuantity = 1,
  maxQuantity = 7,
  marginTop
}) => {
  const [selectedQuantity, setSelectedQuantity] = useState(initialQuantity);

  const handleQuantitySelect = (quantity) => {
    setSelectedQuantity(quantity);
    if (onQuantityChange) {
      onQuantityChange(quantity);
    }
  };

  const renderQuantityButton = (number) => {
    const isSelected = selectedQuantity === number;
    const displayText =
      number === maxQuantity ? `+${number}` : number.toString();

    return (
      <CustomButton
        key={number}
        title={displayText}
        onPress={() => handleQuantitySelect(number)}
        backgroundColor={isSelected ? COLORS.black : "#1212120A"}
        color={isSelected ? COLORS.white : COLORS.black}
        width={40}
        height={40}
        borderRadius={22.5}
        fontSize={14}
        fontFamily={fonts.medium}
        borderWidth={isSelected ? 0 : 1}
        borderColor={COLORS.border}
        customStyle={styles.quantityButton}
      />
    );
  };

  return (
    <View style={[styles.container, {marginTop: marginTop}]}>
      <CustomText
        label={title}
        fontSize={12}
        color={"#121212A3"}
        lineHeight={12 * 1.4}
        fontFamily={fonts.medium}
      />
      <View style={styles.buttonsContainer}>
        {Array.from({ length: maxQuantity }, (_, index) =>
          renderQuantityButton(index + 1)
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  title: {
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop:12,
  },
  quantityButton: {
    marginRight: 0,
    marginBottom: 0,
  },
});

export default BikeQuantitySelector;
