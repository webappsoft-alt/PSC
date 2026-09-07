import { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { COLORS } from "../../../../utils/COLORS";
import SettingsItems from "../molecules/SettingsItems";
import { useTheme } from "../../../../contexts/ThemeContext";

const TimeRegion = () => {
  const { colors } = useTheme();
  const timeRegionData = useMemo(
    () => [
      {
        id: "1",
        title: "Time-zone",
        des: "View your earnings history and payout details.",
        screen: "TimeZone",
        img: Images.time, // Add your icon here
      },
      {
        id: "2",
        title: "First day of the week",
        des: "Manage your subscription offerings for your followers.",
        screen: "FirstDayOfWeek",
        img: Images.firstDay, // Add your icon here
      },
      {
        id: "3",
        title: "Date Format",
        des: "Set up your preferred payout method and schedule.",
        screen: "DateFormat",
        img: Images.date, // Add your icon here
      },
      {
        id: "4",
        title: "Time Format",
        des: "Choose between 12-hour or 24-hour time display.",
        screen: "TimeFormat",
        img: Images.time,
      },
    ],
    [],
  );

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title="Time & Regions" />}
      paddingHorizontal={0.1}
    >
      <View style={{ paddingHorizontal: 12 }}>
        <CustomText
          label={
            "See how you can generate revenues on PSC and manage your monetisation options."
          }
          fontSize={14}
          lineHeight={14 * 1.4}
          color={colors.textSecondary}
          marginBottom={16}
          marginTop={8}
        />
      </View>

      <FlatList
        data={timeRegionData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <SettingsItems
            title={item.title}
            des={item.des}
            screen={item.screen}
            img={item.img}
            isLast={index === timeRegionData.length - 1}
          />
        )}
      />
    </ScreenWrapper>
  );
};

export default TimeRegion;

const styles = StyleSheet.create({
  list: {
    paddingBottom: 40,
  },
});
