import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";

import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const FullName = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [firstName, setFirstName] = useState(state?.full_name || "");
    const [lastName, setLastName] = useState(state?.last_name || "");
    const [firstNameError, setFirstNameError] = useState("");
    const [lastNameError, setLastNameError] = useState("");

    useEffect(() => {
      setBtnDisabled?.(!firstName.trim() || !lastName.trim());
    }, [firstName, lastName]);

    const nameRegex = /^[A-Za-z\s'-]{2,50}$/;

    const errorCheckFirstName = (val) => {
      setFirstName(val);
      let newErrors = "";
      if (!val.trim()) {
        newErrors = "Please enter your first name";
      } else if (!nameRegex.test(val.trim())) {
        newErrors =
          "Please enter a valid first name (letters only, 2–50 characters)";
      }
      return newErrors;
    };

    const errorCheckLastName = (val) => {
      setLastName(val);
      let newErrors = "";
      if (!val.trim()) {
        newErrors = "Please enter your last name";
      } else if (!nameRegex.test(val.trim())) {
        newErrors =
          "Please enter a valid last name (letters only, 2–50 characters)";
      }
      return newErrors;
    };

    const submit = () => {
      const firstErr = errorCheckFirstName(firstName);
      const lastErr = errorCheckLastName(lastName);

      if (firstErr) {
        setFirstNameError(firstErr);
        return;
      }
      if (lastErr) {
        setLastNameError(lastErr);
        return;
      }

      setFirstNameError("");
      setLastNameError("");
      setState({
        ...state,
        full_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      if (currentIndex < 12) {
        setCurrentIndex(9);
      }
    };

    const back = () => {
      setCurrentIndex(7);
    };

    useImperativeHandle(ref, () => ({ submit, back }));

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="What's your name?"
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            marginTop={12}
            letterSpacing={-1}
            marginBottom={6}
            color={isDark ? COLORS.white : colors.text}
          />

          <CustomInput
            placeholder="First Name"
            autoCapitalize={"words"}
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              if (firstNameError) {
                const newError = errorCheckFirstName(text);
                if (!newError) {
                  setFirstNameError("");
                }
              }
            }}
            error={firstNameError}
            marginBottom={5}
          />

          <CustomInput
            placeholder="Last Name"
            autoCapitalize={"words"}
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (lastNameError) {
                const newError = errorCheckLastName(text);
                if (!newError) {
                  setLastNameError("");
                }
              }
            }}
            error={lastNameError}
            marginBottom={5}
          />

          <ErrorComponent
            errorTitle="This will appear on your profile."
            marginBottom={2}
          />
          <ErrorComponent errorTitle="Inappropriate names are forbidden." />
        </View>
      </View>
    );
  },
);

export default FullName;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    flex: 1,
  },
});
