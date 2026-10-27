import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { ToastMessage } from "../../../../utils/ToastMessage";

/**
 * Figma `Main-Chat-Meeting` (7933:686) row: 72 tall, pad 12/16, gap 12 —
 * picture 48 r12 (no status) · name Medium 16 −0.5 · [time SemiBold 14 −0.5
 * · dot 3 white 16% · pin_drop 12 #828186 + "Location" Medium 14 −0.5 @48%]
 * · notification_add 24 white on the right ("add to my calendar", client).
 */
const MeetingRow = ({ row }) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const m = row?.meeting || {};
  const when = moment(m.startsAt);
  const w = row?.with || {};
  const name = w.isGroup ? w.name : `${w.firstName || ""} ${w.lastName || ""}`.trim() || "Meeting";
  const uri = w.isGroup ? w.picture : w?.profile?.avatar;
  const place = m.online ? m.platform || "Online" : m.location?.address || "Location";
  const initials = w.isGroup
    ? (w.name?.[0] || "?").toUpperCase()
    : `${w.firstName?.[0] || ""}${w.lastName?.[0] || ""}`.toUpperCase() || "?";

  const openChat = () => {
    if (w.isGroup) {
      navigation.navigate("InboxScreen", {
        conversationId: row.conversationId,
        isGroup: true,
        groupType: row.conversationType,
        recipientName: w.name,
        groupPicture: w.picture,
        memberCount: w.memberCount,
      });
    } else if (w._id) {
      navigation.navigate("InboxScreen", {
        recipientId: w._id,
        recipientName: name,
        otherUser: w,
      });
    }
  };

  // "Add to my calendar": phone calendar with the event prefilled (Google
  // Calendar template — opens the app if installed, else the browser).
  const addToCalendar = () => {
    const start = when.clone();
    const end = start.clone().add(1, "hour");
    const fmt = (d) => d.clone().utc().format("YYYYMMDDTHHmmss[Z]");
    const details = [m.note, m.online ? m.link : null].filter(Boolean).join("\n");
    const url =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(m.title || `Meeting with ${name}`)}` +
      `&dates=${fmt(start)}/${fmt(end)}` +
      `&details=${encodeURIComponent(details)}` +
      `&location=${encodeURIComponent(place)}`;
    Linking.openURL(url).catch(() => ToastMessage("Could not open your calendar", "error"));
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={openChat} style={[styles.row, row?.isPast && { opacity: 0.48 }]}>
      {uri ? (
        <FastImage source={{ uri }} style={styles.picture} />
      ) : (
        <View style={[styles.picture, styles.center, { backgroundColor: w?.profile?.profileColor || tint(0.08) }]}>
          <CustomText label={initials} fontSize={15} fontFamily={fonts.semiBold} color="#121212" />
        </View>
      )}
      <View style={styles.texts}>
        <CustomText label={name} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={colors.text} numberOfLines={1} />
        <View style={styles.meta}>
          <CustomText label={when.format("h:mm A")} fontSize={14} fontFamily={fonts.semiBold} letterSpacing={-0.5} color={colors.text} marginTop={1.4} />
          <View style={[styles.dot, { backgroundColor: tint(0.16) }]} />
          <View style={styles.placeRow}>
            <Icons family="MaterialSymbolsRoundedFilled" name="pin_drop" size={12} color="#828186" />
            <CustomText label={place} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.5} color={tint(0.48)} numberOfLines={1} containerStyle={styles.shrink} marginTop={1.4} />
          </View>
        </View>
      </View>
      <TouchableOpacity activeOpacity={0.7} onPress={addToCalendar} hitSlop={8}>
        <Icons family="MaterialSymbolsRoundedFilled" name="notification_add" size={24} color={colors.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default MeetingRow;

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  picture: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 100,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 1,
  },
  shrink: { flexShrink: 1 },
});
