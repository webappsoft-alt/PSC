import { useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import SoundPlayer from "react-native-sound-player";

import fonts from "../assets/fonts";
import { ToastMessage } from "../utils/ToastMessage";
import CustomText from "./CustomText";
import Icons from "./Icons";

const W4 = "rgba(255, 255, 255, 0.04)";
const W64 = "rgba(255, 255, 255, 0.64)";

/**
 * "Listen" pill — same pill, voice and player as the election SI Summary
 * (ElectionSummary / ElectionDetail): h28 r100, 1px white 4% stroke,
 * padding L6 R8, gap 4 · play/pause 12 white · Medium 14 white 64%
 * (Listen / Loading / Pause). `getAudioUrl()` returns the mp3 to play
 * (backend SI speech, cached). Stops when the screen goes away.
 */
const ListenButton = ({ getAudioUrl }) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let sub = null;
    try {
      sub = SoundPlayer.addEventListener("FinishedPlaying", () => {
        if (mounted.current) setPlaying(false);
      });
    } catch (e) {
      sub = null;
    }
    return () => {
      mounted.current = false;
      try {
        sub?.remove?.();
        SoundPlayer.stop();
      } catch (e) {
        // nothing playing
      }
    };
  }, []);

  const toggle = async () => {
    if (playing) {
      try {
        SoundPlayer.stop();
      } catch (e) {
        // already stopped
      }
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      const url = await getAudioUrl();
      if (!url) {
        ToastMessage("Listening is not available right now", "info");
        return;
      }
      SoundPlayer.playUrl(url);
      if (mounted.current) setPlaying(true);
    } catch (e) {
      ToastMessage(e?.message || "Listening is not available right now", "error");
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.7} disabled={loading} onPress={toggle} style={styles.pill} accessibilityRole="button">
      <Icons family="MaterialSymbolsRoundedFilled" name={playing ? "pause" : "play_arrow"} size={12} color="#FFFFFF" />
      <CustomText
        label={loading ? "Loading" : playing ? "Pause" : "Listen"}
        fontSize={14}
        fontFamily={fonts.medium}
        color={W64}
        numberOfLines={1}
        marginTop={-4.9}
        marginBottom={-4.9}
      />
    </TouchableOpacity>
  );
};

export default ListenButton;

const styles = StyleSheet.create({
  pill: {
    height: 28,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: W4,
    paddingLeft: 6,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
