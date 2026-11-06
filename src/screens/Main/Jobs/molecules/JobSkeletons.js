import { StyleSheet, View, useWindowDimensions } from "react-native";

import { Bone, SkeletonGroup } from "../../../../components/Skeleton";
import { INK, SHEET_BG, WHITE_4 } from "../../Career/molecules/CareerUI";

/**
 * Loading states of the Jobs screens (client: skeletons, never a blank
 * screen / spinner). Each bone sits where the Figma element sits, sized to
 * its trimmed text box.
 */

/** Job card (Figma 7470:5863): 56 logo · 4 text rows · chips · 2 lines · salary */
export const JobCardSkeleton = ({ mine }) => (
  <View style={styles.card}>
    <View style={styles.cardHead}>
      <Bone width={mine ? 51 : 56} height={mine ? 51 : 56} radius={12} />
      <View style={styles.cardColumn}>
        <Bone width={150} height={12} />
        <Bone width={110} height={10} />
        <Bone width={130} height={10} />
        <Bone width={90} height={mine ? 7 : 12} />
      </View>
      {mine && <Bone width={48} height={20} radius={4} />}
    </View>
    <View style={styles.chips}>
      <Bone width={72} height={20} radius={4} />
      <Bone width={62} height={20} radius={4} />
      <Bone width={63} height={20} radius={4} />
    </View>
    <View style={styles.lines}>
      <Bone width="100%" height={9} />
      <Bone width="80%" height={9} />
    </View>
    <Bone width={142} height={10} />
  </View>
);

/** List of job cards split by the Figma 1pt white 4% rules */
export const JobListSkeleton = ({ mine, count = 4 }) => (
  <SkeletonGroup>
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.list}>
          {i > 0 && <View style={styles.rule} />}
          <JobCardSkeleton mine={mine} />
        </View>
      ))}
    </View>
  </SkeletonGroup>
);

const SectionSkeleton = ({ lines = 2 }) => (
  <View style={styles.section}>
    <Bone width={160} height={13} />
    <View style={styles.lines}>
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} width={i === lines - 1 ? "70%" : "100%"} height={10} />
      ))}
    </View>
  </View>
);

/** Job-Detail / candidate screen: 375 hero · 40 button band · sections */
export const DetailSkeleton = ({ actions = 1 }) => {
  const { width } = useWindowDimensions();
  return (
    <SkeletonGroup>
      <View style={styles.page}>
        <View style={[styles.hero, { height: width }]}>
          <Bone width={128} height={20} />
          <Bone width={220} height={22} />
          <Bone width={140} height={11} />
          <Bone width={100} height={14} />
        </View>
        <View style={styles.band}>
          {Array.from({ length: actions }).map((_, i) => (
            <Bone key={i} width="100%" height={40} radius={100} />
          ))}
        </View>
        <SectionSkeleton lines={3} />
        <SectionSkeleton lines={3} />
        <SectionSkeleton lines={4} />
      </View>
    </SkeletonGroup>
  );
};

/** Candidate row (Figma 8265:8020): 40 avatar · name · place · chip · 32 circle */
const CandidateRowSkeleton = () => (
  <View style={styles.candidate}>
    <Bone width={40} height={40} radius={100} />
    <View style={styles.candidateColumn}>
      <Bone width={120} height={11} />
      <Bone width={90} height={10} />
    </View>
    <Bone width={60} height={20} radius={4} />
    <Bone width={32} height={32} radius={100} />
  </View>
);

/** Offer Overview (Figma 8265:7776) */
export const OfferSkeleton = () => (
  <SkeletonGroup>
    <View style={styles.page}>
      <View style={styles.top}>
        <Bone width="100%" height={40} radius={100} />
        <Bone width="100%" height={56} radius={12} />
        <Bone width="100%" height={56} radius={12} />
        <View style={styles.chips}>
          <Bone width={42} height={32} radius={100} />
          <Bone width={55} height={32} radius={100} />
          <Bone width={94} height={32} radius={100} />
          <Bone width={86} height={32} radius={100} />
        </View>
      </View>
      <View style={styles.section}>
        <Bone width={110} height={13} />
        {Array.from({ length: 4 }).map((_, i) => (
          <CandidateRowSkeleton key={i} />
        ))}
      </View>
    </View>
  </SkeletonGroup>
);

/** Select-Company row (Figma 8038:11802): 65 tall, 32 logo, 2 lines, radio */
export const CompanyRowsSkeleton = ({ count = 8 }) => (
  <SkeletonGroup>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i}>
        {i > 0 && <View style={styles.rule} />}
        <View style={styles.company}>
          <Bone width={32} height={32} radius={8} />
          <View style={styles.candidateColumn}>
            <Bone width={150} height={11} />
            <Bone width={110} height={10} />
          </View>
          <Bone width={24} height={24} radius={100} />
        </View>
      </View>
    ))}
  </SkeletonGroup>
);

/** Select-Skills row (Figma Profile › Select-Skills): 64 tall, label + 24 circle */
export const SkillRowsSkeleton = ({ count = 10 }) => (
  <SkeletonGroup>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i}>
        {i > 0 && <View style={styles.rule} />}
        <View style={styles.skill}>
          <Bone width={90 + ((i * 37) % 80)} height={11} />
          <Bone width={24} height={24} radius={100} />
        </View>
      </View>
    ))}
  </SkeletonGroup>
);

/** Profile › Career sections while the tab loads */
export const CareerSkeleton = () => (
  <SkeletonGroup>
    {Array.from({ length: 3 }).map((_, i) => (
      <View key={i}>
        {i > 0 && <View style={styles.rule} />}
        <View style={styles.careerSection}>
          <Bone width={140} height={13} />
          <View style={styles.careerItem}>
            <Bone width={32} height={32} radius={0} />
            <View style={styles.lines}>
              <Bone width={130} height={10} />
              <Bone width={100} height={11} />
              <Bone width={150} height={10} />
            </View>
          </View>
        </View>
      </View>
    ))}
  </SkeletonGroup>
);

const styles = StyleSheet.create({
  list: { gap: 12 },
  rule: { height: 1, backgroundColor: WHITE_4 },
  card: { gap: 8 },
  cardHead: { flexDirection: "row", gap: 8, alignItems: "center" },
  cardColumn: { flex: 1, gap: 6 },
  chips: { flexDirection: "row", gap: 4 },
  lines: { flex: 1, gap: 6 },
  page: { gap: 1, backgroundColor: SHEET_BG },
  hero: { backgroundColor: INK, justifyContent: "flex-end", padding: 12, gap: 12 },
  band: { backgroundColor: INK, padding: 8, gap: 12 },
  section: { backgroundColor: INK, padding: 12, gap: 16 },
  top: { backgroundColor: INK, padding: 8, gap: 12 },
  candidate: { height: 40, flexDirection: "row", alignItems: "center", gap: 8 },
  candidateColumn: { flex: 1, gap: 6 },
  company: { height: 65, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  skill: { height: 64, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  careerSection: { padding: 16, gap: 16 },
  careerItem: { flexDirection: "row", gap: 8 },
});
