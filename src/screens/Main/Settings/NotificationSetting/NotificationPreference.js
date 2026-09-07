import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import TopTabWithBG from "../../../../components/TopTabWithBG";
import { put } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import SettingAccordian from "../molecules/SettingAccordian";
import ToggleCard from "../molecules/ToggleCard";
import { useTheme } from "../../../../contexts/ThemeContext";

const NotificationPreference = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [tab, setTab] = useState("System");
  const [loading, setLoading] = useState(false);

  const preferences = userData?.notificationSettings || {};

  const updatePreferences = async (updates) => {
    const prevPreferences = userData?.notificationSettings || {};

    // 🔥 1. Optimistic Update (instant UI change)
    const updatedPreferences = {
      ...prevPreferences,
      ...updates,
    };

    dispatch(
      setUserData({
        ...userData,
        notificationSettings: updatedPreferences,
      }),
    );

    try {
      setLoading(true);

      // 🔥 2. API me sirf changed key bhejo
      const body = {
        notificationSettings: updates,
      };

      const res = await put("user/profile", body);
      // console.log("res----preferense:::", res.data?.data?.notificationSettings);

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
          notificationSettings: prevPreferences,
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  // General accordion data
  const generalData = useMemo(
    () => [
      {
        id: "1",
        title: "New Post",
        subtitle: "User published a new post",
        value: preferences?.genralNewPost ?? true,
        setValue: (val) => updatePreferences({ genralNewPost: val }),
      },
      {
        id: "2",
        title: "Post Comment",
        subtitle: "User commented on your post",
        value: preferences?.genralPostComment ?? true,
        setValue: (val) => updatePreferences({ genralPostComment: val }),
      },
      {
        id: "3",
        title: "New Follower",
        subtitle: "User started following you",
        value: preferences?.genralNewFollower ?? true,
        setValue: (val) => updatePreferences({ genralNewFollower: val }),
      },
      {
        id: "4",
        title: "Mentions",
        subtitle: "User mentioned you in a post",
        value: preferences?.genralMentionMe ?? true,
        setValue: (val) => updatePreferences({ genralMentionMe: val }),
      },
      {
        id: "5",
        title: "Direct Messages",
        subtitle: "User sent you a message",
        value: preferences?.genralDirectMessage ?? true,
        setValue: (val) => updatePreferences({ genralDirectMessage: val }),
      },
    ],
    [preferences],
  );

  const formData = useMemo(
    () => [
      {
        id: "1",
        title: "New Post",
        subtitle: "User published a new post",
        value: preferences?.formNewPost ?? true,
        setValue: (val) => updatePreferences({ formNewPost: val }),
      },
      {
        id: "2",
        title: "Post Likes",
        subtitle: "User liked your post",
        value: preferences?.formPostLike ?? true,
        setValue: (val) => updatePreferences({ formPostLike: val }),
      },
      {
        id: "3",
        title: "New Follower",
        subtitle: "User started following you",
        value: preferences?.formNewFollower ?? true,
        setValue: (val) => updatePreferences({ formNewFollower: val }),
      },
      {
        id: "4",
        title: "Email",
        subtitle: "User changed their email details",
        value: preferences?.formEmail ?? true,
        setValue: (val) => updatePreferences({ formEmail: val }),
      },
      {
        id: "5",
        title: "Aston Martin",
        subtitle: "User changed their phone details",
        value: preferences?.formAstonMartin ?? true,
        setValue: (val) => updatePreferences({ formAstonMartin: val }),
      },
    ],
    [preferences],
  );

  const storeData = useMemo(
    () => [
      {
        id: "1",
        title: "New Post",
        subtitle: "User published a new post",
        value: preferences?.storeNewPost ?? true,
        setValue: (val) => updatePreferences({ storeNewPost: val }),
      },
      {
        id: "2",
        title: "Post Likes",
        subtitle: "User liked your post",
        value: preferences?.storePostlike ?? true,
        setValue: (val) => updatePreferences({ storePostlike: val }),
      },
      {
        id: "3",
        title: "New Follower",
        subtitle: "User started following you",
        value: preferences?.storeNewFollower ?? true,
        setValue: (val) => updatePreferences({ storeNewFollower: val }),
      },
      {
        id: "4",
        title: "Email",
        subtitle: "User changed their email details",
        value: preferences?.storeEmail ?? true,
        setValue: (val) => updatePreferences({ storeEmail: val }),
      },
      {
        id: "5",
        title: "Aston Martin",
        subtitle: "User changed their phone details",
        value: preferences?.storeAstonMartin ?? true,
        setValue: (val) => updatePreferences({ storeAstonMartin: val }),
      },
    ],
    [preferences],
  );

  const jobData = useMemo(
    () => [
      {
        id: "1",
        title: "New Post",
        subtitle: "User published a new post",
        value: preferences?.jobNewPost ?? true,
        setValue: (val) => updatePreferences({ jobNewPost: val }),
      },
      {
        id: "2",
        title: "Post Likes",
        subtitle: "User liked your post",
        value: preferences?.jobPostLike ?? true,
        setValue: (val) => updatePreferences({ jobPostLike: val }),
      },
      {
        id: "3",
        title: "New Follower",
        subtitle: "User started following you",
        value: preferences?.jobNewFollower ?? true,
        setValue: (val) => updatePreferences({ jobNewFollower: val }),
      },
      {
        id: "4",
        title: "Email",
        subtitle: "User changed their email details",
        value: preferences?.jobEmail ?? true,
        setValue: (val) => updatePreferences({ jobEmail: val }),
      },
      {
        id: "5",
        title: "Aston Martin",
        subtitle: "User changed their phone details",
        value: preferences?.jobAstonMartin ?? true,
        setValue: (val) => updatePreferences({ jobAstonMartin: val }),
      },
    ],
    [preferences],
  );

  const wishlistData = useMemo(
    () => [
      {
        id: "1",
        title: "New Post",
        subtitle: "User published a new post",
        value: preferences?.wishlistNewPost ?? true,
        setValue: (val) => updatePreferences({ wishlistNewPost: val }),
      },
      {
        id: "2",
        title: "Post Likes",
        subtitle: "User liked your post",
        value: preferences?.wishlistPostLike ?? true,
        setValue: (val) => updatePreferences({ wishlistPostLike: val }),
      },
      {
        id: "3",
        title: "New Follower",
        subtitle: "User started following you",
        value: preferences?.wishlistNewFollower ?? true,
        setValue: (val) => updatePreferences({ wishlistNewFollower: val }),
      },
      {
        id: "4",
        title: "Email",
        subtitle: "User changed their email details",
        value: preferences?.wishlistEmail ?? true,
        setValue: (val) => updatePreferences({ wishlistEmail: val }),
      },
      {
        id: "5",
        title: "Aston Martin",
        subtitle: "User changed their phone details",
        value: preferences?.wishlistAstonMartin ?? true,
        setValue: (val) => updatePreferences({ wishlistAstonMartin: val }),
      },
    ],
    [preferences],
  );

  const teamData = useMemo(
    () => [
      {
        id: "1",
        title: "New Post",
        subtitle: "User published a new post",
        value: preferences?.teamNewPost ?? true,
        setValue: (val) => updatePreferences({ teamNewPost: val }),
      },
      {
        id: "2",
        title: "Post Likes",
        subtitle: "User liked your post",
        value: preferences?.teamPostLike ?? true,
        setValue: (val) => updatePreferences({ teamPostLike: val }),
      },
      {
        id: "3",
        title: "New Follower",
        subtitle: "User started following you",
        value: preferences?.teamNewFollower ?? true,
        setValue: (val) => updatePreferences({ teamNewFollower: val }),
      },
      {
        id: "4",
        title: "Email",
        subtitle: "User changed their email details",
        value: preferences?.teamEmail ?? true,
        setValue: (val) => updatePreferences({ teamEmail: val }),
      },
      {
        id: "5",
        title: "Aston Martin",
        subtitle: "User changed their phone details",
        value: preferences?.teamAstonMartin ?? true,
        setValue: (val) => updatePreferences({ teamAstonMartin: val }),
      },
    ],
    [preferences],
  );

  const settingsData = useMemo(
    () => [
      {
        id: "1",
        title: "Updates",
        subtitle: "User published a new post",
        value: preferences?.settingUpdate ?? true,
        setValue: (val) => updatePreferences({ settingUpdate: val }),
      },
      {
        id: "2",
        title: "Warnings",
        subtitle: "User liked your post",
        value: preferences?.settingWarning ?? true,
        setValue: (val) => updatePreferences({ settingWarning: val }),
      },
    ],
    [preferences],
  );

  // Accordion sections
  const accordionSections = useMemo(
    () => [
      {
        id: "general",
        title: "General",
        data: generalData,
        defaultExpanded: true,
      },
      {
        id: "form",
        title: "Form",
        data: formData,
        defaultExpanded: false,
      },
      {
        id: "store",
        title: "Store",
        data: storeData,
        defaultExpanded: false,
      },
      {
        id: "job",
        title: "Job",
        data: jobData,
        defaultExpanded: false,
      },
      {
        id: "wishlist",
        title: "Wishlist",
        data: wishlistData,
        defaultExpanded: false,
      },
      {
        id: "team",
        title: "Team",
        data: teamData,
        defaultExpanded: false,
      },
      {
        id: "settings",
        title: "Settings",
        data: settingsData,
        defaultExpanded: false,
      },
    ],
    [
      generalData,
      formData,
      storeData,
      jobData,
      wishlistData,
      teamData,
      settingsData,
    ],
  );

  const renderAccordion = ({ item }) =>
    tab == "System" ? (
      <SettingAccordian
        title={item.title}
        data={item.data}
        defaultExpanded={item.defaultExpanded}
      />
    ) : (
      <ToggleCard
        title={"Display Name"}
        subtitle={"Doctor"}
        isBorder
        isUser
      />
    );

  return (
    <ScreenWrapper
      headerUnScrollable={() => (
        <>
          <Header title={"Notifications Settings"} />
          <View style={{ paddingHorizontal: 12 }}>
            <TopTabWithBG
              tabNames={["System", "Users"]}
              tab={tab}
              setTab={setTab}
              marginTop={4}
              selectedColor={COLORS.buttonColor}
            />
          </View>
        </>
      )}
      paddingHorizontal={0.1}
    >
      <FlatList
        data={accordionSections}
        renderItem={renderAccordion}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </ScreenWrapper>
  );
};

export default NotificationPreference;

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
});
