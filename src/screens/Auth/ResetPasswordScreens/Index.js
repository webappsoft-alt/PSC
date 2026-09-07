import { useRef, useState } from "react";

import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import AuthHeader from "../../../components/Auth/AuthHeader";

import Password from "./Password";
import ResetPassword from "./ResetPassword";
import Text from "../../../components/ScaledText";

const ResetPasswordScreens = ({ route }) => {
  const { token, email } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const stepRef = useRef(null);

  const steps = ["Password", "Confirm Password"];

  const init = {
    password: "",
    token: token || "",
    email: email || "",
  };

  const [state, setState] = useState(init);

  // Callback to update loading state from child components
  const setLoadingState = (loading) => {
    setIsLoading(loading);
  };

  const StepView = ({ currentIndex }) => {
    switch (currentIndex) {
      case 1:
        return (
          <Password
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
          />
        );
      case 2:
        return (
          <ResetPassword
            ref={stepRef}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            state={state}
            setState={setState}
            setLoadingState={setLoadingState}
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
          onBackPress={() => stepRef.current?.back?.()}
          loading={isLoading}
        />
      )}
    >
      <AuthHeader
        step={currentIndex}
        totalSteps={steps.length}
        subtitle={
          currentIndex === 1
            ? "Create a strong password"
            : "Confirm your password"
        }
        title="Reset Password"
      />

      <StepView currentIndex={currentIndex} />
    </ScreenWrapper>
  );
};

export default ResetPasswordScreens;
