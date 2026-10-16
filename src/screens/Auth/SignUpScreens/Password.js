import { StyleSheet, TouchableOpacity, View } from "react-native";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import ErrorComponent from "../../../components/ErrorComponent";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";

import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import Divider from "../../../components/Divider";
import { useTheme } from "../../../contexts/ThemeContext";

const Password = forwardRef(
  ({ setState, state, currentIndex, setCurrentIndex, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [minLength, setMinLength] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasDigit, setHasDigit] = useState(false);
    const [hasSpecialChar, setHasSpecialChar] = useState(false);
    const [minSuccess, setMinSuccess] = useState(false);
    const [upperSuccess, setUpperSuccess] = useState(false);
    const [digitSuccess, setDigitSuccess] = useState(false);
    const [specialSuccess, setSpecialSuccess] = useState(false);
    const [pass, setPass] = useState("");

    useEffect(() => {
      setBtnDisabled?.(!pass.trim());
    }, [pass]);

    const hasSpecialCharacter = (str) => {
      const specialChars = /[!@#$%^&*(),.?":{}|<>]/;
      return specialChars.test(str);
    };

    const errorCheck = (pwd) => {
      setPass(pwd);

      // Check minimum length
      if (pwd.length >= 8) {
        setMinLength(false);
        setMinSuccess(true);
      } else {
        setMinLength(pwd.length > 0);
        setMinSuccess(false);
      }

      // Check uppercase
      if (/[A-Z]/.test(pwd)) {
        setHasUppercase(false);
        setUpperSuccess(true);
      } else {
        setHasUppercase(pwd.length > 0);
        setUpperSuccess(false);
      }

      // Check digit
      if (/\d/.test(pwd)) {
        setHasDigit(false);
        setDigitSuccess(true);
      } else {
        setHasDigit(pwd.length > 0);
        setDigitSuccess(false);
      }

      // Check special character
      if (hasSpecialCharacter(pwd)) {
        setHasSpecialChar(false);
        setSpecialSuccess(true);
      } else {
        setHasSpecialChar(pwd.length > 0);
        setSpecialSuccess(false);
      }

      // Return true if any validation fails
      if (
        pwd.length < 8 ||
        !/[A-Z]/.test(pwd) ||
        !/\d/.test(pwd) ||
        !hasSpecialCharacter(pwd)
      ) {
        return true;
      } else {
        return false;
      }
    };

    const submit = () => {
      const err = errorCheck(pass);
      if (err) {
        // Show all errors in red when submit is clicked with invalid password
        if (pass.length < 8) {
          setMinLength(true);
        }
        if (!/[A-Z]/.test(pass)) {
          setHasUppercase(true);
        }
        if (!/\d/.test(pass)) {
          setHasDigit(true);
        }
        if (!hasSpecialCharacter(pass)) {
          setHasSpecialChar(true);
        }
        return;
      }
      setState({ ...state, password: pass });
      setCurrentIndex(12);
    };

    const back = () => {
      setCurrentIndex(10);
    };

    const generatePassword = () => {
      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const specialChars = "!@#$%^&*";
      let newPassword =
        "A1" +
        specialChars.charAt(Math.floor(Math.random() * specialChars.length));
      for (let i = 0; i < 5; i++) {
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
      setHasSpecialChar(false);
      setMinSuccess(true);
      setUpperSuccess(true);
      setDigitSuccess(true);
      setSpecialSuccess(true);
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
            marginTop={26}
          />
          <CustomInput
            value={pass}
            onChangeText={(text) => errorCheck(text)}
            marginTop={8}
            marginBottom={16}
            placeholder="********"
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
            <Icons
              family="MaterialSymbolsRounded"
              name="arrow_outward"
              size={12}
              color={COLORS.buttonColor}
              marginLeft={4}
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
          <ErrorComponent
            errorTitle="Minimum 1 special character"
            isValid={specialSuccess}
            error={hasSpecialChar}
            color={
              specialSuccess
                ? "#64CD75"
                : hasSpecialChar
                ? "#EE1045"
                : (isDark ? COLORS.subtitle : colors.textSecondary)
            }
          />
          <View style={styles.row}>
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="verified_user"
              size={12}
              color={isDark ? COLORS.subtitle : colors.textSecondary}
              marginRight={4}
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
