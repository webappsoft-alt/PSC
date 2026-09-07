import { useIsFocused, useNavigation } from "@react-navigation/native";
import moment from "moment/moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SocialFeedSvg } from "../../../assets/svgs";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { del, get, post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import PostCard from "../Home/molecules/PostCard";
import PostCardSkeleton from "../Home/molecules/PostCardSkeleton";
import { useTheme } from "../../../contexts/ThemeContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const PostFilter = ({ route }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const isFocus = useIsFocused();
  const navigation = useNavigation();
  const scrollRef = useRef(null);

  const hashtag = route.params?.hashtag;
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [viewablePostId, setViewablePostId] = useState(null);

  useEffect(() => {
    fetchPosts(true);
  }, [hashtag, isFocus]);

  const fetchPosts = async (isRefreshing = false) => {
    try {
      if (isRefreshing || isFirstLoad || posts.length === 0) {
        setRefreshing(true);
      } else {
        setRefreshing(false);
      }
      setError(null);

      let endpoint = "posts?&type=post";
      if (hashtag) {
        endpoint += `&hashtags=${hashtag}`;
      }

      const response = await get(endpoint);
      if (response?.data?.success && response?.data?.data) {
        setPosts(response.data.data);
      } else {
        setPosts([]);
        setError("Failed to fetch posts");
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err?.message || "Something went wrong");
    } finally {
      setRefreshing(false);
      setIsFirstLoad(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchPosts(true);
  }, [hashtag]);

  const formatCount = useCallback((count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  }, []);

  const handleDeletePost = async (postId) => {
    try {
      const api = `posts/${postId}`;
      const response = await del(api);

      if (response?.data?.success) {
        ToastMessage("Post Deleted Successfully", "success");
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== postId),
        );
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleEditPost = (post) => {
    navigation.navigate("CreatePost", {
      editMode: true,
      postData: post,
    });
  };

  const handleHidePost = async (postId) => {
    try {
      const response = await post("hide/post", { postId });
      if (response?.data?.success) {
        ToastMessage("Post hidden successfully", "success");
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch (error) {
      console.log("handleHidePost error", error);
    }
  };

  const handleHideUserPosts = async (authorId) => {
    try {
      const response = await post("hide/post", { authorId });
      if (response?.data?.success) {
        ToastMessage("User posts hidden successfully", "success");
        setPosts((prev) => prev.filter((p) => p.author?._id !== authorId));
      }
    } catch (error) {
      console.log("handleHideUserPosts error", error);
    }
  };

  const renderItem = ({ item, index }) => {
    const post = item;
    const author = post?.author || {};
    const displayName =
      `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
      "Display Name";
    const username = author.username || "username";
    const profileColor = author?.profile?.profileColor || "red";
    const description = post?.description || "";
    const images = post?.images || [];
    const hashtags = post?.hashtags || [];
    const topic = post?.topic || "Crypto";
    const stats = post?.stats || {};
    const createdAt = post?.createdAt || "";
    const timeAgo = moment(createdAt).fromNow();

    return (
      <>
        <PostCard
          displayName={displayName}
          username={username}
          description={description}
          images={images}
          hashtags={hashtags}
          topic={topic}
          likesCount={stats.upvotes || 0}
          commentsCount={stats.comments || 0}
          repostsCount={stats.reposts || 0}
          stats={stats}
          timeAgo={timeAgo}
          formatCount={formatCount}
          upvotes={post?.upvotes || []}
          downvotes={post?.downvotes || []}
          savedCount={stats.saved || 0}
          profileColor={profileColor}
          onCommentPress={() =>
            navigation.navigate("CommentScreen", {
              item: post,
              postData: {
                displayName,
                username,
                description,
                likesCount: stats.upvotes || 0,
                commentsCount: stats.comments || 0,
                repostsCount: stats.reposts || 0,
                timeAgo,
                images,
              },
            })
          }
          onDeletePress={() => handleDeletePost(post?._id)}
          onEditPress={() => handleEditPost(post)}
          onHidePost={() => handleHidePost(post?._id)}
          onHideUserPosts={() => handleHideUserPosts(author?._id)}
          item={post}
          shouldPlay={post?._id === viewablePostId && isFocus}
        />
        <Divider marginBottom={12} marginTop={8} thickness={1} />
      </>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstViewable = viewableItems[0];
      setViewablePostId(firstViewable.item?._id);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderListEmpty = () => {
    if (refreshing && isFirstLoad) {
      return (
        <View style={{ paddingHorizontal: 12 }}>
          <PostCardSkeleton />
          <Divider marginBottom={12} marginTop={8} thickness={1} />
          <PostCardSkeleton />
          <Divider marginBottom={12} marginTop={8} thickness={1} />
          <PostCardSkeleton />
          <Divider marginBottom={12} marginTop={8} thickness={1} />
        </View>
      );
    }

    return (
      <View style={styles.noDataContainer}>
        <SocialFeedSvg
          height={80}
          width={80}
          color={colors.iconMuted}
          marginBottom={10}
        />
        <CustomText
          label="No Posts"
          fontSize={32}
          fontFamily={fonts.BoldItalic}
          color={colors.text}
          marginTop={12}
          fontStyle={"italic"}
        />
        <CustomText
          label="There are no posts to show right now."
          fontFamily={fonts.medium}
          color={colors.iconMuted}
        />
      </View>
    );
  };

  return (
    <ScreenWrapper paddingHorizontal={0.1}>
      <Header title={hashtag ? `#${hashtag}` : "Posts"} />
      <FlatList
        ref={scrollRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={renderListEmpty}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && !isFirstLoad}
            onRefresh={onRefresh}
            tintColor={isDark ? COLORS.white : colors.text}
          />
        }
        contentContainerStyle={posts.length === 0 && { flex: 1 }}
      />
    </ScreenWrapper>
  );
};

export default PostFilter;

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    noDataContainer: {
      height: SCREEN_HEIGHT / 1.5,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
  });
