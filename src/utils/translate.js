import { NativeModules, Platform } from "react-native";

/** Device language (e.g. "en") — the target for chat translations. */
export const deviceLanguage = () => {
  const locale =
    Platform.OS === "ios"
      ? NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
      : NativeModules.I18nManager?.localeIdentifier;
  return String(locale || "en").replace("_", "-").split("-")[0] || "en";
};

/**
 * Translate `text` to the device language with Google Translate (public
 * endpoint, auto-detects the source). Returns null when it fails.
 */
export const translateText = async (text, to = deviceLanguage()) => {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto" +
    `&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const out = Array.isArray(data?.[0]) ? data[0].map((p) => p?.[0] || "").join("") : "";
  return out.trim() || null;
};
