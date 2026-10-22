import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";

import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import PromptLayout from "../../../components/Auth/PromptLayout";
import {
  ClubLockup,
  belowBase,
  capTop,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";
import fonts from "../../../assets/fonts";

// Greets the user the way they chose at registration (Addressing step):
// "lastname" -> corporate ("Hello Mr. Johnson"), otherwise friendly ("Hi James").
const getGreeting = (user) => {
  const firstName = user?.firstName?.trim();
  const lastName = user?.lastName?.trim();
  const addressing = user?.profile?.addressing;

  if (user?.role === "company" && firstName) return `Hello ${firstName}`;
  if (addressing === "lastname" && lastName) {
    const title =
      user?.gender === "male" ? "Mr. " : user?.gender === "female" ? "Ms. " : "";
    return `Hello ${title}${lastName}`;
  }
  if (firstName) return `Hi ${firstName}`;
  if (user?.username) return `Hi ${user.username}`;
  return "Hello";
};

/**
 * Figma "Accept-notifications" 2314:8778 (Welcome): club lockup, avatar 120
 * in a F5F5F5 ring, greeting, "Welcome back!" pill — then into the app.
 */
const WelcomeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const p = useAuthPalette();
  const userData = useSelector((state) => state?.users?.userData);
  const user = userData?.user || userData;
  const avatar = user?.profile?.avatar;
  const fresh = !!route?.params?.fresh;
  const hasLeft = useRef(false);

  // WelcomeScreen lives in AuthStack; the root navigator owns "MainStack".
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
    <PromptLayout variant="notif">
      <View style={styles.center}>
        <ClubLockup gap={32} />
        <View style={[styles.avatarRing, { marginTop: 48 }]}>
          {avatar ? (
            <ImageFast
              source={{ uri: avatar }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: p.t08 }]}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="person"
                size={56}
                color={p.t64}
              />
            </View>
          )}
        </View>
        <CustomText
          label={getGreeting(user)}
          fontSize={24}
          fontFamily={fonts.medium}
          color={p.text}
          textAlign="center"
          marginTop={24 - capTop(24)}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={goToHome}
          style={[
            styles.pill,
            { backgroundColor: p.t16, marginTop: 24 - belowBase(24) },
          ]}
        >
          <CustomText
            label={fresh ? "Welcome!" : "Welcome back!"}
            fontSize={18}
            fontFamily={fonts.medium}
            color={p.text}
          />
        </TouchableOpacity>
      </View>
    </PromptLayout>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 100,
    borderWidth: 3.16,
    borderColor: "#F5F5F5",
    padding: 6 - 3.16,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
  },
  avatarEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    height: 43,
    borderRadius: 100,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
