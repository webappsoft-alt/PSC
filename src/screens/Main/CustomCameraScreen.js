import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Reanimated from "react-native-reanimated";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import fonts from "../../assets/fonts";
import { Images } from "../../assets/images";
import Blur from "../../components/Blur";
import CustomButton from "../../components/CustomButton";
import CustomText from "../../components/CustomText";
import Icons from "../../components/Icons";
import ImageFast from "../../components/ImageFast";
import { COLORS } from "../../utils/COLORS";
import { ToastMessage } from "../../utils/ToastMessage";
import { useIsForeground } from "../../utils/UseIsForground";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps();

const CustomCameraScreen = ({ route }) => {
  const { onCapture } = route.params || {};
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const isForeground = useIsForeground();
  const cameraRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [cameraPosition, setCameraPosition] = useState("back");
  const [flash, setFlash] = useState("off");
  const [hasPermission, setHasPermission] = useState(null);
  const [isPermissionChecked, setIsPermissionChecked] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const device = useCameraDevice(cameraPosition);
  const isActive = isFocused && isForeground && !capturedPhoto;

  // Request camera permission
  const requestPermission = useCallback(async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermission();
      const isGranted = cameraPermission === "granted";
      setHasPermission(isGranted);
      setIsPermissionChecked(true);
    } catch (error) {
      console.log("Permission check error:", error);
      setHasPermission(false);
      setIsPermissionChecked(true);
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

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
            "error"
          );
        }
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      ToastMessage(
        "An unexpected error occurred while opening settings.",
        "error"
      );
    }
  };

  // Capture photo
  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

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
  };

  // Close camera screen
  const handleClose = () => {
    navigation.goBack();
  };

  // Confirm and return photo
  const handleDone = () => {
    if (capturedPhoto && onCapture) {
      const result = {
        path: capturedPhoto,
        mime: "image/jpeg",
        filename: capturedPhoto.split("/").pop(),
      };
      onCapture(result);
    }
    navigation.goBack();
  };

  // Handle camera error
  const onError = useCallback((error) => {
    console.log("camera error==>", error);
  }, []);

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
        <View style={[styles.topControls, { top: insets.top + 10 }]}>
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
              color={COLORS.white}
            />
          </View>
        </View>
        <View style={styles.permissionContainer}>
          <Icons
            family={"Ionicons"}
            name="camera-outline"
            size={80}
            color={COLORS.subtitle}
          />
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

  // Photo preview state
  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ImageFast source={{ uri: capturedPhoto }} style={styles.preview} />

        <LinearGradient
          colors={["rgba(40, 202, 116, 0)", "rgba(18, 255, 170, 1)"]}
          style={styles.bottomGradientSuccess}
          pointerEvents="none"
        />

        <View style={[styles.previewControls, { bottom: insets.bottom + 20 }]}>
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
            title={"Publish"}
            backgroundColor={"white"}
            color={COLORS.black}
            isBoarder
            secondBorderColor={COLORS.white}
            onPress={handleDone}
            width="80%"
            marginLeft={8}
          />
        </View>
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
        enableZoomGesture
        orientation="portrait"
        onError={onError}
        lowLightBoost={device.supportsLowLightBoost}
      />

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
      <View style={[styles.topControls, { top: insets.top + 10 }]}>
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
            color={COLORS.white}
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
      <View style={[styles.bottomControls, { bottom: insets.bottom + 40 }]}>
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

          <TouchableOpacity
            style={[
              styles.captureButton,
              isCapturing && styles.capturingButton,
            ]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

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
    </View>
  );
};

export default CustomCameraScreen;

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
  topControls: {
    position: "absolute",
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
  bottomGradientSuccess: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
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
});
