import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { pick, types } from "@react-native-documents/picker";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  DeviceEventEmitter,
  Easing,
  PermissionsAndroid,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Voice from "@react-native-voice/voice";
import RNFS from "react-native-fs";
import LinearGradient from "react-native-linear-gradient";
import Video from "react-native-video";
import {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  OutputFormatAndroidType,
  createSound,
} from "react-native-nitro-sound";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SoundPlayer from "react-native-sound-player";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import AccountSwitchSheet from "../../../components/AccountSwitchSheet";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import {
  correctTranscript,
  createAudioDraft,
  discardAudioDraft,
  editAudioDraft,
  fetchRadioSubtitles,
  publishAudioPost,
  removeDisfluency,
} from "../../../services/radioApi";
import {
  setAudioUrl,
  setLoading,
  setPlaying,
  setPlayingRadioData,
  setPlayingRadioId,
  setShowRadioPlayer,
} from "../../../store/reducer/playerSlice";
import { uploadFileGetUrl } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import AudioBackdrop from "./molecules/AudioBackdrop";
import AudioHeader, { TranscriptCredit } from "./molecules/AudioHeader";
import { SpeedPicker, ToolChip } from "./molecules/EditTools";
import TranscriptView, { LiveTranscript } from "./molecules/TranscriptView";
import WaveformTrimmer from "./molecules/WaveformTrimmer";
import {
  AUDIO,
  GlassFill,
  Glyph,
  FrameIcon,
  MSF,
  TITLE_BASELINE,
  TITLE_CAP_TOP,
  TITLE_LINE,
  baseline,
  capGap,
  ls,
} from "./molecules/audioLayout";

/**
 * Audio Post recorder — Figma record states:
 *  · idle      7593:3302  "Be vocal about your opinions!" + campaign 140,
 *                         tip + white 80 record button
 *  · recording 7593:3533  red record button, lock 32 + pause 48, level bars
 *  · edit      7593:3642  transcript, speed, Correct / Remove Speech
 *                         Disfluency, trim strip, retake · download · Continue
 * Hold the button to record (release to finish), tap it — or slide onto the
 * lock — for hands-free; the waveform button picks a file from the phone.
 * Continue → Publish-A-Post (CreatePost) with the draft attached.
 */
const MIN_RECORD_MS = 1000;
const TRANSCRIPT_POLL_MS = 2500;

const audioSet = {
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AVNumberOfChannelsKeyIOS: 1,
  AVFormatIDKeyIOS: "aac",
};

const requestMic = async () => {
  if (Platform.OS !== "android") return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: "Microphone Permission",
        message: "PSC needs your microphone to record your audio post.",
        buttonPositive: "OK",
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (_) {
    return false;
  }
};

