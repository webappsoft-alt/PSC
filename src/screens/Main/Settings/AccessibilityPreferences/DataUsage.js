import { StyleSheet } from "react-native";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { useTheme } from "../../../../contexts/ThemeContext";
import ToggleCard from "../molecules/ToggleCard";

const DataUsage = () => {
  const { colors } = useTheme();

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Data usage"} />}
      scrollEnabled={false}
    >
      <CustomText
        label="Limit how PSC uses some of your network data. These settings affects all the Sola accounts."
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={20}
        marginTop={8}
      />

      <ToggleCard
        title={"Data saver"}
        subtitle={"Reduce data usage by lowering image & video quality."}
        marginTop={8}
      />
      <ToggleCard
        title={"Autoplay videos"}
        subtitle={"Videos will start playing automatically in your feed."}
        marginBottom={8}
        marginTop={8}
      />

      <ToggleCard
        title={"4K Images"}
        subtitle={"Load images in high definition when available."}
        marginBottom={40}
      />
    </ScreenWrapper>
  );
};

export default DataUsage;

const styles = StyleSheet.create({});
