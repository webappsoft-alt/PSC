import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../assets/fonts";
import Blur from "../../../components/Blur";
import CustomSwitch from "../../../components/CustomSwitch";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { del, get, post } from "../../../services/ApiRequest";
import {
  getConversationSettings,
  updateConversationSettings,
} from "../../../services/ChatService";
import { ToastMessage } from "../../../utils/ToastMessage";

/**
 * Figma Chat page "Conversation-settings" (2212:5486), opened from the chat
 * header's tune button. 375 wide, pad 0/12/64/12, gradient #141416 → #000.
 * Header (status bar + 32): title 32 · gap 8 · tune 16 + "Manage your match"
 * Medium 14 #828186; close 56 circle white 4%.
 * Sections 40 apart: title Medium 14 @48% (+ count white) · 16 · content.
 * Rows 16 apart with 1px white 8% dividers: icon 24 #A19375 · gap 8 ·
 * Medium 16 #F8F9FB (+ 12 auto_awesome + Medium 14 #828186 note) · gold switch
 * or chevron 32. Footer Regular 12 @48% with "PSC" Medium white, centred.
 */
const GOLD = "#A19375";
const NOTE = "#828186";

// Figma trims text to cap height; RN 1.4 line boxes add space above/below the
// glyphs. Offsets below are measured (Figma raster vs simulator, 3x):
//  Medium 14 title: cap → box bottom 14.67  → 16 gap becomes 26 − 14.67
const TITLE_TO_CONTENT = 26 - 14.67; // 11.33
const Section = ({ title, count, children, gap = TITLE_TO_CONTENT }) => {
  const { isDark } = useTheme();
  return (
    <View style={{ gap }}>
      <View style={styles.sectionTitle}>
        <CustomText
          label={title}
          fontSize={14}
          fontFamily={fonts.medium}
          color={isDark ? "rgba(255, 255, 255, 0.48)" : "rgba(18, 18, 18, 0.48)"}
        />
        {count !== undefined && (
          <CustomText label={String(count)} fontSize={14} fontFamily={fonts.medium} />
        )}
      </View>
      {children}
    </View>
  );
};

const Divider = () => {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(18, 18, 18, 0.08)" },
      ]}
    />
  );
};

/** One settings row: switch (value/onChange) or chevron (onPress). */
// label Medium 16 cap → note Medium 14 cap: Figma 20, RN 21.7 → −1.7
// label → desc Regular 10 cap: Figma 19, RN 20.3 → −1.3
const NOTE_PULL = -1.7;
const DESC_PULL = -1.3;
const Row = ({ icon, iconColor = GOLD, label, note, desc, value, onChange, onPress, disabled, dim }) => {
  const { colors, isDark } = useTheme();
  const chevronColor = isDark ? "rgba(255, 255, 255, 0.48)" : "rgba(18, 18, 18, 0.48)";
  const content = (
    <View style={[styles.row, dim && { opacity: 0.48 }]}>
      <View style={styles.rowLeft}>
        <Icons family="MaterialSymbolsRoundedFilled" name={icon} size={24} color={iconColor} />
        <View style={[styles.rowText, note ? styles.rowTextNote : desc ? styles.rowTextDesc : null]}>
          <CustomText label={label} fontSize={16} fontFamily={fonts.medium} color={isDark ? "#F8F9FB" : colors.text} />
          {!!note && (
            <View style={styles.noteRow}>
              <Icons family="MaterialSymbolsRoundedFilled" name="auto_awesome" size={12} color={GOLD} />
              <CustomText label={note} fontSize={14} fontFamily={fonts.medium} color={NOTE} />
            </View>
          )}
          {!!desc && <CustomText label={desc} fontSize={10} color={NOTE} marginTop={DESC_PULL} />}
        </View>
      </View>
      {onChange ? (
        // Figma toggle row is 28; the native switch box is 31 — let it overflow
        <View style={styles.switchSlot}>
          <CustomSwitch value={value} setValue={onChange} bgColor={GOLD} disabled={disabled} />
        </View>
      ) : (
        <Icons family="MaterialSymbolsRounded" name="chevron_right" size={32} color={chevronColor} />
      )}
    </View>
  );
  return onChange ? (
    content
  ) : (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={disabled}>
      {content}
    </TouchableOpacity>
  );
};

