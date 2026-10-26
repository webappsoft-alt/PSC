import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch } from "react-redux";

import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import {
  AuthError,
  AuthHint,
  AuthStepFooter,
  AuthStepTitle,
  AuthTextField,
  HINT_ROW_EXTRA,
  ls,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";

import fonts from "../../../assets/fonts";
import { post } from "../../../services/ApiRequest";
import { applySession } from "../../../utils/accountSession";

const MAX_LENGTH = 37;

/**
 * "Login to PSC" (Figma: NEW on-boarding / Simplified login).
 * One "Phone, email, or username" field + password.
 */
const Login = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const p = useAuthPalette();

  // Prefilled when a saved account's session expired (profile selector).
  const [identifier, setIdentifier] = useState(
    String(route?.params?.identifier || ""),
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = identifier.trim().length > 0 && password.length > 0;

  const onContinue = async () => {
    if (!canSubmit || loading) return;
    setError("");
    setLoading(true);
    try {
      const fcmToken = await AsyncStorage.getItem("fcmToken");
      const res = await post("auth/login", {
        identifier: identifier.trim(),
        password,
        fcmToken: fcmToken || "",
      });
      const data = res?.data;

      if (data?.requiresMfa) {
        if (data?.otp?.code) {
          alert(`2FA Verification Code: ${data.otp.code}`);
        }
        if (data?.token) await AsyncStorage.setItem("token", data.token);
        navigation.navigate("TwoFactorVerify", {
          token: data?.token,
          email: data?.user?.email,
        });
        return;
      }

      if (!data?.tokens?.accessToken) {
        setError(data?.message || "Invalid credentials");
        return;
      }

      await applySession(dispatch, data?.user, data?.tokens);
      navigation.reset({ index: 0, routes: [{ name: "WelcomeScreen" }] });
    } catch (err) {
      // ApiRequest throws { status, data, message }.
      setError(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const onBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => (
        <View style={styles.top}>
          <View style={[styles.topCircle, { backgroundColor: p.t08 }]} />
        </View>
      )}
      footerUnScrollable={() => (
        <AuthStepFooter
          onPress={onContinue}
          onBackPress={onBack}
          loading={loading}
          disabled={!canSubmit}
        />
      )}
    >
      <AuthStepTitle label="Login to PSC" marginTop={32} marginBottom={32} />

      <AuthTextField
        placeholder="Enter your phone, email, or username"
        label="PHONE, EMAIL, OR USERNAME"
        value={identifier}
        onChangeText={(t) => {
          setIdentifier(t);
          if (error) setError("");
        }}
        maxLength={MAX_LENGTH}
        autoCapitalize="none"
        textContentType="username"
        autoComplete="username"
        returnKeyType="next"
        error={!!error}
      />
      <AuthHint
        text={`Maximum characters ${identifier.length}/${MAX_LENGTH}`}
        marginTop={6 - HINT_ROW_EXTRA}
      />

      <View style={{ marginTop: 12 - HINT_ROW_EXTRA }}>
        <AuthTextField
        placeholder="********"
          label="PASSWORD"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (error) setError("");
          }}
          secure
          textContentType="password"
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={onContinue}
          error={!!error}
        />
      </View>
      <AuthError text={error} marginTop={6 - HINT_ROW_EXTRA} />

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate("ForgotPass")}
        style={[styles.forgotRow, { marginTop: 12 - HINT_ROW_EXTRA }]}
      >
        <CustomText
          label="Forgot my password"
          fontSize={12}
          letterSpacing={ls(-3, 12)}
          color={p.gold}
          fontFamily={fonts.regular}
        />
        <Icons
          family="MaterialSymbolsRounded"
          name="arrow_outward"
          size={12}
          color={p.gold}
        />
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  top: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 12,
  },
  topCircle: {
    width: 44,
    height: 44,
    borderRadius: 100,
  },
  forgotRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
  },
});
