import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import { accentA, getProfileAccent } from "../utils/profileTier";
import CustomText from "./CustomText";
import FloatingSheet, { SheetPrimaryButton } from "./FloatingSheet";

/**
 * Birthday greeting (client brief, Nov 13 — no Figma frame yet; built like
 * the "New Season" card he shared): the first time a user opens their own
 * profile on their birthday, confetti (LottieFiles "Confetti", assets/
 * animations/confetti.json) plays and this floating card says hi.
 *   Hi {first name}!            SemiBold 24
 *   Happy Birthday 🎉 (animated) Medium 18
 *   PSC Team wishes …           Regular 14 @64%, centred
 *   [ Close ]                   white 48 r100
 * Behind the card: blur + a gradient in a much darker version of the
 * profile accent, the same accent as the gradient inside the card.
 */
const MESSAGE =
  "The ENTIRE PSC Team wishes you a beautiful day filled with joy, laughter, and unforgettable moments! May this new chapter of your life bring you happiness, success, and wonderful surprises. Enjoy YOUR special day to the fullest! ✨❤️🎂";

const shownKey = (userId, d) =>
  `birthday_shown_${userId}_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** true when today (local) is the birthday stored in `dob` (a date-only value). */
export const isBirthdayToday = (dob, now = new Date()) => {
  if (!dob) return false;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  // dob is saved as a calendar date at 00:00 UTC — read it in UTC
  return d.getUTCMonth() === now.getMonth() && d.getUTCDate() === now.getDate();
};

/**
 * Shows the greeting once per birthday: call with the signed-in user while
 * their own profile is focused.
 */
export const useBirthdayGreeting = (user, active) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!active || !user?._id || !isBirthdayToday(user?.dob)) return undefined;
    let alive = true;
    const key = shownKey(user._id, new Date());
    (async () => {
      try {
        if (await AsyncStorage.getItem(key)) return;
        await AsyncStorage.setItem(key, "1");
      } catch (e) {
        // storage unavailable: still greet, just maybe more than once
      }
      if (alive) setVisible(true);
    })();
    return () => {
      alive = false;
    };
  }, [active, user?._id, user?.dob]);
  return [visible, () => setVisible(false)];
};

/** 🎉 that keeps popping: a small tilt + scale loop */
const PartyPopper = () => {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(3)), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(700),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.Text
      style={[
        styles.popper,
        {
          transform: [
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-14deg"] }) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) },
          ],
        },
      ]}
    >
      🎉
    </Animated.Text>
  );
};

const BirthdaySheet = ({ visible, onClose, user }) => {
  const tier = getProfileAccent(user);
  const first = user?.firstName || user?.username || "";

  return (
    <FloatingSheet
      visible={visible}
      onDismiss={onClose}
      gap={24}
      innerStyle={styles.inner}
      overlay={
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* backdrop: the accent, much darker, rising from the bottom */}
          <LinearGradient
            colors={[accentA(tier, 0), accentA(tier, 0.18), accentA(tier, 0.32)]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          {visible ? (
            <LottieView
              source={require("../assets/animations/confetti.json")}
              autoPlay
              loop={false}
              resizeMode="cover"
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </View>
      }
      header={
        <View style={styles.texts}>
          {/* inside the card: the same accent, brighter, fading down */}
          <LinearGradient
            pointerEvents="none"
            colors={[accentA(tier, 0.36), accentA(tier, 0)]}
            style={styles.cardGlow}
          />
          <CustomText
            label={`Hi ${first}!`}
            fontSize={24}
            letterSpacing={-0.48}
            fontFamily={fonts.semiBold}
            color={COLORS.white}
            textAlign="center"
          />
          <View style={styles.subtitleRow}>
            <CustomText
              label="Happy Birthday"
              fontSize={18}
              letterSpacing={-0.36}
              fontFamily={fonts.medium}
              color={COLORS.white}
            />
            <PartyPopper />
          </View>
          <CustomText
            label={MESSAGE}
            fontSize={14}
            fontFamily={fonts.regular}
            color={COLORS.gray64}
            textAlign="center"
            marginTop={12}
          />
        </View>
      }
    >
      {/* the button is flex: 1 (made for a row of buttons) */}
      <View style={styles.buttonRow}>
        <SheetPrimaryButton label="Close" onPress={onClose} />
      </View>
    </FloatingSheet>
  );
};

export default BirthdaySheet;

const styles = StyleSheet.create({
  inner: {
    paddingTop: 28,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  texts: {
    paddingHorizontal: 8,
    alignItems: "center",
  },
  cardGlow: {
    position: "absolute",
    top: -28,
    left: -20,
    right: -20,
    height: 160,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  buttonRow: { flexDirection: "row" },
  popper: {
    fontSize: 20,
  },
});
