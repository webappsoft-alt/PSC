import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter, Image, Platform } from "react-native";

/**
 * Feed topic preferences (Figma "Pick Your Interests"), ported from Viral's
 * utils/feedTopics: ordered list of { name, enabled }. The enabled, ordered
 * names drive the header topic chips; order = user's drag order.
 */
export const FEED_TOPICS_STORAGE_KEY = "psc.feedTopics";
export const FEED_TOPICS_CHANGED_EVENT = "FEED_TOPICS_CHANGED";

// Same list / order as the backend `getPostsSchema` topic enum used by the feed
export const PSC_TOPICS = [
  { name: "Technology", emoji: "💡", animation: require("../assets/animations/topics/technology.anim") },
  { name: "Politics", emoji: "🏛️", animation: require("../assets/animations/topics/politics.anim") },
  { name: "Sports", emoji: "🏀", animation: require("../assets/animations/topics/sports.anim") },
  { name: "Music", emoji: "🎵", animation: require("../assets/animations/topics/music.anim") },
  { name: "Fashion", emoji: "👗", animation: require("../assets/animations/topics/fashion.anim") },
  { name: "Entertainment", emoji: "🎬", animation: require("../assets/animations/topics/entertainment.anim") },
  { name: "Gaming", emoji: "🎮", animation: require("../assets/animations/topics/gaming.anim") },
  { name: "Food", emoji: "🍔", animation: require("../assets/animations/topics/food.anim") },
  { name: "Health", emoji: "💚", animation: require("../assets/animations/topics/health.anim") },
];

/**
 * Topic Lotties, loaded the way Viral does it (assets/images/topics/index.ts):
 * the `.anim` files are Lottie JSON bundled as Metro *assets*, so the JS bundle
 * holds only asset ids (no 1.3 MB JSON.stringify on the JS thread, no
 * main-thread decode on iOS).
 *  - iOS: `prefetchTopicAnimations()` (called at app start) copies each file
 *    to a local cache file once; LottieView then gets a `file://` uri and
 *    decodes it off the main thread. Without the copy, every sheet open
 *    re-downloaded ~1.3 MB from the packager in dev — the icon delay.
 *  - Android: the asset id → lottie-android loads the raw resource (release)
 *    or packager URL (dev) in the background, and caches the composition.
 */
const localUris = {};
let prefetchPromise = null;
let prefetchDone = Platform.OS !== "ios";

export function areTopicAnimationsReady() {
  return prefetchDone;
}

export function prefetchTopicAnimations() {
  if (prefetchDone) return Promise.resolve();
  if (!prefetchPromise) {
    // lazy require keeps this util importable where RNFS isn't linked
    const RNFS = require("react-native-fs");
    const dir = `${RNFS.CachesDirectoryPath}/psc-topic-anims`;
    prefetchPromise = RNFS.mkdir(dir)
      .catch(() => {})
      .then(() =>
        Promise.all(
          PSC_TOPICS.map(async (topic) => {
            const uri = Image.resolveAssetSource(topic.animation)?.uri;
            if (!uri) return;
            if (!/^https?:/i.test(uri)) {
              localUris[topic.name] = uri; // release: already a bundled file
              return;
            }
            const hash = /[?&]hash=([^&]+)/.exec(uri)?.[1] || "dev";
            const path = `${dir}/${topic.name.toLowerCase()}-${hash}.json`;
            try {
              if (!(await RNFS.exists(path))) {
                await RNFS.downloadFile({ fromUrl: uri, toFile: path }).promise;
              }
              localUris[topic.name] = `file://${path}`;
            } catch (e) {
              localUris[topic.name] = uri;
            }
          }),
        ),
      )
      .then(() => {
        prefetchDone = true;
      });
  }
  return prefetchPromise;
}

/** LottieView source for a topic, or null while the iOS prefetch runs. */
export function topicAnimationSource(name) {
  const topic = findTopic(name);
  if (!topic?.animation) return null;
  if (Platform.OS !== "ios") return topic.animation;
  const uri = localUris[topic.name];
  return uri ? { uri } : null;
}

export const findTopic = (name) =>
  PSC_TOPICS.find((t) => t.name.toLowerCase() === String(name || "").toLowerCase());

/** Merge saved prefs with the canonical list (new topics appended, enabled). */
export function resolveFeedTopics(saved) {
  const result = [];
  const seen = new Set();
  for (const item of saved || []) {
    const def = findTopic(item?.name);
    if (!def || seen.has(def.name)) continue;
    seen.add(def.name);
    result.push({ name: def.name, enabled: item.enabled !== false });
  }
  for (const topic of PSC_TOPICS) {
    if (seen.has(topic.name)) continue;
    result.push({ name: topic.name, enabled: true });
  }
  return result;
}

export const enabledTopicNames = (prefs) =>
  resolveFeedTopics(prefs)
    .filter((t) => t.enabled)
    .map((t) => t.name);

let cache = null;

export async function loadFeedTopics() {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(FEED_TOPICS_STORAGE_KEY);
    cache = resolveFeedTopics(raw ? JSON.parse(raw) : null);
  } catch (e) {
    cache = resolveFeedTopics(null);
  }
  return cache;
}

export async function persistFeedTopics(next) {
  cache = resolveFeedTopics(next);
  try {
    await AsyncStorage.setItem(FEED_TOPICS_STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {
    // best effort — keep the in-memory value
  }
  DeviceEventEmitter.emit(FEED_TOPICS_CHANGED_EVENT, cache);
  return cache;
}

export function getCachedFeedTopics() {
  return cache || resolveFeedTopics(null);
}
