import { useNavigation } from "@react-navigation/native";
import {Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View} from "react-native";

import CustomButton from "../CustomButton";
import CustomText from "../CustomText";
import Icons from "../Icons";

import fonts from "../../assets/fonts";
import { PNGIcons } from "../../assets/images/icons";
import { COLORS } from "../../utils/COLORS";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "../../assets/images";
import { useTheme } from "../../contexts/ThemeContext";
import Text from "../ScaledText";

const AuthFooter = ({
  onPress,
  marginTop,
  onBackPress,
  isMain,
  title,
  btnTitle,
  loading,
  btnLoading,
  marginBottom,
  btnDisabled,
  secondText,
  btnSize,
  btnFamily,
  titleSize = 14,
  isCalender = false,
  isBoarder,
  secondBorderColor,
  btnBackgroundColor,
  btnColor,
  textColor,
  iconColor = COLORS.primaryColor,
  iconBackgroundColor,
  paddingHorizontal,
  backImage,
}) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.mainContainer,
        {
          marginTop,
          marginBottom:
            (marginBottom || 0) +
            insets.bottom -
            (Platform.OS == "ios" ? 15 : 0),

          paddingHorizontal: paddingHorizontal,
        },
      ]}
    >
      <View style={styles.row}>
        <TouchableOpacity
          onPress={
            onBackPress
              ? onBackPress
              : () => navigation.canGoBack() && navigation.goBack()
          }
          style={[
            styles.backButton,
            {
              backgroundColor: iconBackgroundColor || (isDark ? "#1b1b1b" : colors.surfaceAlt),
            },
          ]}
        >
          <Image
            source={backImage || Images.back}
            style={{ height: 28, width: 28, tintColor: isDark ? undefined : colors.text }}
          />
        </TouchableOpacity>
        <CustomButton
          title={btnTitle || "Continue"}
          width={isCalender ? "70%" : "84%"}
          onPress={onPress}
          loading={loading || btnLoading}
          disabled={btnDisabled}
          secondText={secondText}
          fontSize={btnSize || 18}
          fontFamily={btnFamily}
          isBoarder={isBoarder}
          backgroundColor={btnBackgroundColor}
          color={btnColor}
          secondBorderColor={secondBorderColor}
          height={48}
        />
        {isCalender ? (
          <TouchableOpacity
            style={[styles.backButton, { marginRight: 0, marginLeft: 8 }]}
          >
            <Image
              source={PNGIcons.calender}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View
        style={[
          styles.row,
          { alignSelf: "center", marginVertical: 10, marginTop: 6 },
        ]}
      >
        {!isMain && (
          <Icons
            name={"info"}
            family={"Feather"}
            size={12}
            marginRight={4}
            color={isDark ? COLORS.gray2 : colors.textSecondary}
          />
        )}

        {isMain ? (
          <CustomText
            label={title}
            color={textColor || (isDark ? COLORS.gray5 : colors.textSecondary)}
            fontSize={titleSize}
            lineHeight={titleSize * 1.4}
            fontFamily={fonts.medium}
            textAlign="center"
          />
        ) : (
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.regular,
              color: isDark ? COLORS.gray2 : colors.textSecondary,
              lineHeight: 20,
            }}
          >
            By pressing
            <Text style={[styles.darkText, { color: isDark ? COLORS.white : colors.text }]}> Continue </Text>
            you agree with
            <Text style={[styles.darkText, { color: isDark ? COLORS.white : colors.text }]}> PSC </Text>
            <Text
              style={[styles.darkText, { color: isDark ? COLORS.white : colors.text, textDecorationLine: "underline" }]}
            >
              TOS
            </Text>
            .
          </Text>
        )}
      </View>
    </View>
  );
};

export default AuthFooter;

const styles = StyleSheet.create({
  mainContainer: {
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
  },
  backButton: {
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
    marginRight: 8,
  },
  darkText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: COLORS.white,
  },
});
