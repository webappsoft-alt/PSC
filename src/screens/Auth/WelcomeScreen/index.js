import React from "react";
import { StyleSheet, View } from "react-native";
import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomText from "../../../components/CustomText";
import CustomButton from "../../../components/CustomButton";
import ImageFast from "../../../components/ImageFast";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";

const WelcomeScreen = () => {
  const { colors, isDark } = useTheme();
  return (
    <ScreenWrapper
      paddingHorizontal={24}
      backgroundImage={isDark ? Images.authBg : undefined}
      imageBottom={0}
    >
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <CustomText
          label={"Private"}
          color={isDark ? COLORS.white : colors.text}
          fontFamily={fonts.medium}
          fontSize={40}
          lineHeight={40 * 1.4}
        />
        <CustomText
          label={"Social Club."}
          color={COLORS.buttonColor}
          fontFamily={fonts.medium}
          fontSize={40}
          lineHeight={40 * 1.4}
        />

        <View style={[styles.badge, { backgroundColor: isDark ? "#FFFFFF29" : "rgba(18, 18, 18, 0.08)", borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(18, 18, 18, 0.12)" }]}>
          <CustomText
            label={"GITEX Exclusive Access"}
            color={isDark ? COLORS.white : colors.text}
            fontFamily={fonts.medium}
            fontSize={10}
            lineHeight={10 * 1.4}
          />
        </View>

        <View style={{ alignItems: "center", marginTop: 40 }}>
          {/* <View style={styles.avatarOuter}> */}
          <View style={[styles.avatarInner, { borderColor: isDark ? COLORS.white : colors.border }]}>
            <ImageFast
              source={Images.profile}
              style={{ width: 110, height: 110, borderRadius: 99 }}
            />
          </View>

          <CustomText
            label={"Hello Mr. Myles"}
            color={isDark ? COLORS.white : colors.text}
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            marginTop={18}
          />

          <CustomButton
            title={"Welcome back!"}
            backgroundColor={isDark ? "#2B2B2B" : colors.surfaceAlt}
            color={isDark ? COLORS.white : colors.text}
            width={200}
            height={43}
            borderRadius={28}
            marginTop={12}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF29",
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderRadius: 99,
    marginTop: 16,
  },
  avatarOuter: {
    width: 160,
    height: 160,
    borderRadius: 160 / 2,
    backgroundColor: "#FFFFFF33",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    borderRadius: 99,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 3,
  },
});
