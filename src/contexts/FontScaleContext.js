import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FontScaleContext = createContext({
  isLargeTextEnabled: false,
  setLargeTextEnabled: () => {},
});

export const useFontScale = () => useContext(FontScaleContext);

export const FontScaleProvider = ({ children }) => {
  const [isLargeTextEnabled, setIsLargeTextEnabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadFontScalePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem("isLargeTextEnabled");
        if (savedPreference !== null) {
          setIsLargeTextEnabled(JSON.parse(savedPreference));
        }
      } catch (error) {
        console.error("Error loading font scale preference:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadFontScalePreference();
  }, []);

  const setLargeTextEnabled = async (enabled) => {
    try {
      setIsLargeTextEnabled(enabled);
      await AsyncStorage.setItem("isLargeTextEnabled", JSON.stringify(enabled));
    } catch (error) {
      console.error("Error saving font scale preference:", error);
    }
  };

  // Prevent rendering children until preference is loaded to avoid jumpy layout
  if (!isLoaded) {
    return null;
  }

  return (
    <FontScaleContext.Provider value={{ isLargeTextEnabled, setLargeTextEnabled }}>
      {children}
    </FontScaleContext.Provider>
  );
};
