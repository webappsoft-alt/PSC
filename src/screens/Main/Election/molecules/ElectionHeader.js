import { useEffect, useState } from "react";
import { BlurView } from "@react-native-community/blur";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import fonts from "../../../../assets/fonts";
import FlagImage from "../../../../components/FlagImage";
import GlassBackButton, { GlassSurface } from "../../../../components/GlassBackButton";
import HeaderProgressiveBlur from "../../../../components/HeaderProgressiveBlur";
import { EL, Fit, Glyph, MS, toTitle } from "./electionLayout";

/**
 * Figma BACKGROUND_BLUR 16 = Gaussian σ 8pt of what is behind the control
 * (the hero photo + its #121212 gradient), then the white 4% fill. A native
 * blur material always adds its own tint/saturation (the grey blob the
 * client rejected), so over the hero we draw the exact backdrop instead: the
 * same cover photo, blurred σ 8pt, under the same gradient, offset so it
 * lines up pixel-for-pixel with the hero behind the control.
 */
const BLUR_SIGMA = 8; // Figma background blur 16 / 2

const useBlurRadius = (uri, w, h) => {
  // RN blurRadius is σ in the source image's pixels → convert from points
  const [r, setR] = useState(0);
  useEffect(() => {
    let alive = true;
    if (!uri) return undefined;
    Image.getSize(
      uri,
      (iw, ih) => {
        const ptPerPx = Math.max(w / iw, h / ih); // cover scale
        if (alive && ptPerPx > 0) setR(BLUR_SIGMA / ptPerPx);
      },
      () => alive && setR(BLUR_SIGMA)
    );
    return () => {
      alive = false;
    };
  }, [uri, w, h]);
  return r;
};

