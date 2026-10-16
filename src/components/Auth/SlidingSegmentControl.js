import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import fonts from "../../assets/fonts";
import { SlidingTabIndicator } from "./SlidingTabIndicator";

const TAB_SPRING = { damping: 22, stiffness: 380, mass: 0.5 };

/** Original login/registration track: 4px pad + 32px pill. */
const DEFAULT_HEIGHT = 40;
const DEFAULT_PADDING = 4;
const DEFAULT_GAP = 4;

function clampIndex(value, count) {
  "worklet";
  return Math.max(0, Math.min(count - 1, value));
}

function SegmentLabel({
  item,
  index,
  progress,
  selected,
  onPress,
  activeLabelColor,
  inactiveLabelColor,
  disabledLabelColor,
  labelStyle,
}) {
  const textStyle = useAnimatedStyle(() => {
    const t = 1 - Math.min(1, Math.abs(progress.value - index));
    return {
      color: interpolateColor(
        t,
        [0, 1],
        [inactiveLabelColor, activeLabelColor],
      ),
    };
  });

  return (
    <Pressable
      disabled={item.disabled}
      onPress={() => onPress(index)}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled: !!item.disabled }}
    >
      <Animated.Text
        style={[
          styles.label,
          selected && styles.labelActive,
          item.disabled && {
            color: disabledLabelColor ?? inactiveLabelColor,
          },
          !item.disabled && textStyle,
          labelStyle,
        ]}
      >
        {item.label}
      </Animated.Text>
    </Pressable>
  );
}

function SegmentLabels({
  items,
  progress,
  selectedKey,
  onPress,
  activeLabelColor,
  inactiveLabelColor,
  disabledLabelColor,
  labelStyle,
}) {
  return (
    <>
      {items.map((item, itemIndex) => (
        <SegmentLabel
          key={item.key}
          item={item}
          index={itemIndex}
          progress={progress}
          selected={item.key === selectedKey}
          onPress={onPress}
          activeLabelColor={activeLabelColor}
          inactiveLabelColor={inactiveLabelColor}
          disabledLabelColor={disabledLabelColor}
          labelStyle={labelStyle}
        />
      ))}
    </>
  );
}

function useSegmentProgress(items, selectedKey, onChange) {
  const count = items.length;
  const index = Math.max(
    0,
    items.findIndex((item) => item.key === selectedKey),
  );
  const progress = useSharedValue(index);
  const startIndex = useSharedValue(index);
  const trackW = useSharedValue(0);
  const pageW = useSharedValue(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      progress.value = index;
      return;
    }
    progress.value = withSpring(index, TAB_SPRING);
  }, [index, progress]);

  const snapTo = useCallback(
    (nextIndex) => {
      const item = items[nextIndex];
      if (!item || item.disabled) {
        progress.value = withSpring(index, TAB_SPRING);
        return;
      }
      progress.value = withSpring(nextIndex, TAB_SPRING);
      if (item.key !== selectedKey) onChange(item.key);
    },
    [index, items, onChange, progress, selectedKey],
  );

  const swipeEnabled = items.filter((item) => !item.disabled).length > 1;

  return {
    count,
    index,
    progress,
    startIndex,
    trackW,
    pageW,
    snapTo,
    swipeEnabled,
  };
}

export function SlidingSegmentControl({
  items,
  selectedKey,
  onChange,
  trackColor,
  pillColor,
  activeLabelColor,
  inactiveLabelColor,
  disabledLabelColor,
  height = DEFAULT_HEIGHT,
  padding = DEFAULT_PADDING,
  gap = DEFAULT_GAP,
  style,
  labelStyle,
}) {
  const { count, index, progress, startIndex, trackW, snapTo, swipeEnabled } =
    useSegmentProgress(items, selectedKey, onChange);

  const tabDrag = Gesture.Pan()
    .enabled(swipeEnabled)
    .maxPointers(1)
    .activeOffsetX([-4, 4])
    .failOffsetY([-28, 28])
    .onStart((event) => {
      const width = trackW.value > 0 ? trackW.value : 1;
      startIndex.value =
        event.x > 0 ? (event.x / width) * count - 0.5 : progress.value;
    })
    .onUpdate((event) => {
      const width = trackW.value > 0 ? trackW.value : 1;
      if (event.x > 0) {
        progress.value = clampIndex((event.x / width) * count - 0.5, count);
        return;
      }
      progress.value = clampIndex(
        startIndex.value - event.translationX / (width / count),
        count,
      );
    })
    .onEnd((event) => {
      const projected = progress.value - Math.sign(event.velocityX) * 0.15;
      runOnJS(snapTo)(Math.round(clampIndex(projected, count)));
    });

  const pillHeight = height - padding * 2;

  return (
    <GestureDetector gesture={tabDrag}>
      <View
        collapsable={false}
        onLayout={(event) => {
          trackW.value = event.nativeEvent.layout.width;
        }}
        style={[
          styles.track,
          {
            height,
            padding,
            gap,
            backgroundColor: trackColor,
          },
          style,
        ]}
      >
        <SlidingTabIndicator
          count={count}
          progress={progress}
          color={pillColor}
          height={pillHeight}
          top={padding}
          padding={padding}
          gap={gap}
          trackWidth={trackW}
        />
        <SegmentLabels
          items={items}
          progress={progress}
          selectedKey={selectedKey}
          onPress={snapTo}
          activeLabelColor={activeLabelColor}
          inactiveLabelColor={inactiveLabelColor}
          disabledLabelColor={disabledLabelColor}
          labelStyle={labelStyle}
        />
      </View>
    </GestureDetector>
  );
}

