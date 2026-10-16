import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import ReactNativeBiometrics from "react-native-biometrics";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import * as Keychain from "react-native-keychain";
import { useEffect, useState } from "react";

import ErrorComponent from "../../../components/ErrorComponent";
import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
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

const LoginPassword = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const email = route?.params?.email;
  const phone = route?.params?.phone;
  const identifier = email ? { email } : { phone };

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
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
    if (!password) {
      setPasswordError("Please enter your password");
      return;
    }
    try {
      setLoading(true);
      const res = await post("auth/login", { ...identifier, password });

      if (res?.data?.requiresMfa) {
        if (res?.data?.otp?.code) {
          alert(`2FA Verification Code: ${res.data.otp.code}`);
        } else {
          ToastMessage(res?.data?.message || "OTP sent", "success");
        }
        if (res?.data?.token) {
          await AsyncStorage.setItem("token", res.data.token);
        }
        navigation.navigate("TwoFactorVerify", {
          token: res?.data?.token,
          email,
          phone,
        });
        setLoading(false);
        return;
      }
      navigateToWelcomeScreen(res?.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      // ApiRequest throws { status, data, message } — message is the server's reason.
      setPasswordError(error?.message || "Invalid password");
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
      headerUnScrollable={() => <Header title="Enter Your Password" textTransform="none" />}
      footerUnScrollable={() => (
        <AuthFooter
          paddingHorizontal={12}
          onPress={onContinuePress}
          loading={loading}
          btnBackgroundColor={isDark ? COLORS.white : colors.text}
          btnColor={isDark ? COLORS.primaryColor : colors.background}
          btnDisabled={!password}
        />
      )}
    >
      <CustomText
        label="Enter Your Password"
        fontFamily={fonts.semiBold}
        fontSize={24}
        lineHeight={24 * 1.4}
        marginTop={10}
        marginBottom={6}
        color={isDark ? COLORS.white : colors.text}
      />

      <CustomInput
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (passwordError) setPasswordError("");
        }}
        placeholder="********"
        secureTextEntry
        error={passwordError || false}
      />
      {!passwordError && (
        <ErrorComponent
          errorTitle="Please enter your password"
          color={isDark ? COLORS.gray2 : colors.textSecondary}
          font={fonts.regular}
        />
      )}

      <View style={styles.methods}>
        <AuthMethodRow
          type="pin"
          label="Use PIN Code instead"
          onPress={() => navigation.navigate("LoginPin", { email, phone })}
        />
        <OrSeparator />
        <AuthMethodRow
          type="faceid"
          label={biometricLabel}
          onPress={onFaceIdPress}
        />
        <OrSeparator />
        <AuthMethodRow
          type="otp"
          label="Use OTP"
          onPress={() => navigation.navigate("LoginOtp", { email, phone })}
        />
      </View>

      <View
        style={[
          styles.divider,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.04)"
              : "rgba(18,18,18,0.04)",
          },
        ]}
      />

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate("ForgotPass", { email, phone })}
        style={styles.forgot}
      >
        <CustomText
          label="I forgot my password"
          color={COLORS.buttonColor}
          fontFamily={fonts.medium}
          fontSize={16}
          lineHeight={16 * 1.4}
        />
      </TouchableOpacity>

      <BiometricModal
        isVisible={isModal}
        onDisable={() => setModal(false)}
        biometricType={biometricType}
        onLoginFirst={() => setModal(false)}
      />
    </ScreenWrapper>
  );
};

export default LoginPassword;

const styles = StyleSheet.create({
  methods: {
    gap: 20,
    marginTop: 40,
  },
  divider: {
    height: 1,
    width: "100%",
    marginTop: 28,
  },
  forgot: {
    alignSelf: "center",
    marginTop: 24,
  },
});
