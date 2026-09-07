import React from "react";
import {View, StyleSheet} from "react-native";
import { BlurView } from "@react-native-community/blur";
import Text from "./ScaledText";

const ProgressiveBlurBox = ({ children, width = 200, height = 52, borderRadius = 99 }) => {
  return (
    <BlurView
      style={[
        styles.blurWrapper,
        { width, height, borderRadius },
      ]}
      blurType="light" // match design (or "dark")
      blurAmount={16} // match the Figma end value
      reducedTransparencyFallbackColor="rgba(255,255,255,0.16)"
    >
      <View style={[styles.overlay, { borderRadius }]}>
        {children}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  blurWrapper: {
    overflow: "hidden",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.16)", // white with 16% opacity
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProgressiveBlurBox;
