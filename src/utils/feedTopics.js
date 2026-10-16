import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";

/**
 * Feed topic preferences (Figma "Pick Your Interests"), ported from Viral's
 * utils/feedTopics: ordered list of { name, enabled }. The enabled, ordered
 * names drive the header topic chips; order = user's drag order.
 */
export const FEED_TOPICS_STORAGE_KEY = "psc.feedTopics";
export const FEED_TOPICS_CHANGED_EVENT = "FEED_TOPICS_CHANGED";

// Same list / order as the backend `getPostsSchema` topic enum used by the feed
export const PSC_TOPICS = [
  { name: "Technology", emoji: "💡", animation: require("../assets/animations/topics/technology.json") },
  { name: "Politics", emoji: "🏛️", animation: require("../assets/animations/topics/politics.json") },
  { name: "Sports", emoji: "🏀", animation: require("../assets/animations/topics/sports.json") },
  { name: "Music", emoji: "🎵", animation: require("../assets/animations/topics/music.json") },
  { name: "Fashion", emoji: "👗", animation: require("../assets/animations/topics/fashion.json") },
  { name: "Entertainment", emoji: "🎬", animation: require("../assets/animations/topics/entertainment.json") },
  { name: "Gaming", emoji: "🎮", animation: require("../assets/animations/topics/gaming.json") },
  { name: "Food", emoji: "🍔", animation: require("../assets/animations/topics/food.json") },
  { name: "Health", emoji: "💚", animation: require("../assets/animations/topics/health.json") },
];

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
