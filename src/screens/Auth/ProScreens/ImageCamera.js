import { useIsFocused } from "@react-navigation/native";
import { Image } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

import { Images } from "../../../assets/images";
import CustomText from "../../../components/CustomText";

import CameraErrorMessage from "../../../components/CamerErrorMessage";
import CaptureButton from "../../../components/CaptureButton";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useIsForeground } from "../../../utils/UseIsForground";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "@react-native-community/blur";
import MaskedView from "@react-native-masked-view/masked-view";
import ImageFast from "../../../components/ImageFast";

const { width, height } = Dimensions.get("window");

// ID Card frame dimensions
const CARD_ASPECT_RATIO = 1.586; // Standard ID card ratio
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

const ImageCamera = ({ onCapture, onClose }) => {
  const theme = COLORS.dark;

  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const isForeground = useIsForeground();

  const cameraRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const { hasPermission, requestPermission: reqPerm } = useCameraPermission();
  const [isPermissionChecked, setIsPermissionChecked] = useState(hasPermission);
  const device = useCameraDevice("back");

  const isActive = isFocused && isForeground;

  // Request camera permission
  const requestPermission = useCallback(async () => {
    try {
      if (!hasPermission) {
        await reqPerm();
      }
      setIsPermissionChecked(true);
    } catch (error) {
      console.log("Permission check error:", error);
      setIsPermissionChecked(true);
    }
  }, [hasPermission, reqPerm]);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: "balanced",
      });

      if (photo?.path) {
        const uri = photo.path.startsWith("file://")
          ? photo.path
          : `file://${photo.path}`;
        onCapture(uri);
      }
    } catch (error) {
      console.log("Camera capture error:", error);
      ToastMessage("Failed to capture photo", "error");
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    setCameraReady(false);
  }, [isActive]);

  const onError = useCallback((error) => {
    console.log("camera error==>", error);
  }, []);

  if (!isPermissionChecked && !hasPermission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <CustomText
          label="Loading camera..."
          color={theme?.text || COLORS.white}
          fontSize={16}
          marginTop={16}
        />
      </View>
    );
  }

  if (!hasPermission) {
    return <CameraErrorMessage />;
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <CustomText
          label="No camera available..."
          color={COLORS.white}
          fontSize={16}
          marginTop={16}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {isActive && (
        <>
          <Camera
            ref={cameraRef}
            device={device}
            isActive={isActive}
            style={StyleSheet.absoluteFill}
            photo={true}
            onError={onError}
            onInitialized={() => setCameraReady(true)}
          />

          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <View style={StyleSheet.absoluteFill}>
                <View style={styles.maskCenter} />
              </View>
            }
          >
            <BlurView
              intensity={100}
              style={StyleSheet.absoluteFill}
              tint="dark"
            />
          </MaskedView>

          {/* ID Card Frame - unblurred area */}
          <View style={styles.cardFrame}>
            <View style={styles.cardBorder} />
          </View>

          {/* Top Controls */}
          <View style={[styles.topControls, { paddingTop: insets.top + 10 }]}>
            <View style={styles.row}>
              <TouchableOpacity style={styles.controlButton} onPress={onClose}>
                <BlurView
                  blurType="dark"
                  blurAmount={5}
                  style={StyleSheet.absoluteFill}
                />
                <ImageFast
                  source={Images.back}
                  style={{ height: 20, width: 20 }}
                />
              </TouchableOpacity>
              <CustomText
                label={"Back"}
                fontFamily={"Poppins_600SemiBold"}
                fontSize={20}
                color={COLORS.white}
              />
            </View>
          </View>

          {/* Bottom Controls */}
          <CaptureButton
            onPress={handleCapture}
            title="Place the recto of your ID card in the frame"
            subTitle="Hold up your ID and take a picture. Your entire ID must be in the frame."
          />
        </>
      )}
    </View>
  );
};

export default ImageCamera;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },

  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  // Blur overlays
  topBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: (height - CARD_HEIGHT) / 2,
    zIndex: 2,
  },
  bottomBlur: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: (height - CARD_HEIGHT) / 2,
    zIndex: 2,
  },
  leftBlur: {
    position: "absolute",
    top: (height - CARD_HEIGHT) / 2,
    left: 0,
    width: (width - CARD_WIDTH) / 2,
    height: CARD_HEIGHT,
    zIndex: 2,
  },
  rightBlur: {
    position: "absolute",
    top: (height - CARD_HEIGHT) / 2,
    right: 0,
    width: (width - CARD_WIDTH) / 2,
    height: CARD_HEIGHT,
    zIndex: 2,
  },
  // Card frame (unblurred area)
  cardFrame: {
    position: "absolute",
    top: (height - CARD_HEIGHT) / 2,
    left: (width - CARD_WIDTH) / 2,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: 3,
  },
  cardBorder: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  maskCenter: {
    position: "absolute",
    width: CARD_WIDTH + 2000,
    height: CARD_HEIGHT + 2000,
    borderWidth: 1000,
    borderColor: "black",
    borderRadius: 1012, // 1000 + 16 (inner radius)
    backgroundColor: "transparent",
    left: (width - (CARD_WIDTH + 2000)) / 2,
    top: (height - (CARD_HEIGHT + 2000)) / 2,
  },
  // Card frame (unblurred area)
  cardFrame: {
    position: "absolute",
    top: (height - CARD_HEIGHT) / 2,
    left: (width - CARD_WIDTH) / 2,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: 3,
  },
  cardBorder: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
});
