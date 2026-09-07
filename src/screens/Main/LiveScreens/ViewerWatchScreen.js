import { COLORS } from "../../../utils/COLORS";
import { get } from "../../../services/ApiRequest";
import {
  MeetingProvider,
  RTCView,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-native-sdk";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  Animated,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { ensureVideoSdkRegistered, getToken } from "../../../utils/videosdk";
import Blur from "../../../components/Blur";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { useSocket } from "../../../components/SocketProvider";
import { useTheme } from "../../../contexts/ThemeContext";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { Movie } from "../../../assets/svgs";
import Text from "../../../components/ScaledText";

const _originalConsoleError = console.error;
console.error = (...args) => {
  const joined = args.map((a) => String(a ?? "")).join(" ");
  if (
    joined.includes("Error fetching stats") &&
    joined.includes("InvalidStateError: closed")
  ) {
    return;
  }
  _originalConsoleError(...args);
};

const parseQuestion = (first) => {
  if (!first) return null;
  const questionText = String(first?.question ?? first?.text ?? "").trim();
  if (!questionText) return null;
  const user = first?.user ?? {};
  return {
    text: questionText,
    displayName:
      user?.displayName ??
      user?.name ??
      user?.fullName ??
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ??
      "Display Name",
    username: user?.username ? String(user.username) : "username",
    avatar:
      user?.profile?.avatar ??
      user?.avatar ??
      user?.profileImage ??
      user?.image ??
      null,
    createdAt:
      String(first?.createdAt ?? first?.created_at ?? "") ||
      new Date().toISOString(),
  };
};

const getAuthorMeta = (item, fallbackName) => {
  const author = item?.author ?? item?.user ?? {};
  const displayName =
    author?.profile?.displayName ||
    author?.displayName ||
    author?.name ||
    author?.fullName ||
    [author?.firstName, author?.lastName].filter(Boolean).join(" ") ||
    fallbackName ||
    "Display Name";
  const username =
    author?.username ||
    item?.username ||
    String(displayName || "username")
      .toLowerCase()
      .replace(/\s+/g, "");
  const avatar =
    author?.profile?.avatar ||
    author?.avatar ||
    author?.profileImage ||
    author?.image ||
    null;
  const isVerified =
    author?.profile?.isVerified ||
    author?.profile?.isPro ||
    author?.role === "company" ||
    author?.role === "individual";
  return { displayName, username, avatar, isVerified };
};

const reactionCountsFromItem = (item) => ({
  joyCount: Number(item?.joyCount ?? item?.hahaCount ?? 0),
  loveCount: Number(item?.likeCount ?? item?.loveCount ?? 0),
  smileCount: Number(item?.smileCount ?? 0),
  neutralCount: Number(item?.neutralCount ?? 0),
  sadCount: Number(item?.sadCount ?? 0),
  angryCount: Number(item?.angryCount ?? 0),
});

const likeInitialState = (item, currentUserId) => ({
  reactions: (item?.reactions || []).filter((r) => r.reaction === "like"),
  isLiked: (item?.reactions || []).some(
    (r) => r.reaction === "like" && r.user?._id === currentUserId,
  ),
  likeCount: Array.isArray(item?.reactions)
    ? item.reactions.filter((r) => r.reaction === "like").length
    : Number(item?.reactionsCount ?? 0),
});

const likeReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE": {
      const { alreadyLiked, userObj } = action;
      const newLikeCount = alreadyLiked
        ? Math.max(0, state.likeCount - 1)
        : state.likeCount + 1;
      return {
        reactions: alreadyLiked
          ? state.reactions.filter((r) => r.user?._id !== action.userId)
          : [{ reaction: "like", user: userObj }, ...state.reactions],
        isLiked: !alreadyLiked,
        likeCount: newLikeCount,
      };
    }
    case "REVERT":
      return action.prev;
    case "RESET":
      return likeInitialState(action.item, action.currentUserId);
    case "SET_COUNT":
      return { ...state, likeCount: action.count };
    default:
      return state;
  }
};

const PulsingConnectingText = ({ label = "Connecting..." }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.Text
      style={[
        { color: "#aaa", fontSize: 14, fontFamily: "Poppins_500Medium" },
        { opacity },
      ]}
    >
      {label}
    </Animated.Text>
  );
};

const getMeetingIdFromItem = (item) =>
  item?.meetingId ||
  item?.metadata?.roomId ||
  item?.roomId ||
  item?.liveId ||
  null;

