import { StyleSheet, View } from "react-native";
import {
  EL,
  Fit,
  Section,
  SectionSubtitle,
  SectionTitle,
  Txt,
  colorOf,
  formatPercent,
} from "./electionLayout";

/**
 * Figma Political Orientation / Gender / Industry / Education Level
 * Representation (8170:1327 …): pad 12 · gap 16; header gap 12 (Medium 18 ·
 * Regular 12 @64); rows 34 = label row (Regular 14 / −4% @64, share on the
 * right) · 12 · bar 12 r100 white 4% split in the candidates' colours
 * (client: "Candidate colors").
 */
export const DEMOGRAPHY = [
  { key: "age", title: "Political Orientation", subtitle: "Voting intention based on age group" },
  { key: "gender", title: "Gender Representation", subtitle: "Voting intention by gender" },
  { key: "industry", title: "Industry Representation", subtitle: "Voting intention by industry" },
  { key: "education", title: "Education Level Representation", subtitle: "Voting intention by education level" },
];

const SplitBar = ({ split, colorById, splitKey = "optionId" }) => (
  <View style={styles.bar}>
    {(Array.isArray(split) ? split : [])
      .filter((s) => Number(s?.percent) > 0)
      .map((s) => (
        <View
          key={String(s[splitKey])}
          style={{
            flex: Number(s.percent) || 0,
            backgroundColor: colorById.get(String(s[splitKey])) || EL.white16,
          }}
        />
      ))}
    {/* the rest of the track stays empty (white 4%) */}
    {(() => {
      const used = (Array.isArray(split) ? split : []).reduce(
        (sum, s) => sum + (Number(s?.percent) || 0),
        0,
      );
      return used < 100 ? <View style={{ flex: 100 - used }} /> : null;
    })()}
  </View>
);

/**
 * Elections split each bar by candidate (`split[].optionId` → result colour).
 * Other pages (topic hub) pass `splitKey` + `colors` ([[key, colour]]) to
 * split by another dimension, and their own `emptyLabel`.
 */
const DemographySection = ({
  title,
  subtitle,
  segments,
  results,
  onLayout,
  splitKey = "optionId",
  colors,
  emptyLabel = "No votes yet.",
}) => {
  const rows = (Array.isArray(segments) ? segments : []).filter((s) => s && s.label);
  const colorById = new Map(
    Array.isArray(colors)
      ? colors.map(([k, c]) => [String(k), c])
      : (results || []).map((r) => [String(r.optionId), colorOf(r)]),
  );
  const hasVotes = rows.some((r) => Number(r.votes) > 0);
  return (
    <Section gap={16} onLayout={onLayout}>
      <View style={{ gap: 12 }}>
        <SectionTitle label={title} />
        <SectionSubtitle label={subtitle} />
      </View>
      {rows.length && hasVotes ? (
        rows.map((r) => (
          <View key={String(r.key ?? r.label)} style={styles.row}>
            <View style={styles.labels}>
              <Fit
                size={14}
                box={10}
                label={r.label}
                letterSpacing={-0.56}
                color={EL.white64}
                containerStyle={styles.shrink}
              />
              <Fit
                size={14}
                box={10}
                label={formatPercent(r.share)}
                letterSpacing={-0.56}
                color={EL.white64}
              />
            </View>
            <SplitBar split={r.split} colorById={colorById} splitKey={splitKey} />
          </View>
        ))
      ) : (
        <Txt size={14} label={emptyLabel} color={EL.white64} />
      )}
    </Section>
  );
};

export default DemographySection;

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  row: { gap: 12 },
  labels: {
    height: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  bar: {
    height: 12,
    borderRadius: 100,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: EL.white04,
  },
});
