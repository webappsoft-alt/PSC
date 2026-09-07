import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useTheme } from "../../../contexts/ThemeContext";

const Password = ({ route }) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [otp, setOtp] = useState("");
  const isLogin = route.params?.isLogin;

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"PIN Code"} />}
      footerUnScrollable={() => (
        <View style={{ padding: 12, marginBottom: 20 }}>
          <AuthFooter onPress={() => navigation.navigate("WelcomeScreen")} />
        </View>
      )}
    >
      <CustomText
        label={"Confirm password"}
        fontFamily={fonts.semiBold}
        fontSize={24}
        lineHeight={40}
      />

      <CustomInput
        value={password}
        onChangeText={setPassword}
        error={error}
        placeholder="************"
        secureTextEntry
      />
      <ErrorComponent
        errorTitle={"Please re-enter your password"}
        marginTop={-10}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("PinCode", { isLogin: true })}
        style={[styles.row, { marginTop: 40 }]}
      >
        <ImageFast
          source={Images.pinCode}
          style={{ height: 24, width: 24, marginRight: 12 }}
          tintColor={isDark ? undefined : colors.text}
        />

        <CustomText
          label={"Use PIN Code instead"}
          fontFamily={fonts.medium}
          fontSize={16}
        />
      </TouchableOpacity>

      <CustomText
        label={"Or"}
        marginTop={20}
        marginBottom={20}
        alignSelf={"center"}
      />
      <TouchableOpacity style={styles.row}>
        <ImageFast
          source={Images.faceId}
          style={{ height: 20, width: 20, marginRight: 12 }}
          tintColor={isDark ? undefined : colors.text}
        />

        <CustomText
          label={"Use Face ID instead"}
          fontFamily={fonts.medium}
          fontSize={16}
        />
      </TouchableOpacity>
      <CustomText
        label={"Or"}
        marginTop={20}
        marginBottom={20}
        alignSelf={"center"}
      />
      <TouchableOpacity
        onPress={() => navigation.navigate("OTPScreen")}
        style={styles.row}
      >
        <ImageFast
          source={Images.otp}
          style={{ height: 20, width: 20, marginRight: 12 }}
          tintColor={isDark ? undefined : colors.text}
        />

        <CustomText label={"Use OTP"} fontFamily={fonts.medium} fontSize={16} />
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

export default Password;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
});
