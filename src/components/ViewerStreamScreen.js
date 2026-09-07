import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
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
import LottieView from "lottie-react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import CommentModal from "../screens/Main/CommentScreen/molecules/CommentModal";
import ShareModal from "../screens/Main/Home/molecules/ShareModal";
import PeopleSheet from "../screens/Main/LiveScreens/molecules/PeopleSheet";
import { del, get, post } from "../services/ApiRequest";
import { ensureVideoSdkRegistered, getToken } from "../services/videosdk";
import { COLORS } from "../utils/COLORS";
import { uploadAndGetUrl } from "../utils/constants";
import { formatInstagramTime } from "../utils/liveStreamingUtils";
import { ToastMessage } from "../utils/ToastMessage";
import Blur from "./Blur";
import BottomSheetComponent from "./BottomSheetComponent";
import CustomText from "./CustomText";
import GiftModal from "./GiftModal";
import Icons from "./Icons";
import ImageFast from "./ImageFast";
import QuestionModal from "./QuestionModal";
import { useSocket } from "./SocketProvider";
import UploadImageCustom from "./UploadImageCustom";
import Text from "./ScaledText";

const QUESTION_PAYMENT_USD = 5;
const PAYMENT_INTENT_ENDPOINTS = [
  "payment",
  "payments",
  "payment/create-payment-intent",
  "payments/create-payment-intent",
  "create-payment-intent",
  "stripe/payment-intent",
  "stripe/create-payment-intent",
];

const unwrapPaymentIntentPayload = (res) => {
  const payload = res?.data?.data ?? res?.data ?? {};
  const paymentIntent = payload?.paymentIntent ?? payload?.intent ?? {};
  const clientSecret =
    payload?.clientSecret ??
    payload?.client_secret ??
    paymentIntent?.client_secret ??
    paymentIntent?.clientSecret ??
    null;
  const paymentIntentId =
    payload?.paymentIntentId ??
    payload?.payment_intent_id ??
    paymentIntent?.id ??
    payload?.id ??
    null;

  return { clientSecret, paymentIntentId };
};

const createQuestionPaymentIntent = async (amountInCents) => {
  let notFoundCount = 0;

  for (const endpoint of PAYMENT_INTENT_ENDPOINTS) {
    try {
      const res = await post(endpoint, {
        amount: amountInCents,
        currency: "USD",
      });
      const paymentIntent = unwrapPaymentIntentPayload(res);

      if (paymentIntent.clientSecret) return paymentIntent;
    } catch (error) {
      if (error?.status === 404) {
        notFoundCount += 1;
        continue;
      }

      throw error;
    }
  }

  throw {
    status: notFoundCount ? 404 : -1,
    message: "Payment endpoint not found",
  };
};

const getPaymentToastMessage = (error, fallback) => {
  const message = String(error?.message || "").trim();
  if (message && !/<html|<!doctype/i.test(message)) return message;
  return fallback;
};

const unwrapLiveStreamPayload = (value) => {
  let payload = value?.data ?? value;

  for (let i = 0; i < 5; i += 1) {
    if (!payload || Array.isArray(payload) || typeof payload !== "object") {
      return payload;
    }
    if (payload.liveStream && typeof payload.liveStream === "object") {
      payload = payload.liveStream;
      continue;
    }
    if (payload.item && typeof payload.item === "object") {
      payload = payload.item;
      continue;
    }
    if (payload.data !== undefined) {
      payload = payload.data;
      continue;
    }
    return payload;
  }

  return payload;
};

const getMeetingIdFromItem = (source) => {
  const item = unwrapLiveStreamPayload(source);
  return (
    item?.meetingId ||
    item?.metadata?.roomId ||
    item?.roomId ||
    item?.liveId ||
    null
  );
};

const getLiveStreamIdFromItem = (source) => {
  const item = unwrapLiveStreamPayload(source);
  return (
    item?._id ||
    item?.liveStreamId ||
    item?.liveId?._id ||
    item?.data?._id ||
    item?.id ||
    null
  );
};

const getListFromResponse = (res) => {
  const payload = unwrapLiveStreamPayload(res);
  return Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(res?.data?.items)
    ? res.data.items
    : [];
};

const formatCount = (count) => {
  const value = Number(count) || 0;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
};

const getAuthorMeta = (item, fallbackName) => {
  const normalizedItem = unwrapLiveStreamPayload(item) || {};
  const author = normalizedItem?.author ?? normalizedItem?.user ?? {};
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
    normalizedItem?.username ||
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

const getQuestionUser = (question) => {
  const candidates = [
    question?.user,
    question?.userId,
    question?.author,
    question?.createdBy,
    question?.askedBy,
    question?.viewer,
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate && typeof candidate === "object" && !Array.isArray(candidate),
    ) ?? {}
  );
};

const getQuestionUserId = (question) => {
  const user = getQuestionUser(question);
  const rawId =
    user?._id ??
    user?.id ??
    question?.userId?._id ??
    question?.userId?.id ??
    question?.user?._id ??
    question?.user?.id ??
    question?.viewer?._id ??
    question?.viewer?.id ??
    question?.author?._id ??
    question?.author?.id ??
    question?.createdBy?._id ??
    question?.createdBy?.id ??
    question?.askedBy?._id ??
    question?.askedBy?.id ??
    question?.userId;
  return typeof rawId === "string" || typeof rawId === "number"
    ? String(rawId).trim() || null
    : null;
};

const getQuestionUserMeta = (question) => {
  const user = getQuestionUser(question);
  const displayName =
    user?.profile?.displayName ||
    user?.displayName ||
    user?.name ||
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Display Name";
  const usernameRaw =
    user?.username ||
    String(displayName || "username")
      .toLowerCase()
      .replace(/\s+/g, "");
  const avatar =
    user?.profile?.avatar ||
    user?.avatar ||
    user?.profileImage ||
    user?.image ||
    null;
  const isPro = Boolean(user?.profile?.isPro || user?.isPro);

  return {
    displayName,
    username: String(usernameRaw || "username").startsWith("@")
      ? String(usernameRaw || "username")
      : `@${usernameRaw || "username"}`,
    avatar,
    isPro,
  };
};

const hasResolvedQuestionIdentity = (question) => {
  const userMeta = getQuestionUserMeta(question);
  return Boolean(
    userMeta.avatar ||
      userMeta.isPro ||
      userMeta.displayName !== "Display Name" ||
      userMeta.username !== "@username",
  );
};

const parseLiveQuestion = (first) => {
  if (!first) return null;
  const questionText = String(
    first?.answer ??
      first?.response ??
      first?.reply ??
      first?.question ??
      first?.text ??
      "",
  ).trim();
  if (!questionText) return null;
  const userMeta = getQuestionUserMeta(first);
  return {
    text: questionText,
    displayName: userMeta.displayName,
    username: userMeta.username,
    avatar: userMeta.avatar,
    isPro: userMeta.isPro,
    createdAt:
      String(first?.createdAt ?? first?.created_at ?? "") ||
      new Date().toISOString(),
  };
};

const getQuestionsArray = (source) => {
  const questions =
    source?.questions ??
    source?.data?.questions ??
    source?.data?.data?.questions ??
    [];
  return Array.isArray(questions) ? questions : [];
};

const parseLatestLiveQuestion = (source) => {
  const questions = Array.isArray(source) ? source : getQuestionsArray(source);
  const parsedQuestions = questions.map(parseLiveQuestion).filter(Boolean);
  if (!parsedQuestions.length) return null;

  return parsedQuestions.reduce((latest, question) => {
    const latestTime = Date.parse(String(latest?.createdAt ?? ""));
    const questionTime = Date.parse(String(question?.createdAt ?? ""));
    if (!Number.isFinite(latestTime)) return question;
    if (!Number.isFinite(questionTime)) return latest;
    return questionTime >= latestTime ? question : latest;
  });
};

const getParticipantsArray = (participants) => {
  if (!participants) return [];
  if (Array.isArray(participants)) return participants;
  if (typeof participants.values === "function") {
    return [...participants.values()];
  }
  return [];
};

const getUserIdFromViewerEntry = (entry) => {
  if (!entry) return null;
  if (typeof entry === "string" || typeof entry === "number") {
    return String(entry).trim() || null;
  }
  const user = entry?.user ?? entry?.viewer ?? entry?.account ?? entry;
  return String(user?._id ?? user?.id ?? entry?.userId ?? "").trim() || null;
};

const getUserFromViewerEntry = (entry) => {
  if (!entry || typeof entry !== "object") return null;
  const user = entry?.user ?? entry?.viewer ?? entry?.account ?? entry;
  if (!user || typeof user !== "object") return null;
  const id = user?._id ?? user?.id;
  const hasUserShape =
    id ||
    user?.username ||
    user?.firstName ||
    user?.lastName ||
    user?.profile ||
    user?.avatar;
  return hasUserShape ? user : null;
};

const commentHasLikedReaction = (reactions, userId) => {
  if (!Array.isArray(reactions) || !userId) return false;
  return reactions.some((reaction) => {
    if (!reaction) return false;
    if (typeof reaction === "string" || typeof reaction === "number") {
      return String(reaction) === String(userId);
    }
    if (typeof reaction === "object") {
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
    }
    return false;
  });
};

const mergeLikedStateIntoComments = (comments, likedCommentIds, userId) => {
  if (!Array.isArray(comments) || !userId)
    return Array.isArray(comments) ? comments : [];

  const applyLikedState = (comment) => {
    if (!comment || typeof comment !== "object") return comment;
    const commentId = String(comment?._id ?? comment?.id ?? "").trim();
    const shouldInjectLike = commentId && likedCommentIds?.[commentId];
    const alreadyLiked = commentHasLikedReaction(comment?.reactions, userId);
    const nextReactions =
      shouldInjectLike && !alreadyLiked
        ? [
            ...(Array.isArray(comment?.reactions) ? comment.reactions : []),
            { reaction: "like", user: { _id: userId } },
          ]
        : Array.isArray(comment?.reactions)
        ? comment.reactions
        : [];

    return {
      ...comment,
      reactions: nextReactions,
      replies: Array.isArray(comment?.replies)
        ? comment.replies.map(applyLikedState)
        : [],
    };
  };

  return comments.map(applyLikedState);
};

