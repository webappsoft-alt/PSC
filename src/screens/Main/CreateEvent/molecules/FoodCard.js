import { useState, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { PNGIcons } from "../../../../assets/images/icons";
import CustomCheckbox from "../../../../components/CustomCheckBox";
import CustomInput from "../../../../components/CustomInput";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";
import HighlightedText from "../../../../components/HighlightedText";
import { useSelector } from "react-redux";
import { useTheme } from "../../../../contexts/ThemeContext";
const FoodCard = ({
  value,
  onValueChange,
  image,
  inputValue,
  brandName,
  title,
  volume = 250,
  onc = 0.4,
  category = ["ve", "v", "gf", "sf"],
  currentPrice,
  productId,
  onQuantityChange,
  onPriceChange,
  initialQuantity = 1,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const location = useSelector((state) => state.users.location);
  const [count, setCount] = useState(initialQuantity);
  const [unitPrice, setUnitPrice] = useState(inputValue || "");
  // Calculate percentage difference with ±100% cap
  const calculatePercentage = () => {
    if (!unitPrice || !currentPrice) return 0;
    const unitPriceNum = parseFloat(unitPrice.replace("$", "")) || 0;
    const currentPriceNum =
      parseFloat(currentPrice.toString().replace("$", "")) || 0;
    if (currentPriceNum === 0) return 0;
    const percentage =
      ((unitPriceNum - currentPriceNum) / currentPriceNum) * 100;
    // Cap the percentage at ±100%
    if (percentage > 100) {
      return 100;
    }
    if (percentage < -100) {
      return -100;
    }
    return Math.round(percentage);
  };
  const percentageDifference = calculatePercentage();
  // Update unitPrice when inputValue changes from parent
  useEffect(() => {
    setUnitPrice(inputValue || "");
  }, [inputValue]);
  // Update count when initialQuantity changes from parent
  useEffect(() => {
    setCount(initialQuantity);
  }, [initialQuantity]);
  const handleQuantityChange = (newCount) => {
    setCount(newCount);
    if (onQuantityChange) {
      onQuantityChange(productId, newCount);
    }
  };
  const handlePriceChange = (price) => {
    setUnitPrice(price);
    if (onPriceChange) {
      onPriceChange(productId, price);
    }
  };
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onValueChange}
        style={styles.mainContainer}
      >
        <View style={styles.image}>
          <ImageFast
            source={image ? { uri: image } : PNGIcons.bottle}
            style={styles.food}
          />
        </View>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View>
            <CustomText
              label={brandName || "Evian"}
              fontSize={14}
              lineHeight={12 * 1.4}
              fontFamily={fonts.medium}
            />
            <CustomText
              label={title || "Natural Water"}
              fontSize={12}
              lineHeight={12 * 1.4}
              color={colors.iconMuted}
            />
            <View style={styles.boxRow}>
              <CustomText
                label={`${volume} ml`}
                fontSize={12}
                lineHeight={12 * 1.4}
              />
              <CustomText
                label={`${onc} FL OZ`}
                fontSize={10}
                lineHeight={10 * 1.4}
                color={colors.iconMuted}
              />
            </View>
          </View>
          <View style={styles.boxRow}>
            {category?.map((cat, index) => {
              const colorMap = {
                ve: "#37B874",
                v: "#F7941F",
                gf: "#776A3D",
                sf: colors.primaryColor,
              };
              return (
                <View
                  key={index}
                  style={[
                    styles.box,
                    { backgroundColor: colorMap[cat.toLowerCase()] },
                  ]}
                >
                  <CustomText
                    label={cat.toUpperCase()}
                    fontSize={8}
                    lineHeight={8 * 1.4}
                    fontFamily={fonts.semiBold}
                    color={COLORS.black}
                    textAlign="center"
                  />
                </View>
              );
            })}
          </View>
        </View>
        <View style={{ justifyContent: "center" }}>
          <CustomCheckbox
            borderColor={colors.iconMuted}
            borderRadius={99}
            value={value}
            onValueChange={onValueChange}
            bgColor={colors.btnColor || COLORS.btnColor}
          />
        </View>
      </TouchableOpacity>
      {value && (
        <>
          <CustomInput
            value={unitPrice}
            onChangeText={handlePriceChange}
            marginTop={12}
            withLabel={"Unit Price"}
            placeholder={"$2.00"}
          />
          <HighlightedText
            color={percentageDifference >= 0 ? COLORS.green : COLORS.red}
            textBefore={`${
              percentageDifference >= 0 ? "+" : ""
            }${percentageDifference}%`}
            highlightedText="of the Chauffeurs’ market."
            highlightColor={colors.iconMuted}
            highlightFontFamily={fonts.regular}
            afterFontFamily={fonts.medium}
          />
          <HighlightedText
            color={colors.btnColor || COLORS.btnColor}
            textAfter={
              `${
                location?.currency ? location?.currency?.symbol : "$"
              }${currentPrice}` || "$1.25"
            }
            highlightedText="Current market rate is of:"
            highlightColor={colors.iconMuted}
            highlightFontFamily={fonts.regular}
            afterFontFamily={fonts.medium}
            marginBottom={12}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  padding: 4,
                  backgroundColor:
                    count < 8 ? "#EE1045" : count < 15 ? "#F7941F" : "#37B874",
                  width: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                  marginRight: 6,
                }}
              >
                <CustomText
                  label={count < 8 ? "LOW" : count < 15 ? "OKAY" : "GOOD"}
                  color={COLORS.white}
                  fontSize={10}
                  lineHeight={10 * 1.4}
                  fontFamily={fonts.semiBold}
                />
              </View>
              <CustomText
                label={"Available Stock."}
                fontSize={12}
                lineHeight={12 * 1.4}
                color={colors.iconMuted}
              />
            </View>
            <View style={styles.incrementContainer}>
              <TouchableOpacity
                onPress={() => handleQuantityChange(Math?.max(1, count - 1))}
                style={styles.circleButton}
              >
                <CustomText label={"−"} fontSize={24} lineHeight={24 * 1.4} />
              </TouchableOpacity>
              <View style={styles.countContainer}>
                <CustomText
                  label={count}
                  fontFamily={fonts.medium}
                  fontSize={16}
                  lineHeight={16 * 1.4}
                />
              </View>

              <TouchableOpacity
                onPress={() => handleQuantityChange(count + 1)}
                style={styles.circleButton}
              >
                <CustomText fontSize={24} lineHeight={24 * 1.4} label={"+"} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </>
  );
};
export default FoodCard;
const createStyles = (colors) => StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
  },
  image: {
    height: 80,
    width: 80,
    backgroundColor: colors.cardColor,
    marginRight: 8,
  },
  food: {
    height: "100%",
    width: "100%",
    borderRadius: 4,
  },
  boxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  box: {
    height: 16,
    width: 16,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
  },
  incrementContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  circleButton: {
    height: 32,
    width: 32,
    borderRadius: 99,
    backgroundColor: colors.cardColor,
    justifyContent: "center",
    alignItems: "center",
  },
  countContainer: {
    width: 48,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardColor,
    borderRadius: 8,
  },
});
