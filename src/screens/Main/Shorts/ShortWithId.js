import { BlurView } from "@react-native-community/blur";
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video from "react-native-video";
import { useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import Blur from "../../../components/Blur";
import BottomSheetComponent from "../../../components/BottomSheetComponent";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import TopTab from "../../../components/TopTab";
import { get, post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { uploadAndGetUrl } from "../../../utils/constants";
import UploadImageCustom from "../../../components/UploadImageCustom";
import CommentModal from "../CommentScreen/molecules/CommentModal";
import HomeHeader from "../Home/molecules/HomeHeader";
import LeftBottomOverlay from "./molecules/LeftBottomOverlay";
import RightBottomOverlay from "./molecules/RightBottomOverlay";
import ShareModal from "../Home/molecules/ShareModal";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const emojiData = [
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

const ShortWithId = () => {
  const isFocus = useIsFocused();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params || {};

  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tab, setTab] = useState(0);
  const [videoLoading, setVideoLoading] = useState({});
  const [videoDuration, setVideoDuration] = useState({});
  const [videoProgress, setVideoProgress] = useState({});
  const [isSeeking, setIsSeeking] = useState(false);
  const [scrubberLayouts, setScrubberLayouts] = useState({});
  const [repeatStates, setRepeatStates] = useState({});
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const progressAnimations = useRef({});

  const { userData } = useSelector((state) => state.users);

  const {
    data: postData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const response = await get(`posts/${postId}`);
      return response?.data?.data || response?.data;
    },
    enabled: !!postId,
  });

  const videos = useMemo(() => (postData ? [postData] : []), [postData]);

  // Initialize progress animations for all videos
  useEffect(() => {
    videos.forEach((video) => {
      const videoId = video._id || video.id;
      if (!progressAnimations.current[videoId]) {
        progressAnimations.current[videoId] = new Animated.Value(0);
      }
    });
  }, [videos]);

  // Update repeat states when videos change
  useEffect(() => {
    if (videos.length > 0) {
      let hasChanges = false;
      const newRepeatStates = { ...repeatStates };
      videos.forEach((v) => {
        if (newRepeatStates[v._id] === undefined) {
          newRepeatStates[v._id] = true;
          hasChanges = true;
        }
      });
      if (hasChanges) {
        setRepeatStates(newRepeatStates);
      }
    }
  }, [videos]);

  // Reset progress animation when video changes
  useEffect(() => {
    const currentVideo = videos[currentIndex];
    if (currentVideo) {
      const videoId = currentVideo._id || currentVideo.id;
      // Reset the animation for the current video
      if (progressAnimations.current[videoId]) {
        progressAnimations.current[videoId].setValue(0);
      }
      // Reset stored progress
      setVideoProgress((prev) => ({ ...prev, [videoId]: 0 }));
    }
  }, [currentIndex, videos]);

  // Handle viewable items change to track current video
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      if (visibleIndex !== currentIndex) {
        setCurrentIndex(visibleIndex);
        setPaused(false);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Toggle play/pause on video tap
  const handleVideoPress = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  // Handle scroll end
  const handleScrollEnd = useCallback(
    (event) => {
      const contentOffsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(contentOffsetY / SCREEN_HEIGHT);
      if (index !== currentIndex) {
        setCurrentIndex(index);
      }
    },
    [currentIndex],
  );

  // Handle video load start
  const handleLoadStart = useCallback((videoId) => {
    setVideoLoading((prev) => ({ ...prev, [videoId]: true }));
  }, []);

  // Handle video ready to play
  const handleLoad = useCallback((videoId, data) => {
    setVideoLoading((prev) => ({ ...prev, [videoId]: false }));
    setVideoDuration((prev) => ({ ...prev, [videoId]: data.duration }));
  }, []);

  // Handle video progress with smoother updates
  const handleProgress = useCallback(
    (videoId, data) => {
      const duration = videoDuration[videoId] || 0;
      if (duration > 0 && !isSeeking) {
        const progress = (data.currentTime / duration) * 100;
        setVideoProgress((prev) => ({ ...prev, [videoId]: progress }));

        // Update animation smoothly - direct setValue for real-time updates
        if (progressAnimations.current[videoId]) {
          progressAnimations.current[videoId].setValue(progress);
        }
      }
    },
    [isSeeking, videoDuration],
  );

  // Handle repeat toggle
  const handleToggleRepeat = useCallback((videoId) => {
    setRepeatStates((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
  }, []);

  // Store scrubber layout dimensions
  const handleScrubberLayout = useCallback((videoId, event) => {
    const { width } = event.nativeEvent.layout;
    setScrubberLayouts((prev) => ({ ...prev, [videoId]: { width } }));
  }, []);

  // Create PanResponder for video scrubbing with smoother animation
  const createScrubberPanResponder = useCallback(
    (videoId) => {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setIsSeeking(true);
          const layout = scrubberLayouts[videoId];
          const duration = videoDuration[videoId] || 0;

          if (layout && duration > 0) {
            const touchX = evt.nativeEvent.locationX;
            const clampedX = Math.max(0, Math.min(touchX, layout.width));
            const progress = (clampedX / layout.width) * 100;

            if (progressAnimations.current[videoId]) {
              progressAnimations.current[videoId].setValue(progress);
            }
          }
        },
        onPanResponderMove: (evt) => {
          const layout = scrubberLayouts[videoId];
          const duration = videoDuration[videoId] || 0;

          if (layout && duration > 0) {
            const touchX = evt.nativeEvent.locationX;
            const clampedX = Math.max(0, Math.min(touchX, layout.width));
            const progress = (clampedX / layout.width) * 100;

            if (progressAnimations.current[videoId]) {
              progressAnimations.current[videoId].setValue(progress);
            }
          }
        },
        onPanResponderRelease: (evt) => {
          const layout = scrubberLayouts[videoId];
          const duration = videoDuration[videoId] || 0;

          if (layout && duration > 0) {
            const touchX = evt.nativeEvent.locationX;
            const clampedX = Math.max(0, Math.min(touchX, layout.width));
            const progress = (clampedX / layout.width) * 100;
            const seekTime = (clampedX / layout.width) * duration;

            if (videoRefs.current[videoId]) {
              videoRefs.current[videoId].seek(seekTime);
            }

            if (progressAnimations.current[videoId]) {
              progressAnimations.current[videoId].setValue(progress);
            }
          }

          setTimeout(() => setIsSeeking(false), 100);
        },
        onPanResponderTerminate: () => {
          setTimeout(() => setIsSeeking(false), 100);
        },
      });
    },
    [scrubberLayouts, videoDuration],
  );

  // Comment section logic
  const sheetRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [selectedPostForComment, setSelectedPostForComment] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [sortBy, setSortBy] = useState("mostRecent"); // Default to most recent
  const commentInputRef = useRef(null);
  const [keyboardHeight] = useState(new Animated.Value(0));
  const emojis = ["😀", "😂", "😍", "🥲", "😎", "🤯", "😭", "🔥", "❤️", "👍"];

  // Track local comment counts for each post
  const [localCommentCounts, setLocalCommentCounts] = useState({});

  // Track if sheet is open
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const commentSnapPoints = useMemo(() => ["70%", "100%"], []);

  // Keyboard handling for comment input
  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShow = Keyboard.addListener(keyboardShowEvent, (event) => {
      sheetRef.current?.snapToIndex(1);
      Animated.timing(keyboardHeight, {
        duration: event.duration || 250,
        toValue: event.endCoordinates.height,
        useNativeDriver: false,
      }).start();
    });

    const keyboardHide = Keyboard.addListener(keyboardHideEvent, (event) => {
      Animated.timing(keyboardHeight, {
        duration: event.duration || 250,
        toValue: 0,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []);

  const fetchComments = async (
    postId = selectedPostForComment?._id,
    sortParam = sortBy,
  ) => {
    if (!postId) return;
    try {
      setCommentLoading(true);
      // Clear comments immediately to prevent flash of old comments
      setComments([]);
      const response = await get(`posts/${postId}/comment?sort=${sortParam}`);
      if (response?.data?.success && response?.data?.data?.comments) {
        setComments(response.data.data.comments);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleTabChange = (tabIndex) => {
    // If clicking the same tab that's already active, remove sorting
    const currentTabIndex =
      sortBy === "mostLiked" ? 0 : sortBy === "mostRecent" ? 1 : -1;

    if (currentTabIndex === tabIndex) {
      setSortBy("");
      fetchComments(selectedPostForComment?._id, "");
    } else {
      const sortParam = tabIndex === 0 ? "mostLiked" : "mostRecent";
      setSortBy(sortParam);
      fetchComments(selectedPostForComment?._id, sortParam);
    }
  };

  const handleLikeReaction = async (comment) => {
    if (!selectedPostForComment?._id || !comment?._id || !userData?._id) return;

    const isLiked = comment.reactions?.includes(userData._id);
    const previousComments = [...comments];

    // Optimistically update the comments state
    const updatedComments = comments.map((c) => {
      // If the comment being liked is a main comment
      if (c._id === comment._id) {
        return {
          ...c,
          reactions: isLiked
            ? c.reactions.filter((id) => id !== userData._id)
            : [...(c.reactions || []), userData._id],
          stats: {
            ...c.stats,
            likes: isLiked
              ? Math.max(0, (c.stats?.likes || 0) - 1)
              : (c.stats?.likes || 0) + 1,
          },
        };
      }

      // If the comment being liked is a reply
      if (c.replies?.length > 0) {
        return {
          ...c,
          replies: c.replies.map((r) => {
            if (r._id === comment._id) {
              return {
                ...r,
                reactions: isLiked
                  ? r.reactions.filter((id) => id !== userData._id)
                  : [...(r.reactions || []), userData._id],
                stats: {
                  ...r.stats,
                  likes: isLiked
                    ? Math.max(0, (r.stats?.likes || 0) - 1)
                    : (r.stats?.likes || 0) + 1,
                },
              };
            }
            return r;
          }),
        };
      }

      return c;
    });

    setComments(updatedComments);

    try {
      const res = await post(
        `posts/${selectedPostForComment._id}/reaction/${comment._id}`,
        {
          reaction: "like",
        },
      );
      if (!res?.data?.success) {
        setComments(previousComments);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      setComments(previousComments);
    }
  };

  const handleCommentPress = (post) => {
    setSelectedPostForComment(post);
    fetchComments(post._id);
    // Initialize local count if not already set
    if (!localCommentCounts[post._id]) {
      setLocalCommentCounts((prev) => ({
        ...prev,
        [post._id]: post.commentsCount || post.comments || 0,
      }));
    }
    setIsSheetOpen(true);
    sheetRef.current?.snapToIndex(0);
  };

  const handleImagePick = () => {
    setShowImagePicker(true);
  };

  const handleImageSelected = async (result) => {
    setShowImagePicker(false);
    setIsUploadingImage(true);
    try {
      const url = await uploadAndGetUrl(result);
      if (url) {
        setSelectedImageUrl(url);
      }
    } catch (error) {
      ToastMessage("Failed to upload image", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageUrl(null);
  };

  const handleSendComment = async () => {
    if (
      (!commentText?.trim() && !selectedImageUrl) ||
      !selectedPostForComment?._id ||
      isSubmittingComment ||
      isUploadingImage
    )
      return;

    const currentCommentText = commentText.trim();
    const currentReplyingTo = replyingTo;
    const currentImageUrl = selectedImageUrl;
    const tempId = Date.now().toString();

    // Check if it's a single emoji to send the Lottie link
    const matchingEmoji = emojiData.find((e) => e.char === currentCommentText);
    const finalCommentContent = matchingEmoji
      ? matchingEmoji.url
      : currentCommentText;

    // Optimistic Comment Object
    const optimisticComment = {
      _id: tempId,
      comment: finalCommentContent,
      ...(currentImageUrl && {
        attachment: {
          url: currentImageUrl,
          type: "image",
        },
      }),
      user: {
        firstName: userData?.firstName || "Me",
        lastName: userData?.lastName || "",
        username: userData?.username || "me",
        profile: {
          avatar: userData?.profile?.avatar || "",
          profileColor: userData?.profile?.profileColor || COLORS.gray48,
        },
      },
      createdAt: new Date().toISOString(),
      isPosting: true, // Custom flag for UI status
      stats: {
        likes: 0,
        replies: 0,
      },
      replies: [],
    };

    // Update UI immediately (optimistically)
    if (currentReplyingTo) {
      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment._id === currentReplyingTo._id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), optimisticComment],
              stats: {
                ...comment.stats,
                replies: (comment.stats?.replies || 0) + 1,
              },
            };
          }
          return comment;
        }),
      );
    } else {
      setComments((prevComments) => [optimisticComment, ...prevComments]);
      // Increment the local comment count for real-time update
      setLocalCommentCounts((prev) => ({
        ...prev,
        [selectedPostForComment._id]:
          (prev[selectedPostForComment._id] ||
            selectedPostForComment.commentsCount ||
            0) + 1,
      }));
    }

    // Clear input immediately for better UX
    setCommentText("");
    setSelectedImageUrl(null);
    setReplyingTo(null);
    Keyboard.dismiss();

    try {
      setIsSubmittingComment(true);
      const requestBody = { comment: finalCommentContent };
      if (currentImageUrl) {
        requestBody.attachment = {
          url: currentImageUrl,
          type: "image",
        };
      }
      if (currentReplyingTo)
        requestBody.parentCommentId = currentReplyingTo._id;

      const response = await post(
        `posts/${selectedPostForComment._id}/comment`,
        requestBody,
      );
      if (response?.data?.success && response?.data?.data) {
        const newComment = response.data.data;
        if (currentReplyingTo) {
          setComments((prev) =>
            prev.map((c) => (c._id === currentReplyingTo._id ? newComment : c)),
          );
        } else {
          setComments((prev) =>
            prev.map((c) => (c._id === tempId ? newComment : c)),
          );
        }
      } else {
        rollback();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      rollback();
    } finally {
      setIsSubmittingComment(false);
    }

    function rollback() {
      if (currentReplyingTo) {
        setComments((prevComments) =>
          prevComments.map((comment) => {
            if (comment._id === currentReplyingTo._id) {
              return {
                ...comment,
                replies: (comment.replies || []).filter(
                  (r) => r._id !== tempId,
                ),
                stats: {
                  ...comment.stats,
                  replies: Math.max(0, (comment.stats?.replies || 0) - 1),
                },
              };
            }
            return comment;
          }),
        );
      } else {
        setComments((prevComments) =>
          prevComments.filter((c) => c._id !== tempId),
        );
        // Rollback comment count
        setLocalCommentCounts((prev) => ({
          ...prev,
          [selectedPostForComment._id]: Math.max(
            0,
            (prev[selectedPostForComment._id] || 0) - 1,
          ),
        }));
      }
    }
  };

  const handleEmojiPress = (emoji) => {
    setCommentText((prev) => (prev || "") + emoji);
    // Focus the input and make sure sheet stays at proper snap point
    commentInputRef.current?.focus();
    sheetRef.current?.snapToIndex(1);
  };

  // Render individual video item
  const renderVideoItem = useCallback(
    ({ item, index }) => {
      const isCurrentVideo = index === currentIndex;
      const itemId = item._id || item.id;
      const isLoading = videoLoading[itemId] ?? false;
      const isRepeatEnabled = repeatStates[itemId];
      const videoUri = item.video || item.uri;

      // Determine if video should be paused
      const shouldPause = !isCurrentVideo || paused;

      // Get the progress animation for this video
      const progressAnim =
        progressAnimations?.current[itemId] || new Animated.Value(0);

      return (
        <View style={styles.videoContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleVideoPress}
            style={styles.videoTouchable}
          >
            <Video
              ref={(ref) => {
                videoRefs.current[itemId] = ref;
              }}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode="cover"
              repeat={isRepeatEnabled}
              paused={shouldPause}
              onLoadStart={() => handleLoadStart(itemId)}
              onLoad={(data) => handleLoad(itemId, data)}
              onProgress={(data) => handleProgress(itemId, data)}
              progressUpdateInterval={50}
              onReadyForDisplay={() =>
                handleLoad(itemId, { duration: videoDuration[itemId] || 0 })
              }
              onError={(error) => {
                console.error("Video Error:", error);
                handleLoad(itemId, { duration: 0 });
              }}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="obey"
              bufferConfig={{
                minBufferMs: 2500,
                maxBufferMs: 10000,
                bufferForPlaybackMs: 1000,
                bufferForPlaybackAfterRebufferMs: 1500,
              }}
              poster={item.thumbnail}
              posterResizeMode="cover"
            />
          </TouchableOpacity>

          <View
            style={[
              {
                gap: 4,
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-end",
                marginTop: 16,
                marginRight: 12,
                position: "absolute",
                zIndex: 100,
                top: 130,
                right: 0,
              },
            ]}
          >
            <ImageFast
              source={Images.linked}
              style={{ height: 16, width: 16 }}
              onPress={() => navigation.navigate("SearchScreen")}
            />
            <CustomText
              label={item?.author?.username || "viktor.sola"}
              fontSize={12}
              color={COLORS.white}
              fontFamily={fonts.medium}
            />
          </View>

          <LeftBottomOverlay item={item} />

          <RightBottomOverlay
            item={item}
            onCommentPress={() => handleCommentPress(item)}
            onSharePress={() => setIsShareModalVisible(true)}
            localCommentCount={localCommentCounts[itemId]}
            onVoteUpdate={() => {
              // Instead of a full refetch which causes list jumps,
              // we can selectively update the query cache if needed.
              // For now, the optimistic state in RightBottomOverlay handles the visual,
              // and we avoid the full-list re-render that's causing layout issues.
            }}
          />

          <LinearGradient
            colors={["rgba(18, 18, 18, 1)", "rgba(18, 18, 18, 0)"]}
            style={styles.topGradient}
            pointerEvents="none"
          />

          <LinearGradient
            colors={["rgba(60, 61, 55, 0)", "rgba(60, 61, 55, 1)"]}
            style={styles.bottomGradient}
            pointerEvents="none"
          />

          <View style={[styles.inPutContainer, { bottom: insets.bottom }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleCommentPress(item)}
              style={{
                width: "100%",
                height: 48,
                width: "100%",
                backgroundColor: "transparent",
                borderRadius: 99,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                overflow: "hidden",
              }}
            >
              <Blur blurAmount={4} blurType="light" zIndex={0} />
              <CustomText
                label={"Type message"}
                fontFamily={fonts.medium}
                fontSize={16}
                color={COLORS.gray48}
              />
            </TouchableOpacity>
            <View style={styles.rowOnly}>
              <TouchableOpacity onPress={() => handleToggleRepeat(itemId)}>
                <Image
                  source={Images.reloadReel}
                  style={{
                    height: 24,
                    width: 24,
                    opacity: isRepeatEnabled ? 1 : 0.5,
                  }}
                />
              </TouchableOpacity>

              {/* Custom Video Scrubber */}
              <View
                style={styles.scrubberContainer}
                onLayout={(e) => handleScrubberLayout(itemId, e)}
              >
                <View style={styles.scrubberTrack}>
                  {/* Progress bar */}
                  <Animated.View
                    style={[
                      styles.scrubberProgress,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />

                  {/* Touch area for scrubbing */}
                  <View
                    style={styles.scrubberTouchArea}
                    {...createScrubberPanResponder(itemId).panHandlers}
                  >
                    {/* Scrubber thumb */}
                    <Animated.View
                      style={[
                        styles.scrubberThumb,
                        {
                          left: progressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ["0%", "100%"],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {paused && isCurrentVideo && !isLoading && (
            <TouchableOpacity
              onPress={() => setPaused(false)}
              style={styles.playPauseContainer}
            >
              <Icons
                name="play-circle-filled"
                size={80}
                color="rgba(255,255,255,0.8)"
                family={"MaterialIcons"}
              />
            </TouchableOpacity>
          )}

          {isLoading && isCurrentVideo && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.white} />
            </View>
          )}
        </View>
      );
    },
    [
      currentIndex,
      paused,
      videoLoading,
      videoDuration,
      repeatStates,
      scrubberLayouts,
      handleVideoPress,
      handleLoadStart,
      handleLoad,
      handleProgress,
      handleToggleRepeat,
      handleScrubberLayout,
      createScrubberPanResponder,
      insets.bottom,
      videos,
    ],
  );

  const keyExtractor = useCallback(
    (item, index) => `${item._id || item.id}-${index}`,
    [],
  );

  const handleOnFocus = useCallback(() => {
    sheetRef.current?.expand();
  }, []);

  if (isLoading && !isRefetching) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <ScreenWrapper
      translucent
      headerUnScrollable={() => (
        <View
          style={{
            position: "absolute",
            top: insets.top,
            zIndex: 1,
            width: SCREEN_WIDTH,
          }}
        >
          <HomeHeader
            isShort
            onCameraPress={() => navigation.navigate("CreateShort")}
          />
          <View style={[styles.row]}>
            <ImageFast
              source={Images.compassBg}
              style={{ width: 36, height: 32 }}
            />
            <TopTab
              rounded
              isBlur
              setTab={setTab}
              borderRadius={8}
              tabNames={[
                "Technology",
                "Politics",
                "Sports",
                "Music",
                "Fashion",
                "Entertainment",
                "Gaming",
                "Food",
                "Health",
              ]}
            />
          </View>
        </View>
      )}
      paddingHorizontal={0.1}
      style={styles.container}
    >
      <View style={{ flex: 1 }}>
        {postData && renderVideoItem({ item: postData, index: 0 })}
      </View>
      {/* Absolute wrapper to prevent layout interference with FlatList */}
      <View
        pointerEvents="box-none"
        style={{
          height: SCREEN_HEIGHT / 1.1,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 12,
        }}
      >
        <BottomSheetComponent
          ref={sheetRef}
          snapPoints={commentSnapPoints}
          enableScrollView={false}
          enableDynamicSizing={false}
          initialIndex={-1}
          enablePanDownToClose
          onChange={(index) => {
            setIsSheetOpen(index >= 0);
          }}
          onClose={() => {
            setIsSheetOpen(false);
            setSelectedPostForComment(null);
            setReplyingTo(null);
            Keyboard.dismiss();
          }}
        >
          <View style={styles.sheetHeader}>
            <CustomText
              fontFamily={fonts.semiBold}
              label={`${comments.length || 0} Comment${
                comments.length !== 1 ? "s" : ""
              }`}
              fontSize={20}
              lineHeight={20 * 1.4}
              color={COLORS.white}
            />
            <TouchableOpacity onPress={() => sheetRef.current?.close()}>
              <Image source={Images.commentCross} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetContentWrapper}>
            <CommentModal
              comments={comments}
              loading={commentLoading}
              post={selectedPostForComment}
              onReply={setReplyingTo}
              onLike={handleLikeReaction}
              onTabChange={handleTabChange}
              userData={userData}
              currentTab={
                sortBy === "mostLiked" ? 0 : sortBy === "mostRecent" ? 1 : null
              }
            />
          </View>

          {/* Comment Input Footer */}
        </BottomSheetComponent>

        {isSheetOpen && (
          <Animated.View
            style={[
              styles.commentInputWrapper,
              {
                marginBottom:
                  Platform.OS === "android" && Platform.Version < 35
                    ? 0
                    : keyboardHeight,
                zIndex: 999,
                paddingBottom: Platform.OS === "ios" ? insets.bottom : 20,
              },
            ]}
          >
            <Blur blurAmount={1} blurType="dark" />

            {replyingTo && (
              <BlurView style={styles.replyBlur} blurType="dark" blurAmount={3}>
                <View style={styles.replyIndicator}>
                  <View style={styles.replyIndicatorLeft}>
                    <Icons
                      name="corner-down-right"
                      family="Feather"
                      size={14}
                      color={"rgba(255, 255, 255, 0.64)"}
                    />
                    <CustomText
                      label={`Replying to `}
                      fontSize={12}
                      color={"rgba(255, 255, 255, 0.64)"}
                      marginLeft={6}
                    />
                    {replyingTo?.comment?.startsWith("https://") ? (
                      <LottieView
                        source={{ uri: replyingTo.comment }}
                        autoPlay
                        loop
                        style={{ width: 20, height: 20, marginLeft: 4 }}
                      />
                    ) : (
                      <CustomText
                        label={replyingTo?.comment || "user"}
                        fontSize={12}
                        color={"rgba(255, 255, 255, 0.64)"}
                        numberOfLines={1}
                        style={{ maxWidth: 200 }}
                      />
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setReplyingTo(null)}>
                    <Icons
                      name="x"
                      family="Feather"
                      size={16}
                      color={"rgba(255, 255, 255, 0.64)"}
                    />
                  </TouchableOpacity>
                </View>
              </BlurView>
            )}
            <View>
              <View style={styles.inputRow}>
                <Image
                  source={Images.CommentEmojie}
                  style={{ height: 40, width: 40, marginRight: 8 }}
                />
                <View style={styles.commentInputContainer}>
                  <TextInput
                    ref={commentInputRef}
                    value={commentText}
                    style={styles.commentInput}
                    placeholder="Type message"
                    placeholderTextColor={"rgba(255, 255, 255, 0.48)"}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={500}
                    editable={!isSubmittingComment}
                    onFocus={handleOnFocus}
                  />
                  <Image
                    resizeMode="contain"
                    source={Images.commentGif}
                    style={{ height: 24, width: 24 }}
                  />
                  {selectedImageUrl ? (
                    <View style={{ position: "relative" }}>
                      <ImageFast source={{ uri: selectedImageUrl }} style={styles.previewImageInline} isView />
                      <TouchableOpacity onPress={handleRemoveImage} style={styles.removeImageBtnInline}>
                        <Icons name="x" family="Feather" size={10} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={handleImagePick} disabled={isUploadingImage}>
                      {isUploadingImage ? (
                        <ActivityIndicator size="small" color={COLORS.white} style={{ marginLeft: 8 }} />
                      ) : (
                        <Image
                          resizeMode="contain"
                          source={Images.commentCam}
                          style={{ height: 20, width: 20, marginLeft: 8 }}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleSendComment}
                  style={[
                    styles.commentSendBtn,
                    ((!commentText?.trim() && !selectedImageUrl) || isSubmittingComment) &&
                      styles.sendBtnDisabled,
                  ]}
                  disabled={
                    (!commentText?.trim() && !selectedImageUrl) || isSubmittingComment
                  }
                >
                  {isSubmittingComment ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Icons
                      name={"arrow-right"}
                      family={"Feather"}
                      size={18}
                      color={COLORS.white}
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.emojiStrip}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 4 }}
                >
                  {emojiData.map((emoji, index) => (
                    <TouchableOpacity
                      key={index.toString()}
                      style={{ padding: 6 }}
                      onPress={() => handleEmojiPress(emoji.char)}
                    >
                      <LottieView
                        source={{ uri: emoji.url }}
                        autoPlay
                        loop
                        style={{ width: 32, height: 32 }}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
      <UploadImageCustom
        imageModal={showImagePicker}
        setImageModal={setShowImagePicker}
        handleChange={handleImageSelected}
        handleCapture={handleImageSelected}
        onDelete={() => {}}
      />
      <ShareModal
        isVisible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        postImage={postData?.thumbnail}
        username={postData?.author?.username || "viktor.sola"}
        date={
          postData?.createdAt
            ? new Date(postData.createdAt).toLocaleDateString()
            : ""
        }
        postId={postData?._id}
        urlPrefix="psc://short/"
      />
    </ScreenWrapper>
  );
};

export default ShortWithId;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  videoContainer: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: COLORS.black,
    position: "relative",
  },
  videoTouchable: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 10,
  },
  playPauseContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  rowOnly: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  inPutContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999,
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 1,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  scrubberContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 10,
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    position: "relative",
    overflow: "visible",
  },
  scrubberProgress: {
    height: 4,
    backgroundColor: COLORS.white,
    borderRadius: 2,
    position: "absolute",
    left: 0,
    top: 0,
  },
  scrubberTouchArea: {
    position: "absolute",
    top: -20,
    left: 0,
    right: 0,
    bottom: -20,
  },
  scrubberThumb: {
    width: 0,
    height: 0,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    position: "absolute",
    top: "50%",
    marginTop: -6,
    marginLeft: -6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.black,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  closeIcon: {
    width: 30,
    height: 30,
    tintColor: COLORS.white,
  },
  sheetContentWrapper: {
    flex: 1,
    position: "relative",
    paddingBottom: 160,
  },
  commentInputWrapper: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingTop: 8,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  replyBlur: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
  },
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyIndicatorLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    paddingVertical: 0,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.buttonColor,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  previewImageInline: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginLeft: 4,
  },
  removeImageBtnInline: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: -6,
    right: -6,
  },
  emojiStrip: {
    marginTop: 10,
  },
});
