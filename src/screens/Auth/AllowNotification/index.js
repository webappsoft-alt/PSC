import { PermissionsAndroid, Platform, StyleSheet, View } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { useNavigation } from "@react-navigation/native";
import React from "react";

import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import ImageFast from "../../../components/ImageFast";

import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";

const AllowNotification = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const requestNotificationPermission = async () => {
    proceedWithNotificationPermission();
  };

  const proceedWithNotificationPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const status = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (status === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("Notification permission granted");
          navigation.navigate("OnBoarding2", { push: true });
        } else {
          console.log("Notification permission denied");
          navigation.navigate("OnBoarding2", { push: false });
        }
      } else if (Platform.OS === "ios") {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log("Notification permission granted");
          navigation.navigate("OnBoarding2", { push: true });
        } else {
          console.log("Notification permission denied");
          navigation.navigate("OnBoarding2", { push: false });
        }
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      navigation.navigate("OnBoarding2", { push: false });
    }
  };

  return (
    <ScreenWrapper
      paddingHorizontal={24}
      backgroundImage={isDark ? Images.notiBG : undefined}
      imageBottom={0}
      footerUnScrollable={() => (
        <View style={{ padding: 14, marginBottom: 20 }}>
          <CustomButton
            title="Continue"
            marginBottom={8}
            onPress={requestNotificationPermission}
          />
          <CustomButton
            title="Later"
            backgroundColor={isDark ? "#1212120A" : colors.surfaceAlt}
            color={isDark ? COLORS.primaryColor : colors.text}
            onPress={() => navigation.navigate("OnBoarding2", { push: false })}
          />
        </View>
      )}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          //   paddingHorizontal: 30,
        }}
      >
        <ImageFast
          source={Images.bell}
          style={{ height: 80, width: 80 }}
          resizeMode="contain"
          tintColor={isDark ? undefined : colors.text}
        />
        <CustomText
          label="Instant notifications"
          fontSize={32}
          marginTop={26}
          fontFamily={fonts.semiBold}
          textAlign={"center"}
        />
        <CustomText
          lineHeight={14 * 1.4}
          label="Receive notifications directly on your phone whenever a new event occurs."
          color={isDark ? COLORS.gray1 : colors.textSecondary}
          textAlign={"center"}
          marginTop={12}
        />
        <CustomText
          label="Manage your notification in Settings anytime."
          marginTop={24}
          lineHeight={14 * 1.4}
          color={isDark ? COLORS.gray1 : colors.textSecondary}
          textAlign={"center"}
        />
      </View>
    </ScreenWrapper>
  );
};

export default AllowNotification;

const styles = StyleSheet.create({});
