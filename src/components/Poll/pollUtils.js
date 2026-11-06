import { useCallback, useEffect, useRef, useState } from "react";

import { useSocket } from "../SocketProvider";
import { post } from "../../services/ApiRequest";
import { ToastMessage } from "../../utils/ToastMessage";

/* ───────────────────────── formatting ───────────────────────── */

const trimZero = (v) => v.replace(/\.0$/, "");

// Feed meta row (Figma "64.2K votes")
export const formatVotesShort = (n = 0) => {
  if (n < 1000) return `${n}`;
  if (n < 1000000) return `${trimZero((n / 1000).toFixed(1))}K`;
  return `${trimZero((n / 1000000).toFixed(1))}M`;
};

// Alert meta row (Figma "2,275 votes")
export const formatVotesFull = (n = 0) =>
  `${Math.max(0, Math.round(n))}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const votesLabel = (n = 0, full = false) =>
  `${full ? formatVotesFull(n) : formatVotesShort(n)} vote${n === 1 ? "" : "s"}`;

// Option row voters count (Figma "+1.4k", "+0.3k")
export const formatOptionVotes = (n = 0) => {
  if (n < 100) return `+${n}`;
  if (n < 1000000) return `+${(n / 1000).toFixed(1)}k`;
  return `+${(n / 1000000).toFixed(1)}M`;
};

const plural = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/**
 * Time left until the poll closes.
 *  feed  → "240 days remaining."   alert → "22 hours left"
 * Returns "" for an open-ended poll.
 */
export const pollTimeLeft = (endsAt, variant = "feed") => {
  if (!endsAt) return "";
  const diff = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(diff)) return "";
  if (diff <= 0) return variant === "feed" ? "Poll closed." : "Poll closed";
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const span =
    days >= 1
      ? plural(days, "day")
      : hours >= 1
      ? plural(hours, "hour")
      : plural(Math.max(1, minutes), "minute");
  return variant === "feed" ? `${span} remaining.` : `${span} left`;
};

export const isPollEnded = (poll) =>
  !!poll?.isEnded ||
  !!(poll?.endsAt && new Date(poll.endsAt).getTime() <= Date.now());

export const isPollPost = (item) =>
  Array.isArray(item?.poll?.options) && item.poll.options.length > 0;

/* ───────────────────────── live state ───────────────────────── */

// Latest known poll per post, so a card that re-mounts (list recycling,
// detail page, alert) shows the vote / live counts it already received.
const pollCache = new Map();

const withPercents = (poll) => {
  const total = poll?.totalVotes || 0;
  return {
    ...poll,
    options: (poll?.options || []).map((o) => ({
      ...o,
      votesCount: o.votesCount || 0,
      percent: total > 0 ? Math.round(((o.votesCount || 0) / total) * 100) : 0,
    })),
  };
};

const useSafeSocket = () => {
  try {
    return useSocket()?.socket || null;
  } catch (e) {
    return null;
  }
};

/**
 * Poll state for one post: initial data from the API, live counts from the
 * "poll_update" socket event, and an optimistic vote() that syncs with the
 * server (POST posts/:id/poll/vote).
 */
export const usePollState = (postId, serverPoll) => {
  const socket = useSafeSocket();
  const [poll, setPoll] = useState(() =>
    withPercents(pollCache.get(postId) || serverPoll || {}),
  );
  const [voting, setVoting] = useState(false);
  const firstRender = useRef(true);

  // A refetch (pull to refresh / detail fetch) is authoritative
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (!pollCache.has(postId) && serverPoll) pollCache.set(postId, serverPoll);
      return;
    }
    if (serverPoll) {
      pollCache.set(postId, serverPoll);
      setPoll(withPercents(serverPoll));
    }
  }, [serverPoll, postId]);

  useEffect(() => {
    if (!socket || !postId) return undefined;
    const onUpdate = (data) => {
      if (!data || String(data.postId) !== String(postId)) return;
      setPoll((prev) => {
        const byId = new Map(
          (data.options || []).map((o) => [String(o._id), o]),
        );
        const next = withPercents({
          ...prev,
          totalVotes: data.totalVotes ?? prev.totalVotes,
          endsAt: data.endsAt ?? prev.endsAt,
          options: (prev.options || []).map((o) => {
            const u = byId.get(String(o._id));
            return u ? { ...o, votesCount: u.votesCount } : o;
          }),
        });
        pollCache.set(postId, next);
        return next;
      });
    };
    socket.on("poll_update", onUpdate);
    return () => socket.off("poll_update", onUpdate);
  }, [socket, postId]);

  const vote = useCallback(
    async (optionId) => {
      if (!postId || !optionId || voting) return;
      const previous = poll;
      if (String(previous?.myVote) === String(optionId)) return;
      if (isPollEnded(previous)) return;

      // optimistic: move / add the viewer's vote
      const hadVote = !!previous?.myVote;
      const optimistic = withPercents({
        ...previous,
        myVote: String(optionId),
        totalVotes: (previous.totalVotes || 0) + (hadVote ? 0 : 1),
        options: previous.options.map((o) => {
          if (String(o._id) === String(optionId)) {
            return { ...o, votesCount: (o.votesCount || 0) + 1 };
          }
          if (hadVote && String(o._id) === String(previous.myVote)) {
            return { ...o, votesCount: Math.max(0, (o.votesCount || 0) - 1) };
          }
          return o;
        }),
      });
      setPoll(optimistic);
      setVoting(true);
      try {
        const res = await post(`posts/${postId}/poll/vote`, { optionId });
        const serverResult = res?.data?.data?.poll;
        if (res?.data?.success && serverResult) {
          const next = withPercents(serverResult);
          pollCache.set(postId, next);
          setPoll(next);
        } else {
          setPoll(previous);
          ToastMessage(res?.data?.message || "Couldn't save your vote", "error");
        }
      } catch (e) {
        setPoll(previous);
        ToastMessage(
          e?.response?.data?.message || "Couldn't save your vote",
          "error",
        );
      } finally {
        setVoting(false);
      }
    },
    [postId, poll, voting],
  );

  return { poll, vote, voting };
};
