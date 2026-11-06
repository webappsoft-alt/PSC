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
  ScrollView,
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

import fonts from "../../assets/fonts";
import { navigationRef } from "../../navigation/navigationRef";
import { COLORS } from "../../utils/COLORS";
import Blur from "../Blur";
import CustomText from "../CustomText";
import Icons from "../Icons";
import ImageFast from "../ImageFast";
import PollOptionList from "./PollOptionList";
import {
  isPollEnded,
  pollTimeLeft,
  usePollState,
  votesLabel,
} from "./pollUtils";
import InitialsFill from "../InitialsFill";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HIDE_AFTER_MS = 6000;
const HIDE_AFTER_VOTE_MS = 4000;

/**
 * In-app "New Poll" alert (Figma Social Feed):
 *  - New-Poll-Alert (3342:2545): avatar · NEW POLL · question · ✓ · ✕
 *  - ✓ opens New-Poll--Options-Alert (3342:2737) to vote from the banner,
 *    then shows the results (3342:2645).
 * Shown when someone you follow publishes a poll (socket "new_poll").
 */
const AlertButton = ({ icon, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.circleBtn}>
    <Icons
      family="MaterialSymbolsRounded"
      name={icon}
      size={16}
      color={COLORS.gray64}
    />
  </TouchableOpacity>
);

const Avatar = ({ uri, size, user }) =>
  uri ? (
    <ImageFast
      source={{ uri }}
      removeLoading
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
      }}
    >
      <InitialsFill user={user} size={size} />
    </View>
  );

