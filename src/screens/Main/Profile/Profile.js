import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import TopTab from "../../../components/TopTab";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTabBarVisibility } from "../../../navigation/TabStack";
import { del, get } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import PostCard from "../Home/molecules/PostCard";
import PostCardSkeleton from "../Home/molecules/PostCardSkeleton";
import BannerModal from "./molecules/BannerModal";
import DelImagesModal from "./molecules/DelImagesModal";
import FinalizeProfile from "./molecules/FinalizeProfile";
import MediaGrid from "./molecules/MediaGrid";
import ProfileCard from "./molecules/ProfileCard";
import ProfileHeader from "./molecules/ProfileHeader";
import { getProfile } from "../../../utils/constants";

const Profile = () => {
  const isFocus = useIsFocused();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const userData = useSelector((state) => state.users.userData);

  const [tab, setTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerModal, setBannerModal] = useState(false);
  const [showDelModal, setShowDelModal] = useState(false);
  const [isMediaEditMode, setIsMediaEditMode] = useState(false);
  const [mediaSelectedCount, setMediaSelectedCount] = useState(0);
  const [selectedPostsForDel, setSelectedPostsForDel] = useState([]);
  const [mediaDeleteHandler, setMediaDeleteHandler] = useState(null);
  const [viewablePostId, setViewablePostId] = useState(null);
  const [loadedTabs, setLoadedTabs] = useState([]);

  const { setIsTabBarVisible } = useTabBarVisibility();
  const dispatch = useDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastContentOffset = useRef(0);

  const tabBarVisibleRef = useRef(true);

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      if (value < 0) return;

      const diff = value - lastContentOffset.current;

      if (Math.abs(diff) < 20) return;

      const shouldShow = diff < 0;

      if (tabBarVisibleRef.current !== shouldShow) {
        tabBarVisibleRef.current = shouldShow;
        setIsTabBarVisible(shouldShow);
      }

      lastContentOffset.current = value;
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [setIsTabBarVisible]);

  useFocusEffect(
    useCallback(() => {
      tabBarVisibleRef.current = true;
      setIsTabBarVisible(true);

      // Reset last offset so scroll logic doesn’t instantly hide it
      lastContentOffset.current = 0;
    }, []),
  );

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  useEffect(() => {
    fetchPosts();
    dispatch(getProfile());
  }, [isFocus, tab]);

  const fetchPosts = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else if (!loadedTabs.includes(tab)) {
        setPosts([]);
        setLoading(true);
      }
      setError(null);

      if (!userData?._id) {
        console.log("User ID not found in Redux");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let queryParams = "type=post";
      let endpoint = `posts/user/${userData?._id}`;

      if (tab === 1) queryParams = "reposts=true";
      else if (tab === 2) queryParams = "mentions=true";
      else if (tab === 4) queryParams = "comments=true";
      else if (tab === 5) queryParams = "likes=true";
      else if (tab === 6) {
        endpoint = "saved";
        queryParams = "page=1&limit=10";
      } else if (tab === 3) {
        endpoint = "posts/media";
        queryParams = "page=1&limit=20";
      }

      const response = await get(`${endpoint}?${queryParams}`);

      if (response?.data?.success) {
        let resultData = response.data.data;
        if (tab === 3) {
          // Transform media response for MediaGrid
          resultData = resultData.map((item, index) => ({
            ...item,
            id: item.media, // Using media URL as unique ID for grid selection
            uri: item.media,
            dateLabel: moment(item.createdAt).format("DD MMM, YYYY"),
            isMediaTab: true,
          }));
        }
        setPosts(resultData);
      } else {
        setError("Failed to fetch posts");
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadedTabs((prev) => (prev.includes(tab) ? prev : [...prev, tab]));
    }
  };

  const onRefresh = () => {
    fetchPosts(true);
  };

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

  const renderListEmpty = () => {
    if (loading) return null; // Loading handled in the main render block for better UX

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <CustomText
            label={error}
            color={colors.textSecondary}
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
          color={colors.textSecondary}
          fontSize={16}
          textAlign={"center"}
        />
      </View>
    );
  };

  const deletePost = async (postId) => {
    try {
      console.log("postId---==-=", postId);

      const response = await del(`posts/${postId}`);
      if (response?.data?.success) {
        ToastMessage("Post Deleted Successfully", "success");
        fetchPosts();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleEditPost = (item) => {
    navigation.navigate("CreatePost", {
      editMode: true,
      postData: {
        ...item,
        id: item._id,
      },
    });
  };

  const handleDeleteSelectedPosts = (selectedPosts) => {
    setSelectedPostsForDel(selectedPosts);
    setShowDelModal(true);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstViewable = viewableItems[0];
      setViewablePostId(firstViewable.item?._id);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Emit when 50% of the post is visible
  }).current;

  const confirmDeletePosts = async () => {
    try {
      setIsDeleting(true);
      if (tab === 3) {
        // Group by postId for media deletion
        const groupedDeletes = selectedPostsForDel.reduce((acc, current) => {
          const existing = acc.find((item) => item.postId === current.postId);
          if (existing) {
            existing.imageUrls.push(current.media);
          } else {
            acc.push({
              postId: current.postId,
              imageUrls: [current.media],
            });
          }
          return acc;
        }, []);

        const payload = { data: groupedDeletes };
        await del("posts/media", payload);
      } else {
        for (const postItem of selectedPostsForDel) {
          await del(`posts/${postItem._id}`);
        }
      }
      ToastMessage("Media Deleted Successfully", "success");
      setShowDelModal(false);
      setSelectedPostsForDel([]);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting posts:", error);
      ToastMessage("Failed to delete posts", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderItem = useCallback(
    ({ item, index }) => {
      const author = item?.author || {};
      const displayName =
        `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
        "Display Name";
      const username = author.username || "username";
      const description = item?.description || "";
      const images = item?.images || [];
      const hashtags = item?.hashtags || [];
      const topic = item?.topic || "Crypto";
      const likesCount = item?.stats?.upvotes || 0;
      const commentsCount = item?.stats?.comments || 0;
      const repostsCount = item?.stats?.reposts || 0;
      const savedCount = item?.stats?.saved || 0;
      const stats = item?.stats || {};
      const createdAt = item?.createdAt || "";
      const timeAgo = getTimeAgo(createdAt);

      return (
        <View>
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
            savedCount={savedCount}
            stats={stats}
            timeAgo={timeAgo}
            formatCount={formatCount}
            upvotes={item?.upvotes || []}
            downvotes={item?.downvotes || []}
            showFollowButton={false}
            // onClickRepostedFrom={() =>
            //   navigation.navigate("UserProfile", {
            //     item: author,
            //   })
            // }
            onCommentPress={() =>
              navigation.navigate("CommentScreen", {
                item: item,
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
            onDeletePress={() => deletePost(item._id)}
            onEditPress={() => handleEditPost(item)}
            item={item}
            shouldPlay={item?._id === viewablePostId && isFocus}
            onSwipeRight={() =>
              navigation.navigate("CommentScreen", {
                item: item,
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
            // onSwipeLeft={() => navigation.navigate("InboxScreen")}
          />
          <Divider marginBottom={12} marginTop={8} thickness={4} />
        </View>
      );
    },
    [navigation, getTimeAgo, formatCount],
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenWrapper
        paddingHorizontal={0.1}
        scrollEnabled
        onScroll={onScroll}
        scrollEventThrottle={16}
        translucent
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["red"]}
          />
        }
        headerUnScrollable={() => (
          <ProfileHeader
            isImage
            isUser
            type={"premium"}
            name={`${userData?.firstName} ${userData?.lastName}`}
            onBannerPress={() => setBannerModal(true)}
            coverImage={
              userData?.profile?.hideCover === false
                ? null
                : userData?.profile?.cover
            }
          />
        )}
      >
        <ProfileCard
          tab={tab}
          setTab={setTab}
          name={`${userData?.firstName} ${userData?.lastName}`}
          jobTitle={userData?.occupation?.jobTitle}
          company={userData?.occupation?.company}
          location={
            userData?.location?.city &&
            `${userData?.location?.city}, ${userData?.location?.country}`
          }
          followersCount={userData?.followersCount}
          followingCount={userData?.followingCount}
          postsCount={userData?.postsCount}
          showTopTab={false}
        />

        <View
          style={{
            backgroundColor: colors.background,
            paddingBottom: 8,
            paddingHorizontal: 12,
          }}
        >
          <TopTab
            rounded
            tab={tab}
            oval
            setTab={setTab}
            tabNames={[
              "Posts",
              "Reposts",
              "Mentions",
              "Media",
              "Replies",
              "Liked",
              "Saved",
            ]}
            paddingHorizontal={14}
            borderWidth={1}
            borderColor={colors.surfaceAlt}
            activeColor={"rgba(161, 147, 117, 0.08)"}
            ovalBg={"rgba(161, 147, 117, 0)"}
            marginTop={6}
          />
        </View>

        <Divider marginBottom={0.1} marginTop={0} thickness={2} />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("RequestsScreen")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            paddingVertical: 12,
            height: 50,
          }}
        >
          <CustomText
            label="Follow Requests"
            color={colors.textSecondary}
            fontFamily={fonts.medium}
            fontSize={16}
          />
          <ImageFast
            source={Images.forwardIcon}
            style={[styles.forwardIcon, { tintColor: colors.iconMuted }]}
          />
        </TouchableOpacity>
        <Divider marginBottom={0.1} marginTop={0} thickness={2} />

        <FinalizeProfile />

        {tab === 3 ? (
          <MediaGrid
            mediaData={posts}
            onDeletePress={handleDeleteSelectedPosts}
            marginBottom={80}
            onEditModeChange={(editMode) => setIsMediaEditMode(editMode)}
            onSelectionChange={(selectedItems, deleteHandler) => {
              setMediaSelectedCount(selectedItems.length);
              setMediaDeleteHandler(() => deleteHandler);
            }}
          />
        ) : loading && !loadedTabs.includes(tab) ? (
          <View style={{ flex: 1 }}>
            {[1, 2, 3].map((_, index) => (
              <PostCardSkeleton key={index} />
            ))}
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            ListEmptyComponent={renderListEmpty}
            contentContainerStyle={{ paddingBottom: 100 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={50}
            initialNumToRender={5}
            windowSize={10}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
          />
        )}

        <DelImagesModal
          isVisible={showDelModal}
          onClose={() => setShowDelModal(false)}
          selectedPosts={selectedPostsForDel}
          onDelete={confirmDeletePosts}
          onCancel={() => setShowDelModal(false)}
          loading={isDeleting}
        />
      </ScreenWrapper>

      {/* Fixed Delete Button - Outside ScreenWrapper */}
      {tab === 3 && isMediaEditMode && mediaSelectedCount > 0 && (
        <TouchableOpacity
          style={[
            styles.fixedDeleteButton,
            { backgroundColor: colors.iconMuted },
          ]}
          onPress={() => mediaDeleteHandler?.()}
        >
          <View style={[styles.deleteInner, { backgroundColor: colors.card }]}>
            <Image
              source={require("../../../assets/images/trash.png")}
              style={styles.deleteIcon}
            />
          </View>
        </TouchableOpacity>
      )}

      <BannerModal
        isVisible={bannerModal}
        onClose={() => setBannerModal(false)}
        user={userData}
      />
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    minHeight: 200,
  },
  fixedDeleteButton: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    width: 52,
    borderRadius: 99,
  },
  deleteInner: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: 40,
    borderRadius: 99,
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.red1 || "#FF3B30",
  },
  forwardIcon: { width: 20, height: 20 },
});
