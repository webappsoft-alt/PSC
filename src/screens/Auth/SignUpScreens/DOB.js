import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";

import moment from "moment";
import fonts from "../../../assets/fonts";
import CustomDatePicker from "../../../components/CustomDatePicker";
import CustomText from "../../../components/CustomText";

import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const StepOne = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [dob, setDob] = useState(state?.dob || "");
    const [error, setError] = useState("");

    useEffect(() => {
      setBtnDisabled?.(!dob);
    }, [dob]);

    const validateDOB = (value) => {
      let newError = "";
      if (!value) {
        newError = "You must be at least 16 years old to use ";
      } else {
        const birthDate = new Date(value);
        const today = new Date();
        const ageDiff = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthday =
          today.getMonth() > birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() &&
            today.getDate() >= birthDate.getDate());
        const is16OrOlder = ageDiff > 16 || (ageDiff === 16 && hasHadBirthday);
        if (!is16OrOlder) {
          newError = "You must be at least 16 years old to use ";
        }
      }

      setError(newError);
      return newError === "";
    };

    const handleDateChange = (val) => {
      setDob(val);
      if (val) {
        setTimeout(() => {
          validateDOB(val);
        }, 100);
      }
    };

    const submit = () => {
      const isValid = validateDOB(dob);
      if (!isValid) return;

      setState({ ...state, dob: moment(dob).format("YYYY-MM-DD") }); // 1990-01-01
      if (currentIndex < 12) {
        setCurrentIndex(2);
      }
    };

    const back = () => {
      if (currentIndex > 1) {
        setCurrentIndex(currentIndex - 1);
      }
    };

    useImperativeHandle(ref, () => ({ submit, back }));

    const sixteenYearsAgo = new Date();
    sixteenYearsAgo.setFullYear(sixteenYearsAgo.getFullYear() - 16);

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="What's your date of birth?"
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            marginTop={16}
            marginBottom={6}
            color={isDark ? COLORS.white : colors.text}
          />
          <CustomDatePicker
            value={dob}
            setValue={handleDateChange}
            placeholder="16 years old"
            maxDate={sixteenYearsAgo}
            error={error}
            defaultError="You must be at least 16 years old to use "
          />
        </View>
      </View>
    );
  },
);

export default StepOne;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    flex: 1,
  },
});
