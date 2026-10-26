import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import moment from "moment/moment";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Animated,
  DeviceEventEmitter,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useSocket } from "../../../components/SocketProvider";
import UpdateUserLocation from "../../../components/UpdateUserLocation";
import { useTabBarVisibility } from "../../../navigation/TabStack";
import { del, get, post } from "../../../services/ApiRequest";
import { selectStoryUploadStatus } from "../../../store/reducer/appSlice";
import { setLocation } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import { getProfile } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import useLocation from "../../../utils/useLocation";
import FeedComposerRow from "./molecules/FeedComposerRow";
import { evaluateNavTone } from "../../../utils/navTone";
import {
  FEED_HEADER_COLLAPSE,
  feedHeaderHeight,
} from "./molecules/FeedHeader";
import MomentCard from "./molecules/MomentCard";
import NewPostsPill from "./molecules/NewPostsPill";
import FeedPostItem from "./molecules/FeedPostItem";
import PostCard from "./molecules/PostCard";
import PostCardSkeleton from "./molecules/PostCardSkeleton";
import RadioCard from "./molecules/RadioCard";
import ReelCard from "./molecules/ReelCard";
import TendingTopic from "./molecules/TendingTopic";
import TrendingIndividual from "./molecules/TrendingIndividual";
import QuestionModal from "../../../components/QuestionModal";
import GiftModal from "../../../components/GiftModal";

const TAB_NAMES = [
  "Technology",
  "Politics",
  "Sports",
  "Music",
  "Fashion",
  "Entertainment",
  "Gaming",
  "Food",
  "Health",
];

const areTopicListsEqual = (current = [], next = []) => {
  if (current.length !== next.length) return false;
  return current.every(
    (item, index) =>
      item?._id === next[index]?._id &&
      item?.tag === next[index]?.tag &&
      item?.topic === next[index]?.topic,
  );
};


