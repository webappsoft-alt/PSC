import { useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../../assets/fonts";
import TrendChart from "./TrendChart";
import {
  EL,
  Fit,
  GlassFill,
  Glyph,
  MS,
  Section,
  SectionSubtitle,
  SectionTitle,
  Txt,
  changeChip,
  colorOf,
  formatCount,
  formatPercent,
  withAlpha,
} from "./electionLayout";
import InitialsFill from "../../../../components/InitialsFill";

/**
 * Figma "Évolutions des intentions de votes" (8169:1110): pad 12 · gap 24 —
 * header, range chips + calendar, top-5 candidates (client: "vote count
 * based of our users"), Show more, trend chart (client: "graph with
 * candidates colors").
 */
export const RANGES = ["1D", "1W", "1M", "3M", "6M", "1Y", "YTD"];
const RANGE_FR = {
  "1D": "1 jour",
  "1W": "1 semaine",
  "1M": "1 mois",
  "3M": "3 mois",
  "6M": "6 mois",
  "1Y": "1 an",
  YTD: "depuis le début de l'année",
};
const VISIBLE = 5;
const CHANGE_CELL = 48;

/** range selector (Frame 75): 36 · pad 2 · white 4% · r100; active white 8% SemiBold */
const RangeChips = ({ range, onChange }) => (
  <View style={styles.rangeRow}>
    <View style={styles.range}>
      <GlassFill fill={EL.white04} />
      {RANGES.map((r) => {
        const on = r === range;
        return (
          <TouchableOpacity
            key={r}
            activeOpacity={0.7}
            onPress={() => onChange?.(r)}
            style={styles.rangeItem}
          >
            {on ? <GlassFill fill={EL.white08} /> : null}
            <Fit
              size={12}
              box={14}
              label={r}
              fontFamily={on ? fonts.semiBold : fonts.regular}
              color={on ? EL.white : EL.offWhite}
            />
          </TouchableOpacity>
        );
      })}
    </View>
    {/* calendar (Frame 70): 36 circle white 4% · date_range 16 @64 — design only */}
    <View style={styles.calendar}>
      <GlassFill fill={EL.white04} />
      <Glyph family={MS} name="date_range" size={16} color={EL.white64} />
    </View>
  </View>
);

/** candidate row (Frame 2085664242): 40 · r12 · gap 2 */
// Client (Nov 2026): "It's not for voting on the detail page, these are
// results" — a plain row, no press
const CandidateRow = ({ result, maxPercent, voted }) => {
  const color = colorOf(result);
  const chip = changeChip(result?.change);
  const uri = result?.user?.profile?.avatar;
  const party = result?.party;
  const ratio = maxPercent > 0 ? Math.min(1, (Number(result?.percent) || 0) / maxPercent) : 0;
  return (
    <View style={styles.candidate}>
      <View style={styles.candidateMain}>
        <GlassFill fill={EL.white04} borderRadius={0} />
        <View style={styles.candidateBody}>
          <View
            style={[
              styles.candidateFill,
              { width: `${ratio * 100}%`, backgroundColor: withAlpha(color, 0.16) },
            ]}
          />
          <View style={[styles.candidateContent, { paddingHorizontal: party ? 8 : 12 }]}>
            <View style={[styles.avatar, { backgroundColor: withAlpha(color, 0.48) }]}>
              {uri ? (
                <FastImage source={{ uri }} style={StyleSheet.absoluteFill} />
              ) : (
                <InitialsFill user={result?.user} name={result?.name} size={24} />
              )}
            </View>
            {party ? (
              <View style={[styles.shrink, { gap: 6 }]}>
                <Txt
                  size={12}
                  label={result?.name || ""}
                  fontFamily={fonts.medium}
                  color={EL.white}
                  numberOfLines={1}
                />
                <Txt size={10} label={party} color={EL.white64} numberOfLines={1} />
              </View>
            ) : (
              <Fit
                size={14}
                box={10}
                label={result?.name || ""}
                fontFamily={fonts.medium}
                color={EL.white}
                containerStyle={styles.shrink}
              />
            )}
            {voted ? <Glyph family={MS} name="check" size={14} color={EL.white} /> : null}
          </View>
        </View>
        <View style={styles.pctCell}>
          <Fit
            size={14}
            box={10}
            label={formatPercent(result?.percent)}
            fontFamily={fonts.medium}
            color={EL.white}
          />
        </View>
      </View>
      <View style={styles.changeCell}>
        <GlassFill fill={chip.fill} borderRadius={0} />
        <Fit size={14} box={10} label={chip.label} fontFamily={fonts.medium} color={chip.color} />
      </View>
    </View>
  );
};

export const CandidateSkeletonRows = ({ opacity }) => (
  <View style={{ gap: 6 }}>
    {Array.from({ length: VISIBLE }).map((_, i) => (
      <Animated.View key={i} style={[styles.candidate, { backgroundColor: EL.white04, opacity }]} />
    ))}
  </View>
);

const VoteEvolution = ({
  results,
  totalVotes,
  range,
  onRange,
  trend,
  myVote,
  loadingRange,
  skeletonOpacity,
  onLayout,
}) => {
  const [expanded, setExpanded] = useState(false);
  const list = Array.isArray(results) ? results : [];
  const shown = expanded ? list : list.slice(0, VISIBLE);
  const hidden = Math.max(0, list.length - VISIBLE);
  const maxPercent = list.reduce((m, r) => Math.max(m, Number(r?.percent) || 0), 0);
  return (
    <Section gap={24} onLayout={onLayout}>
      <View style={{ gap: 12 }}>
        <SectionTitle label="Évolutions des intentions de votes" box={18} />
        <View style={{ gap: 8 }}>
          <SectionSubtitle label={`Pourcentage moyenne mobile sur ${RANGE_FR[range] || "1 mois"}.`} />
          <SectionSubtitle label={`Sondé sur ${formatCount(totalVotes)} personnes sur PSC.`} />
        </View>
      </View>

      <RangeChips range={range} onChange={onRange} />

      {loadingRange ? (
        <CandidateSkeletonRows opacity={skeletonOpacity} />
      ) : list.length ? (
        <View style={styles.list}>
          <View style={{ gap: 6, alignSelf: "stretch" }}>
            {shown.map((r) => (
              <CandidateRow
                key={String(r.optionId)}
                result={r}
                maxPercent={maxPercent}
                voted={!!myVote && String(myVote) === String(r.optionId)}
              />
            ))}
          </View>
          {Number(totalVotes) > 0 ? null : (
            <Txt
              size={12}
              label="No votes yet."
              color={EL.white64}
              textAlign="center"
            />
          )}
          {hidden > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setExpanded((v) => !v)}
              style={styles.showMore}
            >
              <Fit
                size={14}
                box={10}
                label={expanded ? "Show less" : `Show more (${hidden})`}
                fontFamily={fonts.medium}
                color={EL.white64}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <Txt size={14} label="No candidates yet." color={EL.white64} textAlign="center" />
      )}

      <TrendChart
        trend={trend}
        results={list}
        totalVotes={totalVotes}
        loading={loadingRange}
        skeletonOpacity={skeletonOpacity}
      />
    </Section>
  );
};

export default VoteEvolution;

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  rangeRow: { height: 36, flexDirection: "row", alignItems: "center", gap: 12 },
  range: {
    flex: 1,
    height: 36,
    padding: 2,
    borderRadius: 100,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  rangeItem: {
    flex: 1,
    height: 32,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  calendar: {
    width: 36,
    height: 36,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  list: { gap: 8, alignItems: "center" },
  candidate: {
    height: 40,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    gap: 2,
  },
  candidateMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  candidateBody: { flex: 1, height: 40, justifyContent: "center" },
  candidateFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  candidateContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatar: { width: 24, height: 24, borderRadius: 12, overflow: "hidden" },
  // Figma Frame 2085663806: hugs its text, pad 0/12 — "100%" never truncates
  pctCell: {
    height: 40,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  changeCell: {
    width: CHANGE_CELL,
    height: 40,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  showMore: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: EL.white04,
    alignItems: "center",
    justifyContent: "center",
  },
});
