import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useDispatch } from "react-redux";

import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import OrContinue from "../../../components/OrContinue";
import ImageFast from "../../../components/ImageFast";
import DualText from "../../../components/DualText";

import SocialIcon from "../Login/molecules/SocialIcon";

import { passwordRegex, regEmail } from "../../../utils/constants";
import { setLocation } from "../../../store/reducer/usersSlice";
import { ToastMessage } from "../../../utils/ToastMessage";
import useLocation from "../../../utils/useLocation";
import { post } from "../../../services/ApiRequest";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";

const Signup = ({ navigation }) => {
  const dispatch = useDispatch();
  const { getCurrentLocation } = useLocation();
  const getLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      dispatch(setLocation(location));
    }
  };
  const init = {
    email: "",
    password: "",
    firstName: "",
    SURNAME: "",
  };
  const inits = {
    emailError: "",
    passwordError: "",
    firstNameError: "",
    SURNAMEError: "",
  };

  const [GoogleLoading, setGoogleLoading] = useState(false);
  const [AppleLoading, setAppleLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(inits);
  const [state, setState] = useState(init);

  const array = [
    {
      id: 1,
      placeholder: "First Name",
      value: state.firstName,
      onChange: (text) => setState({ ...state, firstName: text }),
      error: errors?.firstNameError,
    },
    {
      id: 2,
      placeholder: "Last Name",
      value: state.SURNAME,
      onChange: (text) => setState({ ...state, SURNAME: text }),
      error: errors?.SURNAMEError,
    },
    {
      id: 3,
      placeholder: "Email",
      value: state.email,
      onChange: (text) => setState({ ...state, email: text }),
      error: errors?.emailError,
      autoCapitalize: "none",
      keyboardType: "email-address",
    },
    {
      id: 4,
      placeholder: "Password",
      value: state.password,
      onChange: (text) => setState({ ...state, password: text }),
      error: errors?.passwordError,
    },
  ];

  const handleSignup = async () => {
    setLoading(true);
    try {
      const response = await post("auth/check-email", { email: state.email });
      if (response?.data?.available) {
        navigation.navigate("Profile", { signupData: state });
      } else {
        ToastMessage("Email is already exist", "error");
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const errorCheck = useMemo(() => {
    return () => {
      let newErrors = {};
      if (!state.firstName)
        newErrors.firstNameError = "This will appear on your profile.";
      else if (!state.SURNAME)
        newErrors.SURNAMEError = "Please enter Last Name";
      else if (!state.email)
        newErrors.emailError = "Please enter Email Address";
      else if (!regEmail.test(state.email))
        newErrors.emailError = "Please enter valid Email";
      else if (!state.password)
        newErrors.passwordError = "Please enter Password";
      else if (!passwordRegex.test(state.password))
        newErrors.passwordError =
          "Password must contain 1 number, 1 special character, Uppercase and 8 digits";
      setErrors(newErrors);
    };
  }, [state]);

  useEffect(() => {
    errorCheck();
  }, [errorCheck]);

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <ScreenWrapper scrollEnabled>
      <ImageFast
        source={Images.moveSignature}
        style={{ height: 77 }}
        resizeMode={"contain"}
      />

      <View style={[styles.item, { marginVertical: 20 }]}>
        <View style={styles.circle}></View>
        <CustomText
          label={"Nice to meet you"}
          color={COLORS.gray}
          fontFamily={fonts.semiBold}
          fontSize={24}
          marginLeft={10}
          marginTop={5}
        />
      </View>

      {array?.map((item) => (
        <CustomInput
          key={item?.id}
          placeholder={item.placeholder}
          value={item.value}
          onChangeText={item.onChange}
          autoCapitalize={item.autoCapitalize}
          error={item.error}
          secureTextEntry={item.id === 4}
          keyboardType={item.keyboardType}
        />
      ))}

      <CustomButton
        title="Sign up"
        onPress={handleSignup}
        loading={loading}
        disabled={Object.keys(errors).some((key) => errors[key] !== "")}
        marginBottom={30}
      />
      <OrContinue title="or continue with" marginBottom={30} />
      <SocialIcon isRow />
      <DualText
        title="Already have an account?"
        secondTitle=" Login"
        marginTop={16}
        marginBottom={30}
        onPress={() => navigation.navigate("Login")}
      />
    </ScreenWrapper>
  );
};

export default Signup;
const styles = StyleSheet.create({
  logo: {
    width: "70%",
    height: 200,
    alignSelf: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  circle: {
    backgroundColor: "#4347FF",
    height: 24,
    width: 24,
    borderRadius: 100,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
  },
});
