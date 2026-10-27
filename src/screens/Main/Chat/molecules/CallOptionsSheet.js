import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import Blur from "../../../../components/Blur";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";

/**
 * Figma Chat page "Call-Options" (7921:3025): 200 wide popover under the
 * chat header's call button — r28 white 16% (+1px white 16%) pad 4 ·
 * inner r24 #121212 pad 12 gap 8 · rows 40: 40 circle white 4% + 20 icon ·
 * gap 12 · Medium 16 −0.5 white · 1px white 4% between.
 */
const CallOptionsSheet = ({ visible, onClose, onVoice, onVideo, position }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const pick = (fn) => () => {
    onClose?.();
    fn?.();
  };
  const option = (icon, label, onPress) => (
    <TouchableOpacity activeOpacity={0.7} onPress={pick(onPress)} style={styles.option}>
      <View style={[styles.iconCircle, { backgroundColor: tint(0.04) }]}>
        <Icons family="MaterialSymbolsRoundedFilled" name={icon} size={20} color={colors.text} />
      </View>
      <CustomText label={label} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[
            styles.outer,
            { borderColor: tint(0.16), backgroundColor: tint(0.16) },
            // default: under the header's right-hand 40 button
            position || { top: insets.top + 60, right: 12 },
          ]}
        >
          <Blur blurType={isDark ? "dark" : "xlight"} borderRadius={28} />
          <View style={[styles.inner, { backgroundColor: isDark ? "#121212" : colors.background }]}>
            {option("call", "Voice Call", onVoice)}
            <View style={[styles.line, { backgroundColor: tint(0.04) }]} />
            {option("videocam", "Video Call", onVideo)}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default CallOptionsSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  outer: {
    position: "absolute",
    width: 200,
    borderRadius: 28,
    borderWidth: 1,
    padding: 4,
    overflow: "hidden",
  },
  inner: {
    borderRadius: 24,
    padding: 12,
    gap: 8,
  },
  option: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    height: 1,
  },
});
