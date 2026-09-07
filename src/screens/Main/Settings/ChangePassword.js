import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useDispatch } from "react-redux";

import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";

import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { put } from "../../../services/ApiRequest";
import { logout } from "../../../store/reducer/AuthConfig";
import { setUserData } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const ChangePassword = () => {
  const { colors } = useTheme();
  const navigate = useNavigation();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [minSuccess, setMinSuccess] = useState(false);
  const [upperSuccess, setUpperSuccess] = useState(false);
  const [digitSuccess, setDigitSuccess] = useState(false);
  const [matchSuccess, setMatchSuccess] = useState(false);

  const [error, setError] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const validateCurrentPassword = (password) => {
    if (!password.trim()) {
      return "Current password is required";
    }
    return "";
  };

  const validateNewPassword = (password) => {
    if (!password.trim()) {
      return "New password is required";
    }
    if (password === currentPassword) {
      return "New password must be different from current password";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least 1 uppercase letter";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least 1 number";
    }
    return "";
  };

  const validatePassword = (pwd) => {
    setNewPassword(pwd);
    setMinSuccess(pwd.length >= 8);
    setUpperSuccess(/[A-Z]/.test(pwd));
    setDigitSuccess(/\d/.test(pwd));
    if (confirmPassword) setMatchSuccess(pwd === confirmPassword);

    const newError = validateNewPassword(pwd);
    setError((prev) => ({ ...prev, new: newError }));
  };

  const validateConfirm = (pwd) => {
    setConfirmPassword(pwd);
    const isMatch = pwd === newPassword;
    setMatchSuccess(isMatch);

    setError((prev) => ({
      ...prev,
      confirm: !isMatch ? "Passwords do not match" : "",
    }));
  };

  const generatePassword = () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let newPass = "A1"; // Ensure minimum requirements
    for (let i = 0; i < 6; i++) {
      newPass += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    newPass = newPass
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
    validatePassword(newPass);
  };

  const handleSubmit = async () => {
    const currentError = validateCurrentPassword(currentPassword);
    const newError = validateNewPassword(newPassword);
    const confirmError = !matchSuccess ? "Passwords do not match" : "";

    setError({
      current: currentError,
      new: newError,
      confirm: confirmError,
    });

    if (currentError || newError || confirmError) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await put("user/update-password", {
        oldPassword: currentPassword,
        newPassword: confirmPassword,
      });

      if (response?.data?.success) {
        ToastMessage(response?.data?.message, "success");
        dispatch(setUserData({}));
        dispatch(logout());
        navigate.reset({
          index: 0,
          routes: [{ name: "AuthStack" }],
        });
      }
    } catch (error) {
      ToastMessage(error?.message || "An error occurred", "error");
      if (error?.message) {
        setError((prev) => ({
          ...prev,
          current: error.message,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title={"Change my Password"} />}
      footerUnScrollable={() => (
        <AuthFooter
          paddingHorizontal={12}
          onPress={handleSubmit}
          onBackPress={() => navigate.goBack()}
          btnLoading={isLoading}
          marginBottom={2}
          btnDisabled={
            !currentPassword.trim() ||
            !newPassword.trim() ||
            !confirmPassword.trim()
          }
        />
      )}
    >
      <CustomText
        label="Change your password at any time. Make sure to use a strong password that you don’t use anywhere else."
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={16}
        marginTop={8}
      />
      <CustomText
        label={"Current password"}
        textTransform={"uppercase"}
        fontSize={12}
        fontFamily={fonts.medium}
        color={colors.textSecondary}
        marginBottom={8}
      />
      <CustomInput
        placeholder="********"
        secureTextEntry
        value={currentPassword}
        onChangeText={(text) => {
          setCurrentPassword(text);
          setError((prev) => ({ ...prev, current: "" }));
        }}
        marginBottom={6}
        error={error.current}
      />
      {!error.current && (
        <ErrorComponent errorTitle="The password you use to log in to your account." />
      )}

      <CustomText
        label={"New password"}
        textTransform={"uppercase"}
        fontSize={12}
        fontFamily={fonts.medium}
        color={colors.textSecondary}
        marginTop={14}
        marginBottom={8}
      />
      <CustomInput
        placeholder="********"
        secureTextEntry
        value={newPassword}
        onChangeText={validatePassword}
        error={error.new}
      />

      <TouchableOpacity style={styles.item} onPress={generatePassword}>
        <CustomText
          label="Generate a password for me"
          color={COLORS.buttonColor}
          fontFamily={fonts.regular}
          fontSize={12}
        />
        <ImageFast
          style={{
            height: 10,
            width: 10,
            marginLeft: 4,
            tintColor: COLORS.buttonColor,
          }}
          source={Images.uparrow}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Divider thickness={1} color={COLORS.inputBg} marginVertical={12} />

      <ErrorComponent
        errorTitle="Minimum 8 characters."
        isValid={minSuccess}
        color={minSuccess ? "#64CD75" : colors.textSecondary}
      />
      <ErrorComponent
        errorTitle="Minimum 1 uppercase"
        isValid={upperSuccess}
        color={upperSuccess ? "#64CD75" : colors.textSecondary}
      />
      <ErrorComponent
        errorTitle="Minimum 1 digit"
        isValid={digitSuccess}
        color={digitSuccess ? "#64CD75" : colors.textSecondary}
      />

      <CustomText
        label={"Confirm new password"}
        textTransform={"uppercase"}
        fontSize={12}
        fontFamily={fonts.medium}
        color={colors.textSecondary}
        marginTop={20}
        marginBottom={8}
      />
      <CustomInput
        placeholder="********"
        secureTextEntry
        value={confirmPassword}
        onChangeText={validateConfirm}
        error={error.confirm}
      />
      {!error.confirm && (
        <ErrorComponent
          errorTitle="Password matched"
          isValid={matchSuccess}
          color={matchSuccess ? "#64CD75" : colors.textSecondary}
        />
      )}
    </ScreenWrapper>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: COLORS.gray1,
    lineHeight: 12 * 1.4,
  },
  darkText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: COLORS.primaryColor,
  },
});
