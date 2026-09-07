import { StyleSheet, TextInput, View } from "react-native";
import { useState, useEffect } from "react";

import CustomText from "./CustomText";
import ImageFast from "./ImageFast";
import Icons from "./Icons";

import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";
import ErrorComponent from "./ErrorComponent";

const CutomInputWithIcon = ({
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  keyboardType,
  multiline,
  maxLength,
  placeholderTextColor = COLORS.gray,
  placeholderFontSize,
  placeholderFontFamily,
  inputFontSize = 16,
  inputFontFamily = fonts.regular,
  inputColor = COLORS.black,
  editable,
  textAlignVertical,
  marginBottom,
  height = 60,
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
  borderWidth,
  search,
  backgroundColor,
  isValid,
  showValidation = false,
  showCurrencySymbol = false,
  currencySymbol = "$",
  currencySymbolColor,
  currencySymbolFontSize,
  currencySymbolFontFamily,
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
            error || isError ? "#EE1045CC" : showSuccessColor ? "#64CD75" : borderColor,
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
                : '#121212A3')
            }
            fontFamily={fonts.medium}
            fontSize={12}
            textTransform={"uppercase"}
          />
        )}
        <View style={[styles.mainContainer]}>
          {search ? (
            <Icons
              family="Octicons"
              name="search"
              size={22}
              color={COLORS.gray}
            />
          ) : null}

          <TextInput
            ref={ref}
            placeholder={placeholder}
            style={[
              styles.input,
              {
                width: (secureTextEntry || showValidation) ? "91%" : "99%",
                paddingVertical: multiline ? 18 : 0,
                paddingLeft: search ? 8 : 0,
                color:
                  error || isError
                    ? "#EE1045"
                    : showSuccessColor
                    ? "#64CD75"
                    : inputColor,
                fontSize: inputFontSize,
                fontFamily: inputFontFamily,
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
        {showValidation && (
          <ImageFast
            source={isValid ? Images.valid : Images.invalid}
            resizeMode="contain"
            style={{
              position: "absolute",
              right: 17,
              width: 20,
              height: 20,
              top: withLabel ? 30 : 12,
            }}
          />
        )}
      </View>
      {error && <ErrorComponent errorTitle={error} color={"#EE1045"} />}
    </View>
  );
};

export default CutomInputWithIcon;

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
  },
});
