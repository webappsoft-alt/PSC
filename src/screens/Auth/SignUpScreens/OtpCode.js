import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import Icons from "../../../components/Icons";

import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import ImageFast from "../../../components/ImageFast";
import { post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const OtpCode = forwardRef(
  ({ state, currentIndex, setCurrentIndex, setLoadingState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [otp, setOtp] = useState(state?.otp || "");
    const [error, setError] = useState("");
    const [showSuccessColor, setShowSuccessColor] = useState(false);
    const [resendLoad, setResendLoad] = useState(false);
    const [timer, setTimer] = useState(30);
    const [isTimerActive, setIsTimerActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef(null);

    const otpRegex = /^[0-9]{6,}$/;

    useEffect(() => {
      setBtnDisabled?.(!otp.trim());
    }, [otp]);

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

    const submit = async () => {
      const err = errorCheck(otp);
      if (err) return;

      setLoading(true);
      if (setLoadingState) setLoadingState(true);
      try {
        const body = {
          ...(state?.phone && { phone: state?.phone?.trim() }),
          ...(state?.email && { email: state?.email?.trim() }),
          code: otp?.trim(),
        };
        const res = await post(`auth/verify-otp`, body);
        console.log("res?.data====", res?.data);

        if (res?.data?.success) {
          if (currentIndex < 12) {
            setCurrentIndex(6);
          }
        } else {
          ToastMessage("Code Invalid", "error");
        }

        setLoading(false);
        if (setLoadingState) setLoadingState(false);
      } catch (error) {
        setLoading(false);
        if (setLoadingState) setLoadingState(false);
      }
    };

    const back = () => {
      setCurrentIndex(4);
    };

    useImperativeHandle(ref, () => ({ submit, back, isLoading: loading }));

    const onSendAgain = async () => {
      let body = {};
      if (state?.phone) {
        body = {
          phone: {
            number: state?.phone.trim(),
            verifyVia: state?.verifyVia,
          },
        };
      } else {
        body = {
          email: state?.email.trim(),
        };
      }
      try {
        setResendLoad(true);
        const res = await post(`auth/send-otp`, body);
        Alert.alert("OTP Received", res.data?.code?.toString(), [
          {
            text: "OK",
            onPress: () => console.log("OK Pressed"),
          },
        ]);
        setResendLoad(false);
        startTimer();
      } catch (error) {
        setResendLoad(false);
      }
    };

    return (
      <View style={{ justifyContent: "space-between", flex: 1 }}>
        <View>
          <CustomText
            label="Please enter the code"
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            color={isDark ? COLORS.white : colors.text}
            marginTop={12}
          />
          <CustomInput
            value={otp}
            onChangeText={(text) => errorCheck(text)}
            marginTop={6}
            marginBottom={5}
            placeholder="E.g. 123456"
            keyboardType="numeric"
          />
          <ErrorComponent
            errorTitle="Valid verification code."
            isValid={showSuccessColor}
            error={error}
            color={
              error ? "#EE1045" : showSuccessColor ? "#64CD75" : (isDark ? COLORS.subtitle : colors.textSecondary)
            }
            marginBottom={4}
          />
          <ErrorComponent
            hideInfo
            errorTitle="Verification code was sent to:"
          />
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              setCurrentIndex(4);
            }}
          >
            <ImageFast
              source={Images.EmailIcon}
              resizeMode={"contain"}
              style={{ width: 11, height: 9.33, marginRight: 8 }}
              tintColor={isDark ? undefined : colors.text}
            />
            <CustomText
              label={state?.email || state?.phone}
              fontFamily={fonts.medium}
              color={isDark ? COLORS.white : colors.text}
              lineHeight={14 * 1.4}
              marginRight={8}
            />
            <Icons
              family="MaterialIcons"
              name="edit"
              size={14}
              color={isDark ? COLORS.white : colors.text}
            />
          </TouchableOpacity>

          <CustomButton
            title="Send again"
            marginTop={40}
            loading={resendLoad}
            width={137}
            fontSize={12}
            height={32}
            rightIconWidth={14}
            rightIconHeight={14}
            backgroundColor={isDark ? COLORS.inputBg : colors.surfaceAlt}
            color={
              isTimerActive
                ? (isDark ? COLORS.gray48 : colors.textSecondary)
                : (isDark ? COLORS.white : colors.text)
            }
            rightIcon={Images.refresh}
            rightIconTintColor={
              isTimerActive
                ? (isDark ? COLORS.gray48 : colors.textSecondary)
                : (isDark ? COLORS.white : colors.text)
            }
            onPress={isTimerActive ? () => {} : onSendAgain}
            indicatorColor={
              isTimerActive
                ? (isDark ? COLORS.gray48 : colors.textSecondary)
                : (isDark ? COLORS.black : colors.background)
            }
            disabled={timer > 0}
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
      </View>
    );
  },
);

export default OtpCode;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
