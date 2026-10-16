import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";

import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const MAX_LENGTH = 37;

const Surname = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [lastName, setLastName] = useState(state?.last_name || "");
    const [error, setError] = useState("");

    useEffect(() => {
      setBtnDisabled?.(!lastName.trim());
    }, [lastName]);

    const nameRegex = /^[A-Za-z\s'-]{2,37}$/;

    const errorCheck = (val) => {
      let newErrors = "";
      if (!val.trim()) {
        newErrors = "Please enter your surname";
      } else if (!nameRegex.test(val.trim())) {
        newErrors =
          "Please enter a valid surname (letters only, 2-37 characters)";
      }
      return newErrors;
    };

    const submit = () => {
      const err = errorCheck(lastName);
      if (err) {
        setError(err);
        return;
      }
      setError("");
      setState({ ...state, last_name: lastName.trim() });
      setCurrentIndex(6);
    };

    const back = () => {
      setCurrentIndex(4);
    };

    useImperativeHandle(ref, () => ({ submit, back }));

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="What's your surname?"
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            letterSpacing={-0.24}
            marginTop={12}
            marginBottom={6}
            color={isDark ? COLORS.white : colors.text}
          />

          <CustomInput
            placeholder="E.g. Johnson"
            autoCapitalize="words"
            maxLength={MAX_LENGTH}
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (error) {
                const newError = errorCheck(text);
                if (!newError) setError("");
              }
            }}
            error={error}
            marginBottom={5}
          />

          <View style={styles.helperRow}>
            <ErrorComponent
              errorTitle="This will appear on your profile."
              color={isDark ? COLORS.gray2 : colors.textSecondary}
              font={fonts.regular}
            />
            <CustomText
              label={`${lastName.length}/${MAX_LENGTH}`}
              color={isDark ? COLORS.gray64 : colors.textSecondary}
              fontSize={12}
              lineHeight={12 * 1.4}
            />
          </View>
          <ErrorComponent
            errorTitle="Inappropriate names are forbidden."
            color={isDark ? COLORS.gray2 : colors.textSecondary}
            font={fonts.regular}
          />
        </View>
      </View>
    );
  },
);

export default Surname;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    flex: 1,
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
});
