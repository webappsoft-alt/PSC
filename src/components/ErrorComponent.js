import { StyleSheet, View } from "react-native";

import CustomText from "./CustomText";
import Icons from "./Icons";

import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import { useTheme } from "../contexts/ThemeContext";
import Text from "./ScaledText";

const ErrorComponent = ({
  errorTitle,
  color,
  marginBottom,
  alignSelf,
  marginTop,
  secondTitle,
  error,
  color1,
  isValid,
  hideInfo,
  numberOfLines,
  TextWidth,
  infoTop,
  highlight,
  font,
}) => {
  const { colors } = useTheme();
  const defaultColor = color || colors.iconMuted;
  return (
    <View style={[styles.row, { marginBottom, alignSelf, marginTop }]}>
      {hideInfo ? null : (
        <Icons
          family={isValid ? "Ionicons" : error ? "Entypo" : "Feather"}
          name={
            isValid ? "checkmark-circle" : error ? "circle-with-cross" : "info"
          }
          size={12}
          marginRight={4}
          color={defaultColor}
          marginTop={infoTop || 1}
        />
      )}

      <Text
        numberOfLines={numberOfLines}
        style={{
          fontSize: 12,
          color: defaultColor,
          width: TextWidth,
          textTransform: "none",
        }}
      >
        {errorTitle}
        <Text
          style={{
            fontSize: 12,
            fontFamily: font || fonts.medium,
            color: colors.text,
            width: TextWidth,
            textTransform: "none",
          }}
        >
          {highlight}
        </Text>
      </Text>

      <CustomText
        label={secondTitle}
        fontSize={12}
        color={color1 || colors.text}
        fontFamily={fonts.medium}
      />
    </View>
  );
};

export default ErrorComponent;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderRadius: 8,
  },
});
