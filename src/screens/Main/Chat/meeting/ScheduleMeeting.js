import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import Blur from "../../../../components/Blur";
import CustomButton from "../../../../components/CustomButton";
import CustomSwitch from "../../../../components/CustomSwitch";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import { FloatingBlurHeader } from "../../../../components/HeaderProgressiveBlur";
import Icons from "../../../../components/Icons";
import { useSocket } from "../../../../components/SocketProvider";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";

/**
 * Figma Chat page "Schedule-meeting-step-2" (2212:5753) → "step-3"
 * (2212:5942 in person · 2307:7913 online) → "Select-Platform" (2307:8067).
 * Opened from the chat footer's calendar action; the result is sent into the
 * chat as a `meeting` message (card with Accept / decline).
 *
 * Header (pad 72/16/12/16, gap 12, blur): back 40 (white 8%) · "Schedule A
 * Meeting" SemiBold 24 −0.5; progress 3 × 4pt bars (white / white 8%), gap 4.
 * Step 2: quick chips 28 (pad 10, white 6% / selected white, Medium 14, gap
 * 6); months "December 2024" Medium 16 −0.5 + 7-column grid of 40 circles
 * (white 4%, picked #A19375 with #000 text), gap 8.
 * Step 3: "Meeting Details" SemiBold 16; "Online meeting" row 28 + toggle;
 * 1px 4% line; fields 56 r12 white 4% (label Medium 12 @64%, value Medium 16
 * with 16 icon, gold 16% 32 circle button); info lines Regular 12 @48%;
 * WHICH DATE? · When? side by side (189 / 154); SHARE A NOTE 160 + "0/200".
 * Footer (gradient, pad 12/12/34/12): back 48 (white 8%) + Confirm / Share
 * gold 48 Medium 18; info "By pressing “Continue” you agree with PSC …".
 */
const GOLD = "#A19375";
const NOTE_MAX = 200;
const PLATFORMS = ["Zoom", "Google Meet"];
const PLATFORM_LOGOS = {
  Zoom: require("../../../../assets/images/platforms/zoom.png"),
  "Google Meet": require("../../../../assets/images/platforms/googlemeet.png"),
};

const weekend = (base, weeksAhead) => {
  const d = moment(base).add(weeksAhead, "weeks");
  const sat = d.clone().day(6);
  return sat.isBefore(moment(base), "day") ? sat.add(1, "week") : sat;
};

