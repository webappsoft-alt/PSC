import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "@react-native-community/blur";

import ScreenWrapper from "../../../components/ScreenWrapper";
import Header from "../../../components/Header";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import CustomModal from "../../../components/CustomModal";
import CustomButton from "../../../components/CustomButton";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";

import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { PNGIcons } from "../../../assets/images/icons";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import { post } from "../../../services/ApiRequest";
import {
  setUserData,
  addSavedAccount,
  removeSavedAccount,
  setLoginValue,
  setIsEmail,
} from "../../../store/reducer/usersSlice";
import { setToken, logout } from "../../../store/reducer/AuthConfig";
import { ToastMessage } from "../../../utils/ToastMessage";

const ConnectedAccounts = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const userData = useSelector((state) => state?.users?.userData);
  const reduxToken = useSelector((state) => state?.authConfig?.token);
  const currentEmail = userData?.email || "current_user@solagroup.ch";
  const currentName =
    userData?.fullName || userData?.username || "Current Account";

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const reduxSaved = useSelector((state) => state?.users?.savedAccounts || []);
  const savedList = Array.isArray(reduxSaved) ? reduxSaved : [];
  const otherAccounts = savedList.filter(
    (acc) =>
      acc?.email !== currentEmail &&
      acc?.email !== userData?.email &&
      acc?.id !== userData?._id
  );

  const handleAccountSelect = async (account) => {
    if (loadingId) return;
    if (!account?.refreshToken) {
      ToastMessage("Session expired. Please sign in with password.", "error");
      navigation.navigate("Login");
      return;
    }

    setLoadingId(account.email || account.id);

    try {
      const currentToken = await AsyncStorage.getItem("token");
      const currentRefresh = await AsyncStorage.getItem("refreshToken");
      const tokenToSave = currentToken || reduxToken || "";
      const currentAccToSave = {
        id: userData?._id || userData?.email || "user_" + Date.now(),
        name:
          userData?.fullName ||
          userData?.firstName ||
          userData?.username ||
          "Saved Account",
        email: userData?.email || currentEmail || "",
        profilePic: userData?.profile?.avatar || userData?.avatar || null,
        token: tokenToSave,
        refreshToken: currentRefresh || "",
      };
      if (currentAccToSave.email || currentAccToSave.token) {
        dispatch(addSavedAccount(currentAccToSave));
      }

      const res = await post("auth/refresh-token", {
        refreshToken: account.refreshToken,
      });

      if (res?.data?.success || res?.data) {
        const resData = res.data;
        const userObj =
          resData?.user || resData?.data?.user || resData?.data || account;
        const accessToken =
          resData?.tokens?.accessToken ||
          resData?.token ||
          resData?.data?.token;
        const newRefreshToken =
          resData?.refreshToken ||
          resData?.tokens?.refreshToken ||
          resData?.data?.refreshToken ||
          account.refreshToken;

        if (userObj) {
          dispatch(setUserData(userObj));
        }

        if (accessToken) {
          dispatch(setToken(accessToken));
          await AsyncStorage.setItem("token", accessToken);
        }

        if (newRefreshToken) {
          await AsyncStorage.setItem("refreshToken", newRefreshToken);
        }

        if (account.email) {
          dispatch(setLoginValue(account.email));
          dispatch(setIsEmail(true));
        }

        ToastMessage("Switched account successfully", "success");
        navigation.reset({
          index: 0,
          routes: [{ name: "MainStack" }],
        });
      } else {
        throw new Error("Invalid session");
      }
    } catch (error) {
      console.log("Error refreshing token:", error);
      ToastMessage(
        "Failed to sign in with this account. Please log in again.",
        "error"
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemoveAccount = (acc, e) => {
    e?.stopPropagation?.();
    const targetId = acc.email || acc.id;
    dispatch(removeSavedAccount(targetId));
    ToastMessage("Account removed", "success");
  };

  const handleAddAccountClick = () => {
    setModalVisible(true);
  };

  const handleConfirmLogoutAndAdd = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      try {
        const tokenToSave = token || reduxToken || "";
        const accToSave = {
          id: userData?._id || userData?.email || "user_" + Date.now(),
          name:
            userData?.fullName ||
            userData?.firstName ||
            userData?.username ||
            "Saved Account",
          email: userData?.email || currentEmail || "",
          profilePic: userData?.profile?.avatar || userData?.avatar || null,
          token: tokenToSave,
          refreshToken: refreshToken || "",
        };

        console.log("accToSave----->", accToSave);

        dispatch(addSavedAccount(accToSave));
      } catch (saveErr) {
        console.log("Error saving account to Redux:", saveErr);
      }

      await AsyncStorage.setItem("token", "");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("refreshToken");
      dispatch(setUserData({}));
      dispatch(logout());
      dispatch(setToken(""));
      setModalVisible(false);
      ToastMessage("Logged out successfully", "success");
      navigation.reset({
        index: 0,
        routes: [{ name: "AuthStack" }],
      });
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderBackdrop = useCallback(
    () => (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setModalVisible(false)}
        style={StyleSheet.absoluteFill}
      >
        <BlurView
          pointerEvents="none"
          blurType={isDark ? "dark" : "light"}
          blurAmount={10}
          reducedTransparencyFallbackColor={
            isDark ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"
          }
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[
            styles.backdropDim,
            {
              backgroundColor: isDark ? "rgba(0,0,0,0.64)" : "rgba(0,0,0,0.3)",
            },
          ]}
        />
      </TouchableOpacity>
    ),
    [isDark],
  );

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="Connected accounts" />}
    >
      <View style={styles.container}>
        <CustomText
          label="You can switch between multiple Sola Group accounts. Adding a new account will log you out of your current session."
          fontSize={14}
          lineHeight={14 * 1.4}
          color={colors.textSecondary}
          marginBottom={24}
          marginTop={8}
        />

        {/* Current Account Row - Clean, no border */}
        <View style={styles.accountRow}>
          <View style={{ flex: 1 }}>
            <CustomText
              label="CURRENTLY LOGGED IN"
              fontSize={11}
              fontFamily={fonts.medium}
              color={colors.textSecondary}
              marginBottom={4}
            />
            <CustomText
              label={currentName}
              fontSize={16}
              fontFamily={fonts.semiBold}
              color={colors.text}
            />
            <CustomText
              label={currentEmail}
              fontSize={13}
              color={colors.textSecondary}
              marginTop={2}
            />
          </View>
          <View style={styles.activeBadge}>
            <CustomText
              label="Active"
              fontSize={12}
              fontFamily={fonts.medium}
              color="#16A34A"
            />
          </View>
        </View>

        <Divider
          thickness={1}
          color={colors.surfaceAlt}
          marginTop={16}
          marginBottom={16}
        />

        {otherAccounts.length > 0 && (
          <>
            <CustomText
              label="SAVED ACCOUNTS"
              fontSize={11}
              fontFamily={fonts.medium}
              color={colors.textSecondary}
              marginBottom={8}
            />

            {otherAccounts.map((account, index) => {
              const isThisLoading = loadingId === (account.email || account.id);
              const avatarUri = account.profilePic || account.avatar;

              return (
                <TouchableOpacity
                  key={account.id || account.email || index}
                  style={styles.savedAccountRow}
                  onPress={() => handleAccountSelect(account)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarContainer}>
                    {avatarUri ? (
                      <ImageFast
                        source={{ uri: avatarUri }}
                        style={styles.avatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.defaultAvatar,
                          { backgroundColor: COLORS.buttonColor },
                        ]}
                      >
                        <CustomText
                          label={(account.name || account.email || "U")[0].toUpperCase()}
                          fontSize={18}
                          fontFamily={fonts.semiBold}
                          color={COLORS.white}
                        />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <CustomText
                      label={account.name || "Account"}
                      fontSize={16}
                      fontFamily={fonts.semiBold}
                      color={colors.text}
                    />
                    {account.email ? (
                      <CustomText
                        label={account.email}
                        fontSize={13}
                        color={colors.textSecondary}
                        marginTop={2}
                      />
                    ) : null}
                  </View>

                  <View style={styles.rightAction}>
                    {isThisLoading ? (
                      <ActivityIndicator size="small" color={COLORS.buttonColor} />
                    ) : (
                      <>
                        <Icons
                          family="MaterialIcons"
                          name="arrow-forward-ios"
                          size={16}
                          color={colors.iconMuted}
                        />
                        <TouchableOpacity
                          onPress={(e) => handleRemoveAccount(account, e)}
                          style={styles.removeBtn}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Icons
                            family="MaterialIcons"
                            name="close"
                            size={18}
                            color={colors.iconMuted}
                          />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            <Divider
              thickness={1}
              color={colors.surfaceAlt}
              marginTop={16}
              marginBottom={16}
            />
          </>
        )}

        {/* Add Account Action Row - Clean, no border */}
        <TouchableOpacity
          style={styles.addRow}
          onPress={handleAddAccountClick}
          activeOpacity={0.7}
        >
          <View style={styles.addIconCircle}>
            <CustomText
              label="+"
              fontSize={20}
              fontFamily={fonts.medium}
              color={COLORS.white}
            />
          </View>
          <View style={{ flex: 1 }}>
            <CustomText
              label="Add account"
              fontSize={16}
              fontFamily={fonts.medium}
              color={COLORS.buttonColor}
            />
            <CustomText
              label="Log in with another Sola Group account"
              fontSize={12}
              color={colors.textSecondary}
              marginTop={2}
            />
          </View>
        </TouchableOpacity>

        <Divider
          thickness={1}
          color={colors.surfaceAlt}
          marginTop={16}
          marginBottom={16}
        />

        {/* Log Out Action Row */}
        <TouchableOpacity
          style={styles.addRow}
          onPress={handleConfirmLogoutAndAdd}
          activeOpacity={0.7}
        >
          <View style={[styles.addIconCircle, { backgroundColor: "#EE1045" }]}>
            <Icons
              family="MaterialIcons"
              name="logout"
              size={18}
              color={COLORS.white}
            />
          </View>
          <View style={{ flex: 1 }}>
            <CustomText
              label="Log out of current account"
              fontSize={16}
              fontFamily={fonts.medium}
              color="#EE1045"
            />
            <CustomText
              label="Save your session & sign in to another account"
              fontSize={12}
              color={colors.textSecondary}
              marginTop={2}
            />
          </View>
        </TouchableOpacity>

        {/* ShareModal-styled CustomModal */}
        <CustomModal
          isChange
          isVisible={modalVisible}
          onDisable={() => setModalVisible(false)}
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
                  label="Switching Account"
                  fontFamily={fonts.semiBold}
                  fontSize={24}
                  color={colors.text}
                />
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
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
                label="If you log into a new account, your current account will be logged out."
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
                  title="Cancel"
                  width="47%"
                  height={48}
                  backgroundColor={colors.surfaceAlt}
                  color={colors.text}
                  onPress={() => setModalVisible(false)}
                  disabled={loading}
                />
                <CustomButton
                  title="Log out"
                  width="47%"
                  height={48}
                  backgroundColor={colors.text}
                  color={colors.background}
                  onPress={handleConfirmLogoutAndAdd}
                  loading={loading}
                />
              </View>
            </View>
          </View>
        </CustomModal>
      </View>
    </ScreenWrapper>
  );
};

export default ConnectedAccounts;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  activeBadge: {
    backgroundColor: "rgba(22, 163, 74, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 6,
  },
  addIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.buttonColor,
    alignItems: "center",
    justifyContent: "center",
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
    paddingVertical: 14,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
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
  savedAccountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  defaultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rightAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  removeBtn: {
    marginLeft: 14,
    padding: 4,
  },
});
