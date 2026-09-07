import { BlurView } from "@react-native-community/blur";
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { Movie } from "../../../assets/svgs";
import Blur from "../../../components/Blur";
import BottomSheetComponent from "../../../components/BottomSheetComponent";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import UploadImageCustom from "../../../components/UploadImageCustom";
import { get, post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import { ToastMessage } from "../../../utils/ToastMessage";
import { uploadAndGetUrl } from "../../../utils/constants";
import CommentModal from "../CommentScreen/molecules/CommentModal";
import ShareModal from "../Home/molecules/ShareModal";
import ShortsItem from "./molecules/ShortsItem";
import ShortsSkeleton from "./molecules/ShortsSkeleton";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

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

const Shorts = ({
  pagerProgress,
  onSetPage,
  isFocusedPage,
  sharedTab,
  animateHeader,
}) => {
  const isFocus = useIsFocused();
  const activeFocus = isFocusedPage !== undefined ? isFocusedPage : isFocus;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const selectedReel = route.params?.selectedReel;
  const consumedReelIdRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const tab = sharedTab;
  const flatListRef = useRef(null);

  // ─── Overlay visibility animation ───────────────────────────────────────────
  const overlayVisible = useRef(true);
  const overlayAnim = useRef(new Animated.Value(1)).current;

  const toggleOverlay = useCallback(() => {
    const toValue = overlayVisible.current ? 0 : 1;
    overlayVisible.current = !overlayVisible.current;
    Animated.timing(overlayAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    if (animateHeader) {
      animateHeader(overlayVisible.current);
    }
  }, [overlayAnim, animateHeader]);

  useEffect(() => {
    if (!activeFocus) {
      if (!overlayVisible.current) {
        overlayVisible.current = true;
        overlayAnim.setValue(1);
      }
      if (animateHeader) {
        animateHeader(true);
      }
    }
  }, [activeFocus]);

  const { userData } = useSelector((state) => state.users);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["reels", tab],
    queryFn: async ({ pageParam = 1 }) => {
      let endpoint = `posts?&type=reel&page=${pageParam}`;
      if (tab !== null && TAB_NAMES[tab]) {
        endpoint += `&topic=${TAB_NAMES[tab]}`;
      }
      const response = await get(endpoint);
      return response?.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (pagination && pagination.hasNextPage) {
        return parseInt(pagination.currentPage) + 1;
      }
      return undefined;
    },
    enabled: activeFocus,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const videos = useMemo(() => {
    let allVideos = data?.pages?.flatMap((page) => page?.data) || [];
    if (selectedReel && selectedReel._id !== consumedReelIdRef.current) {
      consumedReelIdRef.current = selectedReel._id;
      const selectedId = selectedReel._id || selectedReel.id;
      allVideos = allVideos.filter((v) => (v._id || v.id) !== selectedId);
      return [selectedReel, ...allVideos];
    }
    return allVideos;
  }, [data?.pages, selectedReel]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      if (visibleIndex !== currentIndex) {
        setCurrentIndex(visibleIndex);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

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

  const sheetRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [isShareModal, setIsShareModalVisible] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [selectedPostForComment, setSelectedPostForComment] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [sortBy, setSortBy] = useState("mostRecent");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const commentInputRef = useRef(null);
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [localCommentCounts, setLocalCommentCounts] = useState({});
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const commentSnapPoints = useMemo(() => ["70%", "100%"], []);

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
    const updatedComments = comments.map((c) => {
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
        { reaction: "like" },
      );
      if (!res?.data?.success) {
        setComments(previousComments);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      setComments(previousComments);
    }
  };

  const handleCommentPress = useCallback(
    (post) => {
      setSelectedPostForComment(post);
      fetchComments(post._id);
      if (!localCommentCounts[post._id]) {
        setLocalCommentCounts((prev) => ({
          ...prev,
          [post._id]: post.commentsCount || post.comments || 0,
        }));
      }
      setIsSheetOpen(true);
      sheetRef.current?.snapToIndex(0);
    },
    [localCommentCounts, sortBy],
  );

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
    const matchingEmoji = emojiData.find((e) => e.char === currentCommentText);
    const finalCommentContent = matchingEmoji
      ? matchingEmoji.url
      : currentCommentText;

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
      isPosting: true,
      stats: { likes: 0, replies: 0 },
      replies: [],
    };

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
      setLocalCommentCounts((prev) => ({
        ...prev,
        [selectedPostForComment._id]:
          (prev[selectedPostForComment._id] ||
            selectedPostForComment.commentsCount ||
            0) + 1,
      }));
    }

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
    commentInputRef.current?.focus();
    sheetRef.current?.snapToIndex(1);
  };

  const renderVideoItem = useCallback(
    ({ item, index }) => (
      <ShortsItem
        item={item}
        index={index}
        currentIndex={currentIndex}
        activeFocus={activeFocus}
        navigation={navigation}
        onCommentPress={() => handleCommentPress(item)}
        onSharePress={() => {
          setSelectedPostForShare(item);
          setIsShareModalVisible(true);
        }}
        localCommentCount={localCommentCounts[item._id || item.id]}
        insetsBottom={insets.bottom}
        overlayAnim={overlayAnim}
        overlayVisible={overlayVisible.current}
        toggleOverlay={toggleOverlay}
      />
    ),
    [
      currentIndex,
      activeFocus,
      navigation,
      handleCommentPress,
      localCommentCounts,
      insets.bottom,
      overlayAnim,
      toggleOverlay,
    ],
  );

  const keyExtractor = useCallback(
    (item, index) => `${item._id || item.id}-${index}`,
    [],
  );

  const renderEmptyReels = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Movie
          height={80}
          width={80}
          color={colors.iconMuted}
          marginBottom={10}
        />
        <CustomText
          label="No Reels"
          fontSize={32}
          fontFamily={fonts.BoldItalic}
          color={colors.text}
          marginTop={12}
          fontStyle={"italic"}
        />
        <CustomText
          label="There are no reels right now."
          fontFamily={fonts.medium}
          color={colors.textSecondary}
        />
      </View>
    ),
    [colors],
  );

  const handleOnFocus = useCallback(() => {
    sheetRef.current?.expand();
  }, []);

  if (isLoading && !isRefetching) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ShortsSkeleton />
      </View>
    );
  }

  return (
    <ScreenWrapper
      translucent
      paddingHorizontal={0.1}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={handleScrollEnd}
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        ListEmptyComponent={renderEmptyReels}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.text}
            colors={[colors.text]}
            progressBackgroundColor={colors.background}
            enabled={currentIndex === 0}
          />
        }
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={colors.text} />
            </View>
          ) : null
        }
      />

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
          <View
            style={[styles.sheetHeader, { backgroundColor: colors.background }]}
          >
            <CustomText
              fontFamily={fonts.semiBold}
              label={`${comments.length || 0} Comment${
                comments.length !== 1 ? "s" : ""
              }`}
              fontSize={20}
              lineHeight={20 * 1.4}
              color={colors.text}
            />
            <TouchableOpacity onPress={() => sheetRef.current?.close()}>
              <Image
                source={Images.commentCross}
                style={[styles.closeIcon, { tintColor: colors.text }]}
              />
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
                <View
                  style={[
                    styles.commentInputContainer,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : colors.surfaceAlt,
                    },
                  ]}
                >
                  <TextInput
                    ref={commentInputRef}
                    value={commentText}
                    style={[styles.commentInput, { color: colors.text }]}
                    placeholder="Type message"
                    placeholderTextColor={colors.textSecondary}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={500}
                    editable={!isSubmittingComment}
                    onFocus={handleOnFocus}
                  />

                  {selectedImageUrl ? (
                    <View style={{ position: "relative" }}>
                      <ImageFast
                        source={{ uri: selectedImageUrl }}
                        style={styles.previewImageInline}
                        isView
                      />
                      <TouchableOpacity
                        onPress={handleRemoveImage}
                        style={styles.removeImageBtnInline}
                      >
                        <Icons
                          name="x"
                          family="Feather"
                          size={10}
                          color={COLORS.white}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleImagePick}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.white}
                          style={{ marginLeft: 8 }}
                        />
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
                    ((!commentText?.trim() && !selectedImageUrl) ||
                      isSubmittingComment) &&
                      styles.sendBtnDisabled,
                  ]}
                  disabled={
                    (!commentText?.trim() && !selectedImageUrl) ||
                    isSubmittingComment
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
        isVisible={isShareModal}
        onClose={() => {
          setIsShareModalVisible(false);
          setSelectedPostForShare(null);
        }}
        postImage={selectedPostForShare?.thumbnail}
        username={selectedPostForShare?.author?.username || "viktor.sola"}
        date={
          selectedPostForShare?.createdAt
            ? new Date(selectedPostForShare.createdAt).toLocaleDateString()
            : ""
        }
        postId={selectedPostForShare?._id}
        urlPrefix="psc://short/"
      />
    </ScreenWrapper>
  );
};

export default Shorts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
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
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  closeIcon: {
    width: 30,
    height: 30,
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
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
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