const ScheduleMeeting = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { socket } = useSocket();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  // chat target: 1 on 1 (participant_id) or Group / Circle (conversation_id)
  const target = route?.params?.target || {};
  const recipientName = route?.params?.recipientName || "";

  const [step, setStep] = useState(2); // Figma numbering: 2 = date, 3 = details
  // floating header height (status bar included), content starts below it
  const [headerH, setHeaderH] = useState(null);
  const today = moment().startOf("day");
  const [date, setDate] = useState(today.clone());
  const [quick, setQuick] = useState("today");
  const [time, setTime] = useState(moment().add(1, "hour").startOf("hour").toDate());
  const [timeOpen, setTimeOpen] = useState(false);
  const [online, setOnline] = useState(false);
  const [platform, setPlatform] = useState("");
  const [platformOpen, setPlatformOpen] = useState(false);
  const [link, setLink] = useState("");
  const [location, setLocation] = useState(null); // { address, latitude, longitude }
  // Select-Location / Select-Pickup-On-Map hand the pick back as a param
  const pickedLocation = route?.params?.pickedLocation;
  useEffect(() => {
    if (pickedLocation?.address) setLocation(pickedLocation);
  }, [pickedLocation]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const quickChips = [
    { key: "today", label: "Today", date: today.clone() },
    { key: "tomorrow", label: "Tomorrow", date: today.clone().add(1, "day") },
    { key: "weekend", label: "This weekend", date: weekend(today, 0) },
    { key: "nextWeekend", label: "Next weekend", date: weekend(today, 1) },
    { key: "month", label: "This month", date: today.clone().endOf("month").startOf("day") },
    { key: "nextMonth", label: today.clone().add(1, "month").format("MMMM"), date: today.clone().add(1, "month").startOf("month") },
  ];

  // Figma: two months of 7-column grids starting on the 1st (no weekday row)
  const months = useMemo(() => {
    const out = [];
    for (let m = 0; m < 2; m++) {
      const first = today.clone().add(m, "month").startOf("month");
      const days = [];
      for (let d = 0; d < first.daysInMonth(); d++) days.push(first.clone().add(d, "day"));
      // pad the last row with the first days of the next month (Figma shows them)
      while (days.length % 7) days.push(days[days.length - 1].clone().add(1, "day"));
      out.push({ label: first.format("MMMM YYYY"), days, month: first.month() });
    }
    return out;
  }, []);

  const pickDate = (d, key = null) => {
    if (d.isBefore(today, "day")) return;
    setDate(d.clone());
    setQuick(key);
  };

  const startsAt = useMemo(() => {
    const t = moment(time);
    return date.clone().hour(t.hour()).minute(t.minute()).second(0);
  }, [date, time]);

  const canShare = online ? !!link.trim() : !!location?.address;

  const share = () => {
    if (!socket || sending) return;
    if (!canShare) {
      ToastMessage(online ? "Paste the meeting link" : "Choose where you will meet", "error");
      return;
    }
    if (startsAt.isBefore(moment())) {
      ToastMessage("Pick a time in the future", "error");
      return;
    }
    setSending(true);
    socket.emit(
      "send:message",
      {
        ...target,
        type: "meeting",
        content: "Meeting",
        meeting: {
          title: online ? `${platform || "Online"} meeting` : "Meeting",
          startsAt: startsAt.toISOString(),
          online,
          platform: online ? platform || undefined : undefined,
          link: online ? link.trim() : undefined,
          location: online
            ? undefined
            : { address: location.address, lat: location.latitude ?? undefined, lng: location.longitude ?? undefined },
          note: note.trim(),
        },
      },
      (response) => {
        setSending(false);
        if (response?.success) {
          ToastMessage("Meeting shared");
          navigation.goBack();
        } else {
          ToastMessage(response?.error || "Could not share the meeting", "error");
        }
      },
    );
  };

  /* ───────────────────────── pieces ───────────────────────── */

  const Field = ({ label, value, icon, onPress, style, placeholder }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.field, { backgroundColor: tint(0.04) }, style]}>
      <View style={styles.fieldText}>
        <CustomText label={label} fontSize={12} fontFamily={fonts.medium} color={tint(0.64)} textTransform="uppercase" />
        <View style={styles.fieldValue}>
          {!!icon && <Icons family="MaterialSymbolsRoundedFilled" name={icon} size={16} color={value ? colors.text : tint(0.48)} />}
          <CustomText
            label={value || placeholder || ""}
            fontSize={16}
            fontFamily={fonts.medium}
            color={value ? colors.text : tint(0.48)}
            numberOfLines={1}
            containerStyle={styles.shrink}
          />
        </View>
      </View>
      <View style={styles.fieldBtn}>
        <Icons family="MaterialSymbolsRoundedFilled" name={icon || "edit"} size={16} color={GOLD} />
      </View>
    </TouchableOpacity>
  );

  const Info = ({ label }) => (
    <View style={styles.info}>
      <Icons family="MaterialSymbolsRounded" name="info" size={12} color={tint(0.48)} />
      <CustomText label={label} fontSize={12} letterSpacing={-0.36} color={tint(0.48)} containerStyle={styles.shrink} />
    </View>
  );

  const renderDate = () => (
    <View style={styles.dateStep}>
      <View style={styles.chips}>
        {quickChips.map((c) => {
          const on = quick === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              activeOpacity={0.7}
              onPress={() => pickDate(c.date, c.key)}
              style={[styles.chip, { backgroundColor: on ? (isDark ? "#FFFFFF" : "#121212") : tint(0.06) }]}
            >
              <CustomText label={c.label} fontSize={14} fontFamily={fonts.medium} color={on ? (isDark ? "#121212" : "#FFFFFF") : tint(0.64)} />
            </TouchableOpacity>
          );
        })}
      </View>
      {months.map((m) => (
        <View key={m.label} style={styles.month}>
          <CustomText label={m.label} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={colors.text} />
          <View style={styles.grid}>
            {m.days.map((d, i) => {
              const picked = d.isSame(date, "day");
              const past = d.isBefore(today, "day");
              const overflow = d.month() !== m.month;
              return (
                <TouchableOpacity
                  key={`${m.label}-${i}`}
                  activeOpacity={0.7}
                  disabled={past || overflow}
                  onPress={() => pickDate(d)}
                  style={[
                    styles.day,
                    { backgroundColor: picked ? GOLD : tint(0.04), opacity: past || overflow ? 0.32 : 1 },
                  ]}
                >
                  <CustomText label={String(d.date())} fontSize={14} fontFamily={fonts.medium} color={picked ? "#000000" : colors.text} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );

  const renderDetails = () => (
    <View style={styles.detailsStep}>
      <CustomText label="Meeting Details" fontSize={16} fontFamily={fonts.semiBold} letterSpacing={-0.5} color={colors.text} />
      <View style={styles.toggleRow}>
        <CustomText label="Online meeting" fontSize={16} fontFamily={fonts.medium} color={isDark ? "#F8F9FB" : colors.text} />
        <CustomSwitch value={online} setValue={setOnline} bgColor={GOLD} />
      </View>
      <View style={[styles.line, { backgroundColor: tint(0.04) }]} />

      {online ? (
        <>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setPlatformOpen(true)} style={[styles.field, { backgroundColor: tint(0.04) }]}>
            <View style={styles.fieldText}>
              <CustomText label="PLATFORM" fontSize={12} fontFamily={fonts.medium} color={tint(0.64)} />
              {/* Figma: logo 11 r8 · 8 · name */}
              <View style={styles.platformValue}>
                {!!platform && <Image source={PLATFORM_LOGOS[platform]} style={styles.platformValueLogo} />}
                <CustomText label={platform || "Select a platform"} fontSize={16} fontFamily={fonts.medium} color={platform ? colors.text : tint(0.48)} />
              </View>
            </View>
            <Icons family="MaterialSymbolsRounded" name="chevron_right" size={24} color={tint(0.64)} />
          </TouchableOpacity>
          <View style={styles.block}>
            <View style={[styles.field, { backgroundColor: tint(0.04) }]}>
              <View style={styles.fieldText}>
                <CustomText label="COPY AND PASTE THE LINK" fontSize={12} fontFamily={fonts.medium} color={tint(0.64)} />
                <TextInput
                  value={link}
                  onChangeText={setLink}
                  placeholder="https://meet.google.com/..."
                  placeholderTextColor={tint(0.48)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>
            <Info label="You need to create the meeting prior." />
          </View>
        </>
      ) : (
        <View style={styles.block}>
          <Field
            label="Where Will You Meet?"
            value={location?.address}
            placeholder="Choose a location"
            icon="location_on"
            onPress={() => navigation.navigate("SelectLocation", { returnTo: "ScheduleMeeting" })}
          />
          <Info label="You can change the location by clicking on the input." />
        </View>
      )}

      <View style={styles.dateTimeRow}>
        <Field label="WHICH DATE?" value={date.format("MMM D, YYYY")} icon="calendar_month" onPress={() => setStep(2)} style={{ flex: 189 }} />
        <Field label="When?" value={moment(time).format("h:mm A")} icon="schedule" onPress={() => setTimeOpen(true)} style={{ flex: 154 }} />
      </View>
      <View style={[styles.line, { backgroundColor: tint(0.04) }]} />

      <View style={styles.block}>
        <View style={[styles.field, styles.noteField, { backgroundColor: tint(0.04) }]}>
          <View style={styles.fieldText}>
            <CustomText label="SHARE A NOTE" fontSize={12} fontFamily={fonts.medium} color={tint(0.64)} />
            <TextInput
              value={note}
              onChangeText={(t) => setNote(t.slice(0, NOTE_MAX))}
              placeholder="I will bring my guitar at the meeting!"
              placeholderTextColor={tint(0.48)}
              multiline
              textAlignVertical="top"
              maxLength={NOTE_MAX}
              style={[styles.input, styles.noteInput, { color: colors.text }]}
            />
          </View>
        </View>
        <Info label={`${note.length}/${NOTE_MAX} characters.`} />
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ───────── header (floats; content scrolls under the progressive blur) ───────── */}
      <FloatingBlurHeader onHeightChange={setHeaderH} includeStatusBar={false}>
      <View style={[styles.header, { paddingTop: insets.top + 28 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => (step === 3 ? setStep(2) : navigation.goBack())}
            style={[styles.back, { backgroundColor: tint(0.08) }]}
          >
            <Blur blurType={isDark ? "dark" : "xlight"} borderRadius={100} />
            <Icons family="MaterialSymbolsRounded" name="chevron_left" size={20} color={tint(0.64)} />
          </TouchableOpacity>
          <CustomText label="Schedule A Meeting" fontSize={24} fontFamily={fonts.semiBold} letterSpacing={-0.5} color={colors.text} containerStyle={styles.shrink} />
        </View>
        <View style={styles.progress}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={[styles.bar, { backgroundColor: n <= step ? colors.text : tint(0.08) }]} />
          ))}
        </View>
      </View>
      </FloatingBlurHeader>

      <ScrollView
        style={{ opacity: headerH == null ? 0 : 1 }}
        contentContainerStyle={[styles.content, { paddingTop: 12 + (headerH || 0), paddingBottom: 134 + insets.bottom }]}
        scrollIndicatorInsets={{ top: headerH || 0 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 2 ? renderDate() : renderDetails()}
      </ScrollView>

      {/* ───────── footer ───────── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 34) }]}>
        <LinearGradient pointerEvents="none" colors={[`${colors.background}00`, colors.background]} style={StyleSheet.absoluteFill} />
        <View style={styles.buttons}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => (step === 3 ? setStep(2) : navigation.goBack())}
            style={styles.footerBack}
          >
            {/* Figma: white 8% on a 27 background blur */}
            <Blur blurType={isDark ? "dark" : "xlight"} blurAmount={27} borderRadius={100} />
            <View style={[StyleSheet.absoluteFill, { borderRadius: 100, backgroundColor: tint(0.08) }]} />
            <Icons family="MaterialSymbolsRounded" name="chevron_left" size={27} color={tint(0.64)} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <CustomButton
              title={step === 2 ? "Confirm" : "Share"}
              height={48}
              fontSize={18}
              loading={sending}
              disabled={sending || (step === 3 && !canShare)}
              onPress={step === 2 ? () => setStep(3) : share}
            />
          </View>
        </View>
        <View style={[styles.info, styles.infoCenter]}>
          <Icons family="MaterialSymbolsRounded" name="info" size={12} color={tint(0.48)} />
          <CustomText fontSize={12} letterSpacing={-0.36} color={tint(0.48)}>
            {"By pressing “Continue” you agree with "}
            <Text style={{ fontFamily: fonts.medium, color: colors.text }}>PSC</Text>
            {" TOS."}
          </CustomText>
        </View>
      </View>

      {/* ───────── pickers ───────── */}
      <DatePicker
        modal
        open={timeOpen}
        date={time}
        mode="time"
        theme={isDark ? "dark" : "light"}
        buttonColor={COLORS.buttonColor}
        confirmButtonColor={COLORS.buttonColor}
        onConfirm={(d) => {
          setTime(d);
          setTimeOpen(false);
        }}
        onCancel={() => setTimeOpen(false)}
      />
      {/* Figma Select-Platform (2307:8067): full screen #262626 · header #121212
          pad 52/12/8/12: back 40 white 4% + chevron_left 24 @64% · 16 ·
          "Platform" SemiBold 20 −0.5% · block #121212 1 below: rows 64 (pad
          16): logo 20 · 8 · Medium 16 −0.5 · radio 24 (gold / @48%), 1px 4%. */}
      <Modal visible={platformOpen} animationType="slide" onRequestClose={() => setPlatformOpen(false)}>
        <View style={[styles.screen, { backgroundColor: isDark ? "#262626" : colors.surfaceAlt }]}>
          <View style={[styles.platformHeader, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setPlatformOpen(false)} style={[styles.platformBack, { backgroundColor: tint(0.04) }]}>
              <Icons family="MaterialSymbolsRounded" name="chevron_left" size={24} color={tint(0.64)} />
            </TouchableOpacity>
            <CustomText label="Platform" fontSize={20} fontFamily={fonts.semiBold} letterSpacing={-0.1} color={colors.text} />
          </View>
          <View style={{ marginTop: 1, backgroundColor: colors.background }}>
            {PLATFORMS.map((p, i) => {
              const on = platform === p;
              return (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.7}
                  onPress={() => {
                    setPlatform(p);
                    setPlatformOpen(false);
                  }}
                  style={[styles.platformRow, i > 0 && { borderTopWidth: 1, borderTopColor: tint(0.04) }]}
                >
                  <Image source={PLATFORM_LOGOS[p]} style={styles.platformLogo} />
                  <CustomText label={p} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={colors.text} containerStyle={{ flex: 1 }} />
                  <Icons
                    family="MaterialSymbolsRounded"
                    name={on ? "radio_button_checked" : "radio_button_unchecked"}
                    size={24}
                    color={on ? GOLD : tint(0.48)}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ScheduleMeeting;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  progress: {
    flexDirection: "row",
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 1,
  },
  shrink: { flexShrink: 1 },
  content: {
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  // step 2
  dateStep: { gap: 32 },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    height: 28,
    borderRadius: 100,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  month: { gap: 16 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  // step 3
  detailsStep: { gap: 16 },
  toggleRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  line: { height: 1 },
  block: { gap: 8 },
  field: {
    minHeight: 56,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fieldText: {
    flex: 1,
    gap: 4,
  },
  fieldValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fieldBtn: {
    width: 32,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(161, 147, 117, 0.16)",
  },
  input: {
    fontSize: 16,
    fontFamily: fonts.medium,
    paddingVertical: 0,
  },
  noteField: {
    height: 160,
    alignItems: "flex-start",
  },
  noteInput: {
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 8,
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoCenter: {
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerBack: {
    width: 48,
    height: 48,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  platformHeader: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  platformBack: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  platformValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  platformValueLogo: {
    width: 11,
    height: 11,
    borderRadius: 8,
  },
  platformLogo: {
    width: 20,
    height: 20,
  },
  platformRow: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // logo · 8 · name (· 12 · radio: the name flexes)
  },
});
