import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import CustomPhoneInput from "../../../components/CustomPhoneInput";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { SlidingSegmentControl } from "../../../components/Auth/SlidingSegmentControl";
import {
  AuthHint,
  AuthTextField,
  HINT_ROW_EXTRA,
  OptionCard,
  capTop,
  ls,
  textGap,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";

import fonts from "../../../assets/fonts";
import { post } from "../../../services/ApiRequest";
import { isValidEmail, isValidPhone } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";

/** "Hello Mr. Sola" / "Hi Ana" / "Hello Sola Group" from the earlier answers. */
const greetingOf = (s) => {
  if (s?.proType === "company" && s?.entityName) return `Hello ${s.entityName}`;
  if (s?.addressing === "lastname" && s?.lastName) {
    const title =
      s?.gender === "female" ? "Ms." : s?.gender === "male" ? "Mr." : "";
    return `Hello ${title ? `${title} ` : ""}${s.lastName}`;
  }
  return s?.firstName ? `Hi ${s.firstName}` : "Hello";
};

/** Phone as typed in CustomPhoneInput ("+31 612 345 678") → "+31612345678". */
const normalizePhone = (v) => String(v || "").replace(/[\s()-]/g, "");

/**
 * Email / Phone Number tabs (40 track, 32 pill), greeting Regular 16 48%,
 * question, field, two 48% hints, divider, then the opt-in (email) or the
 * verification-channel (phone) cards.
 *
 * Both are mandatory (as in Viral): the "Email" step comes first with the
 * Phone tab disabled, then — after its code — the "Phone" step with the
 * Email tab disabled.
 */
const Email = forwardRef(
  ({ stepKey, state, next, setBtnDisabled, setLoading }, ref) => {
  const p = useAuthPalette();
  const navigation = useNavigation();
  const method = stepKey === "Phone" ? "phone" : "email";
  const [email, setEmail] = useState(state?.email || "");
  const [phone, setPhone] = useState(state?.phone || "");
  const [verifyVia, setVerifyVia] = useState(state?.verifyVia || "sms");
  const [allowMarketing, setAllowMarketing] = useState(
    state?.allowMarketing ?? true,
  );
  const [tailoredAds, setTailoredAds] = useState(
    state?.enhancedTailoredAds ?? false,
  );
  const [error, setError] = useState("");

  const isEmail = method === "email";

  useEffect(() => {
    setBtnDisabled?.(isEmail ? !email.trim() : !phone.trim());
  }, [email, phone, method]);

  const submit = async () => {
    if (isEmail && !isValidEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isEmail && !isValidPhone(phone)) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    const identifier = isEmail
      ? { email: email.trim().toLowerCase() }
      : { phone: normalizePhone(phone) };

    setLoading?.(true);
    try {
      const res = await post("auth/send-otp", {
        ...identifier,
        ...(!isEmail && { verifyVia }),
      });
      setLoading?.(false);
      if (!res?.data?.success) {
        setError(res?.data?.message || "Failed to send the code.");
        return;
      }
      const patch = isEmail
        ? {
            email: identifier.email,
            allowMarketing,
            enhancedTailoredAds: tailoredAds,
          }
        : { phone: identifier.phone, verifyVia };
      // Delivery is not wired yet for every channel, so show the code.
      Alert.alert("Verification code", String(res?.data?.code ?? ""), [
        { text: "OK", onPress: () => next(patch) },
      ]);
    } catch (err) {
      setLoading?.(false);
      const message = err?.message || "Failed to send the code.";
      setError(message);
      if (/already registered/i.test(message)) {
        ToastMessage(`${message}. Please log in.`, "error");
        navigation.navigate("Login");
      }
    }
  };

  useImperativeHandle(ref, () => ({ submit }));

  const hintColor = p.t48;

  return (
    <View>
      <SlidingSegmentControl
        items={[
          { key: "email", label: "Email", disabled: !isEmail },
          { key: "phone", label: "Phone Number", disabled: isEmail },
        ]}
        selectedKey={method}
        onChange={() => {}}
        trackColor={p.t04}
        pillColor={p.text}
        activeLabelColor={p.isDark ? "#121212" : "#FFFFFF"}
        inactiveLabelColor={p.t64}
        disabledLabelColor={p.t64}
        style={styles.tabs}
      />

      <CustomText
        label={greetingOf(state)}
        fontSize={16}
        letterSpacing={ls(-3, 16)}
        color={p.t48}
        marginTop={20 - capTop(16)}
      />
      <CustomText
        label={isEmail ? "What is your email?" : "What is your phone number?"}
        fontSize={24}
        fontFamily={fonts.semiBold}
        letterSpacing={ls(-1, 24)}
        color={p.text}
        marginTop={textGap(12, 16, 24)}
        marginBottom={12 - 0.35 * 24}
      />

      {isEmail ? (
        <AuthTextField
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (error) setError("");
          }}
          placeholder="E.g. abc@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          autoComplete="email"
          error={error}
        />
      ) : (
        <View>
          <CustomPhoneInput
            value={phone}
            setValue={(v) => {
              setPhone(v);
              if (error) setError("");
            }}
            withLabel="PHONE NUMBER"
            height={56}
            borderRadius={12}
            marginBottom={0}
            error={!!error}
          />
          <View pointerEvents="none" style={styles.callIcon}>
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="call"
              size={16}
              color={p.gold}
            />
          </View>
        </View>
      )}

      {error ? <AuthHint text={error} color={p.error} /> : null}
      <AuthHint
        text={
          isEmail
            ? "Please enter a valid email address."
            : "Please enter a valid phone number"
        }
        color={hintColor}
        marginTop={error ? 8 - 2 * HINT_ROW_EXTRA : 8 - HINT_ROW_EXTRA}
      />
      <AuthHint
        text={`We will later use this ${
          isEmail ? "email" : "phone number"
        } to verify your account.`}
        color={hintColor}
        marginTop={8 - 2 * HINT_ROW_EXTRA}
      />

      <View
        style={[
          styles.divider,
          { backgroundColor: p.t04, marginTop: 16 - HINT_ROW_EXTRA },
        ]}
      />

      <View style={styles.cards}>
        {isEmail ? (
          <>
            <OptionCard
              title="I want to"
              description="receive the latest news about PSC, and promotional offers."
              selected={allowMarketing}
              onPress={() => setAllowMarketing((v) => !v)}
            />
            <OptionCard
              title="I am Okay To"
              description="have a more tailor-made experience while keeping my data anonymous to content providers."
              selected={tailoredAds}
              onPress={() => setTailoredAds((v) => !v)}
            />
          </>
        ) : (
          <>
            <OptionCard
              icon={
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="sms"
                  size={14}
                  color={p.t64}
                />
              }
              title="Verify using SMS"
              description="Receive a verification code on your phone using the SMS method."
              selected={verifyVia === "sms"}
              onPress={() => setVerifyVia("sms")}
            />
            <OptionCard
              icon={
                <Icons
                  family="MaterialCommunityIcons"
                  name="whatsapp"
                  size={14}
                  color={p.text}
                />
              }
              title="Verify using Whatsapp"
              description="Receive a verification code on your Whatsapp using data method."
              selected={verifyVia === "whatsapp"}
              onPress={() => setVerifyVia("whatsapp")}
            />
          </>
        )}
      </View>
    </View>
  );
  },
);

export default Email;

const styles = StyleSheet.create({
  tabs: {
    marginTop: 16,
  },
  callIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 100,
    backgroundColor: "rgba(85, 85, 85, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
  },
  cards: {
    marginTop: 16,
    gap: 8,
  },
});
