/**
 * Signing in / switching between the accounts of the profile selector.
 *
 * Every successful login or registration stores the account in
 * users.savedAccounts (same shape the Settings "Save info" logout already
 * uses: { id, name, email, profilePic, token, refreshToken }, plus the bits the
 * selector card shows) and marks it as the active one.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import { post } from "../services/ApiRequest";
import { setToken } from "../store/reducer/AuthConfig";
import {
  addSavedAccount,
  setActiveAccountId,
  setUserData,
} from "../store/reducer/usersSlice";

export const accountId = (user) => String(user?._id || user?.id || "");

export const accountName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
  user?.username ||
  user?.email ||
  "Account";

export const isProUser = (user) =>
  Boolean(
    user?.profile?.isPro ||
      user?.role === "individual" ||
      user?.role === "company",
  );

export function buildSavedAccount(user, tokens = {}) {
  const id = accountId(user);
  if (!id) return null;
  return {
    id,
    name: accountName(user),
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    profilePic: user?.profile?.avatar || user?.avatar || null,
    isPro: isProUser(user),
    isVerified: Boolean(user?.profile?.isVerified),
    token: tokens?.accessToken || "",
    refreshToken: tokens?.refreshToken || "",
    updatedAt: Date.now(),
  };
}

/** Puts a freshly authenticated session in place and remembers the account. */
export async function applySession(dispatch, user, tokens) {
  const accessToken = tokens?.accessToken || "";
  const refreshToken = tokens?.refreshToken || "";
  if (user) dispatch(setUserData(user));
  if (accessToken) {
    dispatch(setToken(accessToken));
    await AsyncStorage.setItem("token", accessToken);
  }
  if (refreshToken) await AsyncStorage.setItem("refreshToken", refreshToken);

  const saved = buildSavedAccount(user, tokens);
  if (saved) {
    dispatch(addSavedAccount(saved));
    dispatch(setActiveAccountId(saved.id));
  }
}

/**
 * Re-opens a saved account through its refresh token. Resolves to true when
 * the session is live, false when the account must sign in again.
 */
export async function openSavedAccount(dispatch, account) {
  if (!account?.refreshToken) return false;
  try {
    const res = await post("auth/refresh-token", {
      refreshToken: account.refreshToken,
    });
    const data = res?.data || {};
    const user = data?.user || data?.data?.user;
    const tokens = data?.tokens || {
      accessToken: data?.token || data?.data?.token,
      refreshToken: data?.refreshToken || account.refreshToken,
    };
    if (!tokens?.accessToken) return false;
    await applySession(dispatch, user || null, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || account.refreshToken,
    });
    if (!user) dispatch(setActiveAccountId(account.id));
    return true;
  } catch (error) {
    console.log("Saved account session failed:", error?.message || error);
    return false;
  }
}
