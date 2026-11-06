import { Dimensions, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet, { SheetActions } from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import { MS, Radio, WHITE_64, X } from "../../Career/molecules/CareerUI";

/**
 * Figma Matching/Jobs option sheets ("Location-Based" 8265:8953, "Contract-
 * Type" 8265:8880, "Payment-Terms", "Education-Degree", "Experience",
 * "Range of Application", "Filters-Job-Marketplace" 8265:4684). All share
 * the FloatingSheet shell (title SemiBold 24 −2%, 32 close with a 16 glyph
 * white 64%, subtitle Medium 14 −0.5 white 64%, column gap 20) and a list of
 * 48pt rows: padding 12/16, gap 8, r12, label Medium 16 −0.5 white, 24
 * trailing glyph (radio white 48% / `chevron_right` white 64%).
 */
export const SheetListRow = ({ label, onPress, trailing = "radio", selected, value }) =>
  value ? (
    // Row with a picked value (Filters sheet): nothing is truncated — the
    // label keeps its full width, the value wraps right-aligned in the space
    // left, and label / value / chevron line up on their first line (client
    // rule for left + right text rows). One line = the same 48pt row.
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.rowValue}>
      <CustomText label={label} fontSize={16} letterSpacing={-0.5} fontFamily={fonts.medium} color="#FFFFFF" />
      <CustomText
        label={value}
        fontSize={14}
        letterSpacing={-0.5}
        fontFamily={fonts.medium}
        color={WHITE_64}
        textAlign="right"
        marginTop={(16 * 1.4 - 14 * 1.4) / 2}
        containerStyle={styles.valueText}
      />
      <Icons family={MS} name={trailing === "chevron" ? "chevron_right" : "radio_button_unchecked"} size={24} color={WHITE_64} style={styles.valueIcon} />
    </TouchableOpacity>
  ) : (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
      <CustomText
        label={label}
        fontSize={16}
        letterSpacing={-0.5}
        fontFamily={fonts.medium}
        color="#FFFFFF"
        numberOfLines={1}
        marginTop={-X(16)}
        marginBottom={-X(16)}
        containerStyle={styles.grow}
      />
      {trailing === "chevron" ? (
        <Icons family={MS} name="chevron_right" size={24} color={WHITE_64} />
      ) : (
        <Radio selected={selected} />
      )}
    </TouchableOpacity>
  );

/** Figma footer: "Confirm" alone (319 × 48 white) or "Clear All" + "Confirm" (gap 4) */
export const SheetFooter = ({ onClear, onConfirm, confirmLabel = "Confirm" }) =>
  onClear ? (
    <SheetActions onReset={onClear} onConfirm={onConfirm} confirmLabel={confirmLabel} resetLabel="Clear All" />
  ) : (
    <TouchableOpacity activeOpacity={0.8} onPress={onConfirm} style={styles.confirm}>
      <CustomText label={confirmLabel} fontSize={16} fontFamily={fonts.medium} color="#121212" />
    </TouchableOpacity>
  );

// long lists (Contract Types, 12 × 48) scroll on short phones; the rest of
// the sheet (title 50, gaps 40, footer 48, paddings, margins) stays visible
const LIST_MAX = Dimensions.get("window").height - 330;

/** option values may be strings or { value, label } */
const valueOf = (o) => (typeof o === "string" ? o : o.value);
const labelOf = (o) => (typeof o === "string" ? o : o.label);

/** Radio list body of an option sheet */
export const OptionList = ({ options, selected, onToggle, multi }) => {
  const isOn = (v) => (multi ? (selected || []).includes(v) : selected === v);
  return (
    <ScrollView style={{ maxHeight: LIST_MAX }} bounces={false} showsVerticalScrollIndicator={false}>
      {options.map((o) => (
        <SheetListRow
          key={valueOf(o)}
          label={labelOf(o)}
          selected={isOn(valueOf(o))}
          onPress={() => onToggle(valueOf(o))}
        />
      ))}
    </ScrollView>
  );
};

/** Stand-alone option sheet (job creation fields) */
const JobOptionSheet = ({
  visible,
  onDismiss,
  title,
  subtitle = "Find all options below:",
  options,
  selected,
  onToggle,
  multi,
  onConfirm,
  onClear,
}) => (
  <FloatingSheet
    visible={visible}
    onDismiss={onDismiss}
    title={title}
    subtitle={subtitle}
    closeIconSize={16}
    closeIconColor="muted"
    subtitleTrim={-4.9}
  >
    <OptionList options={options} selected={selected} onToggle={onToggle} multi={multi} />
    <SheetFooter onClear={onClear} onConfirm={onConfirm || onDismiss} />
  </FloatingSheet>
);

export default JobOptionSheet;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  // 48 = 16 × 1.4 label line + 2 × 12.8
  rowValue: {
    minHeight: 48,
    paddingVertical: (48 - 16 * 1.4) / 2,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  valueText: { flex: 1 },
  valueIcon: { marginTop: (16 * 1.4 - 24) / 2 },
  // Figma padding 12/16 on a 48 row: the 24 glyph box is centred by the row
  // height instead — a 24pt vertical slot clips Material Symbols glyphs
  // (their line box is taller than 24) at the bottom on iOS
  row: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confirm: {
    height: 48,
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
