import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MeetingProvider,
  RTCView,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-native-sdk";
import { BlurView } from "@react-native-community/blur";
import { useUploadProgress } from "../contexts/UploadProgressContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSocket } from "./SocketProvider";
import Icons from "./Icons";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import ShareModal from "../screens/Main/Home/molecules/ShareModal";
import { Images } from "../assets/images";
import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import { del, get, post } from "../services/ApiRequest";
import { formatInstagramTime } from "../utils/videosdk";
import CustomButton from "./CustomButton";
import LinearGradient from "react-native-linear-gradient";
import Blur from "./Blur";
import PeopleSheet from "../screens/Main/LiveScreens/molecules/PeopleSheet";
import ProgressiveBlur from "./ProgressiveBlur";
import Text from "./ScaledText";
import UserBadge from "./UserBadge";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const LIVE_STREAM_MAX_DURATION_SECONDS = 45 * 60;

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

const getLiveStreamIdFromItem = (source) => {
  const item = unwrapLiveStreamPayload(source);
  return item?._id || item?.liveStreamId || item?.id || null;
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
  const hasUserShape =
    user?._id ||
    user?.id ||
    user?.username ||
    user?.firstName ||
    user?.lastName ||
    user?.profile ||
    user?.avatar;
  return hasUserShape ? user : null;
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
  const isVerified = !!(user?.profile?.isVerified ?? user?.isVerified);
  const accountType = user?.accountType || "";

  return {
    displayName,
    username: String(usernameRaw || "username").startsWith("@")
      ? String(usernameRaw || "username")
      : `@${usernameRaw || "username"}`,
    avatar,
    isPro,
    isVerified,
    accountType,
  };
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
    isVerified: userMeta.isVerified,
    accountType: userMeta.accountType,
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

const waitForCameraFlip = async (result) => {
  if (result && typeof result.then === "function") {
    await result;
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
};

const setTrackTorch = async (track, torchOn) => {
  if (!track) return false;

  const attempts = [
    () =>
      typeof track?._setTorch === "function"
        ? track._setTorch(torchOn)
        : undefined,
    () =>
      typeof track?.setTorch === "function"
        ? track.setTorch(torchOn)
        : undefined,
    () =>
      typeof track?.applyConstraints === "function"
        ? track.applyConstraints({ advanced: [{ torch: torchOn }] })
        : undefined,
    () =>
      typeof track?.applyConstraints === "function"
        ? track.applyConstraints({ torch: torchOn })
        : undefined,
  ];

  for (const attempt of attempts) {
    const result = attempt();
    if (result === undefined) continue;
    try {
      await result;
      return true;
    } catch {}
  }

  return false;
};

// ─── Pulsing "Connecting..." text ─────────────────────────────────────────────
const PulsingConnectingText = ({ label = "Connecting..." }) => {
  const { colors, isDark } = useTheme();
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
        { color: isDark ? "#aaa" : colors.textSecondary, fontSize: 14, fontFamily: "Poppins_500Medium" },
        { opacity },
      ]}
    >
      {label}
    </Animated.Text>
  );
};

// ─── Grid Overlay ─────────────────────────────────────────────────────────────
const GridOverlay = () => (
  <View style={gridStyles.gridOverlay} pointerEvents="none">
    <View style={gridStyles.gridRow}>
      <View style={gridStyles.gridCell} />
      <View style={[gridStyles.gridCell, gridStyles.gridBorderLeft]} />
      <View style={[gridStyles.gridCell, gridStyles.gridBorderLeft]} />
    </View>
    <View style={[gridStyles.gridRow, gridStyles.gridBorderTop]}>
      <View style={gridStyles.gridCell} />
      <View style={[gridStyles.gridCell, gridStyles.gridBorderLeft]} />
      <View style={[gridStyles.gridCell, gridStyles.gridBorderLeft]} />
    </View>
    <View style={[gridStyles.gridRow, gridStyles.gridBorderTop]}>
      <View style={gridStyles.gridCell} />
      <View style={[gridStyles.gridCell, gridStyles.gridBorderLeft]} />
      <View style={[gridStyles.gridCell, gridStyles.gridBorderLeft]} />
    </View>
  </View>
);

const gridStyles = StyleSheet.create({
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
  },
  gridCell: { flex: 1 },
  gridBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.3)",
  },
  gridBorderTop: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
  },
});

