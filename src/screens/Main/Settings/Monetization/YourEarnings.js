import { StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ImageFast from "../../../../components/ImageFast";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const YourEarnings = () => {
  const { colors } = useTheme();
  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Your Earnings"} />}
      footerUnScrollable={() => (
        <CustomButton
          title={"Export Statement"}
          icon={Images.download}
          backgroundColor={colors.text}
          color={colors.background}
          isBottom
          width="95%"
        />
      )}
      scrollEnabled
    >
      {/* Total Earnings Section */}
      <CustomText
        label="Total Earnings"
        fontSize={16}
        color={colors.textSecondary}
        marginTop={8}
      />
      <View style={styles.row}>
        <CustomText
          label="$"
          fontSize={40}
          fontFamily={fonts.semiBold}
          color={colors.textSecondary}
        />
        <CustomText
          label="1,123.45"
          fontSize={40}
          fontFamily={fonts.semiBold}
        />
      </View>

      {/* This Month Only Section */}
      <CustomText
        label="This Month Only"
        fontSize={14}
        color={colors.textSecondary}
      />
      <View style={styles.row}>
        <CustomText
          label="$"
          fontSize={24}
          fontFamily={fonts.semiBold}
          color={colors.textSecondary}
        />
        <CustomText
          label="1,123.45"
          fontSize={24}
          fontFamily={fonts.semiBold}
        />
      </View>

      {/* Pending Balance Section */}
      <CustomText label="Pending Balance" color={colors.textSecondary} />
      <CustomText
        label="$123.45"
        fontSize={20}
        fontFamily={fonts.semiBold}
        color="#a19375"
        marginBottom={40}
      />

      {/* Subscriptions Row */}
      <View style={[styles.earningRow, { borderBottomColor: colors.surfaceAlt }]}>
        <View style={styles.leftSection}>
          <ImageFast source={Images.subscription} style={styles.icon} />
          <CustomText
            label="Subscriptions"
            fontSize={16}
            fontFamily={fonts.medium}
            marginLeft={12}
          />
        </View>
        <View style={styles.row}>
          <CustomText
            label="$"
            fontSize={16}
            fontFamily={fonts.medium}
            color={colors.textSecondary}
          />
          <CustomText label="45.67" fontSize={16} fontFamily={fonts.medium} />
        </View>
      </View>

      {/* Donations Row */}
      <View style={[styles.earningRow, { borderBottomColor: colors.surfaceAlt }]}>
        <View style={styles.leftSection}>
          <ImageFast source={Images.donation} style={styles.icon} />
          <CustomText
            label="Donations"
            fontSize={16}
            fontFamily={fonts.medium}
            marginLeft={12}
          />
        </View>
        <View style={styles.row}>
          <CustomText
            label="$"
            fontSize={16}
            fontFamily={fonts.medium}
            color={colors.textSecondary}
          />
          <CustomText label="45.67" fontSize={16} fontFamily={fonts.medium} />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default YourEarnings;

const styles = StyleSheet.create({
  earningRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.white04,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
