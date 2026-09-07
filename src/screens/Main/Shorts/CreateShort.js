import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { createThumbnail } from "react-native-create-thumbnail";
import RNFS from "react-native-fs";
import { openPicker } from "react-native-image-crop-picker";
import LinearGradient from "react-native-linear-gradient";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  cancelAnimation,
  useAnimatedProps,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import Video from "react-native-video";
import { Camera, useCameraDevice } from "react-native-vision-camera";

import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import Blur from "../../../components/Blur";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import { useUpload } from "../../../contexts/UploadContext";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useIsForeground } from "../../../utils/UseIsForground";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
const TRIMMER_WIDTH = screenWidth - 32;
const HANDLE_WIDTH = 10;
const THUMB_COUNT = 10;
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

// ─── Constants for Camera Button ──────────────────────────────────────────────
const MAX_RECORDING_DURATION = 60000;
const BUTTON_SIZE = 80;
const RING_RADIUS = 46;
const RING_STROKE = 5;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SVG_SIZE = (RING_RADIUS + RING_STROKE) * 2 + 4;

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

// ─── Progress Ring ─────────────────────────────────────────────────────────────
const ProgressRing = ({ progress, visible }) => {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: SVG_SIZE,
        height: SVG_SIZE,
      }}
      pointerEvents="none"
    >
      <Svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      >
        <Circle
          cx={SVG_SIZE / 2}
          cy={SVG_SIZE / 2}
          r={RING_RADIUS}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={RING_STROKE}
          fill="none"
        />

        <AnimatedCircle
          cx={SVG_SIZE / 2}
          cy={SVG_SIZE / 2}
          r={RING_RADIUS}
          stroke="#FF3B30"
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SVG_SIZE / 2}, ${SVG_SIZE / 2}`}
        />
      </Svg>
    </View>
  );
};

const CreateShort = () => {
  const navigation = useNavigation();
  const { startUpload, completeUpload, failUpload } = useUpload();
  const isFocused = useIsFocused();
  const isForeground = useIsForeground();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isAnimRunning = useRef(false);
  const lastVideoTime = useRef(0);

  const [cameraPosition, setCameraPosition] = useState("back");
  const [flash, setFlash] = useState("off");
  const [hasPermission, setHasPermission] = useState(null);
  const [isPermissionChecked, setIsPermissionChecked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);

  // Video trimmer states (PanResponder-based)
  const [currentTime, setCurrentTime] = useState(0);
  const [thumbnails, setThumbnails] = useState([]);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const leftHandle = useRef(new Animated.Value(0)).current;
  const rightHandle = useRef(
    new Animated.Value(TRIMMER_WIDTH - HANDLE_WIDTH),
  ).current;
  const scrubberX = useRef(new Animated.Value(0)).current;

  const startTimeRef = useRef(0);
  const endTimeRef = useRef(0);
  const durationRef = useRef(0);
  const leftHandleVal = useRef(0);
  const rightHandleVal = useRef(TRIMMER_WIDTH - HANDLE_WIDTH);
  const rightStartX = useRef(0);
  const leftStartX = useRef(0);

  const thumbnailsGenerated = useRef(false);

  // Reanimated shared values for camera button
  const progress = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const innerScale = useSharedValue(1);

  const device = useCameraDevice(cameraPosition);
  const isActive = isFocused && isForeground && !recordedVideo;

  // ── Animated styles for camera button ────────────────────────────────────
  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const innerDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
    borderRadius: innerScale.value < 0.7 ? 8 : BUTTON_SIZE / 2,
  }));

  // Permissions
  const requestPermission = useCallback(async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();
      const isGranted =
        cameraPermission === "granted" && microphonePermission === "granted";
      setHasPermission(isGranted);
      setIsPermissionChecked(true);
    } catch (error) {
      setHasPermission(false);
      setIsPermissionChecked(true);
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Sync handle animated values to refs
  useEffect(() => {
    leftHandle.addListener(({ value }) => {
      leftHandleVal.current = value;
    });
    rightHandle.addListener(({ value }) => {
      rightHandleVal.current = value;
    });
    return () => {
      leftHandle.removeAllListeners();
      rightHandle.removeAllListeners();
    };
  }, []);

  // Move scrubber as video plays
  useEffect(() => {
    if (durationRef.current === 0) return;
    const leftPx = leftHandleVal.current + HANDLE_WIDTH;
    const rightPx = rightHandleVal.current;
    const selectedWidthPx = rightPx - leftPx;
    const selectedDuration = endTimeRef.current - startTimeRef.current;
    if (selectedDuration <= 0) return;
    const progress = (currentTime - startTimeRef.current) / selectedDuration;
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const newX = leftPx + clampedProgress * selectedWidthPx;
    scrubberX.setValue(newX);
  }, [currentTime]);

  // Loop within trimmed range
  useEffect(() => {
    if (currentTime >= endTimeRef.current && endTimeRef.current > 0) {
      videoRef.current?.seek(startTimeRef.current);
    }
  }, [currentTime]);

  // Intercept hardware back press when video preview is shown
  // so that sliding the trimmer doesn't accidentally trigger navigation back
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (allowBackRef.current) return; // allow manual back

      e.preventDefault(); // block everything else
    });

    return unsubscribe;
  }, [navigation]);

  const allowBackRef = useRef(false);

  const handleClose = () => {
    allowBackRef.current = true;
    navigation.goBack();
  };

  // Video Recording Logic
  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);

      buttonScale.value = withSpring(1.18, { damping: 12 });
      innerScale.value = withSpring(0.58, { damping: 12 });

      progress.value = 0;
      progress.value = withTiming(1, {
        duration: MAX_RECORDING_DURATION,
        easing: Easing.linear,
      });

      // Set 1-minute timer to auto-stop recording
      recordingTimerRef.current = setTimeout(async () => {
        if (cameraRef.current && isRecording) {
          await stopRecording();
        }
      }, MAX_RECORDING_DURATION); // 60 seconds = 1 minute

      await cameraRef.current.startRecording({
        flash: flash === "on" ? "on" : "off",
        onRecordingFinished: (video) => {
          const videoPath = video.path.startsWith("file://")
            ? video.path
            : `file://${video.path}`;
          setRecordedVideo(videoPath.replace("file://file://", "file://"));
          const duration = video?.duration || 60;
          setVideoDuration(duration.toFixed(2));
          // setMaxDuration(duration);
          setIsRecording(false);
          progressAnim.setValue(0);
          resetAnimations();

          // Clear timer
          if (recordingTimerRef.current) {
            clearTimeout(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        },
        onRecordingError: (error) => {
          console.error("Recording error:", error);
          ToastMessage("Failed to record video", "error");
          setIsRecording(false);

          // Clear timer
          if (recordingTimerRef.current) {
            clearTimeout(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        },
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      ToastMessage("Failed to start recording", "error");
      setIsRecording(false);

      // Clear timer
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    resetAnimations();

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error("Error stopping recording:", error);
      ToastMessage("Failed to stop recording", "error");
      setIsRecording(false);
    }
  };

  const resetAnimations = useCallback(() => {
    cancelAnimation(progress);
    progress.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
    buttonScale.value = withSpring(1, { damping: 14 });
    innerScale.value = withSpring(1, { damping: 14 });
  }, [buttonScale, innerScale, progress]);

  const handleGalleryPicker = async () => {
    try {
      const result = await openPicker({
        mediaType: "video",
      });
      if (result) {
        setRecordedVideo(result.path);
      }
    } catch (error) {
      console.log("Gallery error", error);
    }
  };

  const handleRetake = () => {
    setRecordedVideo(null);
    setCaption("");
    setIsEditingCaption(false);
    setVideoDuration(null);
    setThumbnails([]);
    setStartTime(0);
    setEndTime(0);
    setDuration(0);
    setCurrentTime(0);
    startTimeRef.current = 0;
    endTimeRef.current = 0;
    durationRef.current = 0;
    leftHandleVal.current = 0;
    rightHandleVal.current = TRIMMER_WIDTH - HANDLE_WIDTH;
    leftHandle.setValue(0);
    rightHandle.setValue(TRIMMER_WIDTH - HANDLE_WIDTH);
    scrubberX.setValue(0);
    progressAnim.setValue(0);
    thumbnailsGenerated.current = false;
  };

  // const handleClose = () => {
  //   navigation.goBack();
  // };

  // ─── Trimmer helpers ────────────────────────────────────────────────────────
  const positionToTime = (pos) =>
    (pos / TRIMMER_WIDTH) * (durationRef.current || 1);

  const moveToStablePath = async (uri) => {
    const fileName = `video_${Date.now()}.mp4`;
    const dest = `${RNFS.CachesDirectoryPath}/${fileName}`;

    await RNFS.copyFile(uri, dest);

    return `file://${dest}`;
  };

  const generateThumbnails = async (dur, uri) => {
    try {
      let thumbs = [];

      // 🔥 FIX: move file to stable location first
      const safeUri = await moveToStablePath(uri);

      for (let i = 0; i < THUMB_COUNT; i++) {
        const time = (dur / THUMB_COUNT) * i;

        try {
          const res = await createThumbnail({
            url: safeUri,
            timeStamp: Math.floor(time * 1000),
          });

          if (res?.path) thumbs.push(res.path);
        } catch (err) {
          console.log("single thumb error:", err);
        }
      }

      setThumbnails(thumbs);
    } catch (e) {
      console.log("generator crash:", e);
    }
  };
  const leftPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        leftHandle.stopAnimation((value) => {
          leftStartX.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        let newX = leftStartX.current + gesture.dx;
        if (newX < 0) newX = 0;
        if (newX > rightHandleVal.current - 50)
          newX = rightHandleVal.current - 50;
        leftHandle.setValue(newX);
        leftHandleVal.current = newX;
        const t = positionToTime(newX);
        startTimeRef.current = t;
        setStartTime(t);
        videoRef.current?.seek(t);
      },
    }),
  ).current;

  const rightPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        rightHandle.stopAnimation((value) => {
          rightStartX.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        let newX = rightStartX.current + gesture.dx;
        if (newX > TRIMMER_WIDTH - HANDLE_WIDTH)
          newX = TRIMMER_WIDTH - HANDLE_WIDTH;
        if (newX < leftHandleVal.current + 50)
          newX = leftHandleVal.current + 50;
        rightHandle.setValue(newX);
        rightHandleVal.current = newX;
        const t = positionToTime(newX + HANDLE_WIDTH);
        endTimeRef.current = t;
        setEndTime(t);
      },
    }),
  ).current;

  const onProgress = (data) => {
    setCurrentTime(data.currentTime);
    // Progress bar update
    const start = startTimeRef.current;
    const end = endTimeRef.current;
    const range = Math.max(end - start, 0.1);
    const normalized = Math.min(
      Math.max((data.currentTime - start) / range, 0),
      1,
    );
    progressAnim.setValue(normalized);
  };

  const onLoad = (data) => {
    const dur = data.duration;
    if (!videoDuration) setVideoDuration(dur.toFixed(2));
    durationRef.current = dur;
    setDuration(dur);
    endTimeRef.current = dur;
    setEndTime(dur);
    startTimeRef.current = 0;
    setStartTime(0);
    rightHandle.setValue(TRIMMER_WIDTH - HANDLE_WIDTH);
    rightHandleVal.current = TRIMMER_WIDTH - HANDLE_WIDTH;
    leftHandle.setValue(0);
    leftHandleVal.current = 0;
    scrubberX.setValue(0);
    progressAnim.setValue(0);
    if (!thumbnailsGenerated.current && recordedVideo) {
      thumbnailsGenerated.current = true;
      generateThumbnails(dur, recordedVideo);
    }
  };

  // console.log("thimbs=====", thumbnails);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m}:${s.toFixed(1).padStart(4, "0")}`;
    return `${secs.toFixed(1)}s`;
  };

  const thumbWidth = TRIMMER_WIDTH / THUMB_COUNT;

  const handlePost = () => {
    if (!recordedVideo) return;
    const trimmedDuration = endTime - startTime;

    navigation.navigate("PublishShort", {
      videoUri: recordedVideo,
      duration: trimmedDuration?.toFixed(2),
      startTime: startTime,
      endTime: endTime,
    });
  };

  if (!isPermissionChecked)
    return (
      <View style={styles.container}>
        <ActivityIndicator color={COLORS.buttonColor} />
      </View>
    );

  if (recordedVideo) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <Video
          ref={videoRef}
          source={{ uri: recordedVideo }}
          style={styles.preview}
          resizeMode="cover"
          repeat
          onLoad={onLoad}
          onProgress={onProgress}
          paused={!isFocused}
          progressUpdateInterval={16}
        />

        <LinearGradient
          colors={["rgba(40, 202, 116, 0)", "rgba(18, 255, 170, 1)"]}
          style={styles.bottomGradientSuccess}
          pointerEvents="none"
        />

        {/* Progress bar at the top */}
        <View style={[styles.progressBarContainer, { top: insets.top }]}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarForeground,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* Video Timeline Trimmer */}
        <View style={styles.trimmerContainer}>
          {/* TIME LABELS */}

          {/* TRIMMER TRACK */}
          <View style={styles.trimmerWrapper}>
            <View style={styles.trimmerTrack}>
              {/* CLIP EVERYTHING EXCEPT HANDLES AND BORDER */}
              <View style={styles.thumbnailsContainer}>
                {/* THUMBNAIL STRIP */}
                {thumbnails.map((item, i) => (
                  <View key={i} style={[styles.thumb, { width: thumbWidth }]}>
                    <Image
                      source={{ uri: item }}
                      style={{ width: thumbWidth, height: 60 }}
                      resizeMode="cover"
                    />
                  </View>
                ))}

                {/* LEFT DIM OVERLAY */}
                <Animated.View
                  pointerEvents="none"
                  style={[styles.dimOverlay, { left: 0, width: leftHandle }]}
                />

                {/* RIGHT DIM OVERLAY */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.dimOverlay,
                    {
                      left: Animated.add(
                        rightHandle,
                        new Animated.Value(HANDLE_WIDTH),
                      ),
                      right: 0,
                      width: undefined,
                    },
                  ]}
                />

                <Video
                  source={{ uri: recordedVideo }}
                  style={styles.timelineVideo}
                  resizeMode="cover"
                  paused={true}
                />
              </View>

              {/* WHITE BORDER around selected area */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.selectedBorder,
                  {
                    left: leftHandle,
                    width: Animated.subtract(
                      Animated.add(
                        rightHandle,
                        new Animated.Value(HANDLE_WIDTH),
                      ),
                      leftHandle,
                    ),
                  },
                ]}
              />

              {/* LEFT HANDLE */}
              <Animated.View
                style={[styles.handle, styles.handleLeft, { left: leftHandle }]}
                {...leftPan.panHandlers}
              >
                <View style={[styles.handleBar, { marginRight: 1.5 }]} />
              </Animated.View>

              {/* RIGHT HANDLE */}
              <Animated.View
                style={[
                  styles.handle,
                  styles.handleRight,
                  { left: rightHandle },
                ]}
                {...rightPan.panHandlers}
              >
                <View style={[styles.handleBar, { marginLeft: 1.5 }]} />
              </Animated.View>
            </View>
          </View>

          <View style={styles.timeRow}>
            <CustomText
              label={formatTime(startTime)}
              color={COLORS.white}
              fontSize={12}
              fontFamily={fonts.medium}
            />
            <CustomText
              label={formatTime(endTime - startTime)}
              color={COLORS.white}
              fontSize={12}
              fontFamily={fonts.medium}
            />
            <CustomText
              label={formatTime(endTime)}
              color={COLORS.white}
              fontSize={12}
              fontFamily={fonts.medium}
            />
          </View>
        </View>

        <View style={[styles.previewControls, { bottom: insets.bottom + 10 }]}>
          <TouchableOpacity
            style={styles.previewButtonIcon}
            onPress={handleRetake}
            disabled={isUploading}
          >
            <View style={styles.previewButtonInner}>
              <ImageFast
                source={Images.retake}
                style={{ height: 24, width: 24, zIndex: 99 }}
              />
              <Blur borderRadius={24} />
            </View>
          </TouchableOpacity>

          <CustomButton
            title={"Continue"}
            backgroundColor={"white"}
            color={COLORS.black}
            isBoarder
            secondBorderColor={COLORS.white}
            onPress={handlePost}
            width="85%"
            marginLeft={8}
            loading={isUploading}
            disabled={isUploading}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      {device && (
        <ReanimatedCamera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          video={true}
          audio={true}
          orientation="portrait"
        />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent"]}
        style={styles.topGradient}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        style={styles.bottomGradient}
      />

      {/* Top Controls */}
      <View style={[styles.topControls, { top: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleClose}
          disabled={isRecording || isUploading}
        >
          <Blur />
          <Image source={Images.back} style={styles.navIcon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
          disabled={isRecording || isUploading}
        >
          <Blur />
          <Icons
            family="MaterialIcons"
            name={flash === "off" ? "flash-off" : "flash-on"}
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[
            styles.galleryBtn,
            {
              borderRadius: 24,
              overflow: "hidden",
            },
          ]}
          onPress={handleGalleryPicker}
          disabled={isRecording || isUploading}
        >
          <Blur />
          <Image source={Images.gallery} style={styles.navIcon} />
        </TouchableOpacity>

        <Reanimated.View style={[styles.buttonWrapper, outerRingStyle]}>
          <ProgressRing progress={progress} visible={isRecording} />

          <Pressable
            onPressIn={startRecording}
            onPressOut={stopRecording}
            delayLongPress={150}
            style={styles.pressable}
            disabled={isUploading}
          >
            <View style={styles.outerRing}>
              <Reanimated.View style={[styles.innerDot, innerDotStyle]} />
            </View>
          </Pressable>
        </Reanimated.View>

        <TouchableOpacity
          style={styles.galleryBtn}
          onPress={() =>
            setCameraPosition((p) => (p === "back" ? "front" : "back"))
          }
          disabled={isRecording || isUploading}
        >
          <Blur />
          <Image source={Images.CameraFlip} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CreateShort;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 120,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 150,
  },
  topControls: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  navIcon: {
    width: 22,
    height: 22,
    tintColor: "#FFF",
  },
  bottomControls: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-evenly",
    zIndex: 10,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  recordingButton: {
    borderColor: "#FF0000",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF",
  },
  recordingInner: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: "#FF0000",
  },
  galleryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  previewControls: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    width: "100%",
    zIndex: 20,
  },
  previewButtonIcon: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.white,
    borderRadius: 99,
    height: 52,
    width: 52,
    overflow: "hidden",
  },
  previewButtonInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 99,
    height: 44,
    width: 44,
    overflow: "hidden",
  },
  bottomGradientSuccess: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  // Video Timeline Trimmer Styles
  trimmerContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  trimmerWrapper: {
    paddingHorizontal: 16,
  },
  trimmerTrack: {
    height: 44,
    position: "relative",
  },
  thumbnailsContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#333",
    flexDirection: "row",
  },
  thumb: {
    height: 60,
    overflow: "hidden",
    backgroundColor: "#222",
  },
  dimOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 2,
  },
  selectedBorder: {
    position: "absolute",
    top: -4,
    bottom: -4,
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 8,
    zIndex: 3,
  },
  scrubber: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#fff",
    zIndex: 9,
    borderRadius: 1,
  },
  handle: {
    position: "absolute",
    top: -2,
    bottom: -2,
    width: HANDLE_WIDTH,
    backgroundColor: "#fff",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  handleLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  handleRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  handleBar: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.black,
    borderRadius: 2,
  },
  progressBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 8,
    zIndex: 20,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 99,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
  },
  progressBarForeground: {
    height: "100%",
    backgroundColor: COLORS.white,
  },
  captionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    // paddingHorizontal: 40,
  },
  captionInput: {
    color: "#FFF",
    fontSize: 24,
    fontFamily: fonts.medium,
    textAlign: "center",
    width: "100%",
  },
  captionText: {
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  editCaptionContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 99,
  },
  closeCaptionBtn: {
    position: "absolute",
    left: 20,
    zIndex: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineVideo: {
    height: 60,
    width: "100%",
  },
  buttonWrapper: {
    width: SVG_SIZE,
    height: SVG_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  pressable: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  innerDot: {
    width: BUTTON_SIZE - 18,
    height: BUTTON_SIZE - 18,
    backgroundColor: "#fff",
    borderRadius: (BUTTON_SIZE - 18) / 2,
  },
});
