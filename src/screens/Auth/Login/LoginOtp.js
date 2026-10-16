import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import ErrorComponent from "../../../components/ErrorComponent";
import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
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

const LoginOtp = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const timerRef = useRef(null);

  const email = route?.params?.email;
  const phone = route?.params?.phone;
  const identifier = email ? { email } : { phone };
  const sentTo = email || phone;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendLoad, setResendLoad] = useState(false);

  useEffect(() => {
    if (isTimerActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer((p) => p - 1), 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [timer, isTimerActive]);

  useEffect(() => {
    onSendAgain();
    return () => timerRef.current && clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    setTimer(30);
    setIsTimerActive(true);
  };

  const isValid = otp.trim().length >= 4;

  const onChange = (value) => {
    setOtp(value);
    if (error) setError("");
  };

  const onSendAgain = async () => {
    try {
      setResendLoad(true);
      const res = await post("auth/otplogin", { ...identifier });
      if (res?.data?.success) {
        // Codes aren't delivered by email/SMS yet, so surface it for testing.
        Alert.alert("OTP Code", `Verification code: ${res?.data?.code}`);
        startTimer();
      }
    } catch (err) {
      ToastMessage(err?.message || "Failed to send code", "error");
    } finally {
      setResendLoad(false);
    }
  };

  const navigateToWelcomeScreen = async (res) => {
    dispatch(setUserData(res?.user));
    dispatch(setToken(res?.tokens?.accessToken));
    await AsyncStorage.setItem("token", res?.tokens?.accessToken);
    await AsyncStorage.setItem("refreshToken", res?.tokens?.refreshToken);
    navigation.reset({ index: 0, routes: [{ name: "WelcomeScreen" }] });
  };

  const onContinuePress = async () => {
    if (!isValid) {
      setError("Please enter the verification code");
      return;
    }
    try {
      setLoading(true);
      const res = await post("auth/verify-otp-login", {
        ...identifier,
        code: otp.trim(),
      });
      if (res?.data?.success) {
        navigateToWelcomeScreen(res?.data);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      // Shown once, inside the input's own error line (server's reason).
      setError(err?.message || "Invalid verification code");
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="OTP code" textTransform="none" />}
      footerUnScrollable={() => (
        <AuthFooter
          paddingHorizontal={12}
          onPress={onContinuePress}
          loading={loading}
          btnBackgroundColor={isDark ? COLORS.white : colors.text}
          btnColor={isDark ? COLORS.primaryColor : colors.background}
          btnDisabled={!isValid}
        />
      )}
    >
      <CustomText
        label="Please enter the code"
        fontFamily={fonts.semiBold}
        fontSize={24}
        lineHeight={24 * 1.4}
        marginTop={32}
        marginBottom={8}
        color={isDark ? COLORS.white : colors.text}
      />

      <View>
        <CustomInput
          value={otp}
          onChangeText={onChange}
          placeholder="E.g. XSI456"
          autoCapitalize="characters"
          autoCorrect={false}
          error={error || false}
          marginBottom={5}
        />
        {isValid && !error && (
          <View style={styles.checkWrap} pointerEvents="none">
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="check_circle"
              size={22}
              color={COLORS.buttonColor}
            />
          </View>
        )}
      </View>

      {!error && (
        <ErrorComponent
          errorTitle="Valid verification code."
          color={isDark ? COLORS.gray2 : colors.textSecondary}
          font={fonts.regular}
          marginBottom={2}
        />
      )}
      <ErrorComponent
        errorTitle="Verification code was sent to:"
        color={isDark ? COLORS.gray2 : colors.textSecondary}
        font={fonts.regular}
        marginBottom={4}
      />
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.goBack()}
        style={styles.sentToRow}
      >
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name={email ? "mail" : "call"}
          size={16}
          color={isDark ? COLORS.white : colors.text}
          marginRight={8}
        />
        <CustomText
          label={sentTo}
          fontFamily={fonts.medium}
          fontSize={14}
          lineHeight={14 * 1.4}
          marginRight={8}
          color={isDark ? COLORS.white : colors.text}
        />
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name="edit"
          size={16}
          color={isDark ? COLORS.white : colors.text}
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        disabled={isTimerActive || resendLoad}
        onPress={isTimerActive ? undefined : onSendAgain}
        style={[
          styles.resendBtn,
          {
            backgroundColor: isTimerActive
              ? isDark
                ? COLORS.white04
                : colors.surfaceAlt
              : isDark
              ? COLORS.white
              : colors.text,
            opacity: isTimerActive ? 0.9 : 1,
          },
        ]}
      >
        {resendLoad ? (
          <ActivityIndicator
            size="small"
            color={isTimerActive ? colors.text : colors.background}
          />
        ) : (
          <View style={styles.resendInner}>
            <CustomText
              label="Send again"
              fontFamily={fonts.semiBold}
              fontSize={12}
              lineHeight={12 * 1.4}
              color={
                isTimerActive
                  ? isDark
                    ? COLORS.white
                    : colors.text
                  : isDark
                  ? COLORS.primaryColor
                  : colors.background
              }
            />
            <Icons
              family="MaterialSymbolsRounded"
              name="replay"
              size={14}
              color={
                isTimerActive
                  ? isDark
                    ? COLORS.white
                    : colors.text
                  : isDark
                  ? COLORS.primaryColor
                  : colors.background
              }
            />
          </View>
        )}
      </TouchableOpacity>

      <ErrorComponent
        errorTitle={
          isTimerActive
            ? `You can request a new code in ${timer} seconds.`
            : "You can request a new code now."
        }
        color={isDark ? COLORS.gray2 : colors.textSecondary}
        font={fonts.regular}
        alignSelf="center"
        marginTop={16}
      />

      <View style={{ gap: 20, marginTop: 40 }}>
        <AuthMethodRow
          type="pin"
          label="Use PIN Code instead"
          onPress={() => navigation.navigate("LoginPin", { email, phone })}
        />
        <OrSeparator />
        <AuthMethodRow
          type="faceid"
          label="Use Face ID instead"
          onPress={() => navigation.navigate("LoginPin", { email, phone })}
        />
        <OrSeparator />
        <AuthMethodRow
          type="password"
          label="Use Password"
          onPress={() => navigation.navigate("LoginPassword", { email, phone })}
        />
      </View>
    </ScreenWrapper>
  );
};

export default LoginOtp;

const styles = StyleSheet.create({
  checkWrap: {
    position: "absolute",
    right: 15,
    top: 17,
    zIndex: 999,
  },
  sentToRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    height: 32,
    borderRadius: 100,
    alignSelf: "center",
    marginTop: 16,
  },
  resendInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});
