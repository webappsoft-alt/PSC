import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import FastImage from "react-native-fast-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import EpisodePlayerView from "./EpisodePlayerView";

/**
 * Episode player overlay — ported from Viral's EpisodeOverlay: opens by
 * scaling up from the tapped card (`origin`), the episodes of the season
 * page vertically, swipe down (or back) shrinks it back and closes.
 */
const DURATION = 260;
const EASING = Easing.bezier(0.32, 0.72, 0, 1);
const TIMING = { duration: DURATION, easing: EASING };
const DRAG_DISMISS = 30;
const DRAG_VELOCITY = 150;
const CLOSE_DURATION = 240;
const CLOSE_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

const EpisodeOverlay = ({
  episodes = [],
  startIndex = 0,
  origin,
  show,
  initialThumbnailUri,
  onClose,
  onEpisodeUnlocked,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const initialWindowRef = useRef(Dimensions.get("window"));
  const [contentReady, setContentReady] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const isClosingRef = useRef(false);

  const list = useMemo(
    () =>
      episodes.map((ep, i) => ({
        ...ep,
        thumbnailUrl: (i === startIndex && initialThumbnailUri) || ep.cover || "",
      })),
    [episodes, startIndex, initialThumbnailUri],
  );
  const current = list[currentIndex];
  const thumbnailUri = current?.thumbnailUrl || current?.cover || initialThumbnailUri || "";

  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);
  const contentVisible = useSharedValue(0);
  const isClosingShared = useSharedValue(false);

  const o = origin || { x: windowWidth / 4, y: 200, width: windowWidth / 2, height: 300 };
  const initW = initialWindowRef.current.width || windowWidth;
  const initH = initialWindowRef.current.height || windowHeight;
  const initScaleX = o.width / initW;
  const initScaleY = o.height / initH;
  const initTx = o.x + o.width / 2 - initW / 2;
  const initTy = o.y + o.height / 2 - initH / 2;

  useEffect(() => {
    StatusBar.setHidden(true, "fade");
    progress.value = withTiming(1, TIMING, (finished) => {
      if (finished) {
        contentVisible.value = 1;
        runOnJS(setContentReady)(true);
      }
    });
    return () => StatusBar.setHidden(false, "fade");
  }, []);

  const handleClose = useCallback(() => {
    isClosingRef.current = true;
    onClose?.();
  }, [onClose]);

  const markClosing = useCallback(() => setIsClosing(true), []);

  const startClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    contentVisible.value = 0;
    cancelAnimation(progress);
    cancelAnimation(dragY);
    const closeTiming = { duration: CLOSE_DURATION, easing: CLOSE_EASING };
    dragY.value = withTiming(0, closeTiming);
    progress.value = withTiming(0, closeTiming, (finished) => {
      if (finished) runOnJS(handleClose)();
    });
  }, [handleClose]);

  // Android back closes the player the same way as a swipe down
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      startClose();
      return true;
    });
    return () => sub.remove();
  }, [startClose]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([5, -5])
        .failOffsetX([-999, 999])
        .minPointers(1)
        .onUpdate((e) => {
          if (e.translationY > 0) dragY.value = e.translationY;
        })
        .onEnd((e) => {
          const dismiss = e.translationY > DRAG_DISMISS || e.velocityY > DRAG_VELOCITY;
          if (dismiss && !isClosingShared.value) {
            isClosingShared.value = true;
            contentVisible.value = 0;
            runOnJS(markClosing)();
            const closeTiming = { duration: CLOSE_DURATION, easing: CLOSE_EASING };
            progress.value = withTiming(0, closeTiming, (finished) => {
              if (finished) runOnJS(handleClose)();
            });
          } else {
            dragY.value = withTiming(0, TIMING);
          }
        }),
    [handleClose, markClosing],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const dy = dragY.value;
    const sx = initScaleX + (1 - initScaleX) * t;
    const sy = initScaleY + (1 - initScaleY) * t;
    const tx = initTx * (1 - t);
    const ty = initTy * (1 - t) + dy * t;
    const dragProg = Math.min(dy / 200, 0.1) * t;
    const dragRadius = interpolate(dy, [0, 80], [0, 25], "clamp");
    const progressRadius = interpolate(t, [0, 1], [25, 0]);
    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scaleX: sx * (1 - dragProg) },
        { scaleY: sy * (1 - dragProg) },
      ],
      borderRadius: Math.max(progressRadius, dragRadius),
      overflow: "hidden",
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * (1 - Math.min(dragY.value / 300, 1)),
  }));

  const contentStyle = useAnimatedStyle(() => ({ opacity: contentVisible.value }));

  const viewConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewable = useRef(({ viewableItems }) => {
    if (viewableItems[0]?.index != null) setCurrentIndex(viewableItems[0].index);
  }).current;

  const renderItem = useCallback(
    ({ item, index }) => (
      <EpisodePlayerView
        episode={item}
        show={show}
        isActive={index === currentIndex && !isClosing && contentReady}
        height={windowHeight}
        width={windowWidth}
        onBack={startClose}
        onEpisodeUnlocked={onEpisodeUnlocked}
      />
    ),
    [show, currentIndex, isClosing, contentReady, windowHeight, windowWidth, startClose, onEpisodeUnlocked],
  );

  const getItemLayout = useCallback(
    (_, i) => ({ length: windowHeight, offset: windowHeight * i, index: i }),
    [windowHeight],
  );

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Reanimated.View style={[styles.backdrop, backdropStyle]} />
      <GestureDetector gesture={pan}>
        <Reanimated.View
          style={[styles.container, { width: windowWidth, height: windowHeight }, animatedStyle]}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {thumbnailUri ? (
              <FastImage
                key={`thumb-${currentIndex}`}
                source={{ uri: thumbnailUri }}
                style={StyleSheet.absoluteFill}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
            )}
          </View>
          <Reanimated.View
            style={[StyleSheet.absoluteFill, contentStyle]}
            pointerEvents={contentReady && !isClosing ? "auto" : "none"}
          >
            <FlatList
              data={list}
              renderItem={renderItem}
              keyExtractor={(item, i) => String(item?._id || i)}
              extraData={[currentIndex, isClosing, contentReady]}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              snapToInterval={windowHeight}
              snapToAlignment="start"
              decelerationRate="fast"
              onViewableItemsChanged={onViewable}
              viewabilityConfig={viewConfig}
              getItemLayout={getItemLayout}
              initialScrollIndex={startIndex}
              maxToRenderPerBatch={3}
              windowSize={5}
              removeClippedSubviews={false}
              initialNumToRender={Math.max(1, Math.min(list.length, startIndex + 2))}
            />
          </Reanimated.View>
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
};

export default EpisodeOverlay;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  placeholder: {
    backgroundColor: "#121212",
  },
});
