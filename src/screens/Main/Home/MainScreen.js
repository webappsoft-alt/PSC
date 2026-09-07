// src/screens/MainScreen.js
import React from "react";
import {StyleSheet,
  View,
  Dimensions,
  StatusBar,
  TouchableOpacity} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Text from "../../../components/ScaledText";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MainScreen = () => {
  const navigation = useNavigation();

  const handleCameraPress = () => {
    // This will switch the Tab to CameraS
    navigation.navigate("CameraS");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleCameraPress}
        >
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Instagram</Text>
        <View style={{ width: 44 }} /> {/* Spacer for center alignment */}
      </View>

      <View style={styles.content}>
        <Text style={styles.welcome}>Welcome to the App! 📱</Text>
        <Text style={styles.instruction}>
          Swipe RIGHT from anywhere to open camera
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.feature}>✨ Smooth transitions</Text>
          <Text style={styles.feature}>📸 Instagram-like swipe</Text>
        </View>
      </View>

      {/* Swipe Indicator: Left side because you pull from Left to Right */}
      <View style={styles.swipeIndicatorContainer}>
        <View style={styles.swipeIndicator} />
        <Text style={styles.swipeText}>Swipe Right</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#333" },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: { fontSize: 20 },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  welcome: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  instruction: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  featureList: {
    width: "100%",
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
  },
  feature: { fontSize: 16, color: "#444", marginVertical: 8 },
  swipeIndicatorContainer: {
    position: "absolute",
    left: 20, // Indicator moved to Left side
    top: SCREEN_HEIGHT / 2,
    alignItems: "center",
  },
  swipeIndicator: {
    width: 4,
    height: 40,
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  swipeText: {
    marginTop: 10,
    fontSize: 12,
    color: "#007AFF",
    transform: [{ rotate: "-90deg" }],
  },
});

export default MainScreen;
