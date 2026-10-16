import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";

import CustomDropdown from "../../../components/CustomDropdown";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const GENDERS = ["Male", "Female", "Other"];

const Gender = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [gender, setGender] = useState(
      state?.gender
        ? state.gender.charAt(0).toUpperCase() + state.gender.slice(1)
        : "",
    );
    const [error, setError] = useState("");

    useEffect(() => {
      setBtnDisabled?.(!gender);
    }, [gender]);

    const submit = () => {
      if (!gender) {
        setError("Please select an option.");
        return;
      }
      setError("");
      setState({ ...state, gender: gender.toLowerCase() });
      setCurrentIndex(9);
    };

    const back = () => {
      setCurrentIndex(7);
    };

    useImperativeHandle(ref, () => ({ submit, back }));

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="What is your gender?"
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            letterSpacing={-0.24}
            marginTop={12}
            marginBottom={6}
            color={isDark ? COLORS.white : colors.text}
          />

          <CustomDropdown
            data={GENDERS}
            value={gender}
            setValue={(val) => {
              setGender(val);
              if (error) setError("");
            }}
            placeholder="E.g. Male"
            modalTitle="Select Gender"
            error={error}
            marginBottom={4}
          />

          {!error && (
            <ErrorComponent
              errorTitle="Please select an option."
              color={isDark ? COLORS.gray2 : colors.textSecondary}
              font={fonts.regular}
            />
          )}
        </View>
      </View>
    );
  },
);

export default Gender;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    flex: 1,
  },
});
