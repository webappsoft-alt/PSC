import LottieView from "lottie-react-native";
import { memo, useEffect, useState } from "react";
import { InteractionManager, View } from "react-native";
import {
  areTopicAnimationsReady,
  findTopic,
  prefetchTopicAnimations,
  topicAnimationSource,
} from "../utils/feedTopics";

/**
 * Animated topic icon (Viral's topic Lotties, loaded from local files).
 *
 * lottie-react-native JSON.stringify()s an object `source` on every render and
 * the topic files are up to ~570 KB, so a sheet with nine of them used to
 * stall before it could slide in. This wrapper:
 *  - is memoised, so toggling a switch never re-serialises the animations;
 *  - mounts the Lottie only once the sheet's open animation has finished
 *    (`ready`), keeping the same 24px slot empty until then.
 */
const TopicLottie = ({ name, size = 24, ready = true, style }) => {
  // Normally already true (prefetched at app start); fallback for an open
  // that beats the prefetch.
  const [filesReady, setFilesReady] = useState(areTopicAnimationsReady);
  useEffect(() => {
    if (filesReady) return undefined;
    let alive = true;
    prefetchTopicAnimations().then(() => alive && setFilesReady(true));
    return () => {
      alive = false;
    };
  }, [filesReady]);

  const animation = filesReady ? topicAnimationSource(name) : null;
  if (!animation || !findTopic(name)) {
    return <View style={[{ width: size, height: size }, style]} />;
  }
  return (
    <View style={[{ width: size, height: size }, style]}>
      {ready ? (
        <LottieView
          source={animation}
          autoPlay
          loop
          cacheComposition
          style={{ width: size, height: size }}
        />
      ) : null}
    </View>
  );
};

export default memo(TopicLottie);

/**
 * true a moment after `visible` turns on — after the sheet's slide-in and any
 * pending interactions — so heavy children can mount without blocking it.
 */
export function useDeferredReady(visible, delay = 320) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!visible) {
      setReady(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (!cancelled) setReady(true);
      });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [visible, delay]);
  return ready;
}
