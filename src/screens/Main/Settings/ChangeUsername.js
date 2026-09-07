import { useNavigation } from "@react-navigation/native";
import { Formik } from "formik";
import { useState } from "react";
import { View } from "react-native";
import { useDispatch } from "react-redux";
import * as Yup from "yup";

import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";

import Divider from "../../../components/Divider";
import { put } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { getProfile } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const MAX_LENGTH = 27;

// Validation schema
const validationSchema = Yup.object().shape({
  username: Yup.string()
    .required("Username is required")
    .min(3, "Must be 3–27 characters")
    .max(MAX_LENGTH, "Must be 3–27 characters")
    .matches(/^[A-Za-z]/, "Cannot start with a number or special character")
    .matches(/^[A-Za-z][A-Za-z0-9._]*$/, "Invalid characters used"),
});

const ChangeUsername = () => {
  const { colors } = useTheme();
  const navigate = useNavigation();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values, { setErrors }) => {
    try {
      setIsLoading(true);
      const response = await put("user/username", {
        username: values.username,
      });

      if (response?.data?.success) {
        ToastMessage(
          response?.data?.message || "Username updated successfully",
          "success",
        );
        if (response?.data?.data) {
          dispatch(setUserData(response.data.data));
        }
        dispatch(getProfile());
        navigate.goBack();
      }
    } catch (err) {
      console.log(err, "err-----");

      ToastMessage(err.message, "error");
      setErrors({
        username: err?.message || "Username already exists",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check individual validation rules
  const getValidationStatus = (username) => {
    return {
      lengthSuccess: username.length >= 3 && username.length <= MAX_LENGTH,
      startCharSuccess: /^[A-Za-z]/.test(username),
      validCharSuccess: /^[A-Za-z][A-Za-z0-9._]*$/.test(username),
      // For uniqueness, we'll check if there's no error and username is not empty
      // This will be overridden by API error if username is not unique
      uniqueSuccess:
        username.length >= 3 && /^[A-Za-z][A-Za-z0-9._]*$/.test(username),
    };
  };

  return (
    <Formik
      initialValues={{ username: "" }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      validateOnChange={true}
      validateOnBlur={true}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit: submitForm,
        setFieldValue,
      }) => {
        const username = values.username;
        const validationStatus = getValidationStatus(username);
        const isAvailable = !errors.username && username.length >= 3;

        const handleUsernameChange = (text) => {
          handleChange("username")(text);
        };

        return (
          <ScreenWrapper
            scrollEnabled
            headerUnScrollable={() => <Header title={"Username"} />}
            footerUnScrollable={() => (
              <AuthFooter
                paddingHorizontal={12}
                onPress={submitForm}
                onBackPress={() => navigate.goBack()}
                btnLoading={isLoading}
                marginBottom={2}
              />
            )}
          >
            <CustomText
              label="Your username is how people find and recognize you. Choose a username that represents you."
              fontSize={14}
              color={colors.textSecondary}
              marginBottom={16}
              marginTop={8}
            />

            <CustomInput
              withLabel="Username"
              placeholder="viktorsola"
              value={username}
              maxLength={MAX_LENGTH}
              onChangeText={handleUsernameChange}
              onBlur={handleBlur("username")}
              error={touched.username && errors.username ? errors.username : ""}
            />

            {!errors.username && (
              <View>
                <ErrorComponent
                  errorTitle={isAvailable ? "Available" : "Not available"}
                  isValid={isAvailable}
                  color={isAvailable ? "#64CD75" : colors.textSecondary}
                />

                <ErrorComponent
                  errorTitle={`${username.length}/${MAX_LENGTH} characters maximum.`}
                  isValid={validationStatus.lengthSuccess}
                  color={
                    validationStatus.lengthSuccess ? "#64CD75" : colors.textSecondary
                  }
                />
              </View>
            )}

            <Divider thickness={1} color={COLORS.inputBg} marginBottom={0} />

            <View style={{ marginTop: 16 }}>
              <ErrorComponent
                errorTitle="Should be unique."
                isValid={validationStatus.uniqueSuccess && !errors.username}
                color={
                  validationStatus.uniqueSuccess && !errors.username
                    ? "#64CD75"
                    : colors.textSecondary
                }
              />
              <ErrorComponent
                errorTitle="Must be 3–27 characters long."
                isValid={validationStatus.lengthSuccess}
                color={
                  validationStatus.lengthSuccess ? "#64CD75" : colors.textSecondary
                }
              />
              <ErrorComponent
                errorTitle="Inappropriate names are forbidden."
                isValid={validationStatus.validCharSuccess}
                color={
                  validationStatus.validCharSuccess
                    ? "#64CD75"
                    : colors.textSecondary
                }
              />
              <ErrorComponent
                errorTitle="Cannot start with a number, or special characters."
                isValid={validationStatus.startCharSuccess}
                color={
                  validationStatus.startCharSuccess
                    ? "#64CD75"
                    : colors.textSecondary
                }
              />
            </View>
          </ScreenWrapper>
        );
      }}
    </Formik>
  );
};

export default ChangeUsername;
