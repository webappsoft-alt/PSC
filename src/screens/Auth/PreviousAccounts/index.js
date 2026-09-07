import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ScreenWrapper from "../../../components/ScreenWrapper";
import Header from "../../../components/Header";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import CustomButton from "../../../components/CustomButton";

import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import { post } from "../../../services/ApiRequest";
import { ToastMessage } from "../../../utils/ToastMessage";
import {
  setUserData,
  setLoginValue,
  setIsEmail,
  setSavedAccounts,
  removeSavedAccount,
} from "../../../store/reducer/usersSlice";
import { setToken } from "../../../store/reducer/AuthConfig";

const PreviousAccounts = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();

  const reduxSaved = useSelector((state) => state?.users?.savedAccounts || []);
  const savedList = Array.isArray(reduxSaved) ? reduxSaved : [];
  const [loadingId, setLoadingId] = useState(null);

  const handleAccountSelect = async (account) => {
    if (loadingId) return;
    if (!account?.refreshToken) {
      ToastMessage("Session expired. Please sign in with password.", "error");
      navigation.navigate("Login");
      return;
    }

    setLoadingId(account.email || account.id);

    try {
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

        ToastMessage("Signed in successfully", "success");
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
        "Session expired. Please sign in with email and password.",
        "error"
      );
      navigation.navigate("Login");
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

  const renderItem = ({ item }) => {
    const isThisLoading = loadingId === (item.email || item.id);
    const avatarUri = item.profilePic || item.avatar;

    return (
      <TouchableOpacity
        style={styles.accountRow}
        onPress={() => handleAccountSelect(item)}
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
                label={(item.name || item.email || "U")[0].toUpperCase()}
                fontSize={18}
                fontFamily={fonts.semiBold}
                color={COLORS.white}
              />
            </View>
          )}
        </View>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <CustomText
            label={item.name || "Account"}
            fontSize={16}
            fontFamily={fonts.semiBold}
            color={colors.text}
          />
          {item.email ? (
            <CustomText
              label={item.email}
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
                onPress={(e) => handleRemoveAccount(item, e)}
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
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="Sign in with saved account" />}
    >
      <View style={styles.container}>
        <CustomText
          label="Select an account from your previous sessions to sign in quickly without entering your password."
          fontSize={14}
          lineHeight={14 * 1.4}
          color={colors.textSecondary}
          marginBottom={20}
          marginTop={8}
        />

        {savedList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CustomText
              label="No saved accounts found."
              fontSize={15}
              fontFamily={fonts.medium}
              color={colors.textSecondary}
              alignSelf="center"
              marginVertical={30}
            />
          </View>
        ) : (
          <FlatList
            data={savedList}
            keyExtractor={(item, idx) => item.email || item.id || String(idx)}
            renderItem={renderItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              <Divider
                thickness={1}
                color={colors.surfaceAlt}
                marginTop={12}
                marginBottom={12}
              />
            )}
          />
        )}

        <View style={{ marginTop: 32 }}>
          <CustomButton
            title="Log in to another account"
            onPress={() => navigation.navigate("Login")}
            backgroundColor={isDark ? COLORS.inputBg : colors.surfaceAlt}
            color={colors.text}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default PreviousAccounts;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rightAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  removeBtn: {
    marginLeft: 16,
    padding: 4,
  },
  emptyContainer: {
    paddingVertical: 20,
  },
});
