import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import CustomButton from "./CustomButton";
import { COLORS } from "../utils/COLORS";
import { setSessionExpiryHandler } from "../utils/sessionHandler";
import fonts from "../assets/fonts";

const SessionExpiryModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  useEffect(() => {
    // Register the handler when component mounts
    setSessionExpiryHandler(() => {
      setIsVisible(true);
    });

    // Cleanup on unmount
    return () => {
      setSessionExpiryHandler(null);
    };
  }, []);

  const handleLoginAgain = async () => {
    try {
      // Clear all auth data
      await AsyncStorage.multiRemove(["token", "refreshToken", "userData"]);

      // Clear Redux state
      dispatch({ type: "LOGOUT" });

      // Close modal
      setIsVisible(false);

      // Navigate to AuthStack
      navigation.reset({
        index: 0,
        routes: [{ name: "AuthStack" }],
      });
    } catch (error) {
      console.error("Error during logout:", error);
      setIsVisible(false);
    }
  };

  return (
    <CustomModal
      isVisible={isVisible}
      onDisable={() => {}} // Prevent closing by backdrop
      hasBackdrop={true}
      backdropOpacity={0.8}
    >
      <View style={styles.modalContent}>
        <View style={styles.iconContainer}>
          <CustomText label="⏱️" fontSize={60} textAlign="center" />
        </View>

        <CustomText
          label="Session Expired"
          fontSize={24}
          fontFamily={fonts.semiBold}
          textAlign="center"
          marginBottom={12}
        />

        <CustomText
          label="Your token has expired. Please login again to continue."
          fontSize={16}
          color={COLORS.subtitle}
          textAlign="center"
          marginBottom={32}
        />

        <CustomButton
          title="Login Again"
          onPress={handleLoginAgain}
          backgroundColor={COLORS.buttonColor}
          color={COLORS.white}
          fontSize={16}
          fontFamily={fonts.medium}
        />
      </View>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: COLORS.primaryColor,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
});

export default SessionExpiryModal;
