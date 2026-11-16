/**
 * Animated launch screen — Figma › Social Feed › SplashScreen (2319:3527)
 * → SplashScreen_2 (2319:3551).
 *
 * Starts exactly where the native launch screen ends (black, white 80pt star
 * centred), fades in the dark tile grid, then morphs into the second frame:
 * the tiles turn white 6 % and re-flow, the star travels to its tile while
 * turning gold, the wordmark and the copyright fade in. Then it fades out
 * over the app. All values are the Figma frames' (375 × 812, positioned from
 * the screen centre so every device size lines up with the native splash).
 */
import { useRef } from "react";
import { Platform, StatusBar, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import BootSplash from "react-native-bootsplash";
import Svg, { Defs, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import fonts from "../assets/fonts";
import CustomText from "./CustomText";

const GOLD = "#A19375";
const GRAD_END = "#1F1F20"; // Figma stop 2 (0.1217, 0.1208, 0.1255)
const STAR =
  "M40 0C40 0 42.207 20.5997 50.8036 29.1964C59.4002 37.793 80 40 80 40C80 40 59.4002 42.207 50.8036 50.8036C42.207 59.4002 40 80 40 80C40 80 37.793 59.4002 29.1964 50.8036C20.5997 42.207 0 40 0 40C0 40 20.5997 37.793 29.1964 29.1964C37.793 20.5997 40 0 40 0Z";

// frame 1: tiles 160 × 180, pitch 164 / 184, #121212
// frame 2: tiles 160 × 160, pitch 164 / 164, white 6 %
const COLS_A = [-56, 108, 272, 436];
const COLS_B = [-108, 56, 220, 384];
const ROWS = [-1, 0, 1, 2, 3, 4, 5, 6];
const rowA = (r) => -52 + r * 184;
const rowB = (r) => -46 + r * 164;
// frame 2, row 2: cols 1–2 merge into one 324-wide tile that holds the wordmark
const WIDE = { r: 2, c: 1 };
const HIDDEN = { r: 2, c: 2 };

const EASE = Easing.bezier(0.65, 0, 0.35, 1);
const T = { grid: 350, morph: 950, text: 450, hold: 750, out: 380 };

const Tile = ({ r, c, p, grid, cx, cy }) => {
  const wide = r === WIDE.r && c === WIDE.c;
  const hidden = r === HIDDEN.r && c === HIDDEN.c;
  // start / end positions on screen (plain numbers for the UI thread)
  const x0 = cx + COLS_A[c];
  const x1 = cx + COLS_B[c];
  const y0 = cy + rowA(r);
  const y1 = cy + rowB(r);
  const style = useAnimatedStyle(() => ({
    left: interpolate(p.value, [0, 1], [x0, x1]),
    top: interpolate(p.value, [0, 1], [y0, y1]),
    width: wide ? interpolate(p.value, [0, 1], [160, 324]) : 160,
    height: interpolate(p.value, [0, 1], [180, 160]),
    // white 6 % over the black background = #0F0F0F; blending two opaque
    // colours avoids the half-transparent grey flash mid-morph
    backgroundColor: interpolateColor(p.value, [0, 1], ["#121212", "#0F0F0F"]),
    opacity: grid.value * (hidden ? interpolate(p.value, [0, 0.6], [1, 0], "clamp") : 1),
  }));
  // the widening tile slides over the one it absorbs
  return <Animated.View style={[styles.tile, wide && { zIndex: 1 }, style]} />;
};

const AnimatedSplash = ({ onFinish }) => {
  const { width: W, height: H } = useWindowDimensions();
  const grid = useSharedValue(0); // tile grid fade-in
  const p = useSharedValue(0); // frame 1 → frame 2
  const title = useSharedValue(0);
  const sub = useSharedValue(0);
  const legal = useSharedValue(0);
  const out = useSharedValue(1);

  // Figma frame coordinates → screen, anchored on the centre (187.5, 406)
  const cx = W / 2 - 187.5;
  const cy = H / 2 - 406;

  // the native launch screen (same black + white star) stays up until this
  // view is on screen, then hands over without a gap
  const start = () => {
    const t0 = T.grid;
    grid.value = withTiming(1, { duration: T.grid, easing: Easing.out(Easing.quad) });
    p.value = withDelay(t0, withTiming(1, { duration: T.morph, easing: EASE }));
    const tText = t0 + T.morph * 0.7;
    title.value = withDelay(tText, withTiming(1, { duration: T.text, easing: Easing.out(Easing.cubic) }));
    sub.value = withDelay(tText + 120, withTiming(1, { duration: T.text, easing: Easing.out(Easing.cubic) }));
    legal.value = withDelay(tText + 240, withTiming(1, { duration: T.text }));
    const tOut = t0 + T.morph + T.text + T.hold;
    out.value = withDelay(
      tOut,
      withTiming(0, { duration: T.out, easing: Easing.in(Easing.quad) }, (done) => {
        if (done && onFinish) runOnJS(onFinish)();
      }),
    );
  };
  const started = useRef(false);
  const onLayout = () => {
    if (started.current) return;
    started.current = true;
    BootSplash.hide({ fade: false })
      .catch(() => {})
      .finally(start);
  };

  const rootStyle = useAnimatedStyle(() => ({ opacity: out.value }));
  // star: centred (native splash position) → its tile in frame 2, 90° turn
  const starStyle = useAnimatedStyle(() => ({
    left: interpolate(p.value, [0, 1], [W / 2 - 40, cx + 96]),
    top: interpolate(p.value, [0, 1], [H / 2 - 40, cy + 158]),
    transform: [{ rotate: `${interpolate(p.value, [0, 1], [0, 90])}deg` }],
  }));
  const goldStyle = useAnimatedStyle(() => ({ opacity: p.value }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.value,
    transform: [{ translateY: interpolate(title.value, [0, 1], [12, 0]) }],
  }));
  const subStyle = useAnimatedStyle(() => ({
    opacity: sub.value,
    transform: [{ translateY: interpolate(sub.value, [0, 1], [12, 0]) }],
  }));
  const legalStyle = useAnimatedStyle(() => ({ opacity: legal.value }));

  const tiles = [];
  for (const r of ROWS) for (let c = 0; c < COLS_A.length; c++) tiles.push({ r, c });

  return (
    <Animated.View style={[styles.root, rootStyle]} pointerEvents="none" onLayout={onLayout}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {tiles.map(({ r, c }) => (
        <Tile key={`${r}-${c}`} r={r} c={c} p={p} grid={grid} cx={cx} cy={cy} />
      ))}

      <Animated.View style={[styles.star, starStyle]}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Path d={STAR} fill="#FFFFFF" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, goldStyle]}>
          <Svg width={80} height={80} viewBox="0 0 80 80">
            <Path d={STAR} fill={GOLD} />
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* wordmark — Figma frame 2390:8155 at (77, 303), 209 × 118, gap 20 */}
      <View style={[styles.wordmark, { left: cx + 77, top: cy + 303 }]}>
        <Animated.View style={titleStyle}>
          <Svg width={209} height={43}>
            <Defs>
              <LinearGradient id="gTitle" x1="0" y1="0" x2="209" y2="43" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={GOLD} />
                <Stop offset="1" stopColor={GRAD_END} />
              </LinearGradient>
            </Defs>
            {/* Clash Display Semibold 64, cap-height box 43 → baseline 43 */}
            <SvgText
              x={0}
              y={43}
              fill="url(#gTitle)"
              fontSize={64}
              fontWeight="600"
              fontFamily={Platform.OS === "ios" ? "Clash Display Variable" : fonts.ClashDisplay}
            >
              PSC
            </SvgText>
          </Svg>
        </Animated.View>
        <Animated.View style={[{ marginTop: 20 }, subStyle]}>
          <Svg width={209} height={55}>
            <Defs>
              <LinearGradient id="gSub" x1="0" y1="0" x2="209" y2="55" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={GOLD} />
                <Stop offset="1" stopColor={GRAD_END} />
              </LinearGradient>
            </Defs>
            {/* Poppins Medium 32, line height 104 %, -2 %; cap-trimmed box 55 */}
            <SvgText x={0} y={22} fill="url(#gSub)" fontSize={32} letterSpacing={-0.64} fontFamily={fonts.medium}>
              Private Social
            </SvgText>
            <SvgText x={0} y={55} fill="url(#gSub)" fontSize={32} letterSpacing={-0.64} fontFamily={fonts.medium}>
              Club
            </SvgText>
          </Svg>
        </Animated.View>
      </View>

      {/* © — Figma 2390:8148 at (12, 693), 351 wide, Poppins 10 / 140 %, -2 %, gold 48 % */}
      <Animated.View style={[styles.legal, { left: cx + 12, top: cy + 693 }, legalStyle]}>
        <CustomText
          label="© 2026 Sola Group. All rights reserved. Sola Group, SG, the Sola Group logo, Private Social Club, Private Social Club (stylized), PSC, PSC logo are trademarks or registered of Sola Group in the USA and elsewhere.  All other trademarks are the property of their respective owners."
          fontSize={10}
          fontFamily={fonts.regular}
          letterSpacing={-0.2}
          color="rgba(161,147,117,0.48)"
          textAlign="center"
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    overflow: "hidden",
    zIndex: 10000,
    elevation: 10000,
  },
  tile: { position: "absolute", borderRadius: 32 },
  star: { position: "absolute", width: 80, height: 80, zIndex: 2 },
  wordmark: { position: "absolute", width: 209, zIndex: 2 },
  legal: { position: "absolute", width: 351, zIndex: 2 },
});

export default AnimatedSplash;
