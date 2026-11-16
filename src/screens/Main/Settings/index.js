import {
  StyleSheet,
  View,
  FlatList,
  Share,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import React, { useRef, useState } from "react";
import ScreenWrapper, {
  ScreenHeaderSpacer,
  ScreenFlatList,
  ScreenFooterSpacer,
} from "../../../components/ScreenWrapper";
import GlassBackButton, { GlassSurface } from "../../../components/GlassBackButton";
import ExtrasCard from "./molecules/ExtrasCard";
import SettingsRow from "./molecules/SettingsRow";
import { SettingsIcon } from "./molecules/SettingsIcons";
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
  removeSavedAccount,
} from "../../../store/reducer/usersSlice";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "@react-native-community/blur";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { PNGIcons } from "../../../assets/images/icons";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

// Figma Settings list (2274:1656), in Figma order; `icon` → SettingsIcons
const data = [
  {
    id: 1,
    title: "Your Account",
    des: "See information about your account, download an archive of your data or learn about your account deactivation options. information about your account, download",
    screen: "YourAccount",
    icon: "account",
  },
  {
    id: 9,
    title: "My Documents",
    des: "Manage documents for your job applications.",
    screen: "MyDocuments",
    icon: "documents",
  },
  {
    id: 2,
    title: "Security and account access",
    des: "Manage your account’s security and keep track of your account’s usage, including apps that you have connected to your Sola account.",
    screen: "AccountAccess",
    icon: "security",
  },
  {
    id: 3,
    title: "Premium+",
    des: "Discover the benefits of a Premium account and manage your plan with ease.",
    screen: "PlansViral",
    icon: "premium",
  },
  {
    id: 4,
    title: "Monetization",
    des: "See how you can generate revenues and manage your monetisation options.",
    screen: "Monetization",
    icon: "monetization",
  },
  {
    id: 5,
    title: "Privacy and safety",
    des: "Manage what information you see and share on PSC.",
    screen: "",
    icon: "privacy",
  },
  {
    id: 6,
    title: "Notifications",
    des: "Select the kinds of notifications you get about your activities, interests, and recommendations",
    screen: "NotificationSetting",
    icon: "notifications",
  },
  {
    id: 7,
    title: "Accessibility and Preferences",
    des: "Manage how PSC content is displayed to you.",
    screen: "AccessibilityPreferences",
    icon: "accessibility",
  },
  {
    id: 8,
    title: "Additional resources",
    des: "Check out helpful resources to learn more about PSC products & services.",
    screen: "",
    icon: "resources",
  },
];

// Figma "ACCOUNT STATUS" card (7894:7517): legend colours
const STATUS = {
  good: { label: "YOU’RE GOOD!", color: "#37B874" },
  restricted: { label: "TEMPORARY RESTRICTION", color: "#FF7020" },
  ban: { label: "BANNED", color: "#EE1045" },
};
const statusOf = (u) =>
  u?.status === "suspended" ? STATUS.restricted : u?.status === "deleted" ? STATUS.ban : STATUS.good;
