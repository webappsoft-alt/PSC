import { getPalette } from "@somesoap/react-native-image-palette";
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

import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { post as apiPost, del, get } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { updateUserFollowers } from "../../../store/reducer/MatchingSlice";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "../../../assets/images";
import Icons from "../../../components/Icons";
import fonts from "../../../assets/fonts";
import MatchDetailCard from "./molecules/MatchDetailCard";
import PostCard from "../Home/molecules/PostCard";
import PostCardSkeleton from "../Home/molecules/PostCardSkeleton";
import MediaGrid from "../Profile/molecules/MediaGrid";
import ProfileCard from "../Profile/molecules/ProfileCard";

const MatchingDetail = ({ route, navigation }) => {
  const isFocus = useIsFocused();
  const item = route?.params?.item || {};
  const [bgColor, setBgColor] = useState("");
  const [tab, setTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const userData = useSelector((state) => state.users.userData);
  const [localUser, setLocalUser] = useState(item);

  useEffect(() => {
    const images = localUser?.profile?.matchingImages || [];
    const avatar = localUser?.profile?.avatar;
    const uri =
      images.length > 0
        ? { uri: images[0] }
        : avatar
        ? { uri: avatar }
        : Images.person;

    getPalette(uri)
      .then((palette) => {
        if (palette?.vibrant) setBgColor(palette.vibrant);
        else if (localUser?.profile?.profileColor)
          setBgColor(localUser.profile.profileColor);
      })
      .catch(() => {
        if (localUser?.profile?.profileColor)
          setBgColor(localUser.profile.profileColor);
      });
  }, [localUser]);

  useEffect(() => {
    if (item && item._id) {
      setLocalUser(item);
    }
  }, [item]);

  const getProfileCount = async () => {
    try {
      await get(`user/profile-views/${item?._id}`);
    } catch (error) {
      console.error("Error fetching profile count:", error);
    }
  };

  useEffect(() => {
    getProfileCount();
  }, [isFocus]);

  const handleFollowPress = async () => {
    const userId = localUser?._id;
    if (!userId || userData?._id === userId) return;

    const isFollowing = localUser?.stats?.followers?.includes(userData?._id);
    const isFriend = localUser?.stats?.friends?.includes(userData?._id);
    const currentlyFollowing = isFollowing || isFriend;

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
        stats: {
          ...prev.stats,
          followers: currentlyFollowing
            ? (prev.stats?.followers || []).filter((id) => id !== userData._id)
            : [...(prev.stats?.followers || []), userData._id],
        },
        followersCount: currentlyFollowing
          ? (prev.followersCount || 1) - 1
          : (prev.followersCount || 0) + 1,
      }));

      const authorName = localUser?.firstName || "User";
      if (currentlyFollowing) {
        await del(`relationships/unfollow/${userId}`);
        ToastMessage(`Unfollowed ${authorName}`);
        dispatch(
          updateUserFollowers({
            userId: localUser._id,
            followerId: userData._id,
            isFollow: false,
          }),
        );
      } else {
        await apiPost(`relationships/follow/${userId}`);
        ToastMessage(`You are now following ${authorName}`, "success");
        dispatch(
          updateUserFollowers({
            userId: localUser._id,
            followerId: userData._id,
            isFollow: true,
          }),
        );
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      // Revert local state on error
      setLocalUser(item);
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

      if (!userData?._id || !localUser?._id) return;

      let queryParams = `type=post&${localUser._id}`;
      let endpoint = `posts/user/${localUser?._id}`;

      if (tab === 1) queryParams = `reposts=true&${localUser._id}`;
      else if (tab === 2) queryParams = `mentions=true&${localUser._id}`;
      else if (tab === 4) queryParams = `comments=true&${localUser._id}`;
      else if (tab === 5) queryParams = `likes=true&${localUser._id}`;
      else if (tab === 6) {
        endpoint = "saved";
        queryParams = `page=1&limit=10&${localUser._id}`;
      } else if (tab === 3) {
        endpoint = "posts/media";
        queryParams = `page=1&limit=20&${localUser._id}`;
      }

      const response = await get(`${endpoint}?${queryParams}`);

      if (response?.data?.success) {
        let resultData = response.data.data;
        if (tab === 3) {
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

  useEffect(() => {
    fetchPosts();
  }, [localUser?._id, tab]);

  const onRefresh = () => {
    fetchPosts(true);
  };

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

  const formatCount = useCallback((count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  }, []);

  const renderItem = useCallback(
    ({ item: postItem, index }) => {
      const author = postItem?.author || {};
      const displayName =
        `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
        "Display Name";
      const username = author.username || "username";
      const description = postItem?.description || "";
      const images = postItem?.images || [];
      const hashtags = postItem?.hashtags || [];
      const topic = postItem?.topic || "Crypto";
      const likesCount = postItem?.stats?.upvotes || 0;
      const commentsCount = postItem?.stats?.comments || 0;
      const repostsCount = postItem?.stats?.reposts || 0;
      const stats = postItem?.stats || {};
      const createdAt = postItem?.createdAt || "";
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
            upvotes={postItem?.upvotes || []}
            downvotes={postItem?.downvotes || []}
            showFollowButton={author?._id !== userData?._id}
            onCommentPress={() =>
              navigation.navigate("CommentScreen", {
                item: postItem,
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
            item={postItem}
          />
          <Divider marginBottom={12} marginTop={8} thickness={4} />
        </View>
      );
    },
    [navigation, getTimeAgo, formatCount, userData?._id],
  );

  const isFollowingStatus = localUser?.stats?.followers?.includes(
    userData?._id,
  );
  const isFriendStatus = localUser?.stats?.friends?.includes(userData?._id);

  const floatingHeaderOpacity = scrollY.interpolate({
    inputRange: [0, insets.top + 80],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const floatingHeaderTranslateY = scrollY.interpolate({
    inputRange: [0, insets.top + 80],
    outputRange: [-20, 0],
    extrapolate: "clamp",
  });

  const renderFloatingHeader = () => (
    <Animated.View
      style={[
        styles.floatingHeader,
        {
          paddingTop: insets.top,
          backgroundColor: bgColor || colors.background,
          opacity: floatingHeaderOpacity,
          transform: [{ translateY: floatingHeaderTranslateY }],
        },
      ]}
    >
      <View style={styles.floatingHeaderLeft}>
        <TouchableOpacity
          activeOpacity={0.6}
          style={[styles.floatingBackBtn, { backgroundColor: bgColor ? "#FFFFFF14" : colors.surfaceAlt }]}
          onPress={() => navigation.goBack()}
        >
          <Icons
            name="keyboard-arrow-left"
            family="MaterialIcons"
            size={26}
            color={bgColor ? COLORS.white : colors.text}
          />
        </TouchableOpacity>
        <CustomText
          label={localUser?.profile?.category?.toUpperCase() || "MEMBER"}
          fontSize={20}
          fontFamily={fonts.semiBold}
          marginLeft={12}
        />
      </View>
      {/* <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => navigation.goBack()}
        style={styles.floatingCrossBtn}
      >
        <Image source={Images.cross} style={{ height: 20, width: 20 }} />
      </TouchableOpacity> */}
    </Animated.View>
  );

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      paddingBottom={0.1}
      scrollEnabled
      translucent
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true },
      )}
      headerFloating
      headerUnScrollable={renderFloatingHeader}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <MatchDetailCard isCross item={localUser} scrollY={scrollY} />

      <ProfileCard
        isUser={userData?._id !== localUser?._id}
        tab={tab}
        setTab={setTab}
        name={`${localUser?.firstName} ${localUser?.lastName}`}
        jobTitle={localUser?.occupation?.jobTitle}
        company={localUser?.occupation?.company}
        location={`${localUser?.location?.city}, ${localUser?.location?.country}`}
        followersCount={localUser?.followersCount}
        followingCount={localUser?.followingCount}
        postsCount={localUser?.postsCount}
        data={localUser}
        item={item}
        isFollowing={isFollowingStatus}
        isFriend={isFriendStatus}
        onFollowPress={handleFollowPress}
      />

      <Divider thickness={2} marginTop={16} marginBottom={16} />

      {tab === 3 ? (
        <MediaGrid mediaData={posts} marginBottom={80} />
      ) : loading ? (
        <View style={{ flex: 1, marginTop: 16 }}>
          {[1, 2].map((_, index) => (
            <PostCardSkeleton key={index} />
          ))}
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(postItem) => postItem._id}
          scrollEnabled={false}
          ListEmptyComponent={() => (
            <View style={{ padding: 40, alignItems: "center" }}>
              <CustomText label="No posts found" color={COLORS.gray48} />
            </View>
          )}
        />
      )}
    </ScreenWrapper>
  );
};

export default MatchingDetail;

const styles = StyleSheet.create({
  floatingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  floatingHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  floatingBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF14",
    overflow: "hidden",
  },
  floatingCrossBtn: {
    width: 32,
    height: 32,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF29",
    overflow: "hidden",
  },
});
