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
import { FullScreenSvg } from "../../../../assets/svgs";
import Blur from "../../../../components/Blur";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import ProgressiveBlur from "../../../../components/ProgressiveBlur";
import { useTabBarVisibility } from "../../../../navigation/TabStack";
import { useTheme } from "../../../../contexts/ThemeContext";
import { del, get, post } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";
import CreatorSummary from "./CreatorSummary";
import EditModal from "./EditModal";
import RepostModal from "./RepostModal";
import ShareModal from "./ShareModal";
import SummaryMore from "./SummaryMore";
import ViewerModal from "./ViewerModal";
import TaggedSheet from "./TaggedSheet";
import {
  measureImageBands,
  registerNavMedia,
  unregisterNavMedia,
} from "../../../../utils/navTone";
import VotingComponent from "./VotingComponent";
import Text from "../../../../components/ScaledText";
import {
  activeSubtitleText,
  buildSubtitleLines,
  captionWords,
} from "../../../../utils/subtitles";

// Figma action bar — upvoted state
const UPVOTE_GREEN = "#37B874";

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
  const [showTagged, setShowTagged] = useState(false);
  const taggedSponsors = Array.isArray(item?.sponsors) ? item.sponsors : [];
  // "In collaboration with" on Publish A Post is saved as `mentions`; the feed
  // API returns them populated as `mentionBy`.
  const taggedCollaborators = Array.isArray(item?.mentionBy)
    ? item.mentionBy
    : [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentDescIndex, setCurrentDescIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);

  // console.log("item?.author--",item?.author);

  const imageRefs = useRef([]);

  const [mutedVideos, setMutedVideos] = useState({});

  const [videoReady, setVideoReady] = useState({});
  const [bgVideoReady, setBgVideoReady] = useState({});

  // Live captions — same flow as Viral's ShortCard: while this post's video
  // is the one playing and it has no captions yet, poll the backend every
  // 2s (which also bumps the Whisper job to the front of the queue) and
  // show the captions the moment the job finishes.
  const [liveCaptions, setLiveCaptions] = useState(null);
  const postHasVideo =
    !!item?.video ||
    (Array.isArray(item?.images) &&
      item.images.some((u) =>
        /\.(mp4|mov|avi|mkv|webm|m4v)(\?.*)?$/i.test(String(u || "")),
      ));
  const postHasCaptions =
    (Array.isArray(item?.subtitles) && item.subtitles.length > 0) ||
    !!String(item?.subtitlesText || "").trim();
  useEffect(() => {
    const postId = item?._id;
    if (!postId || !shouldPlay || !postHasVideo || postHasCaptions) return;
    if (item?.subtitlesStatus === "empty") return;
    if (liveCaptions) return;

    let cancelled = false;
    let attempts = 0;
    let timer = null;
    const poll = async () => {
      attempts += 1;
      try {
        const res = await get(`posts/${postId}/subtitles`);
        const data = res?.data?.data;
        if (cancelled || !data) return;
        const ready =
          (Array.isArray(data.subtitles) && data.subtitles.length > 0) ||
          !!String(data.subtitlesText || "").trim();
        if (ready) {
          setLiveCaptions(data);
          clearInterval(timer);
        } else if (data.subtitlesStatus === "empty") {
          clearInterval(timer);
        }
      } catch (e) {
        /* job may still be running — keep waiting */
      }
      if (attempts >= 360) clearInterval(timer);
    };
    poll();
    timer = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?._id, shouldPlay, postHasVideo, postHasCaptions, liveCaptions]);
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
    // Figma: media 367×489 @ 375 frame → width = screen - 8, default 3:4 portrait
    const mediaWidth = screenWidth - 8;
    const sizeString = item?.size || "3:4 ratio";
    const aspectRatio = sizeString.replace(" ratio", "").trim();

    switch (aspectRatio) {
      case "16:9":
        return mediaWidth * (9 / 16);
      case "4:3":
        return mediaWidth * (3 / 4);
      case "3:4":
        return mediaWidth * (4 / 3);
      case "1:1":
        return mediaWidth;
      default:
        return mediaWidth * (4 / 3);
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
          <Text
            key={index}
            style={{ color: colors.text, fontFamily: fonts.semiBold }}
          >
            {part?.substring(1)}
          </Text>
        );
      }
      return part;
    });
  };

  // Get dynamic border radius for each image based on scroll position
  const getBorderRadiusStyle = (index) => {
    const cardWidth = screenWidth - 8;
    const scrollProgress = scrollOffset / cardWidth;
    const currentIndex = Math.round(scrollProgress);
    const isScrolling = Math.abs(scrollProgress - currentIndex) > 0.01;

    if (!isScrolling) {
      // Fully snapped - all corners have radius
      return {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
      };
    }

    // During swipe
    if (index === Math.floor(scrollProgress)) {
      // Current/left image - remove right corners radius
      return {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 0,
      };
    } else if (index === Math.ceil(scrollProgress)) {
      // Next/right image - remove left corners radius
      return {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 8,
      };
    }

    // Default - full radius for images not involved in current swipe
    return {
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    };
  };

  // Handle scroll and update current index
  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setScrollOffset(contentOffsetX);
    const index = Math.round(contentOffsetX / (screenWidth - 8));
    setCurrentImageIndex(index);
  };

  const handleDescScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (screenWidth - 16));
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

  // Adaptive tab bar: report this post's media + its brightness bands so the
  // bottom nav icons can flip dark/light while it scrolls behind the bar.
  const mediaWrapRef = useRef(null);
  const navMediaKey = useRef(
    `post-${item?._id || Math.random().toString(36).slice(2)}`,
  ).current;
  const toneUri = isCurrentMediaVideo
    ? item?.thumbnail || generatedThumbnails[currentImageIndex] || null
    : images[currentImageIndex] || null;
  useEffect(() => {
    let alive = true;
    if (!toneUri || isDetail) return undefined;
    measureImageBands(toneUri).then((bands) => {
      if (alive && bands && mediaWrapRef.current) {
        registerNavMedia(navMediaKey, mediaWrapRef.current, bands);
      }
    });
    return () => {
      alive = false;
    };
  }, [toneUri, isDetail, navMediaKey]);
  useEffect(() => () => unregisterNavMedia(navMediaKey), [navMediaKey]);

  // Auto-generated subtitles pill (Figma). Words + timings come from the
  // backend Whisper job (same data as Viral: { word, startMs, endMs }); the
  // pill shows the phrase being spoken at the current playback position.
  const captionVideoIndex = useMemo(() => {
    if (item?.video) {
      const i = images.indexOf(item.video);
      if (i >= 0) return i;
    }
    return images.findIndex((u) => isVideoUrl(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, item?.video]);
  const captionDurationMs =
    (videoProgress[captionVideoIndex]?.duration || 0) * 1000;
  const subtitleLines = useMemo(
    () =>
      buildSubtitleLines(
        captionWords(liveCaptions || item, captionDurationMs),
      ),
    // duration only matters for the plain-text fallback; round it so the
    // lines aren't rebuilt on every progress tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveCaptions, item?.subtitles, item?.subtitlesText, Math.round(captionDurationMs / 1000)],
  );
  const captionedVideoIndex = subtitleLines.length ? captionVideoIndex : -1;
  const captionForIndex =
    currentImageIndex === captionedVideoIndex
      ? activeSubtitleText(
          subtitleLines,
          (videoProgress[currentImageIndex]?.currentTime || 0) * 1000,
        )
      : null;

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
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="chat_bubble"
            size={67}
            color={COLORS.gray64}
          />
          <View style={[styles.row, { gap: 4, paddingHorizontal: 0 }]}>
            <CustomText
              label="Share Your Thought"
              color={COLORS.gray64}
              fontSize={16}
              fontFamily={fonts.medium}
            />
            <Icons
              family="MaterialSymbolsRounded"
              name="north_east"
              size={16}
              color={COLORS.gray64}
            />
          </View>
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
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="share"
            size={67}
            color={COLORS.gray64}
          />
          <View style={[styles.row, { gap: 4, paddingHorizontal: 0 }]}>
            <CustomText
              label="Share It With Others"
              color={COLORS.gray64}
              fontSize={16}
              fontFamily={fonts.medium}
            />
            <Icons
              family="MaterialSymbolsRounded"
              name="north_east"
              size={16}
              color={COLORS.gray64}
            />
          </View>
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
              <View style={[styles.rowBetween, { paddingHorizontal: 8 }]}>
                {/* Left Section */}
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.6}
                  onPress={() => setShowCreatorSummary(true)}
                >
                  <View
                    style={{
                      padding: 2,
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
                      <CustomText
                        label={displayName}
                        fontSize={14}
                        lineHeight={18}
                        letterSpacing={-0.07}
                        fontFamily={fonts.medium}
                      />
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
                      fontSize={12}
                      lineHeight={16}
                      color={COLORS.gray48}
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
                      width={isFollowingUser ? 92 : 64}
                      onPress={handleFollowPress}
                      height={28}
                      borderRadius={8}
                      fontSize={14}
                      fontFamily={fonts.medium}
                      backgroundColor={
                        isFollowingUser ? colors.surfaceAlt : COLORS.white
                      }
                      color={isFollowingUser ? colors.text : "#121212"}
                    />
                  )}
                  {/* {!showFollowButton && ( */}
                  <TouchableOpacity
                    onPress={() => setShowModal(true)}
                    style={[
                      styles.moreButton,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Icons
                      family="MaterialSymbolsRounded"
                      name="more_vert"
                      size={20}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                  {/* )} */}
                </View>
              </View>
            )}

            {/* reposted from */}
            {item?.parentPostId && (
              <View style={[styles.row, { gap: 4, marginTop: 6 }]}>
                <Icons
                  family="MaterialSymbolsRounded"
                  name="subdirectory_arrow_right"
                  size={18}
                  color={colors.text}
                />
                <CustomText
                  label={
                    item?.repostType === "share" || item?.type === "share"
                      ? "Original post from"
                      : "Reposted from"
                  }
                  color={COLORS.gray48}
                  fontSize={13}
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
                    fontSize={13}
                    fontFamily={fonts.semiBold}
                    marginLeft={4}
                  />
                </TouchableOpacity>
              </View>
            )}
            {/* Figma: "in Partnership with ✋ Brand" (sponsoredBy) */}
            {Array.isArray(item?.sponsors) && item.sponsors[0] && (
              <View style={[styles.row, { gap: 4, marginTop: 6 }]}>
                <Icons
                  family="MaterialSymbolsRounded"
                  name="handshake"
                  size={18}
                  color={COLORS.gray48}
                />
                <CustomText
                  label="in Partnership with"
                  color={COLORS.gray48}
                  fontSize={13}
                />
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("UserProfile", {
                      userId: item.sponsors[0]?._id,
                    })
                  }
                  style={[styles.row, { paddingHorizontal: 0 }]}
                >
                  {item.sponsors[0]?.profile?.avatar ? (
                    <ImageFast
                      source={{ uri: item.sponsors[0].profile.avatar }}
                      style={{ height: 16, width: 16, borderRadius: 99 }}
                    />
                  ) : null}
                  <CustomText
                    label={
                      item.sponsors[0]?.firstName ||
                      item.sponsors[0]?.username ||
                      "Partner"
                    }
                    fontSize={13}
                    fontFamily={fonts.semiBold}
                    marginLeft={4}
                  />
                </TouchableOpacity>
              </View>
            )}
            <View
              style={[
                styles.wrapper,
                {
                  marginTop: 8,
                },
              ]}
            >
              {item?.hashtags?.map((item, index) => (
                <View
                  style={[styles.tagBg, { backgroundColor: colors.surfaceAlt }]}
                  key={index}
                >
                  <Icons
                    family="MaterialSymbolsRounded"
                    name="tag"
                    size={16}
                    color={COLORS.gray64}
                  />
                  <CustomText
                    label={`${item}`}
                    fontSize={12}
                    lineHeight={16}
                    color={COLORS.gray64}
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
                lineHeight={14}
                fontFamily={fonts.semiBold}
                color={COLORS.white}
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
                      <View style={{ paddingHorizontal: 8 }}>
                        <ScrollView
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          onScroll={handleDescScroll}
                          scrollEventThrottle={16}
                          style={{ width: screenWidth - 16 }}
                        >
                          {description?.map((desc, index) => (
                            <View
                              key={index}
                              style={{ width: screenWidth - 16 }}
                            >
                              <CustomText
                                marginTop={8}
                                fontSize={14}
                                lineHeight={18}
                                letterSpacing={-0.14}
                                color={COLORS.gray64}
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
                              marginBottom: 12,
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
                      <View style={{ paddingHorizontal: 8 }}>
                        <CustomText
                          marginTop={8}
                          fontSize={14}
                          lineHeight={18}
                          letterSpacing={-0.14}
                          color={COLORS.gray64}
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
                              marginBottom: 12,
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
                {!isDetail && item?.topic ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("SearchScreen")}
                    style={[
                      styles.findPostsRow,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Icons
                      family="MaterialSymbolsRounded"
                      name="tag"
                      size={16}
                      color={colors.text}
                    />
                    <View style={styles.findPostsTextWrap}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          lineHeight: 16,
                          fontFamily: fonts.medium,
                          color: colors.text,
                        }}
                      >
                        {item.topic}
                        <Text
                          style={{
                            fontFamily: fonts.regular,
                            color: COLORS.gray48,
                          }}
                        >
                          {"  find other posts about it."}
                        </Text>
                      </Text>
                    </View>
                    <Icons
                      family="MaterialSymbolsRounded"
                      name="chevron_right"
                      size={18}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                ) : null}
                <View
                  ref={mediaWrapRef}
                  collapsable={false}
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
                              width: screenWidth - 8,
                              shadowColor: bgColor || "#FFFFFF",
                            },
                          ]}
                        >
                          <View style={styles.ambientWrapper}>
                            {isCurrentMediaVideo ? (
                              <View
                                style={{
                                  height: getImageHeight(),
                                  width: screenWidth - 8,
                                }}
                              >
                                <Video
                                  repeat
                                  source={{ uri: images[currentImageIndex] }}
                                  style={{
                                    height: getImageHeight(),
                                    width: screenWidth - 8,
                                    borderRadius: 8,
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
                                        width: screenWidth - 8,
                                        borderRadius: 8,
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
                                  width: screenWidth - 8,
                                  borderRadius: 8,
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
                      <ScrollView
                        scrollEnabled={images.length > 1}
                        ref={scrollViewRef}
                        horizontal
                        pagingEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        decelerationRate="fast"
                        snapToInterval={screenWidth - 8}
                        snapToAlignment="center"
                        disableIntervalMomentum={true}
                        onTouchStart={
                          images.length > 1
                            ? onMediaCarouselTouchStart
                            : undefined
                        }
                        style={[styles.scrollView, { width: screenWidth - 8 }]}
                      >
                        {images.map((imageUri, index) => (
                          <View
                            key={index}
                            style={{
                              width: screenWidth - 8,
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
                                      width: screenWidth - 8,
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
                                          width: screenWidth - 8,
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
                                    width: screenWidth - 8,
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
                                height={48}
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
                            minHeight: 48,
                            paddingHorizontal: 8,
                            paddingVertical: 8,
                            alignItems: "center",
                          },
                        ]}
                      >
                        {/* Mute/Unmute Button - Only show for videos */}
                        {isCurrentMediaVideo ? (
                          <View>
                            <TouchableOpacity
                              onPress={toggleMute}
                              style={{
                                height: 32,
                                width: 36,
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                borderRadius: 100,
                                overflow: "hidden",
                              }}
                            >
                              <Blur />
                              <Icons
                                name={
                                  isCurrentVideoMuted()
                                    ? "volume_up"
                                    : "volume_off"
                                }
                                family={"MaterialSymbolsRoundedFilled"}
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
                        ) : taggedSponsors.length || taggedCollaborators.length ? (
                          <TouchableOpacity
                            style={[
                              styles.repostButton,
                              { overflow: "hidden" },
                            ]}
                            onPress={() => setShowTagged(true)}
                          >
                            <Blur />
                            <Icons
                              family="MaterialSymbolsRoundedFilled"
                              name="group"
                              size={16}
                              color={COLORS.white}
                            />
                          </TouchableOpacity>
                        ) : (
                          <View />
                        )}

                        {isCurrentMediaVideo && captionForIndex ? (
                          <View
                            style={[
                              styles.subtitlePill,
                              images?.length > 1 && {
                                transform: [{ translateY: -20 }],
                              },
                            ]}
                          >
                            <Blur />
                            <Icons
                              family="MaterialSymbolsRoundedFilled"
                              name="record_voice_over"
                              size={12}
                              color={COLORS.white}
                            />
                            <CustomText
                              label={captionForIndex}
                              fontSize={12}
                              lineHeight={16}
                              fontFamily={fonts.medium}
                              color={COLORS.white}
                              numberOfLines={1}
                              marginLeft={4}
                            />
                          </View>
                        ) : null}

                        {isCurrentMediaVideo ? (
                          <View style={{ alignItems: "flex-end" }}>
                            <View
                              style={{
                                height: 24,
                                paddingHorizontal: 10,
                                backgroundColor: "rgba(255, 255, 255, 0.04)",
                                borderRadius: 100,
                                justifyContent: "center",
                                overflow: "hidden",
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
                                lineHeight={16}
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
                            <Icons
                              family="MaterialSymbolsRounded"
                              name="repeat"
                              size={16}
                              color={colors.text}
                            />
                          </TouchableOpacity>
                        ) : (
                          <View />
                        )}
                      </View>

                      {images?.length > 1 && (
                        <View pointerEvents="none" style={styles.dotsOverlay}>
                          {images?.map((img, index) => (
                            <View
                              key={index}
                              style={[
                                styles.dot,
                                index === currentImageIndex && styles.dotActive,
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <View
                      style={{
                        height: getImageHeight(),
                        width: screenWidth - 8,
                        backgroundColor: profileColor || COLORS.inputBg,
                        borderRadius: 8,
                      }}
                    />
                  )}

                  {/* Dynamic Pagination Indicators */}
                </View>
                {null}
              </>
            )}
            <View
              style={[
                styles.rowButtons,
                {
                  marginTop: 4,
                  paddingHorizontal: 8,
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
                  styles.rowbtnSpread,
                  { backgroundColor: colors.surfaceAlt },
                  hasUpvoted() && {
                    backgroundColor: "rgba(55, 184, 116, 0.16)",
                  },
                ]}
              >
                <Icons
                  family="MaterialSymbolsRounded"
                  name="arrow_upward"
                  size={16}
                  color={hasUpvoted() ? UPVOTE_GREEN : colors.text}
                />
                <CustomText
                  label={formatCount(localUpvotes.length)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  lineHeight={16}
                  color={hasUpvoted() ? UPVOTE_GREEN : colors.text}
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
                  styles.rowbtnSpread,
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
                  lineHeight={16}
                  color={
                    hasDownvoted()
                      ? themeMode === "dark"
                        ? COLORS.black
                        : COLORS.white
                      : colors.text
                  }
                />
                <Icons
                  family="MaterialSymbolsRounded"
                  name="arrow_downward"
                  size={16}
                  color={
                    hasDownvoted()
                      ? themeMode === "dark"
                        ? COLORS.black
                        : COLORS.white
                      : colors.text
                  }
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
                style={[
                  styles.rowbtn,
                  styles.rowbtnSpread,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Icons
                  family="MaterialSymbolsRounded"
                  name="chat_bubble"
                  size={16}
                  color={colors.text}
                />
                <CustomText
                  label={formatCount(commentsCount)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  lineHeight={16}
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
                style={[
                  styles.rowbtn,
                  styles.rowbtnSpread,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Icons
                  family="MaterialSymbolsRounded"
                  name="north_east"
                  size={16}
                  color={colors.text}
                />
                <CustomText
                  label={formatCount(stats?.shares || 0)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  lineHeight={16}
                  color={colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rowbtn,
                  styles.rowbtnSpread,
                  { backgroundColor: colors.surfaceAlt },
                ]}
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
                <Icons
                  family="MaterialSymbolsRounded"
                  name="sync_alt"
                  size={16}
                  color={colors.text}
                />
                <CustomText
                  label={formatCount(repostsCount)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  lineHeight={16}
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
                  styles.rowbtnSpread,
                  { backgroundColor: colors.surfaceAlt },
                  isSaved && {
                    backgroundColor:
                      themeMode === "dark" ? COLORS.white : COLORS.black,
                  },
                ]}
              >
                <Icons
                  family="MaterialSymbolsRounded"
                  name="bookmark_add"
                  size={16}
                  color={
                    isSaved
                      ? themeMode === "dark"
                        ? COLORS.black
                        : COLORS.white
                      : colors.text
                  }
                />
                <CustomText
                  label={formatCount(localSaves)}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  lineHeight={16}
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
                {item?.friendLikes[0]?.profile?.avatar ||
                userData?.profile?.avatar ? (
                  <ImageFast
                    source={{
                      uri:
                        item?.friendLikes[0]?.profile?.avatar ||
                        userData?.profile?.avatar,
                    }}
                    style={{ height: 16, width: 16, borderRadius: 99 }}
                  />
                ) : (
                  <View
                    style={{
                      height: 16,
                      width: 16,
                      borderRadius: 99,
                      backgroundColor:
                        item?.friendLikes[0]?.profile?.profileColor ||
                        userData?.profile?.profileColor,
                    }}
                  />
                )}
                <CustomText
                  label={`${item?.friendLikes[0]?.firstName}${
                    item?.friendLikes?.length > 1
                      ? ` & ${item.friendLikes.length - 1} friend${
                          item.friendLikes.length - 1 > 1 ? "s" : ""
                        }`
                      : ""
                  }`}
                  fontSize={12}
                  lineHeight={16}
                  letterSpacing={-0.06}
                  fontFamily={fonts.medium}
                />
                <CustomText
                  label={"reacted to this post"}
                  fontSize={12}
                  lineHeight={16}
                  letterSpacing={-0.06}
                  fontFamily={fonts.regular}
                  color={COLORS.gray48}
                />
              </View>
            )}

            {item?.topComment?.author?.firstName && (
              <View
                style={[
                  styles.row,
                  { justifyContent: "space-between", marginTop: 4 },
                ]}
              >
                <View style={[styles.row, { gap: 4, paddingHorizontal: 0 }]}>
                  <CustomText
                    label={item?.topComment?.author?.firstName}
                    fontSize={12}
                    lineHeight={16}
                    letterSpacing={-0.12}
                    fontFamily={fonts.medium}
                  />
                  <View
                    style={{
                      height: 4,
                      width: 4,
                      borderRadius: 99,
                      backgroundColor: "rgba(255, 255, 255, 0.16)",
                    }}
                  />
                  <CustomText
                    label={"With the most liked comment"}
                    fontSize={12}
                    lineHeight={16}
                    letterSpacing={-0.12}
                    fontFamily={fonts.regular}
                    color={colors.text}
                  />
                </View>
                <View style={[styles.row, { gap: 4, paddingHorizontal: 0 }]}>
                  <Icons
                    family="MaterialSymbolsRoundedFilled"
                    name="group"
                    size={16}
                    color={COLORS.gray48}
                  />
                  <CustomText
                    label={formatCount(
                      item?.topComment?.stats?.likes ||
                        item?.topComment?.likes?.length ||
                        0,
                    )}
                    fontSize={12}
                    lineHeight={16}
                    fontFamily={fonts.medium}
                  />
                  <Icons
                    family="MaterialSymbolsRounded"
                    name="arrow_upward"
                    size={14}
                    color={colors.text}
                  />
                </View>
              </View>
            )}
            {commentsCount > 0 && (
              <CustomText
                label={`View all ${formatCount(commentsCount)} comments`}
                fontSize={12}
                lineHeight={16}
                letterSpacing={-0.06}
                color={COLORS.gray48}
                fontFamily={fonts.regular}
                marginBottom={4}
                marginTop={4}
                marginLeft={8}
              />
            )}
            <CustomText
              label={timeAgo}
              color={COLORS.gray48}
              fontSize={10}
              lineHeight={14}
              letterSpacing={-0.05}
              marginLeft={8}
              marginTop={commentsCount > 0 ? 0 : 4}
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

        <TaggedSheet
          visible={showTagged}
          onDismiss={() => setShowTagged(false)}
          sponsors={taggedSponsors}
          collaborators={taggedCollaborators}
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
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: colors.background,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
    },
    // Figma action pill: 56.5 fill × 28, r4, pad 6/2/4/2, gap 2, left-aligned
    rowbtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 2,
      backgroundColor:
        themeMode === "dark" ? "#FFFFFF0A" : "rgba(18, 18, 18, 0.04)",
      paddingLeft: 6,
      paddingRight: 4,
      paddingVertical: 2,
      borderRadius: 4,
      height: 28,
      flex: 1,
      minWidth: 0,
    },
    // Action pills: icon and count spread apart, inset from the pill edges
    rowbtnSpread: {
      justifyContent: "space-between",
      paddingLeft: 10,
      paddingRight: 10,
    },
    rowBetween: {
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      justifyContent: "space-between",
    },
    avatar: {
      height: 40,
      width: 40,
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
      height: 16,
      width: 16,
      marginLeft: 4,
    },
    moreButton: {
      height: 32,
      width: 32,
      borderRadius: 99,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    wrapper: {
      gap: 4,
      flexWrap: "wrap",
      flexDirection: "row",
      paddingHorizontal: 8,
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
      gap: 4,
      paddingVertical: 0,
    },
    dotsOverlay: {
      position: "absolute",
      bottom: 20,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      zIndex: 2,
    },
    dot: {
      height: 5,
      width: 5,
      borderRadius: 99,
      backgroundColor: "rgba(255, 255, 255, 0.48)",
    },
    dotActive: {
      width: 24,
      height: 5,
      backgroundColor: COLORS.white,
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
      borderRadius: 8,
    },
    // Blurred media backdrop only — no coloured shadow (Figma has none)
    glowShadowContainer: {
      position: "absolute",
      borderRadius: 8,
      shadowOpacity: 0,
      elevation: 0,
    },

    ambientWrapper: {
      width: "100%",
      height: "100%",
      borderRadius: 8,
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
      borderRadius: 8,
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
      marginHorizontal: 8,
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
      paddingLeft: 6,
      paddingRight: 8,
      height: 28,
    },
    person: {
      height: 16,
      width: 16,
      borderRadius: 99,
    },
    findPostsRow: {
      flexDirection: "row",
      alignItems: "center",
      height: 32,
      borderRadius: 100,
      paddingLeft: 8,
      paddingRight: 10,
      marginHorizontal: 8,
      marginBottom: 12,
      gap: 4,
    },
    findPostsTextWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    subtitlePill: {
      flex: 1,
      maxWidth: 250,
      height: 24,
      borderRadius: 100,
      backgroundColor: "rgba(18, 18, 18, 0.8)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      marginHorizontal: 8,
      overflow: "hidden",
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
