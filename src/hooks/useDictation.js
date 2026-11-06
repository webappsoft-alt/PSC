import Voice from "@react-native-voice/voice";
import { useCallback, useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import { ToastMessage } from "../utils/ToastMessage";

const requestMic = async () => {
  if (Platform.OS !== "android") return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: "Microphone Permission",
        message: "PSC needs your microphone to turn your voice into text.",
        buttonPositive: "OK",
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (_) {
    return false;
  }
};

/**
 * Voice → text for a text field, the same on-device recognition the Audio
 * Post recorder uses for its live captions (@react-native-voice/voice).
 * A recognition session ends by itself after a pause (iOS caps one at about
 * a minute), so while dictation is on it is restarted and its text appended.
 *
 *   const { listening, toggle } = useDictation({
 *     getBaseText: () => description,   // text already in the field
 *     onText: setDescription,           // base + what was said so far
 *   });
 */
const useDictation = ({ getBaseText, onText, locale = "en-US" }) => {
  const [listening, setListening] = useState(false);
  const wantedRef = useRef(false); // dictation switched on
  const activeRef = useRef(false); // a recognition session is running
  const baseRef = useRef(""); // field text when dictation started
  const doneRef = useRef(""); // text of finished sessions
  const curRef = useRef(""); // best text of the running session
  const restartRef = useRef(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const emit = useCallback(() => {
    const spoken = [doneRef.current, curRef.current]
      .filter(Boolean)
      .join(" ")
      .trim();
    const base = baseRef.current;
    const sep = base && spoken && !/\s$/.test(base) ? " " : "";
    onTextRef.current?.(`${base}${sep}${spoken}`);
  }, []);

  const startSession = useCallback(async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    try {
      await Voice.start(locale);
    } catch (e) {
      activeRef.current = false;
      console.log("Dictation start error", e?.message || e);
    }
  }, [locale]);

  const installHandlers = useCallback(() => {
    const showCurrent = (text) => {
      if (typeof text !== "string" || !text.trim()) return;
      curRef.current = text.trim();
      emit();
    };
    const sessionEnded = () => {
      activeRef.current = false;
      if (curRef.current) {
        doneRef.current = [doneRef.current, curRef.current]
          .filter(Boolean)
          .join(" ");
        curRef.current = "";
        emit();
      }
      if (!wantedRef.current) return;
      clearTimeout(restartRef.current);
      restartRef.current = setTimeout(() => {
        if (wantedRef.current && !activeRef.current) startSession();
      }, 60);
    };
    Voice.onSpeechStart = () => {
      activeRef.current = true;
    };
    Voice.onSpeechPartialResults = (e) => showCurrent(e?.value?.[0]);
    Voice.onSpeechResults = (e) => showCurrent(e?.value?.[0]);
    Voice.onSpeechEnd = sessionEnded;
    Voice.onSpeechError = (e) => {
      const msg = String(e?.error?.message || e?.error?.code || "");
      if (/already started/i.test(msg)) {
        Voice.destroy()
          .catch(() => {})
          .then(() => {
            activeRef.current = false;
            if (wantedRef.current) startSession();
          });
        return;
      }
      sessionEnded();
    };
  }, [emit, startSession]);

  const stop = useCallback(async () => {
    wantedRef.current = false;
    clearTimeout(restartRef.current);
    setListening(false);
    try {
      await Voice.stop();
    } catch (_) {}
  }, []);

  const start = useCallback(async () => {
    if (wantedRef.current) return;
    const ok = await requestMic();
    if (!ok) {
      ToastMessage("Microphone permission is needed to dictate", "error");
      return;
    }
    baseRef.current = getBaseText?.() || "";
    doneRef.current = "";
    curRef.current = "";
    wantedRef.current = true;
    setListening(true);
    // Voice keeps one global set of handlers — (re)install ours every time
    installHandlers();
    startSession();
  }, [getBaseText, installHandlers, startSession]);

  const toggle = useCallback(() => {
    if (wantedRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(
    () => () => {
      wantedRef.current = false;
      activeRef.current = false;
      clearTimeout(restartRef.current);
      Voice.removeAllListeners();
      Voice.destroy().catch(() => {});
    },
    [],
  );

  return { listening, start, stop, toggle };
};

export default useDictation;