// ─── CountdownOverlay: 10..1 then triggers onDone ────────────────────────────
const CountdownOverlay = ({
  onDone,
  safeAreaTopInset,
  onBack,
  flash,
  onToggleFlash,
  isWebcamOn,
  onToggleWebcam,
  isMicOn,
  onToggleMic,
  onToggleCameraFacing,
  showGrid,
  onToggleGrid,
}) => {
  const { colors, isDark } = useTheme();
  const [count, setCount] = useState(10);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (count <= 0) {
      onDone();
      return;
    }
    scale.setValue(1.4);
    Animated.timing(scale, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  const flashIconName =
    flash === "off" ? "flash-off" : flash === "on" ? "flash-on" : "flash-auto";

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]}>
      <StatusBar hidden />

      {/* Grid overlay on countdown screen too */}
      {showGrid ? <GridOverlay /> : null}

      <LinearGradient
        colors={[isDark ? COLORS.red1 : "rgba(250, 250, 250, 0.6)", "transparent"]}
        style={styles.topGradient}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", isDark ? COLORS.red1 : "rgba(250, 250, 250, 0.6)"]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={[cdStyles.topBar, { paddingTop: safeAreaTopInset + 10 }]}>
        <View style={cdStyles.topLeft}>
          <TouchableOpacity style={cdStyles.circleBtn} onPress={onBack}>
            <Blur />
            <Icons
              family="Ionicons"
              name="chevron-back"
              size={20}
              color={isDark ? COLORS.white : colors.text}
            />
          </TouchableOpacity>
          <Text style={[cdStyles.backText, { color: isDark ? COLORS.white : colors.text }]}>Back</Text>
        </View>

        {/* Duration badge center */}
        <View style={cdStyles.durationBadge} pointerEvents="none">
          <View style={cdStyles.durationBadgeInner}>
            <Text style={cdStyles.durationBadgeText}>45:00</Text>
          </View>
        </View>

        <TouchableOpacity style={cdStyles.circleBtn} onPress={onBack}>
          <Blur />
          <Icons
            family="Ionicons"
            name="close"
            size={24}
            color={isDark ? COLORS.white : colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Right-side controls */}
      <View style={cdStyles.rightSideIcons}>
        <TouchableOpacity style={cdStyles.sideIconBtn} onPress={onToggleWebcam}>
          <Blur />
          <Icons
            family="MaterialIcons"
            name={isWebcamOn ? "videocam" : "videocam-off"}
            size={22}
            color={isDark ? COLORS.white : colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity style={cdStyles.sideIconBtn} onPress={onToggleFlash}>
          <Blur />
          <Icons
            family="MaterialIcons"
            name={flashIconName}
            size={22}
            color={isDark ? COLORS.white : colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity style={cdStyles.sideIconBtn} onPress={onToggleGrid}>
          <Blur />
          <Image
            source={Images.grid}
            style={{
              height: 22,
              width: 22,
              tintColor: showGrid ? COLORS.red1 : (isDark ? COLORS.white : colors.text),
            }}
          />
        </TouchableOpacity>

        <TouchableOpacity style={cdStyles.sideIconBtn} onPress={onToggleMic}>
          <Blur />
          <Icons
            family="MaterialIcons"
            name={isMicOn ? "volume-up" : "volume-off"}
            size={22}
            color={isDark ? COLORS.white : colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={cdStyles.sideIconBtn}
          onPress={onToggleCameraFacing}
        >
          <Blur />
          <Image
            source={Images.CameraFlip}
            style={{ height: 22, width: 22, tintColor: isDark ? COLORS.white : colors.text }}
          />
        </TouchableOpacity>
      </View>

      {/* Countdown center */}
      <View style={cdStyles.center}>
        <Animated.Text style={[cdStyles.countText, { transform: [{ scale }], color: isDark ? COLORS.white : colors.text }]}>
          {count}
        </Animated.Text>
        <Text style={[cdStyles.startsInText, { color: isDark ? COLORS.white : colors.textSecondary }]}>Starts In...</Text>
      </View>
    </View>
  );
};

// ─── ParticipantView ──────────────────────────────────────────────────────────
const ParticipantView = ({ participantId, mirror, onVideoTrack }) => {
  const { colors, isDark } = useTheme();
  const { webcamStream, micStream, webcamOn, participant, consumeMicStreams } =
    useParticipant(participantId, {
      onStreamEnabled: () => {},
      onStreamDisabled: () => {},
    });

  const videoTrack = webcamStream?.track ?? null;
  const audioTrack = micStream?.track ?? null;
  const hostMicBroadcasting = participant?.micOn === true;

  useEffect(() => {
    onVideoTrack?.(videoTrack);
    return () => {
      onVideoTrack?.(null);
    };
  }, [onVideoTrack, videoTrack]);

  const consumeMicRef = useRef(consumeMicStreams);
  consumeMicRef.current = consumeMicStreams;
  useEffect(() => {
    consumeMicRef.current();
  }, [participantId]);

  useEffect(() => {
    if (!micStream) return;
    try {
      if (hostMicBroadcasting) micStream.resume();
      else micStream.pause();
    } catch {}
  }, [micStream, hostMicBroadcasting]);

  const streamURL = useMemo(() => {
    try {
      if (!webcamOn || !videoTrack) return null;
      const tracks = [videoTrack];
      if (hostMicBroadcasting && audioTrack) tracks.push(audioTrack);
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
        mirror={mirror}
        style={styles.video}
        zOrder={1}
      />
    );
  }

  return (
    <View style={[styles.noVideo, { backgroundColor: isDark ? "#000" : colors.background }]}>
      <Text style={[styles.noVideoTxt, { color: isDark ? "#666" : colors.textSecondary }]}>Camera Off</Text>
    </View>
  );
};

// ─── MeetingView ─────────────────────────────────────────────────────────────
const MeetingView = ({
  meetingId,
  liveStreamId: propLiveStreamId,
  userName,
  onBack,
  onStop,
  safeAreaTopInset = 0,
  liveTitle,
  liveCaption,
  liveTopic,
  liveLocation,
  flash,
  onToggleFlash,
  showGrid,
  onToggleGrid,
}) => {
  const { colors, isDark } = useTheme();
  const { setIsLiveUploading, setIsLiveUploaded } = useUploadProgress();
  const { socket } = useSocket();

  // ── countdown state ──
  const [countdownDone, setCountdownDone] = useState(false);

  const [hasJoined, setHasJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isWebcamOn, setIsWebcamOn] = useState(true);
  const [viewers, setViewers] = useState(0);
  const [duration, setDuration] = useState("45:00");
  const streamStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const socketRef = useRef(null);
  socketRef.current = socket;
  const liveStreamIdRef = useRef(null);
  const liveStreamId = propLiveStreamId || meetingId;
  liveStreamIdRef.current = liveStreamId;
  const liveEndedHandledRef = useRef(false);
  const liveEndedNavigateTimerRef = useRef(null);
  const lastLiveMetaRefreshAtRef = useRef(0);
  const localVideoTrackRef = useRef(null);
  const appliedFacingModeRef = useRef("front");
  const cameraSwitchingRef = useRef(false);
  const liveReactionByUserIdRef = useRef({});

  const [liveQuestion, setLiveQuestion] = useState(null);
  const [liveReactionCounts, setLiveReactionCounts] = useState({
    joyCount: 0,
    likeCount: 0,
    hahaCount: 0,
    loveCount: 0,
    shyCount: 0,
    wowCount: 0,
    smileCount: 0,
    neutralCount: 0,
    sadCount: 0,
    angryCount: 0,
  });
  const [likeCount, setLikeCount] = useState(0);
  const [selectedLiveReactionKey, setSelectedLiveReactionKey] = useState(null);
  const [liveDonations, setLiveDonations] = useState([]);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [localVideoTrackVersion, setLocalVideoTrackVersion] = useState(0);
  const [latestLiveItem, setLatestLiveItem] = useState(null);
  const [peopleTitle, setPeopleTitle] = useState("");
  const [peopleData, setPeopleData] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  // join retry
  const joinAttemptRef = useRef(0);
  const joinCalledRef = useRef(false);
  const peopleSheetRef = useRef(null);
  const peopleFetchEpochRef = useRef(0);
  const isEndingRef = useRef(false);
  isEndingRef.current = isEnding;
  const requestEndStreamRef = useRef(null);

  const item = useMemo(
    () => ({
      _id: liveStreamId,
      meetingId,
      title: liveTitle || "",
      description: liveCaption || "",
      topic: liveTopic || "",
      location: liveLocation ? { address: liveLocation } : null,
      hashtags: liveTopic ? [liveTopic] : [],
      video: null,
      reactions: [],
      likeCount: 0,
      donations: [],
      author: {
        _id: "host",
        fullName: userName,
        username: userName,
        profile: { avatar: null, displayName: userName },
      },
    }),
    [
      liveStreamId,
      meetingId,
      liveTitle,
      liveCaption,
      liveTopic,
      liveLocation,
      userName,
    ],
  );

  // Silence specific console errors
  useEffect(() => {
    const original = console.error;
    console.error = (...args) => {
      const joined = args.map((a) => String(a ?? "")).join(" ");
      if (
        joined.includes("Error fetching stats") &&
        joined.includes("InvalidStateError: closed")
      )
        return;
      if (typeof original === "function") return original(...args);
    };
    return () => {
      if (typeof original === "function") console.error = original;
    };
  }, []);

  const {
    join,
    leave,
    participants,
    localParticipant,
    toggleWebcam,
    toggleMic,
    changeWebcam,
  } = useMeeting({
    onMeetingJoined: () => {
      setHasJoined(true);
      streamStartTimeRef.current = Date.now();
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current);
      setDuration("45:00");
      durationIntervalRef.current = setInterval(() => {
        if (streamStartTimeRef.current) {
          const elapsedSeconds = Math.max(
            0,
            Math.floor((Date.now() - streamStartTimeRef.current) / 1000),
          );
          const remainingSeconds = Math.max(
            0,
            LIVE_STREAM_MAX_DURATION_SECONDS - elapsedSeconds,
          );
          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          setDuration(
            `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
          );
          if (remainingSeconds <= 0 && !isEndingRef.current) {
            setShowEndConfirmModal(false);
            requestEndStreamRef.current?.();
          }
        }
      }, 1000);
    },
    onMeetingLeft: () => {
      handleStopStream();
    },
    onError: (error) => {
      const code = error?.code;
      if (code === 3044) return; // already joined — ignore
      console.error("Host Meeting Error:", error?.message ?? error);
      if (!hasJoined && joinAttemptRef.current < 3) {
        joinAttemptRef.current += 1;
        setTimeout(() => {
          try {
            join();
          } catch {}
        }, 1500 * joinAttemptRef.current);
      }
    },
  });

  const joinRef = useRef(join);
  joinRef.current = join;
  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  // Keep changeWebcam in a ref so CountdownOverlay callback stays fresh
  const changeWebcamRef = useRef(changeWebcam);
  changeWebcamRef.current = changeWebcam;

  // Track current facing mode so we can switch it
  const [facingMode, setFacingMode] = useState("front"); // start front

  const handleLocalVideoTrack = useCallback(
    (track) => {
      if (!track) {
        localVideoTrackRef.current = null;
        return;
      }
      if (localVideoTrackRef.current !== track) {
        setLocalVideoTrackVersion((version) => version + 1);
      }
      localVideoTrackRef.current = track;
      if (appliedFacingModeRef.current === facingMode) return;
      try {
        if (typeof track?._switchCamera === "function") {
          track._switchCamera();
          appliedFacingModeRef.current = facingMode;
        } else if (typeof track?.switchCamera === "function") {
          track.switchCamera();
          appliedFacingModeRef.current = facingMode;
        }
      } catch {}
    },
    [facingMode],
  );

  const safeLeaveMeeting = useCallback(() => {
    const leaveFn = leaveRef.current;
    if (typeof leaveFn !== "function") return;
    try {
      const out = leaveFn();
      if (out != null && typeof out.then === "function") out.catch(() => {});
    } catch {}
  }, []);

  const viewEmittedRef = useRef(false);
  const leaveEmittedRef = useRef(false);
  const liveStreamSocketRoomRef = useRef(null);

  const emitView = useCallback(() => {
    const s = socketRef.current;
    const id = liveStreamIdRef.current;
    const roomKey = `${id}:${s?.id ?? "socket"}`;
    if (!s || !id || liveStreamSocketRoomRef.current === roomKey) return;
    s.emit("liveStream:view", { liveStreamId: id }, () => {});
    liveStreamSocketRoomRef.current = roomKey;
    viewEmittedRef.current = true;
    leaveEmittedRef.current = false;
  }, []);

  const emitLeave = useCallback(() => {
    const s = socketRef.current;
    const id = liveStreamIdRef.current;
    if (!s || !id || !viewEmittedRef.current || leaveEmittedRef.current) return;
    s.emit("liveStream:leave", { liveStreamId: id }, () => {});
    leaveEmittedRef.current = true;
    liveStreamSocketRoomRef.current = null;
  }, []);

  useEffect(() => {
    if (!hasJoined || !socket || !liveStreamId) return;
    emitView();
  }, [emitView, hasJoined, liveStreamId, socket]);

  useEffect(() => {
    return () => {
      emitLeave();
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current);
      if (liveEndedNavigateTimerRef.current)
        clearTimeout(liveEndedNavigateTimerRef.current);
    };
  }, [emitLeave]);

  // ── Join AFTER countdown is done ──────────────────────────────────────────
  useEffect(() => {
    if (!countdownDone) return;
    if (joinCalledRef.current) return;
    if (!meetingId) return;

    joinCalledRef.current = true;
    setIsLiveUploading(true);

    const tryJoin = async () => {
      try {
        await joinRef.current();
      } catch (error) {
        console.error(
          "Failed to join meeting (attempt):",
          error?.message ?? error,
        );
        if (!hasJoined) {
          joinAttemptRef.current += 1;
          if (joinAttemptRef.current < 4) {
            setTimeout(tryJoin, 1500);
          } else {
            setIsLiveUploading(false);
          }
        }
      }
    };
    tryJoin();
  }, [countdownDone, meetingId]);

  // ── Camera facing toggle — uses VideoSDK changeWebcam ─────────────────────
  const handleToggleCameraFacing = useCallback(async () => {
    if (cameraSwitchingRef.current) return;
    const nextFacing = facingMode === "front" ? "back" : "front";
    const track = localVideoTrackRef.current;
    let didSwitch = false;
    cameraSwitchingRef.current = true;
    try {
      if (typeof track?._switchCamera === "function") {
        await waitForCameraFlip(track._switchCamera());
        didSwitch = true;
      } else if (typeof track?.switchCamera === "function") {
        await waitForCameraFlip(track.switchCamera());
        didSwitch = true;
      } else if (typeof changeWebcamRef.current === "function") {
        await waitForCameraFlip(
          changeWebcamRef.current(
            nextFacing === "back" ? "environment" : "front",
          ),
        );
        didSwitch = true;
      }
    } catch (e) {
      console.warn("camera toggle error:", e);
    } finally {
      cameraSwitchingRef.current = false;
    }

    if (!didSwitch) return;

    appliedFacingModeRef.current = nextFacing;
    setFacingMode(nextFacing);
    if (flash !== "off" && nextFacing === "front") {
      onToggleFlash?.("off");
    }
  }, [facingMode, flash, onToggleFlash]);

  useEffect(() => {
    let cancelled = false;
    const retryDelays = [0, 180, 450];

    const applyTorch = async () => {
      const track = localVideoTrackRef.current;
      const torchOn = flash === "on" && facingMode === "back";
      await setTrackTorch(track, torchOn);
    };

    const timers = retryDelays.map((delay) =>
      setTimeout(() => {
        if (!cancelled) applyTorch();
      }, delay),
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [facingMode, flash, localVideoTrackVersion]);

  const handleToggleMic = useCallback(() => {
    toggleMic();
    setIsMicOn((prev) => !prev);
  }, [toggleMic]);

  const handleToggleWebcam = useCallback(() => {
    toggleWebcam();
    setIsWebcamOn((prev) => !prev);
  }, [toggleWebcam]);

  const handleStopStream = useCallback(() => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    const durationSeconds = streamStartTimeRef.current
      ? Math.floor((Date.now() - streamStartTimeRef.current) / 1000)
      : 0;
    setIsLiveUploaded(true);
    setTimeout(() => {
      setIsLiveUploading(false);
    }, 2000);
    if (onStop)
      onStop({ durationSeconds, totalViewers: viewers, liveStreamId });
    leave();
  }, [
    viewers,
    onStop,
    liveStreamId,
    leave,
    setIsLiveUploading,
    setIsLiveUploaded,
  ]);

  const handleBack = useCallback(() => {
    setShowEndConfirmModal(true);
  }, []);

  useEffect(() => {
    setViewers(participants?.size || 0);
  }, [participants]);

  // ── Reactions strip data ──────────────────────────────────────────────────
  const formatCount = (count) => {
    if (!count || count === 0) return "0";
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "k";
    return String(count);
  };

  const liveQuickReactions = useMemo(() => {
    const s = liveReactionCounts || {};
    return LIVE_REACTION_OPTIONS.map((reaction) => ({
      ...reaction,
      count: Number(
        s?.[reaction.countKey] ??
          (reaction.key === "like" ? likeCount : 0) ??
          0,
      ),
    }));
  }, [liveReactionCounts, likeCount]);

  const handleViewersPress = useCallback(async () => {
    const id = liveStreamIdRef.current;
    if (!id) return;

    setPeopleTitle("SEEN BY");
    setPeopleData([]);
    setPeopleLoading(true);
    peopleFetchEpochRef.current += 1;
    const epoch = peopleFetchEpochRef.current;
    peopleSheetRef.current?.expand?.();

    let source = latestLiveItem || item || {};
    try {
      const response = await get(`live-stream/${id}`);
      const data = unwrapLiveStreamPayload(response);
      if (data && String(getLiveStreamIdFromItem(data)) === String(id)) {
        source = data;
        setLatestLiveItem(data);
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
  }, [item, latestLiveItem]);

  const handleLiveReactionPress = async (reactionKey) => {
    if (!reactionKey || !item?._id) return;
    setSelectedLiveReactionKey(reactionKey);
    try {
      await post(`live-stream/${item._id}/like`, { reaction: reactionKey });
    } catch {}
  };

  // ── refreshLiveStreamMeta ────────────────────────────────────────────────
  const refreshLiveStreamMeta = useRef(null);
  refreshLiveStreamMeta.current = async () => {
    const id = liveStreamIdRef.current;
    if (!id) return;
    const now = Date.now();
    if (now - lastLiveMetaRefreshAtRef.current < 1200) return;
    lastLiveMetaRefreshAtRef.current = now;
    try {
      const res = await get(`live-stream/${id}`);
      const payload = res?.data?.data ?? res?.data?.data?.data ?? res?.data;
      const data = payload?.liveStream ?? payload?.item ?? payload;
      if (!data || String(data?._id ?? "") !== String(id)) return;
      setLatestLiveItem(data);
      if (Array.isArray(data?.reactions)) {
        liveReactionByUserIdRef.current = data.reactions.reduce(
          (acc, reaction) => {
            const userId =
              reaction?.user?._id ??
              reaction?.user?.id ??
              reaction?.userId ??
              null;
            if (userId && reaction?.reaction) {
              acc[String(userId)] = reaction.reaction;
            }
            return acc;
          },
          {},
        );
      }
      setLikeCount(Number(data?.likeCount ?? 0));
      const activeRaw = data?.activeViewers ?? data?.data?.activeViewers ?? [];
      const viewsRaw = data?.views ?? data?.data?.views ?? [];
      const arrayCount = Math.max(
        Array.isArray(activeRaw) ? activeRaw.length : 0,
        Array.isArray(viewsRaw) ? viewsRaw.length : 0,
      );
      const statsCount = Number(
        data?.stats?.viewers ??
          data?.stats?.views ??
          data?.stats?.activeViewers ??
          0,
      );
      setViewers((prev) =>
        Math.max(0, Number(prev) || 0, arrayCount, statsCount),
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
      setLiveQuestion(parseLatestLiveQuestion(data));
    } catch {}
  };

  useEffect(() => {
    if (!hasJoined) return;
    const interval = setInterval(() => {
      refreshLiveStreamMeta.current?.();
    }, 6000);
    return () => clearInterval(interval);
  }, [hasJoined]);

  useEffect(() => {
    setLiveQuestion(parseLatestLiveQuestion(latestLiveItem));
  }, [latestLiveItem]);

  // ── Socket: question ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      const currentId = liveStreamIdRef.current;
      const { list, rawSingle } = parseLiveQuestionPayload(payload);
      const payloadId = getLiveStreamIdFromSocketPayload(
        payload,
        rawSingle ?? list?.[0],
      );
      if (payloadId && currentId && String(payloadId) !== String(currentId))
        return;
      const nextQuestion =
        parseLatestLiveQuestion(payload) ||
        parseLatestLiveQuestion(list) ||
        parseLiveQuestion(rawSingle);
      setLiveQuestion(nextQuestion);
    };
    socket.on("liveStream:question", handler);
    socket.on("liveStream:question:answered", handler);
    socket.on("liveStream:answer", handler);
    return () => {
      socket.off("liveStream:question", handler);
      socket.off("liveStream:question:answered", handler);
      socket.off("liveStream:answer", handler);
    };
  }, [socket]);

  // ── Socket: reaction ─────────────────────────────────────────────────────
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
        getLiveStreamIdFromSocketPayload(payload, reactionObj) ?? null;
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
        joyCount: toNum(source?.joyCount ?? source?.joy),
        // likeCount: toNum(source?.likeCount ?? source?.likes),
        hahaCount: toNum(source?.hahaCount ?? source?.haha),
        loveCount: toNum(source?.loveCount ?? source?.love),
        shyCount: toNum(source?.shyCount ?? source?.shy),
        wowCount: toNum(source?.wowCount ?? source?.wow),
        smileCount: toNum(source?.smileCount ?? source?.smile),
        neutralCount: toNum(source?.neutralCount ?? source?.neutral),
        sadCount: toNum(source?.sadCount ?? source?.sad),
        angryCount: toNum(source?.angryCount ?? source?.angry),
      };
      const hasAnyCounts = Object.values(next).some(
        (v) => typeof v === "number",
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
        const countKey = getLiveReactionCountKey(reactionType);
        const previousReactionKey = reactionUserId
          ? liveReactionByUserIdRef.current?.[reactionUserId]
          : null;
        const previousCountKey = previousReactionKey
          ? getLiveReactionCountKey(previousReactionKey)
          : null;
        if (
          action === "created" ||
          action === "added" ||
          action === "updated" ||
          action === "changed" ||
          action === "replaced"
        ) {
          if (reactionUserId) {
            liveReactionByUserIdRef.current = {
              ...liveReactionByUserIdRef.current,
              [reactionUserId]: reactionType,
            };
          }
          setLiveReactionCounts((prev) => {
            const merged = prev ? { ...prev } : {};
            if (previousCountKey && previousCountKey !== countKey) {
              merged[previousCountKey] = Math.max(
                0,
                (Number(merged[previousCountKey]) || 0) - 1,
              );
            }
            if (previousReactionKey !== reactionType) {
              merged[countKey] = (Number(merged[countKey]) || 0) + 1;
            }
            if (reactionType === "like") {
              setLikeCount(merged[countKey]);
            } else if (previousReactionKey === "like" && previousCountKey) {
              setLikeCount(merged[previousCountKey]);
            }
            return merged;
          });
        } else if (action === "deleted") {
          if (reactionUserId) {
            const nextByUser = { ...liveReactionByUserIdRef.current };
            delete nextByUser[reactionUserId];
            liveReactionByUserIdRef.current = nextByUser;
          }
          setLiveReactionCounts((prev) => {
            const merged = prev ? { ...prev } : {};
            merged[countKey] = Math.max(0, (Number(merged[countKey]) || 0) - 1);
            if (reactionType === "like") {
              setLikeCount(merged[countKey]);
            }
            return merged;
          });
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
      if (typeof next.likeCount === "number") setLikeCount(next.likeCount);
    };
    socket.on("liveStream:reaction", handler);
    return () => {
      socket.off("liveStream:reaction", handler);
    };
  }, [socket]);

  // ── Socket: donation ─────────────────────────────────────────────────────
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
        getLiveStreamIdFromSocketPayload(payload, donationObj) ?? null;
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
    socket.on("liveStream:donation", handler);
    return () => {
      socket.off("liveStream:donation", handler);
    };
  }, [socket]);

  // ── Socket: ended ────────────────────────────────────────────────────────
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
      if (payloadId && currentId && String(payloadId) !== String(currentId))
        return;
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
        String(data?.createdAt ?? data?.startedAt ?? ""),
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
        data?.stats?.views ?? data?.stats?.viewers ?? 0,
      );
      const totalViewers = Math.max(0, fromStats);
      if (liveEndedNavigateTimerRef.current)
        clearTimeout(liveEndedNavigateTimerRef.current);
      liveEndedNavigateTimerRef.current = setTimeout(() => {
        liveEndedNavigateTimerRef.current = null;
        if (onStop)
          onStop({
            durationSeconds,
            totalViewers,
            liveStreamId: liveStreamIdRef.current,
          });
      }, 500);
    };
    socket.on("liveStream:ended", handler);
    return () => {
      socket.off("liveStream:ended", handler);
    };
  }, [socket]);

  const requestEndStream = useCallback(async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    setIsEnding(true);
    try {
      await del(`live-stream/${item._id}/end`);
      setShowEndConfirmModal(false);
      emitLeave();
      safeLeaveMeeting();
      const durationSeconds = streamStartTimeRef.current
        ? Math.floor((Date.now() - streamStartTimeRef.current) / 1000)
        : 0;
      if (onStop)
        onStop({ durationSeconds, totalViewers: viewers, liveStreamId });
    } catch (error) {
      console.error("Failed to end stream:", error);
      isEndingRef.current = false;
      setIsEnding(false);
    }
  }, [viewers, onStop, liveStreamId, item._id, emitLeave, safeLeaveMeeting]);
  requestEndStreamRef.current = requestEndStream;

  const handleConfirmEndStream = useCallback(async () => {
    await requestEndStream();
  }, [requestEndStream]);

  const handleCancelEndStream = useCallback(() => {
    setShowEndConfirmModal(false);
  }, []);

  const flashIconName =
    flash === "off" ? "flash-off" : flash === "on" ? "flash-on" : "flash-auto";

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000" : colors.background }]}>
      <StatusBar hidden />

      {!countdownDone ? (
        <>
          <View style={[styles.videoContainer, { backgroundColor: isDark ? "#111" : colors.background }]} />
          <CountdownOverlay
            onDone={() => setCountdownDone(true)}
            safeAreaTopInset={safeAreaTopInset}
            onBack={handleBack}
            flash={flash}
            onToggleFlash={onToggleFlash}
            isWebcamOn={isWebcamOn}
            onToggleWebcam={handleToggleWebcam}
            isMicOn={isMicOn}
            onToggleMic={handleToggleMic}
            onToggleCameraFacing={handleToggleCameraFacing}
            showGrid={showGrid}
            onToggleGrid={onToggleGrid}
          />
        </>
      ) : (
        <>
          {/* Video */}
          <View style={[styles.videoContainer, { backgroundColor: isDark ? "#000" : colors.background }]}>
            {hasJoined && localParticipant?.id ? (
              <ParticipantView
                participantId={localParticipant.id}
                mirror={facingMode === "front"}
                onVideoTrack={handleLocalVideoTrack}
              />
            ) : (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={isDark ? "#fff" : COLORS.red1} />
                <PulsingConnectingText />
              </View>
            )}
          </View>

          {/* Grid overlay on live screen */}
          {showGrid ? <GridOverlay /> : null}

          {/* Gradients */}
          <LinearGradient
            colors={[isDark ? COLORS.red1 : "rgba(250, 250, 250, 0.6)", "transparent"]}
            style={styles.topGradient}
            pointerEvents="none"
          />
          {/* <LinearGradient
            colors={["transparent", COLORS.red1]}
            style={styles.bottomGradient}
            pointerEvents="none"
          /> */}
          <ProgressiveBlur
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: 0,
              height: 100,
              width: SCREEN_WIDTH,
              zIndex: 4,
            }}
          />

          {/* Main overlay */}
          <View
            style={[styles.overlay, { paddingTop: safeAreaTopInset }]}
            pointerEvents="box-none"
          >
            {/* ── Top bar: Back (left) + Close (right) ── */}
            <View style={styles.liveTopBar}>
              <View style={styles.liveTopLeft}>
                <TouchableOpacity style={styles.circleBtn} onPress={handleBack}>
                  <Blur />
                  <Icons
                    family="Ionicons"
                    name="chevron-back"
                    size={20}
                    color={isDark ? COLORS.white : colors.text}
                  />
                </TouchableOpacity>
                <Text style={[styles.backLabel, { color: isDark ? COLORS.white : colors.text }]}>Back</Text>
              </View>
              <TouchableOpacity style={styles.circleBtn} onPress={handleBack}>
                <Blur />
                <Icons
                  family="Ionicons"
                  name="close"
                  size={24}
                  color={isDark ? COLORS.white : colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* ── Stats row: viewers (left) + timer (right) ── */}
            <View style={styles.liveStatsRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.viewersBadge}
                onPress={handleViewersPress}
              >
                <Icons
                  family="MaterialIcons"
                  name="visibility"
                  size={14}
                  color={COLORS.white}
                />
                <Text style={styles.viewersCount}>
                  {viewers >= 1000
                    ? (viewers / 1000).toFixed(1) + "k"
                    : viewers}
                </Text>
                <Text style={styles.viewersLabel}> viewers</Text>
              </TouchableOpacity>
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>{duration}</Text>
              </View>
            </View>

            {/* ── Right-side controls ── */}
            <View
              style={[
                styles.rightSideIcons,
                liveQuestion?.text && styles.rightSideIconsWithQuestion,
              ]}
            >
              <TouchableOpacity
                style={styles.sideIconBtn}
                onPress={handleToggleWebcam}
              >
                <Blur />
                <Icons
                  family="MaterialIcons"
                  name={isWebcamOn ? "videocam" : "videocam-off"}
                  size={22}
                  color={isDark ? COLORS.white : colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sideIconBtn}
                onPress={onToggleFlash}
              >
                <Blur />
                <Icons
                  family="MaterialIcons"
                  name={flashIconName}
                  size={22}
                  color={isDark ? COLORS.white : colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sideIconBtn}
                onPress={onToggleGrid}
              >
                <Blur />
                <Image
                  source={Images.grid}
                  style={{
                    height: 22,
                    width: 22,
                    tintColor: showGrid ? COLORS.red1 : (isDark ? COLORS.white : colors.text),
                  }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sideIconBtn}
                onPress={handleToggleMic}
              >
                <Blur />
                <Icons
                  family="MaterialIcons"
                  name={isMicOn ? "volume-up" : "volume-off"}
                  size={22}
                  color={isDark ? COLORS.white : colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sideIconBtn}
                onPress={handleToggleCameraFacing}
              >
                <Blur />
                <Image
                  source={Images.CameraFlip}
                  style={{ height: 22, width: 22, tintColor: isDark ? COLORS.white : colors.text }}
                />
              </TouchableOpacity>
            </View>

            {/* ── Bottom section ── */}
            <View style={styles.bottomSection} pointerEvents="box-none">
              {/* Question card */}
              {liveQuestion?.text ? (
                <View style={[styles.liveQuestionCard, { borderColor: isDark ? COLORS.gray64 : colors.border }]} pointerEvents="none">
                  <Blur />
                  <View style={styles.liveQuestionHeader}>
                    <Text style={[styles.liveQuestionText, { color: isDark ? COLORS.white : colors.text }]} numberOfLines={2}>
                      {liveQuestion.text}
                    </Text>
                    <Image
                      source={Images.askQuestion}
                      style={styles.liveQuestionCommentIcon}
                      resizeMode="contain"
                      tintColor={isDark ? COLORS.white : colors.text}
                    />
                  </View>
                  <View style={styles.liveQuestionMetaRow}>
                    <View style={styles.liveQuestionUserRow}>
                      <Text style={[styles.liveQuestionBy, { color: isDark ? COLORS.gray64 : colors.textSecondary }]}>by</Text>
                      <Image
                        source={
                          typeof liveQuestion.avatar === "string" &&
                          liveQuestion.avatar
                            ? { uri: liveQuestion.avatar }
                            : Images.userIcon
                        }
                        style={styles.liveQuestionAvatar}
                      />
                      <Text style={[styles.liveQuestionName, { color: isDark ? COLORS.white : colors.text }]} numberOfLines={1}>
                        {liveQuestion.displayName}
                      </Text>
                      <UserBadge
                        verified={liveQuestion.isVerified}
                        accountType={liveQuestion.accountType}
                        mutedColor={isDark ? "rgba(255, 255, 255, 0.64)" : colors.textSecondary}
                        style={{ marginLeft: 4 }}
                      />
                      <Text style={[styles.metaDot, { color: isDark ? COLORS.gray48 : colors.textSecondary }]}>•</Text>
                      <View style={[styles.usernamePill, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(18, 18, 18, 0.06)" }]}>
                        <Text style={[styles.usernamePillText, { color: isDark ? COLORS.gray64 : colors.textSecondary }]} numberOfLines={1}>
                          {liveQuestion.username}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.liveQuestionTime, { color: isDark ? COLORS.gray64 : colors.textSecondary }]}>
                      {formatInstagramTime(liveQuestion.createdAt)} ago
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Donation tips */}
              {liveDonations.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.liveTipsRow}
                >
                  {liveDonations.slice(0, 10).map((d, idx) => {
                    const amount = Number(
                      d?.amount ?? d?.price ?? d?.value ?? d?.coins ?? 0,
                    );
                    const donor = d?.user ?? d?.donor ?? d?.fromUser ?? {};
                    const avatar =
                      donor?.profile?.avatar ??
                      donor?.avatar ??
                      donor?.profileImage ??
                      donor?.image ??
                      null;
                    const key =
                      String(d?._id ?? d?.id ?? "") || `donation-${idx}`;
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
                                backgroundColor: donor?.profile?.profileColor,
                              },
                            ]}
                          />
                        )}
                        <Text style={[styles.liveTipText, { color: isDark ? COLORS.gray64 : colors.textSecondary }]} numberOfLines={1}>
                          ${amount || 0}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : null}

              {/* Reaction chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.liveReactionsRow}
              >
                {liveQuickReactions.map((r) => {
                  const count = typeof r.count === "number" ? r.count : 0;
                  const isSelected = selectedLiveReactionKey === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      style={[
                        styles.liveReactionChip,
                        isSelected && styles.liveReactionChipPrimary,
                        isSelected && { backgroundColor: isDark ? "#fff" : colors.text },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleLiveReactionPress(r.key)}
                    >
                      <Blur />
                      <Text
                        style={[
                          styles.liveReactionEmoji,
                          isSelected ? styles.liveReactionEmojiPrimary : { color: isDark ? "#fff" : colors.text },
                          isSelected && { color: isDark ? "#121212" : "#fff" },
                        ]}
                      >
                        {r.emoji}
                      </Text>
                      {count > 0 ? (
                        <Text
                          style={[
                            styles.liveReactionCount,
                            isSelected ? styles.liveReactionCountPrimary : { color: isDark ? "#fff" : colors.textSecondary },
                            isSelected && { color: isDark ? "#121212" : "#fff" },
                          ]}
                        >
                          {formatCount(count)}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </>
      )}

      {/* End confirm modal */}
      <CustomModal
        isBlur
        isChange
        isVisible={showEndConfirmModal}
        onDisable={handleCancelEndStream}
        reducedTransparencyFallbackColor="rgba(0,0,0,0.1)"
      >
        <View style={[styles.endConfirmOuter, { borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : colors.border }]}>
          <BlurView
            blurType="light"
            blurAmount={10}
            reducedTransparencyFallbackColor="#FFFFFF29"
            style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]}
          />
          <View style={[styles.endConfirmInner, { backgroundColor: isDark ? COLORS.black : colors.surface }]}>
            <View style={styles.endConfirmHeader}>
              <CustomText
                label="End Live?"
                fontFamily={fonts.semiBold}
                fontSize={24}
                color={isDark ? COLORS.white : colors.text}
              />
              <TouchableOpacity
                onPress={handleCancelEndStream}
                style={[styles.endConfirmClose, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(18, 18, 18, 0.06)" }]}
              >
                <Icons
                  name="close"
                  family="Ionicons"
                  color={isDark ? COLORS.gray64 : colors.textSecondary}
                  size={16}
                />
              </TouchableOpacity>
            </View>
            <CustomText
              label="Lives ends automatically after 45mins."
              fontFamily={fonts.medium}
              fontSize={14}
              color={isDark ? COLORS.gray64 : colors.textSecondary}
              marginBottom={16}
            />
            <CustomButton
              onPress={handleConfirmEndStream}
              title="Yes, end now."
              fontSize={18}
              loading={isEnding}
              color={COLORS.white}
              height={52}
              backgroundColor={COLORS.red1}
              marginBottom={8}
            />
            <CustomButton
              onPress={handleCancelEndStream}
              title="Cancel"
              fontSize={18}
              color={isDark ? COLORS.white : colors.text}
              height={52}
              backgroundColor={isDark ? "rgba(255,255,255,0.06)" : "rgba(18, 18, 18, 0.06)"}
              marginBottom={10}
            />
            <View style={styles.endConfirmNoteRow}>
              <Icons
                family="Feather"
                name="info"
                size={12}
                color={isDark ? COLORS.gray48 : colors.textSecondary}
              />
              <CustomText
                label="Ending the live now, will be "
                fontFamily={fonts.medium}
                fontSize={12}
                color={isDark ? COLORS.gray48 : colors.textSecondary}
                marginLeft={2}
              />
              <CustomText
                label="definitive."
                fontFamily={fonts.medium}
                fontSize={12}
                color={isDark ? COLORS.white : colors.text}
              />
            </View>
          </View>
        </View>
      </CustomModal>

      <ShareModal
        isVisible={showShareModal}
        onClose={() => setShowShareModal(false)}
        postImage={item?.video}
        username={item?.author?.username}
        date={new Date().toLocaleDateString()}
        postId={item?._id}
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
    </View>
  );
};

// ─── LiveStreamingView (exported) ────────────────────────────────────────────
export const LiveStreamingView = ({
  meetingId,
  liveStreamId,
  token,
  userName = "Host",
  onBack,
  onStop,
  liveTitle,
  liveCaption,
  liveTopic,
  liveLocation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [flash, setFlash] = useState("off");
  const [showGrid, setShowGrid] = useState(false);

  const handleToggleFlash = useCallback((nextValue) => {
    if (nextValue === "off" || nextValue === "on" || nextValue === "auto") {
      setFlash(nextValue);
      return;
    }
    setFlash((prev) =>
      prev === "off" ? "on" : prev === "on" ? "auto" : "off",
    );
  }, []);

  const handleToggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

  if (!meetingId || !token) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDark ? "#000" : colors.background }]}>
        <ActivityIndicator size="large" color="#EE1045" />
        <Text style={[styles.initializingText, { color: isDark ? "#fff" : colors.text }]}>Initializing...</Text>
      </View>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: userName,
        defaultCamera: "front", // open with front camera
      }}
      token={token}
    >
      <MeetingView
        meetingId={meetingId}
        liveStreamId={liveStreamId}
        userName={userName}
        onBack={onBack}
        onStop={onStop}
        safeAreaTopInset={insets.top}
        liveTitle={liveTitle}
        liveCaption={liveCaption}
        liveTopic={liveTopic}
        liveLocation={liveLocation}
        flash={flash}
        onToggleFlash={handleToggleFlash}
        showGrid={showGrid}
        onToggleGrid={handleToggleGrid}
      />
    </MeetingProvider>
  );
};

export default LiveStreamingView;

// ─── Countdown Overlay Styles ─────────────────────────────────────────────────
const cdStyles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 20,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  backText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  durationBadge: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 140,
    alignItems: "center",
    pointerEvents: "none",
  },
  durationBadgeInner: {
    backgroundColor: COLORS.red1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  durationBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: COLORS.white,
    fontSize: 120,
    fontFamily: fonts.semiBold,
    lineHeight: 130,
  },
  startsInText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: fonts.medium,
    marginTop: 4,
  },
  rightSideIcons: {
    position: "absolute",
    right: 14,
    top: 0,
    justifyContent: "center",
    bottom: 0,
    zIndex: 20,
  },
  sideIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    zIndex: 4,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 170,
    zIndex: 4,
  },
  container: { flex: 1, backgroundColor: "#000" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  initializingText: { color: "#fff", marginTop: 12, fontSize: 16 },
  videoContainer: { flex: 1, backgroundColor: "#000" },
  video: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  noVideo: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  noVideoTxt: { color: "#666", fontSize: 16, marginTop: 8 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Live top bar
  liveTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 30,
    elevation: 30,
  },
  liveTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    zIndex: 31,
    elevation: 31,
  },
  backLabel: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },

  // Stats row
  liveStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  viewersBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.red1,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 99,
  },
  viewersCount: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    marginLeft: 2,
  },
  viewersLabel: {
    color: COLORS.gray64,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  timerBadge: {
    backgroundColor: COLORS.red1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timerText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.5,
  },

  // Right side icons (webcam + mic)
  rightSideIcons: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 10,
  },
  rightSideIconsWithQuestion: {
    bottom: 130,
  },
  sideIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },

  // Bottom section
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 40,
    gap: 10,
  },

  // Question card
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
  liveQuestionCommentIcon: {
    height: 18,
    width: 18,
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

  // Donation tips
  liveTipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 5,
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

  // Reactions
  liveReactionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 6,
    marginVertical: 5,
  },
  liveReactionChip: {
    height: 28,
    minWidth: 48,
    paddingHorizontal: 10,
    borderRadius: 100,
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
    fontFamily: fonts.medium,
  },
  liveReactionCountPrimary: { color: "#121212" },

  // End confirm modal
  endConfirmOuter: {
    margin: 10,
    borderRadius: 32,
    padding: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  endConfirmInner: {
    backgroundColor: COLORS.black,
    borderRadius: 28,
    width: "100%",
    alignSelf: "center",
    padding: 16,
    paddingBottom: 10,
  },
  endConfirmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  endConfirmClose: {
    width: 32,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
  },
  endConfirmNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
});
