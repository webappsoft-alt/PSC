import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";

import fonts from "../../../../assets/fonts";
import { SlidingSegmentControl } from "../../../../components/Auth/SlidingSegmentControl";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import LogoAvatar from "../../../../components/LogoAvatar";
import { get } from "../../../../services/ApiRequest";
import { COLORS } from "../../../../utils/COLORS";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const INK = "#121212";
const W4 = "rgba(255, 255, 255, 0.04)";
const W8 = "rgba(255, 255, 255, 0.08)";
const W16 = "rgba(255, 255, 255, 0.16)";
const W48 = "rgba(255, 255, 255, 0.48)";
const W64 = "rgba(255, 255, 255, 0.64)";
const GRID = "rgba(242, 242, 242, 0.2)";
const UP = "#37B874";
const DOWN = "#EE1045";
const X = (fs) => fs * 0.35;

const T = ({ fs, ls = 0, ff = fonts.regular, color = "#FFFFFF", ...rest }) => (
  <CustomText fontSize={fs} letterSpacing={ls} fontFamily={ff} color={color} marginTop={-X(fs)} marginBottom={-X(fs)} {...rest} />
);

// Figma graph group 351 × 153: plot 311 × 132 (4 grid lines 44 apart),
// 16 gap + 24 y-labels on the right, x-labels 14 below the plot
const PLOT_H = 132;
const Y_LABEL_W = 24; // Figma label column; grows for longer labels (e.g. -12.5%)
const PLOT_GAP = 16;
const N = 64;
// line inset top / bottom = half a label line, so the extreme points sit on
// the centres of the top / bottom labels and the 2pt stroke is never cut
const EDGE = 3.5; // every series is resampled to N points so ranges can morph

const money = (v, cur) => {
  if (v == null) return "";
  const sym = { USD: "$", EUR: "€", GBP: "£", CHF: "CHF " }[cur] ?? "";
  return `${sym}${Number(v).toFixed(2)}`;
};
const signed = (v, digits = 2) => `${v >= 0 ? "+" : ""}${Number(v).toFixed(digits)}`;

// round steps (× 10ⁿ), smallest first — enough of them that the line
// fills most of the chart height
const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];
const nextNice = (step) => {
  const mag = 10 ** Math.floor(Math.log10(step) + 1e-9);
  const m = step / mag;
  const i = NICE.findIndex((n) => n > m + 1e-9);
  return i === -1 ? 10 * mag : NICE[i] * mag;
};
const firstNice = (span) => {
  const raw = Math.max(span, 0.0001) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [...NICE, 10].map((m) => m * mag).find((m) => m >= raw - 1e-9);
};

/**
 * Change since the first point, in %, on a round 5-label axis (Figma Y
 * value: 0% · 10% · 20% · 30% · 40%) → resampled to N points, normalised
 * 0..1 inside that axis (0 = bottom label, 1 = top label).
 */
const resample = (points) => {
  if (!points?.length) return { ys: new Array(N).fill(0.5), lo: 0, hi: 1, step: 0.25 };
  const base = points[0].v || 1;
  const pcts = points.map((p) => ((p.v - base) / base) * 100);
  const min = Math.min(...pcts);
  const max = Math.max(...pcts);
  // smallest round step whose 4 intervals hold every point (a bigger step
  // is tried until both the lowest and the highest point fit)
  let step = firstNice(max - min);
  let lo = Math.floor(min / step + 1e-9) * step;
  while (lo + 4 * step < max - 1e-9) {
    step = nextNice(step);
    lo = Math.floor(min / step + 1e-9) * step;
  }
  const hi = lo + 4 * step;
  const ys = [];
  for (let i = 0; i < N; i++) {
    const pos = (i / (N - 1)) * (pcts.length - 1);
    const a = Math.floor(pos);
    const b = Math.min(pcts.length - 1, a + 1);
    const v = pcts[a] + (pcts[b] - pcts[a]) * (pos - a);
    ys.push((v - lo) / (hi - lo));
  }
  return { ys, lo, hi, step, pcts };
};

