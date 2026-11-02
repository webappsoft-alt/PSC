import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video from "react-native-video";
import {
  radioPlayback,
  useRadioPlayback,
} from "../../../../utils/radioPlayback";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  setAudioUrl,
  setLoading,
  setPlaying,
  setPlayingRadioData,
  setPlayerSuppressed,
  setPlayingRadioId,
  setShowRadioPlayer,
  resetRadioPlayback,
} from "../../../../store/reducer/playerSlice";
import { COLORS } from "../../../../utils/COLORS";
import Blur from "../../../../components/Blur";
import moment from "moment";

// builds a closed SVG path: wavy top edge -> filled down to the bottom
const buildWavePath = (width, height, amplitude, waveLength) => {
  const baseline = height * 0.55;
  let d = `M0,${height} L0,${baseline}`;
  const halfWave = waveLength / 2;
  let x = 0;
  let direction = 1;

  while (x < width) {
    const cpX = x + halfWave / 2;
    const cpY = baseline - direction * amplitude;
    const endX = x + halfWave;
    const endY = baseline;
    d += ` C${cpX},${cpY} ${cpX},${cpY} ${endX},${endY}`;
    x = endX;
    direction *= -1;
  }

  d += ` L${width},${height} Z`;
  return d;
};

const WAVE_HEIGHT = 35;
const WAVE_AMPLITUDE = 8;
const WAVE_CYCLES = 3; // full waves visible across one card width
const WAVE_DURATION = 2400; // ms for one full horizontal loop

// once per JS runtime (launch / reload), not per mount (account switch)
let playbackSessionStarted = false;

