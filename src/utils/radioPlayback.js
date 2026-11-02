import { useSyncExternalStore } from "react";

/**
 * Radio / Audio Post playback position, shared by the global PlayerCard
 * (which owns the one react-native-video player) and the detail page.
 * Kept out of Redux on purpose: it changes every 250 ms and the store is
 * persisted.
 */
let videoRef = null;
// a seek in flight: progress ticks from before it would pull the thumb back
let pendingSeek = null; // { target, until }
let state = { positionMs: 0, durationMs: 0, muted: false };
const listeners = new Set();

const emit = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const radioPlayback = {
  attach(ref) {
    videoRef = ref;
  },
  detach(ref) {
    if (videoRef === ref) videoRef = null;
  },
  /** Seek the loaded radio; the timeline moves at once. */
  seek(ms) {
    const target = Math.max(0, ms || 0);
    pendingSeek = { target, until: Date.now() + 1500 };
    emit({ positionMs: target });
    try {
      videoRef?.current?.seek?.(target / 1000);
    } catch (_) {}
  },
  setMuted(muted) {
    emit({ muted: !!muted });
  },
  progress(positionMs, durationMs) {
    const pos = Math.max(0, positionMs || 0);
    if (pendingSeek) {
      const landed = Math.abs(pos - pendingSeek.target) < 750;
      if (landed || Date.now() > pendingSeek.until) pendingSeek = null;
      else return; // stale tick from before the seek
    }
    const patch = { positionMs: pos };
    if (durationMs > 0) patch.durationMs = durationMs;
    emit(patch);
  },
  reset() {
    pendingSeek = null;
    emit({ positionMs: 0, durationMs: 0 });
  },
  getState: () => state,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useRadioPlayback = () =>
  useSyncExternalStore(radioPlayback.subscribe, radioPlayback.getState);

export default radioPlayback;
