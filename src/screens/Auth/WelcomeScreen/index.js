import React, { useCallback, useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomText from "../../../components/CustomText";
import CustomButton from "../../../components/CustomButton";
import ImageFast from "../../../components/ImageFast";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";
import { useSelector } from "react-redux";

// Greets the user the way they chose at registration (Addressing step):
// "lastname" -> corporate ("Hello Mr. Johnson"), otherwise friendly ("Hi James").
const getGreeting = (user) => {
  const firstName = user?.firstName?.trim();
  const lastName = user?.lastName?.trim();
  const addressing = user?.profile?.addressing;

  if (addressing === "lastname" && lastName) {
    const title =
      user?.gender === "male" ? "Mr. " : user?.gender === "female" ? "Ms. " : "";
    return `Hello ${title}${lastName}`;
  }
  if (firstName) return `Hi ${firstName}`;
  if (user?.username) return `Hi ${user.username}`;
  return "Hello";
};

const WelcomeScreen = () => {
  const { colors, isDark } = useTheme();
  const userData = useSelector((state) => state?.users?.userData);
  const user = userData?.user || userData;
  const avatar = user?.profile?.avatar;
  const navigation = useNavigation();
  const hasLeft = useRef(false);

  // Hand off to the main app. WelcomeScreen lives inside AuthStack, so reset
  // the root navigator (its parent), which owns the "MainStack" route.
  const goToHome = useCallback(() => {
    if (hasLeft.current) return;
    hasLeft.current = true;
    const root = navigation.getParent() || navigation;
    root.reset({ index: 0, routes: [{ name: "MainStack" }] });
  }, [navigation]);

  useEffect(() => {
    const timer = setTimeout(goToHome, 2500);
    return () => clearTimeout(timer);
  }, [goToHome]);

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
              source={avatar ? { uri: avatar } : Images.profile}
              style={{ width: 110, height: 110, borderRadius: 99 }}
            />
          </View>

          <CustomText
            label={getGreeting(user)}
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
            onPress={goToHome}
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
