import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import Blur from "../../../components/Blur";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import UploadImageCustom from "../../../components/UploadImageCustom";
import { del, get, post, put } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { uploadAndGetUrl } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import CommentModal from "../CommentScreen/molecules/CommentModal";
import CommentSkeleton from "./molecules/CommentSkeleton";
import EditModal from "./molecules/EditModal";
import PostCard from "./molecules/PostCard";
import PostCardSkeleton from "./molecules/PostCardSkeleton";
import { useTheme } from "../../../contexts/ThemeContext";
import UserBadge from "../../../components/UserBadge";

const DetailPageWithId = ({ route }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const navigation = useNavigation();
  const postId = route?.params?.postId || route?.params?.item?._id;
  const dispatch = useDispatch();

  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("mostRecent");

  const userData = useSelector((state) => state.users.userData);

  const author = item?.author || {};
  const isOwner = item?.author?._id === userData?._id;
  const [showModal, setShowModal] = useState(false);

  // Post data mapping
  const displayName = useMemo(
    () =>
      `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
      "Display Name",
    [author],
  );
  const username = item?.author?.username || "username";
  const description = item?.description || "";
  const images = item?.images || [];
  const hashtags = item?.hashtags || [];
  const topic = item?.topic || "Crypto";
  const likesCount = item?.stats?.upvotes || 0;
  const commentsCount = item?.stats?.comments || 0;
  const repostsCount = item?.stats?.reposts || 0;
  const stats = item?.stats || {};
  const createdAt = item?.createdAt || "";
  const profileColor = author?.profile?.profileColor || "red";

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

  const timeAgo = useMemo(() => getTimeAgo(createdAt), [createdAt, getTimeAgo]);

  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const isFollowingUser = useMemo(() => {
    const authorId = item?.author?._id;
    if (!authorId) return false;

    if (userData?.stats?.following) {
      return userData.stats.following.includes(authorId);
    }

    return item?.author?.stats?.followers?.includes(userData?._id) || false;
  }, [userData?.stats?.following, item?.author?._id, userData?._id]);

  const handleFollowPress = async () => {
    const userId = item?.author?._id;
    if (!userId || isOwner) return;

    const currentlyFollowing = isFollowingUser;
    try {
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
        await del(`relationships/unfollow/${userId}`);
        ToastMessage(`Unfollowed ${authorName}`);
      } else {
        await post(`relationships/follow/${userId}`);
        ToastMessage(`You are now following ${authorName}`, "success");
      }
    } catch (error) {
      console.log("Error following/unfollowing:", error);
      dispatch(setUserData(userData));
    }
  };

  const handleDeletePost = async () => {
    if (!item?._id) return;
    try {
      const response = await del(`posts/${item._id}`);
      if (response?.data?.success) {
        ToastMessage("Post deleted successfully", "success");
        navigation.goBack();
      } else {
        ToastMessage(
          response?.data?.message || "Failed to delete post",
          "error",
        );
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      ToastMessage("Error deleting post", "error");
    }
  };

  const [keyboardHeight] = useState(new Animated.Value(0));
  const inputRef = useRef(null);

  // Get logged-in user data

  // Noto animated emoji list
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

  const handleEmojiPress = (emojiChar) => {
    setCommentText((prev) => (prev || "") + emojiChar);
    inputRef.current?.focus();
  };

  const formatCount = useCallback((count) => {
    if (!count || count === 0) return "0";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  }, []);

  const fetchData = useCallback(
    async (sortParam = sortBy) => {
      if (!postId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [postRes, commentsRes] = await Promise.all([
          get(`posts/${postId}`),
          get(`posts/${postId}/comment?sort=${sortParam}`),
        ]);

        if (postRes?.data?.success) {
          setItem(postRes.data.data);
        } else {
          setError("Failed to fetch post details");
        }

        if (commentsRes?.data?.success && commentsRes?.data?.data?.comments) {
          setComments(commentsRes.data.data?.comments);
        } else {
          // comments might be empty, but success should be true
          setComments([]);
        }
      } catch (err) {
        console.error("fetchData error", err);
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [postId, sortBy],
  );

  const fetchComments = useCallback(
    async (sortParam = sortBy) => {
      if (!postId) return;
      try {
        const response = await get(`posts/${postId}/comment?sort=${sortParam}`);
        if (response?.data?.success && response?.data?.data?.comments) {
          setComments(response.data.data?.comments);
        }
      } catch (err) {
        console.error("fetchComments error", err);
      }
    },
    [postId, sortBy],
  );

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
    fetchData();
  }, [fetchData]);

  // Keyboard listeners (same as CommentScreen)
  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShow = Keyboard.addListener(keyboardShowEvent, (event) => {
      Animated.timing(keyboardHeight, {
        duration: event.duration,
        toValue: event.endCoordinates.height,
        useNativeDriver: false,
      }).start();
    });

    const keyboardHide = Keyboard.addListener(keyboardHideEvent, (event) => {
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
  }, [keyboardHeight]);

  const handleReply = useCallback((comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingComment(null);
    setCommentText("");
  }, []);

  const handleImagePick = useCallback(() => {
    setShowImagePicker(true);
  }, []);

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

  const handleRemoveImage = useCallback(() => {
    setSelectedImageUrl(null);
  }, []);

  const handleViewProfile = useCallback(
    (user) => {
      navigation.navigate("UserProfile", { userId: user?._id || user?.id });
    },
    [navigation],
  );

  const handleSendMessage = useCallback(
    (user) => {
      navigation.navigate("InboxScreen", {
        recipientId: user?._id || user?.id,
        recipientName: `${user?.firstName || ""} ${
          user?.lastName || ""
        }`.trim(),
        otherUser: user,
      });
    },
    [navigation],
  );

  const handleEditComment = useCallback((comment) => {
    setEditingComment(comment);
    setCommentText(comment?.comment || "");
    inputRef.current?.focus();
  }, []);

  const handleDeleteComment = useCallback(
    async (comment) => {
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
    },
    [item, comments],
  );

  const handleSendComment = useCallback(async () => {
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
    const currentEditingComment = editingComment;
    const currentImageUrl = selectedImageUrl;
    const tempId = Date.now().toString();

    // Check if it's a single emoji to send the Lottie link
    const matchingEmoji = emojiData.find((e) => e.char === currentCommentText);
    const finalCommentContent = matchingEmoji
      ? matchingEmoji.url
      : currentCommentText;

    // Handle Edit Case
    if (currentEditingComment) {
      try {
        setIsSubmitting(true);
        const response = await put(
          `posts/${item._id}/comment/${currentEditingComment._id}`,
          {
            comment: finalCommentContent,
          },
        );

        if (response?.data?.success && response?.data?.data) {
          // Merge existing user data with updated comment to avoid data loss
          const updatedComment = {
            ...response.data.data,
            user: {
              ...(currentEditingComment?.user || {}),
              ...(response.data.data?.user || {}),
            },
          };

          setComments((prev) =>
            prev.map((c) => {
              if (c._id === currentEditingComment._id) return updatedComment;
              if (c.replies?.length > 0) {
                return {
                  ...c,
                  replies: c.replies.map((r) =>
                    r._id === currentEditingComment._id ? updatedComment : r,
                  ),
                };
              }
              return c;
            }),
          );

          ToastMessage("Comment updated successfully");
          setEditingComment(null);
          setCommentText("");
          Keyboard.dismiss();
        } else {
          ToastMessage("Failed to update comment", "error");
        }
      } catch (error) {
        console.error("Error updating comment:", error);
        ToastMessage("Error updating comment", "error");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Optimistic Comment Object for New Comment/Reply
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

    // Update UI immediately (Optimistic)
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
        rollback();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
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
  }, [
    commentText,
    item,
    isSubmitting,
    replyingTo,
    userData,
    editingComment,
    emojiData,
    selectedImageUrl,
    isUploadingImage,
  ]);

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
      // Optionally sync state if API returns something unexpected
      if (!res?.data?.success) {
        setComments(previousComments);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error liking comment:", error);
      setComments(previousComments);
    }
  };

  const handleCommentPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Handle hide specific comment
  const handleHideComment = async (comment) => {
    if (!comment?._id) return;
    try {
      const response = await post("hide/comment", { commentId: comment._id });
      if (response?.data?.success) {
        console.log("res-----", response.data);

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

  const handlePinComment = async (comment) => {
    const postId = item?._id;
    const commentId = comment?._id;
    if (!postId || !commentId) return;
    try {
      const response = await put(`posts/${postId}/comment/${commentId}`, {
        isPinned: true,
        comment: comment.comment,
      });
      if (response?.data?.success) {
        setComments((prev) => {
          const others = prev.filter((c) => c._id !== commentId);
          const pinned = { ...comment, isPinned: true };
          return [pinned, ...others];
        });
      }
    } catch (error) {
      console.error("Error pinning comment:", error);
    }
  };

  console.log("ityem======>", item?.topComment);

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      statusBarColor={colors.background}
      scrollEnabled
      headerUnScrollable={() => {
        if (!item && loading) return null;
        return (
          <View style={styles.rowBetween}>
            {/* Left Section */}
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() =>
                  navigation.canGoBack()
                    ? navigation.goBack()
                    : navigation.reset({
                        index: 0,
                        routes: [{ name: "MainStack" }],
                      })
                }
                style={styles.backButton}
              >
                <Image
                  source={Images.back}
                  style={{ height: 24, width: 24, tintColor: colors.text }}
                />
              </TouchableOpacity>
              <View
                style={{
                  padding: 4,
                  borderColor: profileColor,
                  borderWidth: 2,
                  borderRadius: 99,
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("UserProfile", { userId: author?._id })
                  }
                  style={styles.avatar}
                >
                  {author?.profile?.avatar ? (
                    <ImageFast
                      source={{ uri: author.profile.avatar }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 99,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 99,
                        backgroundColor: profileColor,
                      }}
                    />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <CustomText label={displayName} />
                  <UserBadge user={author} style={{ marginLeft: 4 }} />
                </View>
                <CustomText label={`${username}`} color={colors.textSecondary} />
              </View>
            </View>

            {/* Right Section */}
            <View
              style={[
                styles.row,
                {
                  width: !isOwner && "28%",
                  justifyContent: "flex-end",
                },
              ]}
            >
              {!isOwner && (
                <CustomButton
                  title={isFollowingUser ? "Following" : "Follow"}
                  width={isFollowingUser ? "80%" : "64%"}
                  onPress={handleFollowPress}
                  height={32}
                  borderRadius={8}
                  fontSize={14}
                  backgroundColor={colors.surfaceAlt}
                  color={colors.text}
                />
              )}
              <TouchableOpacity onPress={() => setShowModal(true)}>
                <Image source={Images.moreIcon} style={[styles.moreIcon, { tintColor: colors.text }]} />
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
      footerUnScrollable={() =>
        item?.privacy?.comment && (
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
            <View>
              {/* Reply Indicator */}
              {replyingTo && (
                <BlurView
                  style={styles.replyBlur}
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
                    <Animated.View>
                      <Icons
                        name="x"
                        family="Feather"
                        size={16}
                        color={colors.textSecondary}
                        onPress={handleCancelReply}
                      />
                    </Animated.View>
                  </View>
                </BlurView>
              )}

              {/* Editing Indicator */}
              {editingComment && (
                <BlurView
                  style={styles.replyBlur}
                  blurType={isDark ? "extraDark" : "light"}
                  blurAmount={3}
                  reducedTransparencyFallbackColor={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                >
                  <View style={styles.replyIndicator}>
                    <View style={styles.replyIndicatorLeft}>
                      <Icons
                        name="edit-3"
                        family="Feather"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <CustomText
                        label="Editing comment "
                        fontSize={12}
                        color={colors.textSecondary}
                        marginLeft={6}
                      />
                    </View>
                    <Animated.View>
                      <Icons
                        name="x"
                        family="Feather"
                        size={16}
                        color={colors.textSecondary}
                        onPress={handleCancelEdit}
                      />
                    </Animated.View>
                  </View>
                </BlurView>
              )}

              {/* Input Container */}
              <View style={styles.inputRow}>
                <Image
                  source={Images.CommentEmojie}
                  style={{ height: 44, width: 44, marginRight: 6 }}
                />
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
                    ((!commentText?.trim() && !selectedImageUrl) ||
                      isSubmitting) &&
                      styles.sendBtnDisabled,
                  ]}
                  disabled={
                    (!commentText?.trim() && !selectedImageUrl) || isSubmitting
                  }
                >
                  <Blur blurAmount={12} blurType={isDark ? "dark" : "light"} />
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

              <BlurView
                style={{
                  position: "absolute",
                  height: 125,
                  bottom: -30,
                  zIndex: -1,
                  width: "120%",
                  left: -10,
                  right: -10,
                }}
                blurType={isDark ? "dark" : "light"}
                blurAmount={1}
                reducedTransparencyFallbackColor={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiStripContent}
              >
                {emojiData?.map((emoji, index) => (
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
          </Animated.View>
        )
      }
    >
      <View style={[styles.container, {}]}>
        {loading && !item ? (
          <View style={{ flex: 1 }}>
            <PostCardSkeleton />
            <View style={{ marginTop: 20 }}>
              {[1, 2, 3].map((i) => (
                <CommentSkeleton key={i} />
              ))}
            </View>
          </View>
        ) : item ? (
          <>
            <PostCard
              disableGesture
              isChange={false}
              item={item}
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
              upvotes={item?.upvotes || []}
              downvotes={item?.downvotes || []}
              onCommentPress={handleCommentPress}
              isBack
              cardPress={false}
              showHeader={false}
              isDetail
            />

            {/* Comments header */}
            <View style={styles.commentsHeader}>
              <CustomText
                fontFamily={fonts.semiBold}
                label={`${comments.length || 0} Comment${
                  comments.length !== 1 ? "s" : ""
                }`}
                fontSize={20}
                lineHeight={20 * 1.4}
                color={colors.text}
              />
            </View>

            {/* Comments list */}
            <View style={styles.commentsContainer}>
              <CommentModal
                marginBottom={40}
                comments={comments}
                loading={loading}
                post={item}
                onReply={handleReply}
                onLike={handleLikeReaction}
                userData={userData}
                onTabChange={handleTabChange}
                currentTab={
                  sortBy === "mostLiked"
                    ? 0
                    : sortBy === "mostRecent"
                    ? 1
                    : null
                }
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                onViewProfile={handleViewProfile}
                onSendMessage={handleSendMessage}
                onHideComment={handleHideComment}
                onHideUserComments={handleHideUserComments}
                isBottomSheet={false}
                onReportComment={(comment) => {
                  console.log("Report comment", comment);
                  ToastMessage("Comment reported");
                }}
              />
              {error && (
                <CustomText
                  label={error}
                  fontSize={14}
                  color={COLORS.subtitle}
                  marginTop={8}
                />
              )}
            </View>
          </>
        ) : (
          <View
            style={{
              height: 400,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CustomText
              label={error || "Post not found"}
              color={colors.text}
            />
          </View>
        )}

        {/* Input Container (from CommentScreen) */}
        <UploadImageCustom
          imageModal={showImagePicker}
          setImageModal={setShowImagePicker}
          handleChange={handleImageSelected}
          handleCapture={handleImageSelected}
          onDelete={() => {}}
        />
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
            handleDeletePost();
          }}
          //   onHidePost={onHidePost}
          //   onHideUserPosts={onHideUserPosts}
        />
      </View>
    </ScreenWrapper>
  );
};

export default DetailPageWithId;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 50,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  commentsContainer: {
    flex: 1,
  },
  inputContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 999,
    backgroundColor: "transparent",
  },
  replyBlur: {
    backgroundColor: "transparent",
    borderRadius: 12,
    marginBottom: 4,
  },
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
    overflow: "hidden",
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

  rowBetween: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
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
  backButton: {
    borderRadius: 99,
    backgroundColor: colors.surfaceAlt,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
