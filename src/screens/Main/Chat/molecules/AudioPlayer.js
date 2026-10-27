import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import SoundPlayer from "react-native-sound-player";
import { COLORS } from "../../../../utils/COLORS";
import Icons from "../../../../components/Icons";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { useTheme } from "../../../../contexts/ThemeContext";

const NUM_BARS = 12;

const AudioPlayer = ({
  audioUri,
  duration = 0,
  isPending = false,
  isSender,
}) => {
  const { colors, isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [soundDuration, setSoundDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const currentAudioRef = useRef(null);
  const barAnims = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(3)),
  ).current;
  const waveMounted = useRef(true);
  const playbackStartedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    currentAudioRef.current = audioUri;

    return () => {
      mountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (currentAudioRef.current === audioUri) {
        try {
          SoundPlayer.stop();
        } catch (error) {
          console.log("Error stopping sound on cleanup:", error);
        }
      }
    };
  }, [audioUri]);

  useEffect(() => {
    if (currentAudioRef.current !== audioUri) {
      setAudioLoaded(false);
      setIsPlaying(false);
      setWaveActive(false);
      playbackStartedRef.current = false;
      setCurrentPosition(0);
      setSoundDuration(duration || 0);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      try {
        SoundPlayer.stop();
      } catch (error) {
        console.log("Error stopping on URI change:", error);
      }

      currentAudioRef.current = audioUri;
    }
  }, [audioUri, duration]);

  // Wave animations
  useEffect(() => {
    if (!waveActive) {
      barAnims.forEach((anim) => {
        anim.stopAnimation();
        Animated.timing(anim, {
          toValue: 3,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    waveMounted.current = true;

    const animate = (index) => {
      if (!waveMounted.current) return;
      const targetHeight = 3 + Math.random() * 18;
      const animDuration = 200 + Math.random() * 200;
      Animated.timing(barAnims[index], {
        toValue: targetHeight,
        duration: animDuration,
        useNativeDriver: false,
      }).start(() => {
        if (waveMounted.current) animate(index);
      });
    };

    barAnims.forEach((_, i) => {
      setTimeout(() => animate(i), i * 40);
    });

    return () => {
      waveMounted.current = false;
    };
  }, [waveActive]);

  const loadAudio = async () => {
    if (!audioUri || isPending || audioLoaded) {
      return audioLoaded;
    }

    try {
      console.log("Loading audio from:", audioUri);
      setIsLoading(true);

      try {
        SoundPlayer.stop();
      } catch (e) {
      }

      SoundPlayer.playUrl(audioUri);

      await new Promise((resolve) => setTimeout(resolve, 100));
      SoundPlayer.pause();

      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        const info = await SoundPlayer.getInfo();
        console.log("Audio info after load:", info);
        if (info && info.duration) {
          if (mountedRef.current) {
            setSoundDuration(info.duration);
          }
        } else if (duration > 0) {
          if (mountedRef.current) {
            setSoundDuration(duration);
          }
        }
      } catch (infoError) {
        console.log("Could not get audio info:", infoError);
        if (duration > 0 && mountedRef.current) {
          setSoundDuration(duration);
        }
      }

      if (mountedRef.current) {
        setAudioLoaded(true);
        setIsLoading(false);
      }
      return true;
    } catch (error) {
      console.error("Error loading audio:", error);
      if (mountedRef.current) {
        setIsLoading(false);
        setAudioLoaded(false);
      }
      return false;
    }
  };

  const startPositionTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(async () => {
      if (!mountedRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      try {
        const info = await SoundPlayer.getInfo();
        if (info && typeof info.currentTime === "number") {
          if (!playbackStartedRef.current) {
            playbackStartedRef.current = true;
            if (mountedRef.current) setWaveActive(true);
          }

          if (mountedRef.current) {
            setCurrentPosition(info.currentTime);
          }

          const totalDuration = info.duration || soundDuration;
          if (totalDuration && info.currentTime >= totalDuration - 0.1) {
            playbackStartedRef.current = false;
            if (mountedRef.current) {
              setIsPlaying(false);
              setWaveActive(false);
              setCurrentPosition(totalDuration);
            }
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            try {
              SoundPlayer.stop();
            } catch (e) {
              console.log("Error stopping at end:", e);
            }
          }
        }
      } catch (error) {
        console.log("Error getting position:", error);
      }
    }, 100);
  };

  const togglePlayPause = async () => {
    if (!audioUri || isPending || isLoading) return;

    try {
      if (isPlaying) {
        SoundPlayer.pause();
        setIsPlaying(false);
        setWaveActive(false);
        playbackStartedRef.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        if (!audioLoaded) {
          const loaded = await loadAudio();
          if (!loaded) {
            console.error("Failed to load audio");
            return;
          }
        }

        let shouldPlayFromStart = true;
        try {
          const info = await SoundPlayer.getInfo();
          const currentTime = info.currentTime || 0;
          const totalDuration = info.duration || soundDuration;

          if (currentTime > 0 && currentTime < totalDuration - 0.1) {
            shouldPlayFromStart = false;
          }
        } catch (error) {
          console.log("Could not get info, will play from start:", error);
        }

        if (shouldPlayFromStart) {
          try {
            SoundPlayer.stop();
            await new Promise((resolve) => setTimeout(resolve, 50));
          } catch (e) {
          }
          SoundPlayer.playUrl(audioUri);
        } else {
          SoundPlayer.resume();
        }

        if (mountedRef.current) {
          setIsPlaying(true);
          startPositionTracking();
        }
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
      if (mountedRef.current) {
        setIsPlaying(false);
        setIsLoading(false);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress =
    soundDuration > 0 ? (currentPosition / soundDuration) * 100 : 0;

  // Figma Inbox_General-Default voice message: pill 44 (r100, pad 12/16/12/8,
  // gap 4; white 4% sent / 16% received) · play 24 · 12 bars 4 wide (r100,
  // 4 apart) · 8 · chip 25 (r100 white 4%, Medium 12 −0.5) with the length.
  const played = soundDuration > 0 ? currentPosition / soundDuration : 0;
  const pillBg = isDark
    ? isSender ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.16)"
    : isSender ? "rgba(18, 18, 18, 0.04)" : "rgba(18, 18, 18, 0.08)";
  const fg = colors.text;
  return (
    <View style={styles.row}>
      <View style={[styles.pill, { backgroundColor: pillBg }]}>
        <TouchableOpacity onPress={togglePlayPause} disabled={isPending || isLoading || !audioUri} hitSlop={8} style={styles.play}>
          {isPending || isLoading ? (
            <ActivityIndicator size="small" color={fg} />
          ) : (
            <Icons family="MaterialSymbolsRoundedFilled" name={isPlaying ? "pause" : "play_arrow"} size={24} color={fg} />
          )}
        </TouchableOpacity>
        {BAR_HEIGHTS.map((h, i) => {
          const on = !isPlaying && played === 0 ? true : (i + 0.5) / BAR_HEIGHTS.length <= played;
          return (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: waveActive ? barAnims[i] : h,
                  backgroundColor: fg,
                  opacity: on ? 1 : 0.48,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={[styles.chip, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(18, 18, 18, 0.04)" }]}>
        <CustomText
          label={isPending ? "…" : formatTime(isPlaying || currentPosition ? Math.max(0, soundDuration - currentPosition) : soundDuration)}
          fontSize={12}
          fontFamily={fonts.medium}
          letterSpacing={-0.5}
          color={fg}
        />
      </View>
    </View>
  );
};

const BAR_HEIGHTS = [14, 16, 8, 22, 14, 12, 22, 12, 8, 4, 4, 16];

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    height: 44,
    borderRadius: 100,
    paddingLeft: 8,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  play: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    width: 4,
    borderRadius: 100,
  },
  chip: {
    height: 25,
    borderRadius: 100,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AudioPlayer;
