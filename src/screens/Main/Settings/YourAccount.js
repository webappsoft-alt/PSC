import { FlatList, StyleSheet, View } from "react-native";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { COLORS } from "../../../utils/COLORS";
import SettingsItems from "./molecules/SettingsItems";
import { useTheme } from "../../../contexts/ThemeContext";

const data = [
  {
    id: 1,
    title: "Account information",
    des: "See your account information like your phone number and email address.",
    screen: "AccountInfo",
  },
  {
    id: 2,
    title: "Change your username",
    des: "Change your username",
    screen: "ChangeUsername",
  },
  {
    id: 3,
    title: "Download your data",
    des: "Get insights into the type of information stored for your account.",
    screen: "DownloadData",
  },
  {
    id: 4,
    title: "Deactivate your account",
    des: "Find out how you can deactivate your account.",
    screen: "DeactivateAccount",
  },
];

const YourAccount = () => {
  const { colors } = useTheme();

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title="Your Account" />}
      paddingHorizontal={0.1}
    >
      <View style={{ paddingHorizontal: 12 }}>
        <CustomText
          label={
            "See information about your account, download an archive of your data or learn about your account deactivation options."
          }
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
            isLast={index === data.length - 1}
          />
        )}
      />
    </ScreenWrapper>
  );
};

export default YourAccount;

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
