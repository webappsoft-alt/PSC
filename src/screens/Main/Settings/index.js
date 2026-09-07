import {
  StyleSheet,
  View,
  FlatList,
  Share,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "../../../components/ScreenWrapper";
import Header from "../../../components/Header";
import SearchInput from "../../../components/SearchInput";
import ExtrasCard from "./molecules/ExtrasCard";
import SettingsItems from "./molecules/SettingsItems";
import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { post } from "../../../services/ApiRequest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../store/reducer/AuthConfig";
import {
  setUserData,
  addSavedAccount,
} from "../../../store/reducer/usersSlice";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "@react-native-community/blur";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { PNGIcons } from "../../../assets/images/icons";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const data = [
  {
    id: 1,
    title: "Your Account",
    des: "See information about your account, download an archive of your data or learn about your account deactivation options. information about your account, download",
    screen: "YourAccount",
  },
  {
    id: 2,
    title: "Security and account access",
    des: "Manage your account’s security and keep track of your account’s usage, including apps that you have connected to your Sola account.",
    screen: "AccountAccess",
  },
  {
    id: 3,
    title: "Premium+",
    des: "Discover the benefits of a Premium account and manage your plan with ease.",
    screen: "PlansViral",
    // screen: "Plans",
  },
  {
    id: 4,
    title: "Monetization",
    des: "Discover the benefits of a Premium account and manage your plan with ease.",
    screen: "Monetization",
  },
  {
    id: 5,
    title: "Privacy and safety",
    des: "Manage what information you see and share on PSC.",
    screen: "",
  },
  {
    id: 6,
    title: "Notifications",
    des: "Select the kinds of notifications you get about your activities, interests, and recommendations",
    screen: "NotificationSetting",
  },
  {
    id: 7,
    title: "Accessibility and Preferences",
    des: "Manage how PSC content is displayed to you.",
    screen: "AccessibilityPreferences",
  },
  {
    id: 8,
    title: "Additional resources",
    des: "Check out helpful resources to learn more about PSC products & services.",
    screen: "",
  },
];

const Settings = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors, isDark } = useTheme();
  const { userData } = useSelector((state) => state.users);
  const reduxToken = useSelector((state) => state?.authConfig?.token);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [filteredData, setFilteredData] = useState(data);

  const handleInvite = async () => {
    try {
      const userProfileLink = `psc://user/${userData?._id}`;
      await Share.share({
        message: `Check out my profile on Private Social Club: ${userProfileLink}`,
        url: userProfileLink,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const onLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const performLogout = async (shouldSaveInfo = false) => {
    setLoading(true);
    if (shouldSaveInfo) {
      try {
        const token = await AsyncStorage.getItem("token");
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        const tokenToSave = token || reduxToken || "";
        const accToSave = {
          id: userData?._id || userData?.email || "user_" + Date.now(),
          name:
            userData?.fullName ||
            userData?.firstName ||
            userData?.username ||
            "Saved Account",
          email: userData?.email || "",
          profilePic: userData?.profile?.avatar || userData?.avatar || null,
          token: tokenToSave,
          refreshToken: refreshToken || "",
        };

        dispatch(addSavedAccount(accToSave));
      } catch (saveErr) {
        console.log("Error saving account to Redux:", saveErr);
      }
    }

    const fcmtoken = await AsyncStorage.getItem("fcmToken");
    try {
      await post("user/logout", {
        fcmToken: fcmtoken,
      });
    } catch (error) {
      console.log("Logout api error:", error);
    }

    try {
      await AsyncStorage.setItem("token", "");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("refreshToken");
      dispatch(setUserData({}));
      dispatch(logout());
      setLogoutModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "AuthStack" }],
      });
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title="Settings" />}
      paddingHorizontal={0.1}
      footerUnScrollable={() => (
        <CustomButton
          title="Logout"
          onPress={onLogoutPress}
          loading={loading}
          isBottom
          width="90%"
          marginTop={10}
        />
      )}
    >
      <View style={{ paddingHorizontal: 12 }}>
        <SearchInput
          placeholder={"Search Settings..."}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            const filteredData = data.filter((item) =>
              item.title.toLowerCase().includes(text.toLowerCase()),
            );
            setFilteredData(filteredData);
          }}
          height={44}
          marginTop={16}
        />

        <View style={styles.row}>
          <ExtrasCard onPress={() => navigation.navigate("Plans")} />
          <ExtrasCard type="invite" onPress={handleInvite} />
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <SettingsItems
            title={item.title}
            des={item.des}
            screen={item.screen}
            isLast={index === data.length - 1}
          />
        )}
      />

      <CustomModal
        isChange
        isVisible={logoutModalVisible}
        onDisable={() => setLogoutModalVisible(false)}
      >
        <View
          style={{
            padding: 5,
            width: "95%",
            alignSelf: "center",
            borderRadius: 24,
            marginBottom: 12,
            maxHeight: "100%",
            borderWidth: 1,
            backgroundColor: isDark ? "#FFFFFF29" : "#0000000A",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.16)"
              : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <BlurView
            style={{
              maxHeight: "100%",
              width: "100%",
              borderRadius: 24,
            }}
            blurType={isDark ? "dark" : "light"}
            blurAmount={26}
            reducedTransparencyFallbackColor={
              isDark ? "#FFFFFF29" : "#0000000A"
            }
          />

          <View
            style={[
              styles.modalMainContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalRow}>
              <CustomText
                label="Save user info"
                fontFamily={fonts.semiBold}
                fontSize={24}
                color={colors.text}
              />
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 99,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.surfaceAlt,
                }}
              >
                <Image
                  source={PNGIcons.cross}
                  style={{ height: 16, width: 16, tintColor: colors.text }}
                />
              </TouchableOpacity>
            </View>

            <CustomText
              label="It will be easy for you to login again to this acc"
              fontFamily={fonts.medium}
              color={colors.textSecondary}
              marginTop={8}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 24,
              }}
            >
              <CustomButton
                title="Logout"
                width="47%"
                height={48}
                backgroundColor={colors.surfaceAlt}
                color={colors.text}
                onPress={() => performLogout(false)}
                disabled={loading}
              />
              <CustomButton
                title="Save Info"
                width="47%"
                height={48}
                backgroundColor={colors.text}
                color={colors.background}
                onPress={() => performLogout(true)}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </CustomModal>
    </ScreenWrapper>
  );
};

export default Settings;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignContent: "center",
    gap: 8,
    marginBottom: 16,
    marginTop: 12,
  },
  list: {
    paddingBottom: 40,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.64)",
  },
  modalContainer: {
    borderRadius: 28,
    width: "100%",
    alignSelf: "center",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  previewIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: 34,
    height: 34,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  modalMainContainer: {
    width: "100%",
    padding: 16,
    borderRadius: 22,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
