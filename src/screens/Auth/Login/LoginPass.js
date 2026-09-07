import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import ReactNativeBiometrics from "react-native-biometrics";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import * as Keychain from "react-native-keychain";
import { useEffect, useState } from "react";

import ErrorComponent from "../../../components/ErrorComponent";
import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ImageFast from "../../../components/ImageFast";
import Header from "../../../components/Header";
import BiometricModal from "./BiometricModal";

import { setUserData } from "../../../store/reducer/usersSlice";
import { setToken } from "../../../store/reducer/AuthConfig";
import { post } from "../../../services/ApiRequest";
import { Images } from "../../../assets/images";
import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";

const LoginPass = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [biometricToken, setBiometricToken] = useState(null);
  const [isModal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const isEmail = useSelector((state) => state.users.isEmail);
  const loginValue = useSelector((state) => state.users.loginValue);
  const reduxSavedAccounts = useSelector(
    (state) => state?.users?.savedAccounts || []
  );
  const hasSavedAccounts =
    Array.isArray(reduxSavedAccounts) && reduxSavedAccounts.length > 0;

  useEffect(() => {
    checkBiometricToken();
  }, []);

  const checkBiometricToken = async () => {
    try {
      try {
        const rnBiometrics = new ReactNativeBiometrics();
        const { available, biometryType } =
          await rnBiometrics.isSensorAvailable();
        setBiometricAvailable(available);
        setBiometricType(biometryType);
        const credentials = await Keychain.getGenericPassword();

        if (credentials) {
          setBiometricToken(credentials.password);
        }
      } catch (keychainError) {
        console.log("Keychain retrieval error:", keychainError);
      }
    } catch (error) {
      console.log("Biometric check error:", error);
    }
  };

  const onFaceIdPress = async () => {
    if (biometricToken) {
      setLoading(true);
      try {
        const rnBiometrics = new ReactNativeBiometrics();
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: "Authenticate to continue",
        });

        if (success) {
          try {
            const res = await post("auth/verify-biometric-token", {
              token: biometricToken,
            });

            console.log("=========res", res?.data);
            if (res?.data?.success) {
              navigateToWelcomeScreen(res?.data);
            } else {
              console.log("Biometric verification failed");
            }
          } catch (error) {
            console.log("API Error:", error);
            setModal(true);
            setLoading(false);
          }
        }
        setLoading(false);
      } catch (biometricError) {
        console.log("Biometric Error:", biometricError);
        setLoading(false);
      }
    } else {
      setModal(true);
    }
  };

  const handleLoginFirst = () => {
    setModal(false);
  };

  const onContinuePress = async () => {
    try {
      if (!password) {
        setPasswordError(true);
      } else {
        setPasswordError(false);
        setLoading(true);
        const res = await post("auth/login", {
          ...(isEmail ? { email: loginValue } : { phone: loginValue }),
          password: password,
        });
        if (res?.data?.requiresMfa) {
          if (res?.data?.otp?.code) {
            alert(`2FA Verification Code: ${res.data.otp.code}`);
          } else {
            ToastMessage(res?.data?.message || "OTP sent to email", "success");
          }
          if (res?.data?.token) {
            await AsyncStorage.setItem("token", res.data.token);
          }
          navigation.navigate("TwoFactorVerify", {
            token: res?.data?.token,
            email: loginValue,
          });
          setLoading(false);
          return;
        }
        navigateToWelcomeScreen(res?.data);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const navigateToWelcomeScreen = async (res) => {
    dispatch(setUserData(res?.user));
    dispatch(setToken(res?.tokens?.accessToken));
    await AsyncStorage.setItem("token", res?.tokens?.accessToken);
    await AsyncStorage.setItem("refreshToken", res?.tokens?.refreshToken);
    navigation.reset({
      index: 0,
      routes: [{ name: "WelcomeScreen" }],
    });
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="Enter Your Password" />}
      footerUnScrollable={() => (
        <View style={{ padding: 12 }}>
          <AuthFooter onPress={onContinuePress} loading={loading} />
        </View>
      )}
    >
      <CustomText
        label="Enter Your Password"
        fontFamily={fonts.semiBold}
        fontSize={24}
        lineHeight={40}
      />

      <CustomInput
        value={password}
        onChangeText={setPassword}
        placeholder="********"
        secureTextEntry
        error={passwordError ? "Please enter your password" : false}
      />
      {!passwordError && (
        <ErrorComponent errorTitle="Please enter your password" />
      )}

      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => navigation.navigate("LoginPin")}
        style={[styles.row, { marginTop: 40 }]}
      >
        <ImageFast
          source={Images.pinCode}
          resizeMode="contain"
          style={{ height: 20, width: 20, marginRight: 12 }}
          tintColor={isDark ? undefined : colors.text}
        />

        <CustomText
          label="Use PIN Code instead"
          fontFamily={fonts.medium}
          fontSize={16}
          lineHeight={16 * 1.4}
        />
      </TouchableOpacity>
      {biometricAvailable ? (
        <>
          <CustomText
            label="Or"
            marginTop={20}
            marginBottom={20}
            alignSelf="center"
          />
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={onFaceIdPress}
            style={styles.row}
          >
            <ImageFast
              source={
                biometricType === "FaceID" ? Images.faceId : Images.finger
              }
              resizeMode="contain"
              style={{ height: 20, width: 20, marginRight: 12 }}
              tintColor={isDark ? undefined : colors.text}
            />

            <CustomText
              label={`Use ${
                biometricType === "TouchID"
                  ? "Touch ID"
                  : biometricType === "FaceID"
                  ? "Face ID"
                  : "Fingerprint"
              } instead`}
              fontFamily={fonts.medium}
              fontSize={16}
              lineHeight={16 * 1.4}
            />
          </TouchableOpacity>
        </>
      ) : null}

      <CustomText
        label="Or"
        marginTop={20}
        marginBottom={20}
        alignSelf="center"
      />
      <TouchableOpacity
        onPress={() => navigation.navigate("OTPScreen")}
        style={styles.row}
      >
        <ImageFast
          source={Images.otp}
          style={{ height: 20, width: 20, marginRight: 12 }}
          tintColor={isDark ? undefined : colors.text}
        />

        <CustomText
          label="Use OTP"
          fontFamily={fonts.medium}
          fontSize={16}
          lineHeight={16 * 1.4}
        />
      </TouchableOpacity>

      {hasSavedAccounts && (
        <TouchableOpacity
          onPress={() => navigation.navigate("PreviousAccounts")}
          style={{
            alignSelf: "center",
            marginTop: 14,
            paddingVertical: 10,
            paddingHorizontal: 16,
          }}
          activeOpacity={0.7}
        >
          <CustomText
            label="Sign in with previous account"
            color={COLORS.buttonColor}
            fontFamily={fonts.semiBold}
            fontSize={14}
            alignSelf="center"
          />
        </TouchableOpacity>
      )}

      {/* Biometric Modal */}
      <BiometricModal
        isVisible={isModal}
        onDisable={() => setModal(false)}
        biometricType={biometricType}
        onLoginFirst={handleLoginFirst}
      />
    </ScreenWrapper>
  );
};

export default LoginPass;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
});
