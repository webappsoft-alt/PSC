import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import ScreenWrapper from "../../../components/ScreenWrapper";
import TopTab from "../../../components/TopTab";
import { del, get, post } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";
import PostCard from "../Home/molecules/PostCard";
import PostCardSkeleton from "../Home/molecules/PostCardSkeleton";
import DelImagesModal from "./molecules/DelImagesModal";
import LockInfo from "./molecules/LockInfo";
import MediaGrid from "./molecules/MediaGrid";
import ProfileCard from "./molecules/ProfileCard";
import ProfileCardSkeleton from "./molecules/ProfileCardSkeleton";
import ProfileHeader from "./molecules/ProfileHeader";

const UserProfile = ({ route }) => {
  const item = route?.params?.item;
  const isFocus = useIsFocused();
  const dispatch = useDispatch();

  const userData = useSelector((state) => state.users.userData);
  const { colors, isDark } = useTheme();

  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [showDelModal, setShowDelModal] = useState(false);
  const [selectedPostsForDel, setSelectedPostsForDel] = useState([]);
  const [isMediaEditMode, setIsMediaEditMode] = useState(false);
  const [mediaSelectedCount, setMediaSelectedCount] = useState(0);
  const [mediaDeleteHandler, setMediaDeleteHandler] = useState(null);
  const [isRequested, setIsRequested] = useState(false);

  const userId =
    route?.params?.userId ||
    route?.params?.item?.author?._id ||
    route?.params?.item?._id;

  // console.log("userId00000-------",userId);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "TabStack" }],
          });
        }
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );
  const [localUser, setLocalUser] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // console.log("localUser---", localUser?.stats);
  // console.log("current User---", userData?._id);

  const fetchProfileData = async () => {
    if (!userId) {
      setIsProfileLoading(false);
      return;
    }
    try {
      setIsProfileLoading(true);
      const response = await get(`user/profile-views/${userId}`);
      if (response?.data?.success) {
        setLocalUser(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError("Failed to load profile");
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId, isFocus]);

  const handleFollowPress = async () => {
    const userId = localUser?._id;
    if (!userId || userData?._id === userId) return;

    const isFollowing = localUser?.stats?.followers?.includes(userData?._id);
    const isFriend = localUser?.stats?.friends?.includes(userData?._id);
    const currentlyFollowing = isFollowing || isFriend;

    const authorName = localUser?.firstName || "User";
    const isPrivate = localUser?.profilePrivacy === "private";

    try {
      // Optimistic Redux sync
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

      // Optimistic local state update
      setLocalUser((prev) => ({
        ...prev,
        isRequestApproved: currentlyFollowing
          ? undefined
          : isPrivate
          ? false
          : true,
        stats: {
          ...prev.stats,
          followers: currentlyFollowing
            ? (prev.stats?.followers || []).filter((id) => id !== userData._id)
            : !isPrivate
            ? [...(prev.stats?.followers || []), userData._id]
            : prev.stats?.followers || [],
        },
        followersCount: currentlyFollowing
          ? (prev.followersCount || 1) - 1
          : isPrivate
          ? prev.followersCount || 0
          : (prev.followersCount || 0) + 1,
      }));

      if (currentlyFollowing) {
        await del(`relationships/unfollow/${userId}`);
        ToastMessage(`Unfollowed ${authorName}`);
        setIsRequested(false);
      } else {
        await post(`relationships/follow/${userId}`);
        if (isPrivate) {
          setIsRequested(true);
          ToastMessage(`Request sent to ${authorName}`, "success");
        } else {
          ToastMessage(`You are now following ${authorName}`, "success");
        }
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      // Revert Redux and local state on error
      dispatch(setUserData(userData));
      // Optionally re-fetch profile data to sync
      fetchProfileData();
    }
  };

  const fetchPosts = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setPosts([]);
        setLoading(true);
      }
      setError(null);

      if (!userId) {
        console.log("User ID not found");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let queryParams = `type=post&${userId}`;
      let endpoint = `posts/user/${userId}`;

      if (tab === 1) queryParams = `reposts=true&${userId}`;
      else if (tab === 2) queryParams = `mentions=true&${userId}`;
      else if (tab === 4) queryParams = `comments=true&${userId}`;
      else if (tab === 5) queryParams = `likes=true&${userId}`;
      else if (tab === 6) {
        endpoint = "saved";
        queryParams = `page=1&limit=10&${userId}`;
      } else if (tab === 3) {
        endpoint = "posts/media";
        queryParams = `page=1&limit=20&${userId}`;
      }

      const response = await get(`${endpoint}?${queryParams}`);

      if (response?.data?.success) {
        let resultData = response.data.data;
        if (tab === 3) {
          // Transform media response for MediaGrid
          resultData = resultData.map((item, index) => ({
            ...item,
            id: item.media,
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

  // Handle delete post
  const handleDeletePost = async (postId) => {
    try {
      const api = `posts/${postId}`;
      const response = await del(api);

      if (response?.data?.success) {
        ToastMessage("Post Deleted Successfully", "success");
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== postId),
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

  const handleDeleteSelectedPosts = (selectedPosts) => {
    setSelectedPostsForDel(selectedPosts);
    setShowDelModal(true);
  };

  const confirmDeletePosts = async () => {
    try {
      for (const post of selectedPostsForDel) {
        await del(`posts/${post.id}`);
      }
      ToastMessage("Posts Deleted Successfully", "success");
      setShowDelModal(false);
      setSelectedPostsForDel([]);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting posts:", error);
      ToastMessage("Failed to delete posts", "error");
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, tab]);

  const renderListEmpty = () => {
    if (loading) return null;

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
            stats={stats}
            timeAgo={timeAgo}
            formatCount={formatCount}
            upvotes={item?.upvotes || []}
            downvotes={item?.downvotes || []}
            showFollowButton={author?._id !== userData?._id}
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
            onDeletePress={() => handleDeletePost(item?._id)}
            onEditPress={() => handleEditPost(item)}
            item={item}
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
          />
          <Divider marginBottom={12} marginTop={8} thickness={4} color={colors.surfaceAlt} />
        </View>
      );
    },
    [navigation, getTimeAgo, formatCount, userData?._id],
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenWrapper
        paddingHorizontal={0.1}
        scrollEnabled
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
            isBack
            isImage
            user={localUser}
            isUser={userData?._id === localUser?._id}
            name={`${localUser?.firstName || ""} ${localUser?.lastName || ""}`}
            coverImage={
              localUser?.profile?.hideCover === false
                ? null
                : localUser?.profile?.cover
            }
          />
        )}
      >
        {isProfileLoading ? (
          <ProfileCardSkeleton />
        ) : (
          <ProfileCard
            isUser={userData?._id !== localUser?._id}
            tab={tab}
            setTab={setTab}
            name={`${localUser?.firstName || ""} ${localUser?.lastName || ""}`}
            jobTitle={localUser?.occupation?.jobTitle}
            company={localUser?.occupation?.company}
            location={
              localUser?.location?.city &&
              `${localUser?.location?.city}, ${localUser?.location?.country}`
            }
            followersCount={localUser?.followersCount}
            followingCount={localUser?.followingCount}
            postsCount={localUser?.postsCount}
            data={localUser}
            item={localUser}
            isFollowing={localUser?.stats?.followers?.includes(userData?._id)}
            isFriend={localUser?.stats?.friends?.includes(userData?._id)}
            onFollowPress={handleFollowPress}
            isRequested={isRequested}
            showTopTab={false}
          />
        )}

        {!isProfileLoading && (
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
                ...(userData?._id === localUser?._id
                  ? ["Mentions", "Media", "Replies", "Liked", "Saved"]
                  : []),
              ]}
              paddingHorizontal={14}
              borderWidth={1}
              borderColor={"rgba(161, 147, 117, 0.04)"}
              activeColor={"rgba(161, 147, 117, 0.08)"}
              ovalBg={"rgba(161, 147, 117, 0)"}
            />
          </View>
        )}

        <Divider marginBottom={12} marginTop={8} thickness={2} color={colors.surfaceAlt} />

        {(() => {
          const isMe = userData?._id === localUser?._id;
          const isFollowing = localUser?.stats?.followers?.includes(
            userData?._id,
          );
          const isFriend = localUser?.stats?.friends?.includes(userData?._id);
          const isPrivate = localUser?.profilePrivacy === "private";
          const isRequestApproved = localUser?.isRequestApproved === true;

          const canViewContent =
            !isPrivate || isFollowing || isFriend || isRequestApproved || isMe;

          if (!canViewContent) {
            return <LockInfo coverImage={localUser?.profile?.cover} />;
          }

          if (tab === 3) {
            return (
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
            );
          }

          if (loading) {
            return (
              <View style={{ flex: 1 }}>
                {[1, 2, 3, 4, 5].map((_, index) => (
                  <PostCardSkeleton key={index} />
                ))}
              </View>
            );
          }

          return (
            <FlatList
              data={posts}
              renderItem={renderItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              ListEmptyComponent={renderListEmpty}
            />
          );
        })()}

        <DelImagesModal
          isVisible={showDelModal}
          onClose={() => setShowDelModal(false)}
          selectedPosts={selectedPostsForDel}
          onDelete={confirmDeletePosts}
          onCancel={() => setShowDelModal(false)}
        />
      </ScreenWrapper>

      {/* Fixed Delete Button */}
      {tab === 3 && isMediaEditMode && mediaSelectedCount > 0 && (
        <TouchableOpacity
          style={styles.fixedDeleteButton}
          onPress={() => mediaDeleteHandler?.()}
        >
          <View style={styles.deleteInner}>
            <Image
              source={require("../../../assets/images/trash.png")}
              style={styles.deleteIcon}
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UserProfile;

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
    bottom: 40,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.gray64 || "rgba(100,100,100,0.8)",
    height: 52,
    width: 52,
    borderRadius: 99,
  },
  deleteInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    height: 40,
    width: 40,
    borderRadius: 99,
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.red1 || "#FF3B30",
  },
});
