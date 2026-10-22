import { createNativeStackNavigator } from "@react-navigation/native-stack";

//screens

import AllowNotification from "../screens/Auth/AllowNotification";
import ForgotPass from "../screens/Auth/ForgotPass";
import ForgotPasswordOtp from "../screens/Auth/ForgotPasswordOtp";
import Login from "../screens/Auth/Login";
import TwoFactorVerify from "../screens/Auth/TwoFactorVerify";
import OnBoardingScreens from "../screens/Auth/OnBoarding/index";
import OnboardingSlide from "../screens/Auth/OnboardingSlide";
import ProfileDetails from "../screens/Auth/ProfileDetails";
import PersonalAds from "../screens/Auth/PersonalAds";
import PinOnBoarding from "../screens/Auth/PinOnBoarding";
import ProfilePrivacy from "../screens/Auth/ProfilePrivacy";
import CaptureSelfi from "../screens/Auth/ProScreens/CaptureSelfi";
import ImageCamera from "../screens/Auth/ProScreens/ImageCamera";
import KYCResult from "../screens/Auth/ProScreens/KycResult";
import TakeIDBack from "../screens/Auth/ProScreens/TakeIdBack";
import TakeIDFront from "../screens/Auth/ProScreens/TakeIdFrontt";
import TakeSelfi from "../screens/Auth/ProScreens/TakeSelfi";
import VerifyIdentity from "../screens/Auth/ProScreens/VerifyIdentity";
import ResetPasswordScreens from "../screens/Auth/ResetPasswordScreens/Index";
import SignUpScreens from "../screens/Auth/SignUpScreens/Index";
import WelcomeScreen from "../screens/Auth/WelcomeScreen";
import CustomCameraScreen from "../screens/Main/CustomCameraScreen";

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="OnBoardingScreens"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="OnBoardingScreens" component={OnBoardingScreens} />
      <Stack.Screen name="SignUpScreens" component={SignUpScreens} />
      <Stack.Screen name="AllowNotification" component={AllowNotification} />
      <Stack.Screen name="PersonalAds" component={PersonalAds} />
      <Stack.Screen name="ForgotPass" component={ForgotPass} />
      <Stack.Screen name="ForgotPasswordOtp" component={ForgotPasswordOtp} />
      <Stack.Screen name="PinOnBoarding" component={PinOnBoarding} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="TwoFactorVerify" component={TwoFactorVerify} />
      <Stack.Screen
        name="ResetPasswordScreens"
        component={ResetPasswordScreens}
      />
      <Stack.Screen name="CustomCameraScreen" component={CustomCameraScreen} />
      <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
      <Stack.Screen name="OnboardingSlide" component={OnboardingSlide} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetails} />
      <Stack.Screen name="ProfilePrivacy" component={ProfilePrivacy} />

      {/* Pro Screens */}
      <Stack.Screen name="VerifyIdentity" component={VerifyIdentity} />
      <Stack.Screen name="TakeIDFront" component={TakeIDFront} />
      <Stack.Screen name="TakeIdBack" component={TakeIDBack} />
      <Stack.Screen name="KYCResult" component={KYCResult} />
      <Stack.Screen name="TakeSelfi" component={TakeSelfi} />
      <Stack.Screen name="ImageCamera" component={ImageCamera} />
      <Stack.Screen name="CaptureSelfi" component={CaptureSelfi} />
    </Stack.Navigator>
  );
};

export default AuthStack;
