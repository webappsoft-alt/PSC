import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";

import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { post } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { setToken } from "../../../store/reducer/AuthConfig";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const JobTitle = forwardRef(
  (
    {
      currentIndex,
      setCurrentIndex,
      state,
      setState,
      setLoadingState,
      setBtnDisabled,
    },
    ref,
  ) => {
    const { colors, isDark } = useTheme();
    const [jobTitle, setJobTitle] = useState(state?.job_title || "");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const dispatch = useDispatch();

    useEffect(() => {
      setBtnDisabled?.(!jobTitle.trim());
    }, [jobTitle]);

    const errorCheck = (val) => {
      setJobTitle(val);
      let newErrors = "";
      const jobTitleRegex = /^[A-Za-z\s'-]{2,37}$/;
      if (!val.trim()) {
        newErrors = "Please enter your job title";
      } else if (!jobTitleRegex.test(val.trim())) {
        newErrors =
          "Please enter a valid job title (letters only, 2–37 characters)";
      }
      return newErrors;
    };

    const submit = async () => {
      const err = errorCheck(jobTitle);
      if (err) {
        setError(err);
        return;
      }
      setError("");
      const valueToStore = jobTitle.trim();
      setState({ ...state, job_title: valueToStore });
      const fcmtoken = await AsyncStorage.getItem("fcmToken");

      // Prepare API body with correct field names
      const registrationBody = {
        ...(state?.email?.trim() && { email: state.email.trim() }),
        ...(state?.phone?.trim() && { phone: state.phone.trim() }),
        password: state?.password,
        username: state?.first_name?.trim() || "usama",
        dob: state?.dob,
        jobTitle: valueToStore,
        company: state?.working_at?.trim(),
        industry: state?.industry,
        firstName: state?.full_name?.trim(),
        lastName: state?.last_name?.trim() || "",
        role: state?.role || "individual",
        ...(state?.gender && { gender: state.gender }),
        ...(state?.addressing && { addressing: state.addressing }),
        enhancedTailoredAds: !!state?.enhancedTailoredAds,
        ...{
          fcmToken: fcmtoken,
        },
      };

      console.log("registrationBody---->here", registrationBody);

      try {
        setLoading(true);
        if (setLoadingState) setLoadingState(true);
        const response = await post("auth/register", registrationBody);

        if (response?.data) {
          // Store user data and tokens
          if (response?.data?.user) {
            dispatch(setUserData(response?.data?.user));
          }

          if (response?.data?.tokens?.accessToken) {
            dispatch(setToken(response?.data?.tokens?.accessToken));
            await AsyncStorage.setItem(
              "token",
              response?.data?.tokens?.accessToken,
            );
          }

          if (response?.data?.tokens?.refreshToken) {
            await AsyncStorage.setItem(
              "refreshToken",
              response?.data?.tokens?.refreshToken,
            );
          }

          // Navigate to next screen
          setCurrentIndex(16);
        }

        setLoading(false);
        if (setLoadingState) setLoadingState(false);
      } catch (error) {
        setLoading(false);
        if (setLoadingState) setLoadingState(false);
        const errorMessage =
          error?.message ||
          "Registration failed. Please try again.";
        ToastMessage(errorMessage, "error");
        console.error("Registration error:", error);
      }
    };

    const back = () => {
      setCurrentIndex(14);
    };

    useImperativeHandle(ref, () => ({ submit, back, isLoading: loading }));

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="What's your job title?"
            fontFamily={fonts.semiBold}
            fontSize={24}
            marginTop={12}
            letterSpacing={-1}
            marginBottom={6}
            color={isDark ? COLORS.white : colors.text}
          />
          <CustomInput
            placeholder="E.g. CTO"
            autoCapitalize={"words"}
            value={jobTitle}
            onChangeText={(text) => {
              setJobTitle(text);
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
        </View>
      </View>
    );
  },
);

export default JobTitle;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    flex: 1,
  },
});
