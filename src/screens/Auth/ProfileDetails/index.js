import { useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

import ScreenWrapper from "../../../components/ScreenWrapper";
import {
  AuthStepFooter,
  AuthStepHeader,
} from "../../../components/Auth/AuthKit";
import TextStep from "../SignUpScreens/molecules/TextStep";
import { FLOWS, PROFILE_STEPS } from "../SignUpScreens/flows";
import { put } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { ToastMessage } from "../../../utils/ToastMessage";

const PROFILE_HINT = "This will appear on your profile.";

/** The three profile steps that follow the slides (after the account exists). */
const FIELDS = {
  industry: {
    order: 1,
    subtitle: "Industry",
    title: "What’s your industry?",
    placeholder: "E.g. Technology",
    hints: [{ text: PROFILE_HINT, counter: true }],
    body: (v) => ({ industry: [v] }),
    initial: (u) => (Array.isArray(u?.industry) ? u.industry[0] : ""),
  },
  company: {
    order: 2,
    subtitle: "Working At",
    title: "Working At?",
    placeholder: "E.g. Great Company",
    hints: [
      { text: PROFILE_HINT, counter: true },
      { text: "Freelancers can simply write that." },
    ],
    body: (v) => ({ occupation: { company: v } }),
    initial: (u) => u?.occupation?.company || "",
  },
  jobTitle: {
    order: 3,
    subtitle: "Job title",
    title: "What’s your job title?",
    placeholder: "E.g. CTO",
    hints: [{ text: PROFILE_HINT, counter: true }],
    body: (v) => ({ occupation: { jobTitle: v } }),
    initial: (u) => u?.occupation?.jobTitle || "",
  },
};

const flowLength = (role) =>
  (FLOWS[role] || FLOWS.regular).length;

const ProfileDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const user = useSelector((s) => s?.users?.userData);
  const stepRef = useRef(null);
  const [btnDisabled, setBtnDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const key = FIELDS[route?.params?.field] ? route.params.field : "industry";
  const field = FIELDS[key];
  const slideIndex = Number(route?.params?.slideIndex) || 0;
  const base = flowLength(user?.role);

  const onSubmit = async (value) => {
    setLoading(true);
    try {
      const res = await put("user/profile", field.body(value));
      if (res?.data?.data) dispatch(setUserData(res.data.data));
      setLoading(false);
      if (key === "jobTitle") {
        navigation.navigate("PersonalAds");
      } else {
        navigation.push("OnboardingSlide", { index: slideIndex + 1 });
      }
    } catch (err) {
      setLoading(false);
      ToastMessage(err?.message || "Could not save. Please try again.", "error");
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => (
        <AuthStepHeader
          subtitle={field.subtitle}
          step={base + field.order}
          total={base + PROFILE_STEPS}
        />
      )}
      footerUnScrollable={() => (
        <AuthStepFooter
          onPress={() => stepRef.current?.submit?.()}
          onBackPress={() => navigation.canGoBack() && navigation.goBack()}
          loading={loading}
          disabled={btnDisabled}
        />
      )}
    >
      <TextStep
        key={key}
        ref={stepRef}
        title={field.title}
        placeholder={field.placeholder}
        initialValue={field.initial(user)}
        hints={field.hints}
        validate={(v) => (v ? "" : "This field is required.")}
        onSubmit={onSubmit}
        setBtnDisabled={setBtnDisabled}
        autoCapitalize="sentences"
      />
    </ScreenWrapper>
  );
};

export default ProfileDetails;
