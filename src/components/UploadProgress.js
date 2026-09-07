import React, {
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { StyleSheet, View, Dimensions, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";
import CustomText from "./CustomText";
import { ActivityIndicator } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const UploadProgress = forwardRef((props, ref) => {
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-150);

  const hideProgress = useCallback(() => {
    setIsVisible(false);
  }, []);

  const show = useCallback(
    (msg) => {
      setMessage(msg);
      setIsVisible(true);

      translateY.value = withSpring(insets.top + 10, { damping: 15 });
    },
    [insets.top, translateY],
  );

  const hide = useCallback(() => {
    translateY.value = withSpring(-150, { damping: 15 }, () => {
      runOnJS(hideProgress)();
    });
  }, [hideProgress, translateY]);

  useImperativeHandle(ref, () => ({
    show,
    hide,
  }));

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.progressContainer, animatedStyle]}>
      <View style={styles.cardInner}>
        {/* Loading Indicator */}
        <ActivityIndicator size="small" color={COLORS.white} />

        {/* Content */}
        <CustomText
          label={message}
          fontSize={13}
          fontFamily={fonts.medium}
          color={COLORS.white}
          numberOfLines={1}
        />
      </View>
    </Animated.View>
  );
});

export default UploadProgress;

const styles = StyleSheet.create({
  progressContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInner: {
    maxWidth: SCREEN_WIDTH - 40,
    minWidth: 100,
    backgroundColor: COLORS.white16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
