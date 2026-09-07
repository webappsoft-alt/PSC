import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { User } from "@/types";
import { MOCK_CURRENT_USER } from "@/constants/mockData";

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  unreadNotifications: number;
  isDarkMode: boolean;
  accentColor: string;
  notificationData: any;
  setNotificationData: (data: any) => void;
  showError: boolean;
  setShowError: (value: boolean) => void;
  alertMessage: string;
  setAlertMessage: (value: string) => void;
  linkCopy: boolean;
  setLinkCopy: (value: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (
    username: string,
    email: string,
    password: string,
    age: number,
  ) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: () => Promise<void>;

  setUnreadNotifications: (count: number) => void;
  toggleDarkMode: () => void;
  setIsDarkMode: (value: boolean) => void;
  setDarkMode: (value: boolean) => void;

  setAccentColor: (color: string) => void;
  actualUser: object | null; // <-- new state
  setActualUser: (user: object | null) => void;
}

export const [AppProvider, useApp] = createContextHook<AppState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [actualUser, setActualUser] = useState<object | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [linkCopy, setLinkCopy] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] =
    useState<boolean>(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [notificationData, setNotificationData] = useState<any>({});
  const [accentColor, setAccentColorState] = useState<string>("#1A9D7C");

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadUserData();
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    };

    initializeApp();
  }, []);

  /** Load user & theme data */
  const loadUserData = async () => {
    try {
      const [authData, onboardingData, userData, colorData] = await Promise.all(
        [
          AsyncStorage.getItem("viral_auth"),
          AsyncStorage.getItem("viral_onboarding"),
          AsyncStorage.getItem("viral_user"),
          AsyncStorage.getItem("viral_accent_color"),
          AsyncStorage.getItem("viral_dark_mode"),
        ],
      );

      if (colorData) setAccentColorState(colorData);
      if (authData === "true") setIsAuthenticated(true);
      if (onboardingData === "true") setHasCompletedOnboarding(true);

      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed?.id) setUser(parsed);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  /** Auth & user actions */
  const login = async (email: string, password: string) => {
    const mockUser = { ...MOCK_CURRENT_USER, email };
    setUser(mockUser);
    setIsAuthenticated(true);
    await AsyncStorage.setItem("viral_auth", "true");
    await AsyncStorage.setItem("viral_user", JSON.stringify(mockUser));
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
    await AsyncStorage.clear();
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    age: number,
  ) => {
    const isMinor = age < 18;
    const newUser: User = { ...MOCK_CURRENT_USER, username, email, isMinor };
    setUser(newUser);
    setIsAuthenticated(true);
    await AsyncStorage.setItem("viral_auth", "true");
    await AsyncStorage.setItem("viral_user", JSON.stringify(newUser));
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    AsyncStorage.setItem("viral_user", JSON.stringify(updated)).catch(
      console.error,
    );
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem("viral_onboarding", "true");
  };

  const toggleDarkMode = async () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem("viral_dark_mode", next ? "dark" : "light");
      return next;
    });
  };

  const setAccentColor = async (color: string) => {
    setAccentColorState(color);
    await AsyncStorage.setItem("viral_accent_color", color);
  };
  const setDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    // await AsyncStorage.setItem("viral_dark_mode", value ? "dark" : "light");
  };

  return {
    user,
    isAuthenticated,
    hasCompletedOnboarding,
    unreadNotifications,
    isDarkMode,

    accentColor,
    login,
    logout,
    signup,
    updateUser,
    completeOnboarding,
    setUnreadNotifications,
    toggleDarkMode,
    setAccentColor,
    actualUser,
    setActualUser,
    showError,
    setShowError,
    alertMessage,
    setAlertMessage,
    notificationData,
    setNotificationData,
    setDarkMode,
    setIsDarkMode,
    linkCopy,
    setLinkCopy,
  };
});