const Home = ({
  route,
  pagerProgress,
  onSetPage,
  isFocusedPage,
  sharedTab,
  sharedTabNames,
  feedFilters,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { socket } = useSocket();
  const { colors } = useTheme();
  const isFocus = useIsFocused();
  const activeFocus = isFocusedPage !== undefined ? isFocusedPage : isFocus;
  const [viewablePostId, setViewablePostId] = useState(null);
  const tab = sharedTab;
  const [posts, setPosts] = useState([]);
  const [unfollowedPosts, setUnfollowedPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [storiesData, setStoriesData] = useState([]);
  const [myStoriesData, setMyStoriesData] = useState([]);
  const [radioData, setRadioData] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [selectedTrendingTopic, setSelectedTrendingTopic] = useState(null);
  const { getCurrentLocation } = useLocation();
  const getLocation = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      dispatch(setLocation(location));
    }
  }, [dispatch, getCurrentLocation]);

  const [error, setError] = useState(null);
  const storyUploadStatus = useSelector(selectStoryUploadStatus);
  const feedLocation = useSelector((state) => state.users.location);

  const [feedType, setFeedType] = useState(route?.params?.feedType || "social");
  const scrollY = useRef(new Animated.Value(0)).current;
  const { setIsTabBarVisible, setFeedRowVisible, feedRowAnim } =
    useTabBarVisibility();
  const lastContentOffset = useRef(0);
  const scrollRef = useRef(null);
  const hasFeedContentRef = useRef(false);
  const isFirstLoadRef = useRef(true);
  const viewedPostIdsRef = useRef(new Set());

  const tabBarVisibleRef = useRef(true);

  useEffect(() => {
    getLocation();
    const listener = scrollY.addListener(({ value }) => {
      // adaptive tab bar: re-check the media under the bar (once per frame)
      evaluateNavTone();
      if (value < 0) return;

      const currentOffset = value;
      const diff = currentOffset - lastContentOffset.current;

      if (Math.abs(diff) < 20) return;

      const shouldShow = diff < 0 || currentOffset <= 0;

      // ✅ Only update if visibility ACTUALLY changed
      if (tabBarVisibleRef.current !== shouldShow) {
        tabBarVisibleRef.current = shouldShow;
        setIsTabBarVisible(shouldShow);
      }

      // Pinterest-style: Feed/Shorts row collapses on scroll down
      setFeedRowVisible?.(shouldShow);

      lastContentOffset.current = currentOffset;
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [getLocation, scrollY, setIsTabBarVisible, setFeedRowVisible]);

  useFocusEffect(
    useCallback(() => {
      // When screen comes into focus, always show bottom tab
      tabBarVisibleRef.current = true;
      setIsTabBarVisible(true);
      setFeedRowVisible?.(true);

      // Reset last offset so scroll logic doesn’t instantly hide it
      lastContentOffset.current = 0;
    }, [setIsTabBarVisible, setFeedRowVisible]),
  );

  useEffect(() => {
    const type = route?.params?.feedType || "social";
    if (type !== feedType) {
      setSkeletonLoading(true); // Show skeleton instantly
      setPosts([]); // Clear old posts instantly
      setUnfollowedPosts([]);
      setFeedType(type);
    }
  }, [route?.params?.feedType]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e) => {
      if (!isFocus) return;

      const currentOffset = lastContentOffset.current || 0;

      // Check if we are scrolled down significantly
      if (currentOffset > 50) {
        e.preventDefault();

        const scrollComp = scrollRef.current;
        if (scrollComp) {
          // Try multiple ways to scroll to top, covering Animated wrappers and different ScrollView/FlatList types
          if (typeof scrollComp.scrollToOffset === "function") {
            scrollComp.scrollToOffset({ offset: 0, animated: true });
          } else if (typeof scrollComp.scrollTo === "function") {
            scrollComp.scrollTo({ y: 0, animated: true });
          } else if (typeof scrollComp.scrollToPosition === "function") {
            scrollComp.scrollToPosition(0, 0, true);
          } else if (typeof scrollComp.getNode === "function") {
            const node = scrollComp.getNode();
            if (node) {
              if (typeof node.scrollToOffset === "function") {
                node.scrollToOffset({ offset: 0, animated: true });
              } else if (typeof node.scrollTo === "function") {
                node.scrollTo({ y: 0, animated: true });
              } else if (typeof node.scrollToPosition === "function") {
                node.scrollToPosition(0, 0, true);
              }
            }
          }
        }
      }
    });

    return unsubscribe;
  }, [navigation, isFocus]);

  const getStories = useCallback(async () => {
    try {
      const response = await get("stories");
      setStoriesData(response.data?.data || []);
    } catch (error) {
      console.log("getStories error", error);
    }
  }, []);

  const getMyStories = useCallback(async () => {
    try {
      const response = await get(`stories/me`);
      setMyStoriesData(response.data?.data || []);
    } catch (error) {
      console.log("getStoriesMy error", error);
    }
  }, []);

  const fetchHashtags = useCallback(async () => {
    try {
      const response = await get("hashtag/top?&type=post");
      if (response?.data?.success && response?.data?.data?.hashtags) {
        const nextHashtags = response.data.data.hashtags.slice(0, 8);
        setHashtags((currentHashtags) =>
          areTopicListsEqual(currentHashtags, nextHashtags)
            ? currentHashtags
            : nextHashtags,
        );
      }
    } catch (error) {
      console.log("fetchHashtags error", error);
    }
  }, []);

  const fetchTrendingTopics = useCallback(async () => {
    try {
      const response = await get("posts/trending-topics?type=post");
      if (response?.data?.success && response?.data?.data) {
        const nextTrendingTopics = response.data.data.slice(0, 6);
        setTrendingTopics((currentTrendingTopics) =>
          areTopicListsEqual(currentTrendingTopics, nextTrendingTopics)
            ? currentTrendingTopics
            : nextTrendingTopics,
        );
      }
    } catch (error) {
      console.log("fetchTrendingTopics error", error);
    }
  }, []);

  const fetchRadios = useCallback(async () => {
    try {
      const response = await get("radio");
      if (response?.data?.success && response?.data?.data) {
        setRadioData(response.data.data);
      } else {
        setRadioData([]);
      }
    } catch (error) {
      console.log("fetchRadios error", error);
      setRadioData([]);
    }
  }, []);

  const fetchMetaData = useCallback(async () => {
    try {
      await Promise.all([
        getStories(),
        getMyStories(),
        fetchHashtags(),
        fetchRadios(),
        dispatch(getProfile()),
      ]);
    } catch (error) {
      console.log("fetchMetaData error", error);
    }
  }, [dispatch, fetchHashtags, getMyStories, getStories, fetchRadios]);

  const fetchPosts = useCallback(
    async (isManualRefresh = false, fromPull = false) => {
      try {
        // Only a user pull shows the RefreshControl. Starting it
        // programmatically leaves UIRefreshControl's ~60pt content inset stuck
        // on iOS (the gap under the header).
        if (fromPull) {
          setRefreshing(true);
        } else if (
          !isManualRefresh &&
          (isFirstLoadRef.current || !hasFeedContentRef.current)
        ) {
          setSkeletonLoading(true);
        }
        setError(null);

        let endpoint = "posts?&type=post";

        if (feedType === "friends") {
          endpoint = "posts/my-following?type=post";
        } else if (feedType === "favourite") {
          endpoint = "saved?page=1&limit=10";
        } else {
          const topicNames = sharedTabNames || TAB_NAMES;
          const selectedTopic =
            (tab !== null && topicNames[tab]) || selectedTrendingTopic;
          if (selectedTopic) {
            endpoint += `&topic=${selectedTopic}`;
          }

          if (selectedHashtag) {
            const tagObj = hashtags.find((h) => h._id === selectedHashtag);
            if (tagObj) {
              endpoint += `&hashtags=${tagObj.tag}`;
            }
          }

          // Filters sheet: sorting + time period
          if (feedFilters?.sortBy && feedFilters.sortBy !== "createdAt") {
            endpoint += `&sortBy=${feedFilters.sortBy}`;
          }
          if (feedFilters?.period) {
            endpoint += `&period=${feedFilters.period}`;
          }

          // Area picked from the header location → posts published around it
          if (feedLocation?.feedArea) {
            if (feedLocation.city) {
              endpoint += `&city=${encodeURIComponent(feedLocation.city)}`;
            } else if (feedLocation.latitude && feedLocation.longitude) {
              endpoint += `&lat=${feedLocation.latitude}&lng=${feedLocation.longitude}&radius=50`;
            }
          }
        }

        if (feedType !== "friends" && feedType !== "favourite") {
          const followingEndpoint = endpoint + "&following=true";
          const unfollowEndpoint = endpoint + "&unfollow=true";

          const [followingResponse, unfollowResponse] = await Promise.all([
            get(followingEndpoint),
            get(unfollowEndpoint),
          ]);

          if (
            followingResponse?.data?.success &&
            followingResponse?.data?.data
          ) {
            setPosts(followingResponse.data.data);
          } else {
            setPosts([]);
          }

          if (unfollowResponse?.data?.success && unfollowResponse?.data?.data) {
            setUnfollowedPosts(unfollowResponse.data.data);
          } else {
            setUnfollowedPosts([]);
          }

          if (
            !followingResponse?.data?.success &&
            !unfollowResponse?.data?.success
          ) {
            setError("Failed to fetch posts");
          }
        } else {
          const response = await get(endpoint);
          if (response?.data?.success && response?.data?.data) {
            setPosts(response.data.data);
            setUnfollowedPosts([]);
          } else {
            setPosts([]);
            setUnfollowedPosts([]);
            setError("Failed to fetch posts");
          }
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(err?.message || "Something went wrong");
      } finally {
        setRefreshing(false);
        setSkeletonLoading(false);
        setIsFirstLoad(false);
        isFirstLoadRef.current = false;
      }
    },
    [
      feedType,
      hashtags,
      selectedHashtag,
      selectedTrendingTopic,
      tab,
      sharedTabNames,
      feedFilters,
      feedLocation,
    ],
  );

  const onRefresh = useCallback(() => {
    ReactNativeHapticFeedback.trigger("impactLight", {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    fetchPosts(true, true);
    fetchMetaData();
  }, [fetchMetaData, fetchPosts]);

  useEffect(() => {
    fetchPosts(!isFocus);
  }, [fetchPosts, isFocus]);

  // ── Figma "New posts available" ──────────────────────────────────────
  // Any post newer than the newest one loaded in the feed shows the pill;
  // checked every 30s while the feed is on screen (and the app is active),
  // and right away when a "post" notification arrives. Tap → back to the top
  // and the whole feed reloads.
  // TEMP (client demo): force the pill on. After tapping it the feed
  // reloads, it hides, then comes back 2s later so it can be shown again.
  // Set to false to go back to real new-post detection.
  const DEMO_NEW_POSTS_PILL = false;
  const [showNewPosts, setShowNewPosts] = useState(DEMO_NEW_POSTS_PILL);
  const newPostsAnim = useRef(new Animated.Value(0)).current;
  const newestLoadedRef = useRef(0);
  const newestRemoteRef = useRef(0);
  const myId = useSelector((state) => state.users?.userData?._id);

  useEffect(() => {
    let newest = 0;
    [...posts, ...unfollowedPosts].forEach((p) => {
      const t = new Date(p?.createdAt || 0).getTime();
      if (t > newest) newest = t;
    });
    newestLoadedRef.current = newest;
    // a reload (pull, tap, upload) that brought the newest post in hides it
    if (newestRemoteRef.current && newest >= newestRemoteRef.current) {
      setShowNewPosts(false);
    }
  }, [posts, unfollowedPosts]);

  const checkNewPosts = useCallback(async () => {
    if (!newestLoadedRef.current) return;
    try {
      const res = await get("posts?&type=post&limit=1");
      const latest = res?.data?.data?.[0];
      if (!latest) return;
      const t = new Date(latest.createdAt || 0).getTime();
      const isMine =
        String(latest?.author?._id || latest?.userId || "") === String(myId);
      if (t > newestLoadedRef.current && !isMine) {
        newestRemoteRef.current = t;
        setShowNewPosts(true);
      }
    } catch (e) {
      // silent: the pill is a hint only
    }
  }, [myId]);

  useEffect(() => {
    if (!activeFocus) return undefined;
    let appActive = AppState.currentState === "active";
    const sub = AppState.addEventListener("change", (state) => {
      appActive = state === "active";
      if (appActive) checkNewPosts();
    });
    const id = setInterval(() => {
      if (appActive) checkNewPosts();
    }, 30000);
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [activeFocus, checkNewPosts]);

  useEffect(() => {
    if (!socket) return undefined;
    const onNotification = (data) => {
      if (data?.notificationType === "post") checkNewPosts();
    };
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, [socket, checkNewPosts]);

  useEffect(() => {
    Animated.timing(newPostsAnim, {
      toValue: showNewPosts ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showNewPosts, newPostsAnim]);

  const handleNewPostsPress = useCallback(() => {
    setShowNewPosts(false);
    const list = scrollRef.current;
    list?.scrollToOffset?.({ offset: 0, animated: true });
    setFeedRowVisible?.(true);
    fetchPosts(true);
    fetchMetaData();
    if (DEMO_NEW_POSTS_PILL) setTimeout(() => setShowNewPosts(true), 2000);
  }, [fetchPosts, fetchMetaData, setFeedRowVisible, DEMO_NEW_POSTS_PILL]);

  useEffect(() => {
    fetchMetaData();
  }, [fetchMetaData, isFocus]);

  useEffect(() => {
    getMyStories();
  }, [getMyStories, storyUploadStatus]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "uploadCompleted",
      () => {
        fetchPosts(true);
        fetchMetaData();
      },
    );
    return () => {
      subscription.remove();
    };
  }, [fetchPosts, fetchMetaData]);

  useEffect(() => {
    fetchTrendingTopics();
  }, [fetchTrendingTopics]);

  // Figma: list content starts 1px below the 170pt header.
  // On iOS the pager (react-native-pager-view 8 / SwiftUI TabView) already
  // shifts every page down by the status-bar safe-area inset, so that part of
  // the header is cleared natively and must not be padded a second time.
  const pagerTopShift = Platform.OS === "ios" ? insets.top : 0;
  const listTopPadding = feedHeaderHeight(insets.top) + 1 - pagerTopShift;

  const formatCount = useCallback((count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  }, []);

  // Handle delete post
  const handleDeletePost = useCallback(
    async (postId) => {
      try {
        const api = `posts/${postId}`;
        const response = await del(api);

        if (response?.data?.success) {
          ToastMessage("Post Deleted Successfully", "success");
          setPosts((prevPosts) =>
            prevPosts.filter((post) => post._id !== postId),
          );
          setUnfollowedPosts((prevPosts) =>
            prevPosts.filter((post) => post._id !== postId),
          );
          fetchPosts(false);
        }
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    },
    [fetchPosts],
  );

  // Handle edit post
  const handleEditPost = useCallback(
    (post) => {
      navigation.navigate("CreatePost", {
        editMode: true,
        postData: post,
      });
    },
    [navigation],
  );

  // Handle hide post
  const handleHidePost = useCallback(async (postId) => {
    try {
      const response = await post("hide/post", { postId });

      console.log("response?.data--", response?.data);

      if (response?.data?.success) {
        ToastMessage("Post hidden successfully", "success");
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        setUnfollowedPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch (error) {
      console.log("handleHidePost error", error);
    }
  }, []);

  // Handle hide user posts
  const handleHideUserPosts = useCallback(async (authorId) => {
    try {
      const response = await post("hide/post", { authorId });
      if (response?.data?.success) {
        ToastMessage("User posts hidden successfully", "success");
        setPosts((prev) => prev.filter((p) => p.author?._id !== authorId));
        setUnfollowedPosts((prev) =>
          prev.filter((p) => p.author?._id !== authorId),
        );
      }
    } catch (error) {
      console.log("handleHideUserPosts error", error);
    }
  }, []);

  // Insert ReelCard and unfollowed text at specific positions
  const processedPosts = useMemo(() => {
    if (posts.length === 0 && unfollowedPosts.length === 0) return [];

    const result = [];
    let postsAdded = 0;
    // The same post can come back in both the followed and unfollowed lists;
    // keys must be unique, so skip repeats.
    const seen = new Set();

    const addPost = (post) => {
      const id = post?._id;
      if (id) {
        if (seen.has(id)) return;
        seen.add(id);
      }
      result.push({
        type: "post",
        data: post,
        isChange: Math.random() > 0.7,
        isVideo: Math.random() > 0.8,
      });
      postsAdded++;

      if (postsAdded === 2) {
        result.push({ type: "reelCard" });
      }
      if (postsAdded === 5) {
        result.push({ type: "trendingIndividual" });
      }
    };

    posts.forEach((post) => addPost(post));

    if (unfollowedPosts.length > 0) {
      result.push({ type: "unfollowedText" });
      unfollowedPosts.forEach((post) => addPost(post));
    }

    return result;
  }, [posts, unfollowedPosts]);

  useEffect(() => {
    hasFeedContentRef.current = posts.length > 0 || unfollowedPosts.length > 0;
    viewedPostIdsRef.current.clear();
  }, [posts, unfollowedPosts]);

  const handleOpenComments = useCallback(
    (post, postData) => {
      navigation.navigate("CommentScreen", {
        item: post,
        postData,
      });
    },
    [navigation],
  );

  // topic → number of posts, for "find 2.8k other posts about it."
  const topicCounts = useMemo(() => {
    const map = {};
    (trendingTopics || []).forEach((t) => {
      if (t?.topic) map[t.topic] = t.count || 0;
    });
    return map;
  }, [trendingTopics]);

  const renderItem = useCallback(
    ({ item, index }) => {
      if (item.type === "reelCard") {
        return (
          <>
            {/* <Divider marginBottom={12} marginTop={8} thickness={4} /> */}
            <ReelCard onSetPage={onSetPage} isScreenActive={activeFocus} />
          </>
        );
      }
      if (item.type === "trendingIndividual") {
        return (
          <>
            {/* <Divider marginBottom={12} marginTop={8} thickness={4} /> */}
            <TrendingIndividual />
          </>
        );
      }

      if (item.type === "unfollowedText") {
        return (
          <>
            {/* Figma: 375 fill × 60 hug, pad 16, linear #121212 → gold (sampled
                bottom ≈ rgb(143,128,98)); text 351 fill, Medium 14 / 125% /
                −2%, white, centered */}
            <View style={styles.unfollowedBanner}>
              <LinearGradient
                colors={["rgba(161, 147, 117, 0)", "rgba(161, 147, 117, 0.86)"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <CustomText
                label={
                  "From now on you will only see posts from unfollowed users"
                }
                fontSize={14}
                lineHeight={17.5}
                letterSpacing={-0.28}
                color={COLORS.white}
                fontFamily={fonts.medium}
                textAlign={"center"}
                containerStyle={{ width: "100%" }}
              />
            </View>
            <View style={{ height: 1, backgroundColor: COLORS.authHeader }} />
          </>
        );
      }

      // Render post
      const post = item.data;

      return (
        <FeedPostItem
          post={post}
          shouldPlay={post?._id === viewablePostId && activeFocus}
          formatCount={formatCount}
          onOpenComments={handleOpenComments}
          onDeletePress={handleDeletePost}
          onEditPress={handleEditPost}
          onHidePost={handleHidePost}
          onHideUserPosts={handleHideUserPosts}
          topicPostsCount={topicCounts[post?.topic]}
        />
      );
    },
    [
      activeFocus,
      formatCount,
      topicCounts,
      handleDeletePost,
      handleEditPost,
      handleHidePost,
      handleHideUserPosts,
      handleOpenComments,
      onSetPage,
      viewablePostId,
    ],
  );

  const renderListEmpty = useCallback(() => {
    if (skeletonLoading || refreshing) {
      return (
        <View>
          <PostCardSkeleton />
          <View style={{ height: 1, backgroundColor: COLORS.authHeader }} />
          <PostCardSkeleton />
          <View style={{ height: 1, backgroundColor: COLORS.authHeader }} />
          <PostCardSkeleton />
          <View style={{ height: 1, backgroundColor: COLORS.authHeader }} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <CustomText
            label={error}
            color={COLORS.subtitle}
            fontSize={16}
            textAlign={"center"}
          />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <CustomText
          label={"No posts found"}
          color={COLORS.subtitle}
          fontSize={16}
          textAlign={"center"}
        />
      </View>
    );
  }, [refreshing, error, skeletonLoading]);

  const keyExtractor = useCallback((item, index) => {
    if (item.type === "post") return `post-${item.data?._id || index}`;
    return `${item.type}-${index}`;
  }, []);

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      }),
    [scrollY],
  );

  const socketRef = useRef(socket);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstViewable = viewableItems.find(
        (viewableItem) => viewableItem?.item?.type === "post",
      );
      if (firstViewable?.item?.type === "post") {
        const nextPostId = firstViewable.item.data?._id || null;
        setViewablePostId((currentPostId) =>
          currentPostId === nextPostId ? currentPostId : nextPostId,
        );
      }
    }

    viewableItems?.forEach((viewableItem) => {
      if (viewableItem.isViewable && viewableItem?.item?.type === "post") {
        const postId = viewableItem?.item?.data?._id;
        if (
          postId &&
          socketRef.current &&
          !viewedPostIdsRef.current.has(postId)
        ) {
          viewedPostIdsRef.current.add(postId);
          socketRef.current?.emit("post:view", { postId }, (response) => {
            // console.log(`Post View Callback for ${postId}:`, response);
          });
        }
      }
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20, // Emit when 50% of the post is visible
  }).current;

  const handleHashtagSelection = useCallback((tag) => {
    setSkeletonLoading(true); // Show skeleton when filtration is applied
    setPosts([]); // Clear posts for clean transition
    setUnfollowedPosts([]);
    setSelectedHashtag((prev) => (prev === tag ? null : tag));
  }, []);

  const handleTrendingTopicSelection = useCallback((topic) => {
    setSkeletonLoading(true); // Show skeleton when filtration is applied
    setPosts([]); // Clear posts for clean transition
    setUnfollowedPosts([]);
    setSelectedTrendingTopic((prev) => (prev === topic ? null : topic));
  }, []);

  // Fixed header is now in TabStack.js

  const renderListHeader = useCallback(
    () => (
      <View style={{ marginBottom: 0 }}>
        <FeedComposerRow />
        <View style={{ height: 1, backgroundColor: COLORS.authHeader }} />
        <MomentCard storiesData={storiesData} myStoriesData={myStoriesData} />
        <View style={{ height: 1, backgroundColor: COLORS.authHeader }} />
        {radioData?.length > 0 && (
          <>
            <RadioCard data={radioData} />
            <View style={{ height: 1, backgroundColor: COLORS.authHeader }} />
          </>
        )}
        <TendingTopic
          hashtags={hashtags}
          selectedHashtag={selectedHashtag}
          onSelectHashtag={handleHashtagSelection}
          trendingTopics={trendingTopics}
          selectedTrendingTopic={selectedTrendingTopic}
          onSelectTrendingTopic={handleTrendingTopicSelection}
        />
        <View style={{ height: 1, backgroundColor: COLORS.authHeader }} />
      </View>
    ),
    [
      storiesData,
      myStoriesData,
      hashtags,
      selectedHashtag,
      handleHashtagSelection,
      trendingTopics,
      selectedTrendingTopic,
      handleTrendingTopicSelection,
    ],
  );

  return (
    <View style={{ flex: 1 }}>
      <UpdateUserLocation />
      <View style={{ flex: 1 }}>
        <ScreenWrapper
          translucent
          paddingHorizontal={0.1}
          statusBarColor={colors.statusBarColor}
          headerFloating
        >
          <FlatList
            showsVerticalScrollIndicator={false}
            ref={scrollRef}
            // iOS otherwise adds the safe-area inset on top of paddingTop
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            data={processedPosts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderListEmpty}
            scrollEnabled={true}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                // iOS draws its spinner at the very top of the list — under
                // the floating feed header — so it's hidden there and our own
                // indicator below the header is shown instead.
                tintColor={Platform.OS === "ios" ? "transparent" : undefined}
                progressViewOffset={listTopPadding}
              />
            }
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={50}
            initialNumToRender={5}
            windowSize={10}
            contentContainerStyle={{
              paddingTop: listTopPadding,
              paddingBottom: 100,
            }}
          />
          {Platform.OS === "ios" ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pullIndicator,
                {
                  top: listTopPadding + 18,
                  opacity: refreshing
                    ? 1
                    : scrollY.interpolate({
                        inputRange: [-70, -20],
                        outputRange: [1, 0],
                        extrapolate: "clamp",
                      }),
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.text} />
            </Animated.View>
          ) : null}
          {/* Figma: centred, 12 below the 171pt header; follows the header
              when its Feed/Shorts row collapses */}
          <Animated.View
            pointerEvents={showNewPosts ? "box-none" : "none"}
            style={[
              styles.newPostsWrap,
              {
                top: listTopPadding - 1 + 12,
                opacity: newPostsAnim,
                transform: [
                  {
                    translateY: feedRowAnim
                      ? feedRowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-FEED_HEADER_COLLAPSE, 0],
                        })
                      : 0,
                  },
                ],
              },
            ]}
          >
            <NewPostsPill onPress={handleNewPostsPress} />
          </Animated.View>
        </ScreenWrapper>
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  unfollowedBanner: {
    width: "100%",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  newPostsWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  pullIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    minHeight: 200,
  },
});
