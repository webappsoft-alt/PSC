import { useCallback, useRef, useState } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import ScreenWrapper from "../../../components/ScreenWrapper";
import {
  AuthStepFooter,
  AuthStepHeader,
} from "../../../components/Auth/AuthKit";

import UserType from "./UserType";
import ProType from "./ProType";
import DOB from "./DOB";
import { EntityName, Firstname, Surname } from "./NameSteps";
import Addressing from "./Addressing";
import Gender from "./Gender";
import Email from "./Email";
import OtpCode from "./OtpCode";
import Password from "./Password";
import ConfirmPassword from "./ConfirmPassword";
import Username from "./Username";
import { FLOWS, PROFILE_STEPS, flowOf } from "./flows";

const SUBTITLES = {
  UserType: "Choose your user type",
  ProType: "Choose your user type",
  DOB: "Date of Birth",
  FoundingDate: "Founding date",
  EntityName: "Entity name",
  Firstname: "Firstname",
  Surname: "Surname",
  Addressing: "Addressing",
  Gender: "Gender",
  Email: "Email",
  EmailCode: "Verifying your email",
  Phone: "Phone Number",
  PhoneCode: "Verifying your phone number",
  Password: "Creating a strong password",
  ConfirmPassword: "Confirming password",
  Username: "Provide your Username",
};

const STEPS = {
  UserType,
  ProType,
  DOB,
  FoundingDate: DOB,
  EntityName,
  Firstname,
  Surname,
  Addressing,
  Gender,
  Email,
  EmailCode: OtpCode,
  Phone: Email,
  PhoneCode: OtpCode,
  Password,
  ConfirmPassword,
  Username,
};

const INITIAL_STATE = {
  userType: "",
  proType: "",
  dob: "",
  foundingDate: "",
  firstName: "",
  lastName: "",
  entityName: "",
  addressing: "firstname",
  gender: "",
  email: "",
  phone: "",
  verifyVia: "sms",
  allowMarketing: true,
  enhancedTailoredAds: false,
  password: "",
  username: "",
};

const SignUpScreens = () => {
  const navigation = useNavigation();
  const stepRef = useRef(null);
  const [state, setState] = useState(INITIAL_STATE);
  const [stepKey, setStepKey] = useState("UserType");
  const [btnDisabled, setBtnDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const flow = FLOWS[flowOf(state)];
  const stepIndex = Math.max(0, flow.indexOf(stepKey));
  const total = flow.length + PROFILE_STEPS;

  const goTo = (key) => {
    setLoading(false);
    setBtnDisabled(true);
    setStepKey(key);
  };

  /** Merges the step's answers and moves to the next step of the flow. */
  const next = (patch = {}) => {
    const merged = { ...state, ...patch };
    setState(merged);
    const nextFlow = FLOWS[flowOf(merged)];
    const i = nextFlow.indexOf(stepKey);
    if (i >= 0 && i < nextFlow.length - 1) goTo(nextFlow[i + 1]);
  };

  const back = () => {
    if (loading) return;
    if (stepIndex > 0) {
      goTo(flow[stepIndex - 1]);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Android back button walks the steps backwards as well.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (stepIndex > 0) {
          back();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [stepIndex, loading, flow]),
  );

  const Step = STEPS[stepKey];
  const subtitle = SUBTITLES[stepKey];

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => (
        <AuthStepHeader
          subtitle={subtitle}
          step={stepIndex + 1}
          total={total}
        />
      )}
      footerUnScrollable={() => (
        <AuthStepFooter
          onPress={() => stepRef.current?.submit?.()}
          onBackPress={back}
          loading={loading}
          disabled={btnDisabled}
        />
      )}
    >
      {Step ? (
        <Step
          key={stepKey}
          ref={stepRef}
          stepKey={stepKey}
          state={state}
          setState={setState}
          next={next}
          goBack={back}
          setBtnDisabled={setBtnDisabled}
          setLoading={setLoading}
        />
      ) : null}
    </ScreenWrapper>
  );
};

export default SignUpScreens;
