import { Gesture } from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
  interpolate,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import { selectLayout } from "../store/reducer/appSlice";

export default ({
  size = "l",
  startAtMinimum = false,
  closeOnMinimum = false,
  completeClose = false,
  onCompleteClose,
}) => {
  const visible = true;
  const layout = useSelector(selectLayout);

  const { MAX_HEIGHT, CHECKPOINTS, HALF_HEIGHT, MIN_HEIGHT, LARGE_HEIGHT } =
    layout;

  const swipeTranslateY = useSharedValue(3000);
  const isAtMaxHeight = useSharedValue(false);

  const context = useSharedValue({ y: 0 });
  const pressed = useSharedValue(false);

  const onSwipe = Gesture.Pan()
    .onBegin(() => {
      pressed.value = true;
      context.value = { y: swipeTranslateY.value };
    })
    .onChange((event) => {
      if (size === "l") {
        const newPosition = event.translationY + context.value.y;

        if (event.translationY < 0) {
          if (!isAtMaxHeight.value && newPosition > MAX_HEIGHT - LARGE_HEIGHT) {
            swipeTranslateY.value = newPosition;
          } else if (newPosition <= MAX_HEIGHT - LARGE_HEIGHT) {
            swipeTranslateY.value = MAX_HEIGHT - LARGE_HEIGHT;
            isAtMaxHeight.value = true;
          }
        } else {
          if (newPosition > 0) {
            swipeTranslateY.value = newPosition;
            if (newPosition > MAX_HEIGHT - HALF_HEIGHT) {
              isAtMaxHeight.value = false;
            }
          }
        }
      } else if (size === "s" && event.translationY > 0) {
        swipeTranslateY.value = event.translationY + context.value.y;
      }
    })
    .onFinalize(() => {
      pressed.value = false;

      if (size === "s") {
        if (swipeTranslateY.value > CHECKPOINTS.pointUno)
          swipeTranslateY.value = withTiming(MAX_HEIGHT);
        else swipeTranslateY.value = withTiming(0);
      } else {
        // Complete close functionality
        if (
          completeClose &&
          swipeTranslateY.value > MAX_HEIGHT - MIN_HEIGHT + 50
        ) {
          // If user swipes down more than 50px from minimum position, close completely
          swipeTranslateY.value = withTiming(MAX_HEIGHT);
          if (onCompleteClose) {
            runOnJS(onCompleteClose)();
          }
        } else if (swipeTranslateY.value <= 0) {
          swipeTranslateY.value = withTiming(0);
          isAtMaxHeight.value = true;
        } else if (swipeTranslateY.value < CHECKPOINTS.pointUno) {
          swipeTranslateY.value = withTiming(MAX_HEIGHT - LARGE_HEIGHT);
          isAtMaxHeight.value = true;
        } else if (swipeTranslateY.value < CHECKPOINTS.pointDos) {
          swipeTranslateY.value = withTiming(MAX_HEIGHT - HALF_HEIGHT);
          isAtMaxHeight.value = false;
        } else {
          swipeTranslateY.value = withTiming(MAX_HEIGHT - MIN_HEIGHT);
          isAtMaxHeight.value = false;
        }
      }
    });

  useEffect(() => {
    if (MAX_HEIGHT && MIN_HEIGHT && HALF_HEIGHT) {
      const defaultPosition = startAtMinimum
        ? MAX_HEIGHT - MIN_HEIGHT
        : MAX_HEIGHT - HALF_HEIGHT;
      swipeTranslateY.value = withTiming(visible ? defaultPosition : 3000);
    }
  }, [visible, layout, startAtMinimum]);

  const translateStyles = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: swipeTranslateY.value,
      },
    ],
  }));

  const halfSheetSpace = useAnimatedStyle(() => ({
    height: interpolate(
      swipeTranslateY.value,
      [0, HALF_HEIGHT ? HALF_HEIGHT : 100],
      [0, HALF_HEIGHT ? HALF_HEIGHT - 90 : 0],
      Extrapolation.CLAMP
    ),
  }));

  return {
    swipeTranslateY,
    onSwipe,
    translateStyles,
    halfSheetSpace,
    isAtMaxHeight,
  };
};