const parseRouteItem = (value) => {
  if (!value) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractLiveStreams = (res) => {
  const payload = res?.data?.data ?? res?.data?.data?.data ?? res?.data;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(res?.data?.items)
    ? res.data.items
    : [];

  return list.filter((stream) => {
    const meetingId = getMeetingIdFromItem(stream);
    const isEnded = stream?.endedAt || stream?.status === "ended";
    if (!meetingId || isEnded || stream?.isDeleted) return false;
    if (typeof stream?.isLive === "boolean") return stream.isLive;
    return stream?.status === "active" || !stream?.status;
  });
};

const EmptyMeetingsView = ({ navigation, label = "No Live Stream" }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.emptyScreen, { backgroundColor: colors.background }]}>
      {/* <View style={[styles.topControls, { paddingTop: insets.top + 2 }]}>
        <View style={[styles.row, { gap: 12 }]}>
          <TouchableOpacity
            style={[styles.controlButton, { overflow: "hidden" }]}
            onPress={() => {
              navigation?.reset?.({
                index: 0,
                routes: [{ name: "TabStack" }],
              });
            }}
          >
            <Blur blurType="light" />
            <Image source={Images.back} style={{ height: 20, width: 20 }} />
          </TouchableOpacity>
          <CustomText
            label="Back"
            fontFamily="Poppins_600SemiBold"
            fontSize={20}
          />
        </View>
      </View> */}

      <View style={styles.emptyContainer}>
        <Movie
          height={80}
          width={80}
          color={colors.iconMuted}
          marginBottom={10}
        />
        <CustomText
          label={label}
          fontSize={32}
          fontFamily={fonts.BoldItalic}
          color={colors.text}
          marginTop={12}
          fontStyle={"italic"}
        />
        <CustomText
          label="There are no live meetings right now."
          fontFamily={fonts.medium}
          color={colors.textSecondary}
        />
      </View>
    </View>
  );
};

const ParticipantView = ({ participantId }) => {
  const { webcamStream, micStream, webcamOn, participant, consumeMicStreams } =
    useParticipant(participantId, {
      onStreamEnabled: () => {},
      onStreamDisabled: () => {},
    });

  const videoTrack = webcamStream?.track ?? null;
  const audioTrack = micStream?.track ?? null;
  const hostMicBroadcasting = participant?.micOn === true;

  const consumeMicRef = useRef(consumeMicStreams);
  consumeMicRef.current = consumeMicStreams;

  useEffect(() => {
    consumeMicRef.current();
  }, [participantId]);

  useEffect(() => {
    if (!micStream) return;
    try {
      hostMicBroadcasting ? micStream.resume() : micStream.pause();
    } catch {}
  }, [micStream, hostMicBroadcasting]);

  const streamURL = useMemo(() => {
    try {
      const tracks = [];
      if (webcamOn && videoTrack) tracks.push(videoTrack);
      if (hostMicBroadcasting && audioTrack) tracks.push(audioTrack);
      if (tracks.length === 0) return null;
      return new MediaStream(tracks).toURL();
    } catch {
      return null;
    }
  }, [webcamOn, videoTrack, hostMicBroadcasting, audioTrack]);

  if (streamURL) {
    return (
      <RTCView
        streamURL={streamURL}
        objectFit="cover"
        style={styles.video}
        zOrder={1}
      />
    );
  }
  return (
    <View style={styles.noVideo}>
      <Text style={styles.noVideoTxt}>No Hosted Video</Text>
    </View>
  );
};

