import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import Icons from "./Icons";
import ImageFast from "./ImageFast";
import { useTheme } from "../contexts/ThemeContext";
import Blur from "./Blur";

const SearchInput = ({
  placeholder,
  value,
  onChangeText,
  maxLength,
  marginBottom,
  isFocus,
  isBlur,
  autoFocus,
  ref,
  marginTop,
  isBack,
  onPress,
  editable,
  elevation,
  withLabel,
  isCross,
  CrossPress,
  CrossPressBack,
  isChange, // 🔹 new prop
  CameraPress, // 🔹 optional handler
  isHi = false,
  width,
  source,
  height,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleFocus = () => {
    setIsFocused(true);
    isFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    isBlur?.();
  };

  const showCross = isCross && value?.trim().length > 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", width, gap: 8 }}>
      {withLabel && (
        <CustomText
          label={withLabel}
          fontFamily={fonts.medium}
          fontSize={18}
          marginBottom={4}
        />
      )}
      <View
        style={[
          styles.mainContainer,
          {
            marginBottom,
            marginTop,
            borderColor: isFocused ? colors.text : colors.surfaceAlt,
            backgroundColor: colors.surfaceAlt,
            elevation,
            height,
          },
        ]}
      >
        {isBack && (
          <Icons
            family="Ionicons"
            name="arrow-back-outline"
            color={colors.text}
            size={25}
            style={{ marginRight: 10 }}
            onPress={() => navigation.goBack()}
          />
        )}

        {/* Search Icon */}
        <TouchableOpacity
          disabled
          style={[
            styles.searchIcon,
            isChange && {
              // backgroundColor: COLORS.inputBg,
              width: 36,
              height: 44,
              borderRadius: 99,
              marginRight: 5,
              marginLeft: -5,
            },
          ]}
          activeOpacity={0.6}
          onPress={onPress}
        >
          {isHi ? (
            <Image source={Images.hi} style={{ height: 16, width: 16 }} />
          ) : (
            <Icons
              family="Ionicons"
              name="search"
              color={colors.textSecondary}
              size={20}
            />
          )}
        </TouchableOpacity>

        {/* Input */}
        <TextInput
          ref={ref}
          placeholder={placeholder}
          style={[styles.input, { color: colors.text }]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          cursorColor={COLORS.buttonColor}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          placeholderTextColor={colors.textSecondary}
          autoFocus={autoFocus}
          editable={editable}
        />

        {/* If isChange is true → show Cross + Camera inside */}
        {showCross && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* {isCross   && ( */}
            <TouchableOpacity activeOpacity={0.6} onPress={CrossPress}>
              <Image
                source={Images.crossGray}
                style={{ height: 22, width: 22 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {/* )} */}
            {/* <TouchableOpacity
              onPress={CameraPress}
              style={styles.inlineIcon}
              activeOpacity={0.6}
            >
              <Icons
                family="Feather"
                name="camera"
                size={22}
                color={COLORS.gray1}
              />
            </TouchableOpacity> */}
          </View>
        )}
      </View>
      {isCross && (
        <TouchableOpacity
          onPress={CrossPressBack}
          style={{ overflow: "hidden", borderRadius: 99 }}
        >
          {/* <Blur /> */}
          <Image
            source={source || Images.crossBg}
            style={{
              height: 44,
              width: 44,
              tintColor: colors.text,
            }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchInput;

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: COLORS.inputBg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 99,
    flex: 1,
  },
  input: {
    flex: 1,
    height: "100%",
    padding: 0,
    margin: 0,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: COLORS.white,
  },
  searchIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  inlineIcon: {
    marginLeft: 5,
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
});
