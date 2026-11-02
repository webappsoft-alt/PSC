import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { del, post } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { ToastMessage } from "../../../../utils/ToastMessage";

/** Follow / unfollow a creator — same flow and Redux sync as PostCard. */
const useFollowAuthor = (author) => {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.users.userData);
  const authorId = author?._id;
  const isOwner = !!authorId && authorId === userData?._id;

  const isFollowing = useMemo(() => {
    if (!authorId) return false;
    if (userData?.stats?.following) {
      return userData.stats.following.includes(authorId);
    }
    return author?.stats?.followers?.includes(userData?._id) || false;
  }, [author?.stats?.followers, authorId, userData]);

  const toggleFollow = useCallback(async () => {
    if (!authorId || isOwner || !userData) return;
    const wasFollowing = isFollowing;
    const following = userData?.stats?.following || [];
    dispatch(
      setUserData({
        ...userData,
        stats: {
          ...userData.stats,
          following: wasFollowing
            ? following.filter((id) => id !== authorId)
            : [...following, authorId],
        },
      }),
    );
    try {
      const name = author?.firstName || "User";
      if (wasFollowing) {
        await del(`relationships/unfollow/${authorId}`);
        ToastMessage(`Unfollowed ${name}`);
      } else {
        await post(`relationships/follow/${authorId}`);
        ToastMessage(`You are now following ${name}`, "success");
      }
    } catch (error) {
      console.log("Follow toggle error:", error);
      dispatch(setUserData(userData));
    }
  }, [author?.firstName, authorId, dispatch, isFollowing, isOwner, userData]);

  return { isOwner, isFollowing, toggleFollow, me: userData };
};

export default useFollowAuthor;
