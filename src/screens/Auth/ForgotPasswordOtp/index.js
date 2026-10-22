import { useRef, useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import ScreenWrapper from "../../../components/ScreenWrapper";
import VerificationCode from "../../../components/Auth/VerificationCode";
import { AuthStepFooter } from "../../../components/Auth/AuthKit";
import { ForgotHeader } from "../ForgotPass";
import { post } from "../../../services/ApiRequest";

/** Code check of the forgot-password flow (same design as registration). */
const ForgotPasswordOtp = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route?.params?.email || "";
  const stepRef = useRef(null);
  const [btnDisabled, setBtnDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const onVerify = async (code) => {
    try {
      const res = await post("auth/verify-forgot-otp", { code });
      if (res?.data?.success && res?.data?.token) {
        navigation.navigate("ResetPasswordScreens", {
          token: res.data.token,
          email,
        });
        return "";
      }
      return res?.data?.message || "Invalid verification code.";
    } catch (err) {
      return err?.message || "Invalid verification code.";
    }
  };

  const onResend = async () => {
    try {
      const res = await post("auth/forgot-password-otp", { email });
      if (res?.data?.success) {
        Alert.alert("Verification code", String(res?.data?.code ?? ""));
        return true;
      }
    } catch (err) {
      Alert.alert("Verification code", err?.message || "Could not resend.");
    }
    return false;
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => (
        <ForgotHeader subtitle="Verifying your email" />
      )}
      footerUnScrollable={() => (
        <AuthStepFooter
          onPress={() => stepRef.current?.submit?.()}
          onBackPress={() => navigation.canGoBack() && navigation.goBack()}
          loading={loading}
          disabled={btnDisabled}
        />
      )}
    >
      <VerificationCode
        ref={stepRef}
        destination={email}
        isPhone={false}
        onEdit={() => navigation.goBack()}
        onVerify={onVerify}
        onResend={onResend}
        setBtnDisabled={setBtnDisabled}
        setLoading={setLoading}
      />
    </ScreenWrapper>
  );
};

export default ForgotPasswordOtp;
