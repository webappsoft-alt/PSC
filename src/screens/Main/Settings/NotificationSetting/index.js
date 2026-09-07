import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { put } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import { getProfile } from "../../../../utils/constants";
import SettingsItems from "../molecules/SettingsItems";
import ToggleCard from "../molecules/ToggleCard";
import { useTheme } from "../../../../contexts/ThemeContext";

const NotificationSetting = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [loading, setLoading] = useState(false);

  const notificationSettings = useMemo(
    () => [
      {
        id: "1",
        title: "Filters",
        des: "Choose the notifications you would like to see and those you don't.",
        screen: "Filters",
        img: Images.nFilter, // Add your icon here
        screen: "NotificationFilter",
      },
      {
        id: "2",
        title: "Preference",
        des: "Select your preferences by notification type.",
        screen: "Preference",
        img: Images.nPref, // Add your icon here
        screen: "NotificationPreference",
      },
      {
        id: "3",
        title: "Email Notifications",
        des: "Control when and how often PSC sends you emails.",
        screen: "EmailNotifications",
        img: Images.nEmail, // Add your icon here
        screen: "EmailNotification",
      },
    ],
    [],
  );

  const updatePreferences = async (updates) => {
    const prevPreferences = userData?.notificationPreferences || {};

    // 🔥 1. Optimistic Update (instant UI change)
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

      // 🔥 2. API me sirf changed key bhejo
      const body = {
        notificationPreferences: updates,
      };

      const res = await put("user/profile", body);

      if (!res?.data?.success) {
        throw new Error("API failed");
      }

      // Optional: agar backend full object return karta hai
      if (res?.data?.data) {
        dispatch(setUserData(res.data.data));
      }
    } catch (error) {
      console.log("Error updating notification preferences:", error);

      // 🔥 3. Rollback (agar API fail ho)
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

  const renderItem = ({ item, index }) => (
    <SettingsItems
      title={item.title}
      des={item.des}
      screen={item.screen}
      img={item.img}
      isLast={index === notificationSettings.length - 1}
    />
  );

  const ListHeaderComponent = () => (
    <View style={{ paddingHorizontal: 12 }}>
      <CustomText
        label="Select the kinds of notification you get about your activities, interests and recommendations."
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={20}
      />
      <ToggleCard
        marginBottom={8}
        marginTop={22}
        value={userData?.notificationPreferences?.push}
        setValue={(val) => updatePreferences({ push: val })}
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
  );

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      headerUnScrollable={() => <Header title={"Notifications"} />}
    >
      <FlatList
        data={notificationSettings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeaderComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </ScreenWrapper>
  );
};

export default NotificationSetting;

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
});