const PlayerCard = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const showRadioPlayer = useSelector((state) => state.player.showRadioPlayer);
  const isTabBarVisible = useSelector((state) => state.player.isTabBarVisible);
  const audioUrl = useSelector((state) => state.player.audioUrl);
  const isPlaying = useSelector((state) => state.player.isPlaying);
  const isLoading = useSelector((state) => state.player.isLoading);
  const playingRadioData = useSelector(
    (state) => state.player.playingRadioData,
  );
  const isPlayerSuppressed = useSelector(
    (state) => state.player.isPlayerSuppressed,
  );
  const playRequest = useSelector((state) => state.player.playRequest);
  const { colors, isDark } = useTheme();

  const animValue = useRef(new Animated.Value(isTabBarVisible ? 1 : 0)).current;
  const tabBarHeight = 90 + insets.bottom;
  const mountedRef = useRef(true);

  // sound-wave animation state
  const [waveWidth, setWaveWidth] = useState(0);
  const waveTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    mountedRef.current = true;
    if (!playbackSessionStarted) {
      // first mount since the app (re)started: the persisted player slice
      // still says a radio is playing, but nothing is loaded
      playbackSessionStarted = true;
      dispatch(resetRadioPlayback());
      radioPlayback.reset();
    } else {
      // the player slice is persisted — never start hidden by a stale flag
      dispatch(setPlayerSuppressed(false));
    }
    return () => {
      mountedRef.current = false;
    };
  }, [dispatch]);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isTabBarVisible ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible, animValue]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -tabBarHeight],
  });

  // drive the traveling wave while playing
  useEffect(() => {
    let loop;
    if (isPlaying && waveWidth > 0) {
      waveTranslate.setValue(0);
      loop = Animated.loop(
        Animated.timing(waveTranslate, {
          toValue: -waveWidth,
          duration: WAVE_DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
    } else {
      waveTranslate.stopAnimation();
      Animated.timing(waveTranslate, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [isPlaying, waveWidth, waveTranslate]);

  const wavePathD = useMemo(() => {
    if (!waveWidth) return "";
    const waveLength = waveWidth / WAVE_CYCLES;
    return buildWavePath(
      waveWidth * 2,
      WAVE_HEIGHT,
      WAVE_AMPLITUDE,
      waveLength,
    );
  }, [waveWidth]);

  // ─── the radio engine ───────────────────────────────────────────────────
  // One react-native-video player (audio only) for every radio / Audio
  // Post, the same engine as the feed videos. It takes part in their shared
  // iOS audio session, so a muted feed video mounting / unmounting can no
  // longer switch the radio's sound off (react-native-sound-player was
  // outside that session and kept being silenced). `playRequest` remounts it
  // so the same radio opened again starts from the beginning.
  const videoRef = useRef(null);
  const { muted } = useRadioPlayback();
  useEffect(() => {
    radioPlayback.attach(videoRef);
    return () => radioPlayback.detach(videoRef);
  }, []);
  useEffect(() => {
    if (!audioUrl || !showRadioPlayer) return;
    radioPlayback.reset();
    dispatch(setLoading(true));
    dispatch(setPlaying(true));
  }, [audioUrl, showRadioPlayer, playRequest, dispatch]);

  const onRadioLoad = ({ duration }) => {
    radioPlayback.progress(0, (Number(duration) || 0) * 1000);
    dispatch(setLoading(false));
  };
  const onRadioProgress = ({
    currentTime,
    seekableDuration,
    playableDuration,
  }) => {
    const dur = Number(seekableDuration) || Number(playableDuration) || 0;
    radioPlayback.progress((Number(currentTime) || 0) * 1000, dur * 1000);
  };
  const onRadioEnd = () => {
    radioPlayback.reset();
    dispatch(setPlaying(false));
    dispatch(setLoading(false));
    dispatch(setShowRadioPlayer(false));
    dispatch(setAudioUrl(null));
    dispatch(setPlayingRadioId(null));
    dispatch(setPlayingRadioData(null));
  };
  const onRadioError = (e) => {
    console.log("Radio playback error", e?.error || e);
    dispatch(setLoading(false));
    dispatch(setPlaying(false));
  };

  const engine =
    showRadioPlayer && audioUrl ? (
      <Video
        key={`${audioUrl}-${playRequest}`}
        ref={videoRef}
        source={{ uri: audioUrl }}
        audioOnly
        paused={!isPlaying}
        muted={muted}
        ignoreSilentSwitch="ignore"
        progressUpdateInterval={250}
        onLoad={onRadioLoad}
        onProgress={onRadioProgress}
        onEnd={onRadioEnd}
        onError={onRadioError}
        style={styles.engine}
      />
    ) : null;

  const handleStop = () => {
    radioPlayback.reset();
    dispatch(setPlaying(false));
    dispatch(setLoading(false));
    dispatch(setShowRadioPlayer(false));
    dispatch(setAudioUrl(null));
    dispatch(setPlayingRadioId(null));
    dispatch(setPlayingRadioData(null));
  };

  // the engine keeps the same place in the tree whether or not the card
  // shows, so hiding the card (detail page open) never restarts playback
  const cardVisible = showRadioPlayer && !isPlayerSuppressed;

  return (
    <>
      {engine}
      {cardVisible && (
        <Animated.View
          style={[
            styles.playerContainer,
            {
              bottom: 0,
              overflow: "hidden",
              marginBottom: isTabBarVisible ? 0 : insets.bottom,
              transform: [{ translateY }],
            },
          ]}
        >
          <Blur blurType={isDark ? "dark" : "light"} />
          <View
            style={[
              styles.cardInner,
              { backgroundColor: isDark ? COLORS.black : colors.surface },
            ]}
          >
            <View
              style={styles.bottomGradient}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.round(w) !== Math.round(waveWidth)) {
                  setWaveWidth(w);
                }
              }}
            >
              {waveWidth > 0 && (
                <Animated.View
                  style={{
                    width: waveWidth * 2,
                    height: WAVE_HEIGHT,
                    transform: [{ translateX: waveTranslate }],
                  }}
                >
                  <Svg
                    width={waveWidth * 2}
                    height={WAVE_HEIGHT}
                    viewBox={`0 0 ${waveWidth * 2} ${WAVE_HEIGHT}`}
                  >
                    <Defs>
                      <SvgLinearGradient
                        id="waveGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <Stop offset="0" stopColor="#06632D" stopOpacity="0" />
                        <Stop offset="1" stopColor="#06632D" stopOpacity="1" />
                      </SvgLinearGradient>
                    </Defs>
                    <Path d={wavePathD} fill="url(#waveGrad)" />
                  </Svg>
                </Animated.View>
              )}
            </View>
            {playingRadioData?.userId?.profile?.avatar ? (
              <Image
                source={{
                  uri: playingRadioData?.userId?.profile?.avatar,
                }}
                style={styles.image}
              />
            ) : (
              <View
                style={{
                  height: 38,
                  width: 38,
                  borderRadius: 8,
                  backgroundColor:
                    playingRadioData?.userId?.profile?.profileColor ||
                    colors.primaryColor,
                }}
              />
            )}

            <View style={styles.infoSection}>
              <View style={styles.row}>
                <Image
                  source={Images.friendGray}
                  style={[
                    styles.smallIcon,
                    { tintColor: isDark ? colors.white : COLORS.black },
                  ]}
                />
                <CustomText
                  label={`${playingRadioData?.play?.length || 0} listener${
                    (playingRadioData?.play?.length || 0) !== 1 ? "s" : ""
                  }`}
                  fontSize={10}
                  fontFamily={fonts.medium}
                  color={isDark ? COLORS.gray48 : colors.textSecondary}
                />
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isDark
                        ? COLORS.white16
                        : "rgba(18, 18, 18, 0.16)",
                    },
                  ]}
                />
                <CustomText
                  label={moment(playingRadioData?.createdAt).fromNow()}
                  fontSize={10}
                  fontFamily={fonts.medium}
                  color={isDark ? COLORS.gray48 : colors.textSecondary}
                />
              </View>

              <View style={styles.row}>
                <CustomText
                  label={playingRadioData?.title || "Untitled"}
                  fontFamily={fonts.medium}
                  color={colors.text}
                />
              </View>
            </View>

            {/* <ImageFast source={Images.playerVolume} style={styles.radioIcon} /> */}

            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator color={COLORS.buttonColor} size="small" />
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleStop}
                style={{ overflow: "hidden", borderRadius: 99 }}
              >
                <Blur blurType={isDark ? "dark" : "light"} />
                <Image
                  source={Images.playerStop}
                  style={[
                    styles.playIcon,
                    { tintColor: isDark ? COLORS.white : COLORS.black },
                  ]}
                />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </>
  );
};

export default PlayerCard;

const styles = StyleSheet.create({
  engine: { position: "absolute", width: 0, height: 0, opacity: 0 },
  playerContainer: {
    position: "absolute",
    width: "90%",
    height: 64,
    padding: 4,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    overflow: "hidden",
    marginLeft: 16,
  },
  cardInner: {
    height: 56,
    width: "100%",
    backgroundColor: COLORS.black,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 8,
  },
  image: {
    height: 38,
    width: 38,
    borderRadius: 8,
  },
  infoSection: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  smallIcon: {
    height: 12,
    width: 12,
  },
  verifiedIcon: {
    height: 14,
    width: 14,
  },
  radioIcon: {
    height: 40,
    width: 40,
  },
  playIcon: {
    height: 40,
    width: 40,
  },
  loaderContainer: {
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
    borderRadius: 16,
    overflow: "hidden",
  },
  dot: {
    height: 4,
    width: 4,
    borderRadius: 99,
    marginHorizontal: 2,
  },
});
