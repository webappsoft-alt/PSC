import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import Blur from "./Blur";
import Icons from "./Icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GlobalToast = forwardRef((props, ref) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useImperativeHandle(ref, () => ({
    show: (msg, toastType = "success") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message: msg, type: toastType }]);
    },
  }));

  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          onHide={() => removeToast(toast.id)}
        />
      ))}
    </View>
  );
});

// client: a toast must not cover the header (title / back / actions) — it
// drops in just below the standard header row (40pt controls under the
// status bar) instead of on top of it
const TOAST_TOP = 64;

const ToastItem = ({ toast, index, onHide }) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-150);
  const hideTimeout = useRef(null);
  // one line = pill; when a message wraps, a pill becomes a blob, so use a card
  const [multiline, setMultiline] = useState(false);
  const radius = multiline ? 18 : 96;

  const hide = useCallback(() => {
    translateY.value = withSpring(-150, { damping: 15 });
    onHide();
  }, [onHide]);

  const startHideTimeout = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    hideTimeout.current = setTimeout(() => {
      hide();
    }, 6000);
  }, [hide]);

  useEffect(() => {
    translateY.value = withSpring(insets.top + TOAST_TOP + index * 50, {
      damping: 15,
    });
    startHideTimeout();
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  useEffect(() => {
    translateY.value = withSpring(insets.top + TOAST_TOP + index * 50, {
      damping: 15,
    });
  }, [index, insets.top]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (hideTimeout.current) {
        runOnJS(clearTimeout)(hideTimeout.current);
      }
    })
    .onUpdate((event) => {
      const basePos = insets.top + TOAST_TOP + index * 50;
      const newY = basePos + event.translationY;
      if (newY > basePos + 20) {
        translateY.value = basePos + 20 + (newY - (basePos + 20)) * 0.2;
      } else {
        translateY.value = newY;
      }
    })
    .onEnd((event) => {
      if (event.translationY < -20 || event.velocityY < -500) {
        runOnJS(hide)();
      } else {
        translateY.value = withSpring(insets.top + TOAST_TOP + index * 50, {
          damping: 15,
        });
        runOnJS(startHideTimeout)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.toastContainer, animatedStyle]}>
        <View
          style={[
            styles.cardInner,
            { borderRadius: radius },
            multiline && styles.cardMulti,
          ]}
          onLayout={(e) => setMultiline(e.nativeEvent.layout.height > 40)}
        >
          <Blur borderRadius={radius} style={{ position: "absolute" }} />
          <View style={styles.textContainer}>
            <View style={styles.icon}>
              <View style={styles.iconDot} />
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name={toast.type == "error" ? "cancel" : "check_circle"}
                size={16}
                color={toast.type == "error" ? COLORS.red1 : "#23B672"}
              />
            </View>
            <CustomText
              label={toast.message}
              fontSize={13}
              lineHeight={18}
              letterSpacing={-0.2}
              fontFamily={fonts.medium}
              color={COLORS.white}
              numberOfLines={3}
              containerStyle={styles.message}
            />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default GlobalToast;

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInner: {
    maxWidth: SCREEN_WIDTH - 40,
    minWidth: 100,
    backgroundColor: COLORS.white16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 8,
    borderRadius: 96,
    gap: 4,
    overflow: "hidden",
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
  textContainer: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 1,
  },
  cardMulti: {
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 10,
  },
  message: { flexShrink: 1 },
  icon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDot: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 100,
    backgroundColor: "#fff",
  },
});
