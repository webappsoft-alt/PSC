import { BlurView } from "@react-native-community/blur";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { COLORS } from "../utils/COLORS";

const CustomBlurComponent = ({
  width = 200,
  height = 200,
  borderRadius = 100,
  padding = 4,
  reducedTransparencyFallbackColor,
  backgroundColor = COLORS.white,
  blurAmount = 2,
  alignSelf = "flex-start",
  blurType,
  onPress,
  marginTop,
  marginBottom,
  marginRight,
  marginLeft,
  children,
  maxWidth,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.6}
      style={[
        styles.container,
        {
          ...(maxWidth ? { maxWidth } : { width }),
          height,
          borderRadius,
          alignSelf,
          marginTop,
          marginBottom,
          marginRight,
          marginLeft,
        },
      ]}
    >
      <BlurView
        style={[styles.blurView, { borderRadius }]}
        blurType={blurType || "light"}
        blurAmount={blurAmount}
        reducedTransparencyFallbackColor={
          reducedTransparencyFallbackColor || "white"
        }
      />

      <View
        style={[
          styles.contentArea,
          {
            margin: padding,
            backgroundColor: backgroundColor,
            borderRadius: Math.max(0, borderRadius - padding / 2) - 2,
          },
        ]}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFFFFF29",
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentArea: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",
  },
});

export default CustomBlurComponent;
