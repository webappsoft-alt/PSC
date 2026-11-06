import { StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import { GlassFill } from "../../BandMateMatching/molecules/matchLayout";
import { MS, MSF, WHITE_64 } from "../../Career/molecules/CareerUI";

export const GREEN = "#37B874";
export const RED = "#EE1045";
export const BLUE = "#007BFF";

// candidate status (backend) → Figma chip
export const CANDIDATE_CHIP = {
  new: { label: "NEW", bg: "rgba(0, 123, 255, 0.16)", color: BLUE },
  preselected: { label: "APPROVED", bg: "rgba(55, 184, 116, 0.16)", color: "#1D9053" },
  rejected: { label: "DECLINED", bg: "rgba(238, 16, 69, 0.16)", color: RED },
};
export const candidateChip = (c) => {
  if (!c) return null;
  if (c.status === "preselected") return CANDIDATE_CHIP.preselected;
  if (c.status === "rejected") return CANDIDATE_CHIP.rejected;
  return c.seen ? null : CANDIDATE_CHIP.new;
};
// Figma Overview chips All / New / Approved / Declined
export const CANDIDATE_FILTERS = [
  { label: "All", match: () => true },
  { label: "New", match: (c) => c.status === "applied" },
  { label: "Approved", match: (c) => c.status === "preselected" },
  { label: "Declined", match: (c) => c.status === "rejected" },
];

/**
 * Figma "Filter Options" segmented control: 40 r100 white 4% padding 4 gap 4;
 * options 32 r100 — active white + Medium 14 −0.5% #121212, idle Regular 14
 * −0.5% white 64%.
 */
export const Segmented = ({ options, value, onChange }) => (
  <View style={styles.segmented}>
    <GlassFill borderRadius={100} />
    {options.map((o) => {
      const on = o === value;
      return (
        <TouchableOpacity key={o} activeOpacity={0.8} onPress={() => onChange(o)} style={[styles.segment, on && styles.segmentOn]}>
          <CustomText
            label={o}
            fontSize={14}
            letterSpacing={-0.07}
            fontFamily={on ? fonts.medium : fonts.regular}
            color={on ? "#121212" : WHITE_64}
          />
        </TouchableOpacity>
      );
    })}
  </View>
);

/** Figma candidate star chip: 20 r4 #A19375 16%, `star` 12 filled #A19375 */
export const StarChip = () => (
  <View style={[styles.chip, styles.starChip]}>
    <Icons family={MSF} name="star" size={12} color="#A19375" />
  </View>
);

/** Figma status chip 20h p0/6 r4, SemiBold 10 −0.5% */
export const StatusChip = ({ chip }) =>
  chip ? (
    <View style={[styles.chip, { backgroundColor: chip.bg }]}>
      <CustomText label={chip.label} fontSize={10} letterSpacing={-0.05} fontFamily={fonts.semiBold} color={chip.color} />
    </View>
  ) : null;

/**
 * Figma "More-option-post" (8285:11215): "Delete This Offer" / "This is
 * irreversible", red 48 r100 button with `delete` 24 white + "Yes, Delete
 * This Offer" Medium 16 white (gap 4).
 */
export const DeleteOfferSheet = ({ visible, onDismiss, onConfirm, busy, onClosed }) => (
  <FloatingSheet
    visible={visible}
    onDismiss={onDismiss}
    title="Delete This Offer"
    subtitle="This is irreversible"
    closeIconSize={16}
    closeIconColor="muted"
    subtitleTrim={-4.9}
    onClosed={onClosed}
  >
    <TouchableOpacity activeOpacity={0.8} disabled={busy} onPress={onConfirm} style={[styles.deleteBtn, busy && { opacity: 0.5 }]}>
      <Icons family={MSF} name="delete_forever" size={24} color="#FFFFFF" />
      <CustomText label="Yes, Delete This Offer" fontSize={16} fontFamily={fonts.medium} color="#FFFFFF" />
    </TouchableOpacity>
  </FloatingSheet>
);

/** Figma 32 circle white 4% with `chevron_right` 16 white 64% */
export const ChevronCircle = ({ onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.chevron}>
    <GlassFill borderRadius={100} />
    <Icons family={MS} name="chevron_right" size={16} color={WHITE_64} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  segmented: { height: 40, borderRadius: 100, padding: 4, gap: 4, flexDirection: "row", overflow: "hidden" },
  segment: { flex: 1, height: 32, borderRadius: 100, alignItems: "center", justifyContent: "center" },
  segmentOn: { backgroundColor: "#FFFFFF" },
  chip: { height: 20, paddingHorizontal: 6, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  starChip: { width: 20, paddingHorizontal: 0, backgroundColor: "rgba(161, 147, 117, 0.16)" },
  deleteBtn: {
    height: 48,
    borderRadius: 100,
    backgroundColor: RED,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  chevron: { width: 32, height: 32, borderRadius: 100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
