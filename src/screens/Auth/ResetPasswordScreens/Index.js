import { useRef, useState } from "react";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";

import ScreenWrapper from "../../../components/ScreenWrapper";
import {
  AuthStepFooter,
  AuthStepHeader,
} from "../../../components/Auth/AuthKit";
import {
  ConfirmPasswordStep,
  CreatePasswordStep,
} from "../SignUpScreens/molecules/PasswordFields";
import { endPoints } from "../../../services/ENV";
import { ToastMessage } from "../../../utils/ToastMessage";

/**
 * Forgot password → new password (Figma Password 3/5 + 4/5 of the simplified
 * login): create, then confirm; saved with the reset token from the code step.
 */
const ResetPasswordScreens = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const token = route?.params?.token || "";
  const stepRef = useRef(null);
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [btnDisabled, setBtnDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const res = await axios.patch(
        `${endPoints.BASE_URL}auth/update-password`,
        { newPassword: password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      setLoading(false);
      if (res?.data?.success) {
        ToastMessage(res?.data?.message || "Password updated", "success");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } else {
        ToastMessage(res?.data?.message || "Failed to reset password", "error");
      }
    } catch (err) {
      setLoading(false);
      ToastMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reset password. Please try again.",
        "error",
      );
    }
  };

  const back = () => {
    if (step === 2) {
      setStep(1);
      setBtnDisabled(false);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => (
        <AuthStepHeader
          title="Forgot my password"
          subtitle={
            step === 1 ? "Creating a strong password" : "Confirming password"
          }
          step={step + 2}
          total={4}
        />
      )}
      footerUnScrollable={() => (
        <AuthStepFooter
          onPress={() => stepRef.current?.submit?.()}
          onBackPress={back}
          loading={loading}
          disabled={btnDisabled}
        />
      )}
    >
      {step === 1 ? (
        <CreatePasswordStep
          key="create"
          ref={stepRef}
          initialValue={password}
          onSubmit={(v) => {
            setPassword(v);
            setBtnDisabled(true);
            setStep(2);
          }}
          setBtnDisabled={setBtnDisabled}
        />
      ) : (
        <ConfirmPasswordStep
          key="confirm"
          ref={stepRef}
          password={password}
          onSubmit={save}
          setBtnDisabled={setBtnDisabled}
        />
      )}
    </ScreenWrapper>
  );
};

export default ResetPasswordScreens;
