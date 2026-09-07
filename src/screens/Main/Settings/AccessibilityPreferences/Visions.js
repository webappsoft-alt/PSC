import { StyleSheet } from "react-native";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useFontScale } from "../../../../contexts/FontScaleContext";
import { useHighContrast } from "../../../../contexts/HighContrastContext";
import ToggleCard from "../molecules/ToggleCard";

const Visions = () => {
  const { colors, isDark, setThemeMode } = useTheme();
  const { isLargeTextEnabled, setLargeTextEnabled } = useFontScale();
  const { isHighContrastEnabled, setHighContrastEnabled } = useHighContrast();

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Vision"} />}
      scrollEnabled={false}
    >
      <CustomText
        label="Manage visual settings like font size and color contrast."
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={20}
        marginTop={8}
      />

      <ToggleCard
        title={"Dark theme"}
        subtitle={"Switch the app between dark and light appearance."}
        value={isDark}
        setValue={(enabled) => setThemeMode(enabled ? "dark" : "light")}
        marginTop={8}
      />
      <ToggleCard
        title={"High contrast"}
        subtitle={"Increase the contrast to make text more legible."}
        marginTop={8}
        value={isHighContrastEnabled}
        setValue={setHighContrastEnabled}
      />
      <ToggleCard
        title={"Reduce motion"}
        subtitle={"Minimize animations and other distracting effects."}
        marginBottom={8}
        marginTop={8}
      />

      <ToggleCard
        title={"Large texts"}
        subtitle={"Use larger text sizes for improved readability."}
        marginBottom={40}
        value={isLargeTextEnabled}
        setValue={setLargeTextEnabled}
      />
    </ScreenWrapper>
  );
};

export default Visions;

const styles = StyleSheet.create({});
