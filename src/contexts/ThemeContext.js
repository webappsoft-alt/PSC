import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { COLORS } from "../utils/COLORS";
import { useHighContrast } from "./HighContrastContext";

const THEME_STORAGE_KEY = "psc-theme-mode";

const themeTokens = {
  dark: {
    ...COLORS,
    mode: "dark",
    background: COLORS.primaryColor,
    surface: COLORS.white04,
    surfaceAlt: COLORS.inputBg,
    card: COLORS.cardColor,
    text: COLORS.white,
    textSecondary: COLORS.subtitle,
    iconMuted: COLORS.gray64,
    statusBarColor: COLORS.primaryColor,
    statusBarStyle: "light-content",
  },
  light: {
    ...COLORS,
    mode: "light",
    background: "#FAFAFA",
    surface: "#FFFFFF",
    surfaceAlt: "#F2F4F7",
    card: "#FFFFFF",
    text: "#121212",
    textSecondary: "rgba(18, 18, 18, 0.64)",
    iconMuted: "rgba(18, 18, 18, 0.64)",
    statusBarColor: "#FAFAFA",
    statusBarStyle: "dark-content",
    border: "#E4E7EC",
    inputBg: "rgba(18, 18, 18, 0.06)",
    white04: "rgba(18, 18, 18, 0.04)",
    cardColor: "#FFFFFF",
    iconMuted: "rgba(18, 18, 18, 0.48)",
  },
};

const ThemeContext = createContext({
  themeMode: "dark",
  colors: themeTokens.dark,
  isDark: true,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState("dark");
  const { isHighContrastEnabled } = useHighContrast();

  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (savedThemeMode === "dark" || savedThemeMode === "light") {
          setThemeModeState(savedThemeMode);
        }
      } catch (error) {
        console.log("Theme load error:", error);
      }
    };

    loadThemeMode();
  }, []);

  const setThemeMode = useCallback(async (nextThemeMode) => {
    if (nextThemeMode !== "dark" && nextThemeMode !== "light") {
      return;
    }

    setThemeModeState(nextThemeMode);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextThemeMode);
    } catch (error) {
      console.log("Theme save error:", error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(themeMode === "dark" ? "light" : "dark");
  }, [setThemeMode, themeMode]);

  const value = useMemo(() => {
    let activeColors = { ...themeTokens[themeMode] };

    if (isHighContrastEnabled) {
      if (themeMode === "light") {
        activeColors = {
          ...activeColors,
          textSecondary: "#000000",
          subtitle: "#000000",
          iconMuted: "#000000",
          border: "#000000",
          inputBg: "#E0E0E0",
          white04: "#E0E0E0",
          surfaceAlt: "#E0E0E0",
          gray64: "#000000",
          gray48: "#000000",
          gray2: "#000000",
        };
      } else {
        activeColors = {
          ...activeColors,
          textSecondary: "#FFFFFF",
          subtitle: "#FFFFFF",
          iconMuted: "#FFFFFF",
          border: "#FFFFFF",
          inputBg: "#333333",
          white04: "#333333",
          surfaceAlt: "#333333",
          cardColor: "#333333",
          gray64: "#FFFFFF",
          gray48: "#FFFFFF",
          gray2: "#FFFFFF",
        };
      }
    }

    return {
      themeMode,
      colors: activeColors,
      isDark: themeMode === "dark",
      setThemeMode,
      toggleTheme,
    };
  }, [setThemeMode, themeMode, toggleTheme, isHighContrastEnabled]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
