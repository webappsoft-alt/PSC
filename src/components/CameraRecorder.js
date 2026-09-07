import React, { useState, useRef, useEffect } from "react";
import {View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated as RNAnimated,
  ActivityIndicator} from "react-native";
import { RNCamera } from "react-native-camera";
import Svg, { Circle } from "react-native-svg";
import Text from "./ScaledText";

const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RECORD_BUTTON_SIZE = 80;
const PROGRESS_RING_SIZE = 100;
const PROGRESS_STROKE_WIDTH = 5;
const MAX_DURATION_MS = 60000;

export function CameraRecorder({ onVideoRecorded, onClose }) {
  const [facing, setFacing] = useState("back");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [cameraPermission, setCameraPermission] = useState(null);

  const cameraRef = useRef(null);
  const recordingInterval = useRef(null);
  const recordingStartTime = useRef(0);
  const progress = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  async function startRecording() {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      recordingStartTime.current = Date.now();

      RNAnimated.timing(progress, {
        toValue: 1,
        duration: MAX_DURATION_MS,
        useNativeDriver: false,
      }).start();

      recordingInterval.current = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime.current;
        setRecordingDuration(elapsed);

        if (elapsed >= MAX_DURATION_MS) {
          stopRecording();
        }
      }, 100);

      const data = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION_MS / 1000,
        quality: RNCamera.Constants.VideoQuality["720p"],
        mute: false,
      });

      if (data && data.uri) {
        const duration = Date.now() - recordingStartTime.current;
        onVideoRecorded(data.uri, duration);
      }
    } catch (error) {
      console.error("Recording error:", error);
      setIsRecording(false);
      progress.setValue(0);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
  }

  async function stopRecording() {
    if (!cameraRef.current || !isRecording) return;

    try {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
      progress.setValue(0);

      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
    } catch (error) {
      console.error("Stop recording error:", error);
    }
  }

  function toggleCameraFacing() {
    setFacing((current) =>
      current === RNCamera.Constants.Type.back
        ? RNCamera.Constants.Type.front
        : RNCamera.Constants.Type.back
    );
  }

  const radius = (PROGRESS_RING_SIZE - PROGRESS_STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  if (cameraPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (cameraPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need your permission to use the camera for recording videos.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={onClose}>
            <Text style={styles.permissionButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.camera}
        type={facing}
        flashMode={RNCamera.Constants.FlashMode.off}
        captureAudio={true}
        onCameraReady={() => setCameraPermission(true)}
        onStatusChange={({ cameraStatus }) => {
          setCameraPermission(cameraStatus === "READY");
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          {isRecording && (
            <View style={styles.durationContainer}>
              <View style={styles.recordingDot} />
              <Text style={styles.durationText}>
                {(recordingDuration / 1000).toFixed(1)}s /{" "}
                {MAX_DURATION_MS / 1000}s
              </Text>
            </View>
          )}

          {!isRecording && <View style={{ width: 48 }} />}

          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
            disabled={isRecording}
          >
            <Text style={{ fontSize: 24, color: isRecording ? "#666" : "#fff" }}>
              🔄
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <Text style={styles.instructionText}>
            {isRecording ? "Release to stop" : "Hold to record"}
          </Text>

          <TouchableOpacity
            style={styles.recordButtonContainer}
            activeOpacity={1}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <Svg
              width={PROGRESS_RING_SIZE}
              height={PROGRESS_RING_SIZE}
              style={styles.progressRing}
            >
              <Circle
                cx={PROGRESS_RING_SIZE / 2}
                cy={PROGRESS_RING_SIZE / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={PROGRESS_STROKE_WIDTH}
                fill="none"
              />
              <AnimatedCircle
                cx={PROGRESS_RING_SIZE / 2}
                cy={PROGRESS_RING_SIZE / 2}
                r={radius}
                stroke="#ff4444"
                strokeWidth={PROGRESS_STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${PROGRESS_RING_SIZE / 2}, ${PROGRESS_RING_SIZE / 2}`}
              />
            </Svg>

            <View
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </RNCamera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4444",
  },
  durationText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    alignItems: "center",
    gap: 20,
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recordButtonContainer: {
    width: PROGRESS_RING_SIZE,
    height: PROGRESS_RING_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  progressRing: {
    position: "absolute",
  },
  recordButton: {
    width: RECORD_BUTTON_SIZE,
    height: RECORD_BUTTON_SIZE,
    borderRadius: RECORD_BUTTON_SIZE / 2,
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordButtonActive: {
    backgroundColor: "#ff4444",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default CameraRecorder;