const parseLiveQuestionPayload = (payload) => {
  const rawQuestions =
    payload?.questions ??
    payload?.data?.questions ??
    payload?.data?.data?.questions ??
    payload?.data?.data ??
    null;
  const rawSingle =
    payload?.answer ??
    payload?.data?.answer ??
    payload?.data?.data?.answer ??
    payload?.question ??
    payload?.data?.question ??
    payload?.data?.data?.question ??
    null;
  const rawFallback = payload?.data?.data ?? payload?.data ?? payload ?? null;
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
  return { list, rawSingle };
};

const getLiveStreamIdFromSocketPayload = (payload, nestedObject) =>
  payload?.liveStreamId ??
  payload?.data?.liveStreamId ??
  payload?.data?.data?.liveStreamId ??
  nestedObject?.liveStreamId ??
  nestedObject?.liveStream?._id ??
  payload?.liveStream?._id ??
  payload?.liveStream ??
  null;

const LIVE_REACTION_OPTIONS = [
  { key: "joy", emoji: "😂", countKey: "joyCount" },
  { key: "like", emoji: "❤️", countKey: "likeCount" },
  { key: "haha", emoji: "🤣", countKey: "hahaCount" },
  { key: "love", emoji: "😍", countKey: "loveCount" },
  { key: "shy", emoji: "☺️", countKey: "shyCount" },
  { key: "wow", emoji: "😮", countKey: "wowCount" },
  { key: "smile", emoji: "😀", countKey: "smileCount" },
  { key: "neutral", emoji: "😐", countKey: "neutralCount" },
  { key: "sad", emoji: "☹️", countKey: "sadCount" },
  { key: "angry", emoji: "😡", countKey: "angryCount" },
];

const getLiveReactionCountKey = (reactionKey) =>
  LIVE_REACTION_OPTIONS.find((item) => item.key === reactionKey)?.countKey ??
  `${reactionKey}Count`;

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

