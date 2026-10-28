import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../assets/fonts";
import { FloatingBlurHeader } from "../../../components/HeaderProgressiveBlur";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { updateConversationSettings } from "../../../services/ChatService";
import { InfoLine } from "../TvShow/molecules/ShowForm";
import { ToastMessage } from "../../../utils/ToastMessage";

/**
 * Figma Chat page "Theme" (2212:6208): header pad 72/16/12/16 (#121212 @64%
 * + blur) — 20 chevron · "Theme" Medium 18 −0.5 centred. Content pad 14/12,
 * gap 24: preview card (white 4% r12, pad 16/12, gap 16: received bubble
 * 183×59 white 4% r8 / sent bubble coloured, Light 16) · 8 · "This is how
 * your conversation will look like." Light 12 #828282 · 1px white 16% ·
 * colour rows 366×80 r12, 8 apart; the picked one gets a 1px white frame
 * (pad 4, inner r8).
 */
export const THEME_COLORS = [
  "#252525", "#006636", "#8DC53E", "#EFE347", "#FD6D1B", "#EE1045",
  "#D3155D", "#CD88FD", "#575093", "#1430FA", "#2BA9E4", "#736356",
];

const ChatTheme = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const settingsId = route?.params?.settingsId;
  const [theme, setTheme] = useState(route?.params?.value || "");
  const [saving, setSaving] = useState(false);
  // floating header height (status bar included), content starts below it
  const [headerH, setHeaderH] = useState(null);
  const sentColor = theme || "#006636";

  const pick = async (c) => {
    if (saving) return;
    const before = theme;
    setTheme(c);
    setSaving(true);
    try {
      const res = await updateConversationSettings(settingsId, { settings: { theme: c } });
      if (!res?.data?.success) throw new Error("failed");
      route?.params?.onChange?.(res.data.data);
    } catch (e) {
      setTheme(before);
      ToastMessage("Could not update the theme", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* header floats; content scrolls under the progressive blur */}
      <FloatingBlurHeader onHeightChange={setHeaderH} includeStatusBar={false}>
      <View style={[styles.header, { paddingTop: insets.top + 28 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} hitSlop={12}>
            <Icons family="MaterialSymbolsRounded" name="chevron_left" size={20} color={colors.text} />
          </TouchableOpacity>
          <CustomText label="Theme" fontSize={18} fontFamily={fonts.medium} letterSpacing={-0.09} color={colors.text} textAlign="center" containerStyle={styles.flex} />
          <View style={{ width: 20 }} />
        </View>
      </View>
      {/* preview stays pinned with the header; only the colour rows scroll */}
      <View style={styles.pinned}>
        <View style={styles.previewBlock}>
          <View style={[styles.preview, { backgroundColor: tint(0.04) }]}>
            <View style={[styles.bubble, { backgroundColor: tint(0.04), alignSelf: "flex-start" }]}>
              <CustomText label="Hi James, how are you?" fontSize={16} fontFamily={fonts.light} color={colors.text} />
            </View>
            <View style={[styles.bubble, { backgroundColor: sentColor, alignSelf: "flex-end" }]}>
              <CustomText label="Hey Catie, I’m doing well. I hope you too!" fontSize={16} fontFamily={fonts.light} color="#FFFFFF" />
            </View>
          </View>
          <InfoLine label="This is how your conversation will look like." color="#828282" />
        </View>
        <View style={[styles.line, { backgroundColor: tint(0.16) }]} />
      </View>
      </FloatingBlurHeader>

      <ScrollView
        style={{ opacity: headerH == null ? 0 : 1 }}
        contentContainerStyle={[styles.content, { paddingTop: headerH || 0, paddingBottom: insets.bottom + 14 }]}
        scrollIndicatorInsets={{ top: headerH || 0 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.swatches}>
          {THEME_COLORS.map((c) => {
            const selected = (theme || "") === c;
            return (
              <TouchableOpacity
                key={c}
                activeOpacity={0.8}
                onPress={() => pick(c)}
                style={[styles.swatchFrame, selected && styles.swatchSelected]}
              >
                <View style={[styles.swatch, { backgroundColor: c }, selected && { borderRadius: 8 }]} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default ChatTheme;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    overflow: "hidden",
    borderBottomWidth: 1, // Figma Rectangle 50: 1px #262626, 8 above the content
    borderBottomColor: "#262626",
    marginBottom: -6, // content pad 14 → 8 below the rule
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  content: {
    paddingHorizontal: 12,
  },
  // Figma content pad 14 (8 below the header rule) · gap 24 → preview, rule,
  // then the colour rows 24 below the rule
  pinned: {
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 24,
  },
  previewBlock: {
    gap: 8,
  },
  preview: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 16,
  },
  bubble: {
    width: 183,
    minHeight: 59,
    borderRadius: 8,
    padding: 12,
  },
  line: {
    height: 1,
    borderRadius: 100,
  },
  swatches: {
    gap: 8,
  },
  swatchFrame: {
    height: 80,
    borderRadius: 12,
  },
  // Figma: picked row 88 = 1px white frame + 3 pad + 80 swatch (r8)
  swatchSelected: {
    height: 88,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    padding: 3,
  },
  swatch: {
    flex: 1,
    borderRadius: 12,
  },
});
