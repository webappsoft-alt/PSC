import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";

import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../contexts/ThemeContext";

const WorkingAt = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [workingAt, setWorkingAt] = useState(state?.working_at || "");
    const [error, setError] = useState("");
    const navigation = useNavigation();

    useEffect(() => {
      setBtnDisabled?.(!workingAt.trim());
    }, [workingAt]);

    const errorCheck = (val) => {
      setWorkingAt(val);
      let newErrors = "";
      const workingAtRegex = /^[A-Za-z\s'-]{2,37}$/;
      if (!val.trim()) {
        newErrors = "Please enter where you work";
      } else if (!workingAtRegex.test(val.trim())) {
        newErrors =
          "Please enter a valid company name (letters only, 2–37 characters)";
      }
      return newErrors;
    };

    const submit = () => {
      const err = errorCheck(workingAt);
      if (err) {
        setError(err);
        return;
      }
      setError("");
      setState({ ...state, working_at: workingAt.trim() });
      {
        setCurrentIndex(15);
      }
    };

    const back = () => {
      setCurrentIndex(13);
    };

    useImperativeHandle(ref, () => ({ submit, back }));

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="Working At?"
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            marginTop={12}
            letterSpacing={-1}
            marginBottom={6}
            color={isDark ? COLORS.white : colors.text}
          />
          <CustomInput
            placeholder="E.g. Great Company"
            value={workingAt}
            autoCapitalize={"words"}
            onChangeText={(text) => {
              setWorkingAt(text);
              if (error) {
                const newError = errorCheck(text);
                if (!newError) {
                  setError("");
                }
              }
            }}
            error={error}
            maxLength={37}
          />
          <ErrorComponent
            errorTitle="This will appear on your profile."
            marginBottom={2}
          />
          <ErrorComponent errorTitle="Freelancers can simply write that." />
        </View>
      </View>
    );
  },
);

export default WorkingAt;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    flex: 1,
  },
});
