import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useDispatch } from "react-redux";

import {
  AuthHint,
  AuthStepFooter,
  AuthStepHeader,
  AuthStepTitle,
  AuthTextField,
  HINT_ROW_EXTRA,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";
import VerificationCode from "../../../components/Auth/VerificationCode";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { get, post } from "../../../services/ApiRequest";
import { accountId, applySession } from "../../../utils/accountSession";
import { ToastMessage } from "../../../utils/ToastMessage";
import {
  ConfirmPasswordStep,
  CreatePasswordStep,
} from "../../Auth/SignUpScreens/molecules/PasswordFields";

// test mode on the backend (CLAIM_TEST_MODE) returns the code: show it like registration does
const showTestCode = (d) =>
  d?.code && Alert.alert("Verification code", String(d.code));

const errText = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback;

/**
 * Claiming an invited (public-source) profile — client flow (Nov 2026):
 * profiles are claimed ONLY through a PSC invitation ("Claim Now" email,
 * psc://claim?token=…). The invited email is pre-filled → Confirm → 6-digit
 * code → create + confirm password → the claim completes automatically (no
 * review), the app signs in as the claimed account and asks for its PIN.
 * The screen lives in the root navigator so the link also works logged out.
 * mode "report" = report inaccurate information (free, any profile).
 */
const ClaimProfile = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { params = {} } = useRoute();
  const p = useAuthPalette();
  const isReport = params.mode === "report";
  const stepRef = useRef(null);

  // 0 loading invite · 1 confirm email (or the report form) · 2 code · 3 create · 4 confirm
  const [step, setStep] = useState(isReport ? 1 : 0);
  const [name, setName] = useState(params.name || "");
  const [email, setEmail] = useState("");
  const [claimId, setClaimId] = useState(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [btnDisabled, setBtnDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReport) return;
    if (!params.token) {
      ToastMessage(
        "Profiles can only be claimed through a PSC invitation",
        "error"
      );
      navigation.canGoBack() && navigation.goBack();
      return;
    }
    (async () => {
      try {
        const res = await get(`claims/invite/${params.token}`);
        const inv = res?.data?.data;
        const u = inv?.profile || {};
        setName(
          [u.firstName, u.lastName].filter(Boolean).join(" ") ||
            u.username ||
            ""
        );
        setEmail(inv?.email || "");
        setStep(1);
      } catch (e) {
        ToastMessage(errText(e, "This invitation is not valid"), "error");
        navigation.canGoBack() && navigation.goBack();
      }
    })();
  }, [params.token]);

  const back = () => {
    if (step === 4) return setStep(3);
    navigation.canGoBack() && navigation.goBack();
  };

  const sendReport = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await post(`claims/report/${params.profileId}`, {
        message: message.trim(),
      });
      ToastMessage("Report sent, thank you", "success");
      navigation.goBack();
    } catch (e) {
      setError(errText(e, "Could not send the report"));
    }
    setLoading(false);
  };

  const confirmEmail = async () => {
    setLoading(true);
    try {
      const res = await post("claims/start-invite", { token: params.token });
      const d = res?.data?.data;
      setClaimId(d.claimId);
      showTestCode(d);
      setBtnDisabled(true);
      setStep(2);
    } catch (e) {
      ToastMessage(errText(e, "Could not send the code"), "error");
    }
    setLoading(false);
  };

  const onVerify = async (code) => {
    try {
      await post(`claims/${claimId}/verify`, { code });
      setBtnDisabled(true);
      setStep(3);
      return "";
    } catch (e) {
      return errText(e, "Invalid verification code.");
    }
  };

  const onResend = async () => {
    try {
      const res = await post(`claims/${claimId}/resend`, {});
      showTestCode(res?.data?.data);
      return true;
    } catch (e) {
      ToastMessage(errText(e, "Could not resend"), "error");
      return false;
    }
  };

  const savePassword = async () => {
    setLoading(true);
    try {
      const res = await post(`claims/${claimId}/password`, { password });
      const d = res?.data?.data;
      if (d?.tokens?.accessToken) {
        // the claim is complete: sign in as the claimed account, then its PIN
        await applySession(dispatch, d.user, d.tokens);
        ToastMessage(`${name || "The profile"} is now yours`, "success");
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "PinVerification",
              params: {
                mode: "define",
                purpose: "profile",
                accountId: accountId(d.user),
              },
            },
          ],
        });
        return;
      }
      ToastMessage("Profile claimed — sign in with your email", "success");
      navigation.canGoBack() && navigation.goBack();
    } catch (e) {
      ToastMessage(errText(e, "Could not save the password"), "error");
      setLoading(false);
    }
  };

  const subtitle = isReport
    ? "Report inaccurate information"
    : [
        "",
        "Confirming your email",
        "Verifying your email",
        "Creating a strong password",
        "Confirming password",
      ][step];

  const onNext = () => {
    if (isReport) return sendReport();
    if (step === 1) return confirmEmail();
    stepRef.current?.submit?.();
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => (
        <AuthStepHeader
          title={
            isReport
              ? name
                ? `Report ${name}`
                : "Report inaccurate info"
              : name
              ? `Claim ${name}`
              : "Claim this profile"
          }
          subtitle={subtitle || ""}
          {...(isReport ? {} : { step: Math.max(step, 1), total: 4 })}
        />
      )}
      footerUnScrollable={() => (
        <AuthStepFooter
          title={isReport ? "Send report" : step === 1 ? "Confirm" : "Continue"}
          onPress={onNext}
          onBackPress={back}
          loading={loading}
          disabled={
            isReport
              ? !message.trim()
              : step === 0
              ? true
              : step === 1
              ? !email
              : btnDisabled
          }
        />
      )}
    >
      {step === 0 && (
        <View style={{ paddingTop: 40 }}>
          <ActivityIndicator color={p.text} />
        </View>
      )}

      {isReport && (
        <>
          <AuthStepTitle label="What is inaccurate?" />
          <AuthTextField
            value={message}
            onChangeText={(t) => {
              setMessage(t);
              if (error) setError("");
            }}
            placeholder="E.g. the headquarters moved to Zurich"
            maxLength={1000}
            multiline
            minHeight={140}
            autoCapitalize="sentences"
            error={error}
          />
          {error ? <AuthHint text={error} color={p.error} /> : null}
          <AuthHint
            text={`Our team checks every report against public sources. ${message.length.toLocaleString(
              "en-US"
            )}/1,000`}
            color={p.t48}
            marginTop={error ? 8 - 2 * HINT_ROW_EXTRA : 8 - HINT_ROW_EXTRA}
          />
        </>
      )}

      {!isReport && step === 1 && (
        <>
          <AuthStepTitle label="Confirm your email" />
          <AuthTextField value={email} editable={false} />
          <AuthHint
            text={`PSC invited this address to claim ${name || "the profile"}.`}
            color={p.t48}
            marginTop={8 - HINT_ROW_EXTRA}
          />
          <AuthHint
            text="It becomes the login of the claimed profile."
            color={p.t48}
            marginTop={8 - 2 * HINT_ROW_EXTRA}
          />
        </>
      )}

      {!isReport && step === 2 && (
        <VerificationCode
          ref={stepRef}
          destination={email}
          isPhone={false}
          onVerify={onVerify}
          onResend={onResend}
          setBtnDisabled={setBtnDisabled}
          setLoading={setLoading}
        />
      )}

      {!isReport && step === 3 && (
        <CreatePasswordStep
          key="create"
          ref={stepRef}
          initialValue={password}
          onSubmit={(v) => {
            setPassword(v);
            setBtnDisabled(true);
            setStep(4);
          }}
          setBtnDisabled={setBtnDisabled}
        />
      )}

      {!isReport && step === 4 && (
        <ConfirmPasswordStep
          key="confirm"
          ref={stepRef}
          password={password}
          onSubmit={savePassword}
          setBtnDisabled={setBtnDisabled}
        />
      )}
    </ScreenWrapper>
  );
};

export default ClaimProfile;
