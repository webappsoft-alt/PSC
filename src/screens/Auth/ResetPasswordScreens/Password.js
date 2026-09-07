import { StyleSheet, TouchableOpacity, Image, View } from "react-native";
import { forwardRef, useImperativeHandle, useState } from "react";

import ErrorComponent from "../../../components/ErrorComponent";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ImageFast from "../../../components/ImageFast";

import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import Divider from "../../../components/Divider";
import { PNGIcons } from "../../../assets/images/icons";
import { useTheme } from "../../../contexts/ThemeContext";

const Password = forwardRef(
  ({ setState, state, currentIndex, setCurrentIndex }, ref) => {
    const { colors, isDark } = useTheme();
    const [minLength, setMinLength] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasDigit, setHasDigit] = useState(false);
    const [minSuccess, setMinSuccess] = useState(false);
    const [upperSuccess, setUpperSuccess] = useState(false);
    const [digitSuccess, setDigitSuccess] = useState(false);
    const [pass, setPass] = useState("");

    const errorCheck = (pwd) => {
      setPass(pwd);
      if (pwd.length >= 8) {
        setMinLength(true);
        setMinSuccess(true);
      } else {
        setMinLength(false);
        setMinSuccess(false);
      }
      if (/[A-Z]/.test(pwd)) {
        setHasUppercase(true);
        setUpperSuccess(true);
      } else {
        setHasUppercase(false);
        setUpperSuccess(false);
      }
      if (/\d/.test(pwd)) {
        setHasDigit(true);
        setDigitSuccess(true);
      } else {
        setHasDigit(false);
        setDigitSuccess(false);
      }
      if (!pwd.length >= 8 || !/[A-Z]/.test(pwd) || !/\d/.test(pwd)) {
        return true;
      } else {
        return false;
      }
    };

    const submit = () => {
      const err = errorCheck(pass);
      if (err) return;
      setState({ ...state, password: pass });
      if (currentIndex < 6) {
        setCurrentIndex(currentIndex + 1);
      }
    };

    const back = () => {
      if (currentIndex > 1) {
        setCurrentIndex(currentIndex - 1);
      }
    };

    const generatePassword = () => {
      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let newPassword = "A1";
      for (let i = 0; i < 6; i++) {
        newPassword += charset.charAt(
          Math.floor(Math.random() * charset.length),
        );
      }
      newPassword = newPassword
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");

      setPass(newPassword);
      setMinLength(false);
      setHasUppercase(false);
      setHasDigit(false);
      setMinSuccess(true);
      setUpperSuccess(true);
      setDigitSuccess(true);
    };

    useImperativeHandle(ref, () => ({ submit, back }));

    return (
      <View style={{ justifyContent: "space-between", flex: 1 }}>
        <View>
          <CustomText
            label="Create a password"
            fontFamily={fonts.semiBold}
            fontSize={24}
            color={isDark ? COLORS.white : colors.text}
            marginTop={12}
          />
          <CustomInput
            value={pass}
            onChangeText={(text) => errorCheck(text)}
            marginTop={8}
            marginBottom={16}
            placeholder="************"
            secureTextEntry
          />

          <TouchableOpacity style={[styles.item, {}]}>
            <CustomText
              onPress={generatePassword}
              label="Generate a password for me"
              color={COLORS.buttonColor}
              fontFamily={fonts.regular}
              fontSize={12}
            />
            <ImageFast
              style={{ height: 10, width: 10, marginLeft: 4 }}
              source={Images.uparrow}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Divider thickness={1} color={isDark ? "#FFFFFF29" : colors.border} marginVertical={12} />

          <ErrorComponent
            errorTitle="Minimum 8 characters."
            isValid={minSuccess}
            error={minLength}
            color={
              minSuccess ? "#64CD75" : minLength ? "#EE1045" : (isDark ? COLORS.subtitle : colors.textSecondary)
            }
          />
          <ErrorComponent
            errorTitle="Minimum 1 uppercase"
            isValid={upperSuccess}
            error={hasUppercase}
            color={
              upperSuccess
                ? "#64CD75"
                : hasUppercase
                ? "#EE1045"
                : (isDark ? COLORS.subtitle : colors.textSecondary)
            }
          />
          <ErrorComponent
            errorTitle="Minimum 1 digit"
            isValid={digitSuccess}
            error={hasDigit}
            color={
              digitSuccess ? "#64CD75" : hasDigit ? "#EE1045" : (isDark ? COLORS.subtitle : colors.textSecondary)
            }
          />
          <View style={styles.row}>
            <Image
              source={PNGIcons.insurance}
              style={{
                height: 12,
                width: 12,
                tintColor: isDark ? COLORS.subtitle : colors.textSecondary,
                marginRight: 4,
              }}
            />
            <CustomText
              label={"Your password on PSC is encrypted & secured."}
              color={isDark ? COLORS.subtitle : colors.textSecondary}
              fontSize={12}
            />
          </View>
        </View>
      </View>
    );
  },
);

export default Password;

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
});
