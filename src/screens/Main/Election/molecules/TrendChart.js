import moment from "moment";
import { memo, useCallback, useMemo, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import fonts from "../../../../assets/fonts";
import { EL, Fit, GlassFill, Txt, colorOf } from "./electionLayout";
import CustomText from "../../../../components/CustomText";
import { fitLine } from "../../TvShow/molecules/showsLayout";

/**
 * Figma "Graph" (8170:1841), 351 × 180:
 *  · plot 317 × 132 at y 27 (lines 2pt, area colour 32% → 0% top → bottom)
 *  · 4 grid lines 311 wide, 44 apart, #F2F2F2 20% at 62% opacity
 *  · y labels (Medium 10 #DFDFDF) in a 24 column at x 327, centres 33.5 →
 *    156.5; x labels (Medium 10 #BFBFBF) space-between under the plot (y 173)
 *  · tooltip (Frame 102): 93 · pad 8 · gap 8 · white 4% + 1 inside 4% · r8 ·
 *    shadow 0/4/8 25% · blur 16; date Bold 8 UPPER; rows dot 6 · 2 · name
 *    Medium 10 @64 · 4 · value Bold 10; line 33 #F2F2F2 20%; dot 8 #F2F2F2
 * Client: "Graph with candidates colors" — the top 4 candidates (as in Figma).
 */
const H = 180;
const PLOT_TOP = 27;
const PLOT_H = 132;
const PLOT_BOTTOM = PLOT_TOP + PLOT_H;
const AXIS_W = 34; // 351 − 317
const GRID_INSET = 6; // 317 − 311
const Y_TOP = 33.5; // label centres (Figma 40% … 0%)
const Y_BOTTOM = 156.5;
const X_LABELS_TOP = 173;
const SERIES = 4;
const TIP_W = 93;
const TIP_TO_DOT = 111; // tooltip top → dot centre (70 + 2 + 33 + 2 + 4)
const TIP_LINE = 33; // Figma Line 12: 33 long, 2 above the 8pt dot
// Figma X Value: 7 labels, 20 wide, space-between → centres 10 … plotW − 10
const X_LABEL_W = 20;
const X_LABEL_BOX = 48; // wide enough for "HH:mm" / "D MMM", centred on the Figma centre

const niceMax = (v) => Math.max(10, Math.ceil((Number(v) || 0) / 10) * 10);

/** cardinal spline through the points → cubic béziers, clamped to the plot */
const smoothPath = (pts) => {
  if (!pts.length) return "";
  if (pts.length === 1) return `M${pts[0].x} ${pts[0].y}`;
  const k = 0.2;
  const clampY = (y) => Math.min(PLOT_BOTTOM, Math.max(PLOT_TOP, y));
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) * k;
    const c1y = clampY(p1.y + (p2.y - p0.y) * k);
    const c2x = p2.x - (p3.x - p1.x) * k;
    const c2y = clampY(p2.y - (p3.y - p1.y) * k);
    d += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
};

const xFormat = (range) => {
  switch (range) {
    case "1D":
      return "HH:mm";
    case "1W":
      return "ddd";
    case "1M":
      return "D MMM";
    default:
      return "MMM";
  }
};

const lastName = (r) =>
  r?.user?.lastName || String(r?.name || "").split(" ").slice(-1)[0] || r?.shortLabel || "";

