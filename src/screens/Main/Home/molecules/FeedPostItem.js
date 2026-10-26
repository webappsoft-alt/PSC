import moment from "moment/moment";
import { memo, useCallback, useMemo } from "react";
import { View } from "react-native";

import { COLORS } from "../../../../utils/COLORS";
import PostCard from "./PostCard";

/**
 * One feed post (PostCard + 1pt #262626 separator), shared by the Home feed
 * and the profile Posts / Reposts / Mentions / Replies / Liked / Saved lists.
 */
const FeedPostItem = memo(
  ({
    post,
    shouldPlay,
    formatCount,
    onOpenComments,
    onDeletePress,
    onEditPress,
    onHidePost,
    onHideUserPosts,
    topicPostsCount,
  }) => {
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
    const likesCount = post?.stats?.upvotes || 0;
    const commentsCount = post?.stats?.comments || 0;
    const repostsCount = post?.stats?.reposts || 0;
    const savedCount = post?.stats?.saved || 0;
    const stats = post?.stats || {};
    const createdAt = post?.createdAt || "";
    const timeAgo = useMemo(() => moment(createdAt).fromNow(), [createdAt]);

    const commentPayload = useMemo(
      () => ({
        displayName,
        username,
        description,
        likesCount,
        commentsCount,
        repostsCount,
        timeAgo,
        images,
      }),
      [
        commentsCount,
        description,
        displayName,
        images,
        likesCount,
        repostsCount,
        timeAgo,
        username,
      ],
    );

    const handleOpenComments = useCallback(() => {
      onOpenComments(post, commentPayload);
    }, [commentPayload, onOpenComments, post]);

    const handleDelete = useCallback(() => {
      onDeletePress(post?._id);
    }, [onDeletePress, post?._id]);

    const handleEdit = useCallback(() => {
      onEditPress(post);
    }, [onEditPress, post]);

    const handleHidePost = useCallback(() => {
      onHidePost(post?._id);
    }, [onHidePost, post?._id]);

    const handleHideUserPosts = useCallback(() => {
      onHideUserPosts(author?._id);
    }, [author?._id, onHideUserPosts]);

    return (
      <>
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
          upvotes={post?.upvotes || []}
          downvotes={post?.downvotes || []}
          savedCount={savedCount}
          profileColor={profileColor}
          onCommentPress={handleOpenComments}
          onDeletePress={handleDelete}
          onEditPress={handleEdit}
          onHidePost={handleHidePost}
          onHideUserPosts={handleHideUserPosts}
          item={post}
          onSwipeRight={handleOpenComments}
          shouldPlay={shouldPlay}
          topicPostsCount={topicPostsCount}
        />
        <View style={{ height: 1, backgroundColor: COLORS.authHeader }} />
      </>
    );
  },
);

export default FeedPostItem;