const RecordAudioPost = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const me = useSelector((s) => s.users.userData);

  // idle | recording | uploading | edit
  const [phase, setPhase] = useState("idle");
  const [starting, setStarting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [locked, setLocked] = useState(false);
  const [accountsVisible, setAccountsVisible] = useState(false);
  const [draft, setDraft] = useState(null);
  const [startMs, setStartMs] = useState(0);
  const [endMs, setEndMs] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [previewing, setPreviewing] = useState(false);
  const [previewMs, setPreviewMs] = useState(0);
  const [busyTool, setBusyTool] = useState(null);
  const [continuing, setContinuing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const publishedRef = useRef(false);
  const phaseRef = useRef("idle"); // idle | starting | recording | stopping | uploading | edit
  const recRef = useRef(null);
  const recordMsRef = useRef(0);
  const holdingRef = useRef(false);
  const draftRef = useRef(null);
  draftRef.current = draft;
  // live waveform: every metering tick (100 ms) adds one bar
  const waveBus = useRef(createWaveBus()).current;

  // ─── live transcript while recording (device speech recognition) ───────
  // Apple / Google recognition, @react-native-voice/voice. A recognition
  // session ends by itself after a pause (and iOS caps one at ~1 min), so
  // while the take is still recording it is restarted and its text is
  // appended. The editor still shows the server's full transcript.
  // the text lives in a tiny store read by <LiveTranscript> only, so each
  // partial result (many per second) re-renders the caption, not the screen
  const liveBus = useRef(createWaveBus()).current;
  const [hasLiveText, setHasLiveText] = useState(false);
  // Words with the time they were recognised and whether a pause (≥ 600 ms
  // of silence on the microphone) came before them — the caption groups
  // them into phrases the way the editor's transcript does (≤ 5 words,
  // broken at pauses) instead of a running stream of words.
  const liveWordsRef = useRef([]);
  const levelLogRef = useRef([]); // { t, v } microphone level, 100 ms apart
  const setLiveText = useCallback(
    (text) => {
      const tokens = String(text || "").trim().split(/\s+/).filter(Boolean);
      const words = liveWordsRef.current;
      const now = Date.now();
      const kept = Math.min(words.length, tokens.length);
      for (let i = 0; i < kept; i += 1) {
        if (words[i].word !== tokens[i]) words[i] = { ...words[i], word: tokens[i] };
      }
      words.length = kept;
      if (tokens.length > kept) {
        // a pause since the previous words arrived (they arrive ~1 s after
        // they were said, so look a little before that moment too)
        const lastT = words.length ? words[words.length - 1].t : 0;
        const from = lastT - 1200;
        let run = 0;
        let longest = 0;
        for (const e of levelLogRef.current) {
          if (e.t < from) continue;
          if (e.v < 0.08) {
            run += 100;
            if (run > longest) longest = run;
          } else run = 0;
        }
        const pause = words.length > 0 && longest >= 600;
        for (let i = kept; i < tokens.length; i += 1) {
          words.push({ word: tokens[i], t: now, pause: i === kept && pause });
        }
      }
      liveBus.set(words.slice());
      setHasLiveText(words.length > 0);
    },
    [liveBus],
  );
  const liveDoneRef = useRef(""); // text of the sessions that ended
  const liveCurRef = useRef(""); // best text of the running session
  const liveActiveRef = useRef(false); // a recognition session is running
  const liveOnRef = useRef(false); // recognition wanted (recording, not paused)
  const liveRestartRef = useRef(null);
  const joinLive = (part) =>
    [liveDoneRef.current, part].filter(Boolean).join(" ").trim();

  const installLiveHandlers = useRef(() => {});
  const startLive = useCallback(async () => {
    liveOnRef.current = true;
    if (liveActiveRef.current) return;
    liveActiveRef.current = true; // until onSpeechEnd / onSpeechError
    // Voice keeps one global set of handlers — (re)install ours every time
    // so a reload / another screen can't leave recognition running mute
    installLiveHandlers.current();
    try {
      await Voice.start("en-US");
    } catch (e) {
      liveActiveRef.current = false;
      console.log("Live transcript start error", e?.message || e);
    }
  }, []);
  const stopLive = useCallback(async ({ reset = false } = {}) => {
    liveOnRef.current = false;
    clearTimeout(liveRestartRef.current);
    try {
      await Voice.stop();
    } catch (_) {}
    if (reset) {
      liveDoneRef.current = "";
      liveCurRef.current = "";
      setLiveText("");
    }
  }, []);

  useEffect(() => {
    // iOS (react-native-voice): onSpeechResults fires for EVERY result of the
    // running session (not only the final one), onSpeechPartialResults with
    // the alternatives, and onSpeechEnd when the session is over; errors
    // tear the session down without an end event. Android: partials, then one
    // final onSpeechResults, then onSpeechEnd. So: results / partials REPLACE
    // the running session's text; end / error COMMIT it and start the next.
    const showCurrent = (text) => {
      if (typeof text !== "string" || !text.trim()) return;
      liveCurRef.current = text.trim();
      setLiveText(joinLive(liveCurRef.current));
    };
    const sessionEnded = () => {
      liveActiveRef.current = false;
      if (liveCurRef.current) {
        liveDoneRef.current = joinLive(liveCurRef.current);
        liveCurRef.current = "";
        setLiveText(liveDoneRef.current);
      }
      if (!liveOnRef.current) return;
      clearTimeout(liveRestartRef.current);
      liveRestartRef.current = setTimeout(() => {
        if (liveOnRef.current && !liveActiveRef.current) startLive();
      }, 60);
    };
    installLiveHandlers.current = () => {
      Voice.onSpeechStart = () => {
        liveActiveRef.current = true;
      };
      Voice.onSpeechPartialResults = (e) => showCurrent(e?.value?.[0]);
      Voice.onSpeechResults = (e) => showCurrent(e?.value?.[0]);
      Voice.onSpeechEnd = sessionEnded;
      Voice.onSpeechError = (e) => {
        const msg = String(e?.error?.message || e?.error?.code || "");
        if (/already started/i.test(msg)) {
          // a stale native session (an earlier take's) is still there —
          // drop it and start a fresh one for this take
          Voice.destroy()
            .catch(() => {})
            .then(() => {
              liveActiveRef.current = false;
              if (liveOnRef.current) startLive();
            });
          return;
        }
        sessionEnded();
      };
    };
    installLiveHandlers.current();
    return () => {
      liveOnRef.current = false;
      liveActiveRef.current = false;
      clearTimeout(liveRestartRef.current);
      // remove the handlers NOW — the previous version removed them after
      // destroy() resolved, which wiped the handlers the remounted screen
      // had just installed (Fast Refresh) and left recognition running mute
      Voice.removeAllListeners();
      Voice.destroy().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRecorder = () => {
    if (!recRef.current) recRef.current = createSound();
    return recRef.current;
  };

  // the feed's radio player stops — one audio source at a time; the recorder
  // instance is created now so the first press doesn't pay for it
  useEffect(() => {
    try {
      getRecorder();
    } catch (_) {}
    try {
      SoundPlayer.stop();
    } catch (_) {}
    dispatch(setPlaying(false));
    dispatch(setLoading(false));
    dispatch(setShowRadioPlayer(false));
    dispatch(setAudioUrl(null));
    dispatch(setPlayingRadioId(null));
    dispatch(setPlayingRadioData(null));
  }, [dispatch]);

  // ─── recording ──────────────────────────────────────────────────────────
  // Hold the button to record and release to finish (WhatsApp style). The
  // lock button — tapped, or slid onto while holding — keeps recording
  // hands-free; a tap on the record button then finishes the take. Pausing
  // keeps the take open the same way.
  const lockedRef = useRef(false);
  const startingRef = useRef(false);

  const setLockedBoth = (v) => {
    lockedRef.current = v;
    setLocked(v);
  };

  const startRecording = async () => {
    if (startingRef.current || phaseRef.current !== "idle") return false;
    startingRef.current = true;
    phaseRef.current = "starting";
    setStarting(true);
    const ok = await requestMic();
    if (!ok) {
      startingRef.current = false;
      phaseRef.current = "idle";
      setStarting(false);
      Alert.alert("Microphone", "Microphone access is required to record.");
      return false;
    }
    try {
      const rec = getRecorder();
      rec.setSubscriptionDuration(0.1);
      rec.addRecordBackListener((e) => {
        recordMsRef.current = e?.currentPosition || 0;
        const db = Number(e?.currentMetering);
        // dBFS → 0 … 1: room noise (≈ −50) stays low, speech (−35 … −5)
        // spreads over the whole bar height
        const v = Number.isFinite(db)
          ? Math.pow(Math.max(0, Math.min(1, (db + 50) / 45)), 1.4)
          : 0;
        waveBus.push(v);
        const log = levelLogRef.current;
        log.push({ t: Date.now(), v });
        if (log.length > 150) log.splice(0, log.length - 150); // last 15 s
      });
      recordMsRef.current = 0;
      waveBus.reset();
      levelLogRef.current = [];
      await rec.startRecorder(undefined, audioSet, true);
      startingRef.current = false;
      phaseRef.current = "recording";
      setPaused(false);
      setStarting(false);
      setPhase("recording");
      liveDoneRef.current = "";
      liveCurRef.current = "";
      setLiveText("");
      liveActiveRef.current = false; // nothing can be running for a new take
      startLive();
      // released before the recorder was ready → nothing to keep
      if (!holdingRef.current && !lockedRef.current)
        stopRecording({ discard: true });
      return true;
    } catch (e) {
      startingRef.current = false;
      phaseRef.current = "idle";
      setStarting(false);
      console.log("Audio post record error", e);
      ToastMessage("Could not start recording", "error");
      return false;
    }
  };

  const stopRecording = async ({ discard = false } = {}) => {
    if (phaseRef.current !== "recording") return;
    phaseRef.current = "stopping";
    const rec = recRef.current;
    let path = null;
    try {
      rec?.removeRecordBackListener();
    } catch (_) {}
    stopLive({ reset: true });
    try {
      path = await rec?.stopRecorder();
    } catch (_) {}
    waveBus.reset();
    setLockedBoth(false);
    setPaused(false);
    const tooShort = recordMsRef.current < MIN_RECORD_MS;
    if (discard || !path || tooShort) {
      if (!discard && tooShort)
        ToastMessage("Hold the button to record", "error");
      phaseRef.current = "idle";
      setPhase("idle");
      return;
    }
    await uploadAndOpen(
      { uri: path, name: `audio-post-${Date.now()}.m4a`, type: "audio/mp4" },
      recordMsRef.current,
    );
  };

  const togglePause = async () => {
    const rec = recRef.current;
    if (!rec || phaseRef.current !== "recording") return;
    try {
      if (paused) {
        await rec.resumeRecorder();
        setPaused(false);
        startLive();
      } else {
        await rec.pauseRecorder(); // the wave stays as recorded so far
        stopLive();
        setPaused(true);
        setLockedBoth(true); // a paused take stays open until the button is tapped
      }
    } catch (e) {
      console.log("Audio post pause error", e);
    }
  };

  const onRecordPressIn = () => {
    if (phaseRef.current === "idle") {
      holdingRef.current = true;
      lockedRef.current = false;
      startRecording();
    }
  };
  const onRecordPressOut = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    if (lockedRef.current) return; // hands-free: keep going
    if (phaseRef.current === "recording") stopRecording();
    // still starting → startRecording() discards it once the recorder is up
  };
  const onRecordPress = () => {
    // a tap while recording hands-free finishes the take
    if (
      phaseRef.current === "recording" &&
      lockedRef.current &&
      !holdingRef.current
    ) {
      stopRecording();
    }
  };
  const onLockPress = () => {
    if (phaseRef.current !== "recording") return;
    if (lockedRef.current && !holdingRef.current) {
      // unlocking with no finger on the button = letting go → finish, the
      // same as tapping the record button
      stopRecording();
      return;
    }
    setLockedBoth(!lockedRef.current);
  };

  // ─── upload → draft ─────────────────────────────────────────────────────
  const uploadAndOpen = async (file, durationMs = 0) => {
    phaseRef.current = "uploading";
    setPhase("uploading");
    try {
      const uploaded = await uploadFileGetUrl(
        { localUri: file.uri, name: file.name, type: file.type },
        file.type,
      );
      const url = uploaded?.file || uploaded?.url;
      if (!url) throw new Error("upload");
      const res = await createAudioDraft(url, durationMs);
      const created = res?.data?.data;
      if (!created?._id) throw new Error("draft");
      openEditor(created);
    } catch (e) {
      console.log("Audio post upload error", e?.message || e);
      ToastMessage(
        e?.message && e.message.length > 12
          ? e.message
          : "Could not save the recording",
        "error",
      );
      phaseRef.current = "idle";
      setPhase("idle");
    }
  };

  const openEditor = (radio) => {
    setDraft(radio);
    setStartMs(0);
    setEndMs(radio.durationMs || 0);
    setSpeed(1);
    setPreviewMs(0);
    phaseRef.current = "edit";
    setPhase("edit");
  };

  const pickFile = async () => {
    if (phaseRef.current !== "idle") return;
    try {
      const [file] = await pick({ type: [types.audio] });
      if (!file?.uri) return;
      await uploadAndOpen({
        uri: file.uri,
        name: file.name || `audio-post-${Date.now()}.mp3`,
        type: file.type || "audio/mpeg",
      });
    } catch (e) {
      if (
        e?.code !== "E_PICKER_CANCELLED" &&
        e?.code !== "OPERATION_CANCELED"
      ) {
        console.log("Audio post pick error", e);
      }
    }
  };

  // transcript is prepared by the backend Whisper job → poll it
  const draftId = draft?._id;
  const draftStatus = draft?.subtitlesStatus;
  const draftHasWave = (draft?.waveform?.length || 0) > 0;
  useEffect(() => {
    const transcriptDone = draftStatus === "ready" || draftStatus === "empty";
    if (!draftId || (transcriptDone && draftHasWave)) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetchRadioSubtitles(draftId);
        const data = res?.data?.data;
        if (!data) return;
        setDraft((prev) => {
          if (prev?._id !== draftId) return prev;
          const next = { ...prev, ...data, _id: draftId };
          // the file analysis may refine the recorder's own length
          if (
            data.durationMs > 0 &&
            (!prev.durationMs || !prev.waveform?.length)
          ) {
            setEndMs((e) =>
              e === 0 || e === prev.durationMs ? data.durationMs : e,
            );
          }
          return next;
        });
      } catch (_) {}
    }, TRANSCRIPT_POLL_MS);
    return () => clearInterval(timer);
  }, [draftId, draftStatus, draftHasWave]);

  // ─── preview (edit) ─────────────────────────────────────────────────────
  // react-native-video (audio only — the same player as the feed videos):
  // streams the draft, seeks, plays at .5 / 1x / 2x and loops the selected
  // range until the user leaves the editor, like a sound picked for a story.
  const videoRef = useRef(null);
  const latestRange = useRef({ startMs: 0, endMs: 0 });
  latestRange.current = { startMs, endMs };
  const seekTo = (ms) => {
    try {
      videoRef.current?.seek?.(Math.max(0, ms) / 1000);
    } catch (_) {}
    setPreviewMs(Math.max(0, ms));
  };
  const stopPreview = useCallback(() => setPreviewing(false), []);
  const startPreview = (fromMs) => {
    if (!draft?.audio) return;
    seekTo(Number.isFinite(fromMs) ? fromMs : latestRange.current.startMs);
    setPreviewing(true);
  };
  const togglePreview = () => (previewing ? stopPreview() : startPreview());

  const onPreviewProgress = ({ currentTime }) => {
    const pos = (Number(currentTime) || 0) * 1000;
    const { startMs: start, endMs: end } = latestRange.current;
    if (end > 0 && pos >= end) {
      seekTo(start); // loop the selection
      return;
    }
    if (pos < start - 400) {
      seekTo(start); // a seek landed before the selection (keyframe) → snap
      return;
    }
    setPreviewMs(pos);
  };
  const onPreviewEnd = () => seekTo(latestRange.current.startMs); // loop

  // the editor plays the take as soon as it opens (and after an edit
  // produced a new file), like Slack's voice notes
  const draftAudio = draft?.audio;
  useEffect(() => {
    if (phase !== "edit" || !draftAudio) return;
    startPreview(latestRange.current.startMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, draftAudio]);

  // blur (Continue → Create Audio Post) → silence; back in the editor → the
  // selection loops again from its start
  const startPreviewRef = useRef(startPreview);
  startPreviewRef.current = startPreview;
  useFocusEffect(
    useCallback(() => {
      if (phaseRef.current === "edit") startPreviewRef.current();
      return () => stopPreview();
    }, [stopPreview]),
  );
  useEffect(
    () => () => {
      // a disposed hybrid object can't be used again — drop the reference so
      // the next getRecorder() (remount, Fast Refresh) creates a fresh one
      const rec = recRef.current;
      recRef.current = null;
      if (!rec) return;
      try {
        rec.removeRecordBackListener?.();
      } catch (_) {}
      Promise.resolve()
        .then(() => rec.stopRecorder?.())
        .catch(() => {})
        .finally(() => {
          try {
            rec.dispose?.();
          } catch (_) {}
        });
    },
    [],
  );

  // ─── edit tools ─────────────────────────────────────────────────────────
  const transcriptReady =
    draft?.subtitlesStatus === "ready" && draft?.subtitles?.length > 0;

  const runTool = async (key) => {
    if (!draft?._id || busyTool) return;
    if (!transcriptReady) {
      ToastMessage(
        draft?.subtitlesStatus === "empty"
          ? "No speech was found in this recording"
          : "The transcript is still being prepared",
        "error",
      );
      return;
    }
    await stopPreview();
    setBusyTool(key);
    try {
      if (key === "correct") {
        const res = await correctTranscript(draft._id);
        if (res?.data?.data) setDraft(res.data.data);
        ToastMessage("Transcript corrected", "success");
      } else {
        const res = await removeDisfluency(draft._id);
        const data = res?.data?.data;
        if (data?.radio) {
          setDraft(data.radio);
          setStartMs(0);
          setEndMs(data.radio.durationMs || 0);
          setPreviewMs(0);
        }
        const seconds = Math.round((data?.removedMs || 0) / 100) / 10;
        ToastMessage(
          seconds > 0
            ? `Removed ${seconds}s of fillers and pauses`
            : "No speech disfluency found",
          "success",
        );
      }
    } catch (e) {
      ToastMessage(e?.message || "Something went wrong", "error");
    } finally {
      setBusyTool(null);
    }
  };

  const discardDraft = async () => {
    const id = draftRef.current?._id;
    if (!id) return;
    try {
      await discardAudioDraft(id);
    } catch (_) {}
  };

  const retake = async () => {
    await stopPreview();
    await discardDraft();
    setDraft(null);
    phaseRef.current = "idle";
    setPhase("idle");
  };

  const download = async () => {
    if (!draft?.audio || downloading) return;
    setDownloading(true);
    try {
      const name = `PSC-audio-${Date.now()}.mp3`;
      const dir =
        Platform.OS === "android"
          ? RNFS.DownloadDirectoryPath
          : RNFS.DocumentDirectoryPath;
      const path = `${dir}/${name}`;
      await RNFS.downloadFile({ fromUrl: draft.audio, toFile: path }).promise;
      if (Platform.OS === "ios") {
        await Share.share({ url: `file://${path}` });
      } else {
        ToastMessage("Saved to Downloads", "success");
      }
    } catch (e) {
      console.log("Audio post download error", e);
      ToastMessage("Could not save the audio", "error");
    } finally {
      setDownloading(false);
    }
  };

  // Client: an Audio Post doesn't go through the post-creation form —
  // Continue renders the trim / speed and publishes it right here.
  const onContinue = async () => {
    if (!draft?._id || continuing) return;
    await stopPreview();
    setContinuing(true);
    try {
      await editAudioDraft(draft._id, { startMs, endMs, speed });
      const res = await publishAudioPost(draft._id, {});
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Could not publish the audio post");
      }
      publishedRef.current = true;
      // the feed reloads its posts + TOP RADIOS strip on this event
      DeviceEventEmitter.emit("uploadCompleted");
      ToastMessage("Audio post published", "success");
      navigation.goBack();
    } catch (e) {
      ToastMessage(e?.message || "Could not publish the audio post", "error");
    } finally {
      setContinuing(false);
    }
  };

  // ─── back ───────────────────────────────────────────────────────────────
  const leave = useCallback(() => {
    if (phase === "recording") {
      stopRecording({ discard: true }).then(() => navigation.goBack());
      return true;
    }
    if (phase === "edit" && draftRef.current?._id && !publishedRef.current) {
      Alert.alert("Discard recording?", "Your audio post will not be saved.", [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await stopPreview();
            await discardDraft();
            navigation.goBack();
          },
        },
      ]);
      return true;
    }
    if (phase === "uploading") return true;
    navigation.goBack();
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, navigation, stopPreview]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", leave);
      return () => sub.remove();
    }, [leave]),
  );

  // ─── render ─────────────────────────────────────────────────────────────
  const recording = phase === "recording";
  // the button goes red the moment it is pressed, before the recorder is up
  const armed = recording || starting;
  const footerBottom = insets.bottom > 0 ? 28 : 16;

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" />
      <AudioBackdrop bottomColor={AUDIO.dark} />

      <AudioHeader
        user={me}
        variant="publishing"
        onBack={leave}
        onSwitchAccount={() => phase === "idle" && setAccountsVisible(true)}
      />

      {/* content column (Figma: 24 under the header, pad 20) */}
      <View style={styles.content}>
        {phase === "edit" ? (
          <>
            <TranscriptCredit />
            <View style={styles.transcript}>
              <TranscriptView
                source={draft}
                positionMs={previewMs}
                placeholder={
                  draft?.subtitlesStatus === "empty"
                    ? "No speech found in this recording"
                    : "Preparing your transcript…"
                }
              />
            </View>
          </>
        ) : recording && hasLiveText ? (
          // Figma 7593:3533: while recording, the words spoken so far
          <>
            <TranscriptCredit />
            <View style={styles.transcript}>
              <LiveTranscript bus={liveBus} />
            </View>
          </>
        ) : (
          <>
            {/* Figma: SemiBold 24 / 125% / −4%, 335 wide (wraps after
                "your"), cap top 24 under the header */}
            <CustomText
              fontSize={24}
              lineHeight={TITLE_LINE}
              color={AUDIO.white}
              letterSpacing={ls(24, -4)}
              fontFamily={fonts.semiBold}
              label={`Be vocal about your \nopinions!`}
              marginTop={TITLE_CAP_TOP}
            />
            {/* Figma frame 140, campaign vector 112 × 86.9 at (14, 26.5) */}
            <FrameIcon
              frame={140}
              size={134.5}
              family={MSF}
              name="campaign"
              color={AUDIO.white}
              style={styles.megaphone}
            />
          </>
        )}
      </View>

      {phase === "edit" ? (
        <>
          {/* speed · AI tools · trim strip (Figma y 562, 4 above the footer) */}
          <View
            style={[
              styles.editTools,
              { bottom: 32 + 52 + Math.max(insets.bottom, 16) + 4 },
            ]}
          >
            <SpeedPicker value={speed} onChange={setSpeed} />
            <View style={styles.chips}>
              <ToolChip
                icon="auto_fix_high"
                label="Correct"
                cost={3}
                busy={busyTool === "correct"}
                disabled={!transcriptReady || !!draft?.edits?.corrected}
                onPress={() => runTool("correct")}
              />
              <ToolChip
                icon="magic_button"
                label="Remove Speech Disfluency"
                cost={6}
                busy={busyTool === "disfluency"}
                disabled={!transcriptReady || !!draft?.edits?.disfluencyRemoved}
                onPress={() => runTool("disfluency")}
              />
            </View>
            <WaveformTrimmer
              waveform={draft?.waveform}
              durationMs={draft?.durationMs || 0}
              startMs={startMs}
              endMs={endMs}
              positionMs={previewing ? previewMs : 0}
              disabled={!!busyTool || continuing}
              onChange={(s, e) => {
                const start = Math.round(s);
                setStartMs(start);
                setEndMs(Math.round(e));
                // the loop restarts from the new trim start right away
                seekTo(start);
              }}
              onPress={togglePreview}
            />
          </View>

          {/* Figma "Container" 118: transparent → #007BFF, blur 16, pad 32/12/34/12 */}
          <View
            style={[
              styles.editFooter,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <GlassFill borderRadius={0} fill="transparent" />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0, 123, 255, 0)", AUDIO.blue]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.editRow}>
              <RingButton
                icon="replay"
                onPress={retake}
                disabled={continuing}
              />
              <RingButton
                icon="download_2"
                onPress={download}
                busy={downloading}
                disabled={continuing}
              />
              <View style={styles.flex}>
                <CustomButton
                  title="Continue"
                  isBoarder
                  secondBorderColor={AUDIO.white48}
                  backgroundColor={AUDIO.white}
                  color={AUDIO.dark}
                  fontSize={18}
                  fontFamily={fonts.medium}
                  loading={continuing}
                  indicatorColor={AUDIO.dark}
                  disabled={!!busyTool}
                  onPress={onContinue}
                />
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.footer, { paddingBottom: footerBottom }]}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(18, 18, 18, 0)", AUDIO.dark]}
            style={StyleSheet.absoluteFill}
          />
          {/* Figma: tip (idle) / level meter (recording) — 24 above the buttons */}
          <View style={styles.hint}>
            <View style={[styles.tip, { opacity: recording ? 0 : 1 }]}>
              <Glyph
                family={MSF}
                name="tips_and_updates"
                size={16}
                color={AUDIO.white}
              />
              <CustomText
                label={
                  phase === "uploading"
                    ? "Saving your recording…"
                    : "Before recording try finding a quiet place."
                }
                fontFamily={fonts.medium}
                fontSize={12}
                color={AUDIO.white64}
                textAlign="center"
                // Figma: 8 under the 16 icon, text box 8 (cap-trimmed)
                marginTop={capGap(8, 0, 12)}
                marginBottom={baseline(12)}
              />
            </View>
            <View style={[styles.meterWrap, { opacity: recording ? 1 : 0 }]}>
              <LiveWave bus={waveBus} />
            </View>
          </View>

          <View style={styles.buttons}>
            {/* Figma "Back Button" 48: white 16% + blur, inner 40 #262626 */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={pickFile}
              disabled={phase !== "idle"}
              style={styles.side}
            >
              <GlassFill fill={AUDIO.white16} />
              <View style={styles.sideInner}>
                {/* Figma: 20 frame, vector 14 × 16 */}
                <FrameIcon
                  frame={20}
                  size={19.2}
                  family={MSF}
                  name="graphic_eq"
                  color={AUDIO.white}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.center}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onLockPress}
                disabled={!recording}
                style={[styles.small, { opacity: recording ? 1 : 0 }]}
              >
                <GlassFill fill={AUDIO.white16} />
                <View
                  pointerEvents="none"
                  style={[styles.lockOn, { opacity: locked ? 1 : 0 }]}
                />
                <Glyph
                  family={MSF}
                  name="lock"
                  size={16}
                  color={locked ? AUDIO.dark : AUDIO.white}
                />
              </TouchableOpacity>

              <Pressable
                onPressIn={onRecordPressIn}
                onPressOut={onRecordPressOut}
                onPress={onRecordPress}
                disabled={phase === "uploading"}
                onTouchMove={(e) => {
                  // slide left onto the lock → hands-free
                  if (holdingRef.current && e.nativeEvent.locationX < -16)
                    setLockedBoth(true);
                }}
                style={styles.record}
              >
                <GlassFill fill={AUDIO.white16} />
                <View
                  style={[
                    styles.recordInner,
                    armed ? styles.recordRed : styles.recordWhite,
                  ]}
                >
                  {phase === "uploading" ? (
                    <ActivityIndicator color={AUDIO.dark} />
                  ) : null}
                </View>
              </Pressable>

              {/* Figma keeps a hidden 32 on the right (opacity 0) */}
              <View style={styles.small} />
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={togglePause}
              disabled={!recording}
              style={[styles.side, { opacity: recording ? 1 : 0 }]}
            >
              <GlassFill fill={AUDIO.white16} />
              <Glyph
                family={MSF}
                name={paused ? "mic" : "pause"}
                size={24}
                color={AUDIO.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {phase === "edit" && draftAudio ? (
        <Video
          ref={videoRef}
          source={{ uri: draftAudio }}
          audioOnly
          paused={!previewing}
          rate={speed}
          progressUpdateInterval={100}
          onProgress={onPreviewProgress}
          onEnd={onPreviewEnd}
          onError={(e) => console.log("Audio post preview error", e)}
          ignoreSilentSwitch="ignore"
          playInBackground={false}
          style={styles.hiddenPlayer}
        />
      ) : null}

      <AccountSwitchSheet
        returnTo="RecordAudioPost"
        visible={accountsVisible}
        onDismiss={() => setAccountsVisible(false)}
      />
    </View>
  );
};

