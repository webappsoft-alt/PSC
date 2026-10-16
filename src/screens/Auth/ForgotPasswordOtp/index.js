import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import Header from "../../../components/Header";
import AuthFooter from "../../../components/Auth/AuthFooter";

import fonts from "../../../assets/fonts";
import { post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const ForgotPasswordOtp = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const { email, phone } = route.params || {};
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [showSuccessColor, setShowSuccessColor] = useState(false);
  const [resendLoad, setResendLoad] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const otpRegex = /^[0-9]{6,}$/;

  useEffect(() => {
    if (isTimerActive && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timer, isTimerActive]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setTimer(30);
    setIsTimerActive(true);
  };

  const errorCheck = (value) => {
    let newErrors = "";
    setOtp(value);
    if (!value.trim()) {
      newErrors = "Valid verification code.";
    } else if (!otpRegex.test(value.trim())) {
      newErrors = "OTP must be numeric and at least 6 digits";
    } else {
      newErrors = "";
      setShowSuccessColor(true);
      setTimeout(() => {
        setShowSuccessColor(false);
      }, 2000);
    }
    setError(newErrors);
    return newErrors;
  };

  const submit = async () => {
    const err = errorCheck(otp);
    if (err) return;

    setLoading(true);
    try {
      const body = {
        code: otp?.trim(),
      };
      const res = await post(`auth/verify-forgot-otp`, body);
      console.log("OTP verification response:", res?.data);

      if (res?.data?.success) {
        ToastMessage(
          res?.data?.message || "OTP verified successfully",
          "success",
        );

        // Navigate to reset password screen with token
        navigation.navigate("ResetPasswordScreens", {
          token: res?.data?.token,
          email: email,
        });
      } else {
        setError("OTP does not match. Please try again.");
        ToastMessage("OTP does not match", "error");
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError("OTP does not match. Please try again.");
      ToastMessage("OTP does not match", "error");
    }
  };

  const onSendAgain = async () => {
    const body = {
      ...(email ? { email } : { phone }),
    };

    try {
      setResendLoad(true);
      const res = await post(`auth/forgot-password-otp`, body);

      if (res?.data?.success) {
        Alert.alert("OTP Sent", `Verification code: ${res?.data?.code}`);
        startTimer();
      }
      setResendLoad(false);
    } catch (error) {
      setResendLoad(false);
      ToastMessage("Failed to resend OTP", "error");
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => (
        <Header title="Verify OTP" textTransform="none" />
      )}
      footerUnScrollable={() => (
        <View style={{ paddingHorizontal: 12 }}>
          <AuthFooter
            onPress={submit}
            loading={loading}
            btnTitle="Verify OTP"
            btnBackgroundColor={isDark ? COLORS.white : colors.text}
            btnColor={isDark ? COLORS.primaryColor : colors.background}
            btnDisabled={!otp.trim()}
          />
        </View>
      )}
    >
      <View style={{ justifyContent: "space-between", flex: 1 }}>
        <View>
          <CustomText
            label="Please enter the code"
            fontFamily={fonts.semiBold}
            fontSize={24}
            color={isDark ? COLORS.white : colors.text}
            marginTop={12}
          />
          <CustomInput
            value={otp}
            onChangeText={(text) => errorCheck(text)}
            marginTop={6}
            marginBottom={5}
            placeholder="E.g. 123456"
            keyboardType="numeric"
          />
          <ErrorComponent
            errorTitle="Valid verification code."
            isValid={showSuccessColor}
            error={error}
            color={
              error
                ? "#EE1045"
                : showSuccessColor
                ? "#64CD75"
                : isDark
                ? COLORS.subtitle
                : colors.textSecondary
            }
            marginBottom={4}
          />
          <ErrorComponent
            hideInfo
            errorTitle="Verification code was sent to:"
          />
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
          >
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name={email ? "mail" : "call"}
              size={16}
              color={isDark ? COLORS.white : colors.text}
              marginRight={8}
            />
            <CustomText
              label={email || phone}
              fontFamily={fonts.medium}
              color={isDark ? COLORS.white : colors.text}
              lineHeight={14 * 1.4}
              marginRight={8}
            />
            <Icons
              family="MaterialIcons"
              name="edit"
              size={14}
              color={isDark ? COLORS.white : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isTimerActive || resendLoad}
            onPress={isTimerActive ? undefined : onSendAgain}
            style={[
              styles.resendBtn,
              {
                backgroundColor: isTimerActive
                  ? isDark
                    ? COLORS.white04
                    : colors.surfaceAlt
                  : isDark
                  ? COLORS.white
                  : colors.text,
                opacity: isTimerActive ? 0.9 : 1,
              },
            ]}
          >
            {resendLoad ? (
              <ActivityIndicator
                size="small"
                color={isTimerActive ? colors.text : colors.background}
              />
            ) : (
              <View style={styles.resendInner}>
                <CustomText
                  label="Send again"
                  fontFamily={fonts.semiBold}
                  fontSize={12}
                  lineHeight={12 * 1.4}
                  color={
                    isTimerActive
                      ? isDark
                        ? COLORS.white
                        : colors.text
                      : isDark
                      ? COLORS.primaryColor
                      : colors.background
                  }
                />
                <Icons
                  family="MaterialSymbolsRounded"
                  name="replay"
                  size={14}
                  color={
                    isTimerActive
                      ? isDark
                        ? COLORS.white
                        : colors.text
                      : isDark
                      ? COLORS.primaryColor
                      : colors.background
                  }
                />
              </View>
            )}
          </TouchableOpacity>

          <ErrorComponent
            errorTitle={
              isTimerActive
                ? `You can request a new code in ${timer} seconds.`
                : "You can request a new code now."
            }
            alignSelf="center"
            marginTop={16}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default ForgotPasswordOtp;

const styles = StyleSheet.create({
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    height: 32,
    borderRadius: 100,
    alignSelf: "center",
    marginTop: 40,
  },
  resendInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