const xLabelFormat = (range) =>
  range === "1D" ? "HH:mm" : range === "1W" ? "ddd" : range === "1M" || range === "3M" ? "D MMM" : "MMM";

/**
 * Stock section (Figma Profile-Premium+ 8064:13706, "Frame 2085664250"):
 * logo · name SemiBold 16 −0.64 · exchange pill · ticker • currency ·
 * price SemiBold 24 −0.96 · change SemiBold 12 green/red · after hours ·
 * 1D–YTD switcher + calendar (custom start date) · area chart with % axis ·
 * source. Changing the range morphs the line (Pinterest "X Stock Graph").
 */
const CompanyStockSection = ({ userId, logo, initialData }) => {
  const [range, setRange] = useState(initialData?.range || "1M");
  const [from, setFrom] = useState(null);
  const [data, setData] = useState(initialData || null);
  const [pickOpen, setPickOpen] = useState(false);
  const [width, setWidth] = useState(0);
  const [yAxisW, setYAxisW] = useState(Y_LABEL_W);
  const [touch, setTouch] = useState(null); // index into points
  const req = useRef(0);
  // prefetched ranges → instant switch + morph (seeded with the range the
  // About tab loaded together with the profile)
  const byRange = useRef(initialData?.range ? { [initialData.range]: initialData } : {});

  // path morph: previous → next normalised ys
  const prevYs = useSharedValue(new Array(N).fill(0.5));
  const nextYs = useSharedValue(new Array(N).fill(0.5));
  const t = useSharedValue(1);
  const initPts = initialData?.points || [];
  // 1 = rising (green), 0 = falling (red); starts on the loaded range's colour
  const upT = useSharedValue(initPts.length > 1 && initPts[initPts.length - 1].v < initPts[0].v ? 0 : 1);

  const fetchRange = useCallback(
    async (r, f) => {
      const q = r === "custom" && f ? `range=custom&from=${f}` : `range=${r}`;
      const res = await get(`career/about/${userId}/stock?${q}`);
      return res?.data?.data || null;
    },
    [userId],
  );

  useEffect(() => {
    const key = range === "custom" ? `custom:${from}` : range;
    const hit = byRange.current[key];
    if (hit) {
      setData(hit);
      return;
    }
    const id = ++req.current;
    fetchRange(range, from)
      .then((d) => {
        if (d && !d.error) byRange.current[key] = d;
        if (id === req.current) setData(d);
      })
      .catch((e) => console.log("stock error", e));
  }, [fetchRange, range, from]);

  // after the first range shows, quietly fetch the others one by one (the
  // backend caches them for every viewer, so this is cheap after the first)
  const prefetched = useRef(false);
  useEffect(() => {
    if (prefetched.current || !data?.ranges || data.error) return;
    prefetched.current = true;
    (async () => {
      for (const r of data.ranges) {
        if (byRange.current[r]) continue;
        try {
          const d = await fetchRange(r);
          if (d && !d.error) byRange.current[r] = d;
        } catch (e) {
          // ignore: the range loads on tap instead
        }
      }
    })();
  }, [data, fetchRange]);

  const shape = useMemo(() => resample(data?.points), [data]);

  const firstShape = useRef(true);
  useEffect(() => {
    if (!data?.points?.length) return;
    // first render: draw the line in place (no morph from a flat line)
    if (firstShape.current) {
      firstShape.current = false;
      prevYs.value = shape.ys;
      nextYs.value = shape.ys;
      t.value = 1;
      return;
    }
    // current on-screen line becomes the start of the next morph
    const p = t.value;
    const onScreen = prevYs.value.map((y, i) => y + (nextYs.value[i] - y) * p);
    prevYs.value = onScreen;
    nextYs.value = shape.ys;
    t.value = 0;
    t.value = withTiming(1, { duration: 650, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, [shape]);

  const plotW = Math.max(0, width - yAxisW - PLOT_GAP);

  const lineProps = useAnimatedProps(() => {
    let d = "";
    for (let i = 0; i < N; i++) {
      const y = prevYs.value[i] + (nextYs.value[i] - prevYs.value[i]) * t.value;
      const px = (i / (N - 1)) * plotW;
      const py = EDGE + (1 - y) * (PLOT_H - 2 * EDGE);
      d += `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    return { d, stroke: interpolateColor(upT.value, [0, 1], [DOWN, UP]) };
  });
  // green and red fills cross-fade when the trend flips (path inlined in
  // each worklet so both re-run on every frame of the morph)
  const upAreaProps = useAnimatedProps(() => {
    let d = "";
    for (let i = 0; i < N; i++) {
      const y = prevYs.value[i] + (nextYs.value[i] - prevYs.value[i]) * t.value;
      const px = (i / (N - 1)) * plotW;
      const py = EDGE + (1 - y) * (PLOT_H - 2 * EDGE);
      d += `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    d += `L${plotW} ${PLOT_H}L0 ${PLOT_H}Z`;
    return { d, opacity: upT.value };
  });
  const downAreaProps = useAnimatedProps(() => {
    let d = "";
    for (let i = 0; i < N; i++) {
      const y = prevYs.value[i] + (nextYs.value[i] - prevYs.value[i]) * t.value;
      const px = (i / (N - 1)) * plotW;
      const py = EDGE + (1 - y) * (PLOT_H - 2 * EDGE);
      d += `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    d += `L${plotW} ${PLOT_H}L0 ${PLOT_H}Z`;
    return { d, opacity: 1 - upT.value };
  });

  const points = data?.points || [];
  const up = points.length > 1 ? points[points.length - 1].v >= points[0].v : (data?.change ?? 0) >= 0;
  useEffect(() => {
    upT.value = withTiming(up ? 1 : 0, { duration: 650 });
  }, [up, upT]);
  // as many decimals as the step needs (10 → 0, 2.5 → 1, 0.25 → 2)
  const yDigits = [0, 1, 2, 3].find((d) => Math.abs(Math.round(shape.step * 10 ** d) - shape.step * 10 ** d) < 1e-6) ?? 2;
  const yLabels = [4, 3, 2, 1, 0].map((k) => {
    const n = Number((shape.lo + shape.step * k).toFixed(yDigits));
    return `${n === 0 ? 0 : n}%`;
  });
  const xLabels = useMemo(() => {
    if (!points.length) return [];
    const count = 6;
    return Array.from({ length: count }, (_, i) => {
      const p = points[Math.round((i / (count - 1)) * (points.length - 1))];
      return moment(p.t).format(xLabelFormat(range));
    });
  }, [points, range]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => runOnJS(setTouch)(e.x))
    .onUpdate((e) => runOnJS(setTouch)(e.x))
    .onFinalize(() => runOnJS(setTouch)(null));

  if (!data || data.error || !points.length) return null;

  // tooltip: nearest real point to the finger
  let tip = null;
  if (touch != null && plotW > 0) {
    const ratio = Math.max(0, Math.min(1, touch / plotW));
    const idx = Math.round(ratio * (points.length - 1));
    const p = points[idx];
    const yN = (shape.pcts[idx] - shape.lo) / (shape.hi - shape.lo || 1);
    tip = {
      x: ratio * plotW,
      y: EDGE + (1 - yN) * (PLOT_H - 2 * EDGE),
      date: moment(p.t).format(range === "1D" || range === "1W" ? "D MMM HH:mm" : "D MMM YYYY"),
      price: money(p.v, data.currency),
    };
  }

  const changeUp = (data.change ?? 0) >= 0;
  const items = [...data.ranges.map((k) => ({ key: k, label: k }))];

  return (
    <View style={styles.section}>
      <View style={styles.top}>
        <View style={styles.identity}>
          {logo ? <LogoAvatar uri={logo} size={32} radius={0} /> : null}
          <View style={styles.idText}>
            <View style={styles.nameRow}>
              <T fs={16} ls={-0.64} ff={fonts.semiBold} label={data.name} numberOfLines={1} containerStyle={styles.shrink} />
              {!!data.exchange && (
                <View style={styles.pill}>
                  <T fs={10} ff={fonts.medium} color={W64} label={data.exchange} />
                </View>
              )}
            </View>
            <View style={styles.meta}>
              {[data.ticker, data.currency].filter(Boolean).map((m, i) => (
                <View key={m} style={styles.meta}>
                  {i > 0 && <View style={styles.dot} />}
                  <T fs={12} ls={-0.48} color={W48} label={m} />
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.priceBlock}>
          <T fs={24} ls={-0.96} ff={fonts.semiBold} label={money(data.price, data.currency)} />
          <View style={styles.changeBlock}>
            <View style={styles.changeRow}>
              <Icons family="MaterialSymbolsRoundedFilled" name={changeUp ? "trending_up" : "trending_down"} size={12} color={changeUp ? UP : DOWN} />
              <T
                fs={12}
                ff={fonts.semiBold}
                color={changeUp ? UP : DOWN}
                label={`${changeUp ? "" : "-"}${money(Math.abs(data.change ?? 0), data.currency)} (${signed(data.changePct ?? 0)}%)`}
              />
            </View>
            {!!data.afterHours && (
              <T
                fs={12}
                color={W48}
                label={`After hours ${money(data.afterHours.price, data.currency)} (${signed(data.afterHours.changePct ?? 0)}%)`}
              />
            )}
          </View>
        </View>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.grow}>
          <SlidingSegmentControl
            items={items}
            selectedKey={range === "custom" ? null : range}
            onChange={(k) => {
              setFrom(null);
              setRange(k);
            }}
            trackColor={W4}
            pillColor={W8}
            activeLabelColor="#FFFFFF"
            inactiveLabelColor="#F2F2F2"
            height={36}
            padding={2}
            gap={0}
            labelStyle={styles.segLabel}
            activeLabelStyle={styles.segLabelActive}
          />
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPickOpen(true)}
          style={[styles.calendar, range === "custom" && { backgroundColor: W8 }]}
        >
          <Icons family="MaterialSymbolsRounded" name="date_range" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.graphRow}>
          <GestureDetector gesture={pan}>
            <View style={{ width: plotW, height: PLOT_H }}>
              {plotW > 0 && (
                <Svg width={plotW} height={PLOT_H}>
                  <Defs>
                    <LinearGradient id="stockUp" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={UP} stopOpacity={0.32} />
                      <Stop offset="1" stopColor={UP} stopOpacity={0} />
                    </LinearGradient>
                    <LinearGradient id="stockDown" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={DOWN} stopOpacity={0.32} />
                      <Stop offset="1" stopColor={DOWN} stopOpacity={0} />
                    </LinearGradient>
                  </Defs>
                  {[0, 1, 2, 3].map((k) => (
                    <Line key={k} x1={0} x2={plotW} y1={k * 44 + 0.5} y2={k * 44 + 0.5} stroke={GRID} strokeWidth={1} />
                  ))}
                  <AnimatedPath animatedProps={upAreaProps} fill="url(#stockUp)" />
                  <AnimatedPath animatedProps={downAreaProps} fill="url(#stockDown)" />
                  <AnimatedPath animatedProps={lineProps} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                  {tip && <Line x1={tip.x} x2={tip.x} y1={0} y2={PLOT_H} stroke={GRID} strokeWidth={1} />}
                </Svg>
              )}
              {tip && (
                <>
                  <View style={[styles.tipDot, { left: tip.x - 4, top: tip.y - 4 }]} />
                  <View style={[styles.tipBox, tip.x > plotW / 2 ? { right: plotW - tip.x + 8 } : { left: tip.x + 8 }]}>
                    <T fs={8} ff={fonts.bold} label={tip.date.toUpperCase()} />
                    <T fs={10} ff={fonts.bold} label={tip.price} />
                  </View>
                </>
              )}
            </View>
          </GestureDetector>
          <Animated.View key={`y-${range}-${from}`} entering={FadeIn.duration(320)} exiting={FadeOut.duration(160)} style={styles.yAxis} onLayout={(e) => setYAxisW(Math.max(Y_LABEL_W, Math.ceil(e.nativeEvent.layout.width)))}>
            {yLabels.map((l, i) => (
              <T key={i} fs={10} ff={fonts.medium} color="#DFDFDF" label={l} numberOfLines={1} />
            ))}
          </Animated.View>
        </View>
        <Animated.View key={`x-${range}-${from}`} entering={FadeIn.duration(320)} style={[styles.xAxis, { width: plotW }]}>
          {xLabels.map((l, i) => (
            <T key={i} fs={10} ff={fonts.medium} color="#BFBFBF" label={l} />
          ))}
        </Animated.View>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.source}
        onPress={() => data.source?.url && Linking.openURL(data.source.url).catch(() => {})}
      >
        <T fs={12} ls={-0.24} label={`Source: ${data.source?.name || ""}`} />
        <Icons family="MaterialSymbolsRounded" name="link" size={12} color="#FFFFFF" />
      </TouchableOpacity>

      <DatePicker
        modal
        open={pickOpen}
        mode="date"
        date={from ? new Date(from) : moment().subtract(1, "month").toDate()}
        maximumDate={moment().subtract(1, "day").toDate()}
        minimumDate={moment().subtract(10, "years").toDate()}
        title="Show prices since"
        theme="dark"
        buttonColor={COLORS.buttonColor}
        confirmButtonColor={COLORS.buttonColor}
        onConfirm={(d) => {
          setPickOpen(false);
          setFrom(moment(d).format("YYYY-MM-DD"));
          setRange("custom");
        }}
        onCancel={() => setPickOpen(false)}
      />
    </View>
  );
};

export default CompanyStockSection;

const styles = StyleSheet.create({
  // Figma: #121212, padding 12, gap 16
  section: { backgroundColor: INK, padding: 12, gap: 16 },
  grow: { flex: 1 },
  shrink: { flexShrink: 1 },
  top: { gap: 12 },
  identity: { flexDirection: "row", alignItems: "center", gap: 8 },
  idText: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pill: { height: 16, borderRadius: 4, paddingHorizontal: 4, backgroundColor: W4, justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 3, height: 3, borderRadius: 100, backgroundColor: W16 },
  priceBlock: { gap: 8 },
  changeBlock: { gap: 4 },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  segLabel: { fontSize: 12, lineHeight: 14, letterSpacing: 0, fontFamily: fonts.regular },
  segLabelActive: { fontFamily: fonts.semiBold },
  calendar: { width: 36, height: 36, borderRadius: 100, backgroundColor: W4, alignItems: "center", justifyContent: "center" },
  graphRow: { flexDirection: "row", gap: PLOT_GAP },
  // Figma: 5 labels, left aligned, 16 after the plot, spread over its height
  yAxis: { minWidth: Y_LABEL_W, height: PLOT_H, justifyContent: "space-between", alignItems: "flex-start" },
  xAxis: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  tipDot: { position: "absolute", width: 8, height: 8, borderRadius: 100, backgroundColor: "#F2F2F2" },
  tipBox: { position: "absolute", top: 3, padding: 8, gap: 8, borderRadius: 8, backgroundColor: W4, borderWidth: 1, borderColor: W4 },
  source: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start" },
});
