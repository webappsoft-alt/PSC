import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Path } from "react-native-svg";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import {
  DEPARTEMENTS,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "../../../../components/Election/franceDepartements";
import {
  BulletList,
  EL,
  Fit,
  Glyph,
  MSF,
  RATINGS,
  RATING_ALPHA,
  Section,
  SectionTitle,
  Txt,
  colorOf,
  formatPercent,
  formatPopulation,
  ratingLabel,
  toTitle,
  trim,
  withAlpha,
} from "./electionLayout";
import FlagImage from "../../../../components/FlagImage";

/**
 * Figma Polling Map (8116:5778) and the département territory card
 * (8127:7188). Map geometry: franceDepartements (664 × 636, Figma map at 2×).
 */

// Figma map component (8127:8203): 332 × 318 in a 351 × 344 box, pad 12
const NATIONAL_MAP_W = MAP_WIDTH / 2;
const NATIONAL_MAP_H = MAP_HEIGHT / 2;
// départements with no votes: Figma fill white 16%, stroke white 48% 1pt
const EMPTY_FILL = "rgba(255, 255, 255, 0.16)";
const DEP_STROKE = "rgba(255, 255, 255, 0.48)";

/**
 * Client: "Color based on count of votes per candidates, color opacity based
 * on higher candidate percentage" — leader's colour, opacity from the
 * leader's share (25 % … 100 %, the legend's Tilt → Solid range).
 */
export const leaderOpacity = (leaderPercent) => {
  const p = Math.min(100, Math.max(0, Number(leaderPercent) || 0)) / 100;
  return 0.25 + 0.75 * p;
};

/** bounding box of an "M x y l dx dy … z" path (the only commands used) */
export const pathBBox = (d) => {
  const tokens = String(d || "").match(/[MLlmz]|-?\d*\.?\d+/g) || [];
  let cmd = null;
  let x = 0;
  let y = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/[MLlmz]/.test(t)) {
      cmd = t;
      continue;
    }
    const a = Number(t);
    const b = Number(tokens[i + 1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    i += 1;
    if (cmd === "M" || cmd === "L") {
      x = a;
      y = b;
      if (cmd === "M") cmd = "L";
    } else {
      x += a;
      y += b;
      if (cmd === "m") cmd = "l";
    }
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT };
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
};

/* ─────────────────────── legend (Figma Frame 2085664243) ─────────────────────── */

/** Solid / Likely / Leaning / Tilt + one 4pt bar row per top-2 candidate */
export const RatingLegend = ({ candidates }) => {
  const rows = (candidates || []).filter(Boolean).slice(0, 2);
  return (
    <View style={styles.legend}>
      <View style={styles.legendLabels}>
        {RATINGS.map((r) => (
          <View key={r} style={styles.legendCell}>
            <Fit size={12} box={8} label={r} color={EL.white64} />
          </View>
        ))}
      </View>
      {rows.map((c) => (
        <View key={c.optionId || c.name} style={styles.legendBars}>
          {RATINGS.map((r) => (
            <View
              key={r}
              style={[styles.legendBar, { backgroundColor: withAlpha(colorOf(c), RATING_ALPHA[r]) }]}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

/* ───────────────────────── national map (8121:6289) ───────────────────────── */

const FranceMap = memo(({ map, colorById, onPressDepartement }) => {
  const byCode = useMemo(() => {
    const m = new Map();
    (Array.isArray(map) ? map : []).forEach((e) => e?.code && m.set(String(e.code), e));
    return m;
  }, [map]);
  return (
    <Svg
      width={NATIONAL_MAP_W}
      height={NATIONAL_MAP_H}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
    >
      {Object.entries(DEPARTEMENTS).map(([code, dep]) => {
        const entry = byCode.get(code);
        const hasVotes = !!entry && Number(entry.totalVotes) > 0 && !!entry.leaderOptionId;
        const color = hasVotes ? colorById.get(String(entry.leaderOptionId)) : null;
        return (
          <Path
            key={code}
            d={dep.d}
            fill={hasVotes && color ? color : EMPTY_FILL}
            fillOpacity={hasVotes && color ? leaderOpacity(entry.leaderPercent) : 1}
            stroke={DEP_STROKE}
            strokeWidth={2}
            strokeLinejoin="round"
            onPress={() => onPressDepartement?.(code, entry || null)}
          />
        );
      })}
    </Svg>
  );
});

/** Polling Map section: title · Key points (AI data) · map · legend */
export const PollingMapSection = ({ keyPoints, map, results, onPressDepartement }) => {
  const colorById = useMemo(
    () => new Map((results || []).map((r) => [String(r.optionId), colorOf(r)])),
    [results],
  );
  const leaderColor = results?.[0] ? colorOf(results[0]) : EL.fallback;
  const points = (Array.isArray(keyPoints) ? keyPoints : []).filter(Boolean);
  return (
    <Section gap={16}>
      <View style={{ gap: 12 }}>
        <SectionTitle label="Polling Map" box={18} />
        {points.length ? (
          <View style={{ gap: 12 }}>
            <Txt size={14} label="Key points" fontFamily={fonts.medium} color={EL.white} />
            <BulletList items={points} />
          </View>
        ) : null}
      </View>
      <View style={{ gap: 12 }}>
        <View>
          <View style={[styles.mapBox, { height: 344 }]}>
            <LinearGradient
              colors={[withAlpha(leaderColor, 0), withAlpha(leaderColor, 0.48)]}
              style={StyleSheet.absoluteFill}
            />
            <FranceMap map={map} colorById={colorById} onPressDepartement={onPressDepartement} />
          </View>
          <View style={[styles.mapBar, { backgroundColor: leaderColor }]} />
        </View>
        <RatingLegend candidates={results} />
      </View>
    </Section>
  );
};

/* ───────────────────── territory card (8127:7188, département) ───────────────────── */

/** "<leader> has a N% chance of winning" — name SemiBold Italic + % Medium in the leader's colour */
export const ChanceLine = ({ leader, chance, size = 14, nameFont = fonts.semiBoldItalic }) => {
  const color = colorOf(leader);
  return (
    <CustomText
      fontSize={size}
      color={EL.white64}
      marginTop={trim(size)}
      marginBottom={trim(size)}
    >
      <Text style={{ fontFamily: nameFont, color }}>{leader?.name || ""}</Text>
      {" has a "}
      <Text style={{ fontFamily: fonts.medium, color }}>
        {formatPercent(chance, 1)}
      </Text>
      {" chance of winning"}
    </CustomText>
  );
};

export const TerritoryCard = ({ territory, results, electionTitle, totalVotes }) => {
  const dep = territory?.code ? DEPARTEMENTS[String(territory.code)] : null;
  const leader =
    (results || []).find((r) => String(r.optionId) === String(territory?.leaderOptionId)) || null;
  const hasVotes = Number(totalVotes) > 0 && !!leader && !!territory?.rating;
  const color = hasVotes ? colorOf(leader) : EL.white16;
  const box = useMemo(() => pathBBox(dep?.d), [dep?.d]);
  // Figma (FR-J 8127:7227): the outline is 325 wide in the 351 square,
  // centred (x 13), keeping its ratio
  const inner = 325;
  const scale = Math.min(inner / box.width, inner / box.height);
  const w = box.width * scale;
  const h = box.height * scale;
  // 1pt around the outline for its stroke; the shape itself stays w × h
  const padPt = 1;
  const pad = padPt / scale; // in viewBox units
  return (
    <Section gap={12}>
      <View style={{ gap: 12 }}>
        {/* name row 28: flag 36 × 24 · 8 · SemiBold 32 / −4% | rating chip */}
        <View style={styles.territoryHead}>
          <View style={[styles.row, styles.flex, { gap: 8 }]}>
            <FlagImage code="fr" width={36} height={24} radius={0} />
            <Fit
              size={32}
              box={22}
              label={toTitle(territory?.name || dep?.name || "")}
              fontFamily={fonts.semiBold}
              letterSpacing={-1.28}
              color={EL.white}
              containerStyle={styles.shrink}
            />
          </View>
          {hasVotes ? (
            <View style={[styles.ratingChip, { backgroundColor: colorOf(leader) }]}>
              <Fit
                size={12}
                box={14}
                label={ratingLabel(territory.rating, leader).toUpperCase()}
                fontFamily={fonts.semiBold}
                color={EL.white}
              />
            </View>
          ) : null}
        </View>
        <Txt
          size={16}
          label={toTitle(electionTitle)}
          fontFamily={fonts.semiBold}
          letterSpacing={-0.64}
          color={EL.white64}
        />
        {hasVotes ? (
          <ChanceLine leader={leader} chance={territory?.chance} />
        ) : (
          <Txt
            size={14}
            label={`No votes yet in ${territory?.name || "this département"}.`}
            color={EL.white64}
          />
        )}
        {Number(territory?.population || dep?.population) > 0 ? (
          <View style={[styles.row, { gap: 4 }]}>
            <Glyph family={MSF} name="group" size={12} color={EL.white48} />
            <Fit size={12} box={8} label="Population:" color={EL.white64} />
            <Fit
              size={12}
              box={8}
              label={`${formatPopulation(territory?.population || dep?.population)} citizens`}
              fontFamily={fonts.medium}
              color={EL.white}
            />
          </View>
        ) : null}
      </View>

      <View style={{ gap: 12 }}>
        <View>
          <View style={[styles.mapBox, { height: 351 }]}>
            <LinearGradient
              colors={[withAlpha(hasVotes ? color : EL.white, 0), withAlpha(hasVotes ? color : EL.white, hasVotes ? 0.48 : 0.04)]}
              style={StyleSheet.absoluteFill}
            />
            {dep ? (
              <Svg
                width={w + padPt * 2}
                height={h + padPt * 2}
                viewBox={`${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`}
              >
                <Path
                  d={dep.d}
                  fill={hasVotes ? color : EMPTY_FILL}
                  stroke="rgba(255, 255, 255, 0.64)"
                  strokeWidth={0.2945 / scale}
                  strokeLinejoin="round"
                />
              </Svg>
            ) : null}
          </View>
          <View style={[styles.mapBar, { backgroundColor: hasVotes ? color : EL.white16 }]} />
        </View>
        <RatingLegend candidates={results} />
      </View>
    </Section>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  mapBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: EL.white04,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mapBar: { height: 4 },
  legend: { gap: 12 },
  legendLabels: { height: 8, flexDirection: "row", justifyContent: "space-between" },
  legendCell: { flex: 1, height: 8, justifyContent: "center" },
  legendBars: { height: 4, flexDirection: "row", gap: 2 },
  legendBar: { flex: 1, height: 4, borderRadius: 100 },
  territoryHead: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  ratingChip: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
