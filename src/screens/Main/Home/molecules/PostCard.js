import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import { getPalette } from "@somesoap/react-native-image-palette";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View} from "react-native";
import { createThumbnail } from "react-native-create-thumbnail";
import { ScrollView } from "react-native-gesture-handler";
import Video from "react-native-video";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import { FullScreenSvg, Tags } from "../../../../assets/svgs";
import Blur from "../../../../components/Blur";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import ProgressiveBlur from "../../../../components/ProgressiveBlur";
import { useTabBarVisibility } from "../../../../navigation/TabStack";
import { useTheme } from "../../../../contexts/ThemeContext";
import { del, post } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";
import CreatorSummary from "./CreatorSummary";
import EditModal from "./EditModal";
import RepostModal from "./RepostModal";
import ShareModal from "./ShareModal";
import SummaryMore from "./SummaryMore";
import ViewerModal from "./ViewerModal";
import VotingComponent from "./VotingComponent";
import Text from "../../../../components/ScaledText";

const PostCard = ({
  isChange,
  item,
  onCommentPress,
  isDetail,
  onSwipeRight,
  onSwipeLeft,
  onVoteUpdate,
  displayName = "Display Name",
  username = "username",
  description = "",
  images = [],
  hashtags = [],
  showFollowButton = true,
  onClickRepostedFrom,
  commentsCount = 0,
  repostsCount = 0,
  savedCount = 0,
  stats = {},
  timeAgo = "Just now",
  upvotes = [],
  isBack,
  downvotes = [],
  showHeader = true,
  isView = false,
  profileColor,

  formatCount = (count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  },
  onDeletePress,
  onHidePost,
  onHideUserPosts,
  shouldPlay = true,
}) => {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.users.userData);
  const { colors, themeMode } = useTheme();
  const styles = createStyles(colors, themeMode);

  // Safely get the pager scroll control — PostCard may render outside the PagerView context
  const tabBarCtx = useTabBarVisibility();
  const setPagerScrollEnabled = tabBarCtx?.setPagerScrollEnabled;

  const isOwner = item?.author?._id === userData?._id;

  // Animation values for swipe
  const translateX = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const swipeDecided = useRef(false);
  const lastDx = useRef(0);
  const mediaCarouselGestureActive = useRef(false);
  const SWIPE_LOCK_THRESHOLD = 4;

  const [bgColor, setBgColor] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showCreatorSummary, setShowCreatorSummary] = useState(false);
  const [showSummaryMore, setShowSummaryMore] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentDescIndex, setCurrentDescIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);

  // console.log("item?.author--",item?.author);

  const imageRefs = useRef([]);

  const [mutedVideos, setMutedVideos] = useState({});

  const [videoReady, setVideoReady] = useState({});
  const [bgVideoReady, setBgVideoReady] = useState({});
  const [generatedThumbnails, setGeneratedThumbnails] = useState({});

  const processedThumbnails = useRef(new Set());

  useEffect(() => {
    const generateThumbs = async () => {
      for (let i = 0; i < images.length; i++) {
        const uri = images[i];
        if (
          isVideoUrl(uri) &&
          !item.thumbnail &&
          !generatedThumbnails[i] &&
          !processedThumbnails.current.has(i)
        ) {
          processedThumbnails.current.add(i);
          try {
            const res = await createThumbnail({
              url: uri,
              timeStamp: 1000,
            });
            setGeneratedThumbnails((prev) => ({
              ...prev,
              [i]: res.path,
            }));
          } catch (error) {
            console.log("Error generating thumbnail for index", i, error);
            // Optionally remove from processed if we want to retry
            processedThumbnails.current.delete(i);
          }
        }
      }
    };

    if (images.length > 0) {
      generateThumbs();
    }
  }, [images, item.thumbnail]);

  const isFollowingUser = useMemo(() => {
    const authorId = item?.author?._id;
    if (!authorId) return false;

    // Use Redux as the primary source of truth for global sync across all cards
    // Once userData.stats.following is populated, we trust it exclusively
    if (userData?.stats?.following) {
      return userData.stats.following.includes(authorId);
    }

    // Fallback to static post metadata only if Redux data isn't loaded yet
    return item?.author?.stats?.followers?.includes(userData?._id) || false;
  }, [userData?.stats?.following, item?.author?._id, userData?._id]);

  const handleFollowPress = async () => {
    const userId = item?.author?._id;
    if (!userId || isOwner) return;

    const currentlyFollowing = isFollowingUser;
    try {
      setShowSummaryMore(false);

      const updatedFollowing = currentlyFollowing
        ? (userData?.stats?.following || []).filter((id) => id !== userId)
        : [...(userData?.stats?.following || []), userId];

      dispatch(
        setUserData({
          ...userData,
          stats: {
            ...userData.stats,
            following: updatedFollowing,
          },
        }),
      );

      const authorName = item?.author?.firstName || "User";
      if (currentlyFollowing) {
        const res = await del(`relationships/unfollow/${userId}`);
        console.log("follow----", res.data);

        ToastMessage(`Unfollowed ${authorName}`);
      } else {
        const res = await post(`relationships/follow/${userId}`);
        console.log("unfollow----", res.data);

        ToastMessage(`You are now following ${authorName}`, "success");
      }
    } catch (error) {
      console.log("Error following/unfollowing:", error);
      // Revert Redux on error
      dispatch(setUserData(userData));
    }
  };

  const handleCreatorSummaryMore = () => {
    setShowCreatorSummary(false);
    setTimeout(() => {
      setShowSummaryMore(true);
    }, 800);
  };

  const handleViewProfile = () => {
    setShowSummaryMore(false);
    navigation.navigate("UserProfile", { userId: item?.author?._id });
  };

  // Add state for video progress - track current time and duration by index
  const [videoProgress, setVideoProgress] = useState({});

  // Vote state management
  const [localUpvotes, setLocalUpvotes] = useState(upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(downvotes);
  const [isVoting, setIsVoting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [localSaves, setLocalSaves] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item?.saved && userData?._id) {
      const saved = item.saved.some(
        (savedItem) =>
          savedItem === userData._id ||
          savedItem.userId === userData._id ||
          savedItem._id === userData._id,
      );
      setIsSaved(saved);
    }
  }, [item?.saved, userData?._id]);

  useEffect(() => {
    setLocalSaves(savedCount);
  }, [savedCount]);

  // Update local state when props change
  useEffect(() => {
    setLocalUpvotes(upvotes);
    setLocalDownvotes(downvotes);
  }, [upvotes, downvotes]);

  // Check if current user has upvoted
  const hasUpvoted = useCallback(() => {
    return localUpvotes.some((vote) => vote.userId === userData?._id);
  }, [localUpvotes, userData]);

  // Check if current user has downvoted
  const hasDownvoted = useCallback(() => {
    return localDownvotes.some((vote) => vote.userId === userData?._id);
  }, [localDownvotes, userData]);

  // Handle upvote/downvote API call
  const handleVote = useCallback(
    async (reactionType) => {
      if (isVoting || !item?._id) return;

      setIsVoting(true);
      const isUpvote = reactionType === "upvote";
      const currentlyUpvoted = hasUpvoted();
      const currentlyDownvoted = hasDownvoted();

      // Optimistic UI update
      if (isUpvote) {
        if (currentlyUpvoted) {
          // Remove upvote
          setLocalUpvotes((prev) =>
            prev.filter((vote) => vote.userId !== userData?._id),
          );
        } else {
          setLocalUpvotes((prev) => [
            ...prev,
            { userId: userData?._id, reaction: "upvote" },
          ]);
          if (currentlyDownvoted) {
            setLocalDownvotes((prev) =>
              prev.filter((vote) => vote.userId !== userData?._id),
            );
          }
        }
      } else {
        if (currentlyDownvoted) {
          // Remove downvote
          setLocalDownvotes((prev) =>
            prev.filter((vote) => vote.userId !== userData?._id),
          );
        } else {
          // Add downvote and remove upvote if exists
          setLocalDownvotes((prev) => [
            ...prev,
            { userId: userData?._id, reaction: "downvote" },
          ]);
          if (currentlyUpvoted) {
            setLocalUpvotes((prev) =>
              prev.filter((vote) => vote.userId !== userData?._id),
            );
          }
        }
      }

      try {
        const response = await post(`posts/${item._id}/reaction`, {
          reaction: reactionType,
        });

        if (response?.data?.success) {
          // Refresh posts to get updated data
          if (onVoteUpdate) {
            onVoteUpdate();
          }
        } else {
          // Revert optimistic update on failure
          setLocalUpvotes(upvotes);
          setLocalDownvotes(downvotes);
          ToastMessage("Failed to update vote", "error");
        }
      } catch (error) {
        console.error("Error voting:", error);
        // Revert optimistic update on error
        setLocalUpvotes(upvotes);
        setLocalDownvotes(downvotes);
        ToastMessage("Failed to update vote", "error");
      } finally {
        setIsVoting(false);
      }
    },
    [
      isVoting,
      item,
      hasUpvoted,
      hasDownvoted,
      userData,
      upvotes,
      downvotes,
      onVoteUpdate,
    ],
  );

  const handleSaveToggle = async () => {
    if (isSaving || !item?._id) return;
    setIsSaving(true);
    const newSavedState = !isSaved;
    const newSaveCount = newSavedState ? localSaves + 1 : localSaves - 1;
    setIsSaved(newSavedState);
    setLocalSaves(newSaveCount);

    try {
      if (newSavedState) {
        await post("saved", { postId: item._id });
      } else {
        await del(`saved/${item._id}`);
      }
    } catch (error) {
      setIsSaved(!newSavedState);
      setLocalSaves(localSaves);
      ToastMessage("Failed to update save status", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Refs for video components
  const videoRefs = useRef([]);

  // Calculate image height based on aspect ratio
  const getImageHeight = () => {
    const sizeString = item?.size || "1:1 ratio";
    const aspectRatio = sizeString.replace(" ratio", "").trim();

    switch (aspectRatio) {
      case "16:9":
        return screenWidth * (9 / 16);
      case "4:3":
        return screenWidth * (3 / 4);
      case "1:1":
      default:
        return screenWidth;
    }
  };

  // Helper function to detect if URL is a video
  const isVideoUrl = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)(\?.*)?$/i);
  };

  // Helper function to format time in MM:SS format
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle video progress updates
  const handleVideoProgress = useCallback((index, data) => {
    setVideoProgress((prev) => ({
      ...prev,
      [index]: {
        currentTime: data.currentTime,
        duration: data.seekableDuration || data.playableDuration,
      },
    }));
  }, []);

  const renderFormattedText = (text) => {
    if (!text) return "";
    return text.split(/(\s+)/).map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <Text key={index} style={{ color: colors.text }}>
            {part?.substring(1)}
          </Text>
        );
      }
      return part;
    });
  };

  // Get dynamic border radius for each image based on scroll position
  const getBorderRadiusStyle = (index) => {
    const cardWidth = screenWidth - 24;
    const scrollProgress = scrollOffset / cardWidth;
    const currentIndex = Math.round(scrollProgress);
    const isScrolling = Math.abs(scrollProgress - currentIndex) > 0.01;

    if (!isScrolling) {
      // Fully snapped - all corners have radius
      return {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
      };
    }

    // During swipe
    if (index === Math.floor(scrollProgress)) {
      // Current/left image - remove right corners radius
      return {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 0,
      };
    } else if (index === Math.ceil(scrollProgress)) {
      // Next/right image - remove left corners radius
      return {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 16,
      };
    }

    // Default - full radius for images not involved in current swipe
    return {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    };
  };

  // Handle scroll and update current index
  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setScrollOffset(contentOffsetX);
    const index = Math.round(contentOffsetX / (screenWidth - 24));
    setCurrentImageIndex(index);
  };

  const handleDescScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (screenWidth - 24));
    setCurrentDescIndex(index);
  };

  // Toggle mute for current video
  const toggleMute = useCallback(() => {
    const currentUri = images[currentImageIndex];
    if (isVideoUrl(currentUri)) {
      setMutedVideos((prev) => ({
        ...prev,
        [currentImageIndex]: !prev[currentImageIndex],
      }));
    }
  }, [currentImageIndex, images]);

  // Get mute state for current video
  const isCurrentVideoMuted = () => {
    return mutedVideos[currentImageIndex] || false;
  };

  // Handle video press to open fullscreen
  const handleVideoPress = useCallback((index) => {
    const videoRef = videoRefs.current[index];
    if (videoRef) {
      videoRef.presentFullscreenPlayer();
    }
  }, []);

  const handleFullScreenPress = useCallback(() => {
    if (isVideoUrl(images[currentImageIndex])) {
      handleVideoPress(currentImageIndex);
    } else {
      const imageRef = imageRefs.current[currentImageIndex];
      if (imageRef) {
        imageRef.showModal();
      }
    }
  }, [images, currentImageIndex, handleVideoPress]);

  // Initialize video refs array
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, images.length);
  }, [images]);

  const completeHorizontalSwipe = useCallback(
    (dx) => {
      const threshold = screenWidth * 0.35;

      if (dx > threshold) {
        Animated.spring(translateX, {
          toValue: screenWidth,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start(() => {
          translateX.setValue(0);
          if (onSwipeRight) {
            onSwipeRight();
          } else if (onCommentPress) {
            onCommentPress();
          }
        });
      } else if (dx < -threshold) {
        Animated.spring(translateX, {
          toValue: -screenWidth,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start(() => {
          translateX.setValue(0);
          if (onSwipeLeft) {
            onSwipeLeft();
          } else {
            setShowShareModal(true);
          }
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      }
    },
    [screenWidth, translateX, onSwipeRight, onSwipeLeft, onCommentPress],
  );

  const resetSwipeFlags = useCallback(() => {
    isHorizontalSwipe.current = false;
    swipeDecided.current = false;
    lastDx.current = 0;
  }, []);

  const onMediaCarouselTouchStart = useCallback(() => {
    if (images.length <= 1) return;
    mediaCarouselGestureActive.current = true;
    translateX.stopAnimation();
    translateX.setValue(0);
  }, [images.length, translateX]);

  const onCardTouchStart = useCallback(
    (e) => {
      if (isDetail || mediaCarouselGestureActive.current) return;
      const { pageX, pageY } = e.nativeEvent;
      touchStartX.current = pageX;
      touchStartY.current = pageY;
      isHorizontalSwipe.current = false;
      swipeDecided.current = false;
      lastDx.current = 0;
      translateX.stopAnimation();
      translateX.setValue(0);
      setPagerScrollEnabled?.(false);
    },
    [isDetail, setPagerScrollEnabled, translateX],
  );

  const onCardTouchMove = useCallback(
    (e) => {
      if (isDetail || mediaCarouselGestureActive.current) return;
      const { pageX, pageY } = e.nativeEvent;
      const dx = pageX - touchStartX.current;
      const dy = pageY - touchStartY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      lastDx.current = dx;

      if (!swipeDecided.current) {
        if (absDx > SWIPE_LOCK_THRESHOLD || absDy > SWIPE_LOCK_THRESHOLD) {
          isHorizontalSwipe.current = absDx > absDy;
          swipeDecided.current = true;
          if (!isHorizontalSwipe.current) {
            translateX.setValue(0);
          }
        } else if (absDx > absDy) {
          // Follow finger immediately — no dead zone before direction locks
          translateX.setValue(dx);
          return;
        }
      }

      if (isHorizontalSwipe.current) {
        translateX.setValue(dx);
      }
    },
    [isDetail, translateX],
  );

  const onCardTouchEnd = useCallback(
    (e) => {
      if (isDetail) return;

      if (mediaCarouselGestureActive.current) {
        mediaCarouselGestureActive.current = false;
        setPagerScrollEnabled?.(true);
        resetSwipeFlags();
        return;
      }

      setPagerScrollEnabled?.(true);

      const { pageX, pageY } = e.nativeEvent;
      const dx = pageX - touchStartX.current;
      const dy = pageY - touchStartY.current;

      if (!isHorizontalSwipe.current) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
          // navigation.navigate("DetailPage", { item: item });
          // navigation.navigate("DetailPageWithId", { postId: item?._id });
        }
      } else {
        completeHorizontalSwipe(lastDx.current || dx);
      }

      resetSwipeFlags();
    },
    [
      isDetail,
      setPagerScrollEnabled,
      navigation,
      item?._id,
      completeHorizontalSwipe,
      resetSwipeFlags,
    ],
  );

  const onCardTouchCancel = useCallback(() => {
    if (isDetail) return;

    if (mediaCarouselGestureActive.current) {
      mediaCarouselGestureActive.current = false;
      setPagerScrollEnabled?.(true);
      resetSwipeFlags();
      return;
    }

    setPagerScrollEnabled?.(true);
    if (isHorizontalSwipe.current) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
    resetSwipeFlags();
  }, [isDetail, setPagerScrollEnabled, translateX, resetSwipeFlags]);

  useEffect(() => {
    const uri = images.length > 0 ? images[0] : Images.person;
    if (!uri) return;
    getPalette(uri)
      .then((palette) => {
        if (palette?.vibrant) setBgColor(palette.vibrant);
      })
      .catch(() => {});
  }, [images]);

  const isCurrentMediaVideo =
    images[currentImageIndex] && isVideoUrl(images[currentImageIndex]);

  return (
    <View>
      {/* Fixed Swipe indicators - placed outside the animated container */}
      <Animated.View
        style={[
          styles.swipeLeftIndicator,
          {
            opacity: translateX.interpolate({
              inputRange: [0, screenWidth * 0.1],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
            transform: [
              {
                scale: translateX.interpolate({
                  inputRange: [0, screenWidth * 0.1],
                  outputRange: [0.5, 1],
                  extrapolate: "clamp",
                }),
              },
              {
                translateX: translateX.interpolate({
                  inputRange: [0, screenWidth / 1],
                  outputRange: [0, screenWidth / 2 - 100],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.swipeIndicatorContent}>
          <Image source={Images.thoughts} style={styles.swipeIcon} />
          <CustomText
            label="Share Your Thoughts"
            color={COLORS.white}
            fontSize={12}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.swipeRightIndicator,
          {
            opacity: translateX.interpolate({
              inputRange: [-screenWidth * 0.1, 0],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
            transform: [
              {
                scale: translateX.interpolate({
                  inputRange: [-screenWidth * 0.1, 0],
                  outputRange: [1, 0.5],
                  extrapolate: "clamp",
                }),
              },
              {
                translateX: translateX.interpolate({
                  inputRange: [-screenWidth / 1, 0],
                  outputRange: [-(screenWidth / 2 - 100), 0],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.swipeIndicatorContent}>
          <Image
            source={Images.globeShare || Images.message}
            style={styles.swipeIcon}
          />
          <CustomText
            label="Share It With Others"
            color={COLORS.white}
            fontSize={12}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.mainContainer,
          {
            backgroundColor: colors.background,
            transform: [{ translateX }],
          },
        ]}
        onTouchStart={!isDetail ? onCardTouchStart : undefined}
        onTouchMove={!isDetail ? onCardTouchMove : undefined}
        onTouchEnd={!isDetail ? onCardTouchEnd : undefined}
        onTouchCancel={!isDetail ? onCardTouchCancel : undefined}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("DetailPage", {
              item: item,
            })
          }
        >
          <View>
            {showHeader && (
              <View style={styles.rowBetween}>
                {/* Left Section */}
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.6}
                  onPress={() => setShowCreatorSummary(true)}
                >
                  <View
                    style={{
                      padding: 4,
                      borderColor: profileColor,
                      borderWidth: 2,
                      borderRadius: 99,
                    }}
                  >
                    {item?.author?.profile?.avatar ? (
                      <ImageFast
                        source={{ uri: item.author.profile.avatar }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatar,
                          {
                            backgroundColor:
                              item?.author?.profile?.profileColor,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <CustomText label={displayName} />
                      {item?.author?.role == "individual" && (
                        <ImageFast
                          source={Images.verified}
                          style={styles.verifiedIcon}
                        />
                      )}
                      {item?.author?.role == "company" && (
                        <ImageFast
                          source={Images.grayStar}
                          style={styles.verifiedIcon}
                        />
                      )}
                    </View>
                    <CustomText
                      label={`${username}`}
                      color={colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {/* Right Section */}
                <View
                  style={[
                    styles.row,
                    {
                      width: showFollowButton && "28%",
                      justifyContent: showFollowButton && "flex-end",
                    },
                  ]}
                >
                  {showFollowButton && !isOwner && (
                    <CustomButton
                      title={isFollowingUser ? "Following" : "Follow"}
                      width={isFollowingUser ? "80%" : "64%"}
                      onPress={handleFollowPress}
                      height={32}
                      borderRadius={8}
                      fontSize={14}
                      backgroundColor={colors.surfaceAlt}
                      color={colors.text}
                    />
                  )}
                  {/* {!showFollowButton && ( */}
                  <TouchableOpacity onPress={() => setShowModal(true)}>
                    <Image
                      source={Images.moreIcon}
                      style={[styles.moreIcon, { tintColor: colors.text }]}
                    />
                  </TouchableOpacity>
                  {/* )} */}
                </View>
              </View>
            )}

            {/* reposted from */}
            {item?.parentPostId && (
              <View style={[styles.row, { gap: 4, marginTop: 4 }]}>
                <Image
                  source={Images.arrowNext}
                  style={{
                    height: 20,
                    width: 20,
                    tintColor: colors.textSecondary,
                  }}
                />
                <CustomText
                  label="Reposted from"
                  color={colors.textSecondary}
                  fontSize={12}
                />
                <TouchableOpacity
                  onPress={() =>
                    onClickRepostedFrom ||
                    navigation.navigate("UserProfile", {
                      userId: item?.parentPost?.author?._id,
                    })
                  }
                  style={[styles.row, { paddingHorizontal: 0 }]}
                >
                  <Image
                    source={
                      item?.parentPost?.author?.profile?.avatar
                        ? { uri: item?.parentPost?.author?.profile?.avatar }
                        : item?.parentPost?.author?.avatar && {
                            uri: item?.parentPost?.author?.avatar,
                          }
                    }
                    style={{
                      height: 16,
                      width: 16,
                      borderRadius: 99,
                      backgroundColor:
                        !item?.parentPost?.author?.profile?.avatar &&
                        !item?.parentPost?.author?.avatar &&
                        item?.parentPost?.author?.profile?.profileColor,
                    }}
                  />
                  <CustomText
                    label={item?.parentPost?.author?.firstName}
                    fontFamily={fonts.medium}
                    marginLeft={4}
                  />
                </TouchableOpacity>
              </View>
            )}
            <View
              style={[
                styles.wrapper,
                {
                  marginTop: 10,
                },
              ]}
            >
              {item?.hashtags?.map((item, index) => (
                <View
                  style={[styles.tagBg, { backgroundColor: colors.surfaceAlt }]}
                  key={index}
                >
                  <Tags width={12} height={12} color={colors.textSecondary} />
                  <CustomText
                    label={`${item}`}
                    fontSize={12}
                    color={colors.textSecondary}
                    fontFamily={fonts.medium}
                    marginLeft={2}
                  />
                </View>
              ))}
            </View>

            {/* Glow Background */}

            <View style={styles.investmentCard}>
              <CustomText
                label={"LOOKING FOR INVESTMENT"}
                fontSize={10}
                fontFamily={fonts.semiBold}
                color={"rgba(255, 255, 255, 0.64)"}
              />
            </View>

            {isChange ? (
              <>
                <CustomText
                  label={"Who was the most influential individual in 2025?"}
                  marginTop={8}
                  color={colors.textSecondary}
                  marginBottom={10}
                />
                <VotingComponent />
              </>
            ) : (
              <>
                {description ? (
                  <>
                    {Array.isArray(description) && description.length > 1 ? (
                      <View style={{ paddingHorizontal: 12 }}>
                        <ScrollView
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          onScroll={handleDescScroll}
                          scrollEventThrottle={16}
                          style={{ width: screenWidth - 24 }}
                        >
                          {description?.map((desc, index) => (
                            <View
                              key={index}
                              style={{ width: screenWidth - 24 }}
                            >
                              <CustomText
                                marginTop={8}
                                color={colors.text}
                                marginBottom={6}
                                numberOfLines={!isDetail && 2}
                              >
                                <Text
                                  onTextLayout={(e) => {
                                    if (
                                      !isDetail &&
                                      index === 0 &&
                                      !isTruncated &&
                                      e.nativeEvent.lines.length > 2
                                    ) {
                                      setIsTruncated(true);
                                    }
                                  }}
                                >
                                  {renderFormattedText(desc)}
                                </Text>
                              </CustomText>
                            </View>
                          ))}
                        </ScrollView>

                        <View
                          style={[
                            styles.row,
                            {
                              justifyContent: "space-between",
                              marginBottom: 20,
                              paddingHorizontal: 0,
                            },
                          ]}
                        >
                          {!isDetail && isTruncated ? (
                            <CustomText
                              color={COLORS.buttonColor}
                              label={"Read full post..."}
                              fontFamily={fonts.medium}
                              onPress={() =>
                                navigation.navigate("DetailPage", {
                                  item: item,
                                })
                              }
                            />
                          ) : (
                            <View />
                          )}
                          {description.length > 1 && (
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 75,
                                backgroundColor: colors.surfaceAlt,
                              }}
                            >
                              <CustomText
                                label={`${currentDescIndex + 1}/${
                                  description.length
                                }`}
                                fontFamily={fonts.medium}
                                fontSize={10}
                                color={colors.textSecondary}
                              />
                            </View>
                          )}
                        </View>
                      </View>
                    ) : (
                      <View style={{ paddingHorizontal: 12 }}>
                        <CustomText
                          marginTop={8}
                          color={colors.text}
                          marginBottom={6}
                          numberOfLines={!isDetail && 2}
                        >
                          <Text
                            onTextLayout={(e) => {
                              if (
                                !isDetail &&
                                !isTruncated &&
                                e.nativeEvent.lines.length > 2
                              ) {
                                setIsTruncated(true);
                              }
                            }}
                          >
                            {renderFormattedText(
                              typeof description === "string"
                                ? description
                                : Array.isArray(description) && description[0]
                                ? description[0]
                                : "",
                            )}
                          </Text>
                        </CustomText>
                        <View
                          style={[
                            styles.row,
                            {
                              justifyContent: "space-between",
                              marginBottom: 20,
                              paddingHorizontal: 0,
                            },
                          ]}
                        >
                          {!isDetail && isTruncated ? (
                            <CustomText
                              color={COLORS.buttonColor}
                              label={"Read full post..."}
                              fontFamily={fonts.medium}
                              onPress={() =>
                                navigation.navigate("DetailPage", {
                                  item: item,
                                })
                              }
                            />
                          ) : (
                            <View />
                          )}
                        </View>
                      </View>
                    )}
                  </>
                ) : null}
                <View
                  style={{
                    // paddingVertical: 8,
                    alignItems: "center",
                  }}
                  onTouchStart={
                    images.length > 1 ? onMediaCarouselTouchStart : undefined
                  }
                >
                  {/* Swipeable Media Carousel */}
                  {images.length > 0 && images[0] ? (
                    <>
                      {images[currentImageIndex] && (
                        <View
                          style={[
                            styles.glowShadowContainer,
                            {
                              height: getImageHeight(),
                              width: screenWidth - 24,
                              shadowColor: bgColor || "#FFFFFF",
                            },
                          ]}
                        >
                          <View style={styles.ambientWrapper}>
                            {isCurrentMediaVideo ? (
                              <View
                                style={{
                                  height: getImageHeight(),
                                  width: screenWidth - 24,
                                }}
                              >
                                <Video
                                  repeat
                                  source={{ uri: images[currentImageIndex] }}
                                  style={{
                                    height: getImageHeight(),
                                    width: screenWidth - 24,
                                    borderRadius: 16,
                                  }}
                                  resizeMode="cover"
                                  muted
                                  onReadyForDisplay={() =>
                                    setBgVideoReady((prev) => ({
                                      ...prev,
                                      [currentImageIndex]: true,
                                    }))
                                  }
                                />
                                {!bgVideoReady[currentImageIndex] && (
                                  <ImageFast
                                    source={{
                                      uri:
                                        item.thumbnail ||
                                        generatedThumbnails[
                                          currentImageIndex
                                        ] ||
                                        images[currentImageIndex],
                                    }}
                                    style={[
                                      StyleSheet.absoluteFill,
                                      {
                                        height: getImageHeight(),
                                        width: screenWidth - 24,
                                        borderRadius: 16,
                                      },
                                    ]}
                                    resizeMode="cover"
                                  />
                                )}
                              </View>
                            ) : (
                              <ImageFast
                                source={{ uri: images[currentImageIndex] }}
                                style={{
                                  height: getImageHeight(),
                                  width: screenWidth - 24,
                                  borderRadius: 16,
                                }}
                              />
                            )}
                            <BlurView
                              style={StyleSheet.absoluteFill}
                              blurType="dark"
                              blurAmount={10}
                            />
                          </View>
                        </View>
                      )}
                      <View
                        style={[
                          styles.glowBg,
                          {
                            top: item?.size === "16:9 ratio" ? "41%" : "32%",
                            height: item?.size === "16:9 ratio" ? "32%" : "45%",
                          },
                        ]}
                      />
                      <ScrollView
                        scrollEnabled={images.length > 1}
                        ref={scrollViewRef}
                        horizontal
                        pagingEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        decelerationRate="fast"
                        snapToInterval={screenWidth - 24}
                        snapToAlignment="center"
                        disableIntervalMomentum={true}
                        onTouchStart={
                          images.length > 1
                            ? onMediaCarouselTouchStart
                            : undefined
                        }
                        style={[styles.scrollView, { width: screenWidth - 24 }]}
                      >
                        {images.map((imageUri, index) => (
                          <View
                            key={index}
                            style={{
                              width: screenWidth - 24,
                              height: getImageHeight(),
                            }}
                          >
                            {isVideoUrl(imageUri) ? (
                              <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() =>
                                  navigation.navigate("DetailPage", {
                                    item: item,
                                  })
                                }
                              >
                                <Video
                                  ref={(ref) =>
                                    (videoRefs.current[index] = ref)
                                  }
                                  repeat
                                  source={{ uri: imageUri }}
                                  style={[
                                    {
                                      height: getImageHeight(),
                                      width: screenWidth - 24,
                                      backgroundColor: "rgba(0, 0, 0, 0.2)",
                                    },
                                    getBorderRadiusStyle(index),
                                  ]}
                                  resizeMode="cover"
                                  paused={
                                    !shouldPlay || index !== currentImageIndex
                                  }
                                  muted={mutedVideos[index] || false}
                                  controls={false}
                                  ignoreSilentSwitch="obey"
                                  playInBackground={false}
                                  playWhenInactive={false}
                                  onProgress={(data) =>
                                    handleVideoProgress(index, data)
                                  }
                                  onReadyForDisplay={() =>
                                    setVideoReady((prev) => ({
                                      ...prev,
                                      [index]: true,
                                    }))
                                  }
                                  poster={item.thumbnail}
                                  posterResizeMode="cover"
                                />
                                {!videoReady[index] && (
                                  <View
                                    style={[
                                      StyleSheet.absoluteFill,
                                      getBorderRadiusStyle(index),
                                      {
                                        backgroundColor:
                                          themeMode === "dark"
                                            ? COLORS.black
                                            : "rgba(18, 18, 18, 0.04)",
                                      },
                                    ]}
                                  >
                                    <ImageFast
                                      source={{
                                        uri:
                                          item.thumbnail ||
                                          generatedThumbnails[index] ||
                                          imageUri,
                                      }}
                                      style={[
                                        {
                                          height: getImageHeight(),
                                          width: screenWidth - 24,
                                        },
                                        getBorderRadiusStyle(index),
                                      ]}
                                      resizeMode="cover"
                                    />
                                    <View
                                      style={[
                                        styles.videoOverlay,
                                        { backgroundColor: "transparent" },
                                      ]}
                                    >
                                      <ActivityIndicator
                                        size="small"
                                        color={COLORS.white}
                                      />
                                    </View>
                                  </View>
                                )}
                                <View style={styles.videoOverlay}>
                                  <Image
                                    source={Images.playIcon}
                                    style={styles.playIcon}
                                  />
                                </View>
                              </TouchableOpacity>
                            ) : (
                              <ImageFast
                                ref={(ref) => (imageRefs.current[index] = ref)}
                                isView={isDetail}
                                source={{ uri: imageUri }}
                                style={[
                                  {
                                    height: getImageHeight(),
                                    width: screenWidth - 24,
                                  },
                                  getBorderRadiusStyle(index),
                                ]}
                              />
                            )}

                            <View
                              style={[
                                styles.topBlurContainer,
                                {
                                  width: "100%",
                                },
                              ]}
                              pointerEvents="none"
                            >
                              <ProgressiveBlur
                                intensity={80}
                                direction="top"
                                tint="light"
                                height={60}
                                imageUri={imageUri}
                                style={{
                                  borderTopLeftRadius:
                                    getBorderRadiusStyle(index)
                                      .borderTopLeftRadius,
                                  borderTopRightRadius:
                                    getBorderRadiusStyle(index)
                                      .borderTopRightRadius,
                                  borderBottomLeftRadius: 0,
                                  borderBottomRightRadius: 0,
                                }}
                              />
                            </View>

                            <View
                              style={[
                                styles.bottomBlurContainer,
                                {
                                  width: "100%",
                                },
                              ]}
                              pointerEvents="none"
                            >
                              <ProgressiveBlur
                                intensity={80}
                                direction="bottom"
                                tint="light"
                                height={60}
                                imageUri={imageUri}
                                style={{
                                  borderBottomLeftRadius:
                                    getBorderRadiusStyle(index)
                                      .borderBottomLeftRadius,
                                  borderBottomRightRadius:
                                    getBorderRadiusStyle(index)
                                      .borderBottomRightRadius,
                                  borderTopLeftRadius: 0,
                                  borderTopRightRadius: 0,
                                }}
                              />
                            </View>
                          </View>
                        ))}
                      </ScrollView>

                      {/* Overlay Elements */}
                      {isCurrentMediaVideo && hashtags?.length > 0 && (
                        <View style={styles.cardBg}>
                          <Blur />
                          <CustomText
                            label={`#${hashtags[0]}`}
                            fontSize={12}
                            color={colors.textSecondary}
                            fontFamily={fonts.medium}
                          />
                        </View>
                      )}

                      <View
                        style={[
                          styles.rowBetween,
                          {
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: 8,
                          },
                        ]}
                      >
                        {/* Mute/Unmute Button - Only show for videos */}
                        {isCurrentMediaVideo ? (
                          <View>
                            <TouchableOpacity
                              onPress={toggleMute}
                              style={{
                                paddingHorizontal: 10,
                                height: 32,
                                width: 36,
                                justifyContent: "center",
                                alignItems: "center",
                                marginHorizontal: 10,
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                borderRadius: 99,
                                overflow: "hidden",
                                marginBottom: 4,
                              }}
                            >
                              <Blur />
                              <Icons
                                name={
                                  isCurrentVideoMuted()
                                    ? "volume-up"
                                    : "volume-off"
                                }
                                family={"MaterialIcons"}
                                size={16}
                                color={COLORS.white}
                              />
                            </TouchableOpacity>
                            {isDetail && (
                              <View
                                style={[
                                  styles.row,
                                  { marginTop: 6, marginBottom: 6 },
                                ]}
                              >
                                {item?.stats?.views > 0 && (
                                  <ImageFast
                                    source={Images.person}
                                    style={styles.person}
                                  />
                                )}
                                <CustomText
                                  label={`${item?.stats?.views} viewers`}
                                  marginLeft={8}
                                  fontFamily={fonts.medium}
                                  onPress={() => setShowViewerModal(true)}
                                />
                              </View>
                            )}
                          </View>
                        ) : isDetail ? (
                          <View
                            style={[
                              styles.row,
                              { marginTop: 6, marginBottom: 6, marginLeft: 4 },
                            ]}
                          >
                            <ImageFast
                              source={Images.person}
                              style={styles.person}
                            />
                            <CustomText
                              label={`${item?.stats?.views} viewers`}
                              marginLeft={8}
                              fontFamily={fonts.medium}
                              onPress={() => setShowViewerModal(true)}
                            />
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.repostButton,
                              { overflow: "hidden" },
                            ]}
                          >
                            <Blur />
                            <Image
                              source={Images.friend}
                              style={{ height: 16, width: 16 }}
                            />
                          </TouchableOpacity>
                        )}

                        {isCurrentMediaVideo ? (
                          <View
                            style={{ alignItems: "flex-end", paddingRight: 12 }}
                          >
                            <View
                              style={{
                                paddingHorizontal: 10,
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                borderRadius: 99,
                                paddingVertical: 6,
                                overflow: "hidden",
                                marginBottom: 4,
                              }}
                            >
                              <Blur />
                              <CustomText
                                label={
                                  videoProgress[currentImageIndex]
                                    ? formatTime(
                                        videoProgress[currentImageIndex]
                                          .currentTime,
                                      )
                                    : "0:00"
                                }
                                fontFamily={fonts.medium}
                                fontSize={12}
                              />
                            </View>
                            <TouchableOpacity onPress={handleFullScreenPress}>
                              {isDetail && <FullScreenSvg />}
                            </TouchableOpacity>
                          </View>
                        ) : isDetail ? (
                          <TouchableOpacity onPress={handleFullScreenPress}>
                            <FullScreenSvg marginRight={12} />
                          </TouchableOpacity>
                        ) : item?.parentPostId ? (
                          <TouchableOpacity
                            style={[
                              styles.repostButton,
                              { overflow: "hidden" },
                            ]}
                            onPress={() => setShowRepostModal(true)}
                          >
                            <Blur />
                            <Image
                              source={Images.repostWhite}
                              style={{
                                height: 12,
                                width: 12,
                                tintColor: colors.text,
                              }}
                            />
                          </TouchableOpacity>
                        ) : (
                          <View />
                        )}
                      </View>
                    </>
                  ) : (
                    <View
                      style={{
                        height: getImageHeight(),
                        width: screenWidth - 24,
                        backgroundColor: profileColor || COLORS.inputBg,
                        borderRadius: 16,
                      }}
                    />
                  )}

                  {/* Dynamic Pagination Indicators */}
                </View>
                {images?.length > 1 && (
                  <View style={styles.rowSwipper}>
                    {images?.map((img, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          index === currentImageIndex
                            ? [
                                styles.activeIndicator,
                                { backgroundColor: bgColor },
                              ]
                            : styles.inactiveIndicator,
                          index === currentImageIndex && styles.activeWidth,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
            <View
              style={[
                styles.rowButtons,
                {
                  marginTop: images?.length > 1 ? 0 : 8,
                  paddingHorizontal: 12,
                },
              ]}
            >
              {/* Upvote Button */}
              <TouchableOpacity
                onPress={() =>
                  !item?.privacy?.upvote
                    ? ToastMessage(
                        "User has disabled upvoting on this post",
                        "error",
                      )
                    : handleVote("upvote")
                }
                onStartShouldSetResponder={() => true}
                disabled={isVoting}
                style={[
                  styles.rowbtn,
                  { backgroundColor: colors.surfaceAlt },
                  hasUpvoted() && {
                    backgroundColor:
                      themeMode === "dark" ? COLORS.white : COLORS.black,
                  },
                ]}
              >
                <Image
                  source={Images.arrowUp}
                  style={{
                    height: 20,
                    width: 20,
                    tintColor: hasUpvoted()
                      ? themeMode === "dark"
                        ? COLORS.black
                        : COLORS.white
                      : colors.text,
                  }}
                />

                <CustomText
                  label={formatCount(localUpvotes.length)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  marginRight={4}
                  color={
                    hasUpvoted()
                      ? themeMode === "dark"
                        ? COLORS.black
                        : COLORS.white
                      : colors.text
                  }
                />
              </TouchableOpacity>

              {/* Downvote Button */}
              <TouchableOpacity
                onPress={() =>
                  !item?.privacy?.upvote
                    ? ToastMessage(
                        "User has disabled downvoting on this post",
                        "error",
                      )
                    : handleVote("downvote")
                }
                onStartShouldSetResponder={() => true}
                disabled={isVoting}
                style={[
                  styles.rowbtn,
                  { backgroundColor: colors.surfaceAlt },
                  hasDownvoted() && {
                    backgroundColor:
                      themeMode === "dark" ? COLORS.white : COLORS.black,
                  },
                ]}
              >
                <CustomText
                  label={formatCount(localDownvotes.length)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  color={
                    hasDownvoted()
                      ? themeMode === "dark"
                        ? COLORS.black
                        : COLORS.white
                      : colors.text
                  }
                  marginLeft={4}
                />
                <Image
                  source={Images.arrowDown}
                  style={{
                    height: 20,
                    width: 20,
                    tintColor: hasDownvoted()
                      ? themeMode === "dark"
                        ? COLORS.black
                        : COLORS.white
                      : colors.text,
                  }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  item?.privacy?.comment == false
                    ? () =>
                        ToastMessage(
                          "User has disabled comment on this post",
                          "error",
                        )
                    : onCommentPress
                }
                onStartShouldSetResponder={() => true}
                style={[styles.rowbtn, { backgroundColor: colors.surfaceAlt }]}
              >
                <Image
                  source={Images.chat}
                  style={{
                    height: 16,
                    width: 16,
                    marginLeft: 3,
                    tintColor: colors.text,
                  }}
                />
                <CustomText
                  label={formatCount(commentsCount)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  marginRight={4}
                  color={colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  item?.privacy?.share == false
                    ? ToastMessage(
                        "User has disabled share on this post",
                        "error",
                      )
                    : setShowShareModal(true)
                }
                onStartShouldSetResponder={() => true}
                style={[styles.rowbtn, { backgroundColor: colors.surfaceAlt }]}
              >
                <Image
                  source={Images.arrowUpRight}
                  style={{ height: 16, width: 16, tintColor: colors.text }}
                />
                <CustomText
                  label={formatCount(stats?.shares || 0)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  marginRight={4}
                  color={colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rowbtn, { backgroundColor: colors.surfaceAlt }]}
                onPress={() =>
                  item?.privacy?.repost == false
                    ? ToastMessage(
                        "User has disabled repost on this post",
                        "error",
                      )
                    : setShowRepostModal(true)
                }
                onStartShouldSetResponder={() => true}
              >
                <Image
                  source={Images.repost}
                  style={{
                    height: 16,
                    width: 16,
                    marginLeft: 4,
                    tintColor: colors.text,
                  }}
                />
                <CustomText
                  label={formatCount(repostsCount)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  marginRight={4}
                  color={colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  item?.privacy?.save == false
                    ? ToastMessage(
                        "User has disabled save on this post",
                        "error",
                      )
                    : handleSaveToggle()
                }
                onStartShouldSetResponder={() => true}
                disabled={isSaving}
                style={[
                  styles.rowbtn,
                  { backgroundColor: colors.surfaceAlt },
                  isSaved && {
                    backgroundColor:
                      themeMode === "dark" ? COLORS.white : COLORS.black,
                  },
                ]}
              >
                <Image
                  source={Images.savePlus}
                  style={{
                    height: 13,
                    width: 13,
                    marginLeft: 4,
                    tintColor: isSaved
                      ? themeMode === "dark"
                        ? COLORS.black
                        : COLORS.white
                      : colors.text,
                  }}
                />
                <CustomText
                  label={formatCount(localSaves)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  marginRight={4}
                  color={
                    isSaved
                      ? themeMode === "dark"
                        ? COLORS.black
                        : COLORS.white
                      : colors.text
                  }
                />
              </TouchableOpacity>
            </View>
            {upvotes?.length > 0 && item?.friendLikes?.length > 0 && (
              <View style={[styles.row, { gap: 4, marginTop: 4 }]}>
                {userData?.profile?.avatar ? (
                  <ImageFast
                    source={{ uri: userData?.profile?.avatar }}
                    style={{ height: 16, width: 16, borderRadius: 99 }}
                  />
                ) : (
                  <View
                    style={{
                      height: 16,
                      width: 16,
                      borderRadius: 99,
                      backgroundColor: userData?.profile?.profileColor,
                    }}
                  />
                )}
                <CustomText
                  label={`${item?.friendLikes[0]?.firstName}`}
                  fontFamily={fonts.medium}
                />
                <CustomText
                  label={"reacted to this post"}
                  fontFamily={fonts.regular}
                  color={colors.textSecondary}
                />
              </View>
            )}

            {item?.topComment?.author?.firstName && (
              <View
                style={[
                  styles.row,
                  { justifyContent: "space-between", marginTop: 6 },
                ]}
              >
                <View style={[styles.row, { gap: 4, paddingHorizontal: 0 }]}>
                  <CustomText
                    label={item?.topComment?.author?.firstName}
                    fontFamily={fonts.medium}
                  />
                  <View
                    style={{
                      height: 4,
                      width: 4,
                      borderRadius: 99,
                      backgroundColor: colors.surfaceAlt,
                    }}
                  />
                  <CustomText
                    label={"With the most liked comment"}
                    fontFamily={fonts.regular}
                    color={colors.textSecondary}
                  />
                </View>
                <ImageFast
                  source={Images.heart}
                  tintColor={colors.textSecondary}
                  style={{
                    height: 16,
                    width: 16,
                    tintColor: colors.textSecondary,
                  }}
                />
              </View>
            )}
            {commentsCount > 0 && (
              <CustomText
                label={`View all ${formatCount(commentsCount)} comments`}
                color={colors.textSecondary}
                fontFamily={fonts.regular}
                marginBottom={4}
                marginTop={6}
                marginLeft={12}
              />
            )}
            <CustomText
              label={timeAgo}
              color={colors.textSecondary}
              fontSize={12}
              marginLeft={12}
              marginTop={commentsCount > 0 ? 0 : 6}
              fontFamily={fonts.regular}
            />
          </View>
        </TouchableOpacity>

        <EditModal
          isVisible={showModal}
          onClose={() => setShowModal(false)}
          displayName={displayName}
          username={username}
          postCaption={description}
          isOwner={isOwner}
          user={item?.author}
          onEditPress={() => {
            setShowModal(false);
            setTimeout(() => {
              navigation.navigate("CreatePost", {
                editMode: true,
                postData: item,
              });
            }, 700);
          }}
          onReschedulePress={() => {
            setShowModal(false);
            setTimeout(() => {
              navigation.navigate("CreatePost", {
                editMode: true,
                postData: item,
              });
            }, 700);
          }}
          onDeletePress={() => {
            setShowModal(false);
            onDeletePress && onDeletePress();
          }}
          onHidePost={onHidePost}
          onHideUserPosts={onHideUserPosts}
        />
        <CreatorSummary
          isVisible={showCreatorSummary}
          onClose={() => setShowCreatorSummary(false)}
          onMore={handleCreatorSummaryMore}
          user={item?.author}
        />
        <SummaryMore
          isVisible={showSummaryMore}
          onClose={() => setShowSummaryMore(false)}
          onViewProfile={handleViewProfile}
          userId={item?.author?._id}
          isFollowing={isFollowingUser}
          onSendMessage={() => {
            setShowSummaryMore(false);
            setTimeout(() => {
              navigation.navigate("InboxScreen", {
                recipientId: item?.author?._id,
                recipientName: `${item?.author?.firstName} ${item?.author?.lastName}`,
                otherUser: item?.author,
              });
            }, 700);
          }}
          onRemoveFriend={handleFollowPress}
          onReportPost={() => {
            console.log("Report post from summary");
            setShowSummaryMore(false);
          }}
        />
        <ShareModal
          isVisible={showShareModal}
          onClose={() => setShowShareModal(false)}
          postImage={images[0] || Images.person}
          username={username}
          date={timeAgo}
          onShareToStory={async () => {
            const isVideo = (url) => {
              return /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)(\?.*)?$/i.test(url);
            };
            try {
              const url = images[0] || "";
              const mediaType = isVideo(url) ? "video" : "image";

              await Promise.all([
                post(`posts/${item?._id}/repost`, {
                  type: "share",
                }),
                post("stories", {
                  media: {
                    url: url,
                    type: mediaType,
                  },
                  status: "active",
                  postId: item?._id,
                }),
              ]);

              setShowShareModal(false);
              ToastMessage("Post share to story successfully", "success");
            } catch (error) {
              console.log("Error sharing to story:", error);
              ToastMessage("Failed to share to story", "error");
            }
          }}
          postId={item?._id}
        />
        <RepostModal
          isVisible={showRepostModal}
          onClose={() => setShowRepostModal(false)}
          postImage={images[0] || Images.person}
          username={username}
          date={timeAgo}
          onRepost={() => console.log("Repost")}
          onRespond={() => console.log("Respond")}
          onUseMedia={() => console.log("Use Media")}
          item={item}
        />

        {/* Viewer Modal */}
        <ViewerModal
          isVisible={showViewerModal}
          onDisable={() => setShowViewerModal(false)}
          viewersCount={item?.stats?.views || 0}
          postId={item?._id}
        />
      </Animated.View>
    </View>
  );
};

export default PostCard;

const createStyles = (colors, themeMode) =>
  StyleSheet.create({
    mainContainer: {
      paddingVertical: 4,

      // paddingHorizontal: 12,
      backgroundColor: colors.background,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
    },
    rowbtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        themeMode === "dark" ? "#FFFFFF0A" : "rgba(18, 18, 18, 0.04)",
      paddingRight: 6,
      paddingLeft: 4,
      paddingVertical: 4,
      borderRadius: 4,
      width: "15.5%",
      height: 28,
      justifyContent: "space-between",
    },
    rowBetween: {
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      justifyContent: "space-between",
    },
    avatar: {
      height: 32,
      width: 32,
      borderRadius: 99,
    },
    userInfo: {
      marginLeft: 8,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    verifiedIcon: {
      height: 14,
      width: 14,
      marginLeft: 4,
    },
    moreIcon: {
      height: 32,
      width: 32,
      marginLeft: 8,
    },
    wrapper: {
      gap: 4,
      flexWrap: "wrap",
      flexDirection: "row",
      paddingHorizontal: 12,
      alignItems: "center",
    },
    cardBg: {
      backgroundColor:
        themeMode === "dark"
          ? "rgba(18, 18, 18, 0.44)"
          : "rgba(255, 255, 255, 0.44)",
      paddingLeft: 6,
      paddingRight: 7.5,
      borderRadius: 99,
      position: "absolute",
      overflow: "hidden",
      top: 16,
      height: 24,
      left: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    rowSwipper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginVertical: 8,
      alignSelf: "center",
    },
    rowButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 4,
    },
    indicator: {
      height: 6,
      borderRadius: 99,
    },
    activeWidth: {
      width: 30,
    },
    activeIndicator: {
      width: 30,
    },
    inactiveIndicator: {
      width: 6,
      backgroundColor:
        themeMode === "dark" ? "#A1937529" : "rgba(18, 18, 18, 0.16)",
    },
    glowBg: {
      position: "absolute",
      left: 12,
      right: 12,
      borderRadius: 12,
      opacity: 0.8,
      shadowOpacity: 0.9,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 0 },
      elevation: 50,
    },
    scrollView: {
      borderRadius: 16,
    },
    glowShadowContainer: {
      position: "absolute",
      borderRadius: 16,
      shadowOpacity: 0.5,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 20,
    },

    ambientWrapper: {
      width: "100%",
      height: "100%",
      borderRadius: 16,
      overflow: "hidden",
    },
    videoOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.1)",
      borderRadius: 16,
    },
    playIcon: {
      width: 50,
      height: 50,
      tintColor: "rgba(255,255,255,0.8)",
    },
    modalContent: {
      backgroundColor: colors.cardColor,
      borderRadius: 12,
      width: "90%",
      alignSelf: "center",
      overflow: "hidden",
    },
    modalButton: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: "center",
    },
    modalDivider: {
      height: 1,
      backgroundColor:
        themeMode === "dark"
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(18, 18, 18, 0.1)",
    },
    swipeRightIndicator: {
      position: "absolute",
      right: 10,
      top: "50%",
      transform: [{ translateY: -25 }],
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      zIndex: -10,
    },
    swipeLeftIndicator: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: [{ translateY: -25 }],
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      zIndex: -10,
    },
    swipeIndicatorContent: {
      alignItems: "center",
    },
    swipeIcon: {
      height: 80,
      width: 80,
      tintColor: COLORS.white,
    },
    investmentCard: {
      alignSelf: "flex-start",
      paddingHorizontal: 6,
      justifyContent: "center",
      borderRadius: 4,
      backgroundColor: "rgba(55, 184, 116, 0.48)",
      marginTop: 8,
      height: 20,
      marginHorizontal: 12,
    },
    backButton: {
      borderRadius: 99,
      backgroundColor:
        themeMode === "dark" ? COLORS.inputBg : "rgba(18, 18, 18, 0.04)",
      height: 40,
      width: 40,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    repostButton: {
      height: 32,
      width: 32,
      borderRadius: 99,
      alignItems: "center",
      justifyContent: "center",
      // marginBottom: 10,
      marginHorizontal: 12,
    },
    tagWrapper: {
      gap: 4,
      flexWrap: "wrap",
      flexDirection: "row",
      alignItems: "center",
    },

    tagBg: {
      backgroundColor:
        themeMode === "dark" ? COLORS.inputBg : "rgba(18, 18, 18, 0.04)",
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 99,
      paddingLeft: 8,
      paddingRight: 10,
      height: 24,
    },
    person: {
      height: 16,
      width: 16,
      borderRadius: 99,
    },
    topBlurContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      overflow: "hidden",
      zIndex: 1,
    },
    bottomBlurContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      overflow: "hidden",
      zIndex: 1,
    },
  });
