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
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { post } from "../services/ApiRequest";
import { COLORS } from "../utils/COLORS";
import { ToastMessage } from "../utils/ToastMessage";
import CustomText from "./CustomText";
import ImageFast from "./ImageFast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FollowNotification = forwardRef((props, ref) => {
  const [data, setData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const hideTimeout = useRef(null);
  const isInAppVisible = useSelector(
    (state) => state.notification.isInAppVisible,
  );

  const translateY = useSharedValue(-200);

  const hideProgress = useCallback(() => {
    setIsVisible(false);
    setData(null);
  }, []);

  const hide = useCallback(() => {
    translateY.value = withSpring(-200, { damping: 15 }, () => {
      runOnJS(hideProgress)();
    });
  }, [hideProgress, translateY]);

  const show = useCallback(
    (followerData) => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }

      setData(followerData);
      setIsVisible(true);

      const targetY = isInAppVisible ? insets.top + 90 : insets.top + 10;
      translateY.value = withSpring(targetY, { damping: 15 });

      hideTimeout.current = setTimeout(() => {
        hide();
      }, 6000);
    },
    [insets.top, translateY, hide, isInAppVisible],
  );

  useEffect(() => {
    if (isVisible) {
      const targetY = isInAppVisible ? insets.top + 90 : insets.top + 10;
      translateY.value = withSpring(targetY, { damping: 15 });
    }
  }, [isInAppVisible, isVisible, insets.top, translateY]);

  useImperativeHandle(ref, () => ({
    show,
  }));

  const handleFollowBack = async () => {
    if (!data?.follower?._id) return;
    try {
      const res = await post(`relationships/follow/${data.follower._id}`);
      if (res?.data?.success || res?.status === 200) {
        ToastMessage(
          `You are now following ${data.follower.firstName}`,
          "success",
        );
        hide();
      }
    } catch (error) {
      console.error("Error following back:", error);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!isVisible || !data) return null;

  return (
    <Animated.View style={[styles.progressContainer, animatedStyle]}>
      <View style={styles.cardOutline}>
        <View style={styles.cardInner}>
          {/* User Image */}
          <ImageFast
            source={
              data.follower?.profile?.avatar
                ? { uri: data.follower.profile.avatar }
                : Images.user
            }
            style={styles.image}
          />

          {/* Info */}
          <View style={styles.textContainer}>
            <CustomText
              label={`${data.follower?.firstName} has started following you`}
              fontFamily={fonts.medium}
              fontSize={14}
            />
            <CustomText
              label={`Click plus to follow back @${data.follower?.username}`}
              fontSize={12}
              fontFamily={fonts.regular}
              color={COLORS.gray48}
            />
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.followButton}
            onPress={handleFollowBack}
          >
            <ImageFast source={Images.plusBlack} style={styles.plusIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

export default FollowNotification;

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
    height: 60,
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
    height: 52,
    width: SCREEN_WIDTH - 48,
    backgroundColor: COLORS.black,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    gap: 8,
  },
  image: {
    height: 40,
    width: 40,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  followButton: {
    height: 32,
    width: 32,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  plusIcon: {
    height: 16,
    width: 16,
  },
});
