import { NativeModules } from "react-native";

/**
 * VideoSDK-only WebRTCModule APIs missing when Stream's WebRTC is autolinked
 * (see react-native.config.js). No-op shims prevent MeetingProvider teardown crashes.
 */
const mod = NativeModules?.WebRTCModule as Record<string, unknown> | undefined;
if (mod) {
  const noop = () => {};
  const noopFalse = () => false;

  const videoSdkOnlyMethods: Record<string, () => unknown> = {
    applyVideoProcessor: noop,
    removeVideoProcessor: noop,
    setupNotification: noop,
    stopScreenShare: noop,
    startSystemAudioShare: noop,
    stopSystemAudioShare: noop,
    isScreenShareRunning: noopFalse,
  };

  for (const [name, fallback] of Object.entries(videoSdkOnlyMethods)) {
    if (typeof mod[name] !== "function") {
      mod[name] = fallback;
    }
  }
}
