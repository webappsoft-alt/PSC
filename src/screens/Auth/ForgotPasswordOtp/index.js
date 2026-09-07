import { useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";

import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import ImageFast from "../../../components/ImageFast";
import { post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const ForgotPasswordOtp = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const { email } = route.params || {};
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
      email: email,
    };

    try {
      setResendLoad(true);
      const res = await post(`auth/forgot-password-otp`, body);

      if (res?.data?.success) {
        ToastMessage(res?.data?.message || "OTP sent successfully", "success");
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
        <View style={{ paddingHorizontal: 12, marginBottom: 12 }}>
          <CustomText
            label={"Verify OTP"}
            fontFamily={fonts.semiBold}
            fontSize={20}
            lineHeight={20 * 1.4}
          />
          <CustomText
            label={"Enter the code sent to your email"}
            fontFamily={fonts.regular}
            color={isDark ? COLORS.subtitle : colors.textSecondary}
            lineHeight={14 * 1.4}
          />
        </View>
      )}
      footerUnScrollable={() => (
        <View style={{ paddingHorizontal: 12 }}>
          <AuthFooter
            onPress={submit}
            loading={loading}
            btnTitle="Verify OTP"
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
            <ImageFast
              source={Images.EmailIcon}
              resizeMode={"contain"}
              style={{ width: 11, height: 9.33, marginRight: 8 }}
              tintColor={isDark ? undefined : colors.text}
            />
            <CustomText
              label={email}
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

          <CustomButton
            title={"Send again"}
            marginTop={40}
            loading={resendLoad}
            width={137}
            fontSize={12}
            height={32}
            rightIconWidth={14}
            rightIconHeight={14}
            backgroundColor={isDark ? COLORS.inputBg : colors.surfaceAlt}
            color={isDark ? COLORS.white : colors.text}
            rightIcon={Images.refresh}
            rightIconTintColor={isDark ? COLORS.white : colors.text}
            onPress={isTimerActive ? () => {} : onSendAgain}
            indicatorColor={isDark ? COLORS.white : COLORS.black}
            disabled={timer > 0}
          />

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
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
