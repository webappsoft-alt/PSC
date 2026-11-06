import { StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../../assets/fonts";
import { DEPARTEMENTS } from "../../../../components/Election/franceDepartements";
import FloatingSheet, { SheetCloseButton } from "../../../../components/FloatingSheet";
import { ChanceLine } from "./PollingMap";
import {
  EL,
  Fit,
  GlassFill,
  Txt,
  colorOf,
  formatPercent,
  ratingLabel,
  toTitle,
  withAlpha,
} from "./electionLayout";
import InitialsFill from "../../../../components/InitialsFill";

/**
 * Figma "Account-Category" (8103:5618) — opened from a département on the
 * national map. Uses the app's FloatingSheet (same backdrop blur and glass
 * outline as every PSC modal: pad 4 · white 16% · r32 / inner #121212 r28,
 * pad 12, gap 12). Tapping the name row opens the département page.
 */

/** top-2 bar (Figma Frame 27): 40 · r12 · colour 16% · fill solid r[12,0,0,12] */
const TopBar = ({ candidate, percent }) => {
  const color = colorOf(candidate);
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  const uri = candidate?.user?.profile?.avatar;
  return (
    <View style={styles.bar}>
      <GlassFill fill={withAlpha(color, 0.16)} borderRadius={12} />
      <View style={styles.barMain}>
        <View style={[styles.barFill, { width: `${p}%`, backgroundColor: color }]} />
        <View style={styles.barContent}>
          <View style={[styles.avatar, { backgroundColor: EL.white16 }]}>
            {uri ? (
                <FastImage source={{ uri }} style={StyleSheet.absoluteFill} />
              ) : (
                <InitialsFill user={candidate?.user} name={candidate?.name} size={24} />
              )}
          </View>
          <Fit
            size={14}
            box={10}
            label={candidate?.name || ""}
            fontFamily={fonts.medium}
            color={EL.white}
            containerStyle={styles.shrink}
          />
        </View>
      </View>
      <View style={styles.pctCell}>
        <Fit size={14} box={10} label={formatPercent(p)} fontFamily={fonts.medium} color={EL.white} />
      </View>
    </View>
  );
};

const DepartementSheet = ({ visible, selection, results, electionTitle, onClose, onOpen }) => {
  const code = selection?.code ? String(selection.code) : null;
  const entry = selection?.entry || null;
  const name = code ? DEPARTEMENTS[code]?.name || code : "";
  const find = (id) => (results || []).find((r) => String(r.optionId) === String(id)) || null;
  const leader = entry?.leaderOptionId ? find(entry.leaderOptionId) : null;
  const hasVotes = !!leader && Number(entry?.totalVotes) > 0;
  const top = (Array.isArray(entry?.top) ? entry.top : [])
    .map((t) => ({ ...t, candidate: find(t?.optionId) }))
    .filter((t) => t.candidate)
    .slice(0, 2);
  const leaderColor = colorOf(leader);
  const diff = Number(entry?.voteDifference) || 0;

  const header = (
    <View style={{ gap: 8 }}>
      <View style={styles.titleRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => code && onOpen?.(code)}
          style={styles.flex}
        >
          <Fit
            size={24}
            box={17}
            label={toTitle(name)}
            fontFamily={fonts.semiBold}
            letterSpacing={-0.48}
            color={EL.white}
          />
        </TouchableOpacity>
        <View style={[styles.row, { gap: 8 }]}>
          {hasVotes && entry?.rating ? (
            <View style={[styles.ratingChip, { backgroundColor: leaderColor }]}>
              <Fit
                size={12}
                box={8}
                label={ratingLabel(entry.rating, leader)}
                fontFamily={fonts.medium}
                color={EL.white}
              />
            </View>
          ) : null}
          <SheetCloseButton onPress={onClose} size={16} color="muted" />
        </View>
      </View>
      <TouchableOpacity activeOpacity={0.7} onPress={() => code && onOpen?.(code)}>
        <Txt
          size={14}
          label={electionTitle || ""}
          fontFamily={fonts.medium}
          letterSpacing={-0.28}
          color={EL.white64}
          textTransform="uppercase"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <FloatingSheet visible={visible} onDismiss={onClose} header={header} gap={12}>
      {hasVotes ? (
        <>
          <ChanceLine leader={leader} chance={entry?.chance} size={12} nameFont={fonts.medium} />
          <View style={styles.diffRow}>
            <Txt
              size={18}
              label="Projected Vote Difference"
              fontFamily={fonts.medium}
              letterSpacing={-0.5}
              color={EL.white}
              containerStyle={styles.shrink}
            />
            <View style={[styles.diffChip, { backgroundColor: leaderColor }]}>
              <Fit
                size={12}
                box={8}
                label={`${diff >= 0 ? "+" : "-"}${Math.abs(diff)}`}
                fontFamily={fonts.medium}
                color={EL.white}
              />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={{ gap: 6 }}>
            {top.map((t) => (
              <TopBar key={String(t.optionId)} candidate={t.candidate} percent={t.percent} />
            ))}
          </View>
        </>
      ) : (
        <Txt
          size={12}
          label={`No votes yet in ${name}.`}
          color={EL.white64}
        />
      )}
      {/* Close (Figma Bar-de-recherche): 48 · r100 · white 4% · Medium 16 */}
      <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.close}>
        <GlassFill fill={EL.white04} />
        <Fit size={16} box={11} label="Close" fontFamily={fonts.medium} color={EL.white} textAlign="center" />
      </TouchableOpacity>
    </FloatingSheet>
  );
};

export default DepartementSheet;

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  titleRow: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  ratingChip: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  diffRow: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  diffChip: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: EL.white04 },
  bar: {
    height: 40,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  barMain: { flex: 1, height: 40, justifyContent: "center" },
  barFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  barContent: {
    paddingHorizontal: 12,
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
  close: {
    height: 48,
    borderRadius: 100,
    overflow: "hidden",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
