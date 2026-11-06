import { StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import { GlassFill, Glyph, fitLine } from "../../TvShow/molecules/showsLayout";

/**
 * Figma › Poll-Detail-Page (national 8103:4259 · département 8127:6977).
 * #262626 page, #121212 sections 1pt apart. Texts use Figma's vertical trim
 * (cap top → baseline), converted with the Shows helpers so the Figma
 * auto-layout gaps apply as they are.
 */
export { GlassFill, Glyph };

export const MS = "MaterialSymbolsRounded";
export const MSF = "MaterialSymbolsRoundedFilled";

export const EL = {
  page: "#262626",
  section: "#121212",
  white: COLORS.white,
  white82: "rgba(255, 255, 255, 0.82)",
  white64: "rgba(255, 255, 255, 0.64)",
  white48: "rgba(255, 255, 255, 0.48)",
  white16: "rgba(255, 255, 255, 0.16)",
  white08: "rgba(255, 255, 255, 0.08)",
  white04: "rgba(255, 255, 255, 0.04)",
  offWhite: "#F2F2F2",
  axisY: "#DFDFDF",
  axisX: "#BFBFBF",
  blue: "#007BFF",
  green: "#37B874",
  red: "#EE1045",
  gold: "#A19375",
  // Figma fallback candidate colour (#007AFF) when a result has none
  fallback: "#007AFF",
};

// sections: pad 12, 1pt apart on the #262626 page
export const SECTION_PAD = 12;
export const CONTENT_W = 351;

// Solid / Likely / Leaning / Tilt legend: colour at 100 / 75 / 50 / 25 %
export const RATINGS = ["Solid", "Likely", "Leaning", "Tilt"];
export const RATING_ALPHA = { Solid: 1, Likely: 0.75, Leaning: 0.5, Tilt: 0.25 };

/** "#EE1045" + 0.16 → "rgba(238, 16, 69, 0.16)" */
export const withAlpha = (hex, alpha = 1) => {
  const h = typeof hex === "string" ? hex.replace("#", "") : "";
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(full)) return `rgba(0, 122, 255, ${alpha})`;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const colorOf = (result) => result?.color || EL.fallback;

/** 1400 → "1.4k", 1500000 → "1.5M" */
export const formatK = (n) => {
  const v = Math.max(0, Number(n) || 0);
  const fmt = (x, s) => `${Number(x.toFixed(1))}${s}`;
  if (v >= 1e6) return fmt(v / 1e6, "M");
  if (v >= 1e3) return fmt(v / 1e3, "k");
  return String(Math.round(v));
};

/** 113930 → "113,930" */
export const formatCount = (n = 0) =>
  String(Math.max(0, Math.round(Number(n) || 0))).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );

/** 2047602 → "2’047’602" (Figma population format) */
export const formatPopulation = (n = 0) =>
  String(Math.max(0, Math.round(Number(n) || 0))).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "’",
  );

/** 34.4 → "34%", 53.25 → "53.3%" */
export const formatPercent = (p, decimals = 0) => {
  const v = Number(p) || 0;
  const f = decimals ? Number(v.toFixed(decimals)) : Math.round(v);
  return `${f}%`;
};

/** change chip: "+2%", "-2%", "=0%" with its Figma colours */
export const changeChip = (change) => {
  const v = Math.round(Number(change) || 0);
  if (v > 0) return { label: `+${v}%`, color: EL.green, fill: withAlpha(EL.green, 0.08) };
  if (v < 0) return { label: `-${Math.abs(v)}%`, color: EL.red, fill: withAlpha(EL.red, 0.08) };
  return { label: "=0%", color: EL.white64, fill: EL.white08 };
};

