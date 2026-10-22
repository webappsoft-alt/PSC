import { Animated, Easing } from "react-native";
import { getSegmentsAverageColor } from "@somesoap/react-native-image-palette";

/**
 * Adaptive bottom-nav tone (client note + iOS 26 TabView behaviour): the
 * glass tab bar's icons turn dark while light media scrolls behind it and
 * back to light over dark media.
 *
 * - Each feed post registers its media view + the brightness of N horizontal
 *   bands of the image (native average colour per band).
 * - On scroll, the media under the tab bar is found (measureInWindow) and the
 *   band at the bar's height decides the tone.
 * - `navToneAnim` (0 = dark backdrop → light icons, 1 = light backdrop →
 *   dark icons) is animated, and the tab bar cross-fades its icons with it.
 */
export const BANDS = 12;
const LIGHT_ON = 0.55; // lightness above → light backdrop (iOS flips around mid-tones)
const LIGHT_OFF = 0.45; // hysteresis so the icons don't flicker at the edge

export const navToneAnim = new Animated.Value(0);

const media = new Map(); // key → { ref, bands: number[] | null }
let navRect = null; // { y, height } of the tab bar in window coords
let tone = 0;
let enabled = true;
let pending = false;

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})/i.exec(String(hex || ""));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * lin((n >> 16) & 255) +
    0.7152 * lin((n >> 8) & 255) +
    0.0722 * lin(n & 255)
  );
}

// Perceived lightness (0..1) is closer to how iOS decides than raw luminance
const lightness = (hex) => {
  const y = luminance(hex);
  return y == null ? null : y <= 0.008856 ? y * 9.033 : 1.16 * Math.cbrt(y) - 0.16;
};

/** Brightness of BANDS horizontal strips of an image (cached per uri). */
const bandCache = new Map();
export async function measureImageBands(uri) {
  if (!uri) return null;
  if (bandCache.has(uri)) return bandCache.get(uri);
  const segments = Array.from({ length: BANDS }, (_, i) => ({
    fromX: 0,
    toX: 100,
    fromY: Math.round((i * 100) / BANDS),
    toY: Math.round(((i + 1) * 100) / BANDS),
  }));
  try {
    const colors = await getSegmentsAverageColor(uri, segments);
    const bands = colors.map((c) => lightness(c) ?? 0);
    bandCache.set(uri, bands);
    return bands;
  } catch (e) {
    return null;
  }
}

function setTone(next) {
  if (next === tone) return;
  tone = next;
  Animated.timing(navToneAnim, {
    toValue: next,
    duration: 220,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start();
}

export function setNavRect(rect) {
  navRect = rect;
}

export function setNavToneEnabled(on) {
  enabled = on;
  if (!on) setTone(0);
  else evaluateNavTone();
}

export function registerNavMedia(key, ref, bands) {
  media.set(key, { ref, bands });
  evaluateNavTone();
}

export function unregisterNavMedia(key) {
  media.delete(key);
}

/** Re-check what is under the tab bar (cheap; coalesced to one per frame). */
let evalId = 0;
export function evaluateNavTone() {
  if (!enabled || !navRect || pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    const id = ++evalId;
    const probeY = navRect.y + navRect.height / 2;
    const entries = Array.from(media.entries()).filter(
      ([, m]) => m.ref && m.bands && m.bands.length,
    );
    if (!entries.length) {
      setTone(0);
      return;
    }
    // Each measurement decides on its own: a hit applies immediately, and a
    // miss only clears the tone once every view has answered — a view that
    // never answers (unmounted / stale after a reload) is dropped instead of
    // blocking all later evaluations.
    let left = entries.length;
    let hit = false;
    const miss = () => {
      left -= 1;
      if (left === 0 && !hit && id === evalId) setTone(0);
    };
    entries.forEach(([key, m]) => {
      let answered = false;
      m.ref.measureInWindow?.((x, y, w, h) => {
        answered = true;
        if (id !== evalId) return;
        if (h > 0 && probeY >= y && probeY <= y + h) {
          const idx = Math.min(
            m.bands.length - 1,
            Math.max(0, Math.floor(((probeY - y) / h) * m.bands.length)),
          );
          const l = m.bands[idx];
          hit = true;
          if (tone === 1) setTone(l < LIGHT_OFF ? 0 : 1);
          else setTone(l > LIGHT_ON ? 1 : 0);
          left -= 1;
        } else {
          miss();
        }
      });
      setTimeout(() => {
        if (!answered) {
          media.delete(key);
          miss();
        }
      }, 100);
    });
  });
}
