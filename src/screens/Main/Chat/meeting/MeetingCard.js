import moment from "moment";
import { useState } from "react";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import Blur from "../../../../components/Blur";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { respondToMeeting } from "../../../../services/ChatService";
import { ToastMessage } from "../../../../utils/ToastMessage";

/**
 * Meeting message in a chat — Figma Inbox_General-Default 2212:6468
 * (received, 212 wide + Accept / ✕) and 2212:6628 (sent, 160 wide):
 * card 240 tall r8, 1px #828282 48%, the proposer's photo (FILL) under a
 * gradient #121212 20% → #000 48%, pad 8/8/16/8, space-between;
 * date badge 39×44 r8 #121212 64% + blur 32 ("Jan" Regular 12 / "18"
 * SemiBold 20, #EBEAEC); bottom (gap 10): proposer name Medium 16 white ·
 * [schedule 12 white · 4 · "6:00PM" Regular 12 #EBEAEC] · [place Regular 12
 * lh120 #EBEAEC (2 lines) · calendar_add_on 24 @64% = add to my calendar].
 * Under a received card, gap 8: Accept 104×32 r8 #64CD75 48% (Regular 14) ·
 * ✕ 104×32 r8 #EE1045 48% (close 16). After a reply: the status.
 */
// Poppins in a 1.4em RN line box: the cap starts 0.353em below the box top
const capTop = (fs) => fs * 0.353;
const box = (fs) => fs * 1.4;

