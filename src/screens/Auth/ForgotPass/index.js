import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomInput from "../../../components/CustomInput";
import Header from "../../../components/Header";
import { ToastMessage } from "../../../utils/ToastMessage";
import { post } from "../../../services/ApiRequest";
import ErrorComponent from "../../../components/ErrorComponent";
import CustomText from "../../../components/CustomText";
import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import AuthFooter from "../../../components/Auth/AuthFooter";
import { useTheme } from "../../../contexts/ThemeContext";

const ForgotPass = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [showSuccessColor, setShowSuccessColor] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (val) => {
    let newErrors = "";
    if (!val.trim()) {
      newErrors = "Please enter your email";
    } else if (!emailRegex.test(val.trim())) {
      newErrors = "Please enter a valid email address";
    } else {
      newErrors = "";
      setShowSuccessColor(true);
      setTimeout(() => {
        setShowSuccessColor(false);
      }, 2000);
    }
    return newErrors;
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (error) {
      // Clear API errors immediately when user starts typing
      if (error.includes("Invalid") || error.includes("failed")) {
        setError("");
      } else {
        // For validation errors, check if input is valid
        const newError = validateEmail(text);
        if (!newError) {
          setError("");
        }
      }
    }
  };

  const sendOtp = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setError("");

    try {
      setLoading(true);
      const body = { email: email.trim() };
      const response = await post("auth/forgot-password-otp", body);

      console.log("Forgot password response:", response?.data);

      if (response?.data?.success) {
        // Show code in alert
        Alert.alert("OTP Sent", `Verification code: ${response.data?.code}`, [
          {
            text: "OK",
            onPress: () => {
              // Navigate to OTP verification screen
              navigation.navigate("ForgotPasswordOtp", {
                email: email.trim(),
              });
            },
          },
        ]);
        ToastMessage(
          response.data?.message || "OTP sent successfully",
          "success",
        );
      } else {
        const errorMessage = response?.data?.message || "Failed to send OTP";
        setError(errorMessage);
        ToastMessage(errorMessage, "error");
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Forgot password error:", error);
      const errorMessage =
        error?.message || "Failed to send OTP. Please try again.";
      setError(errorMessage);
      ToastMessage(errorMessage, "error");
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => (
        <View style={{ paddingHorizontal: 12, marginBottom: 12 }}>
          <CustomText
            label={"Forgot my password"}
            fontFamily={fonts.semiBold}
            fontSize={20}
          />
          <CustomText
            label={"Regain access with your email"}
            fontFamily={fonts.regular}
            color={isDark ? COLORS.subtitle : colors.textSecondary}
          />
        </View>
      )}
      footerUnScrollable={() => (
        <View style={{ paddingHorizontal: 12 }}>
          <AuthFooter
            onPress={sendOtp}
            loading={loading}
            btnTitle="Send OTP"
            btnDisabled={!email.trim()}
          />
        </View>
      )}
    >
      <View style={{ justifyContent: "space-between", flex: 1 }}>
        <View>
          <CustomText
            label={"What is your email?"}
            fontFamily={fonts.semiBold}
            fontSize={24}
            marginTop={8}
            marginBottom={6}
            color={isDark ? COLORS.white : colors.text}
          />

          <CustomInput
            value={email}
            onChangeText={handleEmailChange}
            error={error}
            marginBottom={4}
            placeholder="E.g. abc@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <ErrorComponent
            errorTitle={
              showSuccessColor
                ? "Valid email address."
                : "We will send a verification code to this email"
            }
            error={error}
            isValid={showSuccessColor}
            color={
              showSuccessColor
                ? "#64CD75"
                : error
                ? "#EE1045CC"
                : isDark
                ? COLORS.gray2
                : colors.textSecondary
            }
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default ForgotPass;

const styles = StyleSheet.create({
  logo: {
    width: "70%",
    height: 250,
    alignSelf: "center",
    marginTop: 40,
    marginBottom: 60,
  },
});
