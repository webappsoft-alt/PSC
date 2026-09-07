import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ImageFast from "../../../../components/ImageFast";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { COLORS } from "../../../../utils/COLORS";
import ToggleCard from "../../Settings/molecules/ToggleCard";
import { useTheme } from "../../../../contexts/ThemeContext";

const PayoutSetting = () => {
  const { colors } = useTheme();
  const [selectedSchedule, setSelectedSchedule] = useState("Weekly");

  const handleScheduleChange = (schedule) => {
    setSelectedSchedule(schedule);
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Payout Settings"} />}
      scrollEnabled
    >
      <CustomText
        label="Control when and how often PSC sends you emails."
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={20}
        marginTop={8}
      />

      {/* Payout Methods Section */}
      <CustomText
        label="Payout Methods"
        fontSize={18}
        fontFamily={fonts.semiBold}
      />
      <CustomText
        label="Choose your payout method."
        fontSize={14}
        color={colors.textSecondary}
      />

      {/* Stripe Card */}
      <TouchableOpacity activeOpacity={0.6} style={[styles.stripeCard, { backgroundColor: colors.surface }]}>
        <View style={styles.stripeLeft}>
          <View style={styles.stripeIconContainer}>
            <ImageFast source={Images.stripe} style={styles.stripeIcon} />
            <CustomText
              label="Stripe"
              fontFamily={fonts.medium}
              fontSize={16}
              marginLeft={4}
            />
          </View>
          <View style={styles.stripeTextContainer}>
            <CustomText
              label="Payouts are sent directly to your Stripe account."
              fontSize={12}
              color={colors.textSecondary}
              marginTop={6}
            />
          </View>
        </View>
        <CustomButton
          title="Open"
          fontSize={12}
          color={colors.textSecondary}
          width={50}
          height={34}
          backgroundColor={colors.surfaceAlt}
        />
      </TouchableOpacity>

      {/* Payout Schedule Section */}
      <CustomText
        label="Payout Schedule"
        fontSize={18}
        fontFamily={fonts.semiBold}
        marginBottom={4}
        marginTop={24}
      />
      <CustomText
        label="Choose how often you want to receive payouts."
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={6}
      />

      <ToggleCard
        title="Weekly"
        subtitle="Every Monday"
        value={selectedSchedule === "Weekly"}
        onPress={() => handleScheduleChange("Weekly")}
        isOption
        marginTop={8}
      />

      <ToggleCard
        title="Bi-weekly"
        subtitle="Every other week on Mondays"
        value={selectedSchedule === "Bi-weekly"}
        onPress={() => handleScheduleChange("Bi-weekly")}
        isOption
        marginTop={8}
      />

      <ToggleCard
        title="Monthly"
        subtitle="First Monday of the month"
        value={selectedSchedule === "Monthly"}
        onPress={() => handleScheduleChange("Monthly")}
        isOption
        marginTop={8}
      />

      <View
        style={{ backgroundColor: colors.surfaceAlt, padding: 16, marginTop: 40, borderRadius: 12 }}
      >
        <CustomText
          label="Minimum Payout Amount"
          fontSize={16}
          fontFamily={fonts.semiBold}
        />
        <CustomText
          label="You must have at least $50 in earnings to receive a payout. If your balance is below this threshold, your earnings will roll over to the next payout period."
          fontSize={12}
          color={colors.textSecondary}
        />
      </View>
    </ScreenWrapper>
  );
};

export default PayoutSetting;

const styles = StyleSheet.create({
  stripeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white04,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  stripeLeft: {
    // flexDirection: "row",
    // alignItems: "center",
    flex: 1,
  },
  stripeIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "center",
  },
  stripeIcon: {
    width: 24,
    height: 24,
    borderRadius: 99,
  },
  stripeTextContainer: {
    flex: 1,
  },
});
