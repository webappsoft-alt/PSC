import AsyncStorage from "@react-native-async-storage/async-storage";
import { View } from "react-native";
import ReactNativeBiometrics from "react-native-biometrics";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import * as Keychain from "react-native-keychain";

import ErrorComponent from "../../../components/ErrorComponent";
import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomText from "../../../components/CustomText";
import OTPComponent from "../../../components/OTP";
import Header from "../../../components/Header";
import BiometricModal from "./BiometricModal";
import {
  AuthMethodRow,
  OrSeparator,
} from "../../../components/Auth/AuthMethodRow";

import { setUserData } from "../../../store/reducer/usersSlice";
import { setToken } from "../../../store/reducer/AuthConfig";
import { post } from "../../../services/ApiRequest";
import { ToastMessage } from "../../../utils/ToastMessage";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";

const LoginPin = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const email = route?.params?.email;
  const phone = route?.params?.phone;
  const identifier = email ? { email } : { phone };

  const [otp, setOtp] = useState("");
  const [pinError, setPinError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModal, setModal] = useState(false);
  const [biometricToken, setBiometricToken] = useState(null);
  const [biometricType, setBiometricType] = useState("FaceID");

  useEffect(() => {
    checkBiometricToken();
  }, []);

  const checkBiometricToken = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { biometryType } = await rnBiometrics.isSensorAvailable();
      if (biometryType) setBiometricType(biometryType);
      const credentials = await Keychain.getGenericPassword();
      if (credentials) setBiometricToken(credentials.password);
    } catch (error) {
      console.log("Biometric check error:", error);
    }
  };

  const navigateToWelcomeScreen = async (res) => {
    dispatch(setUserData(res?.user));
    dispatch(setToken(res?.tokens?.accessToken));
    await AsyncStorage.setItem("token", res?.tokens?.accessToken);
    await AsyncStorage.setItem("refreshToken", res?.tokens?.refreshToken);
    navigation.reset({ index: 0, routes: [{ name: "WelcomeScreen" }] });
  };

  const onFaceIdPress = async () => {
    if (!biometricToken) {
      setModal(true);
      return;
    }
    try {
      setLoading(true);
      const rnBiometrics = new ReactNativeBiometrics();
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: "Authenticate to continue",
      });
      if (success) {
        const res = await post("auth/verify-biometric-token", {
          token: biometricToken,
        });
        if (res?.data?.success) {
          navigateToWelcomeScreen(res?.data);
        } else {
          setModal(true);
        }
      }
      setLoading(false);
    } catch (error) {
      console.log("Biometric Error:", error);
      setLoading(false);
    }
  };

  const onContinuePress = async () => {
    if (otp.length < 4) {
      setPinError("Please enter your 4-digit PIN code");
      return;
    }
    try {
      setLoading(true);
      const res = await post("auth/login", { ...identifier, pin: otp });
      setLoading(false);
      navigateToWelcomeScreen(res?.data);
    } catch (error) {
      setLoading(false);
      // ApiRequest throws { status, data, message } — message is the server's reason.
      setPinError(error?.message || "Invalid PIN code");
    }
  };

  const biometricLabel = `Use ${
    biometricType === "TouchID"
      ? "Touch ID"
      : biometricType === "FaceID"
      ? "Face ID"
      : "Fingerprint"
  } instead`;

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="PIN Code" textTransform="none" />}
      footerUnScrollable={() => (
        <AuthFooter
          paddingHorizontal={12}
          onPress={onContinuePress}
          loading={loading}
          btnBackgroundColor={isDark ? COLORS.white : colors.text}
          btnColor={isDark ? COLORS.primaryColor : colors.background}
          btnDisabled={otp.length < 4}
        />
      )}
    >
      <CustomText
        label="Confirm your PIN Code"
        fontFamily={fonts.semiBold}
        fontSize={24}
        lineHeight={24 * 1.4}
        marginTop={10}
        color={isDark ? COLORS.white : colors.text}
      />
      <CustomText
        label="Please enter your PIN code, so that you can access your account."
        color={isDark ? COLORS.gray64 : colors.textSecondary}
        fontSize={14}
        lineHeight={14 * 1.4}
        marginBottom={40}
      />

      <OTPComponent
        value={otp}
        setValue={(v) => {
          setOtp(v);
          if (pinError) setPinError("");
        }}
        error={pinError || false}
      />
      {!pinError && (
        <ErrorComponent
          errorTitle="Please enter your PIN code"
          color={isDark ? COLORS.gray2 : colors.textSecondary}
          font={fonts.regular}
        />
      )}

      <View style={{ gap: 20, marginTop: 40 }}>
        <AuthMethodRow
          type="faceid"
          label={biometricLabel}
          onPress={onFaceIdPress}
        />
        <OrSeparator />
        <AuthMethodRow
          type="password"
          label="Use Password"
          onPress={() => navigation.navigate("LoginPassword", { email, phone })}
        />
        <OrSeparator />
        <AuthMethodRow
          type="otp"
          label="Use OTP"
          onPress={() => navigation.navigate("LoginOtp", { email, phone })}
        />
      </View>

      <BiometricModal
        isVisible={isModal}
        onDisable={() => setModal(false)}
        biometricType={biometricType}
        onLoginFirst={() => setModal(false)}
      />
    </ScreenWrapper>
  );
};

export default LoginPin;