const MeetingCard = ({ item, isSender, onStatusChange, withWho }) => {
  const { colors } = useTheme();
  const me = useSelector((st) => st.users?.userData);
  const m = item?.meeting || {};
  // Figma 2212:6628: meta "TRAVIS 3:02 PM" (sender) above, card shows "Anto"
  // = who you are meeting. 1 on 1 → the other person; group → the group.
  // `withWho` = { name, picture, color } from the chat screen.
  const sender =
    typeof item?.senderId === "object" && item?.senderId?.firstName
      ? item.senderId
      : isSender
      ? me
      : null;
  const photo = withWho ? withWho.picture : sender?.profile?.avatar;
  const proposer =
    (withWho ? withWho.name : sender?.firstName) || m.title || "Meeting";
  const fallbackColor =
    (withWho ? withWho.color : sender?.profile?.profileColor) || "#262626";
  const [busy, setBusy] = useState(false);
  // Figma's place is 2 lines whose last line sits on the icon bottom: a
  // 1-line place is bottom-aligned the same way; 2 lines keep cap 200
  const [placeLines, setPlaceLines] = useState(1);
  const when = m.startsAt ? moment(m.startsAt) : null;
  const status = m.status || "pending";
  const place = m.online
    ? m.platform || "Online meeting"
    : m.location?.address || "";

  const respond = async (accept) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await respondToMeeting(item._id, accept);
      if (!res?.data?.success) throw new Error("failed");
      onStatusChange?.(item._id, res.data.data.meeting);
      ToastMessage(accept ? "Meeting accepted" : "Meeting declined");
    } catch (e) {
      ToastMessage("Could not send your answer", "error");
    } finally {
      setBusy(false);
    }
  };

  const addToCalendar = () => {
    if (!when) return;
    const fmt = (d) => d.clone().utc().format("YYYYMMDDTHHmmss[Z]");
    const url =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(m.title || `Meeting with ${proposer}`)}` +
      `&dates=${fmt(when)}/${fmt(when.clone().add(1, "hour"))}` +
      `&details=${encodeURIComponent(
        [m.note, m.online ? m.link : null].filter(Boolean).join("\n"),
      )}` +
      `&location=${encodeURIComponent(place)}`;
    Linking.openURL(url).catch(() =>
      ToastMessage("Could not open your calendar", "error"),
    );
  };

  const open = () => {
    if (m.online && m.link) Linking.openURL(m.link).catch(() => {});
    else if (m.location?.address) {
      const q = encodeURIComponent(m.location.address);
      Linking.openURL(`https://maps.apple.com/?q=${q}`).catch(() => {});
    }
  };

  const statusLabel =
    status === "accepted"
      ? "Accepted"
      : status === "declined"
      ? "Declined"
      : null; // pending: nothing (Figma)
  const statusColor =
    status === "accepted"
      ? "#64CD75"
      : status === "declined"
      ? "#EE1045"
      : "rgba(255, 255, 255, 0.64)";

  return (
    <View style={[styles.wrap, { width: isSender ? 160 : 212 }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={open} style={styles.card}>
        {photo ? (
          <FastImage
            source={{ uri: photo }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: fallbackColor },
            ]}
          />
        )}
        <LinearGradient
          colors={["rgba(18, 18, 18, 0.2)", "rgba(0, 0, 0, 0.48)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.badge}>
          <Blur blurType="dark" blurAmount={32} borderRadius={8} />
          {/* Figma: "Oct" cap 8 from the badge top, "27" cap at 22 */}
          <CustomText
            label={when ? when.format("MMM") : "—"}
            fontSize={12}
            color="#EBEAEC"
            marginTop={8 - capTop(12)}
          />
          <CustomText
            label={when ? when.format("D") : "—"}
            fontSize={20}
            fontFamily={fonts.semiBold}
            color="#EBEAEC"
            marginTop={22 - capTop(20) - (8 - capTop(12) + box(12))}
          />
        </View>
        <View style={styles.bottom}>
          <View>
            <CustomText
              label={proposer}
              fontSize={16}
              fontFamily={fonts.medium}
              color="#FFFFFF"
              numberOfLines={1}
            />
            <View
              style={[
                styles.timeRow,
                {
                  marginTop: 180 - capTop(12) - (157 - capTop(16) + box(16)),
                },
              ]}
            >
              <Icons
                family="MaterialSymbolsRounded"
                name="schedule"
                size={12}
                color="#FFFFFF"
              />
              <CustomText
                label={when ? when.format("h:mmA") : ""}
                fontSize={12}
                color="#EBEAEC"
              />
            </View>
            <CustomText
              label={place}
              fontSize={12}
              color="#EBEAEC"
              numberOfLines={2}
              onTextLayout={(e) =>
                setPlaceLines(Math.min(2, e?.nativeEvent?.lines?.length || 1))
              }
              containerStyle={[
                styles.shrink,
                placeLines > 1
                  ? { marginTop: -capTop(12) }
                  : { marginBottom: 3 - (box(12) - 12 * 1.05) },
              ]}
            />
          </View>
          <TouchableOpacity
            onPress={addToCalendar}
            hitSlop={8}
            style={styles.iconBox}
          >
            <Icons
              size={24}
              name="calendar_add_on"
              family="MaterialSymbolsRounded"
              color="rgba(255, 255, 255, 0.64)"
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {status === "pending" && !isSender ? (
        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={busy}
            onPress={() => respond(true)}
            style={[styles.action, styles.accept]}
          >
            <CustomText label="Accept" fontSize={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={busy}
            onPress={() => respond(false)}
            style={[styles.action, styles.decline]}
          >
            <Icons
              family="MaterialSymbolsRounded"
              name="close"
              size={16}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      ) : statusLabel ? (
        <CustomText
          label={statusLabel}
          fontSize={12}
          fontFamily={fonts.medium}
          color={statusColor}
          textAlign="right"
        />
      ) : null}
    </View>
  );
};

export default MeetingCard;

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  // Figma 240 tall, pad 8/8/16/8 with an inside 1px stroke → RN padding
  // is measured inside the border, so 7 / 15
  card: {
    height: 240,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(130, 130, 130, 0.48)",
    backgroundColor: "#1C1C1C",
    padding: 7,
    paddingBottom: 15,
    justifyContent: "space-between",
  },
  badge: {
    width: 39,
    height: 44,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "rgba(18, 18, 18, 0.64)",
  },
  bottom: {
    marginTop: 200 - (180 - capTop(12) + box(12)),
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  // row = the 24 icon (Figma 196×24), fixed; 2-line text overflows down
  // like Figma's 22-tall text box, so name / time never move
  placeRow: {
    height: 24,
    overflow: "visible",

    gap: 10,
  },
  iconBox: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  shrink: { flexShrink: 1 },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  action: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  accept: { backgroundColor: "rgba(100, 205, 117, 0.48)" },
  decline: { backgroundColor: "rgba(238, 16, 69, 0.48)" },
});
