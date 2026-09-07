import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import ReactNativeBiometrics from "react-native-biometrics";
import { useNavigation } from "@react-navigation/native";
import * as Keychain from "react-native-keychain";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ErrorComponent from "../../../components/ErrorComponent";
import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomText from "../../../components/CustomText";
import ImageFast from "../../../components/ImageFast";
import OTPComponent from "../../../components/OTP";
import Header from "../../../components/Header";

import BiometricModal from "./BiometricModal";

import { setUserData } from "../../../store/reducer/usersSlice";
import { setToken } from "../../../store/reducer/AuthConfig";
import { post } from "../../../services/ApiRequest";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";

const LoginPin = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [otp, setOtp] = useState("");
  const [biometricToken, setBiometricToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState("FaceID");
  const [isModal, setModal] = useState(false);
  const [pinError, setPinError] = useState(false);
  const isEmail = useSelector((state) => state.users.isEmail);
  const loginValue = useSelector((state) => state.users.loginValue);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

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
  const onContinuePress = async () => {
    try {
      if (!otp) {
        setPinError(true);
      } else {
        setPinError(false);
        setLoading(true);
        const res = await post("auth/login", {
          ...(isEmail ? { email: loginValue } : { phone: loginValue }),
          pin: otp,
        });
        navigateToWelcomeScreen(res?.data);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="PIN Code" />}
      footerUnScrollable={() => (
        <View style={{ padding: 12 }}>
          <AuthFooter onPress={onContinuePress} loading={loading} />
        </View>
      )}
    >
      <CustomText
        label="Confirm your PIN Code"
        fontFamily={fonts.semiBold}
        fontSize={24}
        lineHeight={24 * 1.4}
      />
      <CustomText
        label="Please enter your PIN code, so that you can access your account."
        color={isDark ? COLORS.gray1 : colors.textSecondary}
        lineHeight={14 * 1.4}
        marginBottom={40}
      />

      <OTPComponent
        value={otp}
        setValue={setOtp}
        error={pinError ? "Please enter your PIN code" : false}
      />
      {!pinError && <ErrorComponent errorTitle="Please enter your PIN code" />}

      {biometricAvailable ? (
        <>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={onFaceIdPress}
            style={[styles.row, { marginTop: 40 }]}
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

          <CustomText
            label="Or"
            marginTop={20}
            marginBottom={20}
            alignSelf="center"
          />
        </>
      ) : null}

      <TouchableOpacity
        onPress={() => navigation.navigate("LoginPass")}
        style={[styles.row, { marginTop: !biometricAvailable && 40 }]}
      >
        <ImageFast
          source={Images.pass}
          style={{ height: 20, width: 20, marginRight: 12 }}
          tintColor={isDark ? undefined : colors.text}
        />

        <CustomText
          label="Use Password"
          fontFamily={fonts.medium}
          fontSize={16}
        />
      </TouchableOpacity>
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

        <CustomText label="Use OTP" fontFamily={fonts.medium} fontSize={16} />
      </TouchableOpacity>
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

export default LoginPin;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
});
