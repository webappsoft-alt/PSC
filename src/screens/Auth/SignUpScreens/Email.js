import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useDispatch } from "react-redux";

import ErrorComponent from "../../../components/ErrorComponent";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import fonts from "../../../assets/fonts";

import { post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../contexts/ThemeContext";

const Email = forwardRef(
  (
    {
      currentIndex,
      setCurrentIndex,
      state,
      setState,
      setLoadingState,
      setBtnDisabled,
    },
    ref,
  ) => {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const [email, setEmail] = useState(state?.email || "");
    const [showSuccessColor, setShowSuccessColor] = useState(false);
    const [error, setError] = useState("");
    const [emailError, setEmailError] = useState("");

    const [isType, setType] = useState("Phone Number");
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
      setBtnDisabled?.(!email.trim());
    }, [email]);

    useEffect(() => {
      if (state?.email && state?.email.trim().length > 0) {
        setType("Email");
      }
    }, [state]);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const errorCheck = (val, cond) => {
      let newErrors = "";
      if (cond) {
        setEmail(val);
      }
      if (!val.trim()) {
        newErrors = "Please enter your email";
      } else if (!emailRegex.test(val.trim())) {
        newErrors = "Please enter a valid email address";
      } else {
        newErrors = "";
        setShowSuccessColor(true);
        setTimeout(() => {
          setShowSuccessColor(false);
        }, 2000);
      }
      return newErrors || "";
    };

    const submit = async () => {
      const err = errorCheck(email);
      if (err) {
        setError(err);
        return;
      }

      setState({
        ...state,
        email: email.trim(),
        verifyVia: "sms",
      });

      const body = {
        email: email.trim(),
      };

      try {
        setLoading(true);
        if (setLoadingState) setLoadingState(true);

        const res = await post(`auth/send-otp`, body);

        if (res?.data?.success) {
          Alert.alert("OTP Received", res.data?.code?.toString(), [
            {
              text: "OK",
              onPress: () => console.log("OK Pressed"),
            },
          ]);

          if (currentIndex < 12) {
            setCurrentIndex(5);
          }
        } else {
          // Agar success false hai
          const errorMsg =
            res?.data?.message || "Failed to send OTP. Please try again.";
          setError(errorMsg);
        }

        setLoading(false);
        if (setLoadingState) setLoadingState(false);
      } catch (err) {
        ToastMessage(err?.message, "error");
        if (err.message.includes("Email already registered")) {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }
        setEmailError(err?.message);
        setError("Error sending OTP. Please try again.");
        setLoading(false);
        if (setLoadingState) setLoadingState(false);
      }
    };

    const back = () => {
      if (state.role === "regular") {
        setCurrentIndex(2);
      } else {
        setCurrentIndex(3);
      }
    };

    useImperativeHandle(ref, () => ({ submit, back, isLoading: isLoading }));

    return (
      <View style={{ justifyContent: "space-between", flex: 1 }}>
        <View>
          <CustomText
            label={"What is your email?"}
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            marginTop={12}
            marginBottom={6}
            color={isDark ? COLORS.white : colors.text}
          />

          <CustomInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) {
                const newError = errorCheck(text, true);
                if (!newError) {
                  setError("");
                }
              }
            }}
            error={error}
            marginBottom={5}
            placeholder="E.g. abc@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <ErrorComponent
            errorTitle={
              showSuccessColor
                ? "Valid email address."
                : "Please enter a valid email address."
            }
            error={error}
            marginTop={error && -5}
            isValid={showSuccessColor}
            color={
              showSuccessColor ? "#64CD75" : error ? "#EE1045" : (isDark ? COLORS.gray2 : colors.textSecondary)
            }
            marginBottom={2}
          />
          <ErrorComponent
            errorTitle={
              showSuccessColor
                ? "Valid verification code."
                : "We will later use this email to verify your account."
            }
            error={error}
            isValid={showSuccessColor}
            color={
              showSuccessColor ? "#64CD75" : error ? "#EE1045" : (isDark ? COLORS.gray2 : colors.textSecondary)
            }
          />
        </View>
      </View>
    );
  },
);

export default Email;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1212120A",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: COLORS.black,
  },
});
