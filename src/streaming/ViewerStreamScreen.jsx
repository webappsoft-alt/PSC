import { fonts } from "@/assets/fonts";
import { Images } from "@/assets/images";
import GiftModal from "@/components/GiftModal";
import QuestionModal from "@/components/QuestionModal";
import ShareModal from "@/components/ShareModal";
import colors from "@/constants/colors";
import { useSocket } from "@/contexts/SocketProvider";
import { get, post } from "@/services/ApiRequest";
import { formatInstagramTime } from "@/utils/constants";
import { ToastMessage } from "@/utils/ToastMessage";
import {
  PlatformPay,
  usePaymentSheet,
  usePlatformPay,
} from "@stripe/stripe-react-native";
import {
  MeetingProvider,
  RTCView,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-native-sdk";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {Animated,
  DeviceEventEmitter,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View} from "react-native";
import { useSelector } from "react-redux";
import { ensureVideoSdkRegistered, getToken } from "../services/videosdk";
import ExpoIcons from "./ExpoIcons";
import PeopleSheet from "./PeopleSheet";
import PostHeader from "./PostHeader";
import { useNavigation } from "@react-navigation/native";
import Text from "../components/ScaledText";

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
    return () => {
      anim.stop();
    };
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

const ParticipantView = ({ participantId }) => {
  const { webcamStream, micStream, webcamOn, participant, consumeMicStreams } =
    useParticipant(participantId, {
      onStreamEnabled: (stream) => {},
      onStreamDisabled: (stream) => {},
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
      if (hostMicBroadcasting) {
        micStream.resume();
      } else {
        micStream.pause();
      }
    } catch {
      /* ignore */
    }
  }, [micStream, hostMicBroadcasting]);

  const streamURL = useMemo(() => {
    try {
      const tracks = [];
      if (webcamOn && videoTrack) tracks.push(videoTrack);
      if (hostMicBroadcasting && audioTrack) tracks.push(audioTrack);
      if (tracks.length === 0) return null;
      return new MediaStream(tracks).toURL();
    } catch (e) {
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
  safeAreaTopInset = 0,
}) => {
  const { socket } = useSocket();
  const { isPlatformPaySupported, confirmPlatformPayPayment } =
    usePlatformPay();
  const liveStreamId = item?._id ?? null;
  const [hasJoined, setHasJoined] = useState(false);
  const viewEmittedRef = useRef(false);
  const leaveEmittedRef = useRef(false);
  const liveEndedHandledRef = useRef(false);
  const liveEndedNavigateTimerRef = useRef(null);
  const sheetRef = useRef(null);
  const [peopleUrl, setPeopleUrl] = useState("");
  const [peopleTitle, setPeopleTitle] = useState("");
  const [peopleData, setPeopleData] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const peopleFetchEpochRef = useRef(0);
  const socketRef = useRef(null);
  socketRef.current = socket;
  const liveStreamIdRef = useRef(null);
  liveStreamIdRef.current = liveStreamId;
  const navigation = useNavigation();
  const hasInterceptedLeaveRef = useRef(false);
  const [liveQuestion, setLiveQuestion] = useState(null);
  const [liveDonations, setLiveDonations] = useState(() => {
    const raw = item?.donations ?? item?.data?.donations ?? [];
    return Array.isArray(raw) ? raw : [];
  });
  const liveQuestionHideTimerRef = useRef(null);
  const lastLiveMetaRefreshAtRef = useRef(0);

  useEffect(() => {
    const original = console.error;
    console.error = (...args) => {
      const joined = args.map((a) => String(a ?? "")).join(" ");
      if (
        joined.includes("Error fetching stats") &&
        joined.includes("InvalidStateError: closed")
      ) {
        return;
      }
      if (typeof original === "function") {
        return original(...args);
      }
      return undefined;
    };
    return () => {
      if (typeof original === "function") {
        console.error = original;
      }
    };
  }, []);

  const refreshLiveStreamMeta = useRef(null);
  refreshLiveStreamMeta.current = async () => {
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

    setReactions((data?.reactions || []).filter((r) => r.reaction === "like"));
    const liked = (data?.reactions || []).some(
      (r) => r.reaction === "like" && r.user?._id === currentUserId,
    );
    setIsLiked(liked);
    const nextLikeCount = Number(
      data?.likeCount ??
        (Array.isArray(data?.reactions)
          ? data.reactions.filter((r) => r.reaction === "like").length
          : data?.reactionsCount) ??
        0,
    );
    setLikeCount(nextLikeCount);
    setLiveReactionCounts((prev) => ({
      ...(prev || {}),
      joyCount: Number(
        data?.joyCount ?? data?.hahaCount ?? prev?.joyCount ?? 0,
      ),
      loveCount: nextLikeCount,
      smileCount: Number(data?.smileCount ?? prev?.smileCount ?? 0),
      neutralCount: Number(data?.neutralCount ?? prev?.neutralCount ?? 0),
      sadCount: Number(data?.sadCount ?? prev?.sadCount ?? 0),
      angryCount: Number(data?.angryCount ?? prev?.angryCount ?? 0),
    }));
  };

  const emitView = () => {
    const s = socketRef.current;
    const id = liveStreamIdRef.current;
    if (!s || !id) return;
    if (viewEmittedRef.current) return;
    s.emit("liveStream:view", { liveStreamId: id }, (data) => {});
    viewEmittedRef.current = true;
  };

  const emitLeave = () => {
    const s = socketRef.current;
    const id = liveStreamIdRef.current;
    if (!s || !id) return;
    if (!viewEmittedRef.current) return;
    if (leaveEmittedRef.current) return;
    s.emit("liveStream:leave", { liveStreamId: id }, (data) => {});
    leaveEmittedRef.current = true;
  };

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeLeaveMeeting = useCallback(() => {
    const leaveFn = leaveRef.current;
    if (typeof leaveFn !== "function") return;
    try {
      const out = leaveFn();
      if (out != null && typeof out.then === "function") {
        out.catch(() => {});
      }
    } catch (e) {
      // Already destroyed
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
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

  const { join, leave, participants } = useMeeting({
    onMeetingJoined: () => {
      setHasJoined(true);
      emitView();
    },
    onMeetingLeft: () => {
      emitLeave();
      if (isMounted.current) {
        setHasJoined(false);
      }
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
    onParticipantJoined: (participant) => {},
    onParticipantLeft: (participant) => {},
  });
  const joinRef = useRef(join);
  joinRef.current = join;
  const leaveRef = useRef(leave);
  leaveRef.current = leave;

  const [isLiveAskOpen, setIsLiveAskOpen] = useState(false);
  const [liveAskText, setLiveAskText] = useState("");
  const [isSendingLiveQuestion, setIsSendingLiveQuestion] = useState(false);
  const [isCardSendingLiveQuestion, setIsCardSendingLiveQuestion] =
    useState(false);
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedLiveReactionKey, setSelectedLiveReactionKey] = useState(null);
  const liveAskInputRef = useRef(null);
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [pendingQuestionText, setPendingQuestionText] = useState("");
  const userData = useSelector((state) => state?.users?.userData);
  const currentUserId = userData?.user?._id;
  const [reactions, setReactions] = useState(
    (item?.reactions || []).filter((r) => r.reaction === "like"),
  );
  const [isLiked, setIsLiked] = useState(() => {
    return (item?.reactions || []).some(
      (r) => r.reaction === "like" && r.user?._id === currentUserId,
    );
  });
  const [likeCount, setLikeCount] = useState(
    Array.isArray(item?.reactions)
      ? item.reactions.filter((r) => r.reaction === "like").length
      : Number(item?.reactionsCount ?? 0),
  );
  const effectiveLiked = isLiked;
  const effectiveLikeCount = likeCount;

  useEffect(() => {
    setReactions((item?.reactions || []).filter((r) => r.reaction === "like"));
    const liked = (item?.reactions || []).some(
      (r) => r.reaction === "like" && r.user?._id === currentUserId,
    );
    setIsLiked(liked);
    setLikeCount(
      Array.isArray(item?.reactions)
        ? item.reactions.filter((r) => r.reaction === "like").length
        : Number(item?.reactionsCount ?? 0),
    );
  }, [item?._id, item?.reactions, item?.reactionsCount, currentUserId]);

  useEffect(() => {
    const raw = item?.donations ?? item?.data?.donations ?? [];
    setLiveDonations(Array.isArray(raw) ? raw : []);
  }, [item?._id, item?.donations, item?.data?.donations]);

  useEffect(() => {
    const raw =
      item?.questions ??
      item?.data?.questions ??
      item?.data?.data?.questions ??
      [];
    const list = Array.isArray(raw) ? raw : [];
    const first = list[0] ?? null;
    if (!first) {
      setLiveQuestion(null);
      return;
    }

    const questionText = String(first?.question ?? first?.text ?? "").trim();
    if (!questionText) {
      setLiveQuestion(null);
      return;
    }

    const user = first?.user ?? {};
    const displayName =
      user?.displayName ??
      user?.name ??
      user?.fullName ??
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ??
      "Display Name";
    const username = user?.username ? String(user.username) : "username";
    const avatar =
      user?.profile?.avatar ??
      user?.avatar ??
      user?.profileImage ??
      user?.image ??
      null;
    const createdAt =
      String(first?.createdAt ?? first?.created_at ?? "") ||
      new Date().toISOString();

    setLiveQuestion({
      text: questionText,
      displayName,
      username,
      avatar,
      createdAt,
    });
  }, [
    item?._id,
    item?.questions,
    item?.data?.questions,
    item?.data?.data?.questions,
  ]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const totalParticipants = useMemo(() => {
    return [...participants.values()].filter((p) => !p.local).length;
  }, [participants.size]);

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
      stats: {
        ...(item?.stats || {}),
        viewers: count,
        views: count,
      },
    };
  }, [item, totalParticipants]);

  const handleViewsPress = () => {
    const id = liveStreamIdRef.current;
    if (!id) return;
    setPeopleTitle("SEEN BY");
    setPeopleUrl("");
    sheetRef.current?.expand?.();

    const viewsRaw = item?.views ?? item?.data?.views ?? [];
    const activeRaw = item?.activeViewers ?? item?.data?.activeViewers ?? [];
    const ids = [
      ...(Array.isArray(viewsRaw) ? viewsRaw : []),
      ...(Array.isArray(activeRaw) ? activeRaw : []),
    ]
      .map((x) => String(x ?? "").trim())
      .filter(Boolean);
    const uniqueIds = Array.from(new Set(ids));

    peopleFetchEpochRef.current += 1;
    const epoch = peopleFetchEpochRef.current;

    setPeopleLoading(true);
    setPeopleData([]);

    Promise.all(
      uniqueIds.map(async (userId) => {
        try {
          const res = await get(`user/${userId}`);
          return res?.data?.data ?? null;
        } catch {
          return null;
        }
      }),
    )
      .then((users) => {
        if (peopleFetchEpochRef.current !== epoch) return;
        const list = (users || []).filter(Boolean);
        setPeopleData(list);
      })
      .finally(() => {
        if (peopleFetchEpochRef.current !== epoch) return;
        setPeopleLoading(false);
      });
  };
  const [liveReactionCounts, setLiveReactionCounts] = useState(() => ({
    joyCount: Number(item?.joyCount ?? item?.hahaCount ?? 0),
    loveCount: Number(item?.likeCount ?? item?.loveCount ?? 0),
    smileCount: Number(item?.smileCount ?? 0),
    neutralCount: Number(item?.neutralCount ?? 0),
    sadCount: Number(item?.sadCount ?? 0),
    angryCount: Number(item?.angryCount ?? 0),
  }));
  useEffect(() => {
    setLiveReactionCounts({
      joyCount: Number(item?.joyCount ?? item?.hahaCount ?? 0),
      loveCount: Number(item?.likeCount ?? item?.loveCount ?? 0),
      smileCount: Number(item?.smileCount ?? 0),
      neutralCount: Number(item?.neutralCount ?? 0),
      sadCount: Number(item?.sadCount ?? 0),
      angryCount: Number(item?.angryCount ?? 0),
    });
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

  const liveQuickReactions = useMemo(() => {
    const statsReactions = liveReactionCounts || headerItem || {};
    const joyCount = Number(statsReactions?.joyCount ?? 0);
    const loveCount = Number(
      statsReactions?.loveCount ?? effectiveLikeCount ?? 0,
    );
    const smileCount = Number(statsReactions?.smileCount ?? 0);
    const neutralCount = Number(statsReactions?.neutralCount ?? 0);
    const sadCount = Number(statsReactions?.sadCount ?? 0);
    const angryCount = Number(statsReactions?.angryCount ?? 0);
    return [
      { key: "joy", emoji: "😂", count: joyCount },
      { key: "love", emoji: "❤️", count: loveCount },
      { key: "smile", emoji: "😀", count: smileCount },
      { key: "neutral", emoji: "😐", count: neutralCount },
      { key: "sad", emoji: "☹️", count: sadCount },
      { key: "angry", emoji: "😡", count: angryCount },
    ];
  }, [liveReactionCounts, headerItem, effectiveLikeCount]);

  const liveReactionPressLockRef = useRef({});
  const handleLiveReactionPress = async (reactionKey) => {
    if (!reactionKey) return;
    setSelectedLiveReactionKey(reactionKey);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (reactionKey === "love") {
      handleLike();
      return;
    }

    if (!item?._id) return;

    const lock = liveReactionPressLockRef.current || {};
    if (lock[reactionKey]) return;
    lock[reactionKey] = true;
    liveReactionPressLockRef.current = lock;

    const countKey = `${reactionKey}Count`;
    setLiveReactionCounts((prev) => {
      const next = prev ? { ...prev } : {};
      const currentCount = Number(next[countKey] ?? 0);
      next[countKey] = currentCount + 1;
      return next;
    });

    try {
      const payload = { reaction: reactionKey };
      const res = await post(`live-stream/${item?._id}/like`, payload);
      if (!res?.data?.success) {
        setLiveReactionCounts((prev) => {
          const next = prev ? { ...prev } : {};
          const currentCount = Number(next[countKey] ?? 0);
          next[countKey] = Math.max(0, currentCount - 1);
          return next;
        });
      } else {
        refreshLiveStreamMeta.current?.();
      }
    } catch (_error) {
      setLiveReactionCounts((prev) => {
        const next = prev ? { ...prev } : {};
        const currentCount = Number(next[countKey] ?? 0);
        next[countKey] = Math.max(0, currentCount - 1);
        return next;
      });
    } finally {
      const l = liveReactionPressLockRef.current || {};
      l[reactionKey] = false;
      liveReactionPressLockRef.current = l;
    }
  };

  const formatCount = (count) => {
    if (!count || count === 0) return "0";
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "k";
    return String(count);
  };

  const handleLiveAskOpen = (e) => {
    e?.stopPropagation?.();
    setIsLiveAskOpen(true);
    requestAnimationFrame(() => {
      liveAskInputRef.current?.focus?.();
    });
  };

  const handleLiveAskSend = async () => {
    const message = String(liveAskText || "").trim();
    if (!message) return;
    const id = liveStreamIdRef.current;
    if (!id) return;
    if (isSendingLiveQuestion) return;

    setIsLiveAskOpen(false);
    Keyboard.dismiss();
    setPendingQuestionText(message);
    setShowQuestionModal(true);
  };

  const confirmAndSendLiveQuestion = async () => {
    const message = String(pendingQuestionText || "").trim();
    if (!message) return;
    const id = liveStreamIdRef.current;
    if (!id) return;
    if (isSendingLiveQuestion) return;

    setIsSendingLiveQuestion(true);

    try {
      let questionRes = null;
      if (Platform.OS === "ios" || Platform.OS === "android") {
        const questionUsd = 5;
        const amountInCents = Math.max(0, Math.round(questionUsd * 100));

        const paymentRes = await post("payment", {
          amount: amountInCents,
          currency: "USD",
        });

        const { clientSecret, paymentIntentId } = paymentRes?.data?.data ?? {};
        if (!clientSecret) {
          ToastMessage("Payment init failed", "error");
          return;
        }

        if (Platform.OS === "ios") {
          const supported = await isPlatformPaySupported();
          if (!supported) {
            ToastMessage("Apple Pay not available on this device", "error");
            return;
          }

          const result = await confirmPlatformPayPayment(clientSecret, {
            applePay: {
              merchantCountryCode: "US",
              currencyCode: "USD",
              cartItems: [
                {
                  paymentType: PlatformPay.PaymentType.Immediate,
                  label: "Question",
                  amount: questionUsd.toFixed(2),
                },
              ],
            },
          });

          if (result?.error) {
            const code = String(result.error?.code ?? "").toLowerCase();
            if (code.includes("canceled") || code.includes("cancelled")) return;
            ToastMessage(
              `${result.error?.code ? `${result.error.code}: ` : ""}${result.error.message || "Apple Pay failed"}`,
              "error",
            );
            return;
          }
        } else if (Platform.OS === "android") {
          const supported = await isPlatformPaySupported({
            googlePay: { testEnv: __DEV__ },
          });
          if (!supported) {
            ToastMessage("Google Pay not available on this device", "error");
            return;
          }

          const result = await confirmPlatformPayPayment(clientSecret, {
            googlePay: {
              testEnv: __DEV__,
              merchantCountryCode: "US",
              currencyCode: "USD",
              merchantName: "Viral, Inc.",
              label: "Question",
              amount: amountInCents,
            },
          });

          if (result?.error) {
            const code = String(result.error?.code ?? "").toLowerCase();
            if (code.includes("canceled") || code.includes("cancelled")) return;
            ToastMessage(
              `${result.error?.code ? `${result.error.code}: ` : ""}${result.error.message || "Google Pay failed"}`,
              "error",
            );
            return;
          }
        }

        questionRes = await post(`live-stream/${id}/question`, {
          question: message,
          userId: currentUserId,
          ...(paymentIntentId ? { paymentIntentId } : {}),
        });
        setShowQuestionModal(false);
        setLiveAskText("");
        setPendingQuestionText("");
      } else {
        questionRes = await post(`live-stream/${id}/question`, {
          question: message,
          userId: currentUserId,
        });
        setShowQuestionModal(false);
        setLiveAskText("");
        setPendingQuestionText("");
      }

      const responsePayload =
        questionRes?.data?.data ?? questionRes?.data ?? null;
      const responseQuestion =
        responsePayload?.question ??
        responsePayload?.data?.question ??
        responsePayload?.data?.data?.question ??
        responsePayload?.data ??
        responsePayload ??
        null;
      const questionText = String(
        responseQuestion?.question ?? responseQuestion?.text ?? message,
      ).trim();
      const u = responseQuestion?.user ?? userData?.user ?? {};
      const displayName =
        u?.displayName ??
        u?.name ??
        u?.fullName ??
        [u?.firstName, u?.lastName].filter(Boolean).join(" ") ??
        "Display Name";
      const username =
        typeof u?.username === "string" && u.username.trim()
          ? u.username.trim()
          : "username";
      const avatar =
        u?.profile?.avatar ?? u?.avatar ?? u?.profileImage ?? u?.image ?? null;
      const createdAt =
        String(
          responseQuestion?.createdAt ?? responseQuestion?.created_at ?? "",
        ) || new Date().toISOString();
      if (questionText) {
        setLiveQuestion({
          text: questionText,
          displayName,
          username,
          avatar,
          createdAt,
        });
      }
    } catch (err) {
      console.error("❌ Error sending live question:", err);
      ToastMessage("Failed to send question", "error");
    } finally {
      setIsSendingLiveQuestion(false);
    }
  };
  const handleCardPayLiveQuestion = async () => {
    const message = String(pendingQuestionText || "").trim();
    if (!message) return;
    const id = liveStreamIdRef.current;
    if (!id) return;
    if (isCardSendingLiveQuestion || isSendingLiveQuestion) return;

    setIsCardSendingLiveQuestion(true);

    try {
      const questionUsd = 5;
      const amountInCents = Math.max(0, Math.round(questionUsd * 100));

      const paymentRes = await post("payment", {
        amount: amountInCents,
        currency: "USD",
      });

      const { clientSecret, paymentIntentId } = paymentRes?.data?.data ?? {};
      if (!clientSecret) {
        ToastMessage("Payment init failed", "error");
        return;
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Viral",
        style: "alwaysDark",
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        ToastMessage(initError.message || "Payment init failed", "error");
        return;
      }

      const { error } = await presentPaymentSheet();
      if (error) {
        const code = String(error?.code ?? "").toLowerCase();
        if (code.includes("canceled") || code.includes("cancelled")) return;
        ToastMessage(error.message || "Card payment failed", "error");
        return;
      }

      setShowQuestionModal(false);
      setLiveAskText("");
      setPendingQuestionText("");

      const questionRes = await post(`live-stream/${id}/question`, {
        question: message,
        platform: "CARD",
        userId: currentUserId,
        ...(paymentIntentId ? { paymentIntentId } : {}),
      });

      const responsePayload =
        questionRes?.data?.data ?? questionRes?.data ?? null;
      const responseQuestion =
        responsePayload?.question ??
        responsePayload?.data?.question ??
        responsePayload?.data?.data?.question ??
        responsePayload?.data ??
        responsePayload ??
        null;
      const questionText = String(
        responseQuestion?.question ?? responseQuestion?.text ?? message,
      ).trim();
      const u = responseQuestion?.user ?? userData?.user ?? {};
      const displayName =
        u?.displayName ??
        u?.name ??
        u?.fullName ??
        [u?.firstName, u?.lastName].filter(Boolean).join(" ") ??
        "Display Name";
      const username =
        typeof u?.username === "string" && u.username.trim()
          ? u.username.trim()
          : "username";
      const avatar =
        u?.profile?.avatar ?? u?.avatar ?? u?.profileImage ?? u?.image ?? null;
      const createdAt =
        String(
          responseQuestion?.createdAt ?? responseQuestion?.created_at ?? "",
        ) || new Date().toISOString();

      if (questionText) {
        setLiveQuestion({
          text: questionText,
          displayName,
          username,
          avatar,
          createdAt,
        });
      }
    } catch (err) {
      console.error("❌ Error sending card live question:", err);
      ToastMessage("Failed to send question", "error");
    } finally {
      setIsCardSendingLiveQuestion(false);
    }
  };

  useEffect(() => {
    navigation.addListener("beforeRemove", () => {
      emitLeave();
      safeLeaveMeeting();
    });
  }, [navigation]);

  useEffect(() => {
    viewEmittedRef.current = false;
    leaveEmittedRef.current = false;
    setHasJoined(false);

    const t = setTimeout(() => {
      joinRef.current?.();
    }, 500);

    return () => {
      clearTimeout(t);
      emitLeave();
    };
  }, []);

  useEffect(() => {
    if (!hasJoined) return;
    refreshLiveStreamMeta.current?.();
    const interval = setInterval(() => {
      refreshLiveStreamMeta.current?.();
    }, 6000);
    return () => clearInterval(interval);
  }, [hasJoined]);

  useEffect(() => {
    if (!hasJoined) return;
    emitView();
  }, [hasJoined, socket, liveStreamId]);

  useEffect(() => {
    if (!socket) return;

    const handler = (payload) => {
      const currentId = liveStreamIdRef.current;
      const rawQuestions =
        payload?.questions ??
        payload?.data?.questions ??
        payload?.data?.data?.questions ??
        payload?.data?.data ??
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

      if (payloadId && currentId && String(payloadId) !== String(currentId)) {
        return;
      }

      const first = list[0];
      if (!first) {
        setLiveQuestion(null);
        return;
      }

      const questionText = String(first?.question ?? first?.text ?? "").trim();
      if (!questionText) {
        setLiveQuestion(null);
        return;
      }

      const user = first?.user ?? {};
      const displayName =
        user?.displayName ??
        user?.name ??
        user?.fullName ??
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ??
        "Display Name";
      const username = user?.username ? String(user.username) : "username";
      const avatar =
        user?.profile?.avatar ??
        user?.avatar ??
        user?.profileImage ??
        user?.image ??
        null;
      const createdAt =
        String(first?.createdAt ?? first?.created_at ?? "") ||
        new Date().toISOString();

      setLiveQuestion({
        text: questionText,
        displayName,
        username,
        avatar,
        createdAt,
      });
    };

    socket.on("liveStream:question", handler);
    return () => {
      socket.off("liveStream:question", handler);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

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

      if (payloadId && currentId && String(payloadId) !== String(currentId)) {
        return;
      }

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
            setLikeCount((c) => {
              const nextVal = (Number(c) || 0) + 1;
              setLiveReactionCounts((prev) => ({
                ...(prev || {}),
                loveCount: nextVal,
              }));
              return nextVal;
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
            setLikeCount((c) => {
              const nextVal = Math.max(0, (Number(c) || 0) - 1);
              setLiveReactionCounts((prev) => ({
                ...(prev || {}),
                loveCount: nextVal,
              }));
              return nextVal;
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
          refreshLiveStreamMeta.current?.();
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
        setLikeCount(next.loveCount);
      }
    };

    socket.on("liveStream:reaction", handler);
    return () => {
      socket.off("liveStream:reaction", handler);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

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

      if (payloadId && currentId && String(payloadId) !== String(currentId)) {
        return;
      }

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
          const merged = [donationObj, ...current];
          return merged.slice(0, 20);
        });
      }
    };

    socket.on("liveStream:donation", handler);
    return () => {
      socket.off("liveStream:donation", handler);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

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

      if (payloadId && currentId && String(payloadId) !== String(currentId)) {
        return;
      }

      if (liveEndedHandledRef.current) return;
      liveEndedHandledRef.current = true;

      try {
        emitLeave();
      } catch {}
      try {
        safeLeaveMeeting();
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

      if (liveEndedNavigateTimerRef.current) {
        clearTimeout(liveEndedNavigateTimerRef.current);
      }
      liveEndedNavigateTimerRef.current = setTimeout(() => {
        liveEndedNavigateTimerRef.current = null;
        router.replace({
          pathname: "/LiveEndedScreen",
          params: {
            durationSeconds: String(durationSeconds),
            totalViewers: String(totalViewers),
          },
        });
      }, 500);
    };

    socket.on("liveStream:ended", handler);
    return () => {
      socket.off("liveStream:ended", handler);
    };
  }, [socket]);

  useEffect(() => {
    return () => {
      if (liveQuestionHideTimerRef.current) {
        clearTimeout(liveQuestionHideTimerRef.current);
      }
      if (liveEndedNavigateTimerRef.current) {
        clearTimeout(liveEndedNavigateTimerRef.current);
      }
    };
  }, []);

  const remoteParticipants = [...participants.values()].filter((p) => !p.local);
  const hostParticipant = remoteParticipants[0];
  const handleLike = async (e) => {
    if (e) e.stopPropagation();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const alreadyLiked = effectiveLiked;
    const prevLikeCount = effectiveLikeCount;
    const prevReactions = reactions || [];
    const newReactions = alreadyLiked
      ? (prevReactions || []).filter((r) => r.user?._id !== currentUserId)
      : [{ reaction: "like", user: userData?.user }, ...(prevReactions || [])];
    const newLikeCount = alreadyLiked
      ? Math.max(0, prevLikeCount - 1)
      : prevLikeCount + 1;
    setReactions(newReactions);
    setIsLiked(!alreadyLiked);
    setLikeCount(newLikeCount);
    setLiveReactionCounts((prev) => {
      const next = prev ? { ...prev } : {};
      next.loveCount = newLikeCount;
      return next;
    });
    Animated.sequence([
      Animated.timing(likeScaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    try {
      if (!item?._id) return;
      const payload = { reaction: "like" };
      const res = await post(`live-stream/${item?._id}/like`, payload);
      if (!res?.data?.success) {
        setReactions(prevReactions);
        setIsLiked(alreadyLiked);
        setLikeCount(prevLikeCount);
      }
    } catch (_error) {
      setReactions(prevReactions);
      setIsLiked(alreadyLiked);
      setLikeCount(prevLikeCount);
    }
  };
  const handleComment = (e) => {
    if (e) e.stopPropagation();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const effectiveMeetingId =
      meetingId ||
      item?.meetingId ||
      item?.metadata?.roomId ||
      item?.roomId ||
      item?.liveId ||
      null;
    globalThis.__liveCommentsKeepAlive = {
      active: true,
      meetingId: effectiveMeetingId ? String(effectiveMeetingId) : null,
      liveStreamId: item?._id ? String(item._id) : null,
    };
    router.push({
      pathname: "/CommentScreen/comments",
      params: {
        item: JSON.stringify(item),
        likeCount: effectiveLikeCount,
        backgroundUrl: item?.video,
        meetingId: effectiveMeetingId ? String(effectiveMeetingId) : undefined,
        isLive: "1",
        useUnderlyingLive: "1",
      },
    });
  };
  const handleMorePress = (e) => {
    if (e) e.stopPropagation();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowShareModal(true);
  };
  const handleGift = (e) => {
    if (e) e.stopPropagation();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowGiftModal(true);
  };

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
      <View
        style={[styles.overlay, { paddingTop: safeAreaTopInset }]}
        pointerEvents="box-none"
      >
        <PostHeader
          headerTopMargin={safeAreaTopInset}
          item={headerItem}
          user={item?.author}
          showFullUI={false}
          onFollow={() => {}}
          handleMorePress={handleMorePress}
          showDots={false}
          isLandscape={false}
          isLive
          onViewsPress={handleViewsPress}
        />

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
                  if (!s) return "";
                  return s.startsWith("#") ? s : `#${s}`;
                })
                .filter(Boolean)
                .join(" ")}
            </Text>
          ) : null}
          {item?.location?.address ? (
            <View style={styles.liveLocationRow}>
              <ExpoIcons
                family="FontAwesome6"
                name="location-dot"
                size={12}
                color={colors.white}
              />
              <Text style={styles.liveLocationText} numberOfLines={1}>
                {item.location?.address}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.bottomSection,
            {
              bottom: isLiveAskOpen ? keyboardHeight : 0,
              paddingBottom: isLiveAskOpen ? 12 : isTabBarVisible ? 104 : 44,
            },
          ]}
          pointerEvents="box-none"
        >
          {isLiveAskOpen ? (
            <BlurView
              intensity={18}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null}

          <View style={styles.liveFooter} pointerEvents="auto">
            {liveQuestion?.text ? (
              <View style={styles.liveQuestionCard} pointerEvents="none">
                {Platform.OS !== "web" ? (
                  <BlurView
                    intensity={18}
                    tint="light"
                    style={styles.liveQuestionBlur}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={styles.liveQuestionText} numberOfLines={2}>
                        {liveQuestion.text}
                      </Text>
                      <Image
                        source={Images.question}
                        style={{
                          height: 16,
                          width: 16,
                          tintColor: colors.white,
                          resizeMode: "contain",
                          marginTop: 5,
                        }}
                      />
                    </View>

                    <View style={styles.liveQuestionMetaRow}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: fonts.medium,
                            marginRight: 4,
                            color: "#FFFFFFA3",
                          }}
                          numberOfLines={1}
                        >
                          by
                        </Text>

                        <Image
                          source={
                            typeof liveQuestion.avatar === "string" &&
                            liveQuestion.avatar.trim()
                              ? { uri: liveQuestion.avatar }
                              : Images.user
                          }
                          style={{
                            height: 16,
                            width: 16,
                            borderRadius: 100,
                            marginRight: 4,
                            resizeMode: "contain",
                          }}
                        />
                        <Text
                          style={{
                            color: colors.white,
                            fontSize: 14,
                            fontFamily: fonts.medium,
                          }}
                          numberOfLines={1}
                        >
                          {liveQuestion.displayName}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: fonts.medium,
                            marginRight: 4,
                            color: "#FFFFFFA3",
                          }}
                          numberOfLines={1}
                        >
                          {"  •  "}
                        </Text>
                        <View
                          style={{
                            height: 20,
                            borderRadius: 100,
                            overflow: "hidden",
                            justifyContent: "center",
                          }}
                        >
                          <BlurView
                            intensity={18}
                            tint="light"
                            style={{
                              height: "100%",
                              width: "100%",
                              position: "absolute",
                            }}
                          />
                          <Text
                            style={{
                              color: "#FFFFFFA3",
                              fontSize: 12,
                              lineHeight: 12 * 1.4,
                              fontFamily: fonts.regular,
                              marginHorizontal: 8,
                            }}
                            numberOfLines={1}
                          >
                            {liveQuestion.username}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.liveQuestionTime}>
                        {formatInstagramTime(liveQuestion.createdAt)}
                      </Text>
                    </View>
                  </BlurView>
                ) : (
                  <View style={styles.liveQuestionBlur}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={styles.liveQuestionText} numberOfLines={2}>
                        {liveQuestion.text}
                      </Text>
                      <Image
                        source={Images.question}
                        style={{
                          height: 16,
                          width: 16,
                          tintColor: colors.white,
                          resizeMode: "contain",
                          marginTop: 5,
                        }}
                      />
                    </View>

                    <View style={styles.liveQuestionMetaRow}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: fonts.medium,
                            marginRight: 4,
                            color: "#FFFFFFA3",
                          }}
                          numberOfLines={1}
                        >
                          by
                        </Text>

                        <Image
                          source={
                            typeof liveQuestion.avatar === "string" &&
                            liveQuestion.avatar.trim()
                              ? { uri: liveQuestion.avatar }
                              : Images.user
                          }
                          style={{
                            height: 16,
                            width: 16,
                            borderRadius: 100,
                            marginRight: 4,
                            resizeMode: "contain",
                          }}
                        />
                        <Text
                          style={{
                            color: colors.white,
                            fontSize: 14,
                            fontFamily: fonts.medium,
                          }}
                          numberOfLines={1}
                        >
                          {liveQuestion.displayName}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: fonts.medium,
                            marginRight: 4,
                            color: "#FFFFFFA3",
                          }}
                          numberOfLines={1}
                        >
                          {"  •  "}
                        </Text>
                        <View
                          style={{
                            height: 20,
                            borderRadius: 100,
                            overflow: "hidden",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#FFFFFFA3",
                              fontSize: 12,
                              lineHeight: 12 * 1.4,
                              fontFamily: fonts.regular,
                              marginHorizontal: 8,
                            }}
                            numberOfLines={1}
                          >
                            {liveQuestion.username}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.liveQuestionTime}>
                        {formatInstagramTime(liveQuestion.createdAt)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : null}
            {!isLiveAskOpen ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.liveTipsRow}
                >
                  {(Array.isArray(liveDonations) ? liveDonations : [])
                    .slice(0, 10)
                    .map((d, idx) => {
                      const amount = Number(
                        d?.amount ?? d?.price ?? d?.value ?? d?.coins ?? 0,
                      );
                      const gift = String(d?.gift ?? d?.name ?? "").trim();
                      const donor = d?.user ?? d?.donor ?? d?.fromUser ?? {};
                      const avatar =
                        donor?.profile?.avatar ??
                        donor?.avatar ??
                        donor?.profileImage ??
                        donor?.image ??
                        null;
                      const key =
                        String(d?._id ?? d?.id ?? "") ||
                        `${gift || "donation"}-${idx}`;
                      return (
                        <View key={key} style={styles.liveTipChip}>
                          <Image
                            source={
                              typeof avatar === "string" && avatar.trim()
                                ? { uri: avatar }
                                : Images.user
                            }
                            style={{ height: 20, width: 20, borderRadius: 100 }}
                          />
                          <Text style={styles.liveTipText} numberOfLines={1}>
                            {`$${amount || 0}`}
                          </Text>
                        </View>
                      );
                    })}
                </ScrollView>

                <View style={styles.liveReactionsRow}>
                  {liveQuickReactions.map((r) => {
                    const count = typeof r.count === "number" ? r.count : 0;
                    const isSelected = selectedLiveReactionKey === r.key;
                    const showCount = count > 0;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[
                          styles.liveReactionChip,
                          isSelected && styles.liveReactionChipPrimary,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleLiveReactionPress(r.key)}
                      >
                        <Text
                          style={[
                            styles.liveReactionEmoji,
                            isSelected && styles.liveReactionEmojiPrimary,
                          ]}
                        >
                          {r.emoji}
                        </Text>
                        {showCount ? (
                          <Text
                            style={[
                              styles.liveReactionCount,
                              isSelected && styles.liveReactionCountPrimary,
                            ]}
                          >
                            {formatCount(count)}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={[styles.actionsRow, { marginBottom: 8 }]}>
                  {/* <TouchableOpacity
                    style={styles.actionBtn1}
                    onPress={handleLike}
                    activeOpacity={0.7}
                  >
                    {Platform.OS !== "web" ? (
                      <BlurView
                        intensity={16}
                        tint="dark"
                        style={[
                          styles.actionBtnInner,
                          effectiveLiked && styles.actionBtnActive,
                        ]}
                      >
                        <Animated.View
                          style={{ transform: [{ scale: likeScaleAnim }] }}
                        >
                          <Image
                            source={
                              effectiveLiked
                                ? Images.heart_filled
                                : Images.heart
                            }
                            style={{
                              height: 20,
                              width: 20,
                              tintColor: effectiveLiked
                                ? "#EE1045"
                                : colors.whiteOpacity48,
                            }}
                          />
                        </Animated.View>
                      </BlurView>
                    ) : (
                      <View
                        style={[
                          styles.actionBtnInner,
                          styles.actionBtnWeb,
                          effectiveLiked && styles.actionBtnActive,
                        ]}
                      >
                        <Animated.View
                          style={{ transform: [{ scale: likeScaleAnim }] }}
                        >
                          <Image
                            source={
                              effectiveLiked
                                ? Images.heart_filled
                                : Images.heart
                            }
                            style={{
                              height: 20,
                              width: 20,
                              tintColor: effectiveLiked
                                ? "#EE1045"
                                : colors.whiteOpacity48,
                            }}
                          />
                        </Animated.View>
                      </View>
                    )}
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    style={styles.actionBtn1}
                    testID="comment-btn"
                    onPress={handleComment}
                    activeOpacity={0.7}
                  >
                    {Platform.OS !== "web" ? (
                      <BlurView
                        intensity={16}
                        tint="dark"
                        style={styles.actionBtnInner}
                      >
                        <Image
                          source={Images.message}
                          style={{
                            height: 20,
                            width: 20,
                            tintColor: colors.whiteOpacity48,
                          }}
                        />
                      </BlurView>
                    ) : (
                      <View
                        style={[styles.actionBtnInner, styles.actionBtnWeb]}
                      >
                        <Image
                          source={Images.message}
                          style={{
                            height: 20,
                            width: 20,
                            tintColor: colors.whiteOpacity48,
                          }}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { height: 48 }]}
                    onPress={handleLiveAskOpen}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.actionBtnInner,
                        { backgroundColor: colors.white, paddingVertical: 0.1 },
                      ]}
                    >
                      <Image
                        source={Images.question}
                        style={{
                          height: 20,
                          width: 20,
                          tintColor: colors.black,
                          resizeMode: "contain",
                        }}
                      />
                      <Text style={styles.actionCount1}>Ask</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn1}
                    onPress={handleMorePress}
                    activeOpacity={0.7}
                  >
                    {Platform.OS !== "web" ? (
                      <BlurView
                        intensity={16}
                        tint="dark"
                        style={styles.actionBtnInner}
                      >
                        <Image
                          source={Images.right_up}
                          style={{
                            height: 20,
                            width: 20,
                            tintColor: colors.whiteOpacity48,
                          }}
                        />
                      </BlurView>
                    ) : (
                      <View
                        style={[styles.actionBtnInner, styles.actionBtnWeb]}
                      >
                        <Image
                          source={Images.right_up}
                          style={{
                            height: 20,
                            width: 20,
                            tintColor: colors.whiteOpacity48,
                          }}
                        />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn1}
                    onPress={handleGift}
                    activeOpacity={0.7}
                  >
                    {Platform.OS !== "web" ? (
                      <BlurView
                        intensity={16}
                        tint="dark"
                        style={styles.actionBtnInner}
                      >
                        <Image
                          source={Images.like}
                          style={{
                            height: 20,
                            width: 20,
                          }}
                        />
                      </BlurView>
                    ) : (
                      <View
                        style={[styles.actionBtnInner, styles.actionBtnWeb]}
                      >
                        <Image
                          source={Images.like}
                          style={{
                            height: 20,
                            width: 20,
                          }}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.liveAskComposerWrapper}>
                  <View style={styles.liveAskCounterRow}>
                    <Text
                      style={[
                        styles.liveAskCounterText,
                        String(liveAskText || "").length > 75 &&
                          styles.liveAskCounterTextOver,
                      ]}
                    >
                      {`${String(liveAskText || "").length}/75 `}
                    </Text>
                    <Text style={styles.liveAskCounterText}>CHARACTERS</Text>
                  </View>

                  <View style={styles.liveAskComposerRow}>
                    <View style={styles.liveAskInputPill}>
                      <BlurView
                        intensity={18}
                        tint="light"
                        style={styles.liveAskInputPillInner}
                      >
                        <TextInput
                          ref={liveAskInputRef}
                          value={liveAskText}
                          onChangeText={setLiveAskText}
                          editable={!isSendingLiveQuestion}
                          placeholder={`Ask @${
                            item?.author?.profile?.displayName ||
                            item?.author?.username ||
                            "Display Name"
                          } or comment...`}
                          placeholderTextColor="rgba(255,255,255,0.55)"
                          style={styles.liveAskInput}
                          returnKeyType="send"
                          onSubmitEditing={handleLiveAskSend}
                          blurOnSubmit
                        />
                      </BlurView>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.liveAskSendOuter,
                        (!String(liveAskText || "").trim() ||
                          isSendingLiveQuestion ||
                          String(liveAskText || "").length > 75) &&
                          styles.liveAskSendOuterDisabled,
                      ]}
                      activeOpacity={0.7}
                      onPress={handleLiveAskSend}
                      disabled={
                        !String(liveAskText || "").trim() ||
                        isSendingLiveQuestion ||
                        String(liveAskText || "").length > 75
                      }
                    >
                      <BlurView
                        intensity={18}
                        tint="light"
                        style={styles.liveAskSendInner}
                      >
                        <ExpoIcons
                          family="MaterialIcons"
                          name="arrow-forward"
                          size={22}
                          color={colors.white}
                        />
                      </BlurView>
                    </TouchableOpacity>
                  </View>
                </View>

                {keyboardHeight === 0 ? (
                  <View style={[styles.liveReactionsRow, { marginTop: 10 }]}>
                    {liveQuickReactions.map((r) => {
                      const count = typeof r.count === "number" ? r.count : 0;
                      const isSelected = selectedLiveReactionKey === r.key;
                      const showCount = count > 0;
                      return (
                        <TouchableOpacity
                          key={r.key}
                          style={[
                            styles.liveReactionChip,
                            isSelected && styles.liveReactionChipPrimary,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleLiveReactionPress(r.key)}
                        >
                          <Text
                            style={[
                              styles.liveReactionEmoji,
                              isSelected && styles.liveReactionEmojiPrimary,
                            ]}
                          >
                            {r.emoji}
                          </Text>
                          {showCount ? (
                            <Text
                              style={[
                                styles.liveReactionCount,
                                isSelected && styles.liveReactionCountPrimary,
                              ]}
                            >
                              {formatCount(count)}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>
      </View>
      <QuestionModal
        visible={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        onContinue={confirmAndSendLiveQuestion}
        onCardPay={handleCardPayLiveQuestion}
        questionText={pendingQuestionText}
        account={item}
        isProcessing={isSendingLiveQuestion}
        isCardProcessing={isCardSendingLiveQuestion}
      />
      <GiftModal
        visible={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        liveStreamId={item?._id}
        creatorName={item?.author?.username}
        creatorAvatar={item?.author?.profile?.avatar}
        creatorIsVerified={item?.author?.profile?.isVerified}
        onDonationResponse={(apiData) => {
          const liveStream =
            apiData?.data?.data ??
            apiData?.data?.liveStream ??
            apiData?.liveStream ??
            apiData?.data ??
            null;
          const donations =
            liveStream?.donations ??
            apiData?.data?.donations ??
            apiData?.donations ??
            null;
          if (Array.isArray(donations)) {
            setLiveDonations(donations);
          }
        }}
        onGiftSent={() => {}}
      />
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        thumbnail={item?.video}
        title={item?.description}
        username={item?.author?.username}
        videoUrl={item?.video}
        short={item}
        shareUrl=""
      />

      <PeopleSheet
        url={peopleUrl}
        title={peopleTitle}
        people={peopleData}
        loading={peopleLoading}
        sheetRef={sheetRef}
        onSheetIndexChange={() => {}}
        onClose={() => {
          setPeopleUrl("");
          setPeopleTitle("");
          setPeopleData([]);
          setPeopleLoading(false);
        }}
        onProfilePress={(account) => {
          sheetRef.current?.close?.();
          if (currentUserId && currentUserId === account._id) {
            DeviceEventEmitter.emit("GO_TO_PROFILE_TAB");
            router.navigate("/(tabs)");
            return;
          }
          router.push({
            pathname: `/profile/${account._id}`,
            params: { userData: JSON.stringify(account) },
          });
        }}
      />
    </View>
  );
};

const ViewerStreamScreen = ({
  meetingId,
  userName,
  item,
  isTabBarVisible = true,
  safeAreaTopInset = 0,
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
    const fetchToken = async () => {
      try {
        const t = await getToken();
        setToken(t);
      } catch (_err) {}
    };
    fetchToken();
  }, []);
  if (!sdkReady || !token) {
    return null;
  }
  return (
    <MeetingProvider
      key={`sdk-viewer-stream-${meetingId}`}
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
        safeAreaTopInset={safeAreaTopInset}
      />
    </MeetingProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  videoContainer: { flex: 1, backgroundColor: "#000" },
  video: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  noVideo: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  liveTopInfo: {
    marginTop: 10,
    paddingHorizontal: 16,
    gap: 6,
    top: 95,
  },
  liveTitle: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 16 * 1.4,
    fontFamily: fonts.medium,
  },
  liveCaption: {
    color: "#FFFFFFA3",
    fontSize: 14,
    lineHeight: 14 * 1.4,
    fontFamily: fonts.regular,
  },
  liveTags: {
    color: "#FFFFFF7A",
    fontSize: 12,
    lineHeight: 12 * 1.4,
    fontFamily: fonts.regular,
  },
  liveLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
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
  liveFooter: {
    width: "100%",
    gap: 10,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 44,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 100,
    padding: 4,
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
  actionBtnWeb: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  actionBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  actionCount1: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: colors.black,
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
  liveReactionEmoji: {
    fontSize: 13,
    color: "#fff",
  },
  liveReactionEmojiPrimary: {
    color: "#121212",
  },
  liveReactionCount: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 13 * 1.2,
    fontFamily: fonts.medium,
  },
  liveReactionCountPrimary: {
    color: "#121212",
  },
  liveAskComposerWrapper: {
    width: "100%",
  },
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
  liveAskCounterTextOver: {
    color: "#EE1045",
  },
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
  liveAskSendOuterDisabled: {
    opacity: 0.35,
  },
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
  loadingTxt: {
    color: "#fff",
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
  },
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
});

export default ViewerStreamScreen;
