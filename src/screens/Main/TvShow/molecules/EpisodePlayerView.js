import { useNavigation } from "@react-navigation/native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import FastImage from "react-native-fast-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video from "react-native-video";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import UserBadge from "../../../../components/UserBadge";
import { saveWatchProgress } from "../../../../services/showApi";
import { findCurrency } from "../../../../utils/currencies";
import { Avatar } from "./ShowCards";
import {
  GlassFill,
  Glyph,
  SHOWS,
  baseline,
  capGap,
  capTop,
  fitLine,
  formatCount,
} from "./showsLayout";
import useEpisodePurchase from "./useEpisodePurchase";

/**
 * One episode page of the player (Viral EpisodePlayerView behaviour, PSC
 * Figma design):
 *  · "Fullscreen-landscape mode" (7580:14103) — header: 40 back · 40 avatar
 *    ring (2 #007BFF) · name Medium 14 −2% + badge 14 / username Regular 14
 *    @48% · views pill 32 (visibility 14 · SemiBold 14 −2% @64% + Medium 12);
 *    bottom (gradient #121212 0 → 64%, pad 12/16/34, gap 8): "You're
 *    watching: …" (movie 14 + Medium 14 −3%) · controls 48 (40 volume ·
 *    48 rings with 40 white-10% blur-32 circles: rewind / pause / forward ·
 *    40 skip_next) · 4pt progress (white 16% blur 32, white fill).
 *  · "Show-FS-Subscribe-Ad" (7580:13748) when the episode is locked.
 * Tap toggles the controls (auto-hide after 3s while playing); long-press +
 * drag the progress bar scrubs; the fullscreen button rotates the player.
 */
const MS = "MaterialSymbolsRounded";
const MSF = "MaterialSymbolsRoundedFilled";
const AUTO_HIDE_MS = 3000;
const PROGRESS_SAVE_MS = 20000;
const SEEK_STEP = 10;
const BAR_H = 4;
const BAR_H_EXPANDED = 6;

const priceLabel = (price) => {
  const amount = Number(price?.amount) || 0;
  if (amount <= 0) return "";
  const cur = findCurrency(price?.currency);
  return `${cur?.symbol || "$"}${amount.toFixed(2)}`;
};

