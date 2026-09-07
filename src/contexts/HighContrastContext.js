import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HighContrastContext = createContext({
  isHighContrastEnabled: false,
  setHighContrastEnabled: () => {},
});

export const useHighContrast = () => useContext(HighContrastContext);

export const HighContrastProvider = ({ children }) => {
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem("psc-high-contrast");
        if (savedPreference !== null) {
          setIsHighContrastEnabled(JSON.parse(savedPreference));
        }
      } catch (error) {
        console.error("Error loading high contrast preference:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadPreference();
  }, []);

  const setHighContrastEnabled = async (enabled) => {
    try {
      setIsHighContrastEnabled(enabled);
      await AsyncStorage.setItem("psc-high-contrast", JSON.stringify(enabled));
    } catch (error) {
      console.error("Error saving high contrast preference:", error);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <HighContrastContext.Provider
      value={{ isHighContrastEnabled, setHighContrastEnabled }}
    >
      {children}
    </HighContrastContext.Provider>
  );
};
