import { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  TouchableOpacity,
  View,
} from "react-native";

import CustomText from "./CustomText";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../assets/fonts";
import { useTheme } from "../contexts/ThemeContext";
import { COLORS } from "../utils/COLORS";
import Blur from "./Blur";

const CustomButton = ({
  onPress,
  title,
  disabled,
  loading,
  customStyle,
  customText,
  marginBottom = 0,
  marginTop,
  backgroundColor,
  color,
  width = "100%",
  height = 52,
  borderRadius = 99,
  justifyContent = "center",
  alignItems = "center",
  flexDirection = "row",
  alignSelf = "center",
  fontSize = 17.1429,
  indicatorColor,
  marginRight,
  borderWidth,
  borderColor,
  fontFamily,
  loadingSize,
  mainStyle,
  icon,
  icnWidth,
  icnHeight,
  rightIcon,
  rightIconWidth,
  rightIconHeight,
  isBoarder = false,
  secondBorderColor,
  bgBlur,
  secondText,
  iconColor,
  textTransform,
  marginLeft,
  isBottom = false,
  textMarginLeft,
}) => {
  const insets = useSafeAreaInsets();
  const [animation] = useState(new Animated.Value(1));
  const { colors, isDark } = useTheme();
  const mb = isBottom ? insets.bottom : 0;

  const handlePressIn = () => {
    Animated.spring(animation, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animation, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        mainStyle,

        {
          transform: [{ scale: animation }],
          width,
          alignSelf,
          marginBottom: mb + marginBottom,
          marginRight,
          borderRadius,
          marginLeft,
        },
        isBoarder
          ? {
              borderWidth: 1,
              borderColor: secondBorderColor || "#1212127A",
              borderRadius: 100,
              padding: 4,
            }
          : {},
      ]}
    >
      <TouchableOpacity
        disabled={loading || disabled}
        activeOpacity={0.8}
        style={[
          {
            backgroundColor: disabled
              ? isDark
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(0, 0, 0, 0.12)"
              : bgBlur
              ? "transparent"
              : backgroundColor
              ? backgroundColor
              : COLORS.buttonColor,
            marginTop,
            width: "100%",
            height: isBoarder ? 44 : height,
            borderRadius,
            flexDirection,
            alignItems,
            justifyContent,
            borderWidth,
            borderColor,
            overflow: "hidden",
          },
          customStyle,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {bgBlur ? (
          <Blur blurAmount={2} borderRadius={10} />
        ) : // <ImageFast
        //   removeLoading
        //   source={Images.buttonBg}
        //   style={{
        //     width: "100%",
        //     height: "100%",
        //     borderRadius: 100,
        //     position: "absolute",
        //   }}
        // />
        null}

        {loading && (
          <ActivityIndicator
            size={loadingSize || 25}
            color={indicatorColor || color || COLORS.primaryColor}
          />
        )}

        {!loading && (
          <View style={{ alignItems: "center", marginLeft: textMarginLeft }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {icon && (
                <Image
                  source={icon}
                  style={{
                    width: icnWidth || 20,
                    height: icnHeight || 20,
                    resizeMode: "contain",
                    marginRight: 5,
                    tintColor: iconColor,
                  }}
                />
              )}
              <CustomText
                textStyle={customText}
                label={title}
                color={
                  color ||
                  (disabled
                    ? isDark
                      ? "rgba(255, 255, 255, 0.38)"
                      : "rgba(0, 0, 0, 0.38)"
                    : COLORS.primaryColor)
                }
                fontFamily={fontFamily || fonts.medium}
                fontSize={fontSize}
                lineHeight={fontSize * 1.4}
                textTransform={textTransform || "capitalize"}
              />
            </View>

            {secondText && (
              <CustomText
                label={secondText}
                color={color || "#AAAAAA"}
                fontSize={12}
                lineHeight={12 * 1.4}
                textTransform="capitalize"
                textAlign={"center"}
              />
            )}
          </View>
        )}

        {rightIcon && (
          <Image
            source={rightIcon}
            style={{
              width: rightIconWidth || 18,
              height: rightIconHeight || 18,
              resizeMode: "contain",
              marginLeft: 5,
            }}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default CustomButton;
