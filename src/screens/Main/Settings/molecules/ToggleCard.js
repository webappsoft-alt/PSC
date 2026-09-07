import { StyleSheet, Image, View, TouchableOpacity } from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import CustomToggle from "../../../../components/CustomToggle";
import ImageFast from "../../../../components/ImageFast";
import { Images } from "../../../../assets/images";
import CustomCheckBox from "../../../../components/CustomCheckBox";
import { useTheme } from "../../../../contexts/ThemeContext";

const ToggleCard = ({
  title,
  subtitle,
  bgColor,
  value,
  setValue,
  marginTop,
  marginBottom,
  marginHorizontal,
  isBorder,
  subtitleFontSize = 12,
  isUser,
  isOption,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.row,
        {
          padding: 12,
          backgroundColor: bgColor || colors.surface,
          marginTop,
          marginBottom,
          marginHorizontal,
          borderRadius: 12,
          borderBottomWidth: isBorder ? 1 : 0,
          borderColor: isBorder ? colors.surfaceAlt : "transparent",
        },
      ]}
    >
      {isUser ? (
        <ImageFast source={Images.person} style={styles.image} />
      ) : null}
      <View style={{ maxWidth: "85%", flex: 1 }}>
        <View style={styles.row}>
          <CustomText
            label={title || "Push notifications"}
            fontFamily={fonts.medium}
            fontSize={16}
          />
          {isUser && (
            <>
              <Image source={Images.verified} style={styles.icon} />
              <Image source={Images.goldenStar} style={styles.icon} />
              <CustomText
                label={"username"}
                fontSize={10}
                color={colors.textSecondary}
                marginLeft={4}
              />
            </>
          )}
        </View>

        <View style={styles.row}>
          <CustomText
            label={
              subtitle ||
              "Get push notifications to find out what’s going on when you’re not on PSC."
            }
            fontSize={subtitleFontSize}
            color={colors.textSecondary}
          />
          {isUser && (
            <>
              <View
                style={[styles.dot, { backgroundColor: colors.textSecondary }]}
              />
              <CustomText
                label={"2"}
                fontSize={10}
                color={colors.textSecondary}
                marginLeft={4}
                marginRight={2}
              />
              <ImageFast source={Images.friendGray} style={[styles.icon]} />
            </>
          )}
        </View>
      </View>
      <View style={{ width: "15%", alignItems: "flex-end" }}>
        {isOption ? (
          <CustomCheckBox value={value || false} onValueChange={setValue} />
        ) : (
          <CustomToggle
            activeColor={COLORS.buttonColor}
            inactiveColor={colors.iconMuted}
            value={value}
            setValue={setValue}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ToggleCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    // justifyContent: "space-between",
    alignItems: "center",
  },
  image: {
    height: 40,
    width: 40,
    borderRadius: 99,
    marginRight: 8,
  },
  icon: {
    height: 14,
    width: 14,
    marginLeft: 2,
  },
  dot: {
    height: 4,
    width: 4,
    borderRadius: 99,
    backgroundColor: COLORS.subtitle,
    marginLeft: 4,
  },
});