const ConversationSettings = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, themeMode, toggleTheme } = useTheme();
  const otherUser = route?.params?.otherUser || null;
  const otherUserId = route?.params?.recipientId || otherUser?._id;

  const [data, setData] = useState(null); // null → no chat yet
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!otherUserId) return;
    (async () => {
      try {
        const [res, status] = await Promise.all([
          getConversationSettings(otherUserId),
          get(`relationships/status/${otherUserId}`),
        ]);
        if (res?.data?.success) setData(res.data.data);
        const st = status?.data?.data || status?.data;
        setBlocked(!!st?.isBlocked);
      } catch (e) {
        console.log("Conversation settings load failed:", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, [otherUserId]);

  // optimistic update; roll back if the server refuses
  const save = async (patchBody, optimistic) => {
    if (!data) {
      ToastMessage("Send a message first to change chat settings", "error");
      return;
    }
    const before = data;
    setData((d) => optimistic(d));
    try {
      const res = await updateConversationSettings(otherUserId, patchBody);
      if (res?.data?.success && res.data.data) setData(res.data.data);
      else throw new Error("failed");
    } catch (e) {
      setData(before);
      ToastMessage("Could not update this setting", "error");
    }
  };

  const setFlag = (key, value) =>
    save({ [key]: value }, (d) => ({
      ...d,
      [key === "favorite" ? "isFavorite" : "isBusiness"]: value,
    }));

  const setSetting = (key, value) =>
    save({ settings: { [key]: value } }, (d) => ({
      ...d,
      settings: { ...(d?.settings || {}), [key]: value },
    }));

  const s = data?.settings || {};
  const media = data?.sharedMedia || {};
  const name = otherUser?.firstName || "this user";
  const interests = Array.isArray(otherUser?.niche) ? otherUser.niche : [];

  const block = () =>
    Alert.alert(`Block ${name}?`, "They will not be able to match with you or send you messages.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            await post(`relationships/block/${otherUserId}`);
            setBlocked(true);
            ToastMessage(`${name} is blocked`);
          } catch (e) {
            ToastMessage("Could not block this user", "error");
          }
        },
      },
    ]);

  // A match = you liked (followed) each other; removing it unfollows them.
  const removeMatch = () =>
    Alert.alert(`Remove match with ${name}?`, "You will still be able to match and send messages.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await del(`relationships/unfollow/${otherUserId}`);
            ToastMessage("Match removed");
          } catch (e) {
            ToastMessage("Could not remove this match", "error");
          }
        },
      },
    ]);

  const tile = (icon) => (
    <View key={icon} style={styles.tile}>
      <Blur blurType={isDark ? "dark" : "xlight"} blurAmount={32} borderRadius={8} />
      <View style={[StyleSheet.absoluteFill, styles.tileTint, !isDark && { backgroundColor: "rgba(18, 18, 18, 0.08)" }]} />
      <Icons family="MaterialSymbolsRoundedFilled" name={icon} size={24} color={colors.text} />
    </View>
  );

  const content = (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 32 }]}
    >
      {/* ───────── Header ───────── */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <CustomText
            label="Settings"
            fontSize={32}
            fontFamily={fonts.semiBold}
            letterSpacing={-0.96}
            color={colors.text}
          />
          <View style={styles.subtitle}>
            <Icons family="MaterialSymbolsRounded" name="tune" size={16} color={NOTE} />
            <CustomText label="Manage your match" fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.42} color={NOTE} />
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.close, { backgroundColor: colors.surfaceAlt }]}>
          <Blur blurType={isDark ? "dark" : "xlight"} borderRadius={100} />
          <Icons family="MaterialSymbolsRounded" name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.sections}>
        {interests.length > 0 && (
          <Section title="INTERESTS" count={interests.length}>
            <View style={styles.chips}>
              {interests.map((t) => (
                <View key={t} style={[styles.chip, { backgroundColor: isDark ? "#313131" : colors.surfaceAlt }]}>
                  <CustomText label={t} fontSize={14} fontFamily={fonts.medium} color={colors.text} />
                </View>
              ))}
            </View>
          </Section>
        )}

        <Section title="SHARED MEDIA" count={loaded ? media.total || 0 : ""}>
          <View style={styles.tiles}>
            {["image", "movie", "music_note", "link"].map(tile)}
          </View>
        </Section>

        <Section title="COMMUNICATION">
          <View style={styles.rows}>
            <Row icon="star" label="Mark as favorite" value={!!data?.isFavorite} onChange={(v) => setFlag("favorite", v)} />
            <Divider />
            <Row icon="star" label="Mark as business" value={!!data?.isBusiness} onChange={(v) => setFlag("business", v)} />
            <Divider />
            <Row
              icon="chat_bubble"
              iconColor={isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(18, 18, 18, 0.16)"}
              label="Scheduled messages"
              onPress={() => ToastMessage("Scheduled messages are coming soon")}
            />
            <Divider />
            {/* Figma shows this one unavailable (48%) */}
            <Row icon="star" label="Voice messages" value={!!s.voiceMessages} onChange={() => {}} disabled dim />
          </View>
        </Section>

        <Section title="PRIVACY & SECURITY">
          <View style={styles.rows}>
            <Row icon="notifications_off" label="Block sharing links" value={!!s.blockLinks} onChange={(v) => setSetting("blockLinks", v)} />
            <Divider />
            <Row icon="notifications_off" label="Block sharing media" value={!!s.blockMedia} onChange={(v) => setSetting("blockMedia", v)} />
            <Divider />
            <Row icon="notifications_off" label="Block copying" value={!!s.blockCopying} onChange={(v) => setSetting("blockCopying", v)} />
            <Divider />
            <Row icon="notifications_off" label="Block screenshots" value={!!s.blockScreenshots} onChange={(v) => setSetting("blockScreenshots", v)} />
            <Divider />
            <Row icon="visibility_off" label="Disappearing messages" note="Disappears after being read" value={!!s.disappearing} onChange={(v) => setSetting("disappearing", v)} />
            <Divider />
            <Row icon="visibility_off" label="Hide last seen" note="Only with Silver" value={!!s.hideLastSeen} onChange={(v) => setSetting("hideLastSeen", v)} />
            <Divider />
            <Row icon="visibility_off" label="Hide read status" note="Only with Silver" value={!!s.hideReadStatus} onChange={(v) => setSetting("hideReadStatus", v)} />
            <Divider />
            <Row icon="star" label="Secure with PIN code" value={!!s.pinLock} onChange={(v) => setSetting("pinLock", v)} />
          </View>
        </Section>

        <Section title="APPEARANCE">
          <View style={styles.rows}>
            <Row icon="notifications_off" label="Dark Mode" value={themeMode === "dark"} onChange={() => toggleTheme()} />
            <Divider />
            <Row icon="brush" label="Theme" note="Only with Silver" onPress={() => navigation.navigate("Display")} />
          </View>
        </Section>

        {/* Figma: 24 (not 16) under this title → 34 from the title cap */}
        <Section title="ACCOUNT ACTIONS" gap={34 - 14.67}>
          <View style={styles.rows}>
            <Row icon="chat_bubble" label="Remove match" desc="Will still be able to match and send messages" onPress={removeMatch} />
            <Divider />
            <Row
              icon="star"
              label="Block this user"
              desc="Will not be able to match or send messages"
              value={blocked}
              disabled={blocked}
              onChange={(v) => v && block()}
            />
            <Divider />
            <Row
              icon="chat_bubble"
              label="Report this user"
              desc="Will be reported not able to match nor send messages"
              onPress={() => navigation.navigate("ReportChat", { user: otherUser })}
            />
          </View>
        </Section>
      </View>

      <CustomText textAlign="center" fontSize={12} letterSpacing={-0.12} color={isDark ? "rgba(255, 255, 255, 0.48)" : "rgba(18, 18, 18, 0.48)"}>
        {"We are constantly working on improving "}
        <Text style={{ fontFamily: fonts.medium, color: colors.text }}>PSC</Text>
        {"’s experience for all of our users."}
      </CustomText>
    </ScrollView>
  );

  return isDark ? (
    <LinearGradient colors={["#141416", "#000000"]} style={styles.screen}>
      {content}
    </LinearGradient>
  ) : (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>{content}</View>
  );
};