export const userName = (u) =>
  `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || u?.username || "";

/** "Tilt RN" — rating + the leader's short label */
export const ratingLabel = (rating, leader) =>
  [rating, leader?.shortLabel].filter(Boolean).join(" ");

/**
 * Figma "vertical trim: cap height" text box = Poppins cap height (0.697 em)
 * rounded to whole points (Figma: 10 → 7, 12 → 8, 14 → 10, 16 → 11,
 * 18 → 13, 20 → 14, 24 → 17, 32 → 22).
 */
export const capBox = (size) => Math.round(size * 0.697);
/** vertical margin that trims a CustomText line box (1.4 em) to capBox */
export const trim = (size) => fitLine(size, capBox(size));

/** Figma TITLE text case: first letter of each word upper, rest unchanged */
export const toTitle = (str) =>
  String(str ?? "").replace(/(^|\s)(\S)/g, (m, sp, c) => sp + c.toUpperCase());

/**
 * Text trimmed to Figma's cap-height box, so the Figma auto-layout gaps are
 * used as they are.
 */
export const Txt = ({ size = 14, ...props }) => (
  <CustomText fontSize={size} marginTop={trim(size)} marginBottom={trim(size)} {...props} />
);

/** one-line text centred in a Figma row of `box` pt (chips, pills) */
export const Fit = ({ size = 14, box, ...props }) => (
  <CustomText
    fontSize={size}
    marginTop={fitLine(size, box)}
    marginBottom={fitLine(size, box)}
    numberOfLines={1}
    {...props}
  />
);

/**
 * Section title: Medium 18 / −0.5px. The labels are passed already in
 * Figma's TITLE case — no textTransform (iOS "capitalize" lowercases the
 * rest of each word: "SI Summary" → "Si Summary").
 * `box`: Figma fixed-height title boxes (Schedule / Polling Map /
 * Évolutions 18, Key Figures 12) with the cap centred; default hugs (13).
 */
export const SectionTitle = ({ label, containerStyle, box }) => (
  <CustomText
    fontSize={18}
    label={toTitle(label)}
    fontFamily={fonts.medium}
    letterSpacing={-0.5}
    color={EL.white}
    marginTop={box ? fitLine(18, box) : trim(18)}
    marginBottom={box ? fitLine(18, box) : trim(18)}
    containerStyle={containerStyle}
  />
);

/** Section subtitle: Regular 12 @64 */
export const SectionSubtitle = ({ label }) => (
  <Txt size={12} label={label} color={EL.white64} />
);

/**
 * Figma bullet list (unordered list, indentation 1 — Regular 14 / −2% @64,
 * 8 apart). Bullet measured on the Figma render: 3.5 dot @64, 8.75 from the
 * left, 3.6 below the cap top; text column at 21.
 */
export const BulletList = ({ items }) => (
  <View style={styles.bullets}>
    {(items || []).map((item, i) => (
      <View key={`${i}-${item}`} style={styles.bulletRow}>
        <View style={styles.bulletCol}>
          <View style={styles.bulletDot} />
        </View>
        <Txt
          size={14}
          label={item}
          letterSpacing={-0.28}
          color={EL.white64}
          containerStyle={styles.shrink}
        />
      </View>
    ))}
  </View>
);

/** Section block: #121212, pad 12, Figma vertical gap */
export const Section = ({ gap = 12, style, children, onLayout }) => (
  <View onLayout={onLayout} style={[styles.section, { gap }, style]}>
    {children}
  </View>
);

/** "SEE MORE ›" (Figma Frame 18144): SemiBold 12 UPPER @64 + 16 circle */
export const SeeMore = () => (
  <View style={styles.seeMore}>
    <Fit
      size={12}
      box={8}
      label="See more"
      fontFamily={fonts.semiBold}
      textTransform="uppercase"
      color={EL.white64}
    />
    <View style={styles.seeMoreCircle}>
      <GlassFill fill={EL.white04} />
      <Glyph family={MS} name="chevron_right" size={14} color={EL.gold} />
    </View>
  </View>
);

/** Rail header: 18 icon · 4 · Medium 18 title … SEE MORE (Figma Frame 18145) */
export const RailHeader = ({ icon, family = MS, title }) => (
  <View style={styles.railHeader}>
    <View style={styles.railTitle}>
      <Glyph family={family} name={icon} size={18} color={EL.white} />
      <SectionTitle label={title} containerStyle={styles.shrink} />
    </View>
    <SeeMore />
  </View>
);

const styles = StyleSheet.create({
  section: {
    padding: SECTION_PAD,
    backgroundColor: EL.section,
  },
  shrink: { flexShrink: 1 },
  bullets: { gap: 8 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start" },
  // Figma list indentation 1 (bullet column)
  bulletCol: { width: 21, paddingLeft: 8.75, paddingTop: 3.6 },
  bulletDot: { width: 3.5, height: 3.5, borderRadius: 1.75, backgroundColor: EL.white64 },
  seeMore: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeMoreCircle: {
    width: 16,
    height: 16,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  railHeader: {
    height: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  railTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
