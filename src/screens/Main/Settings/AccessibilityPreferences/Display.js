import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { COLORS } from "../../../../utils/COLORS";
import ToggleCard from "../molecules/ToggleCard";
import { useTheme } from "../../../../contexts/ThemeContext";

const Display = () => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(themeMode === "light" ? "Light" : "Dark Mode");
  const [selectedFontSize, setSelectedFontSize] = useState("Medium");

  useEffect(() => {
    if (themeMode === "light") {
      setSelectedTheme("Light");
    } else if (themeMode === "dark" && selectedTheme !== "Gold" && selectedTheme !== "Platinum") {
      setSelectedTheme("Dark Mode");
    }
  }, [themeMode]);

  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
    if (theme === "Light") {
      setThemeMode("light");
    } else if (theme === "Dark Mode") {
      setThemeMode("dark");
    }
  };

  const handleFontSizeChange = (fontSize) => {
    setSelectedFontSize(fontSize);
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Display"} />}
      scrollEnabled
    >
      <CustomText
        label="Control when and how often PSC sends you emails."
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={20}
        marginTop={8}
      />

      {/* App Theme Section */}
      <CustomText
        label="App Theme"
        fontSize={18}
        fontFamily={fonts.semiBold}
        marginBottom={4}
      />
      <CustomText
        label="Choose how you want to experience the app"
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={12}
      />

      <ToggleCard
        title={"Light"}
        subtitle={"Every Monday"}
        value={selectedTheme === "Light"}
        onPress={() => handleThemeChange("Light")}
        isOption
        marginTop={8}
      />

      <ToggleCard
        title={"Dark Mode"}
        subtitle={"Every other week on Mondays"}
        value={selectedTheme === "Dark Mode"}
        onPress={() => handleThemeChange("Dark Mode")}
        isOption
        marginTop={8}
      />

      <ToggleCard
        title={"Gold"}
        subtitle={"First Monday of the month"}
        value={selectedTheme === "Gold"}
        onPress={() => handleThemeChange("Gold")}
        isOption
        marginTop={8}
      />

      <ToggleCard
        title={"Platinum"}
        subtitle={"First Monday of the month"}
        value={selectedTheme === "Platinum"}
        onPress={() => handleThemeChange("Platinum")}
        isOption
        marginTop={8}
        marginBottom={24}
      />

      {/* Font size Section */}
      <CustomText
        label="Font size"
        fontSize={18}
        fontFamily={fonts.semiBold}
        marginBottom={4}
      />
      <CustomText
        label="Choose your font size for the app"
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={12}
      />

      <ToggleCard
        title={"Small"}
        subtitle={"14px font size."}
        value={selectedFontSize === "Small"}
        onPress={() => handleFontSizeChange("Small")}
        isOption
        marginTop={8}
      />

      <ToggleCard
        title={"Medium"}
        subtitle={"16px font size. (Default)"}
        value={selectedFontSize === "Medium"}
        onPress={() => handleFontSizeChange("Medium")}
        isOption
        marginTop={8}
      />

      <ToggleCard
        title={"Large"}
        subtitle={"18px font size."}
        value={selectedFontSize === "Large"}
        onPress={() => handleFontSizeChange("Large")}
        isOption
        marginTop={8}
      />

      <ToggleCard
        title={"Extra Large"}
        subtitle={"20px font size."}
        value={selectedFontSize === "Extra Large"}
        onPress={() => handleFontSizeChange("Extra Large")}
        isOption
        marginTop={8}
        marginBottom={40}
      />
    </ScreenWrapper>
  );
};

export default Display;

const styles = StyleSheet.create({});
