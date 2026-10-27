import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import Blur from "../../../../components/Blur";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import CallOptionsSheet from "./CallOptionsSheet";

/**
 * Figma Chat page "Inbox_General-Default" (2212:7108) header — #262626 @64%
 * + blur 16 (status bar included), row 60 (pad 12/12/8/12, gap 12):
 *  back 40 white 8% + chevron_left 20 #F8F9FB ·
 *  [online dot 8 #64CD75 · 6 · "Clark, 48" Medium 18 −2% white]
 *  · 8 · ["Founder" Regular 12 #828186 · 4 dot #828186 · company Regular 12]
 *  · call 40 white 8% + call 20 white (opens Call-Options).
 * Tapping the name opens the conversation settings.
 */
const GRAY = "#828186";

const ChatHeader = ({ title, subtitle, company, online, onSettingsPress, onVoiceCall, onVideoCall }) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const [calls, setCalls] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Blur blurType={isDark ? "dark" : "xlight"} blurAmount={16} borderRadius={0.01} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "rgba(38, 38, 38, 0.64)" : "rgba(255, 255, 255, 0.64)" }]} />
      <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.circle, { backgroundColor: tint(0.08) }]}>
        <Icons family="MaterialSymbolsRounded" name="chevron_left" size={20} color={isDark ? "#F8F9FB" : colors.text} />
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.7} onPress={onSettingsPress} disabled={!onSettingsPress} style={styles.texts}>
        <View style={styles.nameRow}>
          {online && <View style={styles.dot} />}
          <CustomText
            label={title || "Chat"}
            fontSize={18}
            fontFamily={fonts.medium}
            letterSpacing={-0.36}
            color={colors.text}
            numberOfLines={1}
            containerStyle={styles.shrink}
          />
        </View>
        {(!!subtitle || !!company) && (
          <View style={styles.subRow}>
            {!!subtitle && <CustomText label={subtitle} fontSize={12} color={GRAY} numberOfLines={1} containerStyle={styles.noShrink} />}
            {!!subtitle && !!company && <View style={styles.sep} />}
            {!!company && <CustomText label={company} fontSize={12} color={GRAY} numberOfLines={1} containerStyle={styles.shrink} />}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.7} onPress={() => setCalls(true)} style={[styles.circle, { backgroundColor: tint(0.08) }]}>
        <Icons family="MaterialSymbolsRoundedFilled" name="call" size={20} color={colors.text} />
      </TouchableOpacity>

      <CallOptionsSheet visible={calls} onClose={() => setCalls(false)} onVoice={onVoiceCall} onVideo={onVideoCall} />
    </View>
  );
};

export default ChatHeader;

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 1000,
    backgroundColor: "#64CD75",
  },
  // Figma: name cap → sub cap 21; RN Medium 18 box 25.2 / Regular 12 box 16.8
  // → 21 − (25.2 − 13)/2 − (16.8 − 8.6)/2 ≈ 10.8 − 4.1 = 6.8 → pull −1.9
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -1.9,
  },
  sep: {
    width: 4,
    height: 4,
    borderRadius: 100,
    backgroundColor: GRAY,
  },
  shrink: { flexShrink: 1 },
  noShrink: { flexShrink: 0 },
});
