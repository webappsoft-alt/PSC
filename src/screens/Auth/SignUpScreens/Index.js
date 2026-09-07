import { useEffect, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";

import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import AuthHeader from "../../../components/Auth/AuthHeader";

import ResetPassword from "./ResetPassword";
import FullName from "./FullName";
import FirstName from "./FirstName";
import JobTitle from "./JobTitle";
import WorkingAt from "./WorkingAt";
import Password from "./Password";
import OtpCode from "./OtpCode";
import Email from "./Email";
import DOB from "./DOB";
import Industry from "./Industry";
import UserType from "./UserType";
import ProRole from "./ProRole";
import AddPictures from "./AddPictures";
import Text from "../../../components/ScaledText";

const SignUpScreens = () => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(true);
  const stepRef = useRef(null);
  const steps = [
    "DOB",
    "UserType",
    "ProRole",
    "Email",
    "OtpCode",
    "Password",
    "ResetPassword",
    "FullName",
    "FirstName",
    "Industry",
    "WorkingAt",
    "JobTitle",
    "AddPictures",
  ];
  const init = {
    email: "",
    password: "",
    dob: "",
    pin: "",
    full_name: "",
    first_name: "",
    job_title: "",
    working_at: "",
    industry: "",
    role: "",
    allowdPersonalizedAds: false,
    allowdMarketingEmails: false,
    notificationPreferences: { email: false, push: false, sms: false },
  };
  const [state, setState] = useState(init);

  // Callback to update loading state from child components

  const setLoadingState = (loading) => {
    setIsLoading(loading);
  };

  // Reset loading state when step changes
  useEffect(() => {
    setIsLoading(false);
  }, [currentIndex]);

  // Handle back navigation
  const handleBackPress = () => {
    if (currentIndex === 1) {
      // On first step, navigate back to previous screen
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } else {
      // On other steps, call the step's back function
      stepRef.current?.back?.();
    }
  };

  const renderStepView = () => {
    switch (currentIndex) {
      case 1:
        return (
          <DOB
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setBtnDisabled={setBtnDisabled}
          />
        );
      case 2:
        return (
          <UserType
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setBtnDisabled={setBtnDisabled}
          />
        );
      case 3:
        return (
          <ProRole
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setBtnDisabled={setBtnDisabled}
          />
        );
      case 4:
        return (
          <Email
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setLoadingState={setLoadingState}
            setBtnDisabled={setBtnDisabled}
          />
        );
      case 5:
        return (
          <OtpCode
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setLoadingState={setLoadingState}
            setBtnDisabled={setBtnDisabled}
          />
        );

      case 6:
        return (
          <Password
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setBtnDisabled={setBtnDisabled}
          />
        );
      case 7:
        return (
          <ResetPassword
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setBtnDisabled={setBtnDisabled}
          />
        );

      case 8:
        return (
          <FullName
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setBtnDisabled={setBtnDisabled}
          />
        );

      case 9:
        return (
          <FirstName
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setLoadingState={setLoadingState}
            setBtnDisabled={setBtnDisabled}
          />
        );
      case 10:
        return (
          <Industry
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setLoadingState={setLoadingState}
            setBtnDisabled={setBtnDisabled}
          />
        );
      case 11:
        return (
          <WorkingAt
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setBtnDisabled={setBtnDisabled}
          />
        );
      case 12:
        return (
          <JobTitle
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setLoadingState={setLoadingState}
            setBtnDisabled={setBtnDisabled}
          />
        );
      case 13:
        return (
          <AddPictures
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setLoadingState={setLoadingState}
            setBtnDisabled={setBtnDisabled}
          />
        );

      default:
        return <Text>No View</Text>;
    }
  };

  return (
    <ScreenWrapper
      paddingBottom={12}
      scrollEnabled
      footerUnScrollable={() => (
        <AuthFooter
          paddingHorizontal={12}
          onPress={() => stepRef.current?.submit?.()}
          onBackPress={handleBackPress}
          loading={isLoading}
          btnDisabled={btnDisabled}
        />
      )}
    >
      <AuthHeader
        step={currentIndex}
        totalSteps={steps?.length}
        subtitle={
          currentIndex === 1
            ? "Date of Birth"
            : currentIndex === 2
            ? "Choose your user type"
            : currentIndex === 3
            ? "Choose your user type"
            : currentIndex === 4
            ? "Provide your email address"
            : currentIndex === 5
            ? "OTP code"
            : currentIndex === 6
            ? "Creating a strong password"
            : currentIndex === 7
            ? "Confirming password"
            : currentIndex === 8
            ? "Provide your Full Name"
            : currentIndex === 9
            ? "Provide your Username"
            : currentIndex === 10
            ? "Industry"
            : currentIndex === 11
            ? "Working At"
            : currentIndex === 12
            ? "Job Title"
            : "Upload your photos"
        }
      />
      {renderStepView()}
    </ScreenWrapper>
  );
};

export default SignUpScreens;