const ParticipantView = ({
  participantId,
  videoEnabled = true,
  audioEnabled = true,
}) => {
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
      if (hostMicBroadcasting && audioEnabled) {
        micStream.resume();
        if (audioTrack && "enabled" in audioTrack) {
          audioTrack.enabled = true;
        }
      } else {
        micStream.pause();
        if (audioTrack && "enabled" in audioTrack) {
          audioTrack.enabled = false;
        }
      }
    } catch {
      /* ignore */
    }
  }, [audioEnabled, audioTrack, hostMicBroadcasting, micStream]);

  const shouldRenderVideo = Boolean(videoEnabled && webcamOn && videoTrack);

  const streamURL = useMemo(() => {
    try {
      const tracks = [];
      if (shouldRenderVideo) tracks.push(videoTrack);
      if (hostMicBroadcasting && audioEnabled && audioTrack)
        tracks.push(audioTrack);
      if (tracks.length === 0) return null;
      return new MediaStream(tracks).toURL();
    } catch (e) {
      return null;
    }
  }, [
    shouldRenderVideo,
    videoTrack,
    hostMicBroadcasting,
    audioEnabled,
    audioTrack,
  ]);

  if (shouldRenderVideo && streamURL) {
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
  userName,
  safeAreaTopInset = 0,
}) => {
  const { socket } = useSocket();
  const navigation = useNavigation();
  const { height: screenHeight } = useWindowDimensions();
  const userData = useSelector((state) => state?.users?.userData);
  const authUserId = useSelector((state) => state.auth?.user?._id);
  const commentUserData = userData?.user ?? userData ?? {};
  const currentUserId = commentUserData?._id || authUserId;
  const normalizedRouteItem = useMemo(
    () => unwrapLiveStreamPayload(item) || {},
    [item],
  );
  const [liveItem, setLiveItem] = useState(normalizedRouteItem);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLiked, setIsLiked] = useState(() =>
    (normalizedRouteItem?.reactions || []).some(
      (r) => r.reaction === "like" && r.user?._id === currentUserId,
    ),
  );
  const [likeCount, setLikeCount] = useState(() =>
    Array.isArray(normalizedRouteItem?.reactions)
      ? normalizedRouteItem.reactions.filter((r) => r.reaction === "like")
          .length
      : Number(
          normalizedRouteItem?.likeCount ??
            normalizedRouteItem?.reactionsCount ??
            0,
        ),
  );
  const [liveReactionCounts, setLiveReactionCounts] = useState(null);
  const [liveQuestion, setLiveQuestion] = useState(() => {
    return parseLatestLiveQuestion(normalizedRouteItem);
  });
  const [liveDonations, setLiveDonations] = useState(() => {
    const raw =
      normalizedRouteItem?.donations ??
      normalizedRouteItem?.data?.donations ??
      [];
    return Array.isArray(raw) ? raw : [];
  });
  const [isLiveAskOpen, setIsLiveAskOpen] = useState(false);
  const [liveAskText, setLiveAskText] = useState("");
  const [isSendingLiveQuestion, setIsSendingLiveQuestion] = useState(false);
  const [isCardSendingLiveQuestion, setIsCardSendingLiveQuestion] =
    useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedLiveReactionKey, setSelectedLiveReactionKey] = useState(null);
  const selectedLiveReactionKeyRef = useRef(null);
  const giftDonationSyncedRef = useRef(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [pendingQuestionText, setPendingQuestionText] = useState("");
  const [viewerVideoEnabled, setViewerVideoEnabled] = useState(true);
  const [viewerAudioEnabled, setViewerAudioEnabled] = useState(true);
  const [timerLabel, setTimerLabel] = useState("45:00");
  const [viewers, setViewers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsSortBy, setCommentsSortBy] = useState("mostRecent");
  const [likedCommentIds, setLikedCommentIds] = useState({});
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [peopleTitle, setPeopleTitle] = useState("");
  const [peopleData, setPeopleData] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const { isPlatformPaySupported, confirmPlatformPayPayment } =
    usePlatformPay();

  const viewEmittedRef = useRef(false);
  const leaveEmittedRef = useRef(false);
  const joinCalledRef = useRef(false);
  const isMountedRef = useRef(true);
  const liveEndedHandledRef = useRef(false);
  const socketRef = useRef(null);
  socketRef.current = socket;
  const liveAskInputRef = useRef(null);
  const commentSheetRef = useRef(null);
  const commentInputRef = useRef(null);
  const peopleSheetRef = useRef(null);
  const peopleFetchEpochRef = useRef(0);
  const questionUserCacheRef = useRef(new Map());

  const liveStreamId = getLiveStreamIdFromItem(liveItem);
  const liveStreamIdRef = useRef(liveStreamId);
  liveStreamIdRef.current = liveStreamId;

  useEffect(() => {
    const currentUser = userData?.user;
    const currentUserIdString = String(
      currentUser?._id ?? currentUser?.id ?? currentUserId ?? "",
    ).trim();
    if (currentUser && currentUserIdString) {
      questionUserCacheRef.current.set(currentUserIdString, currentUser);
    }
  }, [currentUserId, userData?.user]);

  const commentSnapPoints = useMemo(() => ["55%", "70%", "90%"], []);
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      emitLeave();
    };
  }, []);

  const { join, leave, participants } = useMeeting({
    onMeetingJoined: () => {
      if (!isMountedRef.current) return;
      setHasJoined(true);
      setIsLoading(false);
      emitView();
    },
    onMeetingLeft: () => {
      emitLeave();
      if (isMountedRef.current) setHasJoined(false);
    },
    onError: (error) => {
      const code = error?.code;
      if (code === 3044 && !hasJoined) return;
      console.error("Viewer stream meeting error:", error);
    },
  });

  const leaveRef = useRef(leave);
  leaveRef.current = leave;

  const emitView = useCallback(() => {
    const s = socketRef.current;
    const id = liveStreamIdRef.current;
    if (!s || !id) return;
    if (viewEmittedRef.current) return;
    s.emit("liveStream:view", { liveStreamId: id }, () => {});
    viewEmittedRef.current = true;
  }, []);

  const emitLeave = useCallback(() => {
    const s = socketRef.current;
    const id = liveStreamIdRef.current;
    if (!s || !id) return;
    if (!viewEmittedRef.current) return;
    if (leaveEmittedRef.current) return;
    s.emit("liveStream:leave", { liveStreamId: id }, () => {});
    leaveEmittedRef.current = true;
  }, []);

  const safeLeaveMeeting = useCallback(() => {
    try {
      const out = leaveRef.current?.();
      if (out?.then) out.catch(() => {});
    } catch {}
  }, []);

  const refreshLiveStreamMeta = useCallback(async () => {
    const id = liveStreamIdRef.current;
    if (!id) return;
    try {
      const res = await get(`live-stream/${id}`);
      const data = unwrapLiveStreamPayload(res);
      if (!data || String(getLiveStreamIdFromItem(data)) !== String(id)) return;

      setLiveItem(data);
      const liked = (data?.reactions || []).some(
        (r) => r.reaction === "like" && r.user?._id === currentUserId,
      );
      const currentReaction = (data?.reactions || []).find((reaction) => {
        const reactionUserId =
          reaction?.user?._id ?? reaction?.user?.id ?? reaction?.userId ?? null;
        return (
          reactionUserId && String(reactionUserId) === String(currentUserId)
        );
      });
      setIsLiked(liked);
      selectedLiveReactionKeyRef.current = currentReaction?.reaction ?? null;
      setSelectedLiveReactionKey(currentReaction?.reaction ?? null);
      setLikeCount(
        Number(
          data?.likeCount ??
            (Array.isArray(data?.reactions)
              ? data.reactions.filter((r) => r.reaction === "like").length
              : data?.reactionsCount) ??
            0,
        ),
      );
      setLiveReactionCounts({
        joyCount: Number(data?.joyCount ?? 0),
        likeCount: Number(data?.likeCount ?? data?.loveCount ?? 0),
        hahaCount: Number(data?.hahaCount ?? 0),
        loveCount: Number(data?.loveCount ?? 0),
        shyCount: Number(data?.shyCount ?? 0),
        wowCount: Number(data?.wowCount ?? 0),
        smileCount: Number(data?.smileCount ?? 0),
        neutralCount: Number(data?.neutralCount ?? 0),
        sadCount: Number(data?.sadCount ?? 0),
        angryCount: Number(data?.angryCount ?? 0),
      });
      const donations = data?.donations ?? data?.data?.donations ?? [];
      if (Array.isArray(donations)) setLiveDonations(donations);
      const nextQuestion = parseLatestLiveQuestion(data);
      setLiveQuestion(nextQuestion);
    } catch {}
  }, [currentUserId]);

  const leaveMeeting = useCallback(() => {
    safeLeaveMeeting();
    navigation.goBack();
  }, [navigation, safeLeaveMeeting]);

  const handleLike = useCallback(async () => {
    const id = liveStreamIdRef.current;
    if (!id) return;
    const prevLiked = isLiked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    try {
      setIsLiked(nextLiked);
      setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      if (nextLiked) {
        await post(`live-stream/${id}/like`, { reaction: "like" });
      } else {
        await del(`live-stream/${id}/unlike`);
      }
    } catch (error) {
      console.error("Like error:", error);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  }, [isLiked, likeCount]);

  const liveQuickReactions = useMemo(() => {
    const counts = liveReactionCounts || {};
    return LIVE_REACTION_OPTIONS.map((reaction) => ({
      ...reaction,
      count: Number(
        counts?.[reaction.countKey] ??
          (reaction.key === "like" ? likeCount : 0) ??
          0,
      ),
    }));
  }, [likeCount, liveReactionCounts]);

  const handleLiveReactionPress = useCallback(
    async (reactionKey) => {
      if (!reactionKey) return;
      const id = liveStreamIdRef.current;
      if (!id) return;
      const previousReactionKey = selectedLiveReactionKeyRef.current;
      if (previousReactionKey === reactionKey) return;
      const countKey = getLiveReactionCountKey(reactionKey);
      const previousCountKey = previousReactionKey
        ? getLiveReactionCountKey(previousReactionKey)
        : null;

      selectedLiveReactionKeyRef.current = reactionKey;
      setSelectedLiveReactionKey(reactionKey);
      setLiveReactionCounts((prev) => ({
        ...(prev || {}),
        ...(previousCountKey && previousCountKey !== countKey
          ? {
              [previousCountKey]: Math.max(
                0,
                Number(prev?.[previousCountKey] ?? 0) - 1,
              ),
            }
          : {}),
        [countKey]: Number(prev?.[countKey] ?? 0) + 1,
      }));
      if (reactionKey === "like") {
        setIsLiked(true);
        setLikeCount((prev) => Number(prev || 0) + 1);
      } else if (previousReactionKey === "like") {
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, Number(prev || 0) - 1));
      }
      try {
        await post(`live-stream/${id}/like`, { reaction: reactionKey });
        refreshLiveStreamMeta();
      } catch {
        selectedLiveReactionKeyRef.current = previousReactionKey;
        setSelectedLiveReactionKey(previousReactionKey);
        setLiveReactionCounts((prev) => ({
          ...(prev || {}),
          ...(previousCountKey && previousCountKey !== countKey
            ? {
                [previousCountKey]: Number(prev?.[previousCountKey] ?? 0) + 1,
              }
            : {}),
          [countKey]: Math.max(0, Number(prev?.[countKey] ?? 0) - 1),
        }));
        if (reactionKey === "like") {
          setIsLiked(false);
          setLikeCount((prev) => Math.max(0, Number(prev || 0) - 1));
        } else if (previousReactionKey === "like") {
          setIsLiked(true);
          setLikeCount((prev) => Number(prev || 0) + 1);
        }
      }
    },
    [refreshLiveStreamMeta],
  );

  const fetchLiveComments = useCallback(
    async (sortParam = commentsSortBy) => {
      const id = liveStreamIdRef.current;
      if (!id) return;
      try {
        setCommentsLoading(true);
        const sortQuery = sortParam ? `?sort=${sortParam}` : "";
        const response = await get(`live-stream/${id}/comments${sortQuery}`);
        if (response?.data?.success && response?.data?.data?.comments) {
          setComments(
            mergeLikedStateIntoComments(
              response.data.data.comments,
              likedCommentIds,
              currentUserId,
            ),
          );
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error("Error fetching live comments:", error);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    },
    [commentsSortBy, currentUserId, likedCommentIds],
  );

  const hydrateQuestionUser = useCallback(
    async (questionSource, fallbackQuestion = null) => {
      const question =
        questionSource && typeof questionSource === "object"
          ? questionSource
          : null;
      if (!question) return fallbackQuestion;

      if (hasResolvedQuestionIdentity(question)) {
        return parseLiveQuestion(question) || fallbackQuestion;
      }

      const questionUserId = getQuestionUserId(question);
      if (!questionUserId) {
        return parseLiveQuestion(question) || fallbackQuestion;
      }

      const cachedUser = questionUserCacheRef.current.get(questionUserId);
      if (cachedUser) {
        return (
          parseLiveQuestion({ ...question, user: cachedUser }) ||
          fallbackQuestion
        );
      }

      const currentUser = userData?.user;
      const currentUserIdString = String(
        currentUser?._id ?? currentUser?.id ?? currentUserId ?? "",
      ).trim();
      if (
        currentUser &&
        currentUserIdString &&
        currentUserIdString === questionUserId
      ) {
        questionUserCacheRef.current.set(questionUserId, currentUser);
        return (
          parseLiveQuestion({ ...question, user: currentUser }) ||
          fallbackQuestion
        );
      }

      try {
        const response = await get(`user/${questionUserId}`);
        const fetchedUser =
          response?.data?.data?.user ??
          response?.data?.data ??
          response?.data?.user ??
          response?.data ??
          null;
        if (fetchedUser && typeof fetchedUser === "object") {
          questionUserCacheRef.current.set(questionUserId, fetchedUser);
          return (
            parseLiveQuestion({ ...question, user: fetchedUser }) ||
            fallbackQuestion
          );
        }
      } catch {}

      return parseLiveQuestion(question) || fallbackQuestion;
    },
    [currentUserId, userData?.user],
  );

  const handleViewersPress = useCallback(async () => {
    const id = liveStreamIdRef.current;
    if (!id) return;

    setPeopleTitle("SEEN BY");
    setPeopleData([]);
    setPeopleLoading(true);
    peopleFetchEpochRef.current += 1;
    const epoch = peopleFetchEpochRef.current;
    peopleSheetRef.current?.expand?.();

    let source = liveItem || {};
    try {
      const response = await get(`live-stream/${id}`);
      const data = unwrapLiveStreamPayload(response);
      if (data && String(getLiveStreamIdFromItem(data)) === String(id)) {
        source = data;
        setLiveItem(data);
      }
    } catch {}

    const activeRaw =
      source?.activeViewers ?? source?.data?.activeViewers ?? [];
    const viewsRaw = source?.views ?? source?.data?.views ?? [];
    const sourceList = [
      ...(Array.isArray(activeRaw) ? activeRaw : []),
      ...(Array.isArray(viewsRaw) ? viewsRaw : []),
    ];

    const userMap = new Map();
    sourceList.forEach((entry) => {
      const user = getUserFromViewerEntry(entry);
      const userId = getUserIdFromViewerEntry(entry);
      if (user && userId) {
        userMap.set(userId, { ...user, _id: user?._id ?? userId });
      }
    });

    const ids = sourceList
      .map(getUserIdFromViewerEntry)
      .filter(Boolean)
      .filter((userId, index, list) => list.indexOf(userId) === index);

    try {
      const users = await Promise.all(
        ids
          .filter((userId) => !userMap.has(userId))
          .map(async (userId) => {
            try {
              const response = await get(`user/${userId}`);
              const user =
                response?.data?.data?.user ??
                response?.data?.data ??
                response?.data?.user ??
                response?.data ??
                null;
              return user && typeof user === "object"
                ? { ...user, _id: user?._id ?? userId }
                : null;
            } catch {
              return null;
            }
          }),
      );
      users.filter(Boolean).forEach((user) => {
        const userId = String(user?._id ?? user?.id ?? "").trim();
        if (userId) userMap.set(userId, user);
      });
    } finally {
      if (peopleFetchEpochRef.current !== epoch) return;
      setPeopleData(ids.map((userId) => userMap.get(userId)).filter(Boolean));
      setPeopleLoading(false);
    }
  }, [liveItem]);

  const handleComment = useCallback(() => {
    setIsLiveAskOpen(false);
    Keyboard.dismiss();
    setIsCommentSheetOpen(true);
    fetchLiveComments();
    requestAnimationFrame(() => {
      commentSheetRef.current?.snapToIndex?.(1);
    });
  }, [fetchLiveComments]);

  const handleCloseComments = useCallback(() => {
    Keyboard.dismiss();
    commentSheetRef.current?.close?.();
    setIsCommentSheetOpen(false);
    setReplyingTo(null);
    setSelectedImageUrl(null);
    setCommentText("");
  }, []);

  const handleCommentTabChange = useCallback(
    (tabIndex) => {
      const currentTabIndex =
        commentsSortBy === "mostLiked"
          ? 0
          : commentsSortBy === "mostRecent"
          ? 1
          : -1;
      if (currentTabIndex === tabIndex) {
        setCommentsSortBy("");
        fetchLiveComments("");
        return;
      }
      const sortParam = tabIndex === 0 ? "mostLiked" : "mostRecent";
      setCommentsSortBy(sortParam);
      fetchLiveComments(sortParam);
    },
    [commentsSortBy, fetchLiveComments],
  );

  const handleCommentReply = useCallback((comment) => {
    setReplyingTo(comment);
    requestAnimationFrame(() => {
      commentInputRef.current?.focus?.();
      commentSheetRef.current?.expand?.();
    });
  }, []);

  const handleCancelCommentReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleCommentEmojiPress = useCallback((emojiChar) => {
    setCommentText((prev) => (prev || "") + emojiChar);
    commentInputRef.current?.focus?.();
  }, []);

  const handleLiveCommentLike = useCallback(
    async (comment) => {
      const id = liveStreamIdRef.current;
      const commentId = comment?._id;
      if (!id || !commentId || !currentUserId) return;

      const isLiked =
        likedCommentIds?.[commentId] ||
        commentHasLikedReaction(comment?.reactions, currentUserId);

      setLikedCommentIds((prev) => {
        const next = { ...prev };
        if (isLiked) {
          delete next[commentId];
        } else {
          next[commentId] = true;
        }
        return next;
      });

      setComments((prevComments) =>
        prevComments.map((parentComment) => {
          if (parentComment._id === commentId) {
            const nextReactions = isLiked
              ? (parentComment.reactions || []).filter((reaction) => {
                  if (
                    typeof reaction === "string" ||
                    typeof reaction === "number"
                  ) {
                    return String(reaction) !== String(currentUserId);
                  }
                  const reactionUserId =
                    reaction?.user?._id ??
                    reaction?.user?.id ??
                    reaction?.userId ??
                    reaction?._id ??
                    reaction?.id;
                  return String(reactionUserId ?? "") !== String(currentUserId);
                })
              : [
                  ...(parentComment.reactions || []),
                  { reaction: "like", user: { _id: currentUserId } },
                ];

            return {
              ...parentComment,
              reactions: nextReactions,
              stats: {
                ...parentComment.stats,
                likes: isLiked
                  ? Math.max(0, Number(parentComment.stats?.likes || 0) - 1)
                  : Number(parentComment.stats?.likes || 0) + 1,
              },
            };
          }

          if (!Array.isArray(parentComment.replies)) {
            return parentComment;
          }

          return {
            ...parentComment,
            replies: parentComment.replies.map((reply) => {
              if (reply._id !== commentId) return reply;

              const nextReactions = isLiked
                ? (reply.reactions || []).filter((reaction) => {
                    if (
                      typeof reaction === "string" ||
                      typeof reaction === "number"
                    ) {
                      return String(reaction) !== String(currentUserId);
                    }
                    const reactionUserId =
                      reaction?.user?._id ??
                      reaction?.user?.id ??
                      reaction?.userId ??
                      reaction?._id ??
                      reaction?.id;
                    return (
                      String(reactionUserId ?? "") !== String(currentUserId)
                    );
                  })
                : [
                    ...(reply.reactions || []),
                    { reaction: "like", user: { _id: currentUserId } },
                  ];

              return {
                ...reply,
                reactions: nextReactions,
                stats: {
                  ...reply.stats,
                  likes: isLiked
                    ? Math.max(0, Number(reply.stats?.likes || 0) - 1)
                    : Number(reply.stats?.likes || 0) + 1,
                },
              };
            }),
          };
        }),
      );

      try {
        if (isLiked) {
          await del(
            `live-stream/${id}/unlike?commentId=${encodeURIComponent(
              commentId,
            )}`,
          );
        } else {
          await post(`live-stream/${id}/like`, {
            reaction: "like",
            commentId,
          });
        }
      } catch (error) {
        console.error("Error toggling live comment like:", error);
        setLikedCommentIds((prev) => {
          const next = { ...prev };
          if (isLiked) {
            next[commentId] = true;
          } else {
            delete next[commentId];
          }
          return next;
        });
        fetchLiveComments();
      }
    },
    [currentUserId, fetchLiveComments, likedCommentIds],
  );

  const handleCommentImageSelected = useCallback(async (result) => {
    setShowImagePicker(false);
    setIsUploadingImage(true);
    try {
      const url = await uploadAndGetUrl(result);
      if (url) setSelectedImageUrl(url);
    } catch (error) {
      console.error("Error uploading live comment image:", error);
      ToastMessage("Failed to upload image", "error");
    } finally {
      setIsUploadingImage(false);
    }
  }, []);

  const handleSendLiveComment = useCallback(async () => {
    const id = liveStreamIdRef.current;
    if (
      (!commentText?.trim() && !selectedImageUrl) ||
      !id ||
      isSubmittingComment ||
      isUploadingImage
    ) {
      return;
    }

    const currentCommentText = commentText.trim();
    const currentReplyingTo = replyingTo;
    const currentImageUrl = selectedImageUrl;
    const tempId = Date.now().toString();
    const replyParentId = currentReplyingTo?._id;
    const matchingEmoji = emojiData.find((e) => e.char === currentCommentText);
    const finalCommentContent = matchingEmoji
      ? matchingEmoji.url
      : currentCommentText;

    const optimisticComment = {
      _id: tempId,
      comment: finalCommentContent,
      ...(currentImageUrl && {
        attachment: { url: currentImageUrl, type: "image" },
      }),
      user: {
        _id: commentUserData?._id,
        firstName: commentUserData?.firstName || "Me",
        lastName: commentUserData?.lastName || "",
        username: commentUserData?.username || "me",
        profile: {
          avatar: commentUserData?.profile?.avatar || "",
          profileColor: commentUserData?.profile?.profileColor || COLORS.gray48,
        },
      },
      createdAt: new Date().toISOString(),
      isPosting: true,
      reactions: [],
      stats: { likes: 0, replies: 0 },
      replies: [],
    };

    if (currentReplyingTo) {
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === replyParentId ||
          (comment.replies || []).some((reply) => reply._id === replyParentId)
            ? {
                ...comment,
                replies: [...(comment.replies || []), optimisticComment],
                stats: {
                  ...comment.stats,
                  replies: (comment.stats?.replies || 0) + 1,
                },
              }
            : comment,
        ),
      );
    } else {
      setComments((prevComments) => [optimisticComment, ...prevComments]);
    }

    setCommentText("");
    setSelectedImageUrl(null);
    setReplyingTo(null);
    Keyboard.dismiss();

    const rollback = () => {
      if (currentReplyingTo) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment._id === replyParentId ||
            (comment.replies || []).some((reply) => reply._id === replyParentId)
              ? {
                  ...comment,
                  replies: (comment.replies || []).filter(
                    (reply) => reply._id !== tempId,
                  ),
                  stats: {
                    ...comment.stats,
                    replies: Math.max(0, (comment.stats?.replies || 0) - 1),
                  },
                }
              : comment,
          ),
        );
      } else {
        setComments((prevComments) =>
          prevComments.filter((comment) => comment._id !== tempId),
        );
      }
    };

    try {
      setIsSubmittingComment(true);
      const requestBody = { comment: finalCommentContent };
      if (replyParentId) requestBody.parentCommentId = replyParentId;
      if (currentImageUrl) {
        requestBody.attachment = { url: currentImageUrl, type: "image" };
      }

      const response = await post(`live-stream/${id}/comment`, requestBody);
      if (response?.data?.success && response?.data?.data) {
        const newComment = response.data.data;
        if (currentReplyingTo) {
          setComments((prevComments) =>
            prevComments.map((comment) => {
              const isTargetParent =
                comment._id === replyParentId ||
                (comment.replies || []).some(
                  (reply) => reply._id === replyParentId,
                );
              if (!isTargetParent) return comment;

              if (
                newComment?._id === comment._id &&
                Array.isArray(newComment?.replies)
              ) {
                return newComment;
              }

              return {
                ...comment,
                replies: (comment.replies || []).map((reply) =>
                  reply._id === tempId ? newComment : reply,
                ),
              };
            }),
          );
        } else {
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment._id === tempId ? newComment : comment,
            ),
          );
        }
      } else {
        rollback();
      }
    } catch (error) {
      console.error("Error posting live comment:", error);
      rollback();
    } finally {
      setIsSubmittingComment(false);
    }
  }, [
    commentText,
    commentUserData,
    emojiData,
    isSubmittingComment,
    isUploadingImage,
    replyingTo,
    selectedImageUrl,
  ]);

  const handleLiveAskOpen = useCallback(() => {
    setIsLiveAskOpen(true);
    requestAnimationFrame(() => {
      liveAskInputRef.current?.focus?.();
    });
  }, []);

  const handleLiveAskClose = useCallback(() => {
    setIsLiveAskOpen(false);
    setLiveAskText("");
    Keyboard.dismiss();
  }, []);

  const handleLiveAskSend = useCallback(() => {
    const message = String(liveAskText || "").trim();
    const id = liveStreamIdRef.current;
    if (!message || !id || isSendingLiveQuestion || isCardSendingLiveQuestion)
      return;
    setIsLiveAskOpen(false);
    Keyboard.dismiss();
    setPendingQuestionText(message);
    setShowQuestionModal(true);
  }, [isCardSendingLiveQuestion, isSendingLiveQuestion, liveAskText]);

  const confirmAndSendLiveQuestion = useCallback(async () => {
    const message = String(pendingQuestionText || "").trim();
    const id = liveStreamIdRef.current;
    if (!message || !id || isSendingLiveQuestion) return;
    setIsSendingLiveQuestion(true);
    try {
      let questionRes = null;

      if (Platform.OS === "ios" || Platform.OS === "android") {
        const amountInCents = Math.max(
          0,
          Math.round(QUESTION_PAYMENT_USD * 100),
        );
        const { clientSecret, paymentIntentId } =
          await createQuestionPaymentIntent(amountInCents);

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
                  amount: QUESTION_PAYMENT_USD.toFixed(2),
                },
              ],
            },
          });

          if (result?.error) {
            const code = String(result.error?.code ?? "").toLowerCase();
            if (code.includes("canceled") || code.includes("cancelled")) return;
            ToastMessage(
              `${result.error?.code ? `${result.error.code}: ` : ""}${
                result.error.message || "Apple Pay failed"
              }`,
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
              `${result.error?.code ? `${result.error.code}: ` : ""}${
                result.error.message || "Google Pay failed"
              }`,
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
      } else {
        questionRes = await post(`live-stream/${id}/question`, {
          question: message,
          userId: currentUserId,
        });
      }

      setShowQuestionModal(false);
      setLiveAskText("");
      setPendingQuestionText("");
      const payload = questionRes?.data?.data ?? questionRes?.data ?? {};
      const responseQuestion =
        payload?.question ??
        payload?.data?.question ??
        payload?.data?.data?.question ??
        payload?.data ??
        payload;
      const parsed =
        parseLiveQuestion(responseQuestion) ||
        parseLiveQuestion({
          question: message,
          user: userData?.user,
          createdAt: new Date().toISOString(),
        });
      if (parsed) {
        setLiveQuestion(parsed);
        hydrateQuestionUser(responseQuestion, parsed).then(
          (hydratedQuestion) => {
            if (hydratedQuestion) setLiveQuestion(hydratedQuestion);
          },
        );
      }
    } catch (error) {
      console.error("Error sending live question:", error);
      ToastMessage(
        getPaymentToastMessage(error, "Failed to send question"),
        "error",
      );
    } finally {
      setIsSendingLiveQuestion(false);
    }
  }, [
    confirmPlatformPayPayment,
    currentUserId,
    isPlatformPaySupported,
    isSendingLiveQuestion,
    pendingQuestionText,
    hydrateQuestionUser,
    userData?.user,
  ]);

  const handleCardPayLiveQuestion = useCallback(async () => {
    const message = String(pendingQuestionText || "").trim();
    const id = liveStreamIdRef.current;
    if (!message || !id || isCardSendingLiveQuestion || isSendingLiveQuestion)
      return;

    setIsCardSendingLiveQuestion(true);

    try {
      const amountInCents = Math.max(0, Math.round(QUESTION_PAYMENT_USD * 100));
      const { clientSecret, paymentIntentId } =
        await createQuestionPaymentIntent(amountInCents);

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

      const payload = questionRes?.data?.data ?? questionRes?.data ?? {};
      const responseQuestion =
        payload?.question ??
        payload?.data?.question ??
        payload?.data?.data?.question ??
        payload?.data ??
        payload;
      const parsed =
        parseLiveQuestion(responseQuestion) ||
        parseLiveQuestion({
          question: message,
          user: userData?.user,
          createdAt: new Date().toISOString(),
        });
      if (parsed) {
        setLiveQuestion(parsed);
        hydrateQuestionUser(responseQuestion, parsed).then(
          (hydratedQuestion) => {
            if (hydratedQuestion) setLiveQuestion(hydratedQuestion);
          },
        );
      }
    } catch (error) {
      console.error("Card payment error:", error);
      ToastMessage(
        getPaymentToastMessage(error, "Card payment failed"),
        "error",
      );
    } finally {
      setIsCardSendingLiveQuestion(false);
    }
  }, [
    currentUserId,
    hydrateQuestionUser,
    initPaymentSheet,
    isCardSendingLiveQuestion,
    isSendingLiveQuestion,
    pendingQuestionText,
    presentPaymentSheet,
    userData?.user,
  ]);

  const handleGift = useCallback(() => {
    const id = liveStreamIdRef.current;
    if (!id) {
      ToastMessage("Stream not found", "error");
      return;
    }
    setShowGiftModal(true);
  }, []);

  const handleGiftDonationResponse = useCallback((apiData) => {
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
      giftDonationSyncedRef.current = true;
      setLiveDonations(donations);
    }
  }, []);

  const handleGiftSent = useCallback(
    (gift) => {
      if (giftDonationSyncedRef.current) {
        giftDonationSyncedRef.current = false;
        return;
      }

      setLiveDonations((prev) => {
        return [
          {
            amount: gift?.price,
            gift: gift?.name,
            user: userData?.user,
            createdAt: new Date().toISOString(),
          },
          ...(prev || []),
        ].slice(0, 20);
      });
    },
    [userData?.user],
  );

  useEffect(() => {
    setLiveItem(normalizedRouteItem);
  }, [normalizedRouteItem]);

  useEffect(() => {
    const liked = (liveItem?.reactions || []).some(
      (r) => r.reaction === "like" && r.user?._id === currentUserId,
    );
    const currentReaction = (liveItem?.reactions || []).find((reaction) => {
      const reactionUserId =
        reaction?.user?._id ?? reaction?.user?.id ?? reaction?.userId ?? null;
      return reactionUserId && String(reactionUserId) === String(currentUserId);
    });
    setIsLiked(liked);
    selectedLiveReactionKeyRef.current = currentReaction?.reaction ?? null;
    setSelectedLiveReactionKey(currentReaction?.reaction ?? null);
    setLikeCount(
      Array.isArray(liveItem?.reactions)
        ? liveItem.reactions.filter((r) => r.reaction === "like").length
        : Number(liveItem?.likeCount ?? liveItem?.reactionsCount ?? 0),
    );
  }, [
    currentUserId,
    liveItem?._id,
    liveItem?.likeCount,
    liveItem?.reactions,
    liveItem?.reactionsCount,
  ]);

  useEffect(() => {
    setLiveReactionCounts({
      joyCount: Number(liveItem?.joyCount ?? 0),
      likeCount: Number(liveItem?.likeCount ?? liveItem?.loveCount ?? 0),
      hahaCount: Number(liveItem?.hahaCount ?? 0),
      loveCount: Number(liveItem?.loveCount ?? 0),
      shyCount: Number(liveItem?.shyCount ?? 0),
      wowCount: Number(liveItem?.wowCount ?? 0),
      smileCount: Number(liveItem?.smileCount ?? 0),
      neutralCount: Number(liveItem?.neutralCount ?? 0),
      sadCount: Number(liveItem?.sadCount ?? 0),
      angryCount: Number(liveItem?.angryCount ?? 0),
    });
    const donations = liveItem?.donations ?? liveItem?.data?.donations ?? [];
    setLiveDonations(Array.isArray(donations) ? donations : []);
    setLiveQuestion(parseLatestLiveQuestion(liveItem));
  }, [
    liveItem?._id,
    liveItem?.donations,
    liveItem?.questions,
    liveItem?.joyCount,
    liveItem?.hahaCount,
    liveItem?.likeCount,
    liveItem?.loveCount,
    liveItem?.shyCount,
    liveItem?.wowCount,
    liveItem?.smileCount,
    liveItem?.neutralCount,
    liveItem?.sadCount,
    liveItem?.angryCount,
  ]);

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
    const updateTimer = () => {
      const startMs = Date.parse(
        String(
          liveItem?.createdAt ||
            liveItem?.startedAt ||
            liveItem?.metadata?.createdAt ||
            "",
        ),
      );
      if (!Number.isFinite(startMs)) {
        setTimerLabel("45:00");
        return;
      }
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      const remaining = Math.max(0, 45 * 60 - elapsed);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimerLabel(
        `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [liveItem?.createdAt, liveItem?.metadata?.createdAt, liveItem?.startedAt]);

  useEffect(() => {
    const currentMeetingId = String(meetingId || "");
    if (!currentMeetingId || getLiveStreamIdFromItem(liveItem)) return;

    let mounted = true;
    (async () => {
      try {
        const res = await get("live-stream", { page: 1, limit: 30 });
        const found = getListFromResponse(res).find((stream) => {
          const streamMeetingId = getMeetingIdFromItem(stream);
          return (
            streamMeetingId && String(streamMeetingId) === currentMeetingId
          );
        });
        if (mounted && found) setLiveItem(found);
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, [liveItem, meetingId]);

  useEffect(() => {
    viewEmittedRef.current = false;
    leaveEmittedRef.current = false;
    joinCalledRef.current = false;
    setHasJoined(false);
    setIsLoading(true);

    const timer = setTimeout(() => {
      if (joinCalledRef.current) return;
      joinCalledRef.current = true;
      try {
        const out = join();
        if (out?.catch) out.catch(() => setIsLoading(false));
      } catch {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      emitLeave();
      safeLeaveMeeting();
    };
  }, [emitLeave, join, meetingId, safeLeaveMeeting]);

  useEffect(() => {
    const remoteCount = getParticipantsArray(participants).filter(
      (p) => !p.local,
    ).length;
    const viewsRaw = liveItem?.views ?? [];
    const activeRaw = liveItem?.activeViewers ?? [];
    const arrayCount = Math.max(
      Array.isArray(viewsRaw) ? viewsRaw.length : 0,
      Array.isArray(activeRaw) ? activeRaw.length : 0,
    );
    const statsCount = Number(
      liveItem?.stats?.viewers ??
        liveItem?.stats?.views ??
        liveItem?.stats?.activeViewers ??
        0,
    );
    setViewers(Math.max(0, remoteCount, arrayCount, statsCount));
  }, [participants, liveItem]);

  useEffect(() => {
    if (!hasJoined) return;
    refreshLiveStreamMeta();
    const interval = setInterval(refreshLiveStreamMeta, 15_000);
    return () => clearInterval(interval);
  }, [hasJoined, refreshLiveStreamMeta]);

  useEffect(() => {
    if (!hasJoined || !liveStreamId) return;
    emitView();
  }, [emitView, hasJoined, liveStreamId]);

  useEffect(() => {
    if (!socket) return;
    const reactionHandler = (payload) => {
      const currentId = liveStreamIdRef.current;
      const reactionObj =
        payload?.reaction ??
        payload?.data?.reaction ??
        payload?.liveStreamReaction ??
        payload?.data?.liveStreamReaction ??
        null;
      const payloadId =
        getLiveStreamIdFromSocketPayload(payload, reactionObj) ??
        payload?.reaction?.liveStreamId ??
        payload?.data?.reaction?.liveStreamId;
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
      const toNum = (value) => {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : undefined;
      };
      const nextCounts = {
        joyCount: toNum(source?.joyCount ?? source?.joy),
        likeCount: toNum(source?.likeCount ?? source?.likes),
        hahaCount: toNum(source?.hahaCount ?? source?.haha),
        loveCount: toNum(source?.loveCount ?? source?.love),
        shyCount: toNum(source?.shyCount ?? source?.shy),
        wowCount: toNum(source?.wowCount ?? source?.wow),
        smileCount: toNum(source?.smileCount ?? source?.smile),
        neutralCount: toNum(source?.neutralCount ?? source?.neutral),
        sadCount: toNum(source?.sadCount ?? source?.sad),
        angryCount: toNum(source?.angryCount ?? source?.angry),
      };
      const hasAnyCounts = Object.values(nextCounts).some(
        (value) => typeof value === "number",
      );

      if (!hasAnyCounts && reactionType) {
        const reactionUserId =
          reactionObj?.user?._id ??
          reactionObj?.user?.id ??
          reactionObj?.userId ??
          payload?.user?._id ??
          payload?.user?.id ??
          payload?.data?.user?._id ??
          payload?.data?.user?.id ??
          null;
        if (
          reactionUserId &&
          currentUserId &&
          String(reactionUserId) === String(currentUserId)
        ) {
          return;
        }
        const countKey = getLiveReactionCountKey(reactionType);
        const delta = action === "deleted" ? -1 : 1;
        setLiveReactionCounts((prev) => {
          const merged = prev ? { ...prev } : {};
          merged[countKey] = Math.max(
            0,
            (Number(merged[countKey]) || 0) + delta,
          );
          if (reactionType === "like") {
            setLikeCount(merged[countKey]);
          }
          return merged;
        });
        return;
      }

      setLiveReactionCounts((prev) => {
        const merged = prev ? { ...prev } : {};
        Object.keys(nextCounts).forEach((key) => {
          const value = nextCounts[key];
          if (typeof value === "number") merged[key] = value;
        });
        return merged;
      });
      if (typeof nextCounts.likeCount === "number") {
        setLikeCount(nextCounts.likeCount);
      }
    };

    const questionHandler = (payload) => {
      const currentId = liveStreamIdRef.current;
      const { list, rawSingle } = parseLiveQuestionPayload(payload);
      const payloadId = getLiveStreamIdFromSocketPayload(
        payload,
        rawSingle ?? list?.[0],
      );
      if (payloadId && currentId && String(payloadId) !== String(currentId)) {
        return;
      }
      const nextQuestion =
        parseLatestLiveQuestion(payload) ||
        parseLatestLiveQuestion(list) ||
        parseLiveQuestion(rawSingle);
      if (nextQuestion) {
        setLiveQuestion(nextQuestion);
        const questionSource =
          (Array.isArray(list) ? list[list.length - 1] : null) ?? rawSingle;
        if (questionSource && typeof questionSource === "object") {
          hydrateQuestionUser(questionSource, nextQuestion).then(
            (hydratedQuestion) => {
              if (hydratedQuestion) setLiveQuestion(hydratedQuestion);
            },
          );
        }
      }
    };

    const donationHandler = (payload) => {
      const currentId = liveStreamIdRef.current;
      const donationObj =
        payload?.donation ??
        payload?.data?.donation ??
        payload?.liveStreamDonation ??
        payload?.data?.liveStreamDonation ??
        null;
      const payloadId =
        getLiveStreamIdFromSocketPayload(payload, donationObj) ?? null;
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
          const donationId = String(donationObj?._id ?? donationObj?.id ?? "");
          if (
            donationId &&
            current.some(
              (item) => String(item?._id ?? item?.id ?? "") === donationId,
            )
          ) {
            return current;
          }
          return [donationObj, ...current].slice(0, 20);
        });
      }
    };

    const endedHandler = (payload) => {
      const currentId = liveStreamIdRef.current;
      const data = payload?.data ?? payload?.liveStream ?? payload ?? {};
      const payloadId =
        payload?.liveStreamId ?? payload?.data?.liveStreamId ?? data?._id;
      if (payloadId && currentId && String(payloadId) !== String(currentId)) {
        return;
      }
      if (liveEndedHandledRef.current) return;
      liveEndedHandledRef.current = true;
      emitLeave();
      safeLeaveMeeting();
      const safeNum = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
      };
      const startedAtMs = Date.parse(
        String(
          data?.createdAt ??
            data?.startedAt ??
            data?.metadata?.createdAt ??
            liveItem?.createdAt ??
            "",
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
      const totalViewers = Math.max(
        0,
        viewers,
        safeNum(
          data?.stats?.views ??
            data?.stats?.viewers ??
            data?.stats?.activeViewers,
        ),
        Array.isArray(data?.views) ? data.views.length : 0,
        Array.isArray(data?.activeViewers) ? data.activeViewers.length : 0,
      );
      navigation.replace("LiveEnded", {
        durationSeconds,
        totalViewers,
      });
    };

    socket.on("liveStream:reaction", reactionHandler);
    socket.on("liveStream:question", questionHandler);
    socket.on("liveStream:question:answered", questionHandler);
    socket.on("liveStream:answer", questionHandler);
    socket.on("liveStream:donation", donationHandler);
    socket.on("liveStream:ended", endedHandler);
    return () => {
      socket.off("liveStream:reaction", reactionHandler);
      socket.off("liveStream:question", questionHandler);
      socket.off("liveStream:question:answered", questionHandler);
      socket.off("liveStream:answer", questionHandler);
      socket.off("liveStream:donation", donationHandler);
      socket.off("liveStream:ended", endedHandler);
    };
  }, [
    emitLeave,
    liveItem?.createdAt,
    navigation,
    refreshLiveStreamMeta,
    safeLeaveMeeting,
    socket,
    hydrateQuestionUser,
    viewers,
  ]);

  const hostParticipant = getParticipantsArray(participants).find(
    (p) => !p.local,
  );
  const authorMeta = getAuthorMeta(liveItem, userName);
  const hashtags = Array.isArray(liveItem?.hashtags) ? liveItem.hashtags : [];
  const locationText =
    liveItem?.location?.address ||
    [liveItem?.location?.city, liveItem?.location?.country]
      .filter(Boolean)
      .join(", ");
  const bottomOffset = isLiveAskOpen ? keyboardHeight : 0;
  const handleShareLiveToStory = useCallback(async () => {
    const id = liveStreamId || liveItem?._id || meetingId;
    // const url = liveItem?.video || "";

    console.log("liveStreamId---", liveStreamId);

    if (!id) {
      ToastMessage("Unable to share this live to story", "error");
      return;
    }

    try {
      const res = await post("stories", {
        media: {
          url: "https://solagroup.s3.eu-north-1.amazonaws.com/1751189123443-QvXh-6wz8F-cRwp9.mp4",
          type: "video",
        },
        status: "active",
        liveStreamId: id,
      });

      setShowShareModal(false);
      ToastMessage("Live shared to story successfully", "success");
    } catch (error) {
      console.log("Error sharing live to story:", error);
      ToastMessage("Failed to share live to story", "error");
    }
  }, [liveItem?._id, liveItem?.video, liveStreamId, meetingId]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.videoContainer}>
        {hostParticipant && !isLoading ? (
          <ParticipantView
            participantId={hostParticipant.id}
            videoEnabled={viewerVideoEnabled}
            audioEnabled={viewerAudioEnabled}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <PulsingConnectingText />
          </View>
        )}

        <LinearGradient
          colors={["rgba(0,0,0,0.72)", "rgba(0,0,0,0.28)", "transparent"]}
          style={styles.topGradient}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.62)"]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        <View
          style={[styles.overlay, { paddingTop: safeAreaTopInset + 16 }]}
          pointerEvents="box-none"
        >
          <View style={styles.liveHeader}>
            <Pressable
              onPress={() =>
                navigation.navigate("UserProfile", {
                  userId: liveItem?.author?._id,
                })
              }
              style={styles.headerLeft}
            >
              <TouchableOpacity
                style={styles.headerCircle}
                onPress={leaveMeeting}
              >
                <Blur />
                <Icons
                  family="Ionicons"
                  name="chevron-back"
                  size={16}
                  color={COLORS.white}
                />
              </TouchableOpacity>

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
              {/* <TouchableOpacity style={styles.headerCircle}>
                <Blur borderColor="transparent" />
                <Icons
                  family="MaterialIcons"
                  name="add"
                  size={20}
                  color={COLORS.white}
                />
              </TouchableOpacity> */}
              <TouchableOpacity
                style={styles.headerCircle}
                onPress={() => setShowShareModal(true)}
              >
                <Blur borderColor="transparent" />
                <Icons
                  family="MaterialCommunityIcons"
                  name="dots-vertical"
                  size={20}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.liveInfo}>
            <View style={styles.statsRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.liveBadge}
                onPress={handleViewersPress}
              >
                <Icons
                  family="MaterialIcons"
                  name="visibility"
                  size={14}
                  color={COLORS.white}
                />
                <Text style={styles.liveBadgeCount}>
                  {formatCount(viewers)}
                </Text>
                <Text style={styles.liveBadgeLabel}> viewers</Text>
              </TouchableOpacity>
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>{timerLabel}</Text>
              </View>
            </View>
            {liveItem?.title ? (
              <Text style={styles.liveTitle} numberOfLines={1}>
                {liveItem?.title}
              </Text>
            ) : null}
            {liveItem?.description ? (
              <Text style={styles.liveCaption} numberOfLines={1}>
                {liveItem.description}
              </Text>
            ) : null}
            {hashtags.length > 0 ? (
              <Text style={styles.liveTags} numberOfLines={1}>
                {hashtags
                  .map((tag) => {
                    const text = String(tag ?? "").trim();
                    return text
                      ? text.startsWith("#")
                        ? text
                        : `#${text}`
                      : "";
                  })
                  .filter(Boolean)
                  .join("  ")}
              </Text>
            ) : null}
            {locationText ? (
              <View style={styles.locationRow}>
                <Icons
                  family="FontAwesome6"
                  name="location-dot"
                  size={10}
                  color={COLORS.white}
                />
                <Text style={styles.locationText} numberOfLines={1}>
                  {String(locationText).toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.floatingRightControls} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.floatingBtn}
              onPress={() => setViewerVideoEnabled((prev) => !prev)}
            >
              <Blur />
              <Icons
                family="MaterialIcons"
                name={viewerVideoEnabled ? "videocam" : "videocam-off"}
                size={22}
                color={COLORS.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.floatingBtn}
              onPress={() => setViewerAudioEnabled((prev) => !prev)}
            >
              <Blur />
              <Icons
                family="MaterialIcons"
                name={viewerAudioEnabled ? "volume-up" : "volume-off"}
                size={22}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[styles.bottomSection, { bottom: bottomOffset }]}
            pointerEvents="box-none"
          >
            <View style={styles.liveFooter} pointerEvents="auto">
              {liveQuestion?.text ? (
                <View style={styles.liveQuestionCard} pointerEvents="none">
                  <Blur />
                  <View style={styles.liveQuestionHeader}>
                    <Text style={styles.liveQuestionText} numberOfLines={2}>
                      {liveQuestion.text}
                    </Text>
                    <Image
                      source={Images.askQuestion}
                      style={styles.liveQuestionCommentIcon}
                      resizeMode="contain"
                      tintColor={COLORS.white}
                    />
                  </View>
                  <View style={styles.liveQuestionMetaRow}>
                    <View style={styles.liveQuestionUserRow}>
                      <Text style={styles.liveQuestionBy}>by</Text>
                      <Image
                        source={
                          typeof liveQuestion.avatar === "string" &&
                          liveQuestion.avatar
                            ? { uri: liveQuestion.avatar }
                            : Images.userIcon
                        }
                        style={styles.liveQuestionAvatar}
                      />
                      <Text style={styles.liveQuestionName} numberOfLines={1}>
                        {liveQuestion.displayName}
                      </Text>
                      {liveQuestion.isPro ? (
                        <Image
                          source={Images.verified}
                          style={styles.questionVerified}
                        />
                      ) : null}
                      <Text style={styles.metaDot}>•</Text>
                      <View style={styles.usernamePill}>
                        <Text style={styles.usernamePillText} numberOfLines={1}>
                          {liveQuestion.username}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.liveQuestionTime}>
                      {formatInstagramTime(liveQuestion.createdAt)} ago
                    </Text>
                  </View>
                </View>
              ) : null}

              {!isLiveAskOpen ? (
                <>
                  {liveDonations.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.liveTipsRow}
                    >
                      {liveDonations.slice(0, 10).map((donation, index) => {
                        const amount = Number(
                          donation?.amount ??
                            donation?.price ??
                            donation?.value ??
                            donation?.coins ??
                            0,
                        );
                        const donor =
                          donation?.user ??
                          donation?.donor ??
                          donation?.fromUser ??
                          {};
                        const avatar =
                          donor?.profile?.avatar ??
                          donor?.avatar ??
                          donor?.profileImage ??
                          donor?.image ??
                          null;
                        const key =
                          String(donation?._id ?? donation?.id ?? "") ||
                          `donation-${index}`;
                        return (
                          <View key={key} style={styles.liveTipChip}>
                            <Blur />
                            {avatar ? (
                              <Image
                                source={
                                  typeof avatar === "string" &&
                                  avatar && { uri: avatar }
                                }
                                style={styles.liveTipAvatar}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.liveChipUserColor,
                                  {
                                    backgroundColor:
                                      donor?.profile?.profileColor,
                                  },
                                ]}
                              />
                            )}

                            <Text style={styles.liveTipText}>
                              ${amount || 0}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  ) : null}

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.liveReactionsRow,
                      { marginTop: 10 },
                    ]}
                  >
                    {liveQuickReactions.map((reaction) => (
                      <TouchableOpacity
                        key={reaction.key}
                        style={[
                          styles.liveReactionChip,
                          selectedLiveReactionKey === reaction.key &&
                            styles.liveReactionChipPrimary,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleLiveReactionPress(reaction.key)}
                      >
                        <Blur />
                        <Text
                          style={[
                            styles.liveReactionEmoji,
                            selectedLiveReactionKey === reaction.key &&
                              styles.liveReactionEmojiPrimary,
                          ]}
                        >
                          {reaction.emoji}
                        </Text>
                        {reaction.count > 0 ? (
                          <Text
                            style={[
                              styles.liveReactionCount,
                              selectedLiveReactionKey === reaction.key &&
                                styles.liveReactionCountPrimary,
                            ]}
                          >
                            {formatCount(reaction.count)}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.buttonOuter}
                      onPress={handleLike}
                    >
                      <View
                        style={[
                          styles.actionBtn,
                          isLiked && styles.actionBtnActive,
                        ]}
                      >
                        <Blur />
                        <Icons
                          family="AntDesign"
                          name={isLiked ? "heart" : "hearto"}
                          size={18}
                          color={isLiked ? "#EE1045" : COLORS.gray64}
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.buttonOuter}
                      onPress={handleComment}
                    >
                      <View style={styles.actionBtn}>
                        <Blur borderColor="rgba(255,255,255,0.22)" />
                        <Image
                          source={Images.message || Images.chat}
                          style={styles.actionIconImage}
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.askBtnOuter}
                      pointerEvents="none"
                      onPress={handleLiveAskOpen}
                    >
                      <View style={styles.askBtn}>
                        <Blur borderColor="rgba(255,255,255,0.22)" />
                        {Images.question ? (
                          <Image
                            source={Images.question}
                            style={styles.askIconImage}
                          />
                        ) : (
                          <ImageFast
                            source={Images.askQuestion}
                            style={styles.askIconImage}
                          />
                        )}
                        <Text style={styles.askText}>Ask</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.buttonOuter}
                      pointerEvents="none"
                      onPress={() => setShowShareModal(true)}
                    >
                      <View style={styles.actionBtn}>
                        <Blur borderColor="rgba(255,255,255,0.22)" />
                        <Image
                          source={Images.right_up || Images.arrowUpRight}
                          style={styles.actionIconImage}
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.buttonOuter}
                      pointerEvents="none"
                      onPress={handleGift}
                    >
                      <View style={styles.actionBtn}>
                        <Blur borderColor="rgba(255,255,255,0.22)" />
                        <Icons
                          family="MaterialCommunityIcons"
                          name="hand-heart"
                          size={18}
                          color={COLORS.gray64}
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
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
                    <TouchableOpacity
                      style={styles.liveAskCloseOuter}
                      activeOpacity={0.7}
                      onPress={handleLiveAskClose}
                    >
                      <Blur />
                      <Icons
                        family="AntDesign"
                        name="close"
                        size={18}
                        color={COLORS.white}
                      />
                    </TouchableOpacity>
                    <View style={styles.liveAskInputPill}>
                      <Blur />
                      <TextInput
                        ref={liveAskInputRef}
                        value={liveAskText}
                        onChangeText={setLiveAskText}
                        editable={!isSendingLiveQuestion}
                        placeholder={`Ask @${authorMeta.username} or comment...`}
                        placeholderTextColor="rgba(255,255,255,0.55)"
                        style={styles.liveAskInput}
                        returnKeyType="send"
                        onSubmitEditing={handleLiveAskSend}
                        blurOnSubmit
                      />
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
                        blurType="light"
                        blurAmount={16}
                        style={styles.liveAskSendInner}
                      >
                        <Icons
                          family="MaterialIcons"
                          name="arrow-forward"
                          size={22}
                          color={COLORS.white}
                        />
                      </BlurView>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {isCommentSheetOpen ? (
        <>
          <View
            style={[
              styles.commentsSheetLayer,
              {
                height: screenHeight,
              },
            ]}
          >
            <BottomSheetComponent
              ref={commentSheetRef}
              snapPoints={commentSnapPoints}
              enableScrollView={false}
              enableDynamicSizing={false}
              initialIndex={1}
              enablePanDownToClose={false}
            >
              <View style={styles.commentSheetHeader}>
                <CustomText
                  fontFamily={fonts.semiBold}
                  label={`${comments.length || 0} Comment${
                    comments.length !== 1 ? "s" : ""
                  }`}
                  fontSize={20}
                />
                <ImageFast
                  onPress={handleCloseComments}
                  source={Images.commentCross}
                  style={styles.commentCloseIcon}
                />
              </View>
              <CommentModal
                isBottom
                comments={comments}
                loading={commentsLoading}
                post={{}}
                onReply={handleCommentReply}
                onLike={handleLiveCommentLike}
                userData={commentUserData}
                onTabChange={handleCommentTabChange}
                currentTab={
                  commentsSortBy === "mostLiked"
                    ? 0
                    : commentsSortBy === "mostRecent"
                    ? 1
                    : null
                }
              />
            </BottomSheetComponent>
          </View>

          <Animated.View
            style={[
              styles.commentInputContainer,
              {
                marginBottom:
                  Platform.OS === "android" && Platform.Version < 35
                    ? 0
                    : keyboardHeight,
              },
            ]}
          >
            <View>
              {replyingTo ? (
                <BlurView
                  style={styles.commentReplyBlur}
                  blurType="extraDark"
                  blurAmount={3}
                  reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.1)"
                >
                  <View style={styles.commentReplyIndicator}>
                    <View style={styles.commentReplyIndicatorLeft}>
                      <Icons
                        name="corner-down-right"
                        family="Feather"
                        size={14}
                        color="rgba(255, 255, 255, 0.64)"
                      />
                      <CustomText
                        label="Replying to "
                        fontSize={12}
                        color="rgba(255, 255, 255, 0.64)"
                        marginLeft={6}
                      />
                      {replyingTo?.comment?.startsWith(
                        "https://fonts.gstatic.com/s/e/notoemoji/latest/",
                      ) ? (
                        <LottieView
                          source={{ uri: replyingTo.comment }}
                          autoPlay
                          loop
                          style={styles.commentReplyEmoji}
                        />
                      ) : (
                        <CustomText
                          label={replyingTo?.comment || "user"}
                          fontSize={12}
                          color="rgba(255, 255, 255, 0.64)"
                          numberOfLines={1}
                        />
                      )}
                    </View>
                    <TouchableOpacity onPress={handleCancelCommentReply}>
                      <Icons
                        name="x"
                        family="Feather"
                        size={16}
                        color="rgba(255, 255, 255, 0.64)"
                      />
                    </TouchableOpacity>
                  </View>
                </BlurView>
              ) : null}

              <View style={styles.commentInputRow}>
                <View style={styles.commentInputWrapper}>
                  <Blur blurAmount={3} blurType="dark" />
                  <TextInput
                    ref={commentInputRef}
                    value={commentText}
                    style={styles.commentInput}
                    placeholder="Type message"
                    placeholderTextColor="rgba(255, 255, 255, 0.48)"
                    onChangeText={setCommentText}
                    multiline
                    maxLength={500}
                    editable={!isSubmittingComment}
                    onFocus={() => commentSheetRef.current?.expand?.()}
                  />

                  {selectedImageUrl ? (
                    <View style={styles.commentPreviewWrapper}>
                      <ImageFast
                        source={{ uri: selectedImageUrl }}
                        style={styles.commentPreviewImageInline}
                        isView
                      />
                      <TouchableOpacity
                        onPress={() => setSelectedImageUrl(null)}
                        style={styles.commentRemoveImageBtnInline}
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
                      onPress={() => setShowImagePicker(true)}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.white}
                          style={styles.commentUploadLoader}
                        />
                      ) : (
                        <Image
                          resizeMode="contain"
                          source={Images.commentCam}
                          style={styles.commentCamIcon}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleSendLiveComment}
                  style={[
                    styles.commentSendBtn,
                    ((!commentText?.trim() && !selectedImageUrl) ||
                      isSubmittingComment) &&
                      styles.commentSendBtnDisabled,
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
                      name="arrow-right"
                      family="Feather"
                      size={18}
                      color={COLORS.white}
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.commentEmojiStripContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.commentEmojiStripContent}
                >
                  {emojiData.map((emoji, index) => (
                    <TouchableOpacity
                      key={index.toString()}
                      style={styles.commentEmojiItem}
                      onPress={() => handleCommentEmojiPress(emoji.char)}
                      activeOpacity={0.7}
                    >
                      <LottieView
                        source={{ uri: emoji.url }}
                        autoPlay
                        loop
                        style={styles.commentEmojiLottie}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Animated.View>
        </>
      ) : null}

      <UploadImageCustom
        imageModal={showImagePicker}
        setImageModal={setShowImagePicker}
        handleChange={handleCommentImageSelected}
        handleCapture={handleCommentImageSelected}
        onDelete={() => {}}
      />

      <PeopleSheet
        title={peopleTitle || "SEEN BY"}
        people={peopleData}
        loading={peopleLoading}
        sheetRef={peopleSheetRef}
        onClose={() => {
          setPeopleTitle("");
          setPeopleData([]);
          setPeopleLoading(false);
        }}
      />

      <ShareModal
        isVisible={showShareModal}
        onClose={() => setShowShareModal(false)}
        postImage={liveItem?.video || authorMeta.avatar}
        username={authorMeta.username}
        date={
          liveItem?.createdAt ? formatInstagramTime(liveItem.createdAt) : "Live"
        }
        postId={liveStreamId || liveItem?._id || meetingId}
        urlPrefix="psc://live/"
        shouldTrackShare={false}
        shareMessage={`Watch this live stream on Private Social Club: psc://live/${
          liveStreamId || liveItem?._id || meetingId
        }`}
        onShareToStory={handleShareLiveToStory}
      />

      <QuestionModal
        visible={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        onContinue={confirmAndSendLiveQuestion}
        onCardPay={handleCardPayLiveQuestion}
        questionText={pendingQuestionText}
        account={liveItem}
        isProcessing={isSendingLiveQuestion}
        isCardProcessing={isCardSendingLiveQuestion}
      />

      <GiftModal
        visible={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        liveStreamId={liveStreamId}
        creatorName={authorMeta.username}
        creatorDisplayName={authorMeta.displayName}
        creatorAvatar={authorMeta.avatar}
        creatorIsVerified={authorMeta.isVerified}
        onDonationResponse={handleGiftDonationResponse}
        onGiftSent={handleGiftSent}
      />
    </View>
  );
};

export const ViewerStreamScreen = ({
  meetingId,
  userName = "Viewer",
  item = {},
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const normalizedItem = useMemo(
    () => unwrapLiveStreamPayload(item) || {},
    [item],
  );
  const itemLiveStreamId = getLiveStreamIdFromItem(normalizedItem);
  const itemMeetingId = getMeetingIdFromItem(normalizedItem);
  const effectiveMeetingId =
    meetingId && String(meetingId) !== String(itemLiveStreamId)
      ? meetingId
      : itemMeetingId || meetingId;
  const [token, setToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await ensureVideoSdkRegistered();
        const t = await getToken();
        setToken(t);
      } catch (error) {
        console.error("Error getting token:", error);
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  if (isInitializing || !token) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#EE1045" />
        <Text style={styles.initializingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: effectiveMeetingId,
        micEnabled: false,
        webcamEnabled: false,
        name: userName,
        mode: "CONFERENCE",
        multiStream: true,
      }}
      token={token}
    >
      <MeetingView
        item={normalizedItem}
        meetingId={effectiveMeetingId}
        userName={userName}
        isTabBarVisible={false}
        safeAreaTopInset={insets.top}
      />
    </MeetingProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  initializingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  videoContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  noVideo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  noVideoTxt: {
    color: "#fff",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    zIndex: 2,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    zIndex: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  liveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
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
  liveInfo: {
    marginTop: 18,
    paddingHorizontal: 22,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  liveBadge: {
    height: 28,
    borderRadius: 99,
    backgroundColor: "#EE1045",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  liveBadgeCount: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    marginLeft: 2,
  },
  liveBadgeLabel: {
    color: COLORS.gray64,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  timerBadge: {
    height: 28,
    borderRadius: 99,
    backgroundColor: "#EE1045",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  timerText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
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
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  locationText: {
    color: COLORS.gray64,
    fontSize: 10,
    fontFamily: fonts.semiBold,
  },
  floatingRightControls: {
    position: "absolute",
    right: 14,
    top: "40%",
    alignItems: "center",
  },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  bottomSection: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  liveFooter: { width: "100%", gap: 12 },
  liveQuestionCard: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.gray64,
    padding: 12,
  },

  liveQuestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  liveQuestionText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  liveQuestionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 18,
  },
  liveQuestionUserRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  liveQuestionCommentIcon: {
    height: 18,
    width: 18,
  },
  liveQuestionBy: {
    color: COLORS.gray64,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginRight: 3,
  },
  liveQuestionAvatar: {
    width: 14,
    height: 14,
    borderRadius: 99,
    marginRight: 3,
  },
  liveQuestionName: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: fonts.medium,
    maxWidth: "45%",
  },
  questionVerified: { height: 14, width: 14, marginLeft: 4 },
  metaDot: {
    color: COLORS.gray48,
    fontSize: 16,
    marginHorizontal: 6,
  },
  usernamePill: {
    height: 20,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    paddingHorizontal: 6,
    maxWidth: 80,
  },
  usernamePillText: {
    color: COLORS.gray64,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  liveQuestionTime: {
    color: COLORS.gray64,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  liveTipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 2,
  },
  liveTipChip: {
    height: 28,
    minWidth: 60,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    overflow: "hidden",
  },
  liveChipUserColor: {
    height: 18,
    width: 18,
    borderRadius: 99,
  },
  liveTipAvatar: { height: 20, width: 20, borderRadius: 99 },
  liveTipText: {
    color: COLORS.gray64,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  actionBtnActive: {
    borderColor: "rgba(238,16,69,0.8)",
  },
  actionIconImage: {
    height: 20,
    width: 20,
    resizeMode: "contain",
    tintColor: COLORS.gray48,
  },
  askBtnOuter: {
    height: 52,
    width: 143,
    borderWidth: 1,
    borderColor: COLORS.gray48,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },

  actionBtnActive: {
    borderColor: "rgba(238,16,69,0.8)",
  },
  actionIconImage: {
    height: 20,
    width: 20,
    resizeMode: "contain",
    tintColor: "rgba(255,255,255,0.75)",
  },
  askBtn: {
    height: 44,
    width: 135,
    borderRadius: 99,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    overflow: "hidden",
  },
  askIconImage: {
    width: 28,
    height: 28,
  },
  askText: {
    color: COLORS.black,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  liveAskComposerWrapper: { width: "100%" },
  liveAskCounterRow: {
    width: "100%",
    paddingHorizontal: 2,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  liveAskCounterText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#FFFFFFA3",
  },
  liveAskCounterTextOver: { color: "#EE1045" },
  liveAskComposerRow: {
    width: "100%",
    height: 54,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  liveAskInputPill: {
    flex: 1,
    height: 46,
    borderRadius: 24,
    overflow: "hidden",
  },
  liveAskInputPillInner: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  liveAskInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fonts.regular,
    paddingVertical: 0,
    paddingHorizontal: 12,
  },
  liveAskSendOuter: {
    width: 46,
    height: 46,
    borderRadius: 24,
    overflow: "hidden",
  },
  liveAskSendInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  liveAskCloseOuter: {
    width: 46,
    height: 46,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  liveAskCloseInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  liveAskSendOuterDisabled: { opacity: 0.35 },
  liveReactionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 6,
  },
  liveReactionChip: {
    height: 28,
    minWidth: 48,
    paddingHorizontal: 10,
    borderRadius: 99,
    // borderWidth: 1,
    // borderColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    overflow: "hidden",
  },
  liveReactionChipPrimary: {
    backgroundColor: COLORS.white,
    borderColor: "rgba(255,255,255,0.22)",
  },
  liveReactionEmoji: { fontSize: 13, color: COLORS.white },
  liveReactionEmojiPrimary: { color: "#121212" },
  liveReactionCount: {
    color: COLORS.white,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  liveReactionCountPrimary: { color: COLORS.black },
  buttonOuter: {
    height: 48,
    width: 48,
    borderWidth: 1,
    borderColor: COLORS.gray48,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  commentsSheetLayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  commentSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 4,
    paddingTop: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: COLORS.black,
  },
  commentCloseIcon: {
    width: 32,
    height: 32,
  },
  commentInputContainer: {
    position: "absolute",
    bottom: 16,
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 30,
    backgroundColor: "transparent",
  },
  commentReplyBlur: {
    backgroundColor: "transparent",
    borderRadius: 12,
    marginBottom: 4,
    overflow: "hidden",
  },
  commentReplyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
  },
  commentReplyIndicatorLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  commentReplyEmoji: {
    width: 20,
    height: 20,
    marginLeft: 4,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minHeight: 48,
    maxHeight: 48,
    borderRadius: 99,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 8,
    marginRight: 8,
    overflow: "hidden",
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 8,
    color: COLORS.white,
    fontFamily: fonts.regular,
    padding: 0,
    paddingTop: 8,
    paddingBottom: 8,
  },
  commentPreviewWrapper: {
    position: "relative",
  },
  commentPreviewImageInline: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  commentRemoveImageBtnInline: {
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
  commentUploadLoader: {
    marginHorizontal: 8,
  },
  commentCamIcon: {
    height: 22,
    width: 22,
    marginHorizontal: 8,
  },
  commentSendBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 99,
    backgroundColor: COLORS.buttonColor,
  },
  commentSendBtnDisabled: {
    opacity: 0.5,
  },
  commentEmojiStripContainer: {
    marginTop: 6,
  },
  commentEmojiStripContent: {
    paddingHorizontal: 4,
  },
  commentEmojiItem: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  commentEmojiLottie: {
    width: 32,
    height: 32,
  },
});

export default ViewerStreamScreen;