export function SlidingSegmentPager({
  items,
  selectedKey,
  onChange,
  trackColor,
  pillColor,
  activeLabelColor,
  inactiveLabelColor,
  disabledLabelColor,
  height = DEFAULT_HEIGHT,
  padding = DEFAULT_PADDING,
  gap = DEFAULT_GAP,
  style,
  labelStyle,
  renderPage,
  pageStyle,
}) {
  const {
    count,
    progress,
    startIndex,
    trackW,
    pageW,
    snapTo,
    swipeEnabled,
  } = useSegmentProgress(items, selectedKey, onChange);
  const [pageWidth, setPageWidth] = useState(0);
  const pillHeight = height - padding * 2;

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const tabDrag = Gesture.Pan()
    .enabled(swipeEnabled)
    .maxPointers(1)
    .activeOffsetX([-4, 4])
    .failOffsetY([-28, 28])
    .onStart((event) => {
      runOnJS(dismissKeyboard)();
      const width = trackW.value > 0 ? trackW.value : 1;
      startIndex.value =
        event.x > 0 ? (event.x / width) * count - 0.5 : progress.value;
    })
    .onUpdate((event) => {
      const width = trackW.value > 0 ? trackW.value : 1;
      progress.value = clampIndex((event.x / width) * count - 0.5, count);
    })
    .onEnd((event) => {
      const projected = progress.value - Math.sign(event.velocityX) * 0.15;
      runOnJS(snapTo)(Math.round(clampIndex(projected, count)));
    });

  const pageSwipe = Gesture.Pan()
    .enabled(swipeEnabled)
    .maxPointers(1)
    .activeOffsetX([-10, 10])
    .failOffsetY([-18, 18])
    .onStart(() => {
      runOnJS(dismissKeyboard)();
      startIndex.value = progress.value;
    })
    .onUpdate((event) => {
      const unit = pageW.value > 0 ? pageW.value : 1;
      progress.value = clampIndex(
        startIndex.value - event.translationX / unit,
        count,
      );
    })
    .onEnd((event) => {
      const unit = pageW.value > 0 ? pageW.value : 1;
      const from = startIndex.value;
      const wentNext =
        event.translationX < -unit * 0.2 || event.velocityX < -450;
      const wentPrev =
        event.translationX > unit * 0.2 || event.velocityX > 450;
      const target = clampIndex(
        from + (wentNext ? 1 : wentPrev ? -1 : 0),
        count,
      );
      runOnJS(snapTo)(Math.round(target));
    });

  const pageTap = Gesture.Tap().onEnd(() => {
    runOnJS(dismissKeyboard)();
  });

  const pageGestures = Gesture.Exclusive(pageSwipe, pageTap);

  const pagerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -progress.value * pageW.value }],
  }));

  return (
    <View style={styles.pagerRoot}>
      <GestureDetector gesture={tabDrag}>
        <View
          collapsable={false}
          onLayout={(event) => {
            trackW.value = event.nativeEvent.layout.width;
          }}
          style={[
            styles.track,
            {
              height,
              padding,
              gap,
              backgroundColor: trackColor,
            },
            style,
          ]}
        >
          <SlidingTabIndicator
            count={count}
            progress={progress}
            color={pillColor}
            height={pillHeight}
            top={padding}
            padding={padding}
            gap={gap}
            trackWidth={trackW}
          />
          <SegmentLabels
            items={items}
            progress={progress}
            selectedKey={selectedKey}
            onPress={snapTo}
            activeLabelColor={activeLabelColor}
            inactiveLabelColor={inactiveLabelColor}
            disabledLabelColor={disabledLabelColor}
            labelStyle={labelStyle}
          />
        </View>
      </GestureDetector>

      <GestureDetector gesture={pageGestures}>
        <View
          style={styles.pagerViewport}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (width <= 0) return;
            pageW.value = width;
            setPageWidth(width);
          }}
        >
          <Animated.View
            style={[
              styles.pagerRow,
              pageWidth > 0 ? { width: pageWidth * count } : null,
              pagerStyle,
            ]}
          >
            {items.map((item) => (
              <View
                key={item.key}
                style={[
                  styles.pagerPage,
                  pageWidth > 0 ? { width: pageWidth } : null,
                  pageStyle,
                ]}
              >
                {renderPage(item.key)}
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    width: "100%",
    borderRadius: 100,
    overflow: "hidden",
  },
  item: {
    flex: 1,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    lineHeight: 14 * 1.4,
    fontFamily: fonts.regular,
    letterSpacing: -0.07,
  },
  labelActive: {
    fontFamily: fonts.medium,
  },
  pagerRoot: {
    flex: 1,
    alignSelf: "stretch",
  },
  pagerViewport: {
    flex: 1,
    overflow: "hidden",
  },
  pagerRow: {
    flex: 1,
    flexDirection: "row",
  },
  pagerPage: {
    flex: 1,
  },
});
