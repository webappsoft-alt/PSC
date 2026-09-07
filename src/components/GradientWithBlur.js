import { BlurView } from "@react-native-community/blur";
import { StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

const GradientWithBlur = ({ children }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          "rgba(206, 202, 202, 0.4)",
          // "rgb(206, 202, 202,0.9)",
          "rgba(206, 202, 202, 0.05)",
        ]}
        locations={[0, 1]}
        style={{ flex: 1 }}
      >
        <BlurView
          style={{ flex: 1 }}
          blurType="light"
          blurAmount={2}
          reducedTransparencyFallbackColor="white"
        >
          {children}
        </BlurView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 130,
  },
});

export default GradientWithBlur;
