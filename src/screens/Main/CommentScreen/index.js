import { BlurView } from "@react-native-community/blur";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  InteractionManager,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import Blur from "../../../components/Blur";
import BottomSheetComponent from "../../../components/BottomSheetComponent";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ProgressiveBlur from "../../../components/ProgressiveBlur";
import ScreenWrapper from "../../../components/ScreenWrapper";
import UploadImageCustom from "../../../components/UploadImageCustom";
import { del, get, post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { uploadAndGetUrl } from "../../../utils/constants";
import CommentModal from "./molecules/CommentModal";
import LinearGradient from "react-native-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useTheme } from "../../../contexts/ThemeContext";

const CommentScreen = ({ route }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const sheetRef = useRef(null);
  const insests = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // Get data from navigation params
  const item = route?.params?.item || {};

  // State for comments
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("mostRecent"); // Default to most recent

  // State for comment input
  const [commentText, setCommentText] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const inputRef = useRef(null);

  const { height: screenHeight } = useWindowDimensions();

  // Get logged-in user data
  const { userData } = useSelector((state) => state.users);
  const snapPoints = useMemo(() => ["55%", "70%", "100%"], []);

  const emojiData = useMemo(
    () => [
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
    ],
    [],
  );

  const handleEmojiPress = (emojiChar) => {
    setCommentText((prev) => (prev || "") + emojiChar);
    inputRef.current?.focus();
  };

  // Extract post data from item
  const author = item?.author || {};

  const displayName =
    `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
    "Display Name";
  const username = author.username || "username";
  const profileColor = author?.profile?.profileColor || COLORS.gray48;
  const description = item?.description || "Caption goes here.";
  const likesCount = item?.stats?.upvotes || 0;
  const commentsCount = item?.stats?.comments || 0;
  const repostsCount = item?.stats?.reposts || 0;

  // Format count helper
  const formatCount = (count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const fetchComments = async (sortParam = sortBy) => {
    if (!item?._id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await get(`posts/${item._id}/comment?sort=${sortParam}`);
      if (response?.data?.success && response?.data?.data?.comments) {
        setComments(response.data.data?.comments);
      } else {
        setError("Failed to fetch comments");
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change from CommentModal with toggle functionality
  const handleTabChange = (tabIndex) => {
    // If clicking the same tab that's already active, remove sorting
    const currentTabIndex =
      sortBy === "mostLiked" ? 0 : sortBy === "mostRecent" ? 1 : -1;

    if (currentTabIndex === tabIndex) {
      // Toggle off - remove sorting
      setSortBy("");
      fetchComments("");
    } else {
      // Toggle on - apply sorting
      const sortParam = tabIndex === 0 ? "mostLiked" : "mostRecent";
      setSortBy(sortParam);
      fetchComments(sortParam);
    }
  };

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      fetchComments();
    });
  }, [isFocused]);

  const openSheet = useCallback(() => {
    sheetRef.current?.snapToIndex(1);
  }, []);

  const handleClose = () => {
    navigation.goBack();
  };

  useEffect(() => {
    openSheet();
  }, [openSheet]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShow = Keyboard.addListener(keyboardShowEvent, (event) => {
      setIsKeyboardVisible(true);
      Animated.timing(keyboardHeight, {
        duration: event.duration,
        toValue: event.endCoordinates.height,
        useNativeDriver: false,
      }).start();
    });

    const keyboardHide = Keyboard.addListener(keyboardHideEvent, (event) => {
      setIsKeyboardVisible(false);
      sheetRef.current?.snapToIndex(2);
      Animated.timing(keyboardHeight, {
        duration: event.duration,
        toValue: 0,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []);

  // Handle reply from CommentModal
  const handleReply = (comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Handle image pick
  const handleImagePick = () => {
    setShowImagePicker(true);
  };

  // Handle image selected from UploadImageCustom
  const handleImageSelected = async (result) => {
    setShowImagePicker(false);
    setIsUploadingImage(true);
    try {
      const url = await uploadAndGetUrl(result);
      if (url) {
        setSelectedImageUrl(url);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      ToastMessage("Failed to upload image", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle remove selected image
  const handleRemoveImage = () => {
    setSelectedImageUrl(null);
  };

  // Handle send comment
  const handleSendComment = async () => {
    if (
      (!commentText?.trim() && !selectedImageUrl) ||
      !item?._id ||
      isSubmitting ||
      isUploadingImage
    ) {
      return;
    }

    const currentCommentText = commentText.trim();
    const currentReplyingTo = replyingTo;
    const currentImageUrl = selectedImageUrl;
    const tempId = Date.now().toString();

    // Check if it's a single emoji to send the Lottie link
    const matchingEmoji = emojiData.find((e) => e.char === currentCommentText);
    const finalCommentContent = matchingEmoji
      ? matchingEmoji.url
      : currentCommentText;

    // Optimistic Comment Object
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
      isPosting: true, // Custom flag for UI
      stats: {
        likes: 0,
        replies: 0,
      },
      replies: [],
    };

    // Update UI immediately
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
    }

    // Clear input immediately for better UX
    setCommentText("");
    setSelectedImageUrl(null);
    setReplyingTo(null);
    Keyboard.dismiss();

    try {
      setIsSubmitting(true);

      const requestBody = {
        comment: finalCommentContent,
      };

      if (currentImageUrl) {
        requestBody.attachment = {
          url: currentImageUrl,
          type: "image",
        };
      }

      // If replying, add parentCommentId
      if (currentReplyingTo) {
        requestBody.parentCommentId = currentReplyingTo._id;
      }

      const response = await post(`posts/${item._id}/comment`, requestBody);

      if (response?.data?.success && response?.data?.data) {
        const newComment = response.data.data;

        if (currentReplyingTo) {
          // Replace the entire parent comment object with the updated one from API
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment._id === currentReplyingTo._id ? newComment : comment,
            ),
          );
        } else {
          // Replace optimistic comment with real one
          setComments((prevComments) =>
            prevComments.map((c) => (c._id === tempId ? newComment : c)),
          );
        }
      } else {
        // Rollback on failure
        rollback();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      rollback();
    } finally {
      setIsSubmitting(false);
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
      }
    }
  };

  const handleLikeReaction = async (comment) => {
    if (!item?._id || !comment?._id || !userData?._id) return;

    const isLiked = comment.reactions?.includes(userData._id);
    const previousComments = [...comments];

    // Optimistically update the comments state
    const updatedComments = comments.map((c) => {
      // If the comment being liked is a main comment
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

      // If the comment being liked is a reply
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
      const res = await post(`posts/${item._id}/reaction/${comment._id}`, {
        reaction: "like",
      });
      // Optionally sync state if API returns something unexpected,
      // but optimistic update is usually enough if success is true.
      if (!res?.data?.success) {
        setComments(previousComments);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      setComments(previousComments);
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!item?._id || !comment?._id) return;

    const previousComments = [...comments];

    // Optimistic update
    setComments((prev) =>
      prev
        .map((c) => {
          if (c._id === comment._id) return null; // Remove if it's the main comment
          if (c.replies?.length > 0) {
            return {
              ...c,
              replies: c.replies.filter((r) => r._id !== comment._id),
              stats: {
                ...c.stats,
                replies: c.replies.some((r) => r._id === comment._id)
                  ? Math.max(0, (c.stats?.replies || 0) - 1)
                  : c.stats?.replies,
              },
            };
          }
          return c;
        })
        .filter(Boolean),
    );

    try {
      const response = await del(`posts/${item._id}/comment/${comment._id}`);
      if (response?.data?.success) {
        ToastMessage("Comment deleted successfully");
      } else {
        setComments(previousComments);
        ToastMessage("Failed to delete comment", "error");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      setComments(previousComments);
      ToastMessage("Error deleting comment", "error");
    }
  };

  // Handle hide specific comment
  const handleHideComment = async (comment) => {
    if (!comment?._id) return;
    try {
      const response = await post("hide/comment", { commentId: comment._id });
      if (response?.data?.success) {
        ToastMessage("Comment hidden successfully", "success");
        // Filter out the comment from the state
        setComments((prev) =>
          prev
            .map((c) => {
              if (c._id === comment._id) return null;
              if (c.replies?.length > 0) {
                return {
                  ...c,
                  replies: c.replies.filter((r) => r._id !== comment._id),
                };
              }
              return c;
            })
            .filter(Boolean),
        );
      }
    } catch (error) {
      console.log("handleHideComment error", error);
    }
  };

  // Handle hide all comments from user
  const handleHideUserComments = async (user) => {
    const authorId = user?._id || user?.id;
    if (!authorId) return;
    try {
      const response = await post("hide/comment", { authorId });
      if (response?.data?.success) {
        ToastMessage("User's comments hidden successfully", "success");
        // Filter out all comments/replies from this user
        setComments((prev) =>
          prev
            .filter((c) => (c.user?._id || c.user?.id) !== authorId)
            .map((c) => {
              if (c.replies?.length > 0) {
                return {
                  ...c,
                  replies: c.replies.filter(
                    (r) => (r.user?._id || r.user?.id) !== authorId,
                  ),
                };
              }
              return c;
            }),
        );
      }
    } catch (error) {
      console.log("handleHideUserComments error", error);
    }
  };

  const onFocus = useCallback(() => {
    sheetRef.current?.expand();
  }, []);

  return (
    <ScreenWrapper
      backgroundImage={
        item?.images?.length > 0 ? { uri: item?.images?.[0] } : Images.person
      }
      translucent
      paddingHorizontal={0.1}
    >
      {/* Light Black Backdrop Overlay */}
      <View style={styles.overlay} />

      {/* Progressive Blur Background for Header */}

      <ProgressiveBlur
        height={170}
        tint={isDark ? "dark" : "light"}
        direction="top"
        intensity={50}
        borderRadius={0}
      >
        <View style={styles.topBlurContainer} pointerEvents="none">
          <ProgressiveBlur
            intensity={100}
            direction="top"
            tint={isDark ? "dark" : "light"}
            height={200}
          />
        </View>

        <View style={[styles.headerContainer, { marginTop: insests.top }]}>
          <View style={styles.rowBetween}>
            {/* Left Section */}
            <View style={styles.row}>
              {author?.profile?.avatar ? (
                <ImageFast
                  source={{ uri: author.profile.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[styles.avatar, { backgroundColor: profileColor }]}
                />
              )}
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <CustomText label={displayName} color={colors.text} />
                  <Image source={Images.verified} style={styles.verifiedIcon} />
                </View>
                <CustomText label={username} color={colors.textSecondary} />
              </View>
            </View>

            {/* Right Section */}
            <View style={[styles.row, styles.rightSection]}>
              <Image source={Images.moreIcon} style={[styles.moreIcon, { tintColor: colors.text }]} />
            </View>
          </View>
          <CustomText
            label={description}
            fontSize={16}
            color={colors.textSecondary}
            marginTop={8}
            marginBottom={8}
            numberOfLines={2}
          />

          <View style={styles.rowButtons}>
            <View style={styles.rowbtn}>
              <Image source={Images.heart} style={{ height: 20, width: 20, tintColor: colors.text }} />
              <CustomText
                label={formatCount(likesCount)}
                fontFamily={fonts.medium}
                fontSize={12}
                color={colors.text}
              />
            </View>
            <View style={styles.rowbtn}>
              <Image source={Images.chat} style={{ height: 16, width: 16, tintColor: colors.text }} />
              <CustomText
                label={formatCount(commentsCount)}
                fontFamily={fonts.medium}
                fontSize={12}
                color={colors.text}
              />
            </View>
            <View style={styles.rowbtn}>
              <Image
                source={Images.arrowUpRight}
                style={{ height: 16, width: 16, tintColor: colors.text }}
              />
              <CustomText
                label={formatCount(repostsCount)}
                fontFamily={fonts.medium}
                fontSize={12}
                color={colors.text}
              />
            </View>
            <View style={styles.rowbtn}>
              <Image source={Images.repost} style={{ height: 16, width: 16, tintColor: colors.text }} />
              <CustomText
                label={formatCount(repostsCount)}
                fontFamily={fonts.medium}
                fontSize={12}
                color={colors.text}
              />
            </View>
          </View>
        </View>
      </ProgressiveBlur>

      {/* Input Container - Moved from CommentModal */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            marginBottom:
              Platform.OS === "android" && Platform.Version < 35
                ? 0
                : keyboardHeight,
          },
        ]}
      >
        {/* <Blur blurAmount={1} blurType="light" /> */}

        <View style={styles.bottomBlurContainer} pointerEvents="none">
          {/* <Blur blurAmount={1} blurType="dark" /> */}
          <ProgressiveBlur
            intensity={80}
            direction="bottom"
            tint={isDark ? "dark" : "light"}
            height={200}
          />
        </View>

        <View>
          {/* Reply Indicator */}
          {replyingTo && (
            <BlurView
              style={{
                // flex: 1,
                backgroundColor: "transparent",
                borderRadius: 12,
                marginBottom: 4,
              }}
              blurType={isDark ? "extraDark" : "light"}
              blurAmount={3}
              reducedTransparencyFallbackColor={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
            >
              <View style={styles.replyIndicator}>
                <View style={styles.replyIndicatorLeft}>
                  <Icons
                    name="corner-down-right"
                    family="Feather"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <CustomText
                    label="Replying to "
                    fontSize={12}
                    color={colors.textSecondary}
                    marginLeft={6}
                  />
                  {replyingTo?.comment?.startsWith(
                    "https://fonts.gstatic.com/s/e/notoemoji/latest/",
                  ) ? (
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
                      color={colors.textSecondary}
                    />
                  )}
                </View>
                <TouchableOpacity onPress={handleCancelReply}>
                  <Icons
                    name="x"
                    family="Feather"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </BlurView>
          )}

          {/* Input Container */}
          <View style={[styles.inputRow]}>
            {/* <Image
              source={Images.CommentEmojie}
              style={{ height: 44, width: 44, marginRight: 6 }}
            /> */}

            <View style={[styles.inputWrapper, { overflow: "hidden" }]}>
              {isDark && <Blur blurAmount={3} blurType="dark" />}
              <TextInput
                ref={inputRef}
                value={commentText}
                style={styles.input}
                placeholder="Type message"
                placeholderTextColor={colors.textSecondary}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                editable={!isSubmitting}
                onFocus={onFocus}
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
                      color={colors.text}
                      style={{ marginHorizontal: 8 }}
                    />
                  ) : (
                    <Image
                      resizeMode="contain"
                      source={Images.commentCam}
                      style={{ height: 22, width: 22, marginHorizontal: 8, tintColor: colors.textSecondary }}
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={handleSendComment}
              style={[
                styles.sendBtn,
                ((!commentText?.trim() && !selectedImageUrl) || isSubmitting) &&
                  styles.sendBtnDisabled,
              ]}
              disabled={
                (!commentText?.trim() && !selectedImageUrl) || isSubmitting
              }
            >
              {isSubmitting ? (
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

          {/* Horizontal emoji strip below inputRow */}

          <View style={styles.emojiStripContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiStripContent}
            >
              {emojiData.map((emoji, index) => (
                <TouchableOpacity
                  key={index.toString()}
                  style={styles.emojiItem}
                  onPress={() => handleEmojiPress(emoji.char)}
                  activeOpacity={0.7}
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

      <View
        style={{
          height: screenHeight / 1,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2,
        }}
      >
        <BottomSheetComponent
          ref={sheetRef}
          snapPoints={snapPoints}
          enableScrollView={false}
          enableDynamicSizing={false}
          initialIndex={0}
          enablePanDownToClose={false}
        >
          <View style={styles.sheetHeader}>
            <CustomText
              fontFamily={fonts.semiBold}
              label={`${comments.length || 0} Comment${
                comments.length !== 1 ? "s" : ""
              }`}
              fontSize={20}
              color={colors.text}
            />
            <ImageFast
              onPress={handleClose}
              source={Images.commentCross}
              style={styles.closeIcon}
              tintColor={colors.text}
            />
          </View>
          <CommentModal
            isBottom
            comments={comments}
            loading={loading}
            post={item}
            onReply={handleReply}
            onLike={handleLikeReaction}
            userData={userData}
            onTabChange={handleTabChange}
            onHideComment={handleHideComment}
            onDeleteComment={handleDeleteComment}
            onHideUserComments={handleHideUserComments}
            currentTab={
              sortBy === "mostLiked" ? 0 : sortBy === "mostRecent" ? 1 : null
            }
          />
        </BottomSheetComponent>
      </View>

      {/* Image Picker */}
      <UploadImageCustom
        imageModal={showImagePicker}
        setImageModal={setShowImagePicker}
        handleChange={handleImageSelected}
        handleCapture={handleImageSelected}
        onDelete={() => {}}
      />
    </ScreenWrapper>
  );
};

export default CommentScreen;

const createStyles = (colors, isDark) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  blurHeader: {
    position: "absolute",
    backgroundColor: "rgba(159, 157, 157, 0.1)",
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  headerContainer: {
    paddingHorizontal: 12,
    zIndex: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: colors.surfaceAlt,
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
  rightSection: {
    width: "10%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 4,
    paddingTop: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  closeIcon: {
    width: 32,
    height: 32,
  },
  rowButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowbtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 99,
  },
  inputContainer: {
    position: "absolute",
    bottom: 90,
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 999,
    backgroundColor: "transparent",
  },
  // New styles for the input area
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
  },
  replyIndicatorLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minHeight: 48,
    maxHeight: 48,
    borderRadius: 99,
    backgroundColor: colors.surfaceAlt,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 8,
    color: colors.text,
    fontFamily: fonts.regular,
    padding: 0,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 99,
    backgroundColor: COLORS.buttonColor,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  previewImageInline: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginHorizontal: 4,
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
  // new styles for emoji strip
  emojiStripContainer: {
    marginTop: 6,
  },
  emojiStripContent: {
    paddingHorizontal: 4,
  },
  emojiItem: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  emojiText: {
    textAlign: "center",
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
    bottom: -20,
    left: 0,
    right: 0,
    overflow: "hidden",
    zIndex: -1,
  },
});
