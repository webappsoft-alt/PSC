import { FlatList, StyleSheet, View } from "react-native";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { useTheme } from "../../../../contexts/ThemeContext";
import SettingsItems from "../molecules/SettingsItems";
import { useSelector } from "react-redux";

const data = [
  {
    id: 1,
    title: "Vision",
    des: "Manage your vision settings.",
    screen: "Visions",
    img: Images.settings_vision,
  },
  {
    id: 2,
    title: "Display",
    des: "Manage your font size, color, and app theme.",
    img: Images.settings_display,
    screen: "Display",
  },
  {
    id: 3,
    title: "Languages",
    des: "Manage the languages you see content in.",
    img: Images.settings_globe,
    screen: "Language",
  },
  {
    id: 4,
    title: "Preferred Country",
    des: "Set your preferred country and currency displayed for price.",
    img: Images.settings_currency,
    screen: "PreferredCountry",
  },
  {
    id: 5,
    title: "Time & Region",
    des: "Set the currency displayed for price.",
    img: Images.settings_globe,
    screen: "TimeRegion",
  },
  {
    id: 6,
    title: "Preferred Addressing",
    des: "Set the currency displayed for price.",
    img: Images.settings_addressing,
    screen: "PreferredAddress",
  },
  {
    id: 7,
    title: "Data usage",
    des: "Limit how PSC uses some of you network data.",
    img: Images.settings_usage,
    screen: "DataUsage",
  },
];

const AccessibilityPreferences = () => {
  const { colors } = useTheme();

  const { userData } = useSelector((state) => state.users);

  console.log("userData: ", userData);
  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title="Accessibility & Preferences" />}
      paddingHorizontal={0.1}
    >
      <View style={{ paddingHorizontal: 12 }}>
        <CustomText
          label={"Manage how PSC content is displayed to you"}
          fontSize={14}
          lineHeight={14 * 1.4}
          color={colors.textSecondary}
          marginBottom={16}
          marginTop={8}
        />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <SettingsItems
            title={item.title}
            des={item.des}
            screen={item.screen}
            img={item?.img}
            isLast={index === data.length - 1}
          />
        )}
      />
    </ScreenWrapper>
  );
};

export default AccessibilityPreferences;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignContent: "center",
    gap: 8,
    marginBottom: 16,
    marginTop: 16,
  },
  list: {
    paddingBottom: 40,
  },
});
