import { useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, View } from "react-native";
import { AUDIO } from "./audioLayout";

/**
 * Figma "Group 1000005266" (record › edit, 351 × 48): strip 44 (#121212
 * 64%, 1pt white 16% inside, r12) whose unselected part is #262626 with
 * 4-wide bars (gap 4) at white 16%; the selection is a 48-tall blue frame
 * (r8, 1pt white 16%, pad 2) with 2 × 16 #121212 handles and a #262626
 * r4 inside whose bars are white. Drag either edge to trim; tap to play /
 * pause the preview — played bars stay white, the rest dims (Slack style).
 */
const BAR = 4;
const GAP = 4;
const PAD = 8; // first bar 8 in from the strip edge (Figma inner pad)
const LIP = 8; // blue edge of the selection (2 pad + 2 handle + 4)
const MIN_BAR = 6;
const MAX_BAR = 22;
const MIN_SELECTION = 48;

const resample = (peaks, count) => {
  if (!count) return [];
  if (!peaks?.length) return Array.from({ length: count }, (_, i) => (i % 3 === 2 ? 1 : 0.4));
  return Array.from({ length: count }, (_, i) => {
    const from = Math.floor((i / count) * peaks.length);
    const to = Math.max(from + 1, Math.floor(((i + 1) / count) * peaks.length));
    let peak = 0;
    for (let j = from; j < to && j < peaks.length; j += 1) peak = Math.max(peak, peaks[j] || 0);
    return peak;
  });
};

const WaveformTrimmer = ({
  waveform,
  durationMs = 0,
  startMs = 0,
  endMs = 0,
  // playhead (ms) while previewing: played bars white, the rest white 48%
  positionMs = 0,
  onChange,
  onPress,
  disabled,
}) => {
  const [width, setWidth] = useState(0);
  const count = width > 0 ? Math.max(1, Math.floor((width - PAD * 2 + GAP) / (BAR + GAP))) : 0;
  const bars = useMemo(() => resample(waveform, count), [waveform, count]);

  const toX = (ms) => (durationMs > 0 ? (ms / durationMs) * width : 0);
  const toMs = (x) => (width > 0 ? Math.max(0, Math.min(1, x / width)) * durationMs : 0);
  const playX = toX(positionMs);
  const left = durationMs > 0 ? toX(startMs) : 0;
  const right =
    durationMs > 0
      ? Math.max(left + MIN_SELECTION, toX(endMs || durationMs))
      : width;

  // live values for the responders (refreshed every render); the drag
  // origin lives in its own ref so a re-render mid-drag doesn't lose it
  const live = useRef({});
  live.current = { left, right, width, startMs, endMs, onChange, toMs };
  const origin = useRef(0);

  const makeResponder = (edge) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        origin.current = edge === "left" ? live.current.left : live.current.right;
      },
      onPanResponderMove: (_, g) => {
        const v = live.current;
        const x = origin.current + g.dx;
        if (edge === "left") {
          const nx = Math.max(0, Math.min(x, v.right - MIN_SELECTION));
          v.onChange?.(v.toMs(nx), v.endMs);
        } else {
          const nx = Math.min(v.width, Math.max(x, v.left + MIN_SELECTION));
          v.onChange?.(v.startMs, v.toMs(nx));
        }
      },
    });
  const leftResponder = useRef(makeResponder("left")).current;
  const rightResponder = useRef(makeResponder("right")).current;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={styles.wrap}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.strip}>
        <View style={styles.stripInner} />
      </View>

      {width > 0 ? (
        <View style={[styles.selection, { left, width: right - left }]}>
          <View style={[styles.handle, styles.handleLeft]} />
          <View style={styles.selectionInner} />
          <View style={[styles.handle, styles.handleRight]} />
        </View>
      ) : null}

      <View pointerEvents="none" style={styles.bars}>
        {bars.map((peak, i) => {
          const x = PAD + i * (BAR + GAP);
          const mid = x + BAR / 2;
          const inLip =
            (mid >= left && mid < left + LIP) || (mid > right - LIP && mid <= right);
          const selected = mid >= left + LIP && mid <= right - LIP;
          const played = positionMs > 0 && mid <= playX;
          const h = MIN_BAR + (MAX_BAR - MIN_BAR) * Math.max(0, Math.min(1, peak));
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  left: x,
                  top: (48 - h) / 2,
                  height: h,
                  backgroundColor: selected
                    ? positionMs > 0 && !played
                      ? AUDIO.white48
                      : AUDIO.white
                    : AUDIO.white16,
                  opacity: inLip ? 0 : 1,
                },
              ]}
            />
          );
        })}
      </View>

      {width > 0 ? (
        <>
          <View
            {...leftResponder.panHandlers}
            hitSlop={{ top: 8, bottom: 8, left: 12 }}
            style={[styles.grip, { left: left - 8 }]}
          />
          <View
            {...rightResponder.panHandlers}
            hitSlop={{ top: 8, bottom: 8, right: 12 }}
            style={[styles.grip, { left: right - 16 }]}
          />
        </>
      ) : null}
    </Pressable>
  );
};

export default WaveformTrimmer;

const styles = StyleSheet.create({
  wrap: { height: 48, alignSelf: "stretch" },
  strip: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 2,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AUDIO.white16,
    backgroundColor: AUDIO.dark64,
    overflow: "hidden",
  },
  stripInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 11,
    backgroundColor: AUDIO.surface,
  },
  selection: {
    position: "absolute",
    top: 0,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AUDIO.white16,
    backgroundColor: AUDIO.blue,
    padding: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  selectionInner: {
    position: "absolute",
    left: 7, // 8 from the outer edge (1pt stroke inside)
    right: 7,
    top: 1,
    bottom: 1,
    borderRadius: 4,
    backgroundColor: AUDIO.surface,
  },
  handle: {
    position: "absolute",
    top: 15,
    width: 2,
    height: 16,
    borderRadius: 4,
    backgroundColor: AUDIO.dark,
  },
  handleLeft: { left: 1 },
  handleRight: { right: 1 },
  bars: { ...StyleSheet.absoluteFillObject },
  bar: { position: "absolute", width: BAR, borderRadius: 100 },
  grip: { position: "absolute", top: 0, width: 24, height: 48 },
});
