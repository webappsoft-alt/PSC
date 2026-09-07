import { StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";

import ScreenWrapper from "../../../components/ScreenWrapper";
import AuthFooter from "../../../components/Auth/AuthFooter";
import AuthHeader from "../../../components/Auth/AuthHeader";
import CustomText from "../../../components/CustomText";

import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";

const GetStarted = () => {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <ScreenWrapper
      footerUnScrollable={() => (
        <AuthFooter onPress={() => navigation.navigate("SignUpScreens")} />
      )}
    >
      <AuthHeader />

      <CustomText
        label="I am"
        fontSize={32}
        fontFamily={fonts.semiBold}
        color={COLORS.gray1}
        marginTop={10}
      />

      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => setSelectedRole("client")}
        style={[
          styles.box,
          {
            backgroundColor: COLORS.darkGreen,
            borderWidth: selectedRole === "client" ? 1 : 0,
            borderColor:
              selectedRole === "client" ? COLORS.black : "transparent",
          },
        ]}
      >
        <CustomText
          label="A Client"
          fontSize={28}
          fontFamily={fonts.medium}
          color={COLORS.white}
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => setSelectedRole("business")}
        style={[
          styles.box,
          {
            backgroundColor: COLORS.darkPurple,
            borderWidth: selectedRole === "business" ? 1 : 0,
            borderColor:
              selectedRole === "business" ? COLORS.black : "transparent",
          },
        ]}
      >
        <CustomText
          label="A Business"
          fontSize={28}
          fontFamily={fonts.medium}
          color={COLORS.white}
        />
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

export default GetStarted;

const styles = StyleSheet.create({
  box: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
});
