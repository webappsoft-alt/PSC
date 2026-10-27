import { useIsFocused, useNavigation } from "@react-navigation/native";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { FlatList, Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import Icons from "../../../../components/Icons";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { useTheme } from "../../../../contexts/ThemeContext";
import { getMyMeetings } from "../../../../services/ChatService";
import { ToastMessage } from "../../../../utils/ToastMessage";
import ConversationBoxSkeleton from "../molecules/ConversationBoxSkeleton";
import StatusAvatar from "../molecules/StatusAvatar";

/**
 * Inbox calendar icon → all my meetings (client): a list like the
 * conversation rows — photo (no status), display name, the meeting title
 * instead of the message, the date on the right and an "add to my calendar"
 * button where the unread badge would be. Row geometry = Figma Main-Chat
 * rows (72, pad 12/16, gap 12; Medium 16 −0.5 / Medium 14 −0.5 @48%).
 */
const Meetings = () => {
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!isFocus) return;
    const requestId = ++requestIdRef.current;
    (async () => {
      try {
        const res = await getMyMeetings();
        if (requestId !== requestIdRef.current) return;
        setItems(res?.data?.data || []);
      } catch (e) {
        console.log("Error loading meetings:", e);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    })();
  }, [isFocus]);

  // "Add to my calendar": the phone's calendar app with the event prefilled.
  // iOS has no prefill URL for the Calendar app, so it gets a Google Calendar
  // template (opens in the app if installed, else the browser); Android gets
  // the same (every calendar app registers the web intent).
  const addToCalendar = (row) => {
    const m = row.meeting || {};
    const start = moment(m.startsAt);
    const end = start.clone().add(1, "hour");
    const fmt = (d) => d.utc().format("YYYYMMDDTHHmmss[Z]");
    const details = [m.note, m.online ? m.link : null].filter(Boolean).join("\n");
    const location = m.online ? m.platform || "Online" : m.location?.address || "";
    const url =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(m.title || "Meeting")}` +
      `&dates=${fmt(start)}/${fmt(end)}` +
      `&details=${encodeURIComponent(details)}` +
      `&location=${encodeURIComponent(location)}`;
    Linking.openURL(url).catch(() => ToastMessage("Could not open your calendar", "error"));
  };

  const openChat = (row) => {
    if (!row.with) return;
    if (row.with.isGroup) {
      navigation.navigate("InboxScreen", {
        conversationId: row.conversationId,
        isGroup: true,
        groupType: row.conversationType,
        recipientName: row.with.name,
        groupPicture: row.with.picture,
        memberCount: row.with.memberCount,
      });
    } else {
      navigation.navigate("InboxScreen", {
        recipientId: row.with._id,
        recipientName: `${row.with.firstName || ""} ${row.with.lastName || ""}`.trim(),
        otherUser: row.with,
      });
    }
  };

  const renderItem = ({ item: row }) => {
    const m = row.meeting || {};
    const when = moment(m.startsAt);
    const name = row.with?.isGroup
      ? row.with.name
      : `${row.with?.firstName || ""} ${row.with?.lastName || ""}`.trim() || "Meeting";
    const statusColor =
      m.status === "accepted" ? "#64CD75" : m.status === "declined" ? "#EE1045" : tint(0.48);
    const statusText =
      m.status === "accepted" ? "Accepted" : m.status === "declined" ? "Declined" : "Pending";
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => openChat(row)} style={[styles.row, row.isPast && { opacity: 0.48 }]}>
        <StatusAvatar user={row.with?.isGroup ? { firstName: row.with.name, profile: { avatar: row.with.picture } } : row.with} size={48} />
        <View style={styles.texts}>
          <CustomText label={name} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={colors.text} numberOfLines={1} />
          <View style={styles.subRow}>
            <CustomText
              label={m.title || (m.online ? "Online meeting" : "Meeting")}
              fontSize={14}
              fontFamily={fonts.medium}
              letterSpacing={-0.5}
              color={tint(0.48)}
              numberOfLines={1}
              containerStyle={styles.shrink}
              marginTop={1.4}
            />
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <CustomText label={statusText} fontSize={12} fontFamily={fonts.medium} color={statusColor} marginTop={1.4} />
          </View>
        </View>
        <View style={styles.right}>
          <CustomText label={when.format("MMM D")} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.5} color={colors.text} />
          <CustomText label={when.format("h:mm A")} fontSize={12} color={tint(0.48)} />
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => addToCalendar(row)}
          hitSlop={6}
          style={[styles.calendarBtn, { backgroundColor: tint(0.04) }]}
        >
          <Icons family="MaterialSymbolsRounded" name="event" size={20} color={colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const upcoming = items.filter((r) => !r.isPast).length;

  return (
    <ScreenWrapper paddingHorizontal={0.1} headerUnScrollable={() => <Header title="Meetings" />} scrollEnabled>
      <View style={styles.listLabel}>
        <CustomText label="ALL MEETINGS" fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.56} color={tint(0.64)} />
        <CustomText label={loading ? "" : String(upcoming)} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.56} color={colors.text} />
      </View>
      {loading ? (
        [1, 2, 3, 4, 5].map((k) => <ConversationBoxSkeleton key={k} />)
      ) : (
        <FlatList
          data={items}
          scrollEnabled={false}
          keyExtractor={(r) => String(r._id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={[styles.line, { backgroundColor: tint(0.04) }]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: tint(0.04) }]}>
                <Icons family="MaterialSymbolsRoundedFilled" name="calendar_month" size={32} color={tint(0.64)} />
              </View>
              <CustomText label="No meetings yet" fontSize={20} fontFamily={fonts.semiBold} letterSpacing={-0.5} color={colors.text} textAlign="center" marginTop={16} />
              <CustomText label="Schedule one from the calendar button inside any chat." fontSize={14} color={tint(0.64)} textAlign="center" marginTop={4} />
            </View>
          }
        />
      )}
      <View style={{ height: 48 }} />
    </ScreenWrapper>
  );
};

export default Meetings;

const styles = StyleSheet.create({
  listLabel: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 4,
  },
  row: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  texts: { flex: 1 },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shrink: { flexShrink: 1 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 100,
  },
  right: {
    alignItems: "flex-end",
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  line: { height: 1 },
  empty: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
