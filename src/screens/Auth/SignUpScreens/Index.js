import { useEffect, useRef, useState } from "react";

import { useNavigation } from "@react-navigation/native";

import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import AuthHeader from "../../../components/Auth/AuthHeader";

import ResetPassword from "./ResetPassword";
import Firstname from "./Firstname";
import Surname from "./Surname";
import Username from "./Username";
import Addressing from "./Addressing";
import Gender from "./Gender";
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
    "Firstname",
    "Surname",
    "Username",
    "Addressing",
    "Gender",
    "Email",
    "OtpCode",
    "Password",
    "ResetPassword",
    "Industry",
    "WorkingAt",
    "JobTitle",
    "AddPictures",
  ];
  const subtitles = {
    1: "Date of Birth",
    2: "Choose your user type",
    3: "Choose your user type",
    4: "Firstname",
    5: "Surname",
    6: "Username",
    7: "Addressing",
    8: "Gender",
    9: "Email",
    10: "Verifying your account",
    11: "Creating a strong password",
    12: "Confirming password",
    13: "Industry",
    14: "Working At",
    15: "Job Title",
    16: "Upload your photos",
  };
  const init = {
    email: "",
    phone: "",
    password: "",
    dob: "",
    pin: "",
    full_name: "",
    last_name: "",
    first_name: "",
    addressing: "firstname",
    gender: "",
    verifyVia: "sms",
    allowMarketing: true,
    enhancedTailoredAds: false,
    job_title: "",
    working_at: "",
    industry: "",
    role: "",
    allowdPersonalizedAds: false,
    allowdMarketingEmails: false,
    notificationPreferences: { email: false, push: false, sms: false },
  };
  const [state, setState] = useState(init);

  // A Customer (regular) never sees the ProRole step (3), so the header
  // numbering collapses it: their path shows x/15 instead of x/16.
  const isRegularPath = state?.userType === "Regular";
  const displayTotal = isRegularPath ? steps.length - 1 : steps.length;
  const displayStep =
    isRegularPath && currentIndex > 3 ? currentIndex - 1 : currentIndex;

  // Reset loading state when step changes
  useEffect(() => {
    setIsLoading(false);
  }, [currentIndex]);

  const setLoadingState = (loading) => {
    setIsLoading(loading);
  };

  // Handle back navigation
  const handleBackPress = () => {
    if (currentIndex === 1) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } else {
      stepRef.current?.back?.();
    }
  };

  const stepProps = {
    ref: stepRef,
    currentIndex,
    setCurrentIndex,
    state,
    setState,
    setLoadingState,
    setBtnDisabled,
  };

  const renderStepView = () => {
    switch (currentIndex) {
      case 1:
        return <DOB {...stepProps} />;
      case 2:
        return <UserType {...stepProps} />;
      case 3:
        return <ProRole {...stepProps} />;
      case 4:
        return <Firstname {...stepProps} />;
      case 5:
        return <Surname {...stepProps} />;
      case 6:
        return <Username {...stepProps} />;
      case 7:
        return <Addressing {...stepProps} />;
      case 8:
        return <Gender {...stepProps} />;
      case 9:
        return <Email {...stepProps} />;
      case 10:
        return <OtpCode {...stepProps} />;
      case 11:
        return <Password {...stepProps} />;
      case 12:
        return <ResetPassword {...stepProps} />;
      case 13:
        return <Industry {...stepProps} />;
      case 14:
        return <WorkingAt {...stepProps} />;
      case 15:
        return <JobTitle {...stepProps} />;
      case 16:
        return <AddPictures {...stepProps} />;
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
        step={displayStep}
        totalSteps={displayTotal}
        subtitle={subtitles[currentIndex] || ""}
      />
      {renderStepView()}
    </ScreenWrapper>
  );
};

export default SignUpScreens;
