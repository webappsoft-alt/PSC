import { createContext, useContext, useEffect, useRef } from "react";
import { Animated } from "react-native";

import { useTheme } from "../contexts/ThemeContext";

/**
 * App skeleton bones — same pulse as the existing skeletons
 * (ConversationBoxSkeleton, PostCardSkeleton): colors.surfaceAlt, opacity
 * 0.3 ↔ 0.7 over 1 s each way. Bones inside one <SkeletonGroup> share a
 * single animation so a whole screen pulses in step.
 */
const PulseContext = createContext(null);

export const SkeletonGroup = ({ children }) => {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <PulseContext.Provider value={opacity}>{children}</PulseContext.Provider>;
};

export const Bone = ({ width, height, radius = 4, style }) => {
  const { colors } = useTheme();
  const opacity = useContext(PulseContext) ?? 0.5;
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceAlt, opacity }, style]}
    />
  );
};
