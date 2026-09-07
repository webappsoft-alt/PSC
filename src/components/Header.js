import { useNavigation } from "@react-navigation/native";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import CustomText from "./CustomText";
import Icons from "./Icons";

import fonts from "../assets/fonts";
import { PNGIcons } from "../assets/images/icons";
import { COLORS } from "../utils/COLORS";
import Blur from "./Blur";
import { useTheme } from "../contexts/ThemeContext";

const Header = ({
  title,
  hideBackArrow,
  onBackPress,
  textColor,
  backgroundColor,
  marginTop,
  fontFamily,
  marginBottom,
  textAlign,
  isClear,
  onClearPress,
  onHelpPress,
  rightIcon,
  borderWidth,
  borderColor,
  iconBackgroundColor,
  isImage,
  onCartPress,
  paddingTop,
  search,
}) => {
  const navigation = useNavigation();
  const { colors, themeMode } = useTheme();

  const canGoBack = () => {
    try {
      return navigation.canGoBack();
    } catch (error) {
      console.log("canGoBack error:", error);
      return false;
    }
  };

  const handleGoBack = () => {
    try {
      if (canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      console.log("goBack error:", error);
    }
  };

  return (
    <View
      style={[
        styles.mainContainer,
        {
          backgroundColor,
          marginTop,
          marginBottom,
          paddingTop: paddingTop || 10,
        },
      ]}
    >
      <View style={styles.row}>
        {hideBackArrow ? null : (
          <TouchableOpacity
            activeOpacity={0.6}
            style={[
              styles.backIcon,
              {
                backgroundColor: iconBackgroundColor || colors.surfaceAlt,
                borderWidth,
                borderColor: borderColor || colors.surfaceAlt,
                overflow: "hidden",
              },
            ]}
            onPress={onBackPress ? onBackPress : handleGoBack}
          >
            <Blur blurType={themeMode === "dark" ? "dark" : "xlight"} />
            <Icons
              name="keyboard-arrow-left"
              family="MaterialIcons"
              size={26}
              color={textColor || colors.iconMuted}
            />
          </TouchableOpacity>
        )}
        {isImage && (
          <Image
            source={isImage}
            style={{
              width: 40,
              height: 40,
              borderRadius: 100,
              marginRight: 16,
            }}
          />
        )}
        <CustomText
          label={title}
          color={textColor ? textColor : colors.text}
          fontFamily={fontFamily || fonts.semiBold}
          textTransform="capitalize"
          textAlign={textAlign}
          fontSize={20}
          lineHeight={20 * 1.4}
        />
      </View>
      <View style={styles.row}>
        {onHelpPress ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onHelpPress}
            style={[styles.help, { backgroundColor: colors.surfaceAlt }]}
          >
            <CustomText
              label="Help"
              fontFamily={fonts.medium}
              fontSize={16}
              lineHeight={16 * 1.4}
              marginRight={6}
              marginTop={-3}
            />
            <Icons
              name="help-circle"
              family="Feather"
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        ) : onCartPress ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onCartPress}
            style={styles.cart}
          >
            <CustomText
              label="My Cart"
              fontWeight={500}
              color={COLORS.black}
              lineHeight={14 * 1.4}
              fontFamily={fonts.semiBold}
            />
            <Image
              source={PNGIcons.bag}
              tintColor={COLORS.black}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>
        ) : null}
        {isClear ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onClearPress}
            style={styles.clear}
          >
            <CustomText
              label="Clear All"
              color={COLORS.white}
              fontFamily={fonts.medium}
              fontSize={14}
              lineHeight={14 * 1.4}
            />
          </TouchableOpacity>
        ) : null}
        {rightIcon}
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 24,
    marginLeft: 10,
  },
  help: {
    flexDirection: "row",
    alignContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.inputBg,
    borderRadius: 100,
  },
  cart: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 10,
    backgroundColor: COLORS.inputBg,
    borderRadius: 100,
  },

  clear: {
    backgroundColor: COLORS.black,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 100,
    height: 32,
  },
});
