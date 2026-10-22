import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import CustomText from "../../../components/CustomText";
import PinPad from "../../../components/Auth/PinPad";
import {
  PscLockup,
  belowBase,
  capTop,
  ls,
  textGap,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";
import fonts from "../../../assets/fonts";
import { post } from "../../../services/ApiRequest";
import { ToastMessage } from "../../../utils/ToastMessage";
import {
  PROFILE_PIN_LENGTH,
  saveProfilePin,
  verifyProfilePin,
} from "../../../utils/profileLock";
import { openSavedAccount } from "../../../utils/accountSession";

/**
 * The PIN typed on the "define" step, kept for the "confirm" step that follows.
 * Module scope on purpose: route params are serialised and logged.
 */
let pendingPin = null;

const SUBTITLE = {
  define: "Define a PIN code",
  confirm: "Confirm PIN Code",
  enter: "Enter you PIN Code",
};

/**
 * Verification (Figma Define / Confirm / Enter-Your-PIN-Code).
 *
 * params:
 *  mode    — "define" | "confirm" | "enter"
 *  purpose — "register": after sign-up; saves the PIN on the server
 *            (user/create-pin) and locally, then continues the onboarding.
 *            "profile": from the profile selector; `accountId` is the saved
 *            account to open.
 */
const PinVerification = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const p = useAuthPalette();

  const users = useSelector((s) => s?.users);
  const currentUserId = users?.userData?._id || users?.userData?.id;
  const token = useSelector((s) => s?.authConfig?.token);

  const mode = route?.params?.mode || "enter";
  const purpose = route?.params?.purpose || "profile";
  const accountId = String(route?.params?.accountId || currentUserId || "");
  const savedAccounts = Array.isArray(users?.savedAccounts)
    ? users.savedAccounts
    : [];
  const account = savedAccounts.find((a) => String(a?.id) === accountId);

  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    if (mode === "define") pendingPin = null;
    return () => {
      mounted.current = false;
    };
  }, [mode]);

  const fail = (message, after) => {
    setError(true);
    if (message) ToastMessage(message, "error");
    setTimeout(() => {
      if (!mounted.current) return;
      setValue("");
      setError(false);
      after?.();
    }, 800);
  };

  /** Hands the session to the picked account (if needed) and enters the app. */
  const enterApp = async () => {
    const live = token && String(currentUserId) === accountId;
    if (!live) {
      const ok = await openSavedAccount(dispatch, account);
      if (!ok) {
        ToastMessage("Session expired. Please log in again.", "error");
        navigation.reset({
          index: 0,
          routes: [{ name: "AuthStack", params: { screen: "Login" } }],
        });
        return;
      }
    }
    navigation.reset({ index: 0, routes: [{ name: "MainStack" }] });
  };

  const handleComplete = useCallback(
    async (pin) => {
      if (submitting.current) return;
      submitting.current = true;
      try {
        if (mode === "define") {
          pendingPin = pin;
          navigation.push("PinVerification", {
            ...route.params,
            mode: "confirm",
          });
          setTimeout(() => mounted.current && setValue(""), 300);
          return;
        }

        if (mode === "confirm") {
          if (!pendingPin || pin !== pendingPin) {
            fail("PIN codes don't match. Try again.", () =>
              navigation.goBack(),
            );
            return;
          }
          setBusy(true);
          if (purpose === "register") {
            await post("user/create-pin", { pin });
            saveProfilePin(dispatch, users, accountId, pin);
            pendingPin = null;
            // This screen lives in the root stack; the slides are in AuthStack.
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "AuthStack",
                  params: { screen: "OnboardingSlide", params: { index: 0 } },
                },
              ],
            });
            return;
          }
          saveProfilePin(dispatch, users, accountId, pin);
          pendingPin = null;
          await enterApp();
          return;
        }

        // enter
        if (!verifyProfilePin(users, accountId, pin)) {
          fail("Incorrect PIN code");
          return;
        }
        setBusy(true);
        await enterApp();
      } catch (err) {
        setBusy(false);
        fail(err?.message || "Something went wrong. Please try again.");
      } finally {
        submitting.current = false;
      }
    },
    [mode, purpose, accountId, users, token, currentUserId, account],
  );

  const onChange = (next) => {
    setError(false);
    setValue(next);
    if (next.length === PROFILE_PIN_LENGTH) handleComplete(next);
  };

  return (
    <View style={[styles.screen, { backgroundColor: p.deep }]}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (82 - 44),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <PscLockup />
        <CustomText
          label="Verification"
          fontSize={32}
          fontFamily={fonts.semiBold}
          letterSpacing={ls(-2, 32)}
          textAlign="center"
          color={p.text}
          marginTop={32 - capTop(32)}
        />
        <CustomText
          label={SUBTITLE[mode] || SUBTITLE.enter}
          fontSize={14}
          letterSpacing={ls(-2, 14)}
          textAlign="center"
          color={p.t64}
          marginTop={textGap(20, 32, 14)}
          marginBottom={32 - belowBase(14)}
        />

        <PinPad
          value={value}
          onChange={onChange}
          length={PROFILE_PIN_LENGTH}
          error={error}
          disabled={busy}
        />

        {busy ? (
          <ActivityIndicator
            size="small"
            color={p.text}
            style={styles.below}
          />
        ) : mode === "enter" && purpose === "profile" ? (
          <TouchableOpacity
            style={styles.below}
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "ProfileSelector" }],
              })
            }
          >
            <CustomText
              label="Use another account"
              fontSize={14}
              fontFamily={fonts.medium}
              color={p.t64}
            />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default PinVerification;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 12,
  },
  below: {
    alignSelf: "center",
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
