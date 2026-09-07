// import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { createThumbnail } from "react-native-create-thumbnail";
import RNFS from "react-native-fs";
import Reanimated from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import Icon from "react-native-vector-icons/Ionicons";
import Video from "react-native-video";
import { Camera, useCameraDevice } from "react-native-vision-camera";

import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import Blur from "../../../components/Blur";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import { post } from "../../../services/ApiRequest";
import { setStoryUploadStatus } from "../../../store/reducer/appSlice";
import { COLORS } from "../../../utils/COLORS";
import { uploadAndGetUrl, uploadFileGetUrl } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useIsForeground } from "../../../utils/UseIsForground";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TRIMMER_WIDTH = SCREEN_WIDTH - 32;
const HANDLE_WIDTH = 10;
const THUMB_COUNT = 10;

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps();

// Animated Recording Border Component - Progress Indicator
const AnimatedRecordingBorder = ({ size = 68, isRecording }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (isRecording) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 30000, // 30 seconds
        useNativeDriver: false, // strokeDashoffset doesn't support native driver
      }).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [isRecording, progressAnim]);

  if (!isRecording) return null;

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
      }}
      pointerEvents="none"
    >
      <Svg width={size} height={size}>
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.red1}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [circumference, 0],
          })}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
};

const CameraScreen = ({ isCameraActive = true }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const isForeground = useIsForeground();
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [cameraPosition, setCameraPosition] = useState("back");
  const [flash, setFlash] = useState("off");
  const [hasPermission, setHasPermission] = useState(null);
  const [isPermissionChecked, setIsPermissionChecked] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [flashOverlay, showFlashOverlay] = useState(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [uploadedMediaUri, setUploadedMediaUri] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const recordingTimerRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  const device = useCameraDevice(cameraPosition);
  const isActive =
    isFocused &&
    isForeground &&
    !capturedPhoto &&
    !recordedVideo &&
    isCameraActive;

  // Request camera permission
  const requestPermission = useCallback(async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();
      const isGranted =
        cameraPermission === "granted" && microphonePermission === "granted";
      setHasPermission(isGranted);
      setIsPermissionChecked(true);
    } catch (error) {
      console.log("Permission check error:", error);
      setHasPermission(false);
      setIsPermissionChecked(true);
    }
  }, []);

  // Open device settings
  const openSettings = async () => {
    try {
      if (Platform.OS === "ios") {
        const settingsUrl = "app-settings:";
        const canOpen = await Linking.canOpenURL(settingsUrl);
        if (canOpen) {
          await Linking.openURL(settingsUrl);
        } else {
          ToastMessage(
            "Unable to open settings. Please open them manually.",
            "error",
          );
        }
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      ToastMessage(
        "An unexpected error occurred while opening settings.",
        "error",
      );
    }
  };

  // Capture photo
  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing || isRecording) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePhoto({
        flash: flash,
        enableShutterSound: true,
        qualityPrioritization: "quality",
      });

      const photoPath = photo.path.startsWith("file://")
        ? photo.path
        : `file://${photo.path}`;
      setCapturedPhoto(photoPath);
    } catch (error) {
      console.error("Error capturing photo:", error);
      ToastMessage("Failed to capture photo", "error");
    } finally {
      setIsCapturing(false);
    }
  };

  // Start video recording
  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);

      // Set 30-second timer to auto-stop recording
      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 30000); // 30 seconds

      await cameraRef.current.startRecording({
        flash: flash,
        onRecordingFinished: (video) => {
          console.log("Video recorded:", video);
          const videoPath = video.path.startsWith("file://")
            ? video.path
            : `file://${video.path}`;
          setRecordedVideo(videoPath.replace("file://file://", "file://"));
          const duration = video?.duration || 30;
          setVideoDuration(duration.toFixed(2));
          // setMaxDuration(duration);
          setIsRecording(false);
          progressAnim.setValue(0);

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

  // Stop video recording
  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error("Error stopping recording:", error);
      ToastMessage("Failed to stop recording", "error");
      setIsRecording(false);
    }
  };

  // Toggle camera position
  const toggleCameraPosition = () => {
    setCameraPosition((prev) => (prev === "back" ? "front" : "back"));
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlash((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
  };

  // Toggle grid
  const toggleGrid = () => {
    setShowGrid((prev) => !prev);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    setRecordedVideo(null);
    setUploadedMediaUri(null);
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

  // Close camera screen
  const handleClose = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "TabStack", params: { screen: "Home" } }],
    });
  };

  // Request permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Upload captured image or video to server and create story
  const handleStoryUpload = useCallback(
    async ({ uri, type, duration }) => {
      if (!uri || !type) return;
      if (isMounted.current) setIsUploadingStory(true);
      setUploadedMediaUri(null);

      try {
        let uploadedUrl = null;

        if (type === "image") {
          uploadedUrl = await uploadAndGetUrl({ path: uri });
        } else {
          const uploadRes = await uploadFileGetUrl(
            { localUri: uri, name: "story-video.mp4" },
            "video/mp4",
          );
          uploadedUrl =
            uploadRes?.file ||
            uploadRes?.url ||
            uploadRes?.image ||
            (typeof uploadRes === "string" ? uploadRes : null);
        }

        if (!uploadedUrl) {
          throw new Error("No upload url returned");
        }

        setUploadedMediaUri(uploadedUrl);

        const payload = {
          media: {
            url: uploadedUrl,
            type,
            ...(type === "video" && duration ? { duration } : {}),
          },
        };

        const res = await post("stories", payload);
        if (res.data?.success) {
          dispatch(setStoryUploadStatus("success"));
          ToastMessage("Story uploaded", "success");
          // Reset to idle after 5 seconds to clear the success UI
          setTimeout(() => {
            dispatch(setStoryUploadStatus("idle"));
          }, 5000);
        }
      } catch (error) {
        console.log("Story upload failed:", error);
        dispatch(setStoryUploadStatus("error"));
        ToastMessage("Failed to upload story", "error");
      } finally {
        if (isMounted.current) setIsUploadingStory(false);
      }
    },
    [dispatch],
  );

  // Trigger upload manually when user click done
  const handleDone = async () => {
    dispatch(setStoryUploadStatus("uploading"));
    handleClose();

    if (capturedPhoto) {
      handleStoryUpload({ uri: capturedPhoto, type: "image" });
    } else if (recordedVideo) {
      const trimmedDuration = endTime - startTime;
      handleStoryUpload({
        uri: recordedVideo,
        type: "video",
        duration: trimmedDuration.toFixed(2),
      });
    }
  };

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
      onStartShouldSetPanResponderCapture: () => true,
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

  // Handle camera error
  const onError = useCallback((error) => {
    console.log("camera error==>", error);
  }, []);

  // Handle video progress
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

  // Handle video load
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

  // Format time display
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m}:${s.toFixed(1).padStart(4, "0")}`;
    return `${secs.toFixed(1)}s`;
  };

  const thumbWidth = TRIMMER_WIDTH / THUMB_COUNT;

  if (!isPermissionChecked) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ActivityIndicator size="large" color={COLORS.buttonColor} />
        <CustomText
          label="Loading camera..."
          color={COLORS.white}
          fontSize={16}
          marginTop={16}
        />
      </View>
    );
  }

  // Permission denied state
  if (!hasPermission || device == null) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={[styles.row, { gap: 12 }]}>
          <TouchableOpacity
            style={[styles.controlButton, { overflow: "hidden" }]}
            onPress={handleClose}
          >
            <Blur />
            <Image source={Images.back} style={{ height: 20, width: 20 }} />
          </TouchableOpacity>
          <CustomText
            label={"Back"}
            fontFamily={fonts.semiBold}
            fontSize={20}
          />
        </View>
        <View style={styles.permissionContainer}>
          <Icon name="camera-outline" size={80} color={COLORS.subtitle} />
          <CustomText
            label="Camera Permission Required"
            color={COLORS.white}
            fontSize={20}
            fontWeight="600"
            marginTop={24}
            textAlign="center"
          />
          <CustomText
            label="Please grant camera permission to use this feature"
            color={COLORS.subtitle}
            fontSize={14}
            marginTop={8}
            textAlign="center"
            paddingHorizontal={40}
          />
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={openSettings}
          >
            <CustomText
              label="Open Settings"
              color={COLORS.white}
              fontSize={16}
              fontWeight="600"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Video preview state with trimmer
  if (recordedVideo) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Video
          ref={videoRef}
          source={{ uri: uploadedMediaUri || recordedVideo }}
          style={styles.preview}
          resizeMode="cover"
          repeat={true}
          controls={false}
          onProgress={onProgress}
          onLoad={onLoad}
          paused={false}
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

        <View style={[styles.previewControls, { bottom: insets.bottom }]}>
          <TouchableOpacity style={styles.previewButton} onPress={handleRetake}>
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
            onPress={handleDone}
            width="85%"
            marginLeft={8}
          />
        </View>

        {isUploadingStory && (
          <View style={styles.uploadOverlay}>
            <View style={styles.uploadCard}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <CustomText
                label="Uploading your story..."
                color={COLORS.white}
                fontSize={14}
                marginTop={8}
              />
            </View>
          </View>
        )}
      </View>
    );
  }

  // Photo preview state
  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ImageFast
          source={{ uri: uploadedMediaUri || capturedPhoto }}
          style={styles.preview}
        />

        <LinearGradient
          colors={["rgba(40, 202, 116, 0)", "rgba(18, 255, 170, 1)"]}
          style={styles.bottomGradientSuccess}
          pointerEvents="none"
        />

        <View style={[styles.previewControls, { bottom: insets.bottom }]}>
          <TouchableOpacity style={styles.previewButton} onPress={handleRetake}>
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
            onPress={handleDone}
            width="85%"
            marginLeft={8}
          />
        </View>

        {isUploadingStory && (
          <View style={styles.uploadOverlay}>
            <View style={styles.uploadCard}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <CustomText
                label="Uploading your story..."
                color={COLORS.white}
                fontSize={14}
                marginTop={8}
              />
            </View>
          </View>
        )}
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <ReanimatedCamera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        photo={true}
        video={true}
        audio={true}
        enableZoomGesture
        orientation="portrait"
        onError={onError}
        lowLightBoost={device.supportsLowLightBoost}
      />

      {/* Flash overlay when front camera & flash not off */}
      {cameraPosition === "front" && flash !== "off" && (
        <View style={styles.flashOverlay} pointerEvents="none" />
      )}

      {/* Grid Overlay */}
      {showGrid && (
        <View style={styles.gridOverlay} pointerEvents="none">
          <View style={styles.gridRow}>
            <View style={styles.gridCell} />
            <View style={[styles.gridCell, styles.gridBorderLeft]} />
            <View style={[styles.gridCell, styles.gridBorderLeft]} />
          </View>
          <View style={[styles.gridRow, styles.gridBorderTop]}>
            <View style={styles.gridCell} />
            <View style={[styles.gridCell, styles.gridBorderLeft]} />
            <View style={[styles.gridCell, styles.gridBorderLeft]} />
          </View>
          <View style={[styles.gridRow, styles.gridBorderTop]}>
            <View style={styles.gridCell} />
            <View style={[styles.gridCell, styles.gridBorderLeft]} />
            <View style={[styles.gridCell, styles.gridBorderLeft]} />
          </View>
        </View>
      )}

      <LinearGradient
        colors={["rgba(18, 18, 18, 1)", "rgba(18, 18, 18, 0)"]}
        style={styles.topGradient}
        pointerEvents="none"
      />

      <LinearGradient
        colors={["rgba(18, 18, 18, 0)", "rgba(18, 18, 18, 1)"]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Top controls */}
      <View style={styles.topControls}>
        <View style={[styles.row, { gap: 12 }]}>
          <TouchableOpacity
            style={[styles.controlButton, { overflow: "hidden" }]}
            onPress={handleClose}
          >
            <Blur />
            <Image source={Images.back} style={{ height: 20, width: 20 }} />
          </TouchableOpacity>
          <CustomText
            label={"Back"}
            fontFamily={fonts.semiBold}
            fontSize={20}
          />
        </View>

        <TouchableOpacity
          style={[styles.controlButton, { overflow: "hidden" }]}
          onPress={toggleFlash}
        >
          <Blur blurType="light" />

          <Icons
            family={"MaterialIcons"}
            name={
              flash === "off"
                ? "flash-off"
                : flash === "on"
                ? "flash-on"
                : "flash-auto"
            }
            size={20}
            color={COLORS.white}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <View style={styles.captureContainer}>
          <TouchableOpacity
            style={[styles.flipButton, { overflow: "hidden" }]}
            onPress={toggleCameraPosition}
          >
            <Blur />
            <Image
              source={Images.CameraFlip}
              style={{ height: 24, width: 24, tintColor: "white" }}
            />
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.lockContainer,
                {
                  overflow: "hidden",
                },
              ]}
              onPress={handleCapture}
              disabled={isCapturing || isRecording}
            >
              <Blur />
              <Image
                source={Images.cameraLock}
                style={{ height: 16, width: 16, tintColor: "white" }}
              />
            </TouchableOpacity>
            <View style={{ position: "relative" }}>
              <AnimatedRecordingBorder size={64} isRecording={isRecording} />
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  (isCapturing || isRecording) && styles.capturingButton,
                  isRecording && { borderWidth: 0 },
                ]}
                onPress={handleCapture}
                onLongPress={startRecording}
                onPressOut={stopRecording}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <View
                    style={[
                      styles.captureButtonInner,
                      isRecording && styles.recordingButtonInner,
                    ]}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.flipButton, { overflow: "hidden" }]}
            onPress={toggleGrid}
          >
            <Blur />
            <Image
              source={Images.grid}
              style={{
                height: 24,
                width: 24,
                tintColor: showGrid ? COLORS.buttonColor : "white",
              }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isUploadingStory && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadCard}>
            <ActivityIndicator size="small" color={COLORS.white} />
            <CustomText
              label="Uploading your story..."
              color={COLORS.white}
              fontSize={14}
              marginTop={8}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default CameraScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  settingsButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: COLORS.buttonColor,
    borderRadius: 12,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 22,
  },
  topControls: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 22,
  },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  captureContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  capturingButton: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 99,
    backgroundColor: COLORS.white,
  },
  recordingButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#FF0000",
  },
  flipButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  previewControls: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    width: "100%",
  },
  previewButton: {
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lockContainer: {
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
    position: "absolute",
    zIndex: 999,
    right: 70,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 1,
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
  },
  gridCell: {
    flex: 1,
  },
  gridBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.3)",
  },
  gridBorderTop: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
  },
  flashOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  uploadCard: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
  },
  bottomGradientSuccess: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
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
  timelineVideo: {
    height: 60,
    width: "100%",
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
});
