import { View } from "react-native";
import Icons from "./Icons";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import fonts from "../assets/fonts";

const HighlightedText = ({
  textBefore = "",
  highlightedText = "",
  textAfter = "",
  highlightColor = COLORS.primary,
  fontSize = 12,
  color = COLORS.gray2,
  align = "left",
  marginLeft,
  marginRight,
  marginTop,
  marginBottom,
  highlightFontFamily,
  afterFontFamily,
}) => {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        // alignItems: "baseline",
        justifyContent:
          align === "center"
            ? "center"
            : align === "right"
            ? "flex-end"
            : "flex-start",
        marginLeft,
        marginRight,
        marginTop,
        marginBottom,
      }}
    >
      <Icons
        name={"info"}
        family={"Feather"}
        size={12}
        marginRight={4}
        color={COLORS.gray2}
        marginTop={3}
      />

      {textBefore ? (
        <CustomText
          label={textBefore}
          fontSize={fontSize}
          color={color}
          lineHeight={fontSize * 1.4}
          fontFamily={afterFontFamily}
        />
      ) : null}

      {highlightedText ? (
        <CustomText
          label={highlightedText}
          fontSize={fontSize}
          color={highlightColor || COLORS.darkPurple}
          fontFamily={highlightFontFamily || fonts.semiBold}
          lineHeight={fontSize * 1.4}
          marginLeft={textBefore ? 4 : 0}
          marginRight={textAfter ? 4 : 0}
        />
      ) : null}

      {textAfter ? (
        <CustomText
          label={textAfter}
          textTransform={"default"}
          fontSize={fontSize}
          lineHeight={fontSize * 1.4}
          color={color || COLORS.gray2}
          fontFamily={afterFontFamily || fonts.regular}
        />
      ) : null}
    </View>
  );
};

export default HighlightedText;