const MeetingView = ({
  item,
  isTabBarVisible,
  meetingId,
  isScreenFocused = true,
  suppressOverlay = false,
}) => {
  const insets = useSafeAreaInsets();
  const { socket } = useSocket();

  const liveStreamId = item?._id ?? null;
  const liveStreamIdRef = useRef(liveStreamId);
  liveStreamIdRef.current = liveStreamId;

  const [hasJoined, setHasJoined] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLiveAskOpen, setIsLiveAskOpen] = useState(false);

  const userData = useSelector((state) => state?.users?.userData);
  const currentUserId = userData?.user?._id;

  const [likeState, dispatchLike] = useReducer(likeReducer, undefined, () =>
    likeInitialState(item, currentUserId),
  );

  const [liveReactionCounts, setLiveReactionCounts] = useState(() =>
    reactionCountsFromItem(item),
  );

  const [liveDonations, setLiveDonations] = useState(() => {
    const raw = item?.donations ?? item?.data?.donations ?? [];
    return Array.isArray(raw) ? raw : [];
  });

  const viewEmittedRef = useRef(false);
  const leaveEmittedRef = useRef(false);
  const liveEndedHandledRef = useRef(false);
  const liveEndedNavigateTimerRef = useRef(null);
  const liveQuestionHideTimerRef = useRef(null);
  const lastLiveMetaRefreshAtRef = useRef(0);

  const isMounted = useRef(true);
  const socketRef = useRef(socket);
  socketRef.current = socket;
  const joinRef = useRef(null);
  const leaveRef = useRef(null);
  const navigation = useNavigation();
  const hasInterceptedLeaveRef = useRef(false);

  // ─── OPT-8: emitView / emitLeave stable with useCallback ─────────────────
  const emitView = useCallback(() => {
    const s = socketRef.current;
    const id = liveStreamIdRef.current;
    if (!s || !id || viewEmittedRef.current) return;
    s.emit("liveStream:view", { liveStreamId: id }, () => {});
    viewEmittedRef.current = true;
  }, []);

  const emitLeave = useCallback(() => {
    const s = socketRef.current;
    const id = liveStreamIdRef.current;
    if (!s || !id || !viewEmittedRef.current || leaveEmittedRef.current) return;
    s.emit("liveStream:leave", { liveStreamId: id }, () => {});
    leaveEmittedRef.current = true;
  }, []);

  const safeLeaveMeeting = useCallback(() => {
    const leaveFn = leaveRef.current;
    if (typeof leaveFn !== "function") return;
    try {
      const out = leaveFn();
      if (out?.then) out.catch(() => {});
    } catch {
      /* already destroyed */
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (hasInterceptedLeaveRef.current) return;
      hasInterceptedLeaveRef.current = true;
      e.preventDefault();

      safeLeaveMeeting();

      setTimeout(() => {
        navigation.dispatch(e.data.action);
      }, 500);
    });
    return unsubscribe;
  }, [navigation, safeLeaveMeeting]);

  // ─── OPT-9: refreshLiveStreamMeta — throttle guard stays, but now only
  //   runs every 15 s (was 6 s) to halve API load while streaming ───────────
  const refreshLiveStreamMeta = useCallback(async () => {
    const id = liveStreamIdRef.current;
    if (!id) return;
    const now = Date.now();
    if (now - lastLiveMetaRefreshAtRef.current < 1200) return;
    lastLiveMetaRefreshAtRef.current = now;

    let data = null;
    try {
      const res = await get(`live-stream/${id}`);

      const payload = res?.data?.data ?? res?.data?.data?.data ?? res?.data;
      data = payload?.liveStream ?? payload?.item ?? payload;
    } catch {}

    if (!data || String(data?._id ?? "") !== String(id)) {
      try {
        const res = await get("live-stream", { page: 1, limit: 30 });
        const payload = res?.data?.data ?? res?.data?.data?.data ?? res?.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(res?.data?.items)
          ? res.data.items
          : [];
        data =
          list.find((x) => String(x?._id ?? x?.id ?? "") === String(id)) ||
          null;
      } catch {}
    }

    if (!data || String(data?._id ?? "") !== String(id)) return;

    // ─── OPT-5b: batch all reaction updates in one setState ──────────────
    const nextLikeCount = Number(
      data?.likeCount ??
        (Array.isArray(data?.reactions)
          ? data.reactions.filter((r) => r.reaction === "like").length
          : data?.reactionsCount) ??
        0,
    );
    const liked = (data?.reactions || []).some(
      (r) => r.reaction === "like" && r.user?._id === currentUserId,
    );

    dispatchLike({ type: "SET_COUNT", count: nextLikeCount });

    setLiveReactionCounts({
      joyCount: Number(data?.joyCount ?? data?.hahaCount ?? 0),
      loveCount: nextLikeCount,
      smileCount: Number(data?.smileCount ?? 0),
      neutralCount: Number(data?.neutralCount ?? 0),
      sadCount: Number(data?.sadCount ?? 0),
      angryCount: Number(data?.angryCount ?? 0),
    });
  }, [currentUserId]);

  // Stable ref so socket handlers can always call latest version
  const refreshRef = useRef(refreshLiveStreamMeta);
  refreshRef.current = refreshLiveStreamMeta;

  // ─── useMeeting ──────────────────────────────────────────────────────────
  const { join, leave, participants } = useMeeting({
    onMeetingJoined: () => {
      setHasJoined(true);
      emitView();
    },
    onMeetingLeft: () => {
      emitLeave();
      if (isMounted.current) setHasJoined(false);
    },
    onError: (error) => {
      const code = error?.code;
      if (code === 3044 && !hasJoined) {
        console.warn(
          "Viewer: ignoring transient media connect failure (3044) during startup",
        );
        return;
      }
      console.error("❌ Viewer Meeting Error:", error);
    },
    onParticipantJoined: () => {},
    onParticipantLeft: () => {},
  });
  joinRef.current = join;
  leaveRef.current = leave;

  // ─── Lifecycle: mount/unmount ─────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isScreenFocused) {
      safeLeaveMeeting();
      emitLeave();
      setHasJoined(false);
      return;
    }

    viewEmittedRef.current = false;
    leaveEmittedRef.current = false;
    setHasJoined(false);
    const t = setTimeout(() => {
      if (isMounted.current && isScreenFocused) {
        joinRef.current?.();
      }
    }, 500);

    return () => {
      clearTimeout(t);
      emitLeave();
    };
  }, [emitLeave, isScreenFocused, safeLeaveMeeting]);

  // ─── OPT-9: polling interval raised from 6 s → 15 s ─────────────────────
  useEffect(() => {
    if (!hasJoined || !isScreenFocused) return;
    refreshRef.current?.();
    const interval = setInterval(() => {
      refreshRef.current?.();
    }, 15_000);
    return () => clearInterval(interval);
  }, [hasJoined, isScreenFocused]);

  useEffect(() => {
    if (!hasJoined || !isScreenFocused) return;
    emitView();
  }, [hasJoined, socket, liveStreamId, emitView, isScreenFocused]);

  useEffect(() => {
    dispatchLike({ type: "RESET", item, currentUserId });
  }, [item?._id, item?.reactions, item?.reactionsCount, currentUserId]);

  useEffect(() => {
    const raw = item?.donations ?? item?.data?.donations ?? [];
    setLiveDonations(Array.isArray(raw) ? raw : []);
  }, [item?._id, item?.donations, item?.data?.donations]);

  useEffect(() => {
    setLiveReactionCounts(reactionCountsFromItem(item));
  }, [
    item?._id,
    item?.joyCount,
    item?.hahaCount,
    item?.loveCount,
    item?.likeCount,
    item?.smileCount,
    item?.neutralCount,
    item?.sadCount,
    item?.angryCount,
  ]);

  // ─── Keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (liveQuestionHideTimerRef.current)
        clearTimeout(liveQuestionHideTimerRef.current);
      if (liveEndedNavigateTimerRef.current)
        clearTimeout(liveEndedNavigateTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!socket || !isScreenFocused) return;
    const handler = (payload) => {
      const currentId = liveStreamIdRef.current;
      const rawQuestions =
        payload?.questions ??
        payload?.data?.questions ??
        payload?.data?.data?.questions ??
        null;
      const rawSingle =
        payload?.question ??
        payload?.data?.question ??
        payload?.data?.data?.question ??
        null;
      const rawFallback =
        payload?.data?.data ?? payload?.data ?? payload ?? null;
      const list = Array.isArray(rawQuestions)
        ? rawQuestions
        : rawSingle && typeof rawSingle === "object"
        ? [rawSingle]
        : rawFallback &&
          typeof rawFallback === "object" &&
          !Array.isArray(rawFallback)
        ? [rawFallback]
        : Array.isArray(rawFallback)
        ? rawFallback
        : [];

      const payloadId =
        payload?.liveStreamId ??
        payload?.data?.liveStreamId ??
        rawSingle?.liveStreamId ??
        list?.[0]?.liveStreamId ??
        list?.[0]?.liveStream?._id ??
        null;

      if (payloadId && currentId && String(payloadId) !== String(currentId))
        return;
    };
    socket.on("liveStream:question", handler);
    return () => {
      socket.off("liveStream:question", handler);
    };
  }, [socket, isScreenFocused]);

  useEffect(() => {
    if (!socket || !isScreenFocused) return;
    const handler = (payload) => {
      const currentId = liveStreamIdRef.current;
      const reactionObj =
        payload?.reaction ??
        payload?.data?.reaction ??
        payload?.liveStreamReaction ??
        payload?.data?.liveStreamReaction ??
        null;
      const payloadId =
        payload?.liveStreamId ??
        payload?.data?.liveStreamId ??
        reactionObj?.liveStreamId ??
        payload?.liveStream?._id ??
        payload?.liveStream ??
        null;

      if (payloadId && currentId && String(payloadId) !== String(currentId))
        return;

      const action =
        payload?.action ?? payload?.data?.action ?? reactionObj?.action ?? null;
      const reactionType =
        payload?.reactionType ??
        payload?.data?.reactionType ??
        reactionObj?.reaction ??
        null;
      const source =
        payload?.reactionCounts ??
        payload?.data?.reactionCounts ??
        payload?.counts ??
        payload?.data?.counts ??
        payload?.stats?.reactions ??
        payload?.data?.stats?.reactions ??
        payload ??
        {};

      const toNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };
      const next = {
        joyCount: toNum(source?.joyCount ?? source?.joy ?? source?.hahaCount),
        loveCount: toNum(
          source?.likeCount ??
            source?.loveCount ??
            source?.love ??
            source?.likes,
        ),
        smileCount: toNum(source?.smileCount ?? source?.smile),
        neutralCount: toNum(source?.neutralCount ?? source?.neutral),
        sadCount: toNum(source?.sadCount ?? source?.sad),
        angryCount: toNum(source?.angryCount ?? source?.angry),
      };
      const hasAnyCounts = Object.values(next).some(
        (v) => typeof v === "number",
      );

      if (!hasAnyCounts && reactionType) {
        const countKey = `${reactionType}Count`;
        if (action === "created") {
          if (reactionType === "like") {
            dispatchLike((prev) => {
              const nextVal = (Number(prev?.likeCount) || 0) + 1;
              setLiveReactionCounts((rc) => ({
                ...(rc || {}),
                loveCount: nextVal,
              }));
              return { type: "SET_COUNT", count: nextVal };
            });
          } else {
            setLiveReactionCounts((prev) => {
              const merged = prev ? { ...prev } : {};
              merged[countKey] = (Number(merged[countKey]) || 0) + 1;
              return merged;
            });
          }
        } else if (action === "deleted") {
          if (reactionType === "like") {
            dispatchLike((prev) => {
              const nextVal = Math.max(0, (Number(prev?.likeCount) || 0) - 1);
              setLiveReactionCounts((rc) => ({
                ...(rc || {}),
                loveCount: nextVal,
              }));
              return { type: "SET_COUNT", count: nextVal };
            });
          } else {
            setLiveReactionCounts((prev) => {
              const merged = prev ? { ...prev } : {};
              merged[countKey] = Math.max(
                0,
                (Number(merged[countKey]) || 0) - 1,
              );
              return merged;
            });
          }
        } else {
          refreshRef.current?.();
        }
        return;
      }

      setLiveReactionCounts((prev) => {
        const merged = prev ? { ...prev } : {};
        Object.keys(next).forEach((k) => {
          const v = next[k];
          if (typeof v === "number") merged[k] = v;
        });
        return merged;
      });
      if (typeof next.loveCount === "number") {
        dispatchLike({ type: "SET_COUNT", count: next.loveCount });
      }
    };
    socket.on("liveStream:reaction", handler);
    return () => {
      socket.off("liveStream:reaction", handler);
    };
  }, [socket, isScreenFocused]);

  useEffect(() => {
    if (!socket || !isScreenFocused) return;
    const handler = (payload) => {
      const currentId = liveStreamIdRef.current;
      const donationObj =
        payload?.donation ??
        payload?.data?.donation ??
        payload?.liveStreamDonation ??
        payload?.data?.liveStreamDonation ??
        null;
      const payloadId =
        payload?.liveStreamId ??
        payload?.data?.liveStreamId ??
        donationObj?.liveStreamId ??
        payload?.liveStream?._id ??
        payload?.liveStream ??
        null;

      if (payloadId && currentId && String(payloadId) !== String(currentId))
        return;

      const listRaw =
        payload?.donations ??
        payload?.data?.donations ??
        payload?.data?.data?.donations ??
        (Array.isArray(payload?.data) ? payload.data : null) ??
        null;
      const nextList = Array.isArray(listRaw)
        ? listRaw
        : Array.isArray(payload?.liveStream?.donations)
        ? payload.liveStream.donations
        : null;

      if (Array.isArray(nextList)) {
        setLiveDonations(nextList);
        return;
      }
      if (donationObj && typeof donationObj === "object") {
        setLiveDonations((prev) => {
          const current = Array.isArray(prev) ? prev : [];
          return [donationObj, ...current].slice(0, 20);
        });
      }
    };
    socket.on("liveStream:donation", handler);
    return () => {
      socket.off("liveStream:donation", handler);
    };
  }, [socket, isScreenFocused]);

  useEffect(() => {
    if (!socket || !isScreenFocused) return;
    const handler = (payload) => {
      const currentId = liveStreamIdRef.current;
      const data = payload?.data ?? payload?.liveStream ?? payload ?? null;
      const payloadId =
        payload?.liveStreamId ??
        payload?.data?.liveStreamId ??
        payload?.data?._id ??
        data?._id ??
        data?.liveStreamId ??
        null;

      if (payloadId && currentId && String(payloadId) !== String(currentId))
        return;
      if (liveEndedHandledRef.current) return;
      liveEndedHandledRef.current = true;

      try {
        emitLeave();
      } catch {}
      try {
        if (typeof leaveRef.current === "function") {
          leaveRef.current();
        }
      } catch {}

      const safeNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      const startedAtMs = Date.parse(
        String(
          data?.createdAt ?? data?.startedAt ?? data?.metadata?.createdAt ?? "",
        ),
      );
      const endedAtMs = Date.parse(
        String(data?.endedAt ?? data?.updatedAt ?? ""),
      );
      const durationSeconds =
        Number.isFinite(startedAtMs) &&
        Number.isFinite(endedAtMs) &&
        endedAtMs >= startedAtMs
          ? Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000))
          : 0;

      const fromStats = safeNum(
        data?.stats?.views ??
          data?.stats?.viewers ??
          data?.stats?.totalViewers ??
          data?.stats?.activeViewers,
      );
      const fromArrays = Math.max(
        Array.isArray(data?.views) ? data.views.length : 0,
        Array.isArray(data?.activeViewers) ? data.activeViewers.length : 0,
      );
      const totalViewers = Math.max(0, fromStats, fromArrays);

      if (liveEndedNavigateTimerRef.current)
        clearTimeout(liveEndedNavigateTimerRef.current);
      liveEndedNavigateTimerRef.current = setTimeout(() => {
        liveEndedNavigateTimerRef.current = null;
        navigation.replace("LiveEnded", {
          durationSeconds,
          totalViewers,
        });
      }, 500);
    };
    socket.on("liveStream:ended", handler);
    return () => {
      socket.off("liveStream:ended", handler);
    };
  }, [socket, emitLeave, safeLeaveMeeting, isScreenFocused]);

  const totalParticipants = useMemo(
    () => [...participants.values()].filter((p) => !p.local).length,
    [participants],
  );

  const headerItem = useMemo(() => {
    const viewsRaw = item?.views ?? item?.data?.views ?? [];
    const activeRaw = item?.activeViewers ?? item?.data?.activeViewers ?? [];
    const fromArrays = Math.max(
      Array.isArray(viewsRaw) ? viewsRaw.length : 0,
      Array.isArray(activeRaw) ? activeRaw.length : 0,
    );
    const fromStats = Number(
      item?.stats?.viewers ??
        item?.stats?.views ??
        item?.stats?.activeViewers ??
        0,
    );
    const count = Math.max(0, totalParticipants, fromArrays, fromStats);
    return {
      ...(item || {}),
      stats: { ...(item?.stats || {}), viewers: count, views: count },
    };
  }, [item, totalParticipants]);

  const bottomSectionStyle = useMemo(
    () => [
      styles.bottomSection,
      {
        bottom: isLiveAskOpen ? keyboardHeight : 0,
        paddingBottom: isLiveAskOpen ? 12 : isTabBarVisible ? 180 : 44,
      },
    ],
    [isLiveAskOpen, keyboardHeight, isTabBarVisible],
  );

  const handleMorePress = useCallback((e) => {
    if (e) e.stopPropagation();
  }, []);

  const handleViewStreamPress = useCallback(
    (e) => {
      e?.stopPropagation?.();
      safeLeaveMeeting();
      emitLeave();
      setHasJoined(false);

      let itemParam = "";
      try {
        itemParam = JSON.stringify(item ?? {});
      } catch {}
      navigation.navigate("ViewStream", {
        meetingId: meetingId ? String(meetingId) : "",
        userName: userData?.user?.username || "Viewer",
        item: itemParam,
      });
    },
    [
      emitLeave,
      item,
      meetingId,
      navigation,
      safeLeaveMeeting,
      userData?.user?.username,
    ],
  );

  const remoteParticipants = useMemo(
    () => [...participants.values()].filter((p) => !p.local),
    [participants],
  );
  const hostParticipant = remoteParticipants[0];
  const authorMeta = useMemo(() => getAuthorMeta(item, item?.userName), [item]);
  const handleHeaderBackPress = useCallback(() => {
    safeLeaveMeeting();
    navigation.goBack();
  }, [navigation, safeLeaveMeeting]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.videoContainer}>
        {hostParticipant ? (
          <ParticipantView participantId={hostParticipant.id} />
        ) : (
          <View style={styles.loading}>
            <PulsingConnectingText label="Connecting..." />
          </View>
        )}
      </View>

      {!suppressOverlay ? (
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={[styles.liveHeader, {}]} pointerEvents="box-none">
            <Pressable
              onPress={() =>
                navigation.navigate("UserProfile", {
                  userId: item?.author?._id,
                })
              }
              style={styles.headerLeft}
            >
              {authorMeta.avatar ? (
                <View style={styles.avatarRing}>
                  <Image
                    source={
                      typeof authorMeta.avatar === "string" && {
                        uri: authorMeta.avatar,
                      }
                    }
                    style={styles.avatar}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.avatarColor,
                    { backgroundColor: item?.author?.profile?.profileColor },
                  ]}
                />
              )}

              <View style={styles.authorBlock}>
                <View style={styles.nameRow}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {authorMeta.displayName}
                  </Text>
                  {authorMeta.isVerified ? (
                    <Image
                      source={Images.verified}
                      style={styles.verifiedIcon}
                    />
                  ) : null}
                </View>
                <Text style={styles.username} numberOfLines={1}>
                  {authorMeta.username}
                </Text>
              </View>
            </Pressable>
            <View style={styles.headerRight}>
              {/* <TouchableOpacity style={styles.headerCircle} onPress={() => {}}>
                <Blur borderColor="transparent" />
                <Icons
                  family="MaterialIcons"
                  name="add"
                  size={20}
                  color={COLORS.white}
                />
              </TouchableOpacity> */}
              {/* <TouchableOpacity
                style={styles.headerCircle}
                onPress={handleMorePress}
              >
                <Blur borderColor="transparent" />
                <Icons
                  family="MaterialCommunityIcons"
                  name="dots-vertical"
                  size={20}
                  color={COLORS.white}
                />
              </TouchableOpacity> */}
            </View>
          </View>

          <View style={styles.liveTopInfo} pointerEvents="none">
            {item?.title ? (
              <Text style={styles.liveTitle} numberOfLines={1}>
                {item.title}
              </Text>
            ) : null}
            {item?.description ? (
              <Text style={styles.liveCaption} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
            {Array.isArray(item?.hashtags) && item.hashtags.length > 0 ? (
              <Text style={styles.liveTags} numberOfLines={1}>
                {item.hashtags
                  .map((t) => {
                    const s = String(t ?? "").trim();
                    return s ? (s.startsWith("#") ? s : `#${s}`) : "";
                  })
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            ) : null}
            {item?.location?.address ? (
              <View style={styles.liveLocationRow}>
                <Icons
                  family="FontAwesome6"
                  name="location-dot"
                  size={12}
                  color={COLORS.white}
                />
                <Text style={styles.liveLocationText} numberOfLines={1}>
                  {item.location?.address}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={bottomSectionStyle} pointerEvents="box-none">
            <View style={styles.liveFooter} pointerEvents="auto">
              <TouchableOpacity
                style={styles.actionBtnFull}
                onPress={handleViewStreamPress}
                activeOpacity={0.7}
              >
                <View style={styles.actionBtnInnerWhite}>
                  <Text style={styles.actionCount1}>Watch Live</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const ViewerWatchMeeting = ({
  meetingId,
  userName,
  item,
  isScreenFocused = true,
  isTabBarVisible = true,
  suppressOverlay = false,
}) => {
  const [token, setToken] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    ensureVideoSdkRegistered()
      .then(() => {
        if (mounted) setSdkReady(true);
      })
      .catch(() => {
        if (mounted) setSdkReady(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await getToken();
        if (mounted) setToken(t);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!sdkReady || !token) return null;

  return (
    <MeetingProvider
      key={`sdk-viewer-${meetingId}`}
      config={{
        meetingId,
        micEnabled: false,
        webcamEnabled: false,
        name: userName || "Viewer",
        mode: "CONFERENCE",
        multiStream: true,
      }}
      token={token}
    >
      <MeetingView
        item={item}
        isTabBarVisible={isTabBarVisible}
        meetingId={meetingId}
        isScreenFocused={isScreenFocused}
        suppressOverlay={suppressOverlay}
      />
    </MeetingProvider>
  );
};

const ViewerWatchScreen = (props) => {
  const routeParams = props?.route?.params || {};
  const navigation = props?.navigation;
  const screenFocused = useIsFocused();
  const { height: windowHeight } = useWindowDimensions();
  const userData = useSelector((state) => state?.users?.userData);
  const hasLoadedLiveStreamsRef = useRef(false);
  const isMountedRef = useRef(true);
  const isFocusedPage =
    props?.isFocusedPage !== undefined ? props.isFocusedPage : screenFocused;

  const passedItem = useMemo(
    () => parseRouteItem(props?.item ?? routeParams?.item),
    [props?.item, routeParams?.item],
  );
  const passedMeetingId =
    props?.meetingId ??
    routeParams?.meetingId ??
    getMeetingIdFromItem(passedItem);
  const passedUserName =
    props?.userName ??
    routeParams?.userName ??
    userData?.user?.username ??
    "Viewer";
  const isTabBarVisible =
    props?.isTabBarVisible ?? routeParams?.isTabBarVisible ?? true;
  const suppressOverlay =
    props?.suppressOverlay ?? routeParams?.suppressOverlay ?? false;

  const [liveStreams, setLiveStreams] = useState(() =>
    passedMeetingId
      ? [
          {
            item: passedItem || { _id: passedMeetingId, title: "Live Stream" },
            meetingId: String(passedMeetingId),
          },
        ]
      : [],
  );
  const [loading, setLoading] = useState(!passedMeetingId);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchLiveStreams = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) setLoading(true);

    try {
      const res = await get("live-stream", { page: 1, limit: 30 });
      const streams = extractLiveStreams(res).map((stream) => ({
        item: stream,
        meetingId: String(getMeetingIdFromItem(stream)),
      }));
      if (!isMountedRef.current) return;
      setLiveStreams(streams);
    } catch {
      if (!isMountedRef.current) return;
      setLiveStreams([]);
    } finally {
      if (!isMountedRef.current) return;
      hasLoadedLiveStreamsRef.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (passedMeetingId) {
      setLiveStreams([
        {
          item: passedItem || { _id: passedMeetingId, title: "Live Stream" },
          meetingId: String(passedMeetingId),
        },
      ]);
      if (!hasLoadedLiveStreamsRef.current) setLoading(false);
    }
  }, [passedMeetingId, passedItem]);

  useEffect(() => {
    if (!isFocusedPage) return;

    fetchLiveStreams({
      showLoader: !hasLoadedLiveStreamsRef.current && !passedMeetingId,
    });

    const interval = setInterval(() => {
      fetchLiveStreams({ showLoader: false });
    }, 15_000);

    return () => clearInterval(interval);
  }, [fetchLiveStreams, isFocusedPage, passedMeetingId]);

  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar hidden />
        <View style={styles.loading}>
          <PulsingConnectingText label="Loading..." />
        </View>
      </View>
    );
  }

  if (!liveStreams.length) {
    return <EmptyMeetingsView navigation={navigation} />;
  }

  if (liveStreams.length === 1) {
    const stream = liveStreams[0];
    return (
      <ViewerWatchMeeting
        meetingId={stream.meetingId}
        userName={passedUserName}
        item={stream.item}
        isScreenFocused={isFocusedPage}
        isTabBarVisible={isTabBarVisible}
        suppressOverlay={suppressOverlay}
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={liveStreams}
      keyExtractor={(stream, index) =>
        `${stream.item?._id || stream.meetingId}-${index}`
      }
      pagingEnabled
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      windowSize={2}
      removeClippedSubviews
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, index) => ({
        length: windowHeight,
        offset: windowHeight * index,
        index,
      })}
      renderItem={({ item: stream }) => (
        <View style={[styles.watchListItem, { height: windowHeight }]}>
          <ViewerWatchMeeting
            meetingId={stream.meetingId}
            userName={passedUserName}
            item={stream.item}
            isScreenFocused={isFocusedPage}
            isTabBarVisible={isTabBarVisible}
            suppressOverlay={suppressOverlay}
          />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  emptyScreen: { flex: 1, backgroundColor: "#121212" },
  watchListItem: { width: "100%", backgroundColor: "#000" },
  videoContainer: { flex: 1, backgroundColor: "#000" },
  video: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  liveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 12,
  },
  headerCircle: {
    height: 40,
    width: 40,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: "#0A84FF",
    padding: 3,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  avatarColor: {
    height: 40,
    width: 40,
    borderRadius: 99,
  },
  authorBlock: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", minWidth: 0 },
  displayName: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fonts.medium,
    maxWidth: "86%",
  },
  verifiedIcon: { height: 20, width: 20, marginLeft: 6 },
  username: {
    color: COLORS.gray48,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  noVideo: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  liveTopInfo: { marginTop: 10, paddingHorizontal: 16, gap: 4, top: 10 },
  liveTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  liveCaption: {
    color: COLORS.gray64,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  liveTags: {
    color: COLORS.gray48,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  liveLocationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveLocationText: {
    color: "#FFFFFFA3",
    fontSize: 10,
    lineHeight: 10 * 1.4,
    fontFamily: fonts.semiBold,
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 42,
  },
  liveFooter: { width: "100%", gap: 10 },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 48,
  },
  actionBtn: {
    height: 48,
    width: "100%",
    borderRadius: 100,
    padding: 4,
    overflow: "hidden",
  },
  actionBtnFull: {
    height: 48,
    width: "100%",
    borderRadius: 100,
    padding: 4,
    overflow: "hidden",
    alignSelf: "center",
  },
  actionBtnInnerWhite: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    backgroundColor: COLORS.white,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 0.1,
    overflow: "hidden",
  },
  actionBtnInner: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: "hidden",
  },
  actionBtnWeb: { backgroundColor: "rgba(255, 255, 255, 0.1)" },
  actionBtnActive: { backgroundColor: "rgba(255, 255, 255, 0.16)" },
  actionCount1: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: COLORS.black,
    textAlign: "center",
  },
  liveTipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 5,
  },
  liveTipChip: {
    height: 28,
    minWidth: 60,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
  },
  liveTipText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 13 * 1.4,
    fontFamily: "Poppins_600SemiBold",
  },
  liveReactionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  liveReactionChip: {
    height: 28,
    width: "15.5%",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    overflow: "hidden",
  },
  liveReactionChipPrimary: {
    backgroundColor: "#fff",
    borderColor: "rgba(255,255,255,0.22)",
  },
  liveReactionEmoji: { fontSize: 13, color: "#fff" },
  liveReactionEmojiPrimary: { color: "#121212" },
  liveReactionCount: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 13 * 1.2,
    fontFamily: fonts.medium,
  },
  liveReactionCountPrimary: { color: "#121212" },
  liveAskComposerWrapper: { width: "100%" },
  liveAskCounterRow: {
    width: "100%",
    paddingHorizontal: 2,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  liveAskCounterText: {
    fontSize: 12,
    lineHeight: 12 * 1.4,
    fontFamily: fonts.medium,
    color: "#FFFFFFA3",
  },
  liveAskCounterTextOver: { color: "#EE1045" },
  liveAskComposerRow: {
    width: "100%",
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  liveAskInputPill: {
    flex: 1,
    height: 40,
    borderRadius: 24,
    overflow: "hidden",
  },
  liveAskInputPillInner: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
    justifyContent: "center",
  },
  liveAskInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    lineHeight: 14 * 1.4,
    fontFamily: fonts.regular,
    paddingVertical: 0,
  },
  liveAskSendOuter: {
    width: 40,
    height: 40,
    borderRadius: 24,
    overflow: "hidden",
  },
  liveAskSendInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  liveAskSendOuterDisabled: { opacity: 0.35 },
  liveQuestionCard: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFFA3",
  },
  liveQuestionBlur: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  liveQuestionText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 14 * 1.4,
    fontFamily: fonts.semiBold,
    width: "90%",
  },
  liveQuestionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
    gap: 12,
  },
  liveQuestionTime: {
    color: "#FFFFFFA3",
    fontSize: 12,
    lineHeight: 12 * 1.4,
    fontFamily: "Poppins_400Regular",
  },
  noVideoTxt: { color: "#666", fontSize: 16, marginTop: 8 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingTxt: { color: "#fff", marginTop: 16, fontSize: 18, fontWeight: "600" },
  subTxt: { color: "#666", marginTop: 8 },
  fullLoading: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerBadge: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  viewerTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
  leaveBtn: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(229,57,53,0.85)",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
  },
  leaveTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  actionBtn1: {
    height: 48,
    width: 48,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 100,
    padding: 4,
    overflow: "hidden",
  },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});

export default ViewerWatchScreen;
