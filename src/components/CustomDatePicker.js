import moment from "moment";
import { useEffect, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import DatePicker from "react-native-date-picker";

import CustomText from "./CustomText";
import ErrorComponent from "./ErrorComponent";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { PNGIcons } from "../assets/images/icons";
import { COLORS } from "../utils/COLORS";
import Icons from "./Icons";
import { useTheme } from "../contexts/ThemeContext";

const CustomDatePicker = ({
  value,
  setValue,
  error,
  withLabel,
  placeholder = "Date",
  type = "date",
  maxDate,
  minDate,
  backgroundColor,
  defaultError,
  width,
  marginBottom,
  height,
  isIcon = false,
  // Figma Publish-A-Poll field: label, then a 16pt Material icon + value
  // (Medium 16), no trailing calendar button — { name, color, filled }
  leadingIcon,
}) => {
  const [isModal, setModal] = useState(false);
  const [showSuccessColor, setShowSuccessColor] = useState(false);
  const [prevError, setPrevError] = useState(error);
  const { colors, isDark } = useTheme();

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
  return (
    <>
      <TouchableOpacity
        onPress={() => setModal(true)}
        style={[
          styles.mainContainer,
          {
            marginBottom: error ? 5 : marginBottom || 0,
            borderColor: error
              ? "#EE1045"
              : showSuccessColor
              ? "#64CD75"
              : colors.surfaceAlt,
            paddingHorizontal: 12,
            backgroundColor:
              backgroundColor ||
              (error
                ? "#EE10450A"
                : showSuccessColor
                ? "#64CD750A"
                : colors.surfaceAlt),
            borderWidth: error ? 1 : 0,
            width: width || "100%",
            height: height || 56,
            flexDirection: isIcon ? "row" : "column",
            alignItems: isIcon ? "center" : "flex-start",
            justifyContent: isIcon ? "space-between" : "center",
          },
        ]}
      >
        {leadingIcon ? (
          // Figma 7572:11673 (date): label 8 → 8 → row 16, centred (32 in
          // the 56 box ⇒ top 12); 7572:11681 (hour): label 8 → 10 → row 16,
          // top-aligned at the 12 padding (34 tall; centred it would sit at
          // 11, so a 2 top margin puts it at 12). The Figma heights (label 8,
          // row 16) come from negative margins on the texts — a fixed height
          // smaller than the 1.4 line box clips the glyphs on iOS.
          <View
            style={[
              { gap: type == "date" ? 8 : 10 },
              type != "date" && { marginTop: 2 },
            ]}
          >
            {withLabel && (
              <CustomText
                label={withLabel}
                textTransform="uppercase"
                color={error ? "#EE1045" : colors.textSecondary}
                fontFamily={fonts.medium}
                fontSize={12}
                numberOfLines={1}
                marginTop={(8 - 12 * 1.4) / 2}
                marginBottom={(8 - 12 * 1.4) / 2}
              />
            )}
            <View style={[styles.dateRow, { gap: 4 }]}>
              <Icons
                family={
                  leadingIcon.filled
                    ? "MaterialSymbolsRoundedFilled"
                    : "MaterialSymbolsRounded"
                }
                name={leadingIcon.name}
                size={16}
                color={leadingIcon.color || colors.text}
              />
              <CustomText
                label={
                  value && moment(value).isValid()
                    ? moment(value).format(
                        type == "date" ? "MMMM D, YYYY" : "h:mm A",
                      )
                    : placeholder
                }
                fontSize={16}
                fontFamily={fonts.medium}
                numberOfLines={1}
                color={value ? colors.text : colors.iconMuted}
                marginTop={(16 - 16 * 1.4) / 2}
                marginBottom={(16 - 16 * 1.4) / 2}
                containerStyle={{ flexShrink: 1 }}
              />
            </View>
          </View>
        ) : null}
        <View
          style={[
            isIcon ? styles.contentContainer : null,
            leadingIcon && { display: "none" },
          ]}
        >
          {withLabel && (
            <CustomText
              label={withLabel}
              textTransform="uppercase"
              color={
                error
                  ? "#EE1045"
                  : showSuccessColor
                  ? "#64CD75"
                  : colors.textSecondary
              }
              fontFamily={fonts.medium}
              fontSize={12}
            />
          )}

          <View style={isIcon ? styles.dateRow : null}>
            {isIcon && (
              <Image
                source={Images.smallCalender}
                resizeMode="contain"
                style={{ height: 16, width: 16, marginRight: 4 }}
              />
            )}
            <CustomText
              label={
                value && moment(value).isValid()
                  ? moment(value).format(
                      type == "date" ? "MMM DD, YYYY" : "h:mm A",
                    )
                  : placeholder
              }
              fontSize={16}
              numberOfLines={1}
              // width={type == "date" ? "65%" : "100%"}
              color={
                error
                  ? "#EE1045"
                  : showSuccessColor
                  ? "#64CD75"
                  : value
                  ? colors.text
                  : colors.iconMuted
              }
            />
          </View>
        </View>

        {isIcon && !leadingIcon && (
          <TouchableOpacity style={styles.calendarButton}>
            <Image source={Images.dateIcon} style={{ height: 32, width: 32 }} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {(error || defaultError) && (
        <ErrorComponent
          error={error}
          isValid={showSuccessColor}
          errorTitle={
            showSuccessColor ? "Valid Date " : error ? error : defaultError
          }
          color={
            error
              ? "#EE1045"
              : showSuccessColor
              ? "#64CD75"
              : isDark
              ? "#FFFFFFA3"
              : colors.textSecondary
          }
          color1={error ? "#EE1045" : showSuccessColor ? "#64CD75" : ""}
          secondTitle={showSuccessColor ? "" : "PSC."}
          marginTop={error ? 0 : 4}
        />
      )}

      {isModal && (
        <DatePicker
          modal
          open={isModal}
          date={
            value && moment(value).isValid()
              ? new Date(value)
              : maxDate
              ? new Date(maxDate)
              : new Date()
          }
          onConfirm={(date) => {
            setValue(date);
            setModal(false);
          }}
          onCancel={() => setModal(false)}
          mode={type}
          theme={isDark ? "dark" : "light"}
          textColor={COLORS.black}
          buttonColor={COLORS.buttonColor}
          maximumDate={maxDate}
          minimumDate={minDate}
          confirmButtonColor={COLORS.buttonColor}
        />
      )}
    </>
  );
};
export default CustomDatePicker;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    borderRadius: 12,
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  calendarButton: {
    width: 32,
    height: 32,
  },
  rightIcon: {
    width: 20,
    height: 20,
    position: "absolute",
    right: 15,
    resizeMode: "contain",
  },
});