// Figma vectors in the 24 frames: replay 15.9 × 19.3, download 14 × 17
const RING_ICON_SIZE = { replay: 22, download_2: 20.7 };

/** Figma 52 ring button: 1pt white 48% inside, pad 4, inner 44 white 16% */
const RingButton = ({ icon, onPress, busy, disabled }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    disabled={disabled || busy}
    style={styles.ring}
  >
    <View style={styles.ringInner}>
      {busy ? (
        <ActivityIndicator color={AUDIO.white} />
      ) : (
        <FrameIcon
          frame={24}
          size={RING_ICON_SIZE[icon] || 24}
          family={MSF}
          name={icon}
          color={AUDIO.white}
        />
      )}
    </View>
  </TouchableOpacity>
);

// ─── live waveform ────────────────────────────────────────────────────────
const WAVE_MAX = 120; // samples kept (more than fit on the widest screen)
function createWaveBus() {
  let samples = [];
  const listeners = new Set();
  const emit = () => listeners.forEach((l) => l());
  return {
    push(v) {
      samples = [...samples.slice(-(WAVE_MAX - 1)), v];
      emit();
    },
    reset() {
      if (!samples.length) return;
      samples = [];
      emit();
    },
    // used as a single-value store too (live transcript text)
    set(value) {
      if (samples === value) return;
      samples = value;
      emit();
    },
    get: () => samples,
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

const BAR = 2;
const BAR_GAP = 2;
const barHeight = (v) => 6 + Math.max(0, Math.min(1, v || 0)) * 66; // 6 … 72

/**
 * Figma "Frame 2085664205" + the client's reference: a live waveform — 2pt
 * bars 2 apart, heights following the microphone. Each new sample appears
 * AT the blue 4 × 91 playhead in the middle and the line glides to the left
 * (the recorded part, white 48 %), so the wave is drawn where the recording
 * happens from the first sample; the two newest samples also show right of
 * the playhead in white, as in the Figma frame.
 */
const STEP = BAR + BAR_GAP;
const LiveWave = ({ bus }) => {
  const { width } = useWindowDimensions();
  const samples = useSyncExternalStore(bus.subscribe, bus.get);
  const lane = width - 48; // footer pad 24 each side
  const center = lane / 2;
  const count = Math.floor(center / STEP) + 2; // +1 off-screen while gliding
  const shown = samples.slice(-count);
  const newest = samples.slice(-2).reverse();

  // glide: every sample moves the line one step left over the 100 ms tick
  const shift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!samples.length) return;
    shift.setValue(STEP);
    Animated.timing(shift, {
      toValue: 0,
      duration: 100,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [samples, shift]);

  return (
    <View style={[styles.meter, { width: lane }]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: shift }] }]}
      >
        {shown.map((v, i) => {
          const fromEnd = shown.length - 1 - i;
          // newest bar just left of the playhead, older ones further left
          const x = center - 2 - BAR_GAP - BAR - fromEnd * STEP;
          const h = barHeight(v);
          return (
            <View
              key={samples.length - fromEnd}
              style={[
                styles.meterBar,
                {
                  position: "absolute",
                  left: x,
                  top: (91 - h) / 2,
                  height: h,
                  backgroundColor: AUDIO.white48,
                },
              ]}
            />
          );
        })}
      </Animated.View>
      <View style={[styles.playhead, { position: "absolute", left: center - 2 }]} />
      {newest.map((v, i) => {
        const h = barHeight(v);
        return (
          <View
            key={`n${i}`}
            style={[
              styles.meterBar,
              {
                position: "absolute",
                left: center + 2 + BAR_GAP + i * STEP,
                top: (91 - h) / 2,
                height: h,
                backgroundColor: AUDIO.white,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export default RecordAudioPost;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: AUDIO.black },
  hiddenPlayer: { width: 0, height: 0 },
  flex: { flex: 1 },
  content: { marginTop: 24, paddingHorizontal: 20 },
  // Figma gap 32 below the 12 credit row (TranscriptView trims its own box)
  transcript: { marginTop: 32 },
  // the 140 icon frame starts at the heading's baseline (Figma gap 0)
  megaphone: { marginTop: TITLE_BASELINE },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingHorizontal: 24,
    gap: 24,
    alignItems: "center",
  },
  // tip (16 icon + 8 + text) and the 91 meter share one slot
  hint: { height: 91, alignItems: "center", justifyContent: "flex-end" },
  tip: { position: "absolute", bottom: 0, alignItems: "center" },
  meterWrap: { position: "absolute", bottom: 0 },
  buttons: {
    alignSelf: "stretch",
    height: 96,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  side: {
    width: 48,
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  sideInner: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: AUDIO.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { height: 96, flexDirection: "row", alignItems: "center", gap: 8 },
  small: {
    width: 32,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  lockOn: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AUDIO.white,
    borderRadius: 100,
  },
  record: {
    width: 96,
    height: 96,
    borderRadius: 100,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  recordInner: {
    width: 80,
    height: 80,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  recordWhite: { backgroundColor: AUDIO.white },
  recordRed: { backgroundColor: AUDIO.red },

  meter: { height: 91, overflow: "hidden" },
  meterBar: { width: BAR, borderRadius: 100 },
  playhead: {
    width: 4,
    height: 91,
    borderRadius: 100,
    backgroundColor: AUDIO.blue,
  },

  editTools: {
    position: "absolute",
    left: 12,
    right: 12,
    gap: 10,
    alignItems: "flex-end",
  },
  chips: { alignSelf: "stretch", flexDirection: "row", gap: 3 },
  editFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 32,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  editRow: { height: 52, flexDirection: "row", alignItems: "center", gap: 8 },
  ring: {
    width: 52,
    height: 52,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: AUDIO.white48,
    padding: 4,
  },
  ringInner: {
    flex: 1,
    borderRadius: 100,
    backgroundColor: AUDIO.white16,
    alignItems: "center",
    justifyContent: "center",
  },
});
