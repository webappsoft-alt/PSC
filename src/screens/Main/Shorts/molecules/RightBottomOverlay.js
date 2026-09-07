import {
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useState, useEffect } from "react";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import CustomText from "../../../../components/CustomText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "@react-native-community/blur";
import { useSelector } from "react-redux";
import { post } from "../../../../services/ApiRequest";
import { ToastMessage } from "../../../../utils/ToastMessage";

const RightBottomOverlay = ({
  item,
  onCommentPress,
  onSharePress,
  onVoteUpdate,
  localCommentCount,
}) => {
  const insets = useSafeAreaInsets();
  const userData = useSelector((state) => state.users.userData);

  // Reaction state
  const [localUpvotes, setLocalUpvotes] = useState(item?.upvotes || []);
  const [isVoting, setIsVoting] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  useEffect(() => {
    setLocalUpvotes(item?.upvotes || []);
  }, [item?.upvotes]);

  const hasUpvoted = useCallback(() => {
    return localUpvotes.some((vote) => vote.userId === userData?._id);
  }, [localUpvotes, userData]);

  const handleLike = async () => {
    if (isVoting || !item?._id) return;

    setIsVoting(true);
    const currentlyUpvoted = hasUpvoted();

    // Optimistic UI update
    if (currentlyUpvoted) {
      setLocalUpvotes((prev) =>
        prev.filter((vote) => vote.userId !== userData?._id),
      );
    } else {
      setLocalUpvotes((prev) => [
        ...prev,
        { userId: userData?._id, reaction: "upvote" },
      ]);
    }

    try {
      const response = await post(`posts/${item._id}/reaction`, {
        reaction: "upvote",
      });

      if (response?.data?.success) {
        if (onVoteUpdate) onVoteUpdate();
      } else {
        // Revert on failure
        setLocalUpvotes(item?.upvotes || []);
        ToastMessage("Failed to update reaction", "error");
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
      setLocalUpvotes(item?.upvotes || []);
      ToastMessage("Failed to update reaction", "error");
    } finally {
      setIsVoting(false);
    }
  };

  const handleRepost = async () => {
    if (isReposting || !item?._id) return;

    setIsReposting(true);

    try {
      const payload = {
        type: "reel",
        description: item?.description || [],
        video: item?.video,
        topic: item?.topic || "Technology",
        hashtags: item?.hashtags || [],
        ageRating: item?.ageRating || 14,
        mentions: item?.mentions || [],
        availableTo: item?.availableTo || ["public"],
        duration: item?.duration,
        parentPostId: item?._id,
      };

      const response = await post("posts", payload);

      if (
        response?.data?.success ||
        response?.status === 200 ||
        response?.status === 201
      ) {
        ToastMessage("Reel reposted successfully", "success");
      } else {
        const errorMsg =
          response?.data?.message ||
          response?.message ||
          "Failed to repost reel";
        ToastMessage(errorMsg, "error");
      }
    } catch (error) {
      console.error("Repost error:", error);
      ToastMessage("An error occurred during repost", "error");
    } finally {
      setIsReposting(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const textColor = "rgba(255, 255, 255, 0.64)";

  // Derived count based on optimistic update
  const upvotesCount =
    (item.upvotesCount || 0) +
    (hasUpvoted()
      ? item?.upvotes?.some((v) => v.userId === userData?._id)
        ? 0
        : 1
      : item?.upvotes?.some((v) => v.userId === userData?._id)
      ? -1
      : 0);

  // Use local comment count if available, otherwise fall back to item count
  const displayedCommentCount =
    localCommentCount !== undefined
      ? localCommentCount
      : item.commentsCount || item.comments || 0;

  return (
    <View style={[styles.rightOverlay, { bottom: insets.bottom + 100 }]}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={
          item?.privacy?.share == false
            ? () =>
                ToastMessage("User has disabled share on this post", "error")
            : onSharePress
        }
      >
        <BlurView blurType="light" blurAmount={16} style={styles.blurStyle} />
        <Icons
          name="ios-share"
          size={20}
          color={COLORS.white}
          family={"MaterialIcons"}
        />
      </TouchableOpacity>
      <CustomText
        label={formatNumber(item.sharesCount || item.shares || 0)}
        fontSize={12}
        fontWeight="500"
        color={textColor}
        marginBottom={5}
        marginTop={4}
      />

      <TouchableOpacity
        style={styles.actionButton}
        onPress={
          item?.privacy?.repost == false
            ? () =>
                ToastMessage("User has disabled repost on this post", "error")
            : handleRepost
        }
        disabled={isReposting}
      >
        <BlurView blurType="light" blurAmount={16} style={styles.blurStyle} />
        {isReposting ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Icons
            name="repeat"
            size={20}
            color={COLORS.white}
            family={"MaterialIcons"}
          />
        )}
      </TouchableOpacity>
      <CustomText
        label={formatNumber(item.repostsCount || item.reposts || 0)}
        fontSize={12}
        fontWeight="500"
        color={textColor}
        marginTop={4}
        marginBottom={5}
      />
      <TouchableOpacity
        style={styles.actionButton}
        onPress={
          item?.privacy?.comment == false
            ? () =>
                ToastMessage("User has disabled comment on this post", "error")
            : onCommentPress
        }
      >
        <BlurView blurType="light" blurAmount={32} style={styles.blurStyle} />
        <Icons
          name="chat-bubble-outline"
          size={20}
          color={COLORS.white}
          family={"MaterialIcons"}
        />
      </TouchableOpacity>
      <CustomText
        label={formatNumber(displayedCommentCount)}
        fontSize={12}
        fontWeight="500"
        color={textColor}
        marginTop={4}
        marginBottom={5}
      />

      <TouchableOpacity
        style={styles.actionButton}
        onPress={
          !item?.privacy?.upvote
            ? () =>
                ToastMessage("User has disabled upvoting on this post", "error")
            : handleLike
        }
      >
        <BlurView blurType="light" blurAmount={16} style={styles.blurStyle} />
        <Icons
          name={hasUpvoted() ? "favorite" : "favorite-border"}
          size={20}
          color={hasUpvoted() ? COLORS.red : COLORS.white}
          family={"MaterialIcons"}
        />
      </TouchableOpacity>
      <CustomText
        label={formatNumber(upvotesCount)}
        fontSize={12}
        fontWeight="500"
        color={COLORS.white}
        marginTop={4}
        marginBottom={26}
      />
    </View>
  );
};

export default RightBottomOverlay;

const styles = StyleSheet.create({
  rightOverlay: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    zIndex: 20,
  },
  actionButton: {
    alignItems: "center",
    height: 40,
    width: 40,
    borderRadius: 99,
    justifyContent: "center",
    overflow: "hidden",
  },
  blurStyle: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
