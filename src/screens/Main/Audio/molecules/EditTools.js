import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import { AUDIO, GlassFill, Glyph, MS, MSF, fitLine, ls } from "./audioLayout";

/**
 * Figma record › edit, "Frame 2085664207" top part:
 *  · speed pill 100 × 32 (white 4% + blur, pad 2, gap 6): 28 circles,
 *    picked one white with #121212 text, others white 16% — Medium 12
 *  · AI chips (gap 3), 28 tall, white 4% + blur, pad L8 R6, gap 6:
 *    12 icon · Medium 12 · cost badge (gold 16%, r100, pad 2/4, gap 1:
 *    Medium 12 −0.5% gold + toll 14 gold)
 */
export const SPEEDS = [
  { value: 0.5, label: ".5" },
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
];

export const SpeedPicker = ({ value = 1, onChange, disabled }) => (
  <View style={styles.speed}>
    <GlassFill fill={AUDIO.white04} />
    {SPEEDS.map((s) => {
      const on = s.value === value;
      return (
        <TouchableOpacity
          key={s.label}
          activeOpacity={0.7}
          disabled={disabled}
          onPress={() => onChange?.(s.value)}
          style={[styles.speedItem, { backgroundColor: on ? AUDIO.white : AUDIO.white16 }]}
        >
          <CustomText
            label={s.label}
            fontFamily={fonts.medium}
            fontSize={12}
            color={on ? AUDIO.dark : AUDIO.white}
            marginTop={fitLine(12, 8)}
            marginBottom={fitLine(12, 8)}
          />
        </TouchableOpacity>
      );
    })}
  </View>
);

export const ToolChip = ({ icon, label, cost, onPress, busy, disabled }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    disabled={disabled || busy}
    style={[styles.chip, { opacity: disabled ? 0.48 : 1 }]}
  >
    <GlassFill fill={AUDIO.white04} />
    {busy ? (
      <ActivityIndicator size="small" color={AUDIO.white} style={styles.busy} />
    ) : (
      <Glyph family={MSF} name={icon} size={12} color={AUDIO.white} />
    )}
    <CustomText
      label={label}
      fontFamily={fonts.medium}
      fontSize={12}
      color={AUDIO.white}
      marginTop={fitLine(12, 8)}
      marginBottom={fitLine(12, 8)}
    />
    <View style={styles.cost}>
      <CustomText
        label={String(cost)}
        fontFamily={fonts.medium}
        fontSize={12}
        letterSpacing={ls(12, -0.5)}
        color={AUDIO.gold}
        marginTop={fitLine(12, 8)}
        marginBottom={fitLine(12, 8)}
      />
      <Glyph family={MS} name="toll" size={14} color={AUDIO.gold} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  speed: {
    alignSelf: "flex-end",
    height: 32,
    borderRadius: 100,
    padding: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  speedItem: {
    width: 28,
    height: 28,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    height: 28,
    borderRadius: 100,
    paddingLeft: 8,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  busy: { width: 12, height: 12, transform: [{ scale: 0.6 }] },
  cost: {
    height: 18,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    backgroundColor: AUDIO.gold16,
  },
});