const TrendChart = ({ trend, results, totalVotes, loading, skeletonOpacity }) => {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);
  const plotW = Math.max(0, width - AXIS_W);
  const points = Array.isArray(trend?.points) ? trend.points.filter((p) => p && p.t) : [];
  const series = (Array.isArray(results) ? results : []).slice(0, SERIES);
  const hasData = Number(totalVotes) > 0 && points.length > 1 && series.length > 0;

  const maxY = useMemo(() => {
    let m = 0;
    points.forEach((p) =>
      series.forEach((s) => {
        m = Math.max(m, Number(p?.shares?.[s.optionId]) || 0);
      }),
    );
    return niceMax(m);
  }, [points, series]);

  const yOf = useCallback(
    (v) => Y_BOTTOM - (Math.min(maxY, Math.max(0, Number(v) || 0)) / maxY) * (Y_BOTTOM - Y_TOP),
    [maxY],
  );
  const xOf = useCallback(
    (i) => (points.length > 1 ? (i / (points.length - 1)) * plotW : 0),
    [points.length, plotW],
  );

  const paths = useMemo(() => {
    if (!hasData || !plotW) return [];
    return series.map((s) => {
      const pts = points.map((p, i) => ({ x: xOf(i), y: yOf(p?.shares?.[s.optionId]) }));
      const line = smoothPath(pts);
      const area = `${line} L${plotW} ${PLOT_BOTTOM} L0 ${PLOT_BOTTOM} Z`;
      return { id: String(s.optionId), color: colorOf(s), line, area };
    });
  }, [hasData, plotW, series, points, xOf, yOf]);

  const xLabels = useMemo(() => {
    if (points.length < 2) return [];
    const a = new Date(points[0].t).getTime();
    const b = new Date(points[points.length - 1].t).getTime();
    const fmt = xFormat(trend?.range);
    return Array.from({ length: 7 }, (_, i) => moment(a + ((b - a) * i) / 6).format(fmt));
  }, [points, trend?.range]);

  const touch = useCallback(
    (e) => {
      if (!hasData || !plotW) return;
      const x = e?.nativeEvent?.locationX ?? 0;
      const i = Math.round((Math.min(plotW, Math.max(0, x)) / plotW) * (points.length - 1));
      setActive(Math.min(points.length - 1, Math.max(0, i)));
    },
    [hasData, plotW, points.length],
  );

  const tip = active != null && hasData && points[active] ? points[active] : null;
  const tipX = tip ? xOf(active) : 0;
  const dotY = tip ? yOf(tip.shares?.[series[0]?.optionId]) : 0;
  const tipTop = Math.max(0, dotY - TIP_TO_DOT);
  const tipLeft = Math.min(Math.max(0, tipX - TIP_W / 2), Math.max(0, width - TIP_W));

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {/* grid */}
      {[0, 44, 88, 132].map((y) => (
        <View
          key={y}
          // Figma lines: 1pt CENTER stroke → centred on the line's y
          style={[styles.grid, { top: PLOT_TOP + y - 0.5, width: Math.max(0, plotW - GRID_INSET) }]}
        />
      ))}
      {/* y labels */}
      {[0, 1, 2, 3, 4].map((i) => {
        const v = Math.round((maxY * (4 - i)) / 4);
        const cy = Y_TOP + ((Y_BOTTOM - Y_TOP) * i) / 4;
        return (
          <View key={i} style={[styles.yLabel, { top: cy - 7, left: Math.max(0, width - 24) }]}>
            <Fit size={10} box={14} label={`${v}%`} fontFamily={fonts.medium} color={EL.axisY} />
          </View>
        );
      })}

      {loading ? (
        <Animated.View style={[styles.plot, styles.skeleton, { width: plotW, opacity: skeletonOpacity }]} />
      ) : hasData && plotW ? (
        <View
          style={[styles.plotTouch, { width: plotW }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={touch}
          onResponderMove={touch}
          onResponderTerminationRequest={() => true}
        >
          <Svg width={plotW} height={H} pointerEvents="none">
            <Defs>
              {paths.map((p) => (
                <LinearGradient key={p.id} id={`g${p.id}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={p.color} stopOpacity={0.32} />
                  <Stop offset="1" stopColor={p.color} stopOpacity={0} />
                </LinearGradient>
              ))}
            </Defs>
            {paths.map((p) => (
              <Path key={`a${p.id}`} d={p.area} fill={`url(#g${p.id})`} />
            ))}
            {paths.map((p) => (
              <Path
                key={`l${p.id}`}
                d={p.line}
                fill="none"
                stroke={p.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
        </View>
      ) : (
        <View style={[styles.plot, styles.empty, { width: plotW }]}>
          <Txt size={12} label="No votes yet" color={EL.white64} />
        </View>
      )}

      {/* x labels */}
      {hasData && !loading ? (
        <View pointerEvents="none" style={[styles.xLabels, { width: plotW }]}>
          {xLabels.map((l, i) => {
            const cx =
              X_LABEL_W / 2 + ((plotW - X_LABEL_W) * i) / Math.max(1, xLabels.length - 1);
            return (
              <View key={i} style={[styles.xLabel, { left: cx - X_LABEL_BOX / 2 }]}>
                <CustomText
                  fontSize={10}
                  label={l}
                  fontFamily={fonts.medium}
                  color={EL.axisX}
                  textAlign="center"
                  numberOfLines={1}
                  marginTop={fitLine(10, 7)}
                  marginBottom={fitLine(10, 7)}
                />
              </View>
            );
          })}
        </View>
      ) : null}

      {/* tooltip */}
      {tip && !loading ? (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.tipLine,
              {
                left: tipX - 0.5,
                top: tipTop + 72,
                height: Math.max(0, Math.min(TIP_LINE, dotY - 4 - 2 - (tipTop + 72))),
              },
            ]}
          />
          <View pointerEvents="none" style={[styles.dot, { left: tipX - 4, top: dotY - 4 }]} />
          <View pointerEvents="none" style={[styles.tip, { left: tipLeft, top: tipTop }]}>
            <GlassFill fill={EL.white04} borderRadius={8} />
            <Fit
              size={8}
              box={6}
              label={moment(tip.t).format(trend?.range === "1D" ? "D MMM YYYY · HH:mm" : "D MMM YYYY")}
              fontFamily={fonts.bold}
              textTransform="uppercase"
              color={EL.white}
            />
            <View style={{ gap: 4 }}>
              {series.map((s) => (
                <View key={String(s.optionId)} style={styles.tipRow}>
                  <View style={styles.tipName}>
                    <View style={[styles.tipDot, { backgroundColor: colorOf(s) }]} />
                    <Fit
                      size={10}
                      box={7}
                      label={lastName(s)}
                      fontFamily={fonts.medium}
                      color={EL.white64}
                      containerStyle={{ flexShrink: 1 }}
                    />
                  </View>
                  <Fit
                    size={10}
                    box={7}
                    label={`${Math.round(Number(tip.shares?.[s.optionId]) || 0)}%`}
                    fontFamily={fonts.bold}
                    color={EL.white}
                  />
                </View>
              ))}
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
};

export default memo(TrendChart);

const styles = StyleSheet.create({
  wrap: { height: H, alignSelf: "stretch" },
  grid: {
    position: "absolute",
    left: 0,
    height: 1,
    backgroundColor: "rgba(242, 242, 242, 0.2)",
    opacity: 0.62,
  },
  // Figma Y value: left-aligned at plot width + 4, 24 wide — hugs so "100%"
  // (wider than 24 in Poppins) runs into the 12 section padding, never "10…"
  yLabel: {
    position: "absolute",
    minWidth: 24,
    height: 14,
    justifyContent: "center",
  },
  plot: {
    position: "absolute",
    left: 0,
    top: PLOT_TOP,
    height: PLOT_H,
  },
  plotTouch: { position: "absolute", left: 0, top: 0, height: H },
  skeleton: { backgroundColor: EL.white04, borderRadius: 8 },
  empty: { alignItems: "center", justifyContent: "center" },
  xLabels: {
    position: "absolute",
    left: 0,
    top: X_LABELS_TOP,
    height: 7,
  },
  xLabel: { position: "absolute", top: 0, width: X_LABEL_BOX },
  tip: {
    position: "absolute",
    width: TIP_W,
    padding: 8,
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: EL.white04,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "space-between" },
  tipName: { flexDirection: "row", alignItems: "center", gap: 2, flexShrink: 1 },
  tipDot: { width: 6, height: 6, borderRadius: 3 },
  tipLine: { position: "absolute", width: 1, backgroundColor: "rgba(242, 242, 242, 0.2)" },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EL.offWhite,
  },
});
