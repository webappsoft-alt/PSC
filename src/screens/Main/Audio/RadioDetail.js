import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { getPalette } from "@somesoap/react-native-image-palette";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import EditModal from "../Home/molecules/EditModal";
import {
  deleteRadio,
  fetchRadio,
  fetchRadioSubtitles,
  hideRadio,
  playRadio,
  reportRadio,
} from "../../../services/radioApi";
import {
  requestRadioPlay,
  setAudioUrl,
  setPlayerSuppressed,
  setPlaying,
  setPlayingRadioData,
  setPlayingRadioId,
  setShowRadioPlayer,
} from "../../../store/reducer/playerSlice";
import HoldSeekOverlay from "../../../components/HoldSeekOverlay";
import { useHoldSeek } from "../../../hooks/useHoldSeek";
import { radioPlayback, useRadioPlayback } from "../../../utils/radioPlayback";
import { ToastMessage } from "../../../utils/ToastMessage";
import AudioBackdrop from "./molecules/AudioBackdrop";
import AudioHeader from "./molecules/AudioHeader";
import PlayerPanel from "./molecules/PlayerPanel";
import { RadioSpeakers, SpeakerCard } from "./molecules/Speakers";
import TranscriptView from "./molecules/TranscriptView";
import { AUDIO, getDisplayName } from "./molecules/audioLayout";
import useFollowAuthor from "./molecules/useFollowAuthor";

/**
 * Figma "Radio-Detail" (5095:1636) and "Audio-Post-Detail" (7624:1206).
 * Same page for both kinds: header (back · creator · Follow · more,
 * listeners), live transcript, frosted player panel. The Audio Post shows
 * the Open AI credit, the "Speaking" creator card, and its gradient ends in
 * the dominant colour of the creator's profile picture.
 *
 * Playback goes through the app's radio player (Redux `player` +
 * react-native-sound-player, driven by the global PlayerCard), so leaving
 * the page keeps it playing in the mini player.
 */
const TRANSCRIPT_POLL_MS = 3000;

const RadioDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();

  const list = useMemo(
    () => (Array.isArray(route.params?.list) ? route.params.list : []),
    [route.params?.list],
  );
  const [radio, setRadio] = useState(route.params?.radio || null);
  const radioId = radio?._id || route.params?.radioId;

  const playingRadioId = useSelector((s) => s.player.playingRadioId);
  const isPlaying = useSelector((s) => s.player.isPlaying);
  const isThis = !!radioId && playingRadioId === radioId;

  // position / duration / mute come from the one radio engine (PlayerCard)
  const playback = useRadioPlayback();
  const muted = playback.muted;
  const [moreVisible, setMoreVisible] = useState(false);
  const [bottomColor, setBottomColor] = useState(AUDIO.dark);

  const author = radio?.userId;
  const isAudioPost = radio?.kind === "audio";
  const { isOwner, isFollowing, toggleFollow } = useFollowAuthor(author);

  // ─── data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!radioId) return;
    let alive = true;
    fetchRadio(radioId)
      .then((res) => {
        if (alive && res?.data?.data) setRadio(res.data.data);
      })
      .catch((e) => console.log("fetchRadio error", e?.message || e));
    return () => {
      alive = false;
    };
  }, [radioId]);

  // transcript still being prepared → poll it (like the feed's caption poll)
  const subtitlesStatus = radio?.subtitlesStatus;
  useEffect(() => {
    if (!radioId) return;
    if (subtitlesStatus === "ready" || subtitlesStatus === "empty") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetchRadioSubtitles(radioId);
        const data = res?.data?.data;
        if (data && (data.subtitlesStatus === "ready" || data.subtitlesStatus === "empty")) {
          setRadio((prev) => (prev?._id === radioId ? { ...prev, ...data, _id: radioId } : prev));
        }
      } catch (_) {}
    }, TRANSCRIPT_POLL_MS);
    return () => clearInterval(timer);
  }, [radioId, subtitlesStatus]);

  // Audio-Post-Detail: gradient bottom = dominant colour of the profile pic
  const avatar = author?.profile?.avatar;
  useEffect(() => {
    if (!isAudioPost) {
      setBottomColor(AUDIO.dark);
      return;
    }
    const fallback = author?.profile?.profileColor || AUDIO.dark;
    if (!avatar) {
      setBottomColor(fallback);
      return;
    }
    let alive = true;
    getPalette(avatar)
      .then((p) => alive && setBottomColor(p?.dominant || p?.vibrant || fallback))
      .catch(() => alive && setBottomColor(fallback));
    return () => {
      alive = false;
    };
  }, [avatar, isAudioPost, author?.profile?.profileColor]);

  // ─── playback ───────────────────────────────────────────────────────────
  const startPlayback = useCallback(
    (item) => {
      if (!item?._id || !item?.audio) return;
      // always (re)starts the stream, also when this URL is already loaded
      dispatch(requestRadioPlay(item));
      playRadio(item._id)
        .then((res) => {
          const data = res?.data?.data;
          if (data?._id === item._id) {
            setRadio((prev) =>
              prev?._id === data._id
                ? { ...prev, play: data.play, stats: data.stats }
                : prev,
            );
          }
        })
        .catch(() => {});
    },
    [dispatch],
  );

  // opening the page plays it; the one already playing keeps going, the one
  // paused in the mini player resumes
  const autoStarted = useRef(null);
  useEffect(() => {
    if (!radio?._id || autoStarted.current === radio._id) return;
    autoStarted.current = radio._id;
    if (playingRadioId !== radio._id) {
      startPlayback(radio);
    } else if (!isPlaying) {
      dispatch(setPlaying(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radio, playingRadioId, startPlayback]);

  // hide the floating mini player while this page shows its own player
  useFocusEffect(
    useCallback(() => {
      dispatch(setPlayerSuppressed(true));
      return () => dispatch(setPlayerSuppressed(false));
    }, [dispatch]),
  );

  const positionMs = isThis ? playback.positionMs : 0;
  const durationMs =
    (isThis && playback.durationMs) || radio?.durationMs || 0;

  const onToggle = () => {
    if (!isThis) {
      startPlayback(radio);
      return;
    }
    dispatch(setPlaying(!isPlaying));
  };

  const onSeek = (ms) => {
    if (isThis) radioPlayback.seek(ms);
  };

  const onMute = () => radioPlayback.setMuted(!muted);

  // Client: hold the left / right side to rewind / fast-forward, like the
  // Reels in Viral (same hook + hint, ported)
  const wasPlayingRef = useRef(false);
  const holdSeek = useHoldSeek({
    enabled: isThis,
    getPositionMs: () => radioPlayback.getState().positionMs,
    getDurationMs: () => radioPlayback.getState().durationMs || durationMs,
    seekTo: (ms) => radioPlayback.seek(ms),
    pause: () => {
      wasPlayingRef.current = isPlaying;
      if (isPlaying) dispatch(setPlaying(false));
    },
    resume: () => {
      if (wasPlayingRef.current) dispatch(setPlaying(true));
    },
  });

  const index = list.findIndex((r) => r?._id === radioId);
  const goTo = (offset) => {
    const target = list[index + offset];
    if (!target) return;
    autoStarted.current = target._id;
    setRadio(target);
    startPlayback(target);
  };

  const onShare = async () => {
    try {
      const url = `psc://radio/${radioId}`;
      await Share.share({
        message: `Listen to ${radio?.title || "this"} on Private Social Club: ${url}`,
        url,
      });
    } catch (e) {
      console.log("Radio share error", e);
    }
  };

  const onDelete = () => {
    setMoreVisible(false);
    Alert.alert(
      isAudioPost ? "Delete audio post" : "Delete radio",
      "This cannot be recovered after deletion.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRadio(radioId);
              if (isThis) {
                dispatch(setPlaying(false));
                dispatch(setShowRadioPlayer(false));
                dispatch(setAudioUrl(null));
                dispatch(setPlayingRadioId(null));
                dispatch(setPlayingRadioData(null));
              }
              ToastMessage("Deleted", "success");
              navigation.goBack();
            } catch (e) {
              ToastMessage(e?.message || "Could not delete", "error");
            }
          },
        },
      ],
    );
  };

  const speakers = useMemo(() => {
    const users = [author, ...(radio?.mentions || []), ...(radio?.sponsoredBy || [])]
      .filter((u) => u && typeof u === "object" && u._id);
    const seen = new Set();
    return users.filter((u) => (seen.has(u._id) ? false : seen.add(u._id))).slice(0, 4);
  }, [author, radio?.mentions, radio?.sponsoredBy]);

  const listenersUsers = useMemo(
    () => (radio?.play || []).filter((u) => u && typeof u === "object"),
    [radio?.play],
  );

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" />
      <AudioBackdrop bottomColor={bottomColor} />

      {/* hold left / right half → scrub (under the header + panel, which
          keep their own touches) */}
      <Pressable
        style={StyleSheet.absoluteFill}
        delayLongPress={200}
        onLongPress={(e) => holdSeek.startAtX(e.nativeEvent.pageX, width)}
        onPressOut={() => holdSeek.stop()}
      />

      <AudioHeader
        user={author}
        variant="follow"
        onBack={() => navigation.goBack()}
        onFollow={toggleFollow}
        isOwner={isOwner}
        isFollowing={isFollowing}
        onMore={() => setMoreVisible(true)}
        listeners={{ count: radio?.play?.length || 0, users: listenersUsers }}
        showCredit={isAudioPost}
      />

      <View style={styles.transcript} pointerEvents="none">
        <TranscriptView
          source={radio}
          positionMs={isThis ? positionMs : 0}
          placeholder={radio?.title}
        />
      </View>

      <PlayerPanel
        positionMs={isThis ? positionMs : 0}
        durationMs={durationMs}
        playing={isThis && isPlaying}
        muted={muted}
        onToggle={onToggle}
        onSeek={onSeek}
        onMute={onMute}
        onShare={onShare}
        onPrev={() => goTo(-1)}
        onNext={() => goTo(1)}
        hasPrev={index > 0}
        hasNext={index >= 0 && index < list.length - 1}
      >
        {isAudioPost ? (
          <SpeakerCard user={author} />
        ) : (
          <RadioSpeakers users={speakers} activeId={author?._id} />
        )}
      </PlayerPanel>

      <HoldSeekOverlay side={holdSeek.side} />

      <EditModal
        isVisible={moreVisible}
        onClose={() => setMoreVisible(false)}
        displayName={getDisplayName(author)}
        username={author?.username}
        postCaption={radio?.title}
        isOwner={isOwner}
        user={author}
        showEditActions={false}
        deleteTitle={isAudioPost ? "Delete audio post" : "Delete radio"}
        reportTitle={isAudioPost ? "Report this audio post" : "Report this radio"}
        onDeletePress={onDelete}
        showHideUser={false}
        onHidePost={async () => {
          try {
            await hideRadio(radioId);
            ToastMessage("You won't see this anymore", "success");
            navigation.goBack();
          } catch (e) {
            ToastMessage(e?.message || "Something went wrong", "error");
          }
        }}
        onReport={async () => {
          try {
            await reportRadio(radioId);
            ToastMessage("Reported, thanks for letting us know", "success");
            navigation.goBack();
          } catch (e) {
            ToastMessage(e?.message || "Something went wrong", "error");
          }
        }}
      />
    </View>
  );
};

export default RadioDetail;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: AUDIO.black },
  // Figma: content column gap 24 under the header, pad 20
  transcript: { marginTop: 24, paddingHorizontal: 20 },
});
