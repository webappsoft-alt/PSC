import { BlurView } from "@react-native-community/blur"; // or expo-blur
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import Video from "react-native-video";

const AmbientVideoScreen = () => {
  const videoSource = {
    uri: "https://storage.googleapis.com/move-2223b.firebasestorage.app/uploads/1764831380039.mp4",
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Background "ambient" layer */}
        <View style={styles.ambientWrapper}>
          <Video
            source={videoSource}
            style={styles.ambientVideo}
            muted
            repeat
            resizeMode="cover"
          />
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={25}
          />
        </View>

        {/* Foreground actual player */}
        <View style={styles.playerWrapper}>
          <Video
            source={videoSource}
            style={styles.playerVideo}
            controls
            resizeMode="contain"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AmbientVideoScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  ambientWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  ambientVideo: {
    width: "120%", // slightly zoomed to avoid edges
    height: "120%",
  },
  playerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  playerVideo: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
});