const X = (fs) => Math.round(fs * 0.35 * 10) / 10;
const WHITE_4 = "rgba(255, 255, 255, 0.04)";
const WHITE_48 = "rgba(255, 255, 255, 0.48)";
const WHITE_64 = "rgba(255, 255, 255, 0.64)";

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
  const searchRef = useRef(null);

  const onSearch = (text) => {
    setSearch(text);
    setFilteredData(data.filter((item) => item.title.toLowerCase().includes(text.toLowerCase())));
  };
  const status = statusOf(userData);
  const displayName =
    userData?.fullName || [userData?.firstName, userData?.lastName].filter(Boolean).join(" ") || userData?.username || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

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
    } else if (userData?._id) {
      // Logins are remembered automatically for the profile selector;
      // "don't save" forgets this account on the device.
      dispatch(removeSavedAccount(String(userData._id)));
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
      headerUnScrollable={() => (
        // Figma header 152 (padding 52/12/8, gap 12): back 40 · "Settings"
        // SemiBold 20 −0.5% · Upgrade pill + search 40 · search bar 40
        <View style={styles.topHeader}>
          <View style={styles.headerRow}>
            <GlassBackButton onPress={() => navigation.goBack()} color={WHITE_64} />
            <CustomText
              label="Settings"
              fontSize={20}
              letterSpacing={-0.1}
              fontFamily={fonts.semiBold}
              color="#FFFFFF"
              containerStyle={styles.grow}
            />
            <View style={styles.headerRight}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("Plans")} style={styles.upgrade}>
                <GlassSurface borderRadius={100} />
                <SettingsIcon name="diamond" size={16} color="#FFFFFF" />
                <CustomText label="Upgrade" fontSize={14} fontFamily={fonts.medium} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => searchRef.current?.focus()} style={styles.headerCircle}>
                <GlassSurface borderRadius={100} />
                <SettingsIcon name="search" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.searchBar}>
            <GlassSurface borderRadius={100} />
            <SettingsIcon name="search" size={20} color="#FFFFFF" opacity={0.64} />
            <TextInput
              ref={searchRef}
              value={search}
              onChangeText={onSearch}
              placeholder="Search settings..."
              placeholderTextColor={WHITE_48}
              autoCorrect={false}
              style={styles.searchInput}
            />
            {!!search && (
              <TouchableOpacity hitSlop={8} onPress={() => onSearch("")}>
                <Icons family="MaterialSymbolsRoundedFilled" name="cancel" size={20} color={WHITE_48} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      paddingHorizontal={0.1}
      backgroundColor="#121212"
      headerBlurColor="#121212"
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
      headerBlur
      footerBlur
    >
      <ScreenFlatList
        // content ends above the floating footer
        ListFooterComponent={<ScreenFooterSpacer />}
        ListHeaderComponent={
          <>
            <ScreenHeaderSpacer />
            <View style={styles.top}>
              {/* Figma profile block (7894:7604): padding 8/0, gap 12 */}
              <View style={styles.profile}>
                <View>
                  {userData?.profile?.avatar ? (
                    <Image source={{ uri: userData.profile.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: userData?.profile?.profileColor || WHITE_4 }]}>
                      <CustomText label={initials} fontSize={30} fontFamily={fonts.semiBold} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <CustomText
                  label={displayName}
                  fontSize={24}
                  fontFamily={fonts.semiBold}
                  color="#FFFFFF"
                  textAlign="center"
                  numberOfLines={1}
                  marginTop={-X(24)}
                  marginBottom={-X(24)}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("QrScreen", { user: userData })}
                  style={styles.usernameRow}
                >
                  <CustomText label={`@${userData?.username || ""}`} fontSize={14} letterSpacing={-0.28} fontFamily={fonts.medium} color="#FFFFFF" />
                  <SettingsIcon name="qr" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Figma account status (7894:7517) */}
              <View style={styles.status}>
                <View style={styles.statusTitle}>
                  <CustomText label="ACCOUNT STATUS:" fontSize={12} letterSpacing={-0.12} fontFamily={fonts.semiBold} color={WHITE_64} marginTop={-X(12)} marginBottom={-X(12)} />
                  <CustomText label={status.label} fontSize={12} letterSpacing={-0.12} fontFamily={fonts.semiBold} color={status.color} marginTop={-X(12)} marginBottom={-X(12)} />
                </View>
                <CustomText
                  label="Going against our Terms of Services might restrain you from using certain features."
                  fontSize={12}
                  color={WHITE_64}
                  marginTop={-X(12)}
                  marginBottom={-X(12)}
                />
                <View style={[styles.statusBar, { backgroundColor: status.color }]} />
                <View style={styles.legend}>
                  {[STATUS.good, { ...STATUS.restricted, label: "Temporary Restriction" }, { ...STATUS.ban, label: "Ban" }].map((l, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                      <CustomText label={i === 0 ? "All good" : l.label} fontSize={12} color={WHITE_64} marginTop={-X(12)} marginBottom={-X(12)} />
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <ExtrasCard onPress={() => navigation.navigate("Plans")} />
                <ExtrasCard type="invite" onPress={handleInvite} />
              </View>
            </View>
          </>
        }
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.rule} />}
        renderItem={({ item }) => (
          <SettingsRow title={item.title} des={item.des} screen={item.screen} icon={item.icon} />
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
  grow: { flex: 1 },
  topHeader: { paddingTop: 8, paddingHorizontal: 12, paddingBottom: 8, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 16, height: 40 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  upgrade: {
    // Figma pill 32 (padding 8 around a 16pt row); CustomText needs its
    // 1.4× line box, so the height alone sets the 32 — no vertical padding
    height: 32,
    borderRadius: 100,
    paddingLeft: 10,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
  },
  headerCircle: { width: 40, height: 40, borderRadius: 100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  searchBar: {
    height: 40,
    borderRadius: 100,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
  },
  searchInput: { flex: 1, padding: 0, fontFamily: fonts.medium, fontSize: 16, color: "#FFFFFF" },
  // Figma: content starts 16 below the header; blocks 20 apart
  top: { paddingTop: 16, gap: 20, marginBottom: 20 },
  profile: { paddingVertical: 8, gap: 12, alignItems: "center" },
  avatar: { width: 89, height: 88, borderRadius: 100 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  usernameRow: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 20 },
  status: {
    marginHorizontal: 12,
    padding: 12,
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WHITE_4,
  },
  statusTitle: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusBar: { height: 40, borderRadius: 8 },
  legend: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 100 },
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
  },
  // Figma list: rows 8 apart with a 1pt white 4% rule between them
  rule: { height: 1, backgroundColor: WHITE_4, marginVertical: 8 },
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
