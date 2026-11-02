import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Animated, StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import { buildSubtitleLines, captionWords } from "../../../../utils/subtitles";
import {
  AUDIO,
  TITLE_BASELINE,
  TITLE_CAP_TOP,
  TITLE_LINE,
  ls,
} from "./audioLayout";

/**
 * Live transcript (Figma "Frame 2085663879", gap 32): the phrase being
 * spoken in SemiBold 24 −4% white, the next phrase below it at white 4%.
 * Phrases come from the same subtitles method as feed videos
 * (utils/subtitles: Whisper words grouped ≤ 5 words, broken at pauses).
 */
const LEAD_MS = 150;

const currentIndex = (lines, positionMs) => {
  let index = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (positionMs >= lines[i].startMs - LEAD_MS) index = i;
    else break;
  }
  return index;
};

// Figma: SemiBold 24 / 125% / −4%
const Line = ({ label, color, numberOfLines }) => (
  <CustomText
    label={label}
    fontFamily={fonts.semiBold}
    fontSize={24}
    lineHeight={TITLE_LINE}
    letterSpacing={ls(24, -4)}
    color={color}
    numberOfLines={numberOfLines}
  />
);

const TranscriptView = ({ source, positionMs = 0, placeholder }) => {
  const lines = useMemo(
    () => buildSubtitleLines(captionWords(source, source?.durationMs || 0)),
    [source],
  );
  const index = lines.length ? currentIndex(lines, positionMs) : -1;
  const current = index >= 0 ? lines[index]?.text : placeholder;
  const next = index >= 0 ? lines[index + 1]?.text : null;

  // the "next" line brightens into the current one
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0.04);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [index, fade]);

  if (!current) return null;
  return (
    // the view starts at the first line's cap top (Figma trimmed box)
    <View style={styles.wrap}>
      <Animated.View style={{ opacity: fade }}>
        <Line label={current} color={AUDIO.white} />
      </Animated.View>
      {next ? (
        <View style={styles.next}>
          <Line label={next} color={AUDIO.white04} numberOfLines={2} />
        </View>
      ) : null}
    </View>
  );
};

export default TranscriptView;

/**
 * While recording (Figma 7593:3533): the phrase being spoken, live from the
 * device's speech recognition, in the transcript style. Words are grouped
 * like the editor's transcript — at most 5 to a phrase and a new phrase
 * after a pause (`pause` is set on the first word recognised after ≥ 600 ms
 * of silence on the microphone) — and the current phrase is shown.
 */
const LIVE_MAX_WORDS = 5;
export const LiveTranscript = ({ bus }) => {
  const words = useSyncExternalStore(bus.subscribe, bus.get);
  const list = Array.isArray(words) ? words : [];
  let phrase = [];
  for (const w of list) {
    if (phrase.length >= LIVE_MAX_WORDS || (w.pause && phrase.length)) phrase = [];
    phrase.push(w.word);
  }
  const current = phrase.join(" ");
  if (!current) return null;
  return (
    <View style={styles.wrap}>
      <Line label={current} color={AUDIO.white} numberOfLines={2} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: TITLE_CAP_TOP, marginBottom: TITLE_BASELINE },
  // Figma gap 32 between the two cap-trimmed lines
  next: { marginTop: 32 + TITLE_BASELINE + TITLE_CAP_TOP },
});
