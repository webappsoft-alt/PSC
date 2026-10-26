import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import Blur from "../../../../components/Blur";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { COLORS } from "../../../../utils/COLORS";
import Video from "react-native-video";
import { get, post } from "../../../../services/ApiRequest";
import { useSelector } from "react-redux";
import { useIsFocused } from "@react-navigation/native";
import { ActivityIndicator } from "react-native";
import LottieView from "lottie-react-native";
import UserBadge from "../../../../components/UserBadge";

const { width, height } = Dimensions.get("window");

const EMOJI_MAPPING = {
  "😀": "grinning",
  "😂": "joy",
  "😍": "heart_eyes",
  "🥲": "smiling_face_with_tear",
  "😎": "sunglasses",
  "🤯": "exploding_head",
  "😭": "sob",
  "🔥": "fire",
  "❤️": "love",
  "👍": "like",
};

// Reverse mapping for easier lookup
const REACTION_TO_EMOJI = Object.fromEntries(
  Object.entries(EMOJI_MAPPING).map(([emoji, reaction]) => [reaction, emoji]),
);

// Noto animated emoji list (same pattern used in StoryViewer & CommentScreen)
const EMOJI_DATA = [
  {
    char: "😀",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/lottie.json",
  },
  {
    char: "😂",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/lottie.json",
  },
  {
    char: "😍",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/lottie.json",
  },
  {
    char: "🥲",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f972/lottie.json",
  },
  {
    char: "😎",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/lottie.json",
  },
  {
    char: "🤯",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/lottie.json",
  },
  {
    char: "😭",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/lottie.json",
  },
  {
    char: "🔥",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json",
  },
  {
    char: "❤️",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/lottie.json",
  },
  {
    char: "👍",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/lottie.json",
  },
];

const EMOJI_URLS = Object.fromEntries(EMOJI_DATA.map((e) => [e.char, e.url]));

