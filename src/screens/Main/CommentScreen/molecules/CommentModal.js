import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useState, useEffect, useRef } from "react";
import {
  FlatList as RNFlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import LottieView from "lottie-react-native";
import { patch, put } from "../../../../services/ApiRequest";

import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";

import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import { COLORS } from "../../../../utils/COLORS";
import Divider from "../../../../components/Divider";
import moment from "moment/moment";
import CommentOption from "./CommentOption";
import ImageFast from "../../../../components/ImageFast";
import CommentSkeleton from "../../Home/molecules/CommentSkeleton";
import { FlashList } from "@shopify/flash-list";
import { useTheme } from "../../../../contexts/ThemeContext";

const GRAY_COLOR = "rgba(255, 255, 255, 0.64)";

const hasLikedReaction = (reactions, userId) => {
  if (!Array.isArray(reactions) || !userId) return false;
  return reactions.some((reaction) => {
    if (!reaction) return false;
    if (typeof reaction === "string" || typeof reaction === "number") {
      return String(reaction) === String(userId);
    }
    const reactionUserId =
      reaction?.user?._id ??
      reaction?.user?.id ??
      reaction?.userId ??
      reaction?._id ??
      reaction?.id;
    const reactionType = reaction?.reaction ?? "like";
    return (
      String(reactionUserId ?? "") === String(userId) &&
      String(reactionType).toLowerCase() === "like"
    );
  });
};

const CommentItem = ({ item, onReply, onLongPress, onLike, userData }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [showReplies, setShowReplies] = useState(false);
  const replies = item?.replies || [];
  const hasReplies = replies.length > 0;

  const profileColor = item?.user?.profile?.profileColor;
  const isLiked = hasLikedReaction(item?.reactions, userData?._id);

  return (
    <TouchableOpacity
      style={styles.commentContainer}
      activeOpacity={0.7}
      onLongPress={() => onLongPress(item)}
    >
      {/* User Info Row */}
      <View style={styles.userRow}>
        <View style={styles.leftSection}>
          {item?.user?.profile?.avatar ? (
            <ImageFast
              source={{ uri: item.user.profile.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: profileColor }]} />
          )}

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              {/* Figma: Medium 14 / −0.5% · 3×3 dot white 16% · username */}
              <CustomText
                label={item?.user?.firstName}
                fontSize={14}
                lineHeight={18}
                letterSpacing={-0.07}
                color={colors.text}
                fontFamily={fonts.medium}
              />
              <View
                style={{
                  height: 3,
                  width: 3,
                  borderRadius: 99,
                  backgroundColor: "rgba(255, 255, 255, 0.16)",
                }}
              />
              <View style={styles.authorBadge}>
                {/* Figma: chip h20 pad H6 r100 white 4%; Regular 12 −0.5% @64% */}
                <CustomText
                  label={item?.user?.username?.toLowerCase()}
                  fontSize={12}
                  lineHeight={16}
                  letterSpacing={-0.06}
                  color={GRAY_COLOR}
                />
              </View>
              {item?.isAuthor && (
                <CustomText
                  label="❤️ By author"
                  fontSize={12}
                  color={colors.text}
                />
              )}
            </View>
          </View>
        </View>
        <View style={styles.userRowRight}>
          {item?.isPinned && (
            <Image source={Images.commentPin} style={styles.pinnedIcon} />
          )}
          <CustomText
            label={moment(item?.createdAt).fromNow()}
            fontSize={12}
            lineHeight={16}
            letterSpacing={-0.06}
            color={GRAY_COLOR}
          />
        </View>
      </View>

      {/* Images if available */}
      {item?.images?.length > 0 && (
        <View style={styles.imagesRow}>
          {item?.images?.map((img) => (
            <View key={img?.id} style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                {img?.isGif && (
                  <View style={styles.gifBadge}>
                    <CustomText
                      label="GIF"
                      fontSize={16}
                      color={COLORS.white}
                      fontFamily={fonts.semiBold}
                    />
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Attachment image */}
      {item?.attachment?.type === "image" && (
        <View style={styles.attachmentRow}>
          <View style={styles.attachmentFrame}>
          <ImageFast
            isView
            source={{ uri: item.attachment.url }}
            style={styles.attachmentImage}
          />
          </View>
        </View>
      )}

      {/* Comment Text or Animated Emoji */}
      {item.comment?.startsWith(
        "https://fonts.gstatic.com/s/e/notoemoji/latest/"
      ) ? (
        <LottieView
          source={{ uri: item.comment }}
          autoPlay
          loop
          style={{ width: 40, height: 40, marginTop: 4 }}
        />
      ) : item?.comment ? (
        // Figma: Regular 14 / −1% white
        <CustomText
          label={item.comment}
          fontSize={14}
          lineHeight={20}
          letterSpacing={-0.14}
          color={colors.text}
          marginTop={8}
        />
      ) : null}

      {/* Action Row or Posting Status */}
      {item?.isPosting ? (
        <CustomText
          label="posting..."
          fontSize={12}
          color={colors.textSecondary}
          marginTop={4}
          marginBottom={8}
        />
      ) : (
        <>
          {/* Reply Text */}
          <TouchableOpacity onPress={() => onReply(item)}>
            <CustomText
              label="Reply"
              fontSize={14}
              lineHeight={20}
              letterSpacing={-0.14}
              color={GRAY_COLOR}
              marginBottom={8}
            />
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statsLeft}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => onLike && onLike(item)}
                activeOpacity={0.7}
              >
                <Icons
                  family={
                    isLiked
                      ? "MaterialSymbolsRoundedFilled"
                      : "MaterialSymbolsRounded"
                  }
                  name="favorite"
                  size={14}
                  color={isLiked ? COLORS.red : GRAY_COLOR}
                />
                {/* Figma: Medium 12 / −1% white */}
                <CustomText
                  label={`${(item?.stats?.likes || 0).toLocaleString()} like${
                    item.stats?.likes == 1 ? "" : "s"
                  }`}
                  fontSize={12}
                  lineHeight={16}
                  letterSpacing={-0.12}
                  color={isLiked ? COLORS.red : colors.text}
                  marginLeft={4}
                  fontFamily={fonts.medium}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => hasReplies && setShowReplies((prev) => !prev)}
                activeOpacity={hasReplies ? 0.7 : 1}
                disabled={!hasReplies}
              >
                <Icons
                  family="MaterialSymbolsRounded"
                  name="chat_bubble"
                  size={14}
                  color={GRAY_COLOR}
                />
                <CustomText
                  label={`${(item?.stats?.replies || 0).toLocaleString()} replies`}
                  fontSize={12}
                  lineHeight={16}
                  letterSpacing={-0.12}
                  color={colors.text}
                  fontFamily={fonts.medium}
                  marginLeft={4}
                />
              </TouchableOpacity>
            </View>
            {/* Figma: "Report" Regular 12 @64%, right — opens the comment
                options, where Report lives */}
            <CustomText
              label="Report"
              fontSize={12}
              lineHeight={16}
              letterSpacing={-0.06}
              color={GRAY_COLOR}
              onPress={() => onLongPress(item)}
            />
          </View>
        </>
      )}

      {showReplies && hasReplies && (
        <View style={styles.repliesWrapper}>
          {replies?.map((reply) => (
            <ReplyItem
              key={reply?._id || reply?.id}
              item={reply}
              onReply={onReply}
              onLike={onLike}
              userData={userData}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const ReplyItem = ({ item, onReply, onLike, userData }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const isLiked = hasLikedReaction(item?.reactions, userData?._id);

  return (
    <View style={styles.replyContainer}>
      <View style={styles.replyUserRow}>
        {item?.user?.profile?.avatar ? (
          <ImageFast
            source={{ uri: item.user.profile.avatar }}
            style={styles.replyAvatar}
          />
        ) : (
          <View
            style={[
              styles.replyAvatar,
              { backgroundColor: item?.user?.profile?.profileColor },
            ]}
          />
        )}
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={styles.replyHeader}>
            <CustomText
              label={item?.user?.firstName}
              fontSize={13}
              color={colors.text}
              fontFamily={fonts.medium}
            />
            <CustomText
              label={item?.user?.username?.toLowerCase()}
              fontSize={11}
              color={colors.textSecondary}
              marginLeft={6}
            />
          </View>
          <CustomText
            label={moment(item?.createdAt).fromNow()}
            fontSize={11}
            color={colors.textSecondary}
            marginTop={2}
          />
        </View>
      </View>

      {/* Comment Text or Animated Emoji */}
      {item.comment?.startsWith(
        "https://fonts.gstatic.com/s/e/notoemoji/latest/"
      ) ? (
        <LottieView
          source={{ uri: item.comment }}
          autoPlay
          loop
          style={{ width: 40, height: 40, marginTop: 4 }}
        />
      ) : (
        <CustomText
          label={item?.comment}
          fontSize={13}
          color={colors.text}
          marginTop={6}
        />
      )}

      {/* Attachment image for reply */}
      {item?.attachment?.type === "image" && (
        <View style={styles.attachmentRow}>
          <View style={styles.attachmentFrame}>
          <ImageFast
            source={{ uri: item.attachment.url }}
            style={styles.attachmentImage}
          />
          </View>
        </View>
      )}

      {item?.isPosting ? (
        <CustomText
          label="posting..."
          fontSize={11}
          color={colors.textSecondary}
          marginTop={4}
        />
      ) : (
        <View style={[styles.statsRow, { marginTop: 8 }]}>
          <View style={styles.statsLeft}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => onLike && onLike(item)}
              activeOpacity={0.7}
            >
              <Image
                source={isLiked ? Images.heartFill : Images.whiteHeart}
                style={[styles.statIcon, { tintColor: colors.iconMuted }, isLiked && { tintColor: COLORS.red }]}
              />
              <CustomText
                label={`${item?.stats?.likes?.toLocaleString() || 0} likes`}
                fontSize={11}
                color={isLiked ? COLORS.red : colors.text}
                marginLeft={4}
                fontFamily={fonts.medium}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const CommentModal = ({
  comments: initialComments,
  loading = false,
  onReply,
  onLike,
  userData,
  post,
  onTabChange,
  currentTab = null,
  onEditComment,
  onDeleteComment,
  onViewProfile,
  onSendMessage,
  onReportComment,
  onHideComment,
  onHideUserComments,
  isBottomSheet = true,
  marginBottom,
  isBottom,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [tab, setTab] = useState(currentTab !== null ? currentTab : 0);
  const [comments, setComments] = useState(initialComments || []);
  const [isOptionModalVisible, setIsOptionModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const tabNames = ["Most likes", "Most recent"];
  const listRef = useRef(null);

  const handlePinComment = async (comment) => {
    const postId = post?._id;
    const commentId = comment?._id;
    if (!postId || !commentId) return;

    const newPinStatus = !comment.isPinned;

    try {
      const response = await put(`posts/${postId}/comment/${commentId}`, {
        isPinned: newPinStatus,
        comment: comment.comment,
      });

      if (response?.data?.success) {
        // Mutual exclusion: unpin all other comments if we are pinning a new one
        setComments((prev) => {
          let updatedComments = prev.map((c) => {
            if (c._id === commentId) {
              return { ...c, isPinned: newPinStatus };
            }
            // If we are pinning a new comment, unpin others
            if (newPinStatus && c.isPinned) {
              return { ...c, isPinned: false };
            }
            return c;
          });

          // If pinning, sort to bring pinned to the top
          if (newPinStatus) {
            const pinned = updatedComments.find((c) => c._id === commentId);
            const remaining = updatedComments.filter(
              (c) => c._id !== commentId
            );
            return [pinned, ...remaining];
          }

          return updatedComments;
        });
      }
    } catch (error) {
      console.error("Error pinning/unpinning comment:", error);
    }
  };

  // Handle tab change and notify parent component
  const handleTabChange = (newTab) => {
    if (onTabChange) {
      onTabChange(newTab);
    }
  };

  // Update local comments when prop changes
  useEffect(() => {
    const prevLength = comments.length;
    const nextLength = initialComments?.length || 0;
    setComments(initialComments || []);

    // Scroll to top if a new comment was added (length increased)
    if (nextLength > prevLength && prevLength > 0) {
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [initialComments]);

  // Sync tab state with parent's sortBy state
  useEffect(() => {
    if (currentTab !== null) {
      setTab(currentTab);
    } else {
      setTab(-1); // Set to -1 to show no tab selected
    }
  }, [currentTab]);

  const handleLongPress = (comment) => {
    setSelectedComment(comment);
    setIsOptionModalVisible(true);
  };

  const handleCloseOptionModal = () => {
    setIsOptionModalVisible(false);
    setSelectedComment(null);
  };

  return (
    <View style={[styles.container, { marginBottom: marginBottom }]}>
      {/* Top Tabs */}
      {/* Figma: tab 28 high, pad H10, r100; active white 4% + Medium 12
          white, inactive no fill + white 64% */}
      <View style={styles.sortTabs}>
        {tabNames.map((name, index) => {
          const active = tab === index;
          return (
            <TouchableOpacity
              key={name}
              activeOpacity={0.7}
              onPress={() => handleTabChange(index)}
              style={[
                styles.sortTab,
                active && { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <CustomText
                label={name}
                fontSize={12}
                lineHeight={16}
                fontFamily={fonts.medium}
                color={active ? colors.text : GRAY_COLOR}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <Divider marginVertical={12} thickness={1} color={colors.surfaceAlt} />

      {/* Comments List */}
      {isBottomSheet ? (
        <BottomSheetFlatList
          ref={listRef}
          data={comments}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => (
            <CommentItem
              item={item}
              onReply={onReply}
              onLongPress={handleLongPress}
              onLike={onLike}
              userData={userData}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: isBottom ? 550 : 30,
            },
          ]}
          ListEmptyComponent={
            loading ? (
              <View>
                {[1, 2, 3, 4, 5].map((i) => (
                  <CommentSkeleton key={i} />
                ))}
              </View>
            ) : (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <CustomText
                  label="No comments yet"
                  fontSize={16}
                  color={colors.textSecondary}
                />
              </View>
            )
          }
        />
      ) : (
        <FlashList
          ref={listRef}
          data={comments}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => (
            <CommentItem
              item={item}
              onReply={onReply}
              onLongPress={handleLongPress}
              onLike={onLike}
              userData={userData}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: isBottom ? 600 : 30,
              // backgroundColor: "red",
            },
          ]}
          ListEmptyComponent={
            loading ? (
              <View>
                {[1, 2, 3, 4, 5].map((i) => (
                  <CommentSkeleton key={i} />
                ))}
              </View>
            ) : (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <CustomText
                  label="No comments yet"
                  fontSize={16}
                  color={colors.textSecondary}
                />
              </View>
            )
          }
        />
      )}

      {/* Comment Options Modal */}
      <CommentOption
        isVisible={isOptionModalVisible}
        onClose={handleCloseOptionModal}
        displayName={selectedComment?.user?.firstName || "User"}
        username={selectedComment?.user?.username || "username"}
        userImage={selectedComment?.user?.profile?.avatar || null}
        profileColor={selectedComment?.user?.profile?.profileColor}
        commentText={selectedComment?.comment || ""}
        isVerified={selectedComment?.user?.isVerified}
        userData={userData}
        commentUserId={selectedComment?.user?._id}
        isPinned={selectedComment?.isPinned}
        onPinComment={() => {
          handleCloseOptionModal();
          handlePinComment(selectedComment);
        }}
        onReply={() => {
          handleCloseOptionModal();
          onReply && onReply(selectedComment);
        }}
        onViewProfile={() => {
          handleCloseOptionModal();
          onViewProfile && onViewProfile(selectedComment?.user);
        }}
        onSendMessage={() => {
          handleCloseOptionModal();
          onSendMessage && onSendMessage(selectedComment?.user);
        }}
        onHideComment={() => {
          handleCloseOptionModal();
          onHideComment && onHideComment(selectedComment);
        }}
        onHideUserComments={() => {
          handleCloseOptionModal();
          onHideUserComments && onHideUserComments(selectedComment?.user);
        }}
        onRemoveFriend={() => {
          console.log("Remove friend");
          handleCloseOptionModal();
        }}
        onReportComment={() => {
          handleCloseOptionModal();
          onReportComment && onReportComment(selectedComment);
        }}
        onEditComment={() => {
          handleCloseOptionModal();
          onEditComment && onEditComment(selectedComment);
        }}
        onWhoCanInteract={() => {
          console.log("Who can interact");
          handleCloseOptionModal();
        }}
        onDeleteComment={() => {
          handleCloseOptionModal();
          onDeleteComment && onDeleteComment(selectedComment);
        }}
      />
    </View>
  );
};

export default CommentModal;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  sortTabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  sortTab: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  commentContainer: {
    marginBottom: 12,
    paddingBottom: 12,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pinnedIcon: {
    width: 24,
    height: 24,
    tintColor: colors.text,
    resizeMode: "contain",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  // Figma: 16 × 16, r100
  avatar: {
    height: 16,
    width: 16,
    borderRadius: 100,
    backgroundColor: colors.surfaceAlt,
  },
  userInfo: {
    marginLeft: 4,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  authorBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 6,
    height: 20,
    justifyContent: "center",
    borderRadius: 100,
  },
  imagesRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  imageContainer: {
    width: 112,
    height: 112,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  gifBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  attachmentRow: {
    marginTop: 12,
    flexDirection: "row",
  },
  attachmentFrame: {
    width: 120,
    height: 120,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  attachmentImage: {
    width: 112,
    height: 112,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsLeft: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 14,
    height: 14,
    tintColor: COLORS.gray64,
  },
  repliesWrapper: {
    marginTop: 12,
    paddingLeft: 25,
    borderLeftWidth: 1,
    borderLeftColor: colors.surfaceAlt,
    gap: 12,
  },
  replyContainer: {
    paddingBottom: 8,
  },
  replyUserRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
});
