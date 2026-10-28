import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../assets/fonts";
import Blur from "../../../components/Blur";
import { FloatingBlurHeader } from "../../../components/HeaderProgressiveBlur";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import FloatingSheet from "../../../components/FloatingSheet";
import Icons from "../../../components/Icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { post } from "../../../services/ApiRequest";
import { ToastMessage } from "../../../utils/ToastMessage";
import { InfoLine, InputField, SelectField } from "../TvShow/molecules/ShowForm";

/**
 * Figma Chat page "Submit-a-report" (2212:6145, 375×812), from Conversation
 * settings › "Report this user".
 * Header pad 52/16/8/16 (#121212 + blur): back 40 white 8% + chevron 20 @64%
 * · 12 · "Submit Report" SemiBold 24 −0.5%.
 * Content pad 12, blocks 16 apart: "Author" Medium 16 · 16 · card 64 (white
 * 4% r12, pad 12, gap 12: picture 40 r8 · name Medium 16 · 4 · job Regular 14
 * −0.5 @48%) · 1px white 4% · "Select A REASON" field 56 + chevron · 6 · info
 * · "SHARE A NOTE" field 160 · 6 · "n/500 characters." · 6 · "Please motivate
 * …" · 1px · "Are you human?" Medium 16 · 16 · check 253×64.
 * Footer (gradient, pad 8/12/34/12): back 48 white 8% + "Submit Report" gold
 * 48 Medium 18 · 10 · "🤝 Thank you for keeping PSC a safe space." Regular 12.
 */
const NOTE_MAX = 500;
export const REPORT_REASONS = [
  { name: "Adult content", info: "Inappropriate images/videos shared." },
  { name: "Harassment or bullying", info: "Insults, threats or unwanted contact." },
  { name: "Spam", info: "Repeated, unwanted or promotional messages." },
  { name: "Scam or fraud", info: "Asking for money, codes or personal data." },
  { name: "Hate speech", info: "Attacks on people for who they are." },
  { name: "Violence", info: "Threats or glorification of violence." },
  { name: "Impersonation", info: "Pretending to be someone else." },
  { name: "Something else", info: "Tell us what happened in the note." },
];

