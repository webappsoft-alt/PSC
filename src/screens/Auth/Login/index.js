import { useState } from "react";
import {
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
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
import { useTheme } from "../../../contexts/ThemeContext";

const Login = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const savedAccounts = useSelector((state) => state?.users?.savedAccounts);
  const hasSavedAccounts =
    Array.isArray(savedAccounts) && savedAccounts.length > 0;

  const paramEmail = route?.params?.email;
  const paramPhone = route?.params?.phone;

  const [email, setEmail] = useState(paramEmail || "");
  const [phoneNumber, setPhoneNumber] = useState(paramPhone || "");
  const [contactMethod, setContactMethod] = useState(
    paramEmail ? "email" : paramPhone ? "phone" : route?.params?.tab || "phone",
  );

  const canContinue = () => {
    if (contactMethod === "email") return isValidEmail(email);
    return isValidPhone(phoneNumber);
  };

  const handleContinue = () => {
    if (contactMethod === "email") {
      navigation.navigate("LoginPassword", { email: email.trim() });
    } else {
      navigation.navigate("LoginPassword", { phone: phoneNumber });
    }
  };

  const headerTitle =
    contactMethod === "email" ? "Enter Your Email" : "Enter Your Phone Number";

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

      <Header title={headerTitle} textTransform="none" />

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
                  <View
                    pointerEvents="none"
                    style={styles.phoneRightIcon}
                  >
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
                errorTitle={`Please enter a valid ${
                  key === "email" ? "email address" : "phone number"
                }`}
                color={isDark ? COLORS.gray2 : colors.textSecondary}
                marginBottom={4}
                font={fonts.regular}
              />
              <ErrorComponent
                errorTitle={`We will later use this ${
                  key === "email" ? "email" : "phone number"
                } to verify your account.`}
                color={isDark ? COLORS.gray2 : colors.textSecondary}
                font={fonts.regular}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("LoginQRCode")}
                style={styles.qrRow}
              >
                <Icons
                  family="MaterialSymbolsRounded"
                  name="qr_code_scanner"
                  size={22}
                  color={isDark ? COLORS.white : colors.text}
                />
                <CustomText
                  label="Use QR-Code"
                  fontFamily={fonts.medium}
                  fontSize={16}
                  lineHeight={16 * 1.4}
                  marginLeft={10}
                  color={isDark ? COLORS.white : colors.text}
                />
              </TouchableOpacity>

              {hasSavedAccounts && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("PreviousAccounts")}
                  style={styles.previousAccounts}
                >
                  <CustomText
                    label="Sign in with previous account"
                    color={COLORS.buttonColor}
                    fontFamily={fonts.medium}
                    fontSize={14}
                    lineHeight={14 * 1.4}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>

      <AuthFooter
        paddingHorizontal={12}
        onPress={handleContinue}
        btnBackgroundColor={isDark ? COLORS.white : colors.text}
        btnColor={isDark ? COLORS.primaryColor : colors.background}
        btnDisabled={!canContinue()}
      />
    </View>
  );
};

export default Login;

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
  previousAccounts: {
    alignSelf: "center",
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  qrRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 24,
  },
});
