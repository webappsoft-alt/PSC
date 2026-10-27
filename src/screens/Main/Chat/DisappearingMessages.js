import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../assets/fonts";
import Blur from "../../../components/Blur";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { updateConversationSettings } from "../../../services/ChatService";
import { ToastMessage } from "../../../utils/ToastMessage";

/**
 * Figma Chat page "Disappearing-messages" (2212:7920, 375×812) from
 * Conversation settings › Disappearing messages. Page #262626; header pad
 * 52/16/8/16 (#121212 + blur): back 40 white 8% + chevron 20 @64% · 12 ·
 * "Disappearing Messages" SemiBold 24 −0.5%. List block #121212 pad 14/12:
 * rows 32 (Regular 16 −0.5 @64%, white when picked · 24 radio) with 1px
 * white 8% lines 16 above/below.
 *
 * params: settingsId (other user id or group id), value (minutes; 0 = on
 * read; null = off). Picking an option turns the toggle on.
 */
export const DISAPPEAR_OPTIONS = [
  { value: 0, label: "On Read" },
  { value: 30, label: "After 30 minutes" },
  { value: 120, label: "After 2 hours" },
  { value: 240, label: "After 4 hours" },
  { value: 480, label: "After 8 hours" },
  { value: 1440, label: "After 24 hours" },
  { value: null, label: "No time limit" },
];
export const disappearLabel = (enabled, after) =>
  !enabled ? "No time limit" : DISAPPEAR_OPTIONS.find((o) => o.value === (after || 0))?.label || "On Read";

const DisappearingMessages = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const settingsId = route?.params?.settingsId;
  const [value, setValue] = useState(route?.params?.enabled ? route?.params?.value || 0 : null);
  const [saving, setSaving] = useState(false);

  const pick = async (v) => {
    if (saving) return;
    const before = value;
    setValue(v);
    setSaving(true);
    try {
      const body = v === null
        ? { settings: { disappearing: false } }
        : { settings: { disappearing: true, disappearAfter: v } };
      const res = await updateConversationSettings(settingsId, body);
      if (!res?.data?.success) throw new Error("failed");
      route?.params?.onChange?.(res.data.data);
    } catch (e) {
      setValue(before);
      ToastMessage("Could not update this setting", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#262626" : colors.surfaceAlt }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Blur blurType={isDark ? "dark" : "xlight"} blurAmount={32} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: 0.9 }]} />
        <View style={styles.headerRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: tint(0.08) }]}>
            <Blur blurType={isDark ? "dark" : "xlight"} borderRadius={100} />
            <Icons family="MaterialSymbolsRounded" name="chevron_left" size={20} color={tint(0.64)} />
          </TouchableOpacity>
          <CustomText label="Disappearing Messages" fontSize={24} fontFamily={fonts.semiBold} letterSpacing={-0.12} color={colors.text} containerStyle={styles.flex} numberOfLines={1} />
        </View>
      </View>

      <View style={[styles.list, { backgroundColor: colors.background }]}>
        {DISAPPEAR_OPTIONS.map((o, i) => {
          const selected = value === o.value;
          return (
            <View key={String(o.value)}>
              {i > 0 && <View style={[styles.line, { backgroundColor: tint(0.08) }]} />}
              <TouchableOpacity activeOpacity={0.7} onPress={() => pick(o.value)} style={styles.row}>
                <CustomText label={o.label} fontSize={16} letterSpacing={-0.5} color={selected ? colors.text : tint(0.64)} />
                <Icons
                  family="MaterialSymbolsRounded"
                  name={selected ? "radio_button_checked" : "radio_button_unchecked"}
                  size={24}
                  color={selected ? "#A19375" : tint(0.32)} // Figma: radios @32%, checked gold
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default DisappearingMessages;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
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
  list: {
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  row: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  line: {
    height: 1,
    marginVertical: 16,
  },
});
