import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";

import fonts from "../../../assets/fonts";
import {
  setIsEmail,
  setLocation,
  setLoginValue,
  setUserData,
} from "../../../store/reducer/usersSlice";
import { setToken } from "../../../store/reducer/AuthConfig";
import { COLORS } from "../../../utils/COLORS";
import useLocation from "../../../utils/useLocation";
import ImageFast from "../../../components/ImageFast";
import { Images } from "../../../assets/images";
import { useNavigation } from "@react-navigation/native";
import { post } from "../../../services/ApiRequest";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const Login = ({}) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { getCurrentLocation } = useLocation();
  const getLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      dispatch(setLocation(location));
    }
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showEmailSuccessColor, setShowEmailSuccessColor] = useState(false);
  const [loading, setLoading] = useState(false);

  const reduxSavedAccounts = useSelector(
    (state) => state?.users?.savedAccounts || [],
  );
  const hasSavedAccounts =
    Array.isArray(reduxSavedAccounts) && reduxSavedAccounts.length > 0;

  console.log(
    "hasSavedAccounts---",
    hasSavedAccounts,
    "reduxSavedAccounts---",
    reduxSavedAccounts,
  );

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const emailErrorCheck = (val) => {
    let newErrors = "";
    if (!val.trim()) {
      newErrors = "Please enter your email";
    } else if (!emailRegex.test(val.trim())) {
      newErrors = "Please enter a valid email address";
    } else {
      newErrors = "";
      setShowEmailSuccessColor(true);
      setTimeout(() => {
        setShowEmailSuccessColor(false);
      }, 2000);
    }
    return newErrors;
  };

  const passwordErrorCheck = (val) => {
    let newErrors = "";
    if (!val.trim()) {
      newErrors = "Please enter your password";
    } else if (val.length < 6) {
      newErrors = "Password must be at least 6 characters";
    } else {
      newErrors = "";
    }
    return newErrors;
  };

  const handleContinue = async () => {
    const emailErr = emailErrorCheck(email);
    const passwordErr = passwordErrorCheck(password);
    const fcmtoken = await AsyncStorage.getItem("fcmToken");

    if (emailErr || passwordErr) {
      setEmailError(emailErr);
      setPasswordError(passwordErr);
      return;
    }

    setEmailError("");
    setPasswordError("");

    const body = {
      email: email.trim(),
      password: password,
      ...(fcmtoken && { fcmToken: fcmtoken }),
    };

    try {
      setLoading(true);
      const response = await post("auth/login", body);

      if (response?.data?.requiresMfa) {
        if (response?.data?.otp?.code) {
          alert(`2FA Verification Code: ${response.data.otp.code}`);
        } else {
          ToastMessage(
            response?.data?.message || "OTP sent to email",
            "success",
          );
        }

        if (response?.data?.token) {
          await AsyncStorage.setItem("token", response.data.token);
        }

        navigation.navigate("TwoFactorVerify", {
          token: response?.data?.token,
          email: email.trim(),
        });
        setLoading(false);
        return;
      }

      if (response?.data?.success) {
        // Store user data in Redux
        if (response?.data?.user) {
          dispatch(setUserData(response.data.user));
        }

        // Store tokens in AsyncStorage and Redux
        if (response?.data?.tokens?.accessToken) {
          dispatch(setToken(response.data.tokens.accessToken));
          await AsyncStorage.setItem("token", response.data.tokens.accessToken);
        }

        if (response?.data?.tokens?.refreshToken) {
          await AsyncStorage.setItem(
            "refreshToken",
            response.data.tokens.refreshToken,
          );
        }

        // Store login value
        dispatch(setLoginValue(email));
        dispatch(setIsEmail(true));

        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: "MainStack" }],
        });
      } else {
        // Handle unsuccessful login
        const errorMessage =
          response?.data?.message || "Invalid email or password";

        console.log("errorMessage----", errorMessage);

        setEmailError("Invalid credentials");
        setPasswordError("Invalid credentials");
        ToastMessage(errorMessage, "error");
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Login error:", error);

      // Handle error response
      const errorMessage =
        error?.response?.data?.message || "Invalid email or password";

      setEmailError("Invalid credentials");
      setPasswordError("Invalid credentials");
      ToastMessage(errorMessage, "error");
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => (
        <View
          style={[
            styles.logo,
            {
              backgroundColor: isDark ? "#FFFFFF14" : "rgba(18, 18, 18, 0.08)",
            },
          ]}
        />
      )}
      footerUnScrollable={() => (
        <View style={{ padding: 12 }}>
          <AuthFooter
            onPress={handleContinue}
            loading={loading}
            btnDisabled={!email.trim() || !password.trim()}
          />
        </View>
      )}
    >
      <CustomText
        label="Login to PSC"
        fontFamily={fonts.semiBold}
        fontSize={24}
        lineHeight={24 * 1.4}
        marginTop={16}
        marginBottom={18}
      />

      {/* Email Field */}
      <CustomInput
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) {
            // Clear API errors immediately when user starts typing
            if (
              emailError.includes("Invalid credentials") ||
              emailError.includes("credentials")
            ) {
              setEmailError("");
            } else {
              // For validation errors, check if input is valid
              const newError = emailErrorCheck(text);
              if (!newError) {
                setEmailError("");
              }
            }
          }
        }}
        marginBottom={4}
        placeholder="E.g. abc@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        withLabel="EMAIL ADDRESS"
      />
      <ErrorComponent
        errorTitle={
          !email
            ? "Enter Your Email"
            : showEmailSuccessColor
            ? "Valid email address."
            : emailError
            ? "Invalid Credentials"
            : "Enter your email to proceed"
        }
        error={emailError}
        isValid={showEmailSuccessColor}
        color={
          showEmailSuccessColor
            ? "#64CD75"
            : emailError
            ? "#EE1045"
            : isDark
            ? COLORS.gray2
            : colors.textSecondary
        }
        font={fonts.medium}
        // marginTop={emailError ? -6 : 0}
      />

      {/* Password Field */}
      <CustomInput
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) {
            // Clear API errors immediately when user starts typing
            if (
              passwordError.includes("failed") ||
              passwordError.includes("credentials") ||
              passwordError.includes("Invalid")
            ) {
              setPasswordError("");
            } else {
              // For validation errors, check if input is valid
              const newError = passwordErrorCheck(text);
              if (!newError) {
                setPasswordError("");
              }
            }
          }
        }}
        marginTop={12}
        marginBottom={4}
        placeholder="Enter your password"
        autoCapitalize="none"
        secureTextEntry={true}
        withLabel="PASSWORD"
      />
      <ErrorComponent
        errorTitle={
          !password
            ? "Enter Your Password"
            : passwordError
            ? "Invalid Credentials"
            : "Enter your password"
        }
        error={passwordError}
        color={
          passwordError
            ? "#EE1045"
            : isDark
            ? COLORS.gray2
            : colors.textSecondary
        }
        marginBottom={8}
        // marginTop={passwordError ? -6 : 0}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("ForgotPass")}
        activeOpacity={0.6}
        style={styles.item}
      >
        <CustomText
          label="Forgot my password"
          color={COLORS.buttonColor}
          fontFamily={fonts.regular}
          fontSize={12}
          lineHeight={12 * 1.4}
        />
        <ImageFast
          style={{ height: 10, width: 10, marginLeft: 4 }}
          source={Images.uparrow}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <CustomText
        label="Don't have an account? Register"
        color={COLORS.buttonColor}
        fontFamily={fonts.regular}
        alignSelf={"center"}
        marginTop={30}
        onPress={() => navigation.navigate("SignUpScreens")}
      />

      {hasSavedAccounts && (
        <TouchableOpacity
          onPress={() => navigation.navigate("PreviousAccounts")}
          style={{
            alignSelf: "center",
            marginTop: 18,
            paddingVertical: 10,
            paddingHorizontal: 16,
          }}
          activeOpacity={0.7}
        >
          <CustomText
            label="Sign in with previous account"
            color={COLORS.buttonColor}
            fontFamily={fonts.medium}
            fontSize={14}
            alignSelf="center"
          />
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  logo: {
    width: 44,
    height: 44,
    alignSelf: "center",
    marginVertical: 20,
    borderRadius: 99,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 35,
  },
  circle: {
    backgroundColor: "#4347FF",
    height: 24,
    width: 24,
    borderRadius: 100,
  },
  locationContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  locationInfo: {
    marginBottom: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
  },
});
