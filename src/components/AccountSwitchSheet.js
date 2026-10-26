import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";

import fonts from "../assets/fonts";
import { useTheme } from "../contexts/ThemeContext";
import { addSavedAccount } from "../store/reducer/usersSlice";
import { accountId, buildSavedAccount } from "../utils/accountSession";
import { COLORS } from "../utils/COLORS";
import { hasProfilePin } from "../utils/profileLock";
import CustomText from "./CustomText";
import FloatingSheet from "./FloatingSheet";
import Icons from "./Icons";
import ImageFast from "./ImageFast";
import UserBadge from "./UserBadge";

/**
 * "Accounts" switcher — port of Viral's chat-list account sheet
 * (useAccountSwitcher + PublishAsSheet): avatar · name ✓ · username · radio.
 * Uses PSC's own saved accounts (users.savedAccounts) and the same handover as
 * the launch Profile Selector: picking another account goes through its
 * profile PIN, which opens the session and resets into the app.
 */
const initialsOf = (account) => {
  const parts = String(account?.name || account?.username || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase() || "?"
  );
};

const AccountSwitchSheet = ({ visible, onDismiss, returnTo }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors, isDark } = useTheme();
  const users = useSelector((s) => s?.users);
  const token = useSelector((s) => s?.authConfig?.token);
  const accounts = Array.isArray(users?.savedAccounts)
    ? users.savedAccounts
    : [];
  const currentId = accountId(users?.userData);
  const tint = (o) =>
    isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`;

  // Keep the signed-in account listed and up to date (photo / colour / name);
  // also covers sessions from before multi-account existed.
  useEffect(() => {
    if (!visible || !token || !currentId) return;
    (async () => {
      const refreshToken = (await AsyncStorage.getItem("refreshToken")) || "";
      const saved = buildSavedAccount(users?.userData, {
        accessToken: token,
        refreshToken,
      });
      if (!saved) return;
      // never wipe a stored refresh token with an empty one
      if (!refreshToken) delete saved.refreshToken;
      dispatch(addSavedAccount(saved));
    })();
  }, [visible]);

  const select = (account) => {
    const id = String(account?.id || "");
    if (!id) return;
    onDismiss?.();
    if (id === currentId) return;
    navigation.navigate("PinVerification", {
      mode: hasProfilePin(users, id) ? "enter" : "define",
      purpose: "profile",
      accountId: id,
      // after the PIN, come back to the screen the sheet was opened from
      ...(returnTo ? { returnTo } : {}),
    });
  };

  const addAccount = () => {
    onDismiss?.();
    // Get-started screen (Register + Login), same as the selector's "+" card
    navigation.navigate("AuthStack", { screen: "OnBoardingScreens" });
  };

  return (
    <FloatingSheet visible={visible} onDismiss={onDismiss} title="Accounts" gap={8}>
      <View>
        {accounts.map((account) => {
          const id = String(account?.id || "");
          const selected = id === currentId;
          const handle = String(account?.username || "").replace(/^@/, "");
          return (
            <TouchableOpacity
              key={id || account?.email}
              activeOpacity={0.7}
              style={styles.option}
              onPress={() => select(account)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              {account?.profilePic ? (
                <ImageFast
                  source={{ uri: account.profilePic }}
                  style={styles.avatar}
                />
              ) : (
                // same initials avatar as the Inbox conversation rows
                <View
                  style={[
                    styles.avatar,
                    styles.addCircle,
                    {
                      backgroundColor:
                        account?.profileColor ||
                        (selected
                          ? users?.userData?.profile?.profileColor
                          : null) ||
                        tint(0.08),
                    },
                  ]}
                >
                  <CustomText
                    label={initialsOf(account)}
                    fontSize={16}
                    fontFamily={fonts.semiBold}
                    color={COLORS.primaryColor}
                  />
                </View>
              )}
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <CustomText
                    label={account?.name || "Account"}
                    fontSize={16}
                    fontFamily={fonts.medium}
                    color={colors.text}
                    numberOfLines={1}
                    containerStyle={styles.shrink}
                  />
                  <UserBadge
                    verified={account?.isVerified}
                    accountType={account?.accountType}
                  />
                </View>
                {handle ? (
                  <CustomText
                    label={handle}
                    fontSize={12}
                    color={tint(0.64)}
                    numberOfLines={1}
                  />
                ) : null}
              </View>
              <Icons
                family="MaterialCommunityIcons"
                name={selected ? "radiobox-marked" : "radiobox-blank"}
                size={22}
                color={selected ? colors.text : COLORS.gray48}
              />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.option}
          onPress={addAccount}
        >
          <View style={[styles.avatar, styles.addCircle, { backgroundColor: tint(0.04) }]}>
            <Icons
              family="MaterialSymbolsRounded"
              name="add"
              size={24}
              color={colors.text}
            />
          </View>
          <CustomText
            label="Add account"
            fontSize={16}
            fontFamily={fonts.medium}
            color={colors.text}
            containerStyle={styles.info}
          />
        </TouchableOpacity>
      </View>
    </FloatingSheet>
  );
};

export default AccountSwitchSheet;

const styles = StyleSheet.create({
  // Viral PublishAsSheet row: 48 avatar · gap 10 · pad 10/4
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 48,
  },
  addCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  shrink: {
    flexShrink: 1,
  },
});
