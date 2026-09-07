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

const NUM_BARS = 40;

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

  if (isPending) {
    return (
      <View style={styles.container}>
        <View style={styles.audioContainer}>
          <View style={styles.playButton}>
            <ActivityIndicator size="small" color={COLORS.buttonColor} />
          </View>
          <View style={styles.infoContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: isSender ? (isDark ? COLORS.gray : colors.border) : colors.white04,
                },
              ]}
            >
              <View style={[styles.progressFill, { width: "0%" }]} />
            </View>
            <CustomText
              label="Uploading..."
              fontSize={12}
              fontFamily={fonts.medium}
              color={colors.textSecondary}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.audioContainer}>
        <TouchableOpacity
          style={[
            styles.playButton,
            {
              backgroundColor: isSender
                ? (isDark ? COLORS.gray2 : colors.white04)
                : (isDark ? COLORS.lightGray : colors.surfaceAlt),
            },
          ]}
          onPress={togglePlayPause}
          activeOpacity={0.7}
          disabled={isLoading || !audioUri}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Icons
              name={isPlaying ? "pause" : "play"}
              family="Feather"
              size={16}
              color={isSender ? (isDark ? COLORS.white : colors.text) : COLORS.buttonColor}
            />
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <View style={styles.wavesContainer}>
            <View
              style={[
                styles.lineTrack,
                {
                  backgroundColor: isSender
                    ? (isDark ? COLORS.gray2 : colors.white04)
                    : (isDark ? COLORS.lightGray : colors.surfaceAlt),
                },
              ]}
            />
            {barAnims.map((anim, i) => {
              const barProgress = ((i + 0.5) / NUM_BARS) * 100;
              const isFilled = barProgress <= progress;
              return (
                <View key={i} style={styles.barWrapper}>
                  <Animated.View
                    style={[
                      styles.bar,
                      {
                        height: isFilled ? anim : 4,
                        backgroundColor: isFilled
                          ? (isDark ? COLORS.white : colors.text)
                          : "transparent",
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.timeContainer}>
            <CustomText
              label={formatTime(currentPosition)}
              fontSize={11}
              fontFamily={fonts.regular}
              color={colors.textSecondary}
            />
            <CustomText
              label={formatTime(soundDuration)}
              fontSize={11}
              fontFamily={fonts.regular}
              color={colors.textSecondary}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 200,
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.buttonColor,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wavesContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    height: 24,
  },
  lineTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  barWrapper: {
    width: 3,
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 1.5,
  },
});

export default AudioPlayer;
