import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import CustomText from "./CustomText";
import Icons from "./Icons";
import ImageFast from "./ImageFast";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import { useTheme, isDark } from "../contexts/ThemeContext";
import ErrorComponent from "./ErrorComponent";

const CustomInputTextOnly = ({
  placeholder,
  value,
  withLabel,
  labelColor,
  borderColor = COLORS.inputBg,
  width,
  height = 56,
  marginBottom,
  marginTop,
  borderRadius,
  paddingVertical,
  search,
  Isicon,
  iconSrc,
  isClear,
  onChangeText,
  error,
  cardInfo,
  icColabe,
  islocation,
  collabNames = [],
  onPress,
  placeholderColor,
}) => {
  const { colors } = useTheme();
  const resolvedPlaceholderColor = placeholderColor || colors.textSecondary;
  const [showSuccessColor, setShowSuccessColor] = useState(false);
  const [prevError, setPrevError] = useState(error);

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

  const displayColor = error
    ? "#EE1045"
    : showSuccessColor
    ? "#64CD75"
    : colors.text;

  return (
    <TouchableOpacity onPress={onPress} style={{ width: width || "100%" }}>
      <View
        style={{
          marginBottom: marginBottom || 8,
          marginTop,
          height: height,
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
            ? "#EE1045CC"
            : showSuccessColor
            ? "#64CD75"
            : colors.surfaceAlt,
          borderWidth: error ? 1 : 0,
        }}
      >
        {withLabel && (
          <CustomText
            label={withLabel}
            color={
              labelColor ||
              (error
                ? "#EE1045CC"
                : showSuccessColor
                ? "#64CD75"
                : colors.textSecondary)
            }
            fontFamily={fonts.medium}
            fontSize={12}
            textTransform={"uppercase"}
            marginTop={8}
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

          {islocation ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Icons
                family={"Ionicons"}
                name={"location"}
                size={14}
                color={colors.text}
              />
              {/* <ImageFast
                source={Images.LocationPin}
                resizeMode={"contain"}
                style={{
                  width: 10,
                  height: 13,
                  opacity: !value && 0.6,
                }}
              /> */}
              <CustomText
                label={value?.length ? value : placeholder || ""}
                color={value?.length ? displayColor : colors.iconMuted}
                fontFamily={fonts.regular}
                fontSize={16}
                marginLeft={0}
                numberOfLines={1}
                width={290}
                style={{ paddingVertical: paddingVertical }}
              />
            </View>
          ) : icColabe && collabNames && collabNames.length > 0 ? (
            <>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                {collabNames.slice(0, 2).map((name, idx) => (
                  <View
                    key={`${name}-${idx}`}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    {idx > 0 && (
                      <CustomText
                        label={","}
                        color={colors.text}
                        fontFamily={fonts.medium}
                        fontSize={16}
                      />
                    )}
                    <CustomText
                      label={name}
                      color={colors.text}
                      fontFamily={fonts.medium}
                      fontSize={16}
                    />
                    <ImageFast
                      source={Images.verified}
                      style={{ width: 14, height: 14 }}
                    />
                  </View>
                ))}
                {collabNames.length > 2 && (
                  <>
                    <CustomText
                      label={" and "}
                      color={colors.text}
                      fontFamily={fonts.medium}
                      fontSize={16}
                    />
                    <CustomText
                      label={`${collabNames.length - 2}`}
                      color={colors.text}
                      fontFamily={fonts.medium}
                      fontSize={16}
                    />
                  </>
                )}
              </View>
            </>
          ) : (
            <CustomText
              label={value?.length ? value : placeholder || ""}
              color={
                value?.length
                  ? displayColor
                  : placeholder
                  ? resolvedPlaceholderColor
                  : colors.text
              }
              fontFamily={fonts.regular}
              fontSize={16}
              marginLeft={search ? 8 : 0}
              style={{ paddingVertical: paddingVertical }}
            />
          )}

          {isClear && value?.length > 0 && (
            <ImageFast
              source={Images.clear}
              resizeMode="contain"
              style={{
                width: 22,
                height: 22,
                marginRight: 10,
                backgroundColor: COLORS.white,
              }}
              onPress={() => {
                onChangeText?.("");
              }}
            />
          )}
        </View>

        {Isicon ? (
          <View
            style={{
              backgroundColor: iconSrc ? "#A1937529" : "transparent",
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
                width: iconSrc ? 16 : 14,
                height: iconSrc ? 16 : 14,
              }}
            />
          </View>
        ) : null}
      </View>

      {cardInfo && <ErrorComponent errorTitle={cardInfo} />}
      {error && (
        <ErrorComponent
          errorTitle={error}
          color="#EE1045"
          error={error}
          marginBottom={4}
        />
      )}
    </TouchableOpacity>
  );
};

export default CustomInputTextOnly;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // flex: 1,
    height: 24,
  },
});
