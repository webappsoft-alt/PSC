import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { forwardRef, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useDispatch } from "react-redux";

import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";

import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";

const ResetPassword = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setLoadingState }, ref) => {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const [password, setPassword] = useState("");
    const [showSuccessColor, setShowSuccessColor] = useState(false);

    const [error, setError] = useState("Password do not match");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
      if (!password) {
        setError("Please enter your password");
        setIsError(true);
        setShowSuccessColor(false);
        return;
      } else if (state?.password !== password) {
        setError("Password do not match");
        setIsError(true);
        setShowSuccessColor(false);
        return;
      }

      setError("");
      setIsError(false);

      // Call update password API with token in header
      try {
        setLoading(true);
        if (setLoadingState) setLoadingState(true);

        const body = {
          newPassword: state?.password,
        };

        console.log("bodyy====>", body);

        // Make PATCH request with token in header
        const response = await axios.patch(
          `https://psc.sola-group.ch/api/auth/update-password`,
          body,
          {
            headers: {
              Authorization: `Bearer ${state?.token}`,
              "Content-Type": "application/json",
            },
          },
        );

        console.log("Password reset response:", response?.data);

        if (response?.data?.success) {
          ToastMessage(
            response?.data?.message || "Password reset successful",
            "success",
          );

          // Navigate to login screen
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        } else {
          const errorMessage =
            response?.data?.message || "Failed to reset password";
          setError(errorMessage);
          setIsError(true);
          ToastMessage(errorMessage, "error");
        }

        setLoading(false);
        if (setLoadingState) setLoadingState(false);
      } catch (error) {
        setLoading(false);
        if (setLoadingState) setLoadingState(false);
        console.error("Password reset error:", error);

        const errorMessage =
          error?.response?.data?.message ||
          "Failed to reset password. Please try again.";
        setError(errorMessage);
        setIsError(true);
        ToastMessage(errorMessage, "error");
      }
    };

    const back = () => {
      if (currentIndex > 1) {
        setCurrentIndex(currentIndex - 1);
      }
    };

    useImperativeHandle(ref, () => ({ submit, back, isLoading: loading }));

    const errorCheck = (pwd) => {
      setPassword(pwd);
      if (!pwd) {
        setError("Please enter your password");
        setShowSuccessColor(false);
        setIsError(true);
        return;
      } else if (state?.password !== pwd) {
        setError("Password do not match");
        setShowSuccessColor(false);
        setIsError(true);
      } else {
        setError("Valid Password");
        setIsError(false);
        setShowSuccessColor(true);
        setTimeout(() => {
          setShowSuccessColor(false);
        }, 2000);
      }
    };

    return (
      <View style={{ justifyContent: "space-between", flex: 1 }}>
        <View>
          <CustomText
            label="Confirm password"
            fontFamily={fonts.semiBold}
            fontSize={24}
            color={isDark ? COLORS.white : colors.text}
            marginTop={12}
          />
          <CustomInput
            value={password}
            onChangeText={(text) => errorCheck(text)}
            marginTop={4}
            marginBottom={8}
            placeholder="************"
            secureTextEntry
          />

          <ErrorComponent
            error={isError}
            isValid={showSuccessColor}
            errorTitle={error}
            color={
              showSuccessColor
                ? "#64CD75"
                : isError
                ? "#EE1045"
                : isDark
                ? COLORS.subtitle
                : colors.textSecondary
            }
          />
          {/* <ErrorComponent errorTitle={"Please re-enter your password"} /> */}
        </View>
      </View>
    );
  },
);

export default ResetPassword;

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});
