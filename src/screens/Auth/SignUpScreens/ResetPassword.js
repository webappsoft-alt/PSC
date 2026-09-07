import { useNavigation } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import { useDispatch } from "react-redux";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import ErrorComponent from "../../../components/ErrorComponent";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";

import { setUserData } from "../../../store/reducer/usersSlice";
import { setToken } from "../../../store/reducer/AuthConfig";
import { post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../contexts/ThemeContext";

const ResetPassword = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const [password, setPassword] = useState("");
    const [showSuccessColor, setShowSuccessColor] = useState(false);

    useEffect(() => {
      setBtnDisabled?.(!password.trim());
    }, [password]);

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
      } else {
        setError("");
        let { verifyVia, ...cleanState } = state;
        let finalState = cleanState;

        if (finalState?.phone) {
          let { email, ...data } = finalState;
          finalState = data;
        } else if (finalState?.email) {
          let { phone, ...data } = finalState;
          finalState = data;
        }

        if (currentIndex < 12) {
          setCurrentIndex(8);
        }
      }
    };

    const back = () => {
      setCurrentIndex(6);
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
        setError("Password Matched");
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
            marginTop={26}
          />
          <CustomInput
            value={password}
            onChangeText={(text) => errorCheck(text)}
            marginTop={4}
            marginBottom={8}
            placeholder="********"
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
                : (isDark ? COLORS.subtitle : colors.textSecondary)
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
