import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import ReactNativeBiometrics from "react-native-biometrics";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef, useState } from "react";
import * as Keychain from "react-native-keychain";

import ErrorComponent from "../../../components/ErrorComponent";
import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ImageFast from "../../../components/ImageFast";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";

import BiometricModal from "../Login/BiometricModal";

import { setUserData } from "../../../store/reducer/usersSlice";
import { setToken } from "../../../store/reducer/AuthConfig";
import { post } from "../../../services/ApiRequest";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";

const OTPScreen = () => {
  const timerRef = useRef(null);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [showSuccessColor, setShowSuccessColor] = useState(false);
  const [resendLoad, setResendLoad] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [biometricToken, setBiometricToken] = useState(null);
  const [isModal, setModal] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const isEmail = useSelector((state) => state.users.isEmail);
  const loginValue = useSelector((state) => state.users.loginValue);

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

  const onSendAgain = async () => {
    let body = {
      ...(!isEmail && { phone: loginValue?.trim() }),
      ...(isEmail && { email: loginValue?.trim() }),
    };

    try {
      setResendLoad(true);
      const res = await post(`auth/otplogin`, body);
      console.log("=========res", res?.data);
      Alert.alert("OTP", JSON.stringify(res?.data?.code));
      setResendLoad(false);
      startTimer();
    } catch (error) {
      setResendLoad(false);
    }
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
  const onContinuePress = async () => {
    const err = errorCheck(otp);
    if (err) return;
    setLoading(true);
    try {
      const body = {
        ...(!isEmail && { phone: loginValue?.trim() }),
        ...(isEmail && { email: loginValue?.trim() }),
        code: otp?.trim(),
      };
      const res = await post(`auth/verify-otp-login`, body);
      console.log("=========res", res?.data);
      if (res?.data) {
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
  const handleLoginFirst = () => {
    setModal(false);
  };
  useEffect(() => {
    onSendAgain();
  }, []);

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"OTP Code"} />}
      footerUnScrollable={() => (
        <View style={{ padding: 12, marginBottom: 20 }}>
          <AuthFooter onPress={onContinuePress} loading={loading} />
        </View>
      )}
    >
      <View>
        <CustomText
          label="Please enter the code"
          fontFamily={fonts.bold}
          fontSize={24}
          color={COLORS.black}
          marginTop={32}
        />
        <CustomInput
          value={otp}
          onChangeText={(text) => errorCheck(text)}
          marginTop={8}
          marginBottom={5}
          placeholder="E.g. 123456"
          keyboardType="numeric"
        />
        <ErrorComponent
          errorTitle="Valid verification code."
          isValid={showSuccessColor}
          error={error}
          color={
            error ? "#EE1045" : showSuccessColor ? "#64CD75" : COLORS.subtitle
          }
        />
        <ErrorComponent
          hideInfo
          errorTitle="Verification code was sent to:"
          marginTop={5}
          marginBottom={5}
        />
        <TouchableOpacity
          style={[styles.row, { alignSelf: "flex-start" }]}
          onPress={() => navigation.goBack()}
        >
          <CustomText
            label={loginValue}
            fontFamily={fonts.medium}
            color={COLORS.black}
            lineHeight={14 * 1.4}
            marginRight={8}
            textTransform="none"
          />
          <Icons
            family="MaterialIcons"
            name="edit"
            size={14}
            color={COLORS.black}
          />
        </TouchableOpacity>

        <CustomButton
          title={isTimerActive ? `Send again (${timer}s)` : "Send again"}
          marginTop={40}
          loading={resendLoad}
          width={137}
          fontSize={12}
          height={32}
          rightIconWidth={14}
          rightIconHeight={14}
          backgroundColor={COLORS.lightGray}
          color={COLORS.black}
          rightIcon={isTimerActive ? false : Images.refresh}
          onPress={isTimerActive ? () => {} : onSendAgain}
          indicatorColor={COLORS.black}
          disabled={resendLoad}
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

      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => navigation.navigate("LoginPin")}
        style={[styles.row, { marginTop: 40 }]}
      >
        <ImageFast
          source={Images.pinCode}
          resizeMode="contain"
          style={{ height: 20, width: 20, marginRight: 12 }}
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
            alignSelf={"center"}
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
        label={"Or"}
        marginTop={20}
        marginBottom={20}
        alignSelf={"center"}
      />
      <TouchableOpacity
        onPress={() => navigation.navigate("Password")}
        style={styles.row}
      >
        <ImageFast
          source={Images.pass}
          style={{ height: 20, width: 20, marginRight: 12 }}
        />
        <CustomText
          label={"Use Password"}
          fontFamily={fonts.medium}
          fontSize={16}
        />
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

export default OTPScreen;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
});