const ReportChat = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const user = route?.params?.user || null;
  const conversationId = route?.params?.conversationId;

  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");
  const [human, setHuman] = useState(false);
  const [picking, setPicking] = useState(false);
  const [sending, setSending] = useState(false);
  // floating header height (status bar included), content starts below it
  const [headerH, setHeaderH] = useState(null);

  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || "User";
  const canSubmit = !!user?._id && !!reason && note.trim().length > 0 && human && !sending;

  const submit = async () => {
    if (!reason) return ToastMessage("Select a reason first", "error");
    if (!note.trim()) return ToastMessage("Please add a note", "error");
    if (!human) return ToastMessage("Please confirm you are human", "error");
    setSending(true);
    try {
      const res = await post(`relationships/report/${user._id}`, {
        reason: reason.name,
        note: note.trim(),
        conversationId,
      });
      if (!res?.data?.success) throw new Error(res?.data?.message || "failed");
      ToastMessage("Thank you, your report was submitted", "success");
      navigation.goBack();
    } catch (e) {
      ToastMessage(e?.message || "Could not submit the report", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ───────── header (floats; content scrolls under the progressive blur) ───────── */}
      <FloatingBlurHeader onHeightChange={setHeaderH} includeStatusBar={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: tint(0.08) }]}>
            <Blur blurType={isDark ? "dark" : "xlight"} borderRadius={100} />
            <Icons family="MaterialSymbolsRounded" name="chevron_left" size={20} color={tint(0.64)} />
          </TouchableOpacity>
          <CustomText label="Submit Report" fontSize={24} fontFamily={fonts.semiBold} letterSpacing={-0.12} color={colors.text} containerStyle={styles.shrink} />
        </View>
      </View>
      </FloatingBlurHeader>

      <View style={styles.screen}>
        <ScrollView
          style={{ opacity: headerH == null ? 0 : 1 }}
          contentContainerStyle={[styles.content, { paddingTop: 12 + (headerH || 0), paddingBottom: 108 + Math.max(insets.bottom, 34) }]}
          scrollIndicatorInsets={{ top: headerH || 0 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustKeyboardInsets
        >
          {/* author */}
          <View style={styles.block}>
            <CustomText label="Author" fontSize={16} fontFamily={fonts.medium} color={colors.text} />
            <View style={[styles.card, { backgroundColor: tint(0.04) }]}>
              {user?.profile?.avatar ? (
                <FastImage source={{ uri: user.profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.center, { backgroundColor: user?.profile?.profileColor || tint(0.08) }]}>
                  <CustomText label={(name[0] || "?").toUpperCase()} fontSize={16} fontFamily={fonts.semiBold} color="#121212" />
                </View>
              )}
              <View style={styles.cardTexts}>
                <CustomText label={user?.username ? `@${user.username}` : name} fontSize={16} fontFamily={fonts.medium} color={colors.text} numberOfLines={1} />
                <CustomText label={user?.occupation?.jobTitle || name} fontSize={14} letterSpacing={-0.5} color={tint(0.48)} numberOfLines={1} marginTop={-1.6} />
              </View>
            </View>
          </View>

          <View style={[styles.line, { backgroundColor: tint(0.04) }]} />

          {/* reason */}
          <View style={styles.field}>
            <SelectField label="Select A REASON" value={reason?.name} placeholder="Adult content" valueSize={16} chevron="expand_more" onPress={() => setPicking(true)} />
            <InfoLine label="Please select the reason that suits better the situation." color="#828282" />
          </View>

          {/* note */}
          <View style={styles.field}>
            <InputField
              label="SHARE A NOTE"
              value={note}
              onChangeText={(t) => setNote(t.slice(0, NOTE_MAX))}
              placeholder="e.g. Here is exactly what happened..."
              valueSize={16}
              height={160}
              multiline
              maxLength={NOTE_MAX}
            />
            <InfoLine label={`${note.length}/${NOTE_MAX} characters.`} color="#828282" />
            <InfoLine label="Please motivate the reason for your report." color="#828282" />
          </View>

          <View style={[styles.line, { backgroundColor: tint(0.04) }]} />

          {/* human check (Figma: 253×64 captcha image) */}
          <View style={styles.block}>
            <CustomText label="Are you human?" fontSize={16} fontFamily={fonts.medium} color={colors.text} />
            <TouchableOpacity activeOpacity={0.7} onPress={() => setHuman((v) => !v)} style={[styles.captcha, { backgroundColor: tint(0.04), borderColor: tint(0.08) }]}>
              <Icons
                family="MaterialSymbolsRounded"
                name={human ? "check_box" : "check_box_outline_blank"}
                size={28}
                color={human ? "#A19375" : tint(0.64)}
              />
              <CustomText label="I’m not a robot" fontSize={14} fontFamily={fonts.medium} color={colors.text} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* ───────── footer ───────── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 34) }]}>
        <LinearGradient pointerEvents="none" colors={[`${colors.background}00`, colors.background]} style={StyleSheet.absoluteFill} />
        <View style={styles.buttons}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.footerBack, { backgroundColor: tint(0.08) }]}>
            <Icons family="MaterialSymbolsRounded" name="chevron_left" size={27} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.shrink}>
            <CustomButton title="Submit Report" height={48} fontSize={18} loading={sending} disabled={!canSubmit} onPress={submit} />
          </View>
        </View>
        <CustomText textAlign="center" fontSize={12} color={tint(0.48)}>
          {"🤝 Thank you for keeping "}
          <Text style={{ fontFamily: fonts.medium, color: colors.text }}>PSC</Text>
          {" a safe space."}
        </CustomText>
      </View>

      {/* reason picker */}
      <FloatingSheet visible={picking} onDismiss={() => setPicking(false)} title="Select A Reason" gap={12} closeIconSize={16} closeIconColor="muted">
        <View>
          {REPORT_REASONS.map((r, i) => {
            const selected = reason?.name === r.name;
            return (
              <TouchableOpacity
                key={r.name}
                activeOpacity={0.7}
                onPress={() => {
                  setReason(r);
                  setPicking(false);
                }}
                style={[styles.reasonRow, i > 0 && { borderTopWidth: 1, borderTopColor: tint(0.16) }]}
              >
                <View style={styles.shrink}>
                  <CustomText label={r.name} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={selected ? colors.text : tint(0.64)} />
                  <CustomText label={r.info} fontSize={14} letterSpacing={-0.5} color={tint(0.48)} numberOfLines={1} marginTop={-1.6} />
                </View>
                <Icons
                  family="MaterialSymbolsRounded"
                  name={selected ? "radio_button_checked" : "radio_button_unchecked"}
                  size={24}
                  color={selected ? "#A19375" : tint(0.48)}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </FloatingSheet>
    </View>
  );
};

export default ReportChat;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  shrink: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    overflow: "hidden",
  },
  headerRow: {
    height: 40,
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
  content: {
    padding: 12,
    gap: 16,
  },
  block: {
    gap: 16,
  },
  card: {
    height: 64,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  cardTexts: {
    flex: 1,
  },
  line: {
    height: 1,
  },
  field: {
    gap: 6,
  },
  captcha: {
    width: 253,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    paddingHorizontal: 12,
    gap: 10,
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
    alignItems: "center",
    justifyContent: "center",
  },
  reasonRow: {
    minHeight: 56,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
