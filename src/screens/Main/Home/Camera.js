// src/screens/CameraScreen.js
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {Alert,
  AppState,
  Dimensions,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View} from "react-native";
import Text from "../../../components/ScaledText";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CameraS = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const appState = useRef(AppState.currentState);
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [flash, setFlash] = useState("off");
  const [cameraPosition, setCameraPosition] = useState("back");

  const device = useCameraDevice(cameraPosition);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      appState.current = nextAppState;
      setIsActive(isFocused && nextAppState === "active" && hasPermission);
    });

    return () => {
      subscription.remove();
    };
  }, [isFocused, hasPermission]);

  useEffect(() => {
    // Only activate camera when this specific tab is focused
    setIsActive(appState.current === "active" && hasPermission);
  }, [isFocused, hasPermission]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const takePhoto = async () => {
    if (camera.current && isActive) {
      try {
        const photo = await camera.current.takePhoto({
          flash: flash,
        });
        Alert.alert("Photo captured!", `Saved to: ${photo.path}`);
      } catch (error) {
        console.error("Error taking photo:", error);
        Alert.alert("Error", "Failed to capture photo");
      }
    }
  };

  const toggleFlash = () => {
    setFlash((current) => {
      switch (current) {
        case "off":
          return "on";
        case "on":
          return "auto";
        default:
          return "off";
      }
    });
  };

  const toggleCamera = () => {
    setCameraPosition((current) => (current === "back" ? "front" : "back"));
  };

  if (!hasPermission) return <View style={styles.container} />;
  if (device == null) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        photo={true}
      />

      <View style={styles.overlay}>
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.navigate("MainScreen")}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlash}
            >
              <Text style={styles.controlIcon}>
                {flash === "off" ? "⚡" : flash === "on" ? "⚡" : "✨"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCamera}
            >
              <Text style={styles.controlIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Swipe Indicator Updated: Swipe Left to go back to Main */}
      <View style={styles.swipeIndicatorContainer}>
        <View style={styles.swipeIndicator} />
        <Text style={styles.swipeText}>Swipe left</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 40,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: { color: "white", fontSize: 24, fontWeight: "bold" },
  controlRow: { flexDirection: "row", gap: 20 },
  controlButton: { alignItems: "center" },
  controlIcon: { fontSize: 24, color: "white" },
  bottomControls: { alignItems: "center" },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "white",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "white",
  },
  swipeIndicatorContainer: {
    position: "absolute",
    right: 20, // Indicator moved to Right side
    top: SCREEN_HEIGHT / 2,
    alignItems: "center",
  },
  swipeIndicator: {
    width: 4,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 2,
  },
  swipeText: {
    marginTop: 10,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    transform: [{ rotate: "90deg" }], // Text rotated for vertical reading
  },
});

export default CameraS;
