import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  Dimensions,
  StatusBar,
  TouchableOpacity, // Added for potential use, though checking if needed} from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  useDerivedValue,
} from "react-native-reanimated";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import TopTab from "../../../components/TopTab";
import { del, get } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import FollowingRow from "./molecules/FollowingRow";
import HomeHeader from "./molecules/HomeHeader";
import MomentCard from "./molecules/MomentCard";
import PostCard from "./molecules/PostCard";
import ReelCard from "./molecules/ReelCard";
import TendingTopic from "./molecules/TendingTopic";
import TrendingIndividual from "./molecules/TrendingIndividual";
import Text from "../../../components/ScaledText";

const Home = () => {
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const [tab, setTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");

  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  const translateX = useSharedValue(0);
  const isSwiping = useSharedValue(false);
  const cameraPreviewOpacity = useSharedValue(0);

  // Only activate camera when Home is focused and permission granted
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  useEffect(() => {
    setIsCameraActive(isFocus && hasPermission);
  }, [isFocus, hasPermission]);

  const swipeProgress = useDerivedValue(() => {
    return Math.min(Math.abs(translateX.value) / SCREEN_WIDTH, 1);
  });

  useDerivedValue(() => {
    cameraPreviewOpacity.value = swipeProgress.value;
  });

  const navigateToCamera = useCallback(() => {
    setIsCameraActive(false);
    navigation.navigate("CameraScreen");
  }, [navigation]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Only trigger on horizontal swipe
    .onStart(() => {
      isSwiping.value = true;
    })
    .onUpdate((event) => {
      // Allow right swipe (positive translation)
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      // Check if swiped far enough to right
      if (event.translationX > SCREEN_WIDTH * 0.4) {
        translateX.value = withTiming(SCREEN_WIDTH, {
          duration: 200,
        });
        runOnJS(navigateToCamera)();
        setTimeout(() => {
          translateX.value = 0; // Reset after navigation
        }, 300);
      } else {
        translateX.value = withTiming(0, {
          duration: 200,
        });
      }
      isSwiping.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const cameraPreviewStyle = useAnimatedStyle(() => {
    return {
      opacity: cameraPreviewOpacity.value,
      // Camera slides in from Left (starts at -SCREEN_WIDTH)
      transform: [{ translateX: -SCREEN_WIDTH + translateX.value }],
    };
  });

  useEffect(() => {
    fetchPosts();
  }, [isFocus]);

  const fetchPosts = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await get("posts?&type=post", {
        page: 1,
        limit: 20,
      });

      if (response?.data?.success && response?.data?.data) {
        setPosts(response.data.data);
      } else {
        setError("Failed to fetch posts");
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchPosts(true);
  }, [isFocus]);

  // Format time ago
  const getTimeAgo = useCallback((dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  }, []);

  // Format numbers (1000 -> 1k, 1000000 -> 1M)
  const formatCount = useCallback((count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  }, []);

  // Handle delete post
  const handleDeletePost = async (postId) => {
    try {
      const api = `posts/${postId}`;
      const response = await del(api);

      if (response?.data?.success) {
        ToastMessage("Post Deleted Successfully", "success");
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== postId)
        );
        fetchPosts();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Handle edit post
  const handleEditPost = (post) => {
    navigation.navigate("CreatePost", {
      editMode: true,
      postData: post,
    });
  };

  // Insert ReelCard and unfollowed text at specific positions
  const processedPosts = useMemo(() => {
    if (posts.length === 0) return [];

    const result = [];
    posts.forEach((post, index) => {
      // Add the post with random isChange prop
      result.push({
        type: "post",
        data: post,
        isChange: Math.random() > 0.7,
        isVideo: Math.random() > 0.8,
      });

      // After 2nd post, add ReelCard
      if (index === 1) {
        result.push({ type: "reelCard" });
      }

      // After 4th post, add unfollowed text
      if (index === 3) {
        result.push({ type: "unfollowedText" });
      }
      if (index === 4) {
        result.push({ type: "trendingIndividual" });
      }
    });

    return result;
  }, [posts]);

  const renderListHeader = useCallback(
    () => (
      <>
        <FollowingRow />
        <Divider marginVertical={0} thickness={1} />
        <MomentCard />
        {/* <Divider marginBottom={8} thickness={1} /> */}
        {/* <InvestFuture onPress={() => navigation.navigate("InvestmentScreen")} /> */}
        <Divider marginVertical={0} thickness={1} />
        <TendingTopic />
        <Divider marginVertical={0} marginBottom={8} thickness={1} />
      </>
    ),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      if (item.type === "reelCard") {
        return (
          <>
            {/* <Divider marginBottom={12} marginTop={8} thickness={4} /> */}
            <ReelCard />
            <Divider marginBottom={12} marginTop={8} thickness={1} />
          </>
        );
      }
      if (item.type === "trendingIndividual") {
        return (
          <>
            {/* <Divider marginBottom={12} marginTop={8} thickness={4} /> */}
            <TrendingIndividual />
            <Divider marginBottom={12} marginTop={8} thickness={1} />
          </>
        );
      }

      if (item.type === "unfollowedText") {
        return (
          <>
            <CustomText
              label={
                "From now on you will only see posts from unfollowed users"
              }
              alignSelf={"center"}
              fontSize={18}
              color={COLORS.subtitle}
              fontFamily={fonts.medium}
              textAlign={"center"}
              marginTop={8}
            />
            <Divider marginBottom={12} marginTop={16} thickness={1} />
          </>
        );
      }

      // Render post
      const post = item.data;
      const author = post?.author || {};
      const displayName =
        `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
        "Display Name";
      const username = author.username || "username";
      const description = post?.description || "";
      const images = post?.images || [];
      const hashtags = post?.hashtags || [];
      const topic = post?.topic || "Crypto";
      const likesCount = post?.stats?.upvotes || 0;
      const commentsCount = post?.stats?.comments || 0;
      const repostsCount = post?.stats?.reposts || 0;
      const stats = post?.stats || {};
      const createdAt = post?.createdAt || "";
      const timeAgo = getTimeAgo(createdAt);

      return (
        <>
          <PostCard
            displayName={displayName}
            username={username}
            description={description}
            images={images}
            hashtags={hashtags}
            topic={topic}
            likesCount={likesCount}
            commentsCount={commentsCount}
            repostsCount={repostsCount}
            stats={stats}
            timeAgo={timeAgo}
            formatCount={formatCount}
            upvotes={post?.upvotes || []}
            downvotes={post?.downvotes || []}
            // onVoteUpdate={() => fetchPosts(false)}
            onCommentPress={() =>
              navigation.navigate("CommentScreen", {
                item: item?.data,
                postData: {
                  displayName,
                  username,
                  description,
                  likesCount,
                  commentsCount,
                  repostsCount,
                  timeAgo,
                  images,
                },
              })
            }
            onDeletePress={() => handleDeletePost(post?._id)}
            onEditPress={() => handleEditPost(post)}
            item={post}
            // Add swipe callbacks
            onSwipeRight={() =>
              navigation.navigate("CommentScreen", {
                item: item?.data,
                postData: {
                  displayName,
                  username,
                  description,
                  likesCount,
                  commentsCount,
                  repostsCount,
                  timeAgo,
                  images,
                },
              })
            }
          />
          <Divider
            marginBottom={12}
            marginTop={8}
            thickness={index === 0 ? 4 : 1}
          />
        </>
      );
    },
    [navigation, getTimeAgo, formatCount, handleEditPost, handleDeletePost]
  );

  const renderListEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.buttonColor} />
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
  }, [loading, error]);

  const keyExtractor = useCallback((item, index) => {
    if (item.type === "post") return item.data._id;
    return `${item.type}-${index}`;
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Actual Camera Preview (behind main screen) */}
      <Animated.View style={[styles.cameraPreview, cameraPreviewStyle]}>
        {device && hasPermission ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isCameraActive}
            photo={true}
          />
        ) : null}
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraText}>📷 Camera Preview</Text>
          <Text style={styles.swipeHint}>Continue swiping to open camera</Text>
        </View>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[{ flex: 1, backgroundColor: "white" }, animatedStyle]}
        >
          <ScreenWrapper
            paddingHorizontal={0.1}
            statusBarColor="#181818"
            scrollEnabled
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.buttonColor}
                colors={[COLORS.buttonColor]}
              />
            }
            headerUnScrollable={() => (
              <View
                style={{
                  backgroundColor: "#181818",
                  paddingTop: 10,
                }}
              >
                <HomeHeader title={"Home"} isHome />

                <View style={[styles.row, { backgroundColor: "#181818" }]}>
                  <ImageFast
                    source={Images.compassBg}
                    style={{ width: 36, height: 32 }}
                  />
                  <TopTab
                    rounded
                    // tab={tab}
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
          >
            <FlatList
              data={processedPosts}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={renderListEmpty}
              scrollEnabled={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={5}
              updateCellsBatchingPeriod={50}
              initialNumToRender={5}
              windowSize={10}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          </ScreenWrapper>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
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
  cameraPreview: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  cameraText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  swipeHint: {
    color: "#fff",
    fontSize: 14,
  },
});