/** Hero background replica, offset by the control's position in the hero */
const HeroBackdrop = ({ backdrop }) => {
  const { width } = useWindowDimensions();
  const { coverImage, leaderColor, isDepartement, insetTop, x = 0, y = 0 } = backdrop;
  const height = heroHeight(insetTop, isDepartement);
  const blurRadius = useBlurRadius(isDepartement ? null : coverImage, width, height);
  const box = { position: "absolute", left: -x, top: -y, width, height };
  if (isDepartement) {
    return (
      <LinearGradient
        colors={[EL.section, EL.section, leaderColor || EL.section]}
        locations={[0, 0.48, 1]}
        style={box}
      />
    );
  }
  return (
    <View style={[box, { backgroundColor: EL.section }]}>
      {coverImage && blurRadius > 0 ? (
        <Image
          source={{ uri: coverImage }}
          resizeMode="cover"
          blurRadius={blurRadius}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <LinearGradient
        colors={["rgba(18, 18, 18, 1)", "rgba(18, 18, 18, 0)"]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const HeaderGlass = ({ backdrop }) => (
  <GlassSurface>{backdrop ? <HeroBackdrop backdrop={backdrop} /> : undefined}</GlassSurface>
);

/**
 * Figma "Header" — national (8103:4542): 147 = 44 + pad 8 · row 40 · 15 ·
 * tabs 32 · 8, cover image under #121212 100% → 0% (top → bottom).
 * Département (8127:7682): 140 = 44 + pad 8 · row 40 · 8 · tabs 32 · 8,
 * #121212 (to 48%) → the leader's colour.
 *
 * The hero scrolls with the page; the top row (back · Follow Topic / flag ·
 * name) floats over it with the PSC progressive-blur header, which only
 * shows once content sits under it.
 */
export const TABS = ["Overview", "Demography", "Candidates"];
const ROW = 40;
const PAD_TOP = 8;
const PAD_BOTTOM = 8;
const TABS_H = 32;

export const heroHeight = (insetTop, isDepartement) =>
  insetTop + PAD_TOP + ROW + (isDepartement ? 8 : 15) + TABS_H + PAD_BOTTOM;
export const barHeight = (insetTop) => insetTop + PAD_TOP + ROW + 8;

/** Back button (Figma Frame 209): the app's shared GlassBackButton */
/**
 * `fade` = the page's headerVisible Animated.Value (0 at rest over the hero,
 * 1 once content scrolls under the bar): the exact hero backdrop fades out
 * and the live blur (what is then behind the button) takes over.
 */
export const BackButton = ({ onPress, backdrop, fade }) => (
  <GlassBackButton
    onPress={onPress}
    backdrop={
      backdrop ? (
        <>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={16}
            overlayColor="transparent"
            reducedTransparencyFallbackColor="rgba(18, 18, 18, 0.64)"
          />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              fade?.interpolate
                ? { opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }
                : null,
            ]}
          >
            <HeroBackdrop backdrop={backdrop} />
          </Animated.View>
        </>
      ) : undefined
    }
  />
);

/** "Follow Topic +" (Figma Frame 210): 28 · pad L8 R6 · 1 inside @48 · r100 */
const FollowTopic = ({ following, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.follow}>
    <Fit
      size={12}
      box={8}
      label={following ? "Following" : "Follow Topic"}
      fontFamily={fonts.medium}
      letterSpacing={-0.12}
      color={EL.white}
    />
    <Glyph family={MS} name={following ? "check" : "add"} size={14} color={EL.white} />
  </TouchableOpacity>
);

/** Département title: flag 36 × 24 · 8 · Medium 32 / −0.5 */
const PlaceTitle = ({ name }) => (
  <View style={styles.place}>
    <FlagImage code="fr" width={36} height={24} radius={0} />
    <Fit
      size={32}
      box={22}
      label={toTitle(name)}
      fontFamily={fonts.medium}
      letterSpacing={-0.5}
      color={EL.white}
      containerStyle={styles.shrink}
    />
  </View>
);

/** Tabs (Figma Frame 47): gap 3 · 32 · pad 12 · r100 — active white 4% + blur */
/** Scrolls sideways when the tabs are wider than the screen (topic hub: 5 tabs) */
const Tabs = ({ tabs = TABS, active, onChange, backdrop }) => {
  const [xs, setXs] = useState({});
  const [scrollX, setScrollX] = useState(0);
  return (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.tabsScroll}
    contentContainerStyle={styles.tabs}
    onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
    scrollEventThrottle={16}
  >
    {tabs.map((t) => {
      const on = t === active;
      return (
        <TouchableOpacity
          key={t}
          activeOpacity={0.8}
          onPress={() => onChange?.(t)}
          onLayout={(e) => {
            const lx = e.nativeEvent.layout.x;
            setXs((p) => (p[t] === lx ? p : { ...p, [t]: lx }));
          }}
          style={[styles.tab, !on && styles.tabOff]}
        >
          {on ? (
            <HeaderGlass
              backdrop={
                backdrop && xs[t] != null
                  ? { ...backdrop, x: xs[t] - scrollX }
                  : undefined
              }
            />
          ) : null}
          <Fit
            size={14}
            box={10}
            label={t}
            fontFamily={fonts.medium}
            color={on ? EL.white : EL.white64}
          />
        </TouchableOpacity>
      );
    })}
  </ScrollView>
  );
};

/**
 * Scrolling hero: background + (row space) + tabs. `tabs` is optional
 * (the topic hub passes Summary · Context · People · Timeline · Coverage).
 */
export const ElectionHero = ({
  insetTop,
  coverImage,
  leaderColor,
  isDepartement,
  tab,
  onTab,
  tabs = TABS,
}) => (
  <View style={[styles.hero, { height: heroHeight(insetTop, isDepartement) }]}>
    {isDepartement ? (
      <LinearGradient
        colors={[EL.section, EL.section, leaderColor || EL.section]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
    ) : (
      <>
        {coverImage ? (
          <FastImage source={{ uri: coverImage }} style={StyleSheet.absoluteFill} />
        ) : null}
        <LinearGradient
          colors={["rgba(18, 18, 18, 1)", "rgba(18, 18, 18, 0)"]}
          style={StyleSheet.absoluteFill}
        />
      </>
    )}
    <View style={{ height: insetTop + PAD_TOP + ROW + (isDepartement ? 8 : 15) }} />
    <Tabs
      tabs={tabs}
      active={tab}
      onChange={onTab}
      backdrop={{
        coverImage,
        leaderColor,
        isDepartement,
        insetTop,
        y: insetTop + PAD_TOP + ROW + (isDepartement ? 8 : 15),
      }}
    />
  </View>
);

/** Floating top row over the hero (and over the content once scrolled) */
export const ElectionTopBar = ({
  insetTop,
  visible,
  onBack,
  isDepartement,
  placeName,
  following,
  onFollow,
  coverImage,
  leaderColor,
}) => (
  <View
    pointerEvents="box-none"
    style={[styles.bar, { height: barHeight(insetTop), paddingTop: insetTop + PAD_TOP }]}
  >
    <HeaderProgressiveBlur visible={visible} color={EL.section} />
    <View style={[styles.row, isDepartement ? styles.rowDep : styles.rowNat]}>
      {/* over the hero: exact backdrop; once content scrolls under: live blur */}
      <BackButton
        onPress={onBack}
        fade={visible}
        backdrop={{ coverImage, leaderColor, isDepartement, insetTop, x: 12, y: insetTop + PAD_TOP }}
      />
      {isDepartement ? (
        <PlaceTitle name={placeName} />
      ) : (
        <FollowTopic following={following} onPress={onFollow} />
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  hero: {
    paddingHorizontal: 12,
    backgroundColor: EL.section,
    overflow: "hidden",
  },
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  row: {
    height: ROW,
    flexDirection: "row",
    alignItems: "center",
  },
  rowNat: { justifyContent: "space-between", gap: 12 },
  rowDep: { gap: 8 },
  follow: {
    height: 28,
    paddingLeft: 8,
    paddingRight: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: EL.white48,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  place: {
    flex: 1,
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabsScroll: { flexGrow: 0, marginHorizontal: -12 },
  tabs: {
    paddingHorizontal: 12,
    height: TABS_H,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  tab: {
    height: TABS_H,
    paddingHorizontal: 12,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  tabOff: {
    borderWidth: 1,
    borderColor: EL.white04,
  },
});
