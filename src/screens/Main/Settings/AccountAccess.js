import { FlatList, StyleSheet, View } from "react-native";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import ScreenWrapper, { ScreenHeaderSpacer } from "../../../components/ScreenWrapper";
import { COLORS } from "../../../utils/COLORS";
import SettingsItems from "./molecules/SettingsItems";
import { useTheme } from "../../../contexts/ThemeContext";

const data = [
  {
    id: 1,
    title: "Two-factor authentication",
    des: "Manage two-factor authentication options.",
    screen: "TwoFactorAuth",
  },
  {
    id: 2,
    title: "Password",
    des: "Change your password at any time.",
    screen: "ChangePassword",
  },
  {
    id: 3,
    title: "Apps and sessions",
    des: "See information about when you logged into your account and the apps you connected to your account.",
    screen: "AppsAndSessions",
  },
  {
    id: 4,
    title: "Connected accounts",
    des: "Manage Sola Group accounts connected to your account to log in.",
    screen: "ConnectedAccounts",
  },
  {
    id: 5,
    title: "Account access history",
    des: "See your account access history.",
    screen: "AccountAccessHistory",
  },
];

const AccountAccess = () => {
  const { colors } = useTheme();

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title="Security and account access" />}
      paddingHorizontal={0.1}
      backgroundColor={"black"}
      headerBlur
    >
      <FlatList
        ListHeaderComponent={
          <>
            <ScreenHeaderSpacer />
            <View style={{ paddingHorizontal: 12 }}>
              <CustomText
                label={
                  "Manage your account’s security and keep track of your account’s usage, including apps that you have connected to your account."
                }
                fontSize={14}
                lineHeight={14 * 1.4}
                color={colors.textSecondary}
                marginBottom={16}
                marginTop={8}
              />
            </View>
          </>
        }
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

export default AccountAccess;

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