const creatorName = (u) =>
  `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || u?.username || "";

/** 40 circle · white 4% on blur 16 (Figma "Frame 209" / "Frame 2085663196") */
const Circle40 = ({ icon, iconSize = 20, onPress, filled }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    style={styles.circle40}
  >
    <GlassFill fill={SHOWS.white04} />
    <Glyph family={filled ? MSF : MS} name={icon} size={iconSize} color={SHOWS.white} />
  </TouchableOpacity>
);

/** 48 ring (1 white 16%) · 40 white 10% on blur 32 · 20 icon (transport buttons) */
const Transport = ({ icon, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.transportRing}>
    <View style={styles.transportInner}>
      <GlassFill fill="rgba(255, 255, 255, 0.1)" blurAmount={32} />
      <Glyph family={MSF} name={icon} size={20} color={SHOWS.white} />
    </View>
  </TouchableOpacity>
);

const EpisodePlayerView = ({
  episode,
  show,
  isActive,
  height,
  width,
  onBack,
  onEpisodeUnlocked,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { buy, buying } = useEpisodePurchase();

  const creator = show?.userId && typeof show.userId === "object" ? show.userId : null;
  const locked = episode?.canWatch === false;
  const videoUrl = episode?.preview || "";
  const cover = episode?.cover || show?.coverImage || "";

  const videoRef = useRef(null);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [landscape, setLandscape] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [durationS, setDurationS] = useState(0);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const resumedRef = useRef(false);
  const autoHideRef = useRef(null);
  const pausedRef = useRef(true);
  pausedRef.current = paused;

  const progress = useSharedValue(0);
  const barHeight = useSharedValue(BAR_H);
  const barWidth = useSharedValue(0);
  const panStart = useSharedValue(0);
  const scrubbingRef = useRef(false);
  const uiAnim = useRef(new Animated.Value(1)).current;

  /* ───────────── controls visibility ───────────── */
  const animateUi = useCallback(
    (to) => {
      Animated.timing(uiAnim, {
        toValue: to,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [uiAnim],
  );
  const clearAutoHide = () => {
    if (autoHideRef.current) clearTimeout(autoHideRef.current);
    autoHideRef.current = null;
  };
  const scheduleAutoHide = useCallback(() => {
    clearAutoHide();
    autoHideRef.current = setTimeout(() => {
      if (!pausedRef.current && !scrubbingRef.current) {
        setUiVisible(false);
        animateUi(0);
      }
    }, AUTO_HIDE_MS);
  }, [animateUi]);
  const showUi = useCallback(() => {
    setUiVisible(true);
    animateUi(1);
    scheduleAutoHide();
  }, [animateUi, scheduleAutoHide]);
  const toggleUi = useCallback(() => {
    if (uiVisible) {
      clearAutoHide();
      setUiVisible(false);
      animateUi(0);
    } else showUi();
  }, [uiVisible, animateUi, showUi]);
  useEffect(() => () => clearAutoHide(), []);

  /* ───────────── playback ───────────── */
  useEffect(() => {
    if (isActive && !locked) {
      setPaused(false);
      showUi();
    } else {
      setPaused(true);
      persist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, locked]);

  const persist = useCallback(() => {
    const d = durationRef.current;
    const p = Math.floor(positionRef.current);
    if (!show?._id || !episode?._id || d <= 0 || p <= 0) return;
    saveWatchProgress({
      showId: show._id,
      episodeId: episode._id,
      positionSeconds: p,
      durationSeconds: Math.max(1, Math.floor(d)),
    }).catch(() => {});
  }, [show?._id, episode?._id]);

  useEffect(() => {
    if (!isActive || paused) return undefined;
    const t = setInterval(persist, PROGRESS_SAVE_MS);
    return () => clearInterval(t);
  }, [isActive, paused, persist]);
  useEffect(() => () => persist(), [persist]);

  const onLoad = (meta) => {
    const d = meta?.duration || 0;
    durationRef.current = d;
    setDurationS(d);
    setLoading(false);
    const resume = episode?.watchProgress?.positionSeconds || 0;
    if (!resumedRef.current && resume > 0 && d - resume > 5) {
      resumedRef.current = true;
      videoRef.current?.seek(resume);
    }
  };
  const onProgress = (data) => {
    if (scrubbingRef.current) return;
    positionRef.current = data.currentTime || 0;
    if (durationRef.current > 0) progress.value = positionRef.current / durationRef.current;
  };
  const onEnd = () => {
    setPaused(true);
    showUi();
    persist();
  };

  const seekBy = (delta) => {
    const d = durationRef.current;
    if (!d) return;
    const next = Math.max(0, Math.min(d, positionRef.current + delta));
    positionRef.current = next;
    progress.value = next / d;
    videoRef.current?.seek(next);
    showUi();
  };
  const seekToRatio = useCallback((r) => {
    const d = durationRef.current;
    if (!d) return;
    const next = Math.max(0, Math.min(d, r * d));
    positionRef.current = next;
    videoRef.current?.seek(next);
  }, []);
  const startScrub = useCallback(() => {
    scrubbingRef.current = true;
    clearAutoHide();
  }, []);
  const endScrub = useCallback(
    (r) => {
      seekToRatio(r);
      scrubbingRef.current = false;
      scheduleAutoHide();
    },
    [seekToRatio, scheduleAutoHide],
  );

  const barGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-6, 6])
        .failOffsetY([-30, 30])
        .hitSlop({ top: 20, bottom: 20 })
        .onStart(() => {
          panStart.value = progress.value;
          barHeight.value = withSpring(BAR_H_EXPANDED);
          runOnJS(startScrub)();
        })
        .onUpdate((e) => {
          const w = barWidth.value;
          if (w > 0) {
            progress.value = Math.max(0, Math.min(1, panStart.value + e.translationX / w));
          }
        })
        .onFinalize(() => {
          barHeight.value = withSpring(BAR_H);
          runOnJS(endScrub)(progress.value);
        }),
    [startScrub, endScrub],
  );
  const barStyle = useAnimatedStyle(() => ({ height: barHeight.value }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const togglePlay = () => {
    setPaused((p) => !p);
    showUi();
  };

  /* ───────────── locked (subscribe ad) ───────────── */
  const price = priceLabel(episode?.price);
  const needsPurchase = episode?.lockReason === "purchase";
  const onUnlock = async () => {
    if (needsPurchase) {
      const ok = await buy(show?._id, episode?._id);
      if (ok) onEpisodeUnlocked?.(episode?._id);
      return;
    }
    onBack?.();
    navigation.navigate("Plans");
  };

  /* ───────────── layout (portrait / rotated landscape) ───────────── */
  const W = width;
  const H = height;
  const frame = landscape
    ? {
        width: H,
        height: W,
        position: "absolute",
        left: (W - H) / 2,
        top: (H - W) / 2,
        transform: [{ rotate: "90deg" }],
      }
    : { width: W, height: H };
  const padTop = landscape ? 16 : insets.top + 12;
  const padBottom = landscape ? 34 : Math.max(insets.bottom, 12) + 22;
  const padH = landscape ? 16 : 12;
  const chromeOpacity = uiAnim;
  const chromeTranslateTop = uiAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] });
  const chromeTranslateBottom = uiAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  const seLabel = episode ? `E${episode.episodeNumber} S${episode.seasonNumber}` : "";

  return (
    <View style={{ width: W, height: H, backgroundColor: "#000" }}>
      <View style={frame}>
        <Pressable style={StyleSheet.absoluteFill} onPress={locked ? undefined : toggleUi}>
          {!locked && videoUrl ? (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode={landscape ? "contain" : "cover"}
              paused={paused}
              muted={muted}
              onLoadStart={() => setLoading(true)}
              onLoad={onLoad}
              onProgress={onProgress}
              onEnd={onEnd}
              onError={() => setLoading(false)}
              progressUpdateInterval={250}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
              poster={cover}
              posterResizeMode="cover"
            />
          ) : cover ? (
            <FastImage
              source={{ uri: cover }}
              style={StyleSheet.absoluteFill}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : null}
          {locked ? (
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={16}
              overlayColor="transparent"
              reducedTransparencyFallbackColor="rgba(18, 18, 18, 0.64)"
            />
          ) : null}
          {loading && !locked && videoUrl ? (
            <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
              <ActivityIndicator color={SHOWS.white} />
            </View>
          ) : null}
        </Pressable>

        {/* ───── header (gradient #121212 64% → 0) ───── */}
        <Animated.View
          pointerEvents={uiVisible || locked ? "box-none" : "none"}
          style={[
            styles.header,
            { paddingTop: padTop, paddingHorizontal: padH },
            locked ? null : { opacity: chromeOpacity, transform: [{ translateY: chromeTranslateTop }] },
          ]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(18, 18, 18, 0.64)", "rgba(18, 18, 18, 0)"]}
            style={StyleSheet.absoluteFill}
          />
          {locked ? (
            <>
              <View style={styles.headerRow}>
                <Circle40 icon="chevron_left" iconSize={24} onPress={onBack} />
                <View style={styles.flex}>
                  <CustomText
                    label={episode?.title || ""}
                    fontSize={14}
                    fontFamily={fonts.medium}
                    letterSpacing={-0.07}
                    color={SHOWS.white}
                    numberOfLines={1}
                    marginTop={capTop(14)}
                  />
                  <CustomText
                    label={seLabel}
                    fontSize={14}
                    letterSpacing={-0.07}
                    color={SHOWS.white48}
                    numberOfLines={1}
                    marginTop={capGap(8, 14, 14)}
                    marginBottom={baseline(14)}
                  />
                </View>
                <TouchableOpacity activeOpacity={0.7} style={styles.circle32}>
                  <GlassFill fill={SHOWS.white04} />
                  <Glyph family={MS} name="more_vert" size={16} color={SHOWS.white} />
                </TouchableOpacity>
              </View>
              <CustomText
                label={show?.showName || ""}
                fontSize={28}
                color={SHOWS.white}
                numberOfLines={1}
                marginLeft={52}
                marginTop={2 + fitLine(28, 20)}
                marginBottom={fitLine(28, 20)}
              />
            </>
          ) : (
            <View style={styles.headerRow}>
              <Circle40 icon="chevron_left" iconSize={24} onPress={landscape ? () => setLandscape(false) : onBack} />
              <View style={[styles.flex, styles.row, { gap: 8 }]}>
                <View style={styles.avatarRing}>
                  <Avatar uri={creator?.profile?.avatar} color={creator?.profile?.profileColor} size={32} />
                </View>
                <View style={[styles.flex, { gap: 4 }]}>
                  <View style={[styles.row, { gap: 4, height: 14 }]}>
                    <CustomText
                      label={creatorName(creator)}
                      fontSize={14}
                      fontFamily={fonts.medium}
                      letterSpacing={-0.28}
                      color={SHOWS.white}
                      numberOfLines={1}
                      marginTop={fitLine(14, 14)}
                      marginBottom={fitLine(14, 14)}
                      containerStyle={styles.shrink}
                    />
                    <UserBadge user={creator} size={14} />
                  </View>
                  <CustomText
                    label={creator?.username ? `@${creator.username}` : ""}
                    fontSize={14}
                    letterSpacing={-0.07}
                    color={SHOWS.white48}
                    numberOfLines={1}
                    marginTop={fitLine(14, 10)}
                    marginBottom={fitLine(14, 10)}
                  />
                </View>
              </View>
              <View style={styles.viewsPill}>
                <GlassFill fill={SHOWS.white04} blurAmount={32} />
                <Glyph family={MSF} name="visibility" size={14} color={SHOWS.white64} />
                <View style={[styles.row, { gap: 2 }]}>
                  <CustomText
                    label={formatCount(episode?.stats?.views ?? show?.stats?.views ?? 0)}
                    fontSize={14}
                    fontFamily={fonts.semiBold}
                    letterSpacing={-0.28}
                    color={SHOWS.white64}
                    marginTop={fitLine(14, 10)}
                    marginBottom={fitLine(14, 10)}
                  />
                  <CustomText
                    label="views"
                    fontSize={12}
                    fontFamily={fonts.medium}
                    color={SHOWS.white64}
                    marginTop={fitLine(12, 8)}
                    marginBottom={fitLine(12, 8)}
                  />
                </View>
              </View>
            </View>
          )}
        </Animated.View>

        {/* ───── bottom: controls or the subscribe ad ───── */}
        {locked ? (
          <View style={[styles.lockBottom, { paddingBottom: landscape ? 20 : Math.max(insets.bottom, 20) }]}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(238, 16, 69, 0)", SHOWS.red]}
              locations={[0.24, 1]}
              style={StyleSheet.absoluteFill}
            />
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="dark"
              blurAmount={16}
              overlayColor="transparent"
              reducedTransparencyFallbackColor="transparent"
            />
            <View style={[styles.row, { gap: 4, height: 14, justifyContent: "center" }]}>
              <Glyph family={MSF} name="movie" size={14} color={SHOWS.white} />
              <CustomText
                label="Don’t miss what’s next...!"
                fontSize={14}
                fontFamily={fonts.medium}
                letterSpacing={-0.42}
                color={SHOWS.white}
                marginTop={fitLine(14, 14)}
                marginBottom={fitLine(14, 14)}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={buying}
              onPress={onUnlock}
              style={styles.unlockRing}
            >
              <View style={styles.unlockInner}>
                {buying ? (
                  <ActivityIndicator color={SHOWS.section} />
                ) : (
                  <CustomText
                    label={needsPurchase ? `Buy Now · ${price}` : "Watch the full season now"}
                    fontSize={18}
                    fontFamily={fonts.medium}
                    color={SHOWS.section}
                    numberOfLines={1}
                    marginTop={fitLine(18, 44)}
                    marginBottom={fitLine(18, 44)}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View
            pointerEvents={uiVisible ? "box-none" : "none"}
            style={[
              styles.bottom,
              { paddingHorizontal: padH, paddingBottom: padBottom },
              { opacity: chromeOpacity, transform: [{ translateY: chromeTranslateBottom }] },
            ]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(18, 18, 18, 0)", "rgba(18, 18, 18, 0.64)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.row, { gap: 4, height: 14 }]}>
              <Glyph family={MSF} name="movie" size={14} color={SHOWS.white} />
              <CustomText
                label={`You’re watching: ${episode?.title || ""}`}
                fontSize={14}
                fontFamily={fonts.medium}
                letterSpacing={-0.42}
                color={SHOWS.white}
                numberOfLines={1}
                marginTop={fitLine(14, 14)}
                marginBottom={fitLine(14, 14)}
                containerStyle={styles.shrink}
              />
            </View>
            <View style={styles.controls}>
              <Circle40 icon={muted ? "volume_off" : "volume_up"} iconSize={16} filled onPress={() => setMuted((m) => !m)} />
              <View style={[styles.row, { gap: 8 }]}>
                <Transport icon="fast_rewind" onPress={() => seekBy(-SEEK_STEP)} />
                <Transport icon={paused ? "play_arrow" : "pause"} onPress={togglePlay} />
                <Transport icon="fast_forward" onPress={() => seekBy(SEEK_STEP)} />
              </View>
              <View style={[styles.row, { gap: 8 }]}>
                <Circle40
                  icon={landscape ? "fullscreen_exit" : "fullscreen"}
                  iconSize={20}
                  onPress={() => {
                    setLandscape((v) => !v);
                    showUi();
                  }}
                />
                <Circle40 icon="skip_next" iconSize={20} filled onPress={() => seekBy(durationS)} />
              </View>
            </View>
            <GestureDetector gesture={barGesture}>
              <Reanimated.View
                onLayout={(e) => {
                  barWidth.value = e.nativeEvent.layout.width;
                }}
                style={[styles.bar, barStyle]}
              >
                <GlassFill fill={SHOWS.white16} blurAmount={32} />
                <Reanimated.View style={[styles.barFill, fillStyle]} />
              </Reanimated.View>
            </GestureDetector>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

export default memo(EpisodePlayerView);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    gap: 2,
  },
  headerRow: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circle40: {
    width: 40,
    height: 40,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  circle32: {
    width: 32,
    height: 32,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: SHOWS.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  viewsPill: {
    height: 32,
    paddingLeft: 10,
    paddingRight: 12,
    borderRadius: 100,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    gap: 8,
  },
  controls: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  transportRing: {
    width: 48,
    height: 48,
    padding: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: SHOWS.white16,
  },
  transportInner: {
    flex: 1,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    height: BAR_H,
    borderRadius: 100,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 100,
    backgroundColor: SHOWS.white,
  },
  lockBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 32,
    paddingHorizontal: 12,
    gap: 8,
    overflow: "hidden",
  },
  unlockRing: {
    height: 52,
    padding: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: SHOWS.white48,
  },
  unlockInner: {
    flex: 1,
    borderRadius: 100,
    backgroundColor: SHOWS.white,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
