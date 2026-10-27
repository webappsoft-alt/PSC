import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import {Animated,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  PermissionsAndroid} from "react-native";
import {
  createSound,
  useSoundWithStates,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
} from "react-native-nitro-sound";
import { COLORS } from "../../../../utils/COLORS";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import Text from "../../../../components/ScaledText";

const NUM_BARS = 40;

const AudioRecorder = React.forwardRef(({ onSend, onCancel }, ref) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [recordingPath, setRecordingPath] = useState("");
  const { state, startRecorder, stopRecorder } = useSoundWithStates();
  const soundRef = useRef(createSound());
  const isMounted = useRef(true);
  const volumeRef = useRef(0.5);
  const barAnims = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(0)),
  ).current;

  useImperativeHandle(ref, () => ({
    stopAndSend,
  }));

  const requestMicPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message:
              "This app needs access to your microphone to record voice messages.",
            buttonPositive: "OK",
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn("Permission error:", err);
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    const startRecording = async () => {
      const hasPermission = await requestMicPermission();
      if (!hasPermission) {
        Alert.alert("Permission Denied", "Microphone access is required.");
        onCancel?.();
        return;
      }

      try {
        const audioSet = {
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.DEFAULT,
          AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
          AVNumberOfChannelsKeyIOS: 2,
          AVFormatIDKeyIOS: "aac",
        };
        const uri = await startRecorder(undefined, audioSet, true);
        setRecordingPath(uri);
      } catch (e) {
        console.error("Recording error:", e);
        Alert.alert("Error", String(e));
        onCancel?.();
      }
    };

    startRecording();

    return () => {
      if (state.isRecording) stopRecorder();
    };
  }, []);

  // Wave animations
  useEffect(() => {
    isMounted.current = true;

    // Simulate voice volume: 0 = silent, 1 = loud
    const volumeInterval = setInterval(() => {
      volumeRef.current = Math.random();
    }, 1500);

    const animate = (index) => {
      if (!isMounted.current) return;
      const maxHeight = 2 + volumeRef.current * 34;
      const targetHeight = 1 + Math.random() * maxHeight;
      const duration = 150 + Math.random() * 150;
      Animated.timing(barAnims[index], {
        toValue: targetHeight,
        duration,
        useNativeDriver: false,
      }).start(() => {
        if (isMounted.current) animate(index);
      });
    };

    barAnims.forEach((_, i) => {
      setTimeout(() => animate(i), i * 50);
    });

    return () => {
      isMounted.current = false;
      clearInterval(volumeInterval);
    };
  }, []);

  // Delete: stop the recorder (discard the file) and close right away
  const handleDelete = async () => {
    isMounted.current = false;
    try {
      await stopRecorder();
    } catch (e) {
      // already stopped
    }
    onCancel?.();
  };

  const stopAndSend = async () => {
    isMounted.current = false;
    await new Promise((resolve) => {
      Animated.parallel(
        barAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: false,
          }),
        ),
      ).start(resolve);
    });

    try {
      const path = await stopRecorder();
      const recordedDuration =
        Math.floor((state.recording?.position || 0) / 1000) || 0;
      onSend?.(path, recordedDuration, 0);
    } catch (e) {
      Alert.alert("Stop error", String(e));
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.dot} />
        <Text style={styles.timer}>
          {formatTime(state.recording.position || 0)}
        </Text>
        <View style={styles.wavesContainer}>
          {barAnims.map((anim, i) => (
            <Animated.View key={i} style={[styles.bar, { height: anim }]} />
          ))}
        </View>
      </View>

      <TouchableOpacity onPress={handleDelete} hitSlop={10}>
        <Icons
          name="delete"
          family="MaterialSymbolsRounded"
          size={24}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
});

export default AudioRecorder;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    marginRight: 6,
  },
  timer: {
    color: colors.text,
    fontWeight: "600",
  },
  wavesContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "space-evenly",
    marginLeft: 8,
    height: 35,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textSecondary,
  },
});