const PollAlertContent = ({ data, expanded, onExpand, onClose, onVoted, onOpen }) => {
  const { poll, vote, voting } = usePollState(data.postId, data.poll);
  const voted = !!poll?.myVote;
  const ended = isPollEnded(poll);
  const avatar = data?.author?.profile?.avatar;
  const timeLeft = pollTimeLeft(poll?.endsAt, "alert");

  const handleVote = async (optionId) => {
    await vote(optionId);
    onVoted?.();
  };

  if (!expanded) {
    return (
      <View style={styles.collapsedRow}>
        <TouchableOpacity activeOpacity={0.8} onPress={onOpen} style={styles.collapsedLeft}>
          <Avatar uri={avatar} user={data?.author} size={32} />
          <View style={styles.collapsedText}>
            <CustomText
              label={"NEW POLL"}
              fontSize={10}
              fontFamily={fonts.medium}
              letterSpacing={-0.05}
              color={COLORS.gray48}
            />
            <CustomText
              label={data.question}
              fontSize={14}
              fontFamily={fonts.medium}
              letterSpacing={-0.07}
              numberOfLines={1}
              // Figma Frame 11 (3342:2550): NEW POLL cap → 4 → question cap;
              // the 1.4 line boxes add 0.35 × 10 below and 0.353 × 14 above
              marginTop={4 - 0.35 * 10 - 0.353 * 14}
            />
          </View>
        </TouchableOpacity>
        <View style={styles.actions}>
          <AlertButton icon="check" onPress={onExpand} />
          <AlertButton icon="close" onPress={onClose} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.expanded}>
      <View style={styles.expandedHeader}>
        <TouchableOpacity activeOpacity={0.8} onPress={onOpen} style={styles.headerText}>
          <View style={[styles.questionRow, { gap: voted ? 4 : 6 }]}>
            <Avatar uri={avatar} user={data?.author} size={16} />
            <CustomText
              label={data.question}
              fontSize={14}
              fontFamily={fonts.medium}
              letterSpacing={-0.07}
              numberOfLines={1}
              containerStyle={styles.flexShrink}
            />
          </View>
          <View style={styles.metaRow}>
            <View style={styles.votes}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="group"
                size={12}
                color={COLORS.gray64}
              />
              <CustomText
                label={votesLabel(poll?.totalVotes || 0, true)}
                fontSize={10}
                fontFamily={fonts.medium}
                letterSpacing={-0.05}
                color={COLORS.gray48}
              />
            </View>
            {timeLeft ? (
              <>
                <View style={styles.dot} />
                <CustomText
                  label={timeLeft}
                  fontSize={10}
                  fontFamily={fonts.medium}
                  letterSpacing={-0.05}
                  color={COLORS.gray48}
                />
              </>
            ) : null}
          </View>
        </TouchableOpacity>
        <AlertButton icon="close" onPress={onClose} />
      </View>
      <ScrollView
        style={{ maxHeight: SCREEN_HEIGHT * 0.5 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <PollOptionList
          poll={poll}
          showResults={voted || ended}
          onVote={handleVote}
          disabled={ended || voting}
          variant="alert"
        />
      </ScrollView>
    </View>
  );
};

const PollAlert = forwardRef((props, ref) => {
  const insets = useSafeAreaInsets();
  const isInAppVisible = useSelector(
    (state) => state.notification.isInAppVisible,
  );
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const hideTimeout = useRef(null);
  const translateY = useSharedValue(-400);

  const clearTimer = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = null;
  };

  const reset = useCallback(() => {
    setData(null);
    setExpanded(false);
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    translateY.value = withSpring(-400, { damping: 15 }, () => {
      runOnJS(reset)();
    });
  }, [reset, translateY]);

  const scheduleHide = useCallback(
    (ms) => {
      clearTimer();
      hideTimeout.current = setTimeout(hide, ms);
    },
    [hide],
  );

  const targetY = isInAppVisible ? insets.top + 90 : insets.top + 10;

  const show = useCallback(
    (payload) => {
      if (!payload?.postId || !payload?.poll?.options?.length) return;
      setExpanded(false);
      setData(payload);
      translateY.value = withSpring(targetY, { damping: 15 });
      scheduleHide(HIDE_AFTER_MS);
    },
    [targetY, translateY, scheduleHide],
  );

  useEffect(() => {
    if (data) translateY.value = withSpring(targetY, { damping: 15 });
  }, [targetY, data, translateY]);

  useEffect(() => () => clearTimer(), []);

  useImperativeHandle(ref, () => ({ show }), [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!data) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.outline}>
        <Blur blurType="dark" blurAmount={16} borderRadius={20} />
        <View pointerEvents="none" style={styles.outlineTint} />
        <View style={styles.inner}>
          <PollAlertContent
            data={data}
            expanded={expanded}
            onExpand={() => {
              clearTimer(); // stay open while the user votes
              setExpanded(true);
            }}
            onClose={hide}
            onVoted={() => scheduleHide(HIDE_AFTER_VOTE_MS)}
            onOpen={() => {
              const postId = data.postId;
              hide();
              if (navigationRef.isReady()) {
                navigationRef.navigate("DetailPageWithId", { postId });
              }
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
});

export default PollAlert;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
  },
  // Figma: 4 padding, radius 20, white 16% + background blur 16,
  // 1px inside stroke #121212 @16%. A Figma inside stroke takes no layout
  // space, an RN border does: 1 border + 3 padding = content 4 from the edge
  outline: {
    width: SCREEN_WIDTH - 24,
    padding: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(18, 18, 18, 0.16)",
    overflow: "hidden",
  },
  outlineTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  // Figma: #121212, radius 16, padding 10
  inner: {
    backgroundColor: COLORS.black,
    borderRadius: 16,
    padding: 10,
  },
  collapsedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  collapsedLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // gap handled by the question's marginTop (cap-to-cap 4)
  collapsedText: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  expanded: {
    gap: 20,
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  // Figma 3342:2741: row 16 (= the avatar); pinned so the 14pt line box
  // overflows it symmetrically
  questionRow: {
    height: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  flexShrink: {
    flexShrink: 1,
  },
  // Figma 3342:2744: row 12 (= the group icon), pinned likewise
  metaRow: {
    height: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  votes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
});
