import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
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
import { accentA, getProfileAccent, getProfileTier } from "../../../utils/profileTier";
import FeedPostItem from "../Home/molecules/FeedPostItem";
import PostCardSkeleton from "../Home/molecules/PostCardSkeleton";
import DelImagesModal from "./molecules/DelImagesModal";
import LockInfo from "./molecules/LockInfo";
import MediaGrid from "./molecules/MediaGrid";
import CareerTab from "./molecules/CareerTab";
import CompanyAboutTab from "./molecules/CompanyAboutTab";
import CompanyListsTab from "./molecules/CompanyListsTab";
import TabEmptyState from "./molecules/TabEmptyState";
import ProfileCard, { getFollowText, getProfileCardLayout } from "./molecules/ProfileCard";
import ProfileCardSkeleton from "./molecules/ProfileCardSkeleton";
import ProfileHeader from "./molecules/ProfileHeader";
import ProfileCompactHeader, { ProfileSortRow, TabFade } from "./molecules/ProfileCompactHeader";
import PostsGrid from "./molecules/PostsGrid";
import useCompactProfileHeader from "./molecules/useCompactProfileHeader";

// Figma Profile tabs: Posts · Career · Reposts … (Career = Jobs module).
// Company / Pro entity profiles (Figma Careem): About · Posts · Mentions ·
// Media · Jobs · Events. Tabs are handled by name so both sets share the
// same fetching / rendering.
const PERSON_TABS = ["Posts", "Career", "Reposts"];
const OWN_EXTRA_TABS = ["Mentions", "Media", "Replies", "Liked", "Saved"];
const COMPANY_TABS = ["About", "Posts", "Mentions", "Media", "Jobs", "Events"];
const POST_QUERY = { Reposts: "reposts=true", Mentions: "mentions=true", Replies: "comments=true", Liked: "likes=true" };
const NO_POSTS = ["About", "Career", "Jobs", "Events"];
// tabs served by posts/user (sortable) · tabs shown as a post list (grid-able)
const SORTABLE = ["Posts", "Reposts", "Mentions", "Replies", "Liked"];
const LISTS = [...SORTABLE, "Saved"];
const isCompanyProfile = (u) => u?.role === "company" || !!u?.external?.wikidataQid;

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
  // compact header sort row: "recent" | "popular", layout "list" | "grid"
  const [sortKey, setSortKey] = useState("recent");
  const [postLayout, setPostLayout] = useState("list");
  // the ScrollView's native-driven scroll value (ScreenWrapper hands it over
  // from its sticky header) → the compact header animates on the UI thread
  const [stickyScroll, setStickyScroll] = useState(null);
  const compact = useCompactProfileHeader(stickyScroll);

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
  // which "<userId>|<tab>" the rows on screen belong to — the empty state
  // may only show once this matches (no flash before the response)
  const [loadedKey, setLoadedKey] = useState(null);
  const viewingSelf = !!userData?._id && userData?._id === localUser?._id;
  const tabNames =
    isCompanyProfile(localUser) && !viewingSelf ? COMPANY_TABS : [...PERSON_TABS, ...(viewingSelf ? OWN_EXTRA_TABS : [])];
  const tabKey = tabNames[tab] || tabNames[0];

  // console.log("localUser---", localUser?.stats);
  // console.log("current User---", userData?._id);

  const fetchProfileData = async () => {
    if (!userId) {
      setIsProfileLoading(false);
      return;
    }
    try {
      // skeleton only on the first load (or another user's id): a focus
      // refetch updates the data silently instead of flashing the top half
      if (!localUser) {
        setIsProfileLoading(true);
      } else if (String(localUser._id) !== String(userId)) {
        setLocalUser(null);
        setIsProfileLoading(true);
      }
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
    // they follow me → following them back makes us friends (server rule)
    const followsMe = (localUser?.stats?.following || []).some(
      (id) => String(id) === String(userData?._id),
    );

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
            ? (prev.stats?.followers || []).filter((id) => String(id) !== String(userData._id))
            : !isPrivate
            ? [...(prev.stats?.followers || []), userData._id]
            : prev.stats?.followers || [],
          // the server drops the friendship on unfollow and makes one on a
          // follow back (mutual) — mirror it, or the button stays "Friend"
          friends: currentlyFollowing
            ? (prev.stats?.friends || []).filter((id) => String(id) !== String(userData._id))
            : !isPrivate && followsMe
            ? [...(prev.stats?.friends || []), userData._id]
            : prev.stats?.friends || [],
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

      if (NO_POSTS.includes(tabKey)) {
        setLoading(false);
        setRefreshing(false);
        setLoadedKey(`${userId}|${tabKey}`);
        return;
      }
      if (POST_QUERY[tabKey]) queryParams = `${POST_QUERY[tabKey]}&${userId}`;
      else if (tabKey === "Saved") {
        endpoint = "saved";
        queryParams = `page=1&limit=10&${userId}`;
      } else if (tabKey === "Media") {
        endpoint = "posts/media";
        queryParams = `page=1&limit=20&userId=${userId}`;
      }

      if (sortKey === "popular" && SORTABLE.includes(tabKey)) queryParams += "&sortBy=popular";

      const response = await get(`${endpoint}?${queryParams}`);

      if (response?.data?.success) {
        let resultData = response.data.data;
        if (tabKey === "Media") {
          // Transform media response for MediaGrid
          resultData = resultData.map((item, index) => ({
            ...item,
            id: `${item.postId || "m"}-${index}`,
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
      setLoadedKey(`${userId}|${tabKey}`);
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
  }, [userId, tab, tabKey, sortKey]);

  const renderListEmpty = () => {
    if (loading) return null;

    if (error) return <TabEmptyState tabKey={tabKey} text={error} />;

    return <TabEmptyState tabKey={tabKey} />;
  };

  const openComments = useCallback(
    (item, postData) =>
      navigation.navigate("CommentScreen", { item, postData }),
    [navigation],
  );

  const hidePost = useCallback(async (postId) => {
    try {
      const response = await post("hide/post", { postId });
      if (response?.data?.success) {
        ToastMessage("Post hidden successfully", "success");
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch (e) {
      console.log("hidePost error", e);
    }
  }, []);

  const hideUserPosts = useCallback(async (authorId) => {
    try {
      const response = await post("hide/post", { authorId });
      if (response?.data?.success) {
        ToastMessage("User posts hidden successfully", "success");
        setPosts((prev) => prev.filter((p) => p.author?._id !== authorId));
      }
    } catch (e) {
      console.log("hideUserPosts error", e);
    }
  }, []);

  // Same post rendering as the Home feed (FeedPostItem)
  const renderItem = useCallback(
    ({ item }) => (
      <FeedPostItem
        post={item}
        shouldPlay={false}
        formatCount={formatCount}
        onOpenComments={openComments}
        onDeletePress={handleDeletePost}
        onEditPress={handleEditPost}
        onHidePost={hidePost}
        onHideUserPosts={hideUserPosts}
        showFollowButton={false}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formatCount, openComments, hidePost, hideUserPosts],
  );

  const isMeProfile = userData?._id === localUser?._id;
  const tier = getProfileTier(localUser);
  const accent = getProfileAccent(localUser);
  const cardLayout = getProfileCardLayout(localUser, !isMeProfile);
  // Figma: sections 2pt apart (Premium+ 1pt) on #262626
  const sectionGapStyle = {
    height: !isMeProfile && tier.key === "premiumPlus" ? 1 : 2,
    backgroundColor: COLORS.authHeader,
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenWrapper
        paddingHorizontal={0.1}
        scrollEnabled
        translucent
        stickyHeaderIndices={[1]}
        onStickyScrollValue={setStickyScroll}
        // the banner header floats and the profile scrolls under it (its
        // own Figma background: banner, tier gradient, or #121212 64% + blur
        // 32); the tabs stick right below it
        headerBlur
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["red"]}
          />
        }
        headerUnScrollable={() => (
          <>
            <ProfileHeader
              contentOpacity={compact.anim?.bigHeaderOpacity}
              isBack
              loading={isProfileLoading}
              user={localUser}
              isUser={isMeProfile && !!localUser}
              name={`${localUser?.firstName || ""} ${localUser?.lastName || ""}`}
              coverImage={
                localUser?.profile?.hideCover === false
                  ? null
                  : localUser?.profile?.cover
              }
            />
            <View style={sectionGapStyle} />
          </>
        )}
      >
        <View onLayout={compact.onCardLayout}>
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
        </View>

        {/* Figma: tabs close the info block (Premium 20/16 · Premium+ 12/12),
            32pt chips, padding 12, Medium 14 / −0.5, tier accent */}
        <Animated.View
          style={{
            backgroundColor: colors.background,
            paddingTop: cardLayout.outerGap,
            paddingBottom: cardLayout.padTop,
            paddingHorizontal: 12,
            // hands over to the compact header's icon tabs
            opacity: compact.anim ? compact.anim.textTabsOpacity : 1,
          }}
        >
          {!isProfileLoading && (
            <TopTab
              rounded
              tab={tab}
              oval
              setTab={setTab}
              tabNames={tabNames}
              paddingHorizontal={isMeProfile ? 14 : 12}
              height={32}
              borderWidth={1}
              borderColor={accentA(accent, 0.04)}
              activeBorderColor={"transparent"}
              activeColor={accentA(accent, 0.08)}
              ovalBg={accentA(accent, 0)}
              textColor={accentA(accent, 1)}
              textFontSize={isMeProfile ? 16 : 14}
              textLetterSpacing={-0.5}
            />
          )}
        </Animated.View>

        {/* at least a screen tall: switching to a short tab while the compact
            header is showing keeps the page pinned instead of jumping up */}
        <View style={{ minHeight: Dimensions.get("window").height }}>
        <View style={sectionGapStyle} />

        <TabFade key={`tab-${tabKey}-${postLayout}`}>
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

          if (tabKey === "About") {
            return <CompanyAboutTab user={localUser} />;
          }

          if (tabKey === "Jobs" || tabKey === "Events") {
            return <CompanyListsTab kind={tabKey === "Jobs" ? "jobs" : "events"} userId={localUser?._id} viewingSelf={isMe} />;
          }

          if (tabKey === "Career") {
            return (
              <CareerTab
                userId={localUser?._id}
                isOwner={isMe}
                viewerId={userData?._id}
              />
            );
          }

          if (tabKey === "Media") {
            return (
              <MediaGrid
                mediaData={posts}
                editable={isMe}
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

          // Figma sort row above the list (also in the compact header)
          // hidden until the profile is known (a company opens on About)
          const sortRow = !isProfileLoading && SORTABLE.includes(tabKey) ? (
            <ProfileSortRow
              sortKey={sortKey}
              onSort={() => setSortKey((k) => (k === "recent" ? "popular" : "recent"))}
              layout={postLayout}
              onLayoutToggle={() => setPostLayout((l) => (l === "list" ? "grid" : "list"))}
            />
          ) : null;

          if (loading || loadedKey !== `${userId}|${tabKey}`) {
            return (
              <View style={{ flex: 1 }}>
                {sortRow}
                {[1, 2, 3, 4, 5].map((_, index) => (
                  <PostCardSkeleton key={index} />
                ))}
              </View>
            );
          }

          if (postLayout === "grid" && LISTS.includes(tabKey)) {
            return (
              <>
                {sortRow}
                <PostsGrid posts={posts} ListEmptyComponent={renderListEmpty()} />
              </>
            );
          }

          return (
            <>
              {sortRow}
              <FlatList
                data={posts}
                renderItem={renderItem}
                keyExtractor={(item, i) => String(item?._id ?? item?.id ?? i)}
                scrollEnabled={false}
                ListEmptyComponent={renderListEmpty}
              />
            </>
          );
        })()}
        </TabFade>
        </View>

        <DelImagesModal
          isVisible={showDelModal}
          onClose={() => setShowDelModal(false)}
          selectedPosts={selectedPostsForDel}
          onDelete={confirmDeletePosts}
          onCancel={() => setShowDelModal(false)}
        />
      </ScreenWrapper>

      {/* Figma "Header-When-Scrolling-Instagram-Inspired" */}
      {!isProfileLoading && !!localUser && (
        <ProfileCompactHeader
          user={localUser}
          isOwn={isMeProfile}
          anim={compact.anim}
          interactive={compact.interactive}
          tabNames={tabNames}
          tab={tab}
          onTab={setTab}
          followText={getFollowText({
            user: localUser,
            isFriend: localUser?.stats?.friends?.includes(userData?._id),
            isFollowing: localUser?.stats?.followers?.includes(userData?._id),
            isRequested,
          })}
          onFollowPress={handleFollowPress}
          showSort={SORTABLE.includes(tabKey)}
          sortKey={sortKey}
          onSort={() => setSortKey((k) => (k === "recent" ? "popular" : "recent"))}
          layout={postLayout}
          onLayoutToggle={() => setPostLayout((l) => (l === "list" ? "grid" : "list"))}
        />
      )}

      {/* Fixed Delete Button */}
      {tabKey === "Media" && isMediaEditMode && mediaSelectedCount > 0 && (
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
