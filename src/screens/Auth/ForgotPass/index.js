import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomText from "../../../components/CustomText";
import {
  AuthHint,
  AuthStepFooter,
  AuthStepTitle,
  AuthTextField,
  HINT_ROW_EXTRA,
  belowBase,
  capTop,
  textGap,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";
import fonts from "../../../assets/fonts";
import { post } from "../../../services/ApiRequest";
import { isValidEmail } from "../../../utils/constants";

/** Header of the forgot-password screens (Figma Email-LOGIN, 94 high). */
export const ForgotHeader = ({ subtitle = "Regain access with your email" }) => {
  const p = useAuthPalette();
  return (
    <View style={styles.header}>
      <CustomText
        label="Forgot my password"
        fontSize={20}
        fontFamily={fonts.semiBold}
        color={p.text}
        marginTop={-capTop(20)}
      />
      <CustomText
        label={subtitle}
        fontSize={14}
        color={p.t64}
        marginTop={textGap(10, 20, 14)}
        marginBottom={-belowBase(14)}
      />
    </View>
  );
};

/** "What is your email?" → auth/forgot-password-otp. */
const ForgotPass = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const p = useAuthPalette();
  const [email, setEmail] = useState(route?.params?.email || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const value = email.trim().toLowerCase();
    if (!isValidEmail(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await post("auth/forgot-password-otp", { email: value });
      setLoading(false);
      if (!res?.data?.success) {
        setError(res?.data?.message || "Failed to send the code.");
        return;
      }
      Alert.alert("Verification code", String(res?.data?.code ?? ""), [
        {
          text: "OK",
          onPress: () => navigation.navigate("ForgotPasswordOtp", { email: value }),
        },
      ]);
    } catch (err) {
      setLoading(false);
      setError(err?.message || "Failed to send the code.");
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <ForgotHeader />}
      footerUnScrollable={() => (
        <AuthStepFooter
          onPress={send}
          onBackPress={() => navigation.canGoBack() && navigation.goBack()}
          loading={loading}
          disabled={!email.trim()}
        />
      )}
    >
      <AuthStepTitle label="What is your email?" />
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
        returnKeyType="send"
        onSubmitEditing={send}
        error={error}
      />
      {error ? <AuthHint text={error} color={p.error} /> : null}
      <AuthHint
        text="Please enter a valid email address."
        color={p.t48}
        marginTop={error ? 8 - 2 * HINT_ROW_EXTRA : 8 - HINT_ROW_EXTRA}
      />
      <AuthHint
        text="We will later use this email to verify your account."
        color={p.t48}
        marginTop={8 - 2 * HINT_ROW_EXTRA}
      />
    </ScreenWrapper>
  );
};

export default ForgotPass;

const styles = StyleSheet.create({
  header: {
    paddingTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
