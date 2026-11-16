import { View, TouchableOpacity, StyleSheet, Image } from "react-native";
import React from "react";
import moment from "moment";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import { useTheme } from "../../../../contexts/ThemeContext";

const TicketBottomBar = ({
  totalTickets = 0,
  finalPrice = 0,
  onPressBook = () => {},
  loading,
  startDate,
  startTime,
  endTime,
}) => {
  const { colors, isDark } = useTheme();
  // was hardcoded "Today 2:00 PM" · "4h": the event's own day, start, length
  const start = startTime ? moment(startTime, ["HH:mm", "H:mm", "hh:mm A", "h:mm A"]) : null;
  const end = endTime ? moment(endTime, ["HH:mm", "H:mm", "hh:mm A", "h:mm A"]) : null;
  const day = startDate
    ? moment(startDate).calendar(null, {
        sameDay: "[Today]",
        nextDay: "[Tomorrow]",
        lastDay: "[Yesterday]",
        nextWeek: "ddd, MMM D",
        lastWeek: "ddd, MMM D",
        sameElse: "ddd, MMM D",
      })
    : "";
  const when = [day, start?.isValid() ? start.format("h:mm A") : ""].filter(Boolean).join(" ");
  let mins = start?.isValid() && end?.isValid() ? end.diff(start, "minutes") : 0;
  if (mins < 0) mins += 24 * 60;
  const length = mins > 0 ? (mins % 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m`.replace(/^0h /, "") : `${mins / 60}h`) : "";
  const styles = createStyles(colors, isDark);
  return (
    <View style={styles.container}>
      <View style={styles.rowBetween}>
        <View style={[styles.rowBetween, { flex: 1 }]}>
          <Icons
            family={"MaterialIcons"}
            name={"access-time-filled"}
            color={colors.text}
            size={12}
          />
          <CustomText
            label={"Hourly"}
            fontFamily={fonts.medium}
            fontSize={10}
            marginLeft={4}
          />
          <CustomText
            label={"·"}
            fontFamily={fonts.boldExtra}
            fontSize={20}
            color={colors.border}
            marginLeft={4}
          />
          <CustomText
            label={when}
            color={colors.iconMuted}
            fontSize={10}
            marginLeft={4}
          />
          <CustomText
            label={"·"}
            fontFamily={fonts.boldExtra}
            fontSize={20}
            color={colors.border}
            marginLeft={4}
          />
          <CustomText
            label={length}
            color={colors.iconMuted}
            fontSize={10}
            marginLeft={4}
          />
        </View>
        {/* <View style={styles.rowBetween}>
          <Icons
            family={"FontAwesome"}
            name={"tag"}
            size={14}
            color={"#37B874"}
          />
          <CustomText
            label={"20%"}
            fontFamily={fonts.medium}
            fontSize={10}
            marginLeft={4}
            color={"#37B874"}
          />
        </View> */}
      </View>

      <View style={styles.rowBetween}>
        <View style={{ flex: 1, paddingRight: 6 }}>
          <CustomButton
            title="Book Now"
            onPress={onPressBook}
            style={styles.bookBtn}
            textStyle={styles.bookBtnText}
            subText={`Total ${totalTickets} Tickets for £${finalPrice}`}
            subTextStyle={styles.subText}
            loading={loading}
            disabled={loading || totalTickets < 1}
          />
        </View>

        <TouchableOpacity style={styles.circleIcon}>
          <Image source={Images.smallCalender} style={styles.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconTextRow}>
          <Icons
            family={"MaterialCommunityIcons"}
            name={"check-circle"}
            size={14}
            color={"#4347FF"}
          />
          <CustomText
            label="Instant Confirmation"
            fontSize={12}
            fontFamily={fonts.medium}
            color={colors.text}
            marginLeft={4}
          />
        </View>

        <View style={styles.iconTextRow}>
          <Icons
            family={"MaterialCommunityIcons"}
            name={"check-circle"}
            size={14}
            color={"#4347FF"}
          />
          <CustomText
            label="Free Cancellation"
            fontSize={12}
            fontFamily={fonts.medium}
            color={colors.text}
            marginLeft={4}
          />
        </View>
      </View>
    </View>
  );
};

export default TicketBottomBar;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    paddingBottom: 30,
    backgroundColor: colors.background,
    padding: 12,
    paddingTop: 4,
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
  },

  circleIcon: {
    height: 48,
    width: 48,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },

  bookBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.btnSoftColor,
    justifyContent: "center",
  },

  bookBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: COLORS.black,
  },

  subText: {
    fontSize: 12,
    color: COLORS.black,
    bottom: 2,
    fontFamily: fonts.medium,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },

  iconTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    height: 20,
    width: 20,
    resizeMode: "contain",
    tintColor: colors.text,
  },
});
