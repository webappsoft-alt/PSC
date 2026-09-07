import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import CustomText from "./CustomText";
import Icons from "./Icons";
import ImageFast from "./ImageFast";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import { useTheme } from "../contexts/ThemeContext";
import ErrorComponent from "./ErrorComponent";
import { BlurView } from "@react-native-community/blur";
import Text from "./ScaledText";

const CustomInput = ({
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
  height = 56,
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
  labelColor,
  borderColor,
  search,
  isSwitch,
  cardInfo,
  isClear,
  paddingVertical,
  Isicon,
  iconSrc,
  paddingBottom = 0,
  returnKeyType,
  onSubmitEditing,
  Blur,
  blurRadius,
  publishPost,
  errorMarginBottom,
  enableMentionHighlight = false,
}) => {
  const { colors } = useTheme();
  const resolvedPlaceholderColor = placeholderTextColor || colors.iconMuted;
  const resolvedBorderColor = borderColor || colors.surfaceAlt;
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
    if (prevError && !error) {
      setShowSuccessColor(true);
      const timer = setTimeout(() => {
        setShowSuccessColor(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    setPrevError(error);
  }, [error]);

  // Function to render text with highlighted mentions
  const renderTextWithMentions = () => {
    if (!enableMentionHighlight || !value) {
      return null;
    }

    const parts = [];
    let lastIndex = 0;
    const mentionRegex = /@\S+/g;
    let match;

    while ((match = mentionRegex.exec(value)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          text: value.substring(lastIndex, match.index),
          isMention: false,
        });
      }

      // Add mention
      parts.push({
        text: match[0],
        isMention: true,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push({
        text: value.substring(lastIndex),
        isMention: false,
      });
    }

    return (
      <Text
        style={[
          styles.input,
          {
            width: secureTextEntry ? "91%" : isSwitch ? "80%" : "99%",
            paddingVertical: paddingVertical,
            paddingLeft: search ? 8 : 0,
            color: error
              ? "#EE1045"
              : showSuccessColor
              ? "#64CD75"
              : colors.text,
            position: "absolute",
            pointerEvents: "none",
          },
        ]}
      >
        {parts.map((part, index) => (
          <Text
            key={index}
            style={{
              color: part.isMention
                ? "#007BFF"
                : error
                ? "#EE1045"
                : showSuccessColor
                ? "#64CD75"
                : colors.text,
            }}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <View style={{ width: width || "100%" }}>
      <View
        style={{
          marginBottom: marginBottom || 8,
          paddingBottom: withLabel ? 6 : paddingBottom,
          marginTop,
          height: height ? height : multiline ? 180 : 70,
          width: "100%",
          borderRadius: borderRadius || 12,
          paddingLeft: 12,
          justifyContent: withLabel ? "flex-start" : "center",
          backgroundColor: error
            ? "#EE10450A"
            : showSuccessColor
            ? "#64CD750A"
            : colors.surfaceAlt,
          borderColor: error
            ? "#EE1045"
            : showSuccessColor
            ? "#64CD75"
            : resolvedBorderColor,
          borderWidth: error ? 1 : 0,
          overflow: blurRadius && "hidden",
        }}
      >
        {Blur && (
          <BlurView
            blurType="light"
            blurAmount={32}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: blurRadius || 12,
            }}
          />
        )}
        {withLabel && (
          <CustomText
            label={withLabel}
            color={
              labelColor ||
              (error
                ? "#EE1045"
                : showSuccessColor
                ? "#64CD75"
                : colors.textSecondary)
            }
            fontFamily={fonts.medium}
            fontSize={12}
            textTransform={"uppercase"}
            marginTop={8}
            lineHeight={12 * 1.4}
          />
        )}
        <View style={[styles.mainContainer]}>
          {search ? (
            <Icons
              family="MaterialIcons"
              name="search"
              size={26}
              color={colors.textSecondary}
            />
          ) : null}

          <TextInput
            ref={ref}
            cursorColor={COLORS.buttonColor}
            placeholder={placeholder}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            style={[
              styles.input,
              {
                width: secureTextEntry ? "91%" : isSwitch ? "80%" : "99%",
                paddingVertical: paddingVertical,
                paddingLeft: search ? 8 : 0,
                color: enableMentionHighlight
                  ? "transparent"
                  : error
                  ? "#EE1045"
                  : showSuccessColor
                  ? "#64CD75"
                  : colors.text,
              },
            ]}
            secureTextEntry={
              secureTextEntry ? (hidePass ? true : false) : false
            }
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value ?? ""}
            onChangeText={(t) => onChangeText?.(t)}
            keyboardType={keyboardType}
            multiline={multiline}
            onEndEditing={onEndEditing}
            maxLength={maxLength}
            placeholderTextColor={
              error
                ? "#EE1045"
                : showSuccessColor
                ? "#64CD75"
                : resolvedPlaceholderColor
            }
            editable={editable ?? true}
            textAlignVertical={multiline ? "top" : textAlignVertical}
            autoCapitalize={autoCapitalize}
            autoFocus={autoFocus}
          />

          {/* Render highlighted text overlay */}
          {enableMentionHighlight && renderTextWithMentions()}

          {isClear && value?.length > 0 && (
            <ImageFast
              source={Images.crossGray}
              resizeMode="contain"
              style={{
                width: 22,
                height: 22,
                marginRight: 12,
              }}
              onPress={() => {
                onChangeText?.("");
                isClear?.();
              }}
            />
          )}
        </View>
        {secureTextEntry && (
          <Icons
            name={hidePass ? "eye" : "eye-off"}
            family={"Ionicons"}
            color={colors.iconMuted}
            style={{
              position: "absolute",
              right: 17,
              top: 18,
              zIndex: 999,
            }}
            size={22}
            onPress={() => setHidePass(!hidePass)}
          />
        )}
        {Isicon ? (
          <View
            style={{
              backgroundColor: iconSrc ? colors.primary + "29" : "transparent",
              height: 32,
              width: 32,
              borderRadius: 100,
              position: "absolute",
              right: 10,
              zIndex: 999,
              top: withLabel ? 12 : 17,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ImageFast
              resizeMode={"contain"}
              source={iconSrc || Images.Arrow}
              style={{
                width: iconSrc ? 16 : 6,
                height: iconSrc ? 16 : 11,
              }}
            />
          </View>
        ) : null}
        {publishPost && (
          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <View style={[styles.row, { gap: 4 }]}>
              <View style={styles.publishButtonCard}>
                <ImageFast
                  source={Images.magic}
                  style={{ height: 12, width: 12 }}
                />
                <CustomText
                  label={"Correct"}
                  fontSize={12}
                  fontFamily={fonts.medium}
                />

                <View
                  style={[
                    styles.row,
                    {
                      backgroundColor: "rgba(161, 147, 117, 0.16)",
                      padding: 4,
                      paddingVertical: 2,
                      borderRadius: 99,
                    },
                  ]}
                >
                  <CustomText
                    label={"3"}
                    fontSize={12}
                    marginRight={1}
                    color={"rgba(161, 147, 117, 1)"}
                  />
                  <ImageFast
                    removeLoading
                    source={Images.publishDot}
                    style={styles.dot}
                  />
                </View>
              </View>
              <View style={styles.publishButtonCard}>
                <ImageFast
                  source={Images.magicAi}
                  style={{ height: 12, width: 12 }}
                />
                <CustomText
                  label={"Rephrase"}
                  fontSize={12}
                  fontFamily={fonts.medium}
                />
                <View
                  style={[
                    styles.row,
                    {
                      backgroundColor: "rgba(161, 147, 117, 0.16)",
                      padding: 4,
                      paddingVertical: 2,
                      borderRadius: 99,
                    },
                  ]}
                >
                  <CustomText
                    label={"3"}
                    fontSize={12}
                    marginRight={1}
                    color={"rgba(161, 147, 117, 1)"}
                  />
                  <ImageFast
                    removeLoading
                    source={Images.publishDot}
                    style={styles.dot}
                  />
                </View>
              </View>
            </View>

            {/* <ImageFast
              source={Images.micBg}
              style={{ height: 36, width: 36, marginRight: 8 }}
            /> */}
          </View>
        )}
      </View>
      {cardInfo && (
        <ErrorComponent
          errorTitle={cardInfo}
          marginBottom={errorMarginBottom}
        />
      )}
      {error && (
        <ErrorComponent
          errorTitle={error}
          color="#EE1045CC"
          error={error}
          marginBottom={4}
          font={fonts.regular}
        />
      )}
    </View>
  );
};

export default CustomInput;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  input: {
    height: "100%",
    padding: 0,
    margin: 0,
    fontFamily: fonts.regular,
    fontSize: 16,
    flex: 1,
  },
  publishButtonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 8,
    gap: 6,
    borderRadius: 99,
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    height: 14,
    width: 14,
  },
});
