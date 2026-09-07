import { Image, StyleSheet, TextInput, View } from "react-native";
import { useState, useEffect } from "react";

import ErrorComponent from "./ErrorComponent";
import CustomText from "./CustomText";
import ImageFast from "./ImageFast";
import Icons from "./Icons";

import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";
import { PNGIcons } from "../assets/images/icons";

const LocationInput = ({
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  keyboardType,
  multiline,
  maxLength,
  placeholderTextColor,
  editable,
  textAlignVertical,
  marginBottom,
  height = 55,
  autoCapitalize,
  error,
  isFocus,
  isBlur,
  width,
  onEndEditing,
  autoFocus,
  ref,
  borderRadius,
  marginTop,
  withLabel,
  isError,
  labelColor,
  borderColor = COLORS.inputBg,
  search,
  rightIcon,
  leftIcon,
  leftClock,
  leftCalendar,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hidePass, setHidePass] = useState(true);
  const [showSuccessColor, setShowSuccessColor] = useState(false);

  const [prevError, setPrevError] = useState(error);

  const handleFocus = () => {
    setIsFocused(true);
    isFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    isBlur?.();
  };

  useEffect(() => {
    // If error changed from true to false
    if (prevError && !error && !isError) {
      setShowSuccessColor(true);
      const timer = setTimeout(() => {
        setShowSuccessColor(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    // Update prevError after checking the condition
    setPrevError(error);
  }, [error, isError]); // Remove prevError from dependencies

  return (
    <View style={{ width: width || "100%" }}>
      <View
        style={{
          marginBottom: error ? 5 : marginBottom || 15,
          marginTop,
          height: height ? height : multiline ? 180 : 56,
          width: "100%",
          borderRadius: borderRadius || 12,
          paddingLeft: 10,
          paddingVertical: 5,
          justifyContent: withLabel ? "flex-start" : "center",
          backgroundColor:
            error || isError
              ? "#EE10450A"
              : showSuccessColor
              ? "#64CD750A"
              : COLORS.inputBg,
          borderColor:
            error || isError
              ? "#EE1045CC"
              : showSuccessColor
              ? "#64CD75"
              : borderColor,
          borderWidth: 1,
        }}
      >
        {withLabel && (
          <CustomText
            label={withLabel}
            color={
              labelColor ||
              (error || isError
                ? "#EE1045CC"
                : showSuccessColor
                ? "#64CD75"
                : COLORS.subtitle)
            }
            fontFamily={fonts.medium}
            fontSize={12}
            lineHeight={12 * 1.4}
            textTransform="uppercase"
          />
        )}
        <View style={[styles.mainContainer]}>
          {leftIcon && (
            <Icons
              family="FontAwesome6"
              name="location-dot"
              size={14}
              color={COLORS.black}
              style={{ marginBottom: 5, marginRight: 5 }}
            />
          )}
          {leftClock && (
            <Image
              source={PNGIcons.clock}
              size={14}
              style={{
                width: 16,
                height: 16,
                marginBottom: 5,
                marginRight: 5,
                resizeMode: "contain",
              }}
            />
          )}
          {leftCalendar && (
            <Image
              source={PNGIcons.calender}
              style={{
                width: 16,
                height: 16,
                marginBottom: 5,
                marginRight: 5,
                resizeMode: "contain",
              }}
            />
          )}

          {search ? (
            <Icons
              family="Octicons"
              name="search"
              size={22}
              color={COLORS.gray}
              style={{ marginRight: 8 }}
            />
          ) : null}

          <TextInput
            ref={ref}
            placeholder={placeholder}
            style={[
              styles.input,
              {
                flex: 1,
                paddingVertical: multiline ? 18 : 0,
                paddingLeft: search || leftIcon ? 0 : 0,
                color:
                  error || isError
                    ? "#EE1045"
                    : showSuccessColor
                    ? "#64CD75"
                    : COLORS.black,
              },
            ]}
            secureTextEntry={
              secureTextEntry ? (hidePass ? true : false) : false
            }
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            multiline={multiline}
            onEndEditing={onEndEditing}
            maxLength={maxLength}
            placeholderTextColor={placeholderTextColor}
            editable={editable}
            textAlignVertical={multiline ? "top" : textAlignVertical}
            autoCapitalize={autoCapitalize}
            autoFocus={autoFocus}
          />

          {rightIcon && (
            <View
              style={[styles.rightIconBg, { backgroundColor: rightIcon.color }]}
            >
              <ImageFast
                source={rightIcon.source}
                style={rightIcon.style}
                onPress={rightIcon.onPress}
              />
            </View>
          )}
        </View>

        {secureTextEntry && (
          <ImageFast
            source={!hidePass ? Images.eye : Images.eyeLine}
            resizeMode="contain"
            style={{
              position: "absolute",
              right: 17,
              width: 16,
              height: 16,
              top: 25,
              tintColor: "red",
            }}
            onPress={() => setHidePass(!hidePass)}
          />
        )}
      </View>
      {error && <ErrorComponent errorTitle={error} color={"#EE1045"} />}
    </View>
  );
};

export default LocationInput;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    height: "90%",
    padding: 0,
    margin: 0,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: COLORS.black,
    lineHeight: 16 * 1.4,
  },
  rightIconBg: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    position: "absolute",
    right: 12,
    top: -12,
  },
});
