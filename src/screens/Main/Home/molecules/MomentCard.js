import { useNavigation } from "@react-navigation/native";
import { getPalette } from "@somesoap/react-native-image-palette";
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  Dimensions,
  Modal,
  DeviceEventEmitter,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";
import { selectStoryUploadStatus } from "../../../../store/reducer/appSlice";
import StoryViewer from "./StoryViewer";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const staticStyles = StyleSheet.create({
  storyBorder: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  heroContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: "hidden",
  },
  gestureRoot: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

// ─────────────────────────────────────────────
// Story Border Component
// ─────────────────────────────────────────────
const StoryBorder = ({
  segments = 1,
  size = 72,
  color = COLORS.buttonColor,
  segmentColors = [],
}) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapAngle = segments === 1 ? 0 : 10;
  const totalGapAngle = gapAngle * segments;
  const segmentAngle = (360 - totalGapAngle) / segments;
  const segmentLength = (segmentAngle / 360) * circumference;

  return (
    <Svg width={size} height={size} style={staticStyles.storyBorder}>
      {Array.from({ length: segments }).map((_, index) => {
        const rotateAngle = -86 + index * (360 / segments);
        return (
          <Circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={segmentColors[index] || color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${segmentLength} ${
              circumference - segmentLength
            }`}
            strokeLinecap="round"
            rotation={rotateAngle}
            origin={`${size / 2}, ${size / 2}`}
          />
        );
      })}
    </Svg>
  );
};

// ─────────────────────────────────────────────
// Animated Plus Border Component
// ─────────────────────────────────────────────
const AnimatedPlusBorder = ({ size = 72 }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[staticStyles.storyBorder, { transform: [{ rotate: rotation }] }]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.buttonColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

// Figma `Today's Highlights` story ring (stroke 3, center, round caps)
const STORY_RING_COLOR = "#DF3838";

const getRandomColor = (id) => {
  const fallbackColors = [
    "#FFB3BA",
    "#FFD1BA",
    "#FFD8A8",
    "#FDFD97",
    "#E5FFB3",
    "#AAF0D1",
    "#9EE09E",
    "#A7C7E7",
    "#9EC1CF",
    "#E3E4FA",
    "#CC99C9",
    "#B1907F",
  ];
  if (!id) return fallbackColors[0];
  const index =
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    fallbackColors.length;
  return fallbackColors[index];
};

// ─────────────────────────────────────────────
// MomentItem
// ─────────────────────────────────────────────
const MomentItem = ({
  item,
  index,
  navigation,
  handleStoryPress,
  openStoryViewer,
  myStories,
}) => {
  const touchableRef = useRef(null);
  const [dynamicColor, setDynamicColor] = useState("#FFFFFF0A");
  const { userData } = useSelector((state) => state.users);
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const storyUploadStatus = useSelector(selectStoryUploadStatus);
  const currentUserId = userData?._id;

  const user = index === 0 ? userData : item?.user?.[0] || item;
  const profilePic = user?.profile?.avatar;
  const userId = user?._id || user?.userId;

  useEffect(() => {
    if (profilePic) {
      getPalette(profilePic)
        .then((palette) => {
          setDynamicColor(
            palette?.vibrant || palette?.dominant || getRandomColor(userId),
          );
        })
        .catch(() => setDynamicColor(getRandomColor(userId)));
    } else {
      setDynamicColor(getRandomColor(userId));
    }
  }, [profilePic, userId]);

  const measureAndOpen = useCallback(
    (params) => {
      if (touchableRef.current) {
        touchableRef.current.measure((x, y, width, height, pageX, pageY) => {
          openStoryViewer(params, { x: pageX, y: pageY, width, height });
        });
      } else {
        openStoryViewer(params, null);
      }
    },
    [openStoryViewer],
  );

  const handleMyStoryPress = () => {
    if (myStories?.stories?.length > 0) {
      measureAndOpen({
        userStories: [
          {
            ...myStories,
            username: "My Story",
            userImage: { uri: userData?.profilePicture },
            user: [userData],
          },
        ],
        initialUserIndex: 0,
        isMyStory: true,
      });
    } else {
      navigation.navigate("CameraScreen");
    }
  };

  const storiesCount =
    index === 0 ? myStories?.stories?.length || 0 : item?.stories?.length || 0;

  const allSegmentColors = useMemo(() => {
    const currentStories = index === 0 ? myStories?.stories : item?.stories;
    if (!currentStories || currentStories.length === 0) return [];
    return currentStories.map((story) =>
      story?.views?.includes(currentUserId)
        ? isDark
          ? COLORS.white16
          : "rgba(18, 18, 18, 0.12)"
        : STORY_RING_COLOR,
    );
  }, [index, myStories, item, currentUserId, isDark]);

  return (
    <TouchableOpacity
      ref={touchableRef}
      activeOpacity={0.6}
      onPress={() => {
        if (index === 0) {
          handleMyStoryPress();
        } else {
          // handleStoryPress will call measureAndOpen internally
          handleStoryPress(item, index, touchableRef);
        }
      }}
      onLongPress={() => {
        if (index === 0) {
          navigation.navigate("CameraScreen");
        }
      }}
      style={styles.cardWrapper}
    >
      <View style={styles.storyContainer}>
        {index === 0 && storyUploadStatus === "uploading" ? (
          <AnimatedPlusBorder size={80} />
        ) : storiesCount > 0 ? (
          <StoryBorder
            segments={storiesCount}
            size={80}
            color={STORY_RING_COLOR}
            segmentColors={allSegmentColors}
          />
        ) : (
          index === 0 && (
            <View style={styles.card}>
              <Icons
                name={"add"}
                family={"MaterialSymbolsRounded"}
                color={isDark ? COLORS.white : colors.text}
                size={22}
              />
            </View>
          )
        )}

        {index !== 0 || storiesCount > 0 ? (
          <View
            style={[
              styles.imageContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.background,
              },
            ]}
          >
            {profilePic ? (
              <ImageFast
                source={{ uri: profilePic }}
                style={styles.cardImage}
                resizeMode={"cover"}
              />
            ) : (
              <View
                style={[
                  styles.cardImage,
                  { backgroundColor: getRandomColor(userId) },
                ]}
              />
            )}
          </View>
        ) : null}

        {index !== 0 && storiesCount > 0 && (
          <View style={styles.countBadge}>
            <CustomText
              label={String(storiesCount)}
              fontSize={12}
              letterSpacing={-0.06}
              color={COLORS.white}
              fontFamily={fonts.medium}
            />
          </View>
        )}

        {index === 0 &&
          (storyUploadStatus === "uploading" ||
            storyUploadStatus === "success" ||
            storiesCount > 0) && (
            <View
              style={[
                styles.card,
                {
                  position: "absolute",
                  borderWidth: 0,
                  backgroundColor: "transparent",
                  zIndex: 10,
                },
              ]}
            >
              <View style={styles.overlay} />
              <Icons
                name={"plus"}
                family={"Feather"}
                color={COLORS.white}
                size={30}
              />
            </View>
          )}
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// StoryViewerModal — custom hero-expand modal
// ─────────────────────────────────────────────
// Tuned for smoother hero-open/close (no behavior change)
const ANIM_DURATION_OPEN = 250;
const ANIM_DURATION_CLOSE = 160;

const StoryViewerModal = ({ visible, params, originRect, onClose }) => {
  // Animation values
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Whether the RN Modal is mounted (kept true during close animation)
  const [modalMounted, setModalMounted] = useState(false);
  // Whether the content should render inside
  const [contentVisible, setContentVisible] = useState(false);

  // ── Derived start values from originRect ─────────────────────────
  const getStartTransform = useCallback(() => {
    if (!originRect) {
      return { tx: 0, ty: 0, sx: 0.01, sy: 0.01 };
    }
    const cardCenterX = originRect.x + originRect.width / 2;
    const cardCenterY = originRect.y + originRect.height / 2;
    const screenCenterX = SCREEN_WIDTH / 2;
    const screenCenterY = SCREEN_HEIGHT / 2;
    return {
      tx: cardCenterX - screenCenterX,
      ty: cardCenterY - screenCenterY,
      sx: originRect.width / SCREEN_WIDTH,
      sy: originRect.height / SCREEN_HEIGHT,
    };
  }, [originRect]);

  // ── Open animation ────────────────────────────────────────────────
  const animateOpen = useCallback(() => {
    const { tx, ty, sx, sy } = getStartTransform();

    // Set starting values
    scaleX.setValue(sx);
    scaleY.setValue(sy);
    translateX.setValue(tx);
    translateY.setValue(ty);
    backdropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(scaleX, {
        toValue: 1,
        duration: ANIM_DURATION_OPEN,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleY, {
        toValue: 1,
        duration: ANIM_DURATION_OPEN,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: ANIM_DURATION_OPEN,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIM_DURATION_OPEN,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(40),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIM_DURATION_OPEN - 40,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [
    getStartTransform,
    scaleX,
    scaleY,
    translateX,
    translateY,
    backdropOpacity,
  ]);

  // ── Close animation ───────────────────────────────────────────────
  const animateClose = useCallback(
    (callback) => {
      const { tx, ty, sx, sy } = getStartTransform();

      Animated.parallel([
        Animated.timing(scaleX, {
          toValue: sx,
          duration: ANIM_DURATION_CLOSE,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleY, {
          toValue: sy,
          duration: ANIM_DURATION_CLOSE,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: tx,
          duration: ANIM_DURATION_CLOSE,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: ty,
          duration: ANIM_DURATION_CLOSE,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIM_DURATION_CLOSE,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(callback);
    },
    [
      getStartTransform,
      scaleX,
      scaleY,
      translateX,
      translateY,
      backdropOpacity,
    ],
  );

  // ── React to visible prop changes ─────────────────────────────────
  useEffect(() => {
    if (visible) {
      setModalMounted(true);
      // Give the modal a frame to mount before animating
      requestAnimationFrame(() => {
        setContentVisible(true);
        animateOpen();
      });
    } else if (modalMounted) {
      animateClose(() => {
        setContentVisible(false);
        setModalMounted(false);
      });
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    animateClose(() => {
      setContentVisible(false);
      setModalMounted(false);
      onClose();
    });
  }, [animateClose, onClose]);

  if (!modalMounted) return null;

  return (
    <Modal
      visible={modalMounted}
      transparent
      statusBarTranslucent
      hardwareAccelerated
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "black", opacity: backdropOpacity },
        ]}
      />

      {/* Expanding content container */}
      <Animated.View
        style={[
          staticStyles.heroContainer,
          {
            transform: [{ translateX }, { translateY }, { scaleX }, { scaleY }],
          },
        ]}
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
      >
        {contentVisible && (
          <GestureHandlerRootView style={staticStyles.gestureRoot}>
            <StoryViewer
              userStories={params.userStories}
              initialUserIndex={params.initialUserIndex}
              isMyStory={params.isMyStory}
              onClose={handleClose}
            />
          </GestureHandlerRootView>
        )}
      </Animated.View>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// MomentCard
// ─────────────────────────────────────────────
const MomentCard = ({ storiesData, myStoriesData }) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [localStoriesData, setLocalStoriesData] = useState(storiesData || []);
  const [localMyStoriesData, setLocalMyStoriesData] = useState(
    myStoriesData || [],
  );
  const { userData } = useSelector((state) => state.users);
  const currentUserId = userData?._id;

  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [storyViewerParams, setStoryViewerParams] = useState({
    userStories: [],
    initialUserIndex: 0,
    isMyStory: false,
  });
  const [originRect, setOriginRect] = useState(null);

  useEffect(() => {
    setLocalStoriesData(storiesData || []);
  }, [storiesData]);

  useEffect(() => {
    setLocalMyStoriesData(myStoriesData || []);
  }, [myStoriesData]);

  useEffect(() => {
    const viewSub = DeviceEventEmitter.addListener(
      "STORY_VIEWED",
      ({ storyId }) => {
        const updateStories = (list) =>
          list.map((user) => ({
            ...user,
            stories: user.stories.map((s) => {
              if (s._id === storyId && !s.views?.includes(currentUserId)) {
                return { ...s, views: [...(s.views || []), currentUserId] };
              }
              return s;
            }),
          }));
        setLocalStoriesData((prev) => updateStories(prev));
        setLocalMyStoriesData((prev) => updateStories(prev));
      },
    );

    const reactSub = DeviceEventEmitter.addListener(
      "STORY_REACTED",
      ({ storyId, reaction, userId }) => {
        const updateReactions = (list) =>
          list.map((user) => ({
            ...user,
            stories: user.stories.map((s) => {
              if (s._id === storyId) {
                const nextStats = { ...s.stats };
                nextStats.reactions = {
                  ...nextStats.reactions,
                  [reaction]: (nextStats.reactions?.[reaction] || 0) + 1,
                };

                const nextPeopleReact = [...(s.peopleReact || [])];
                const existingIdx = nextPeopleReact.findIndex(
                  (r) => r.userId === userId,
                );
                if (existingIdx !== -1) {
                  const oldReaction = nextPeopleReact[existingIdx].reaction;
                  if (nextStats.reactions[oldReaction] > 0) {
                    nextStats.reactions[oldReaction] -= 1;
                  }
                  nextPeopleReact[existingIdx] = {
                    ...nextPeopleReact[existingIdx],
                    reaction,
                  };
                } else {
                  nextPeopleReact.push({ userId, reaction });
                }

                return { ...s, stats: nextStats, peopleReact: nextPeopleReact };
              }
              return s;
            }),
          }));
        setLocalStoriesData((prev) => updateReactions(prev));
        setLocalMyStoriesData((prev) => updateReactions(prev));
      },
    );

    return () => {
      viewSub.remove();
      reactSub.remove();
    };
  }, [currentUserId]);

  const openStoryViewer = useCallback((params, rect) => {
    setStoryViewerParams(params);
    setOriginRect(rect || null);
    setStoryViewerVisible(true);
  }, []);

  const closeStoryViewer = useCallback(() => {
    setStoryViewerVisible(false);
  }, []);

  const data = useMemo(() => {
    const apiStories = (localStoriesData || []).map((item) => ({
      ...item,
      type: "story",
      username: item.user?.[0]?.username || "User",
      userImage: { uri: item.user?.[0]?.profilePicture },
    }));
    return [{ type: "add" }, ...apiStories];
  }, [localStoriesData]);

  const handleStoryPress = useCallback(
    (item, index, touchableRef) => {
      if (item.type === "story" && item.stories) {
        const validStories = data.filter(
          (d) => d.type === "story" && d.stories && d.stories.length > 0,
        );
        const initialIndex = validStories.findIndex(
          (s) => (s._id || s.userId) === (item._id || item.userId),
        );

        const params = {
          userStories: validStories,
          initialUserIndex: initialIndex,
          isMyStory: false,
        };

        if (touchableRef?.current) {
          touchableRef.current.measure((x, y, width, height, pageX, pageY) => {
            openStoryViewer(params, { x: pageX, y: pageY, width, height });
          });
        } else {
          openStoryViewer(params, null);
        }
      }
    },
    [data, openStoryViewer],
  );

  const handlePlayAll = () => {
    const validStories = data.filter(
      (d) => d.type === "story" && d.stories && d.stories.length > 0,
    );
    if (validStories.length > 0) {
      openStoryViewer(
        {
          userStories: validStories,
          initialUserIndex: 0,
          isMyStory: false,
        },
        null,
      );
    }
  };

  return (
    <View
      style={[styles.mainContainer, { backgroundColor: colors.background }]}
    >
      <View style={[styles.row, styles.spaceBetween]}>
        {/* Figma: "TODAY'S" · 2 · "HIGHLIGHTS" */}
        <View style={styles.titleRow}>
          <CustomText
            label={"TODAY\u2019S"}
            fontSize={16}
            color={COLORS.gray48}
            fontFamily={fonts.BoldItalic}
            fontStyle="italic"
            letterSpacing={-0.96}
          />
          <CustomText
            label={"HIGHLIGHTS"}
            fontSize={16}
            color={colors.text}
            fontFamily={fonts.BoldItalic}
            fontStyle="italic"
            letterSpacing={-0.96}
          />
        </View>
        <TouchableOpacity style={styles.row} onPress={handlePlayAll}>
          <Icons
            name={"play_arrow"}
            family={"MaterialSymbolsRoundedFilled"}
            size={16}
            color={COLORS.gray48}
          />
          {/* same 18pt line box as the title so the row stays 18 tall */}
          <CustomText
            label={"PLAY ALL"}
            fontSize={13}
            color={colors.text}
            fontFamily={fonts.medium}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(_, i) => `moment-${i}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <MomentItem
            item={item}
            index={index}
            navigation={navigation}
            handleStoryPress={handleStoryPress}
            openStoryViewer={openStoryViewer}
            myStories={localMyStoriesData?.[0]}
          />
        )}
      />

      <StoryViewerModal
        visible={storyViewerVisible}
        params={storyViewerParams}
        originRect={originRect}
        onClose={closeStoryViewer}
      />
    </View>
  );
};

export default React.memo(MomentCard);

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    // Figma: section pad H8 V12, title → rings gap 16
    // Figma: pad V12 around an 11pt-tall title box; CustomText's 22.4pt line
    // box (16 × 1.4) adds ~5.7pt above and below the caps, so the paddings
    // are trimmed to match the visual 12 / 16 / 12 rhythm measured on the frame.
    mainContainer: {
      paddingTop: 6,
      paddingBottom: 12,
      paddingHorizontal: 8,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 4 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 2 },
    spaceBetween: { justifyContent: "space-between" },
    listContent: { gap: 10, marginTop: 10 },
    cardWrapper: {
      position: "relative",
    },
    card: {
      padding: 12,
      borderRadius: 99,
      borderWidth: 2,
      borderColor: isDark ? "#FFFFFF0A" : "rgba(18, 18, 18, 0.08)",
      backgroundColor: isDark ? "transparent" : "rgba(18, 18, 18, 0.04)",
      height: 80,
      width: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    storyContainer: {
      height: 80,
      width: 80,
      position: "relative",
      justifyContent: "center",
      alignItems: "center",
    },
    countBadge: {
      position: "absolute",
      top: 0,
      right: 0,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 100,
      backgroundColor: COLORS.red1,
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 20,
    },
    storyBorder: {
      position: "absolute",
      top: 0,
      left: 0,
    },
    imageContainer: {
      height: 70,
      width: 70,
      borderRadius: 99,
      overflow: "hidden",
    },
    cardImage: {
      width: "100%",
      height: "100%",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(44, 44, 44, 0.4)",
      borderRadius: 99,
    },
    heroContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      overflow: "hidden",
    },
    gestureRoot: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    },
  });
