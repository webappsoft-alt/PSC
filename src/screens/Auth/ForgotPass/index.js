import { useState } from "react";
import { Alert, StatusBar, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomInput from "../../../components/CustomInput";
import CustomPhoneInput from "../../../components/CustomPhoneInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
import { SlidingSegmentPager } from "../../../components/Auth/SlidingSegmentControl";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { isValidEmail, isValidPhone } from "../../../utils/constants";
import { post } from "../../../services/ApiRequest";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const ForgotPass = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const paramEmail = route?.params?.email;
  const paramPhone = route?.params?.phone;

  const [email, setEmail] = useState(paramEmail || "");
  const [phoneNumber, setPhoneNumber] = useState(paramPhone || "");
  const [contactMethod, setContactMethod] = useState(
    paramEmail ? "email" : "phone",
  );
  const [loading, setLoading] = useState(false);

  const canContinue = () => {
    if (contactMethod === "email") return isValidEmail(email);
    return isValidPhone(phoneNumber);
  };

  const sendOtp = async () => {
    const identifier =
      contactMethod === "email"
        ? { email: email.trim() }
        : { phone: phoneNumber };
    try {
      setLoading(true);
      const response = await post("auth/forgot-password-otp", identifier);

      if (response?.data?.success) {
        Alert.alert("OTP Sent", `Verification code: ${response.data?.code}`, [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate("ForgotPasswordOtp", { ...identifier }),
          },
        ]);
      } else {
        ToastMessage(response?.data?.message || "Failed to send OTP", "error");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      ToastMessage(
        error?.message ||
          "Failed to send OTP. Please try again.",
        "error",
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor="transparent"
        translucent
      />

      <Header title="Forgot my password" textTransform="none" />

      <View style={styles.content}>
        <SlidingSegmentPager
          items={[
            { key: "phone", label: "Phone Number" },
            { key: "email", label: "Email" },
          ]}
          selectedKey={contactMethod}
          onChange={setContactMethod}
          trackColor={colors.surfaceAlt}
          pillColor={colors.text}
          activeLabelColor={colors.background}
          inactiveLabelColor={isDark ? COLORS.gray64 : colors.textSecondary}
          style={styles.toggle}
          renderPage={(key) => (
            <View>
              <CustomText
                label={
                  key === "email"
                    ? "What is your email?"
                    : "What is your phone number?"
                }
                fontFamily={fonts.semiBold}
                fontSize={24}
                lineHeight={24 * 1.4}
                letterSpacing={-0.24}
                marginBottom={8}
                color={isDark ? COLORS.white : colors.text}
              />

              {key === "email" ? (
                <CustomInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="E.g. abc@email.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  marginBottom={8}
                />
              ) : (
                <View>
                  <CustomPhoneInput
                    value={phoneNumber}
                    setValue={setPhoneNumber}
                    withLabel="PHONE NUMBER"
                    marginBottom={8}
                  />
                  <View pointerEvents="none" style={styles.phoneRightIcon}>
                    <Icons
                      family="MaterialSymbolsRoundedFilled"
                      name="call"
                      size={18}
                      color={COLORS.buttonColor}
                    />
                  </View>
                </View>
              )}

              <ErrorComponent
                errorTitle={`We will send a verification code to this ${
                  key === "email" ? "email" : "phone number"
                }.`}
                color={isDark ? COLORS.gray2 : colors.textSecondary}
                font={fonts.regular}
              />
            </View>
          )}
        />
      </View>

      <AuthFooter
        paddingHorizontal={12}
        onPress={sendOtp}
        loading={loading}
        btnTitle="Send OTP"
        btnBackgroundColor={isDark ? COLORS.white : colors.text}
        btnColor={isDark ? COLORS.primaryColor : colors.background}
        btnDisabled={!canContinue()}
      />
    </View>
  );
};

export default ForgotPass;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  toggle: {
    marginTop: 10,
    marginBottom: 10,
  },
  phoneRightIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    height: 32,
    width: 32,
    borderRadius: 100,
    backgroundColor: "rgba(161, 147, 117, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
});
