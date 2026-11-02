import { useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import { EdgeProgressiveBlur } from "../../../../components/HeaderProgressiveBlur";
import {
  AUDIO,
  GlassFill,
  Glyph,
  MSF,
  fitLine,
  formatClock,
} from "./audioLayout";

/**
 * Figma "Frame 2085663877" (bottom of Radio-Detail / Audio-Post-Detail):
 * PROGRESSIVE background blur 0 → 16 from the panel's top to its bottom
 * (no hard edge), white 1 % fill, pad 16 / 12 / 34 / 12, gap 24 — speaker
 * content · "Time-Stamp" · controls row. Uses the app's shared progressive
 * blur (components/HeaderProgressiveBlur) with the whole panel as the band.
 */
const PlayerPanel = ({ children, ...player }) => {
  const insets = useSafeAreaInsets();
  const [panelHeight, setPanelHeight] = useState(0);
  return (
    <View
      onLayout={(e) => {
        const h = Math.round(e.nativeEvent.layout.height);
        setPanelHeight((prev) => (prev === h ? prev : h));
      }}
      style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      <EdgeProgressiveBlur
        edge="bottom"
        fade={panelHeight || 242}
        overhang={0}
        color="#FFFFFF"
        fillAlpha={0.01}
      />
      {children}
      <Timeline {...player} />
      <Controls {...player} />
    </View>
  );
};

/**
 * "Time-Stamp" (351 × 32, gap 8): track 4 (white 4%, r100) with the played
 * part white and a 16 white thumb; 0:00 · current (Medium, white) · total,
 * Regular 12 @64%. Drag / tap the track to seek.
 */
export const Timeline = ({ positionMs = 0, durationMs = 0, onSeek }) => {
  const [width, setWidth] = useState(0);
  const [dragMs, setDragMs] = useState(null);
  const widthRef = useRef(0);
  const durationRef = useRef(durationMs);
  durationRef.current = durationMs;
  const seekRef = useRef(onSeek);
  seekRef.current = onSeek;

  const msAt = (x) => {
    const w = widthRef.current || 1;
    return Math.max(0, Math.min(1, x / w)) * (durationRef.current || 0);
  };

  // the track's x on screen, so drags use the finger's page x
  const trackRef = useRef(null);
  const trackX = useRef(0);
  const measure = () =>
    trackRef.current?.measureInWindow?.((x) => {
      trackX.current = x || 0;
    });

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => durationRef.current > 0,
        onMoveShouldSetPanResponder: () => durationRef.current > 0,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          measure();
          setDragMs(msAt(e.nativeEvent.pageX - trackX.current));
        },
        onPanResponderMove: (e) =>
          setDragMs(msAt(e.nativeEvent.pageX - trackX.current)),
        onPanResponderRelease: (e) => {
          const ms = msAt(e.nativeEvent.pageX - trackX.current);
          setDragMs(null);
          seekRef.current?.(ms);
        },
        onPanResponderTerminate: () => setDragMs(null),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const shown = dragMs ?? positionMs;
  const progress = durationMs > 0 ? Math.min(1, shown / durationMs) : 0;
  const fill = width * progress;
  const thumbLeft = Math.max(0, Math.min(width - 16, fill - 8));

  return (
    <View style={styles.timestamp}>
      <View
        ref={trackRef}
        style={styles.track}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
          measure();
        }}
        hitSlop={{ top: 12, bottom: 12 }}
        {...responder.panHandlers}
      >
        <View style={styles.rail} />
        <View style={[styles.played, { width: fill }]} />
        <View style={[styles.thumb, { left: thumbLeft }]} />
      </View>
      <View style={styles.times}>
        <Time label={formatClock(0)} />
        <Time label={formatClock(shown)} strong />
        <Time label={formatClock(durationMs)} />
      </View>
    </View>
  );
};

const Time = ({ label, strong }) => (
  <CustomText
    label={label}
    fontFamily={strong ? fonts.medium : fonts.regular}
    fontSize={12}
    color={strong ? AUDIO.white : AUDIO.white64}
    marginTop={fitLine(12, 8)}
    marginBottom={fitLine(12, 8)}
  />
);

const Round = ({ size, icon, iconSize, onPress, disabled }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.round,
      { width: size, height: size, opacity: disabled ? 0.48 : 1 },
    ]}
  >
    <GlassFill fill={AUDIO.white04} />
    <Glyph family={MSF} name={icon} size={iconSize} color={AUDIO.white} />
  </TouchableOpacity>
);

/**
 * Controls (gap 32): volume_off 24 · [prev 40 · 24 · play/pause 56 · 24 ·
 * next 40] (white 4% + blur 16 circles) · share 24. Play shows its action
 * (pause while playing); the speaker shows the sound's state like Instagram
 * (volume_up = sound on, volume_off = muted), so a crossed speaker never
 * reads as "muted" while the sound is on.
 */
export const Controls = ({
  playing,
  muted,
  onToggle,
  onPrev,
  onNext,
  onMute,
  onShare,
  hasPrev = true,
  hasNext = true,
}) => (
  <View style={styles.controls}>
    <TouchableOpacity activeOpacity={0.7} onPress={onMute} hitSlop={10}>
      <Glyph family={MSF} name={muted ? "volume_off" : "volume_up"} size={24} color={AUDIO.white} />
    </TouchableOpacity>
    <View style={styles.transport}>
      <Round size={40} icon="skip_previous" iconSize={24} onPress={onPrev} disabled={!hasPrev} />
      <Round size={56} icon={playing ? "pause" : "play_arrow"} iconSize={32} onPress={onToggle} />
      <Round size={40} icon="skip_next" iconSize={24} onPress={onNext} disabled={!hasNext} />
    </View>
    <TouchableOpacity activeOpacity={0.7} onPress={onShare} hitSlop={10}>
      <Glyph family={MSF} name="share" size={24} color={AUDIO.share} />
    </TouchableOpacity>
  </View>
);

export default PlayerPanel;

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingHorizontal: 12,
    gap: 24,
    alignItems: "center",
  },
  timestamp: { alignSelf: "stretch", gap: 8 },
  track: { height: 16, justifyContent: "center" },
  rail: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 6,
    height: 4,
    borderRadius: 100,
    backgroundColor: AUDIO.white04,
  },
  played: {
    position: "absolute",
    left: 0,
    top: 6,
    height: 4,
    borderRadius: 100,
    backgroundColor: AUDIO.white,
  },
  thumb: {
    position: "absolute",
    top: 0,
    width: 16,
    height: 16,
    borderRadius: 100,
    backgroundColor: AUDIO.white,
  },
  times: {
    height: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controls: {
    alignSelf: "stretch",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  transport: { flexDirection: "row", alignItems: "center", gap: 24 },
  round: {
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