export default ConversationSettings;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 64,
    gap: 32,
  },
  // Figma header 56: close 56 at the top, title cap 4.7 below the top,
  // 6.3pt between the title glyphs and "Manage your match"
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    // first section title cap must sit 88 below the header top (Figma):
    // header 59.7 + 32 + cap 4.93 = 96.6 → pull up 8.6
    marginBottom: -8.6,
  },
  headerText: {
    flex: 1,
    marginTop: -4, // SemiBold 32 cap sits 8.7 into its box, Figma 4.7
  },
  // Figma gap 8; the RN title box already adds 8.7 below the glyphs → −0.7
  subtitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -0.7,
  },
  close: {
    width: 56,
    height: 56,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Figma 40 from the previous block to the next title's cap (cap 4.93 in RN)
  sections: {
    gap: 40 - 4.93,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    height: 30,
    borderRadius: 16,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  tiles: {
    flexDirection: "row",
    gap: 8,
  },
  tile: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  tileTint: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  rows: {
    gap: 16,
  },
  divider: {
    height: 1,
    borderRadius: 100,
  },
  row: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowText: {
    flex: 1,
  },
  // two-line rows: Figma 31 (note) / 26 (desc) tall; RN boxes are 40.3 / 35.1
  rowTextNote: {
    marginVertical: -4.65,
  },
  rowTextDesc: {
    marginVertical: -4.55,
  },
  switchSlot: {
    height: 28,
    justifyContent: "center",
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: NOTE_PULL,
  },
});
