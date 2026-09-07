import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import ScreenWrapper from "../../../components/ScreenWrapper";
import Header from "../../../components/Header";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import CustomToggle from "../../../components/CustomToggle";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import { ToastMessage } from "../../../utils/ToastMessage";
import { put } from "../../../services/ApiRequest";
import { getProfile } from "../../../utils/constants";
import { setUserData } from "../../../store/reducer/usersSlice";

const TwoFactorAuth = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state?.users?.userData);
  const userEmail = userData?.email || "your registered email";

  const [emailPinEnabled, setEmailPinEnabled] = useState(
    Boolean(userData?.isMFAEnabled),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmailPinEnabled(Boolean(userData?.isMFAEnabled));
  }, [userData?.isMFAEnabled]);

  const toggleEmailPin = async (val) => {
    const nextState = typeof val === "boolean" ? val : !emailPinEnabled;
    if (loading) return;

    setEmailPinEnabled(nextState);
    setLoading(true);

    try {
      const res = await put("user/profile", {
        isMFAEnabled: nextState,
      });

      if (res?.data?.success || res?.data) {
        ToastMessage(
          nextState
            ? "Two-factor authentication enabled"
            : "Two-factor authentication disabled",
          "success",
        );
        dispatch(getProfile());
        if (res?.data?.data) {
          dispatch(setUserData(res.data.data));
        }
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.log("Error updating 2FA status:", error);
      setEmailPinEnabled(!nextState);
      ToastMessage("Failed to update two-factor authentication", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="Two-factor authentication" />}
    >
      <View style={styles.container}>
        <CustomText
          label="Protect your account with an extra layer of security. When signing in, we will send a one-time verification PIN to your email address."
          fontSize={14}
          lineHeight={14 * 1.4}
          color={colors.textSecondary}
          marginBottom={24}
          marginTop={8}
        />

        {/* Email PIN Row - No borders, clean row */}
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <CustomText
              label="Email verification code (PIN)"
              fontSize={16}
              fontFamily={fonts.semiBold}
              color={colors.text}
            />
            <CustomText
              label={`Receive a 6-digit verification PIN at ${userEmail} each time you log into your account.`}
              fontSize={12}
              lineHeight={12 * 1.4}
              color={colors.textSecondary}
              marginTop={4}
            />
          </View>
          <CustomToggle
            activeColor={COLORS.buttonColor}
            inactiveColor={colors.iconMuted}
            value={emailPinEnabled}
            setValue={toggleEmailPin}
          />
        </View>

        <Divider
          thickness={1}
          color={colors.surfaceAlt}
          marginTop={16}
          marginBottom={16}
        />
      </View>
    </ScreenWrapper>
  );
};

export default TwoFactorAuth;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
});
