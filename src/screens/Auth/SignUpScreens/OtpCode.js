import { forwardRef } from "react";
import { Alert } from "react-native";

import VerificationCode from "../../../components/Auth/VerificationCode";
import { post } from "../../../services/ApiRequest";

/**
 * Registration code check (auth/verify-otp), resend via auth/send-otp.
 * "EmailCode" verifies the email, "PhoneCode" the phone number.
 */
const OtpCode = forwardRef(
  ({ stepKey, state, next, setBtnDisabled, setLoading, goBack }, ref) => {
    const isPhone = stepKey === "PhoneCode";
    const identifier = isPhone ? { phone: state.phone } : { email: state?.email };

    const onVerify = async (code) => {
      try {
        const res = await post("auth/verify-otp", { ...identifier, code });
        if (res?.data?.success) {
          next({});
          return "";
        }
        return res?.data?.message || "Invalid verification code.";
      } catch (err) {
        return err?.message || "Invalid verification code.";
      }
    };

    const onResend = async () => {
      try {
        const res = await post("auth/send-otp", {
          ...identifier,
          ...(isPhone && { verifyVia: state?.verifyVia }),
        });
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
      <VerificationCode
        ref={ref}
        destination={isPhone ? state?.phone : state?.email}
        isPhone={isPhone}
        onEdit={goBack}
        onVerify={onVerify}
        onResend={onResend}
        setBtnDisabled={setBtnDisabled}
        setLoading={setLoading}
      />
    );
  },
);

export default OtpCode;
