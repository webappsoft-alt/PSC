import { BlurView } from "@react-native-community/blur";
import React from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import CustomButton from "./CustomButton";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";
import { setUserData } from "../store/reducer/usersSlice";
import { logout } from "../store/reducer/AuthConfig";

const LoginRequiredModal = ({ isVisible }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      // Clear auth data just in case
      await AsyncStorage.removeItem("token");
      dispatch(logout());
      dispatch(setUserData([]));

      // Navigate to AuthStack
      navigation.reset({
        index: 0,
        routes: [{ name: "AuthStack" }],
      });
    } catch (error) {
      console.error("Error navigating to login:", error);
    }
  };

  return (
    <CustomModal
      isBlur
      isVisible={isVisible}
      onDisable={() => {}} // Prevent closing by backdrop
      reducedTransparencyFallbackColor="rgba(0,0,0,0.1)"
    >
      <View
        style={{
          backgroundColor: COLORS.white16,
          padding: 6,
          margin: 10,
          borderRadius: 26,
        }}
      >
        <BlurView
          style={{
            maxHeight: "100%",
            width: "100%",
            borderRadius: 26,
          }}
          blurType="light"
          blurAmount={26}
          reducedTransparencyFallbackColor="#FFFFFF29"
        />
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <CustomText label="🔐" fontSize={60} textAlign="center" />
          </View>

          <CustomText
            label="Login Required"
            fontSize={24}
            fontFamily={fonts.semiBold}
            textAlign="center"
            marginBottom={12}
            color={COLORS.white}
          />

          <CustomText
            label="You have to login to use this app"
            fontSize={16}
            color={COLORS.subtitle}
            textAlign="center"
            marginBottom={32}
          />

          <CustomButton
            title="Login"
            onPress={handleLogin}
            backgroundColor={COLORS.buttonColor}
            color={COLORS.white}
            fontSize={16}
            fontFamily={fonts.medium}
          />
        </View>
      </View>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: COLORS.black,
    borderRadius: 24,
    width: "100%",
    alignSelf: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
});

export default LoginRequiredModal;
