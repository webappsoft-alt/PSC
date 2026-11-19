import LottieView from "lottie-react-native";
import { memo, useEffect, useRef, useState } from "react";
import { InteractionManager, Text, View } from "react-native";
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
// Viral SelectionModal › TopicRowIcon: only the row being interacted with
// plays; every other icon is held on its first frame. Thirteen looping
// Lotties kept the iOS main thread at ~15 fps ("Pick Your Interests" froze).
const TopicLottie = ({ name, size = 24, ready = true, playing = false, loop = true, style }) => {
  const lottieRef = useRef(null);
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

  const topic = findTopic(name);
  const animation = filesReady ? topicAnimationSource(name) : null;
  useEffect(() => {
    const view = lottieRef.current;
    if (!view || !animation || !ready) return;
    if (playing) {
      view.play();
      return;
    }
    // same animation, parked on its first frame
    view.reset();
    view.pause();
  }, [playing, animation, ready]);
  if (!animation || !topic) {
    // topic without a Lottie yet (e.g. Travel / Automotive / Animals /
    // Education): the Figma emoji in the same slot, instead of a blank box
    return (
      <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
        {topic?.emoji ? (
          <Text allowFontScaling={false} style={{ fontSize: size * 0.75, lineHeight: size }}>
            {topic.emoji}
          </Text>
        ) : null}
      </View>
    );
  }
  return (
    <View style={[{ width: size, height: size }, style]}>
      {ready ? (
        <LottieView
          ref={lottieRef}
          source={animation}
          autoPlay={playing}
          loop={playing && loop}
          progress={playing ? undefined : 0}
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
