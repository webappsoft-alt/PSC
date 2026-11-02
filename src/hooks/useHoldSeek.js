import { useCallback, useEffect, useRef, useState } from "react";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

/**
 * Hold the left / right half of a player to scrub backward / forward —
 * ported from Viral (hooks/useHoldSeek.ts, used by its Reels, Stories and
 * episode player). While held, playback pauses and the position moves at
 * HOLD_SEEK_RATE × real time in that direction; letting go resumes.
 */
export const HOLD_SEEK_RATE = 1.5;
const SEEK_TICK_MS = 50;

export function useHoldSeek({
  enabled = true,
  getPositionMs,
  getDurationMs,
  seekTo,
  pause,
  resume,
}) {
  const [side, setSide] = useState(null); // "backward" | "forward" | null
  const sideRef = useRef(null);
  const posRef = useRef(0);
  const tickRef = useRef(null);
  const handlers = useRef({});
  handlers.current = { getPositionMs, getDurationMs, seekTo, pause, resume };

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (!sideRef.current) return;
    clearTick();
    sideRef.current = null;
    setSide(null);
    handlers.current.resume?.();
  }, [clearTick]);

  const startAtX = useCallback(
    (locationX, containerWidth) => {
      if (!enabled || !(containerWidth > 0) || sideRef.current) return;
      const total = handlers.current.getDurationMs?.() || 0;
      if (total <= 0) return;

      const next = locationX < containerWidth / 2 ? "backward" : "forward";
      sideRef.current = next;
      posRef.current = handlers.current.getPositionMs?.() || 0;
      setSide(next);
      try {
        ReactNativeHapticFeedback.trigger("impactLight", {
          enableVibrateFallback: false,
          ignoreAndroidSystemSettings: false,
        });
      } catch (_) {}

      handlers.current.pause?.();
      const direction = next === "forward" ? 1 : -1;
      clearTick();
      tickRef.current = setInterval(() => {
        const duration = handlers.current.getDurationMs?.() || 0;
        let pos = posRef.current + direction * HOLD_SEEK_RATE * SEEK_TICK_MS;
        pos = Math.max(0, duration > 0 ? Math.min(duration, pos) : pos);
        posRef.current = pos;
        handlers.current.seekTo?.(pos);
      }, SEEK_TICK_MS);
    },
    [clearTick, enabled],
  );

  useEffect(() => () => clearTick(), [clearTick]);
  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  return { side, startAtX, stop, isActiveRef: sideRef };
}

export default useHoldSeek;