const StoryViewerById = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { userData } = useSelector((state) => state.users);
  const {
    userStories = [],
    initialUserIndex = 0,
    storyId = null,
  } = route.params || {};

  const [singleStory, setSingleStory] = useState(null);
  const [loading, setLoading] = useState(!!storyId);

  const fetchSingleStory = async () => {
    try {
      setLoading(true);
      const res = await get(`stories/${storyId}`);
      if (res?.data?.success) {
        setSingleStory(res.data.data);
      }
    } catch (error) {
      console.log("Error fetching single story:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storyId) {
      fetchSingleStory();
    }
  }, [storyId]);

  const flatStories = useMemo(() => {
    if (storyId && singleStory) {
      const storyData = {
        ...singleStory,
        userIndex: 0,
        storyIndex: 0,
        userInfo: {
          user: [singleStory.userId],
          username: singleStory.userId?.username,
          stories: [singleStory],
        },
        totalStories: 1,
      };
      return [storyData];
    }

    let flattened = [];
    userStories?.forEach((user, uIdx) => {
      user.stories.forEach((story, sIdx) => {
        flattened.push({
          ...story,
          userIndex: uIdx,
          storyIndex: sIdx,
          userInfo: user,
          totalStories: user.stories.length,
        });
      });
    });
    return flattened;
  }, [userStories, storyId, singleStory]);

  const initialGlobalIndex = useMemo(() => {
    const index = flatStories.findIndex(
      (s) => s.userIndex === initialUserIndex,
    );
    return index >= 0 ? index : 0;
  }, [flatStories, initialUserIndex]);

  const [currentIndex, setCurrentIndex] = useState(initialGlobalIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [videoReady, setVideoReady] = useState(false); // NEW: Track video ready state
  const pausedProgress = useRef(0);
  const videoRef = useRef(null);
  const emojiRefs = useRef([]);
  const [flyingEmoji, setFlyingEmoji] = useState(null);
  const flyX = useRef(new Animated.Value(0)).current;
  const flyY = useRef(new Animated.Value(0)).current;
  const flyScale = useRef(new Animated.Value(0.85)).current;
  const flyOpacity = useRef(new Animated.Value(0)).current;
  // Per-story optimistic reaction cache (keeps UI in sync within this viewer)
  const reactionCacheRef = useRef(new Map());
  const reactionPostingRef = useRef(new Set());
  const lastInitStoryIdRef = useRef(null);
  const [reactionCounts, setReactionCounts] = useState(() => {
    // Initialize with animation values
    return Object.keys(EMOJI_MAPPING).reduce((acc, emoji) => {
      acc[emoji] = {
        count: 0,
        scaleAnim: new Animated.Value(1),
      };
      return acc;
    }, {});
  });

  const progressAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const animationRef = useRef(null);

  const currentItem = flatStories[currentIndex];

  useEffect(() => {
    if (!currentItem?._id) return;

    const storyId = currentItem._id;

    // Avoid re-initializing on every render for the same story
    if (lastInitStoryIdRef.current === storyId) {
      return;
    }
    lastInitStoryIdRef.current = storyId;

    const cached = reactionCacheRef.current.get(storyId);

    // Base counts from API payload (if present)
    const baseCounts = {};
    Object.entries(EMOJI_MAPPING).forEach(([emoji, reactionKey]) => {
      baseCounts[emoji] = currentItem?.stats?.reactions?.[reactionKey] || 0;
    });

    // Determine selected reaction (cache wins)
    let nextSelectedEmoji = cached?.selectedEmoji ?? null;
    if (!nextSelectedEmoji && currentItem.peopleReact && userData?._id) {
      const userReactObj = currentItem.peopleReact.find(
        (r) => r.userId === userData._id,
      );
      if (userReactObj) {
        nextSelectedEmoji = REACTION_TO_EMOJI[userReactObj.reaction];
      }
    }
    setSelectedEmoji(nextSelectedEmoji);

    // Merge counts: start from base API counts, then overlay cached counts if any
    setReactionCounts((prev) => {
      const next = { ...prev };
      Object.keys(EMOJI_MAPPING).forEach((emoji) => {
        next[emoji] = {
          ...prev[emoji],
          count:
            typeof cached?.counts?.[emoji] === "number"
              ? cached.counts[emoji]
              : baseCounts[emoji],
        };
      });
      return next;
    });
  }, [currentItem, userData]);

  // Animation Logic - Optimized
  useEffect(() => {
    if (!currentItem) return;

    // Track story view
    const trackView = async () => {
      try {
        if (currentItem._id) {
          const url = `stories/${currentItem?._id}/view`;
          const response = await post(url);
        }
      } catch (error) {
        console.log("Error tracking story view:", error);
      }
    };
    trackView();

    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    // Reset progress and video ready state
    progressAnim.setValue(0);
    pausedProgress.current = 0;
    setVideoReady(false); // NEW: Reset video ready state
    // Note: selectedEmoji is handle in the reactionCounts useEffect above

    // MODIFIED: Start animation based on media type
    if (currentItem?.media?.type === "video") {
      // For videos, wait for videoReady state
      // Animation will start in the separate useEffect below
    } else {
      // For images, start immediately
      if (!isPaused) {
        startProgressAnimation();
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [currentIndex, currentItem]);

  // NEW: Separate useEffect to handle video ready state
  useEffect(() => {
    if (!currentItem) return;

    // Start animation when video is ready
    if (currentItem?.media?.type === "video" && videoReady && !isPaused) {
      startProgressAnimation();
    }
  }, [videoReady]);

  // Separate useEffect to handle pause/resume
  useEffect(() => {
    if (!currentItem) return;

    if (isPaused) {
      // Save current progress when pausing
      if (animationRef.current) {
        animationRef.current.stop();
        // @ts-ignore
        pausedProgress.current = progressAnim._value;
        animationRef.current = null;
      }
    } else {
      // Resume from paused position
      // For videos, only resume if video is ready
      if (currentItem?.media?.type === "video") {
        if (videoReady) {
          startProgressAnimation();
        }
      } else {
        startProgressAnimation();
      }
    }
  }, [isPaused]);

  const startProgressAnimation = () => {
    const duration =
      currentItem?.media?.type === "video"
        ? (currentItem?.media?.duration || 15) * 1000
        : 5000;

    // Calculate remaining duration based on paused progress
    const currentProgress = pausedProgress.current;
    const remainingDuration = duration * (1 - currentProgress);

    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    });

    animationRef.current.start(({ finished }) => {
      if (finished) {
        goToNext();
      }
      animationRef.current = null;
    });
  };

  const goToNext = useCallback(() => {
    if (currentIndex < flatStories.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    } else {
      isFocused ? navigation.goBack() : "";
    }
  }, [currentIndex, flatStories.length, navigation]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({
        index: prevIndex,
        animated: true,
      });
    } else {
      isFocused ? navigation.goBack() : "";
    }
  }, [currentIndex, navigation]);

  const handlePress = useCallback(
    (evt) => {
      const { locationX } = evt.nativeEvent;
      if (locationX < width / 2) {
        goToPrev();
      } else {
        goToNext();
      }
    },
    [goToPrev, goToNext],
  );

  const handleEmojiPress = useCallback(
    async (emoji, index, pressEvent) => {
      const reactionType = EMOJI_MAPPING[emoji];

      if (!reactionType || !currentItem?._id) return;
      const storyId = currentItem._id;
      if (reactionPostingRef.current.has(storyId)) return;
      // Prevent re-tapping the same reaction on the same story
      if (selectedEmoji === emoji) return;

      try {
        reactionPostingRef.current.add(storyId);

        // Update local state immediately for feedback
        const prevSelected = selectedEmoji;
        setSelectedEmoji(emoji);

        // Update local state counts (switch reaction if needed) and cache it per story
        setReactionCounts((prev) => {
          const next = { ...prev };

          if (prevSelected && next[prevSelected]) {
            next[prevSelected] = {
              ...next[prevSelected],
              count: Math.max(0, (next[prevSelected]?.count || 0) - 1),
            };
          }

          next[emoji] = {
            ...next[emoji],
            count: (next[emoji]?.count || 0) + 1,
          };

          const countsSnapshot = {};
          Object.keys(EMOJI_MAPPING).forEach((e) => {
            countsSnapshot[e] = next[e]?.count || 0;
          });
          reactionCacheRef.current.set(storyId, {
            selectedEmoji: emoji,
            counts: countsSnapshot,
          });

          return next;
        });

        // Make API call to post reaction
        const url = `stories/${currentItem._id}/reactions`;
        await post(url, { reaction: reactionType });

        // Animation for the emoji button
        Animated.sequence([
          Animated.timing(reactionCounts[emoji].scaleAnim, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(reactionCounts[emoji].scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();

        // Animate tapped emoji from its position to screen center
        const urlEmoji = EMOJI_URLS[emoji];
        const node = emojiRefs.current?.[index];
        if (urlEmoji) {
          const FLY_SIZE = 80;
          const endX = width / 2 - FLY_SIZE / 2;
          const endY = height / 2 - FLY_SIZE / 2;

          const runFly = (startX, startY) => {
            setFlyingEmoji({
              url: urlEmoji,
              size: FLY_SIZE,
              key: Date.now().toString(),
            });
            flyX.setValue(startX);
            flyY.setValue(startY);
            flyScale.setValue(0.85);
            flyOpacity.setValue(1);

            Animated.parallel([
              Animated.timing(flyX, {
                toValue: endX,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(flyY, {
                toValue: endY,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(flyScale, {
                  toValue: 1.25,
                  duration: 800,
                  useNativeDriver: true,
                }),
                Animated.timing(flyScale, {
                  toValue: 1,
                  duration: 800,
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.delay(500),
                Animated.timing(flyOpacity, {
                  toValue: 0,
                  duration: 500,
                  useNativeDriver: true,
                }),
              ]),
            ]).start(() => {
              setFlyingEmoji(null);
            });
          };

          if (node?.measureInWindow) {
            node.measureInWindow((x, y, w, h) => {
              runFly(x + w / 2 - FLY_SIZE / 2, y + h / 2 - FLY_SIZE / 2);
            });
          } else {
            const pageX = pressEvent?.nativeEvent?.pageX;
            const pageY = pressEvent?.nativeEvent?.pageY;
            if (typeof pageX === "number" && typeof pageY === "number") {
              runFly(pageX - FLY_SIZE / 2, pageY - FLY_SIZE / 2);
            }
          }
        }
      } catch (error) {
        console.log("Error posting reaction:", error);
      } finally {
        if (currentItem?._id) {
          reactionPostingRef.current.delete(currentItem._id);
        }
      }
    },
    [currentItem, reactionCounts, selectedEmoji],
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length > 0) {
      const index = viewableItems[0]?.index;
      if (index !== null && index !== undefined) {
        setCurrentIndex((prev) => (prev !== index ? index : prev));
      }
    }
  }).current;

  const renderProgressBars = useCallback(() => {
    if (!currentItem) return null;
    const { storyIndex, totalStories } = currentItem;

    return (
      <View style={styles.progressBarContainer}>
        {Array.from({ length: totalStories }).map((_, idx) => {
          return (
            <View key={idx} style={styles.progressBarBackground}>
              {idx === storyIndex ? (
                <Animated.View
                  style={[
                    styles.progressBarForeground,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.progressBarForeground,
                    { width: idx < storyIndex ? "100%" : "0%" },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  }, [currentItem, progressAnim]);

  const renderStoryItem = useCallback(
    ({ item, isCurrentBlock = true }) => {
      const isCurrentItem =
        flatStories[currentIndex] === item && isCurrentBlock;

      return (
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.storyItemContainer,
            {
              width: width,
              height: height,
            },
          ]}
          onPress={handlePress}
          onLongPress={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
          delayLongPress={200}
        >
          {item?.postId?._id ? (
            <View
              style={{
                // alignItems: "center",
                justifyContent: "center",
                height: 350,
                width: "80%",
                borderRadius: 12,
                // overflow: "hidden",
              }}
            >
              <View style={[styles.viewPostContainer, styles.topBorder]}>
                <View
                  style={{
                    padding: 3,
                    borderColor: item?.postId?.userId?.profile?.profileColor,
                    borderWidth: 2,
                    borderRadius: 99,
                  }}
                >
                  {item?.postId?.userId?.profile?.avatar ? (
                    <ImageFast
                      source={{ uri: item?.postId?.userId?.profile?.avatar }}
                      style={styles.avatar1}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatar1,
                        {
                          backgroundColor:
                            item?.postId?.userId?.profile?.profileColor,
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.userInfo1}>
                  <View style={styles.nameRow1}>
                    <CustomText
                      label={item?.postId?.userId?.firstName}
                      color={COLORS.black}
                      fontSize={12}
                    />
                    <UserBadge user={item?.postId?.userId} size={12} mutedColor="rgba(18, 18, 18, 0.64)" />
                  </View>
                  <CustomText
                    label={`@${item?.postId?.userId?.username}`}
                    color={COLORS.authText}
                    fontSize={10}
                  />
                </View>
              </View>

              {item?.media?.type == "video" ? (
                <Video
                  ref={isCurrentItem ? videoRef : null}
                  source={{ uri: item.media.url }}
                  style={styles.storyImage}
                  // resizeMode="contain"
                  paused={true}
                  repeat={false}
                  playInBackground={false}
                  playWhenInactive={false}
                />
              ) : (
                <ImageFast
                  source={{ uri: item?.media?.url }}
                  style={styles.storyImage}
                />
              )}
              <TouchableOpacity
                style={[styles.viewPostContainer, styles.bottomBorder]}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate("DetailPageWithId", {
                    postId: item?.postId?._id,
                  });
                }}
              >
                <CustomText
                  label={"View Post"}
                  color={COLORS.black}
                  fontSize={12}
                  fontFamily={fonts.medium}
                />
                <Image
                  source={Images.forwardIcon}
                  style={{ height: 20, width: 20, tintColor: COLORS.black }}
                />
              </TouchableOpacity>
              <CustomText
                label={`@${item?.postId?.userId?.username}`}
                fontSize={12}
                fontFamily={fonts.medium}
                marginTop={10}
              />
            </View>
          ) : item?.media?.type === "video" ? (
            <Video
              ref={isCurrentItem ? videoRef : null}
              source={{ uri: item.media.url }}
              style={styles.storyImage}
              // resizeMode="contain"
              paused={isPaused || !isCurrentItem}
              repeat={false}
              playInBackground={false}
              playWhenInactive={false}
              onLoad={(data) => {
                // Update duration if different from expected
                if (isCurrentItem && data.duration) {
                  item.media.duration = data.duration;
                }
              }}
              onReadyForDisplay={() => {
                // NEW: Set video ready when it's ready to display
                if (isCurrentItem) {
                  setVideoReady(true);
                }
              }}
            />
          ) : (
            <ImageFast
              source={{ uri: item?.media?.url }}
              style={styles.storyImage}
              // resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      );
    },
    [currentIndex, flatStories, handlePress, isPaused],
  );

  if (!currentItem && !loading) return null;
  const userInfo = currentItem?.userInfo;

  return (
    <ScreenWrapper translucent paddingHorizontal={0} backgroundColor="black">
      <StatusBar barStyle="light-content" />

      {loading ? (
        <View
          style={[
            styles.storyItemContainer,
            { width, height, justifyContent: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={flatStories}
            renderItem={renderStoryItem}
            keyExtractor={(item, index) => `story-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            scrollEnabled={!isPaused}
            initialScrollIndex={initialGlobalIndex}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            windowSize={3}
            maxToRenderPerBatch={3}
            removeClippedSubviews={true}
          />

          {flyingEmoji && (
            <Animated.View
              pointerEvents="none"
              key={flyingEmoji.key}
              style={[
                styles.flyingEmoji,
                {
                  width: flyingEmoji.size,
                  height: flyingEmoji.size,
                  opacity: flyOpacity,
                  transform: [
                    { translateX: flyX },
                    { translateY: flyY },
                    { scale: flyScale },
                  ],
                },
              ]}
            >
              <LottieView
                source={{ uri: flyingEmoji.url }}
                autoPlay
                loop
                style={{ width: "100%", height: "100%" }}
              />
            </Animated.View>
          )}

          {!route.params?.isMyStory && (
            <View style={[styles.overlayContainer, { bottom: insets.bottom }]}>
              <View style={styles.emojiStripContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.emojiStripContent}
                >
                  {EMOJI_DATA.map((emojiObj, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.emojiButtonContainer,
                        { width: selectedEmoji === emojiObj.char ? 70 : 48 },
                      ]}
                      activeOpacity={0.7}
                      disabled={selectedEmoji === emojiObj.char}
                      ref={(r) => {
                        emojiRefs.current[idx] = r;
                      }}
                      onPress={(e) => handleEmojiPress(emojiObj.char, idx, e)}
                    >
                      <View
                        style={[
                          styles.emojiButton,
                          {
                            width: selectedEmoji === emojiObj.char ? 60 : 40,
                          },
                          selectedEmoji === emojiObj.char && {
                            backgroundColor: COLORS.white,
                          },
                        ]}
                      >
                        {selectedEmoji !== emojiObj.char && (
                          <Blur
                            blurAmount={10}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                        <View style={styles.emojiContent}>
                          <LottieView
                            source={{ uri: emojiObj.url }}
                            autoPlay
                            loop
                            style={{ width: 28, height: 28 }}
                          />
                          {selectedEmoji === emojiObj.char && (
                            <Animated.View
                              style={[
                                styles.countContainer,
                                {
                                  transform: [
                                    {
                                      scale:
                                        reactionCounts[emojiObj.char]
                                          ?.scaleAnim || 1,
                                    },
                                  ],
                                },
                              ]}
                            >
                              <CustomText
                                label={
                                  reactionCounts[
                                    emojiObj.char
                                  ]?.count?.toString() || "0"
                                }
                                fontFamily={fonts.medium}
                                color={COLORS.black}
                              />
                            </Animated.View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {renderProgressBars()}
            </View>
          )}

          {route.params?.isMyStory && (
            <View style={[styles.overlayContainer, { bottom: insets.bottom }]}>
              {renderProgressBars()}
            </View>
          )}

          <View style={[styles.overlayContainer, { top: insets.top }]}>
            <View style={styles.headerRow}>
              <View style={styles.leftHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Blur />
                  <Image source={Images.back} style={styles.backIcon} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.userInfo}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("UserProfile", {
                      userId: currentItem?.userInfo?.user?.[0]?._id,
                    })
                  }
                >
                  <View style={styles.avatarContainer}>
                    {userInfo?.user?.[0]?.profile?.avatar ? (
                      <ImageFast
                        source={{ uri: userInfo.user[0].profile.avatar }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatar,
                          {
                            backgroundColor:
                              userInfo.user[0].profile.profileColor,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.userTexts}>
                    <View style={styles.nameRow}>
                      <CustomText
                        label={`${userInfo.user[0]?.firstName} ${userInfo.user[0]?.lastName}`}
                        color={COLORS.white}
                        fontFamily={fonts.semiBold}
                        fontSize={14}
                      />
                      <UserBadge user={userInfo.user[0]} />
                    </View>
                    <CustomText
                      label={`@${
                        userInfo.username?.toLowerCase() || "username"
                      }`}
                      color={COLORS.gray48}
                      fontSize={12}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.rightHeader}>
                {!route.params?.isMyStory && (
                  <CustomButton
                    title={"Follow"}
                    width={80}
                    height={32}
                    borderRadius={8}
                    fontSize={14}
                    backgroundColor={"rgba(255, 255, 255, 0.2)"}
                    color={COLORS.white}
                  />
                )}
                <TouchableOpacity style={styles.moreButton}>
                  <Blur />
                  <Image source={Images.moreIcon} style={styles.moreIcon} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  storyItemContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  storyImage: {
    width: "100%",
    height: "100%",
  },
  overlayContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  progressBarContainer: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressBarForeground: {
    height: "100%",
    backgroundColor: COLORS.white,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userTexts: {
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  moreButton: {
    height: 32,
    width: 32,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  moreIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
    tintColor: COLORS.white,
  },
  backIcon: {
    height: 24,
    width: 24,
  },
  emojiStripContainer: {
    marginBottom: 20,
  },
  emojiStripContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 99,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 99,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  emojiContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  countContainer: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  flyingEmoji: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  viewPostContainer: {
    height: 40,
    backgroundColor: "white",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 6,
  },
  topBorder: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  bottomBorder: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: "space-between",
  },

  avatar1: {
    height: 22,
    width: 22,
    borderRadius: 99,
  },
  userInfo1: {
    marginLeft: 8,
  },
  nameRow1: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default StoryViewerById;
