import { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { COLORS } from "../../../../utils/COLORS";
import SettingsItems from "../molecules/SettingsItems";
import { useTheme } from "../../../../contexts/ThemeContext";

const Monetization = () => {
  const { colors } = useTheme();
  const monetizationSettings = useMemo(
    () => [
      {
        id: "1",
        title: "Your Earnings",
        des: "View your earnings history and payout details.",
        screen: "YourEarnings",
        img: Images.dollar,
      },
      {
        id: "2",
        title: "Subscriptions",
        des: "Manage your subscription offerings for your followers.",
        screen: "Subscriptions",
        img: Images.subs,
      },
      {
        id: "3",
        title: "Payout Settings",
        des: "Set up your preferred payout method and schedule.",
        screen: "PayoutSetting",
        img: Images.payout,
      },
      {
        id: "4",
        title: "Monetization Analytics",
        des: "View detailed analytics about your monetization performance.",
        screen: "MonetizationAnalytics",
        img: Images.analytics,
      },
    ],
    [],
  );

  const renderItem = ({ item, index }) => (
    <SettingsItems
      title={item.title}
      des={item.des}
      screen={item.screen}
      img={item.img}
      isLast={index === monetizationSettings.length - 1}
    />
  );

  const ListHeaderComponent = () => (
    <View style={{ paddingHorizontal: 12 }}>
      <CustomText
        label="Manage your monetization settings, track earnings, and configure payout preferences."
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={24}
        marginTop={8}
      />
    </View>
  );

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      headerUnScrollable={() => <Header title={"Monetization"} />}
    >
      <FlatList
        data={monetizationSettings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeaderComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </ScreenWrapper>
  );
};

export default Monetization;

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
});
