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
import ImageFast from "./ImageFast";

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

const ToastItem = ({ toast, index, onHide }) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-150);
  const hideTimeout = useRef(null);

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
    translateY.value = withSpring(insets.top + 10 + index * 50, {
      damping: 15,
    });
    startHideTimeout();
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  useEffect(() => {
    translateY.value = withSpring(insets.top + 10 + index * 50, {
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
      const basePos = insets.top + 10 + index * 50;
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
        translateY.value = withSpring(insets.top + 10 + index * 50, {
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
        <View style={styles.cardInner}>
          <View style={styles.textContainer}>
            <ImageFast
              removeLoading
              source={toast.type == "error" ? Images.error : Images.success}
              style={{
                height: 14,
                width: 14,
              }}
            />
            <CustomText
              label={toast.message}
              fontSize={13}
              fontFamily={fonts.medium}
              color={COLORS.white}
              numberOfLines={2}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 12,
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
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});
