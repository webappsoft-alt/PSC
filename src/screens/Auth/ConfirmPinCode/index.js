import ReactNativeBiometrics, { BiometryTypes } from "react-native-biometrics";
import { useNavigation } from "@react-navigation/native";
import DeviceInfo from "react-native-device-info";
import * as Keychain from "react-native-keychain";
import { View, Platform } from "react-native";
import { useEffect, useState } from "react";

import BiometricModal from "../AllowNotification/BiometricModal";
import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomText from "../../../components/CustomText";
import OTPComponent from "../../../components/OTP";
import Header from "../../../components/Header";

import { post, put } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";

const ConfirmPinCode = ({ route }) => {
  const { colors, isDark } = useTheme();
  const pin = route.params?.pin;
  const navigation = useNavigation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const onContinue = async () => {
    if (!otp) {
      setError("Please enter PIN code");
    } else if (otp.length < 4) {
      setError("Please enter a valid PIN code");
    } else if (otp !== pin) {
      setError("PIN code does not match");
    } else {
      setError("");
      try {
        setLoading(true);
        const res = await post("user/create-pin", { pin: otp });
        if (res?.data?.success) {
          if (biometricAvailable) {
            setShowBiometricModal(true);
          } else {
            navigation.navigate("OnBoarding1");
          }
        } else {
          setError(res?.data?.message);
        }
        setLoading(false);
        if (biometricAvailable) {
          setShowBiometricModal(true);
        } else {
          navigation.navigate("OnBoarding1");
        }
      } catch (error) {
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    if (error && otp?.length == 4 && otp == pin) {
      setError("");
    }
  }, [otp?.length]);
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } =
        await rnBiometrics.isSensorAvailable();

      setBiometricAvailable(available);
      setBiometricType(biometryType);
    } catch (error) {
      console.log("Biometric check error:", error);
      setBiometricAvailable(false);
    }
  };
  const getBiometricText = () => {
    if (biometricType === BiometryTypes.TouchID) {
      return "Do you want to setup Touch ID?";
    } else if (biometricType === BiometryTypes.FaceID) {
      return "Do you want to setup Face ID?";
    } else if (biometricType === BiometryTypes.Biometrics) {
      return "Do you want to setup fingerprint?";
    } else {
      return "Do you want to setup biometric authentication?";
    }
  };

  const onLaterModal = () => {
    setShowBiometricModal(false);
    setTimeout(() => {
      navigation.navigate("OnBoarding1");
    }, 500);
  };
  const onContinueModal = async () => {
    setBiometricLoading(true);
    setShowBiometricModal(false);

    try {
      const deviceId = await DeviceInfo.getUniqueId();
      const deviceName = await DeviceInfo.getDeviceName();

      const body = {
        deviceId: deviceId,
        os: Platform.OS,
        name: deviceName,
        biometricType: biometricType == "Biometrics" ? "fingerprint" : "face",
      };
      const createBiometricKeys = await put("user/update-biometric", body);
      const biometricToken = createBiometricKeys?.data?.data;

      const rnBiometrics = new ReactNativeBiometrics();

      const { available, biometryType } =
        await rnBiometrics.isSensorAvailable();

      if (available) {
        const { keysExist } = await rnBiometrics.biometricKeysExist();

        if (!keysExist) {
          const { publicKey } = await rnBiometrics.createKeys();
          console.log("Biometric keys created:", publicKey);
        }

        const { success, error } = await rnBiometrics.simplePrompt({
          promptMessage: `Setup ${
            biometricType === BiometryTypes.TouchID
              ? "Touch ID"
              : biometricType === BiometryTypes.FaceID
              ? "Face ID"
              : "Fingerprint"
          }`,
          cancelButtonText: "Cancel",
        });

        if (success) {
          console.log("Biometric setup successful");

          if (biometricToken) {
            try {
              await Keychain.setGenericPassword(
                "biometric_token",
                biometricToken,
                {
                  accessControl: Keychain.ACCESS_CONTROL.BIOMETRIC_ANY,
                  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
                  authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
                  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
                }
              );
              console.log("Biometric token stored in Keychain successfully");
            } catch (keychainError) {
              console.log("Keychain storage error:", keychainError);
            }
          }
        } else {
          console.log("Biometric setup failed:", error);
        }
      }
    } catch (error) {
      console.log("Biometric setup error:", error);
    } finally {
      setBiometricLoading(false);
    }

    setTimeout(() => {
      navigation.navigate("OnBoarding1");
    }, 500);
  };
  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="PIN Code" />}
      footerUnScrollable={() => (
        <View style={{ padding: 12, marginBottom: 12 }}>
          <AuthFooter onPress={onContinue} loading={loading} />
        </View>
      )}
    >
      <CustomText
        label="Confirm your PIN Code"
        fontFamily={fonts.semiBold}
        fontSize={24}
        marginTop={12}
        lineHeight={24 * 1.4}
      />
      <CustomText
        label={"Please enter your PIN code again to confirm it"}
        color={isDark ? COLORS.gray1 : colors.textSecondary}
        marginBottom={40}
        marginTop={6}
      />

      <OTPComponent value={otp} setValue={setOtp} error={error} />
      <BiometricModal
        isVisible={showBiometricModal}
        onDisable={() => setShowBiometricModal(false)}
        title={getBiometricText()}
        subtitle="You can use biometric authentication for quick and secure access to your account."
        btnOne="Continue"
        btnTwo="Later"
        onBtnOne={onContinueModal}
        loading={biometricLoading}
        onBtnTwo={onLaterModal}
      />
    </ScreenWrapper>
  );
};

export default ConfirmPinCode;
