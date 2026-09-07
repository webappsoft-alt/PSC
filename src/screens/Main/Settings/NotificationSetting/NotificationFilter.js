import {StyleSheet, View} from "react-native";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import Header from "../../../../components/Header";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import ToggleCard from "../molecules/ToggleCard";
import fonts from "../../../../assets/fonts";
import Divider from "../../../../components/Divider";
import { put } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { useTheme } from "../../../../contexts/ThemeContext";
import Text from "../../../../components/ScaledText";

const NotificationFilter = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [loading, setLoading] = useState(false);

  const updatePreferences = async (updates) => {
    const prevPreferences = userData?.notificationPreferences || {};
    const updatedPreferences = {
      ...prevPreferences,
      ...updates,
    };

    dispatch(
      setUserData({
        ...userData,
        notificationPreferences: updatedPreferences,
      }),
    );

    try {
      setLoading(true);
      const body = {
        notificationPreferences: updates,
      };
      const res = await put("user/profile", body);
      if (res?.data?.data) {
        dispatch(setUserData(res.data.data));
      }
    } catch (error) {
      console.log("Error updating notification preferences:", error);
      dispatch(
        setUserData({
          ...userData,
          notificationPreferences: prevPreferences,
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      headerUnScrollable={() => <Header title={"Notifications"} />}
      scrollEnabled={false}
    >
      <View style={{ paddingHorizontal: 12 }}>
        <CustomText
          label="Choose the notifications you would like to see and those you don’t."
          fontSize={14}
          color={colors.textSecondary}
          marginBottom={10}
        />
        <CustomText
          label={"Quality filter"}
          fontFamily={fonts.medium}
          fontSize={16}
          marginTop={20}
        />
        <ToggleCard
          marginBottom={8}
          marginTop={8}
          value={userData?.notificationPreferences?.push}
          setValue={(val) => updatePreferences({ push: val })}
        />

        <Divider marginTop={20} marginBottom={10} />
        <CustomText
          label={"Muted notifications "}
          fontFamily={fonts.medium}
          fontSize={16}
          marginTop={22}
        />
        <ToggleCard
          title={"Email notifications"}
          subtitle={
            "Get emails to find out what’s going on when you’re not on PSC."
          }
          marginBottom={40}
          value={userData?.notificationPreferences?.email}
          setValue={(val) => updatePreferences({ email: val })}
        />
      </View>
    </ScreenWrapper>
  );
};

export default NotificationFilter;

const styles = StyleSheet.create({});
