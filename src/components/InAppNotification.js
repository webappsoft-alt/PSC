import { useNavigation } from "@react-navigation/native";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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
import { useDispatch } from "react-redux";
import { setIsInAppVisible } from "../store/reducer/NotiSlice";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import ImageFast from "./ImageFast";
import { useNotificationNavigation } from "../hooks/useNotificationNavigation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const InAppNotification = forwardRef((props, ref) => {
  const [notifications, setNotifications] = useState([]);
  const dispatch = useDispatch();

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    dispatch(setIsInAppVisible(notifications.length > 0));
  }, [notifications.length, dispatch]);

  useImperativeHandle(ref, () => ({
    show: (notificationData) => {
      const id = Date.now() + Math.random();
      setNotifications((prev) => [...prev, { id, ...notificationData }]);
    },
  }));

  return (
    <View style={styles.progressContainer} pointerEvents="box-none">
      {notifications.map((data, index) => (
        <NotificationItem
          key={data.id}
          data={data}
          index={index}
          onHide={() => removeNotification(data.id)}
        />
      ))}
    </View>
  );
});

const NotificationItem = ({ data, index, onHide }) => {
  const insets = useSafeAreaInsets();
  const hideTimeout = useRef(null);
  const { handleNotificationPress } = useNotificationNavigation();
  const translateY = useSharedValue(-200);

  const hide = useCallback(() => {
    translateY.value = withSpring(-200, { damping: 15 }, () => {
      runOnJS(onHide)();
    });
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
    translateY.value = withSpring(insets.top + 10 + index * 80, {
      damping: 15,
    });
    startHideTimeout();
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  useEffect(() => {
    translateY.value = withSpring(insets.top + 10 + index * 80, {
      damping: 15,
    });
  }, [index, insets.top]);

  const handlePress = () => {
    handleNotificationPress(data);
    hide();
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (hideTimeout.current) {
        runOnJS(clearTimeout)(hideTimeout.current);
      }
    })
    .onUpdate((event) => {
      const basePos = insets.top + 10 + index * 80;
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
        translateY.value = withSpring(insets.top + 10 + index * 80, {
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

  const title = data.notification?.title || data.title || "Notification";
  const body = data.notification?.body || data.message || "";
  const avatar = Images.logo;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.progressContainer, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.cardOutline}
          onPress={handlePress}
        >
          <View style={styles.cardInner}>
            <ImageFast source={avatar} style={styles.image} />
            <View style={styles.textContainer}>
              <CustomText
                label={title}
                fontFamily={fonts.medium}
                fontSize={14}
                numberOfLines={1}
              />
              <CustomText
                label={body}
                fontSize={12}
                fontFamily={fonts.regular}
                color={COLORS.gray48}
                numberOfLines={2}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

export default InAppNotification;

const styles = StyleSheet.create({
  progressContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  cardOutline: {
    height: 70,
    width: SCREEN_WIDTH - 40,
    backgroundColor: COLORS.white16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
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
  cardInner: {
    height: 62,
    width: SCREEN_WIDTH - 48,
    backgroundColor: COLORS.black,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 12,
  },
  image: {
    height: 38,
    width: 38,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
});
