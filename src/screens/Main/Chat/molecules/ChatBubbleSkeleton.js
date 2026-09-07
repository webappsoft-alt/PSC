import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const ChatBubbleSkeleton = ({ isSender }) => {
  const { colors, isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonBox = ({ width, height, borderRadius = 8, style }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View
      style={[styles.mainContainer, isSender ? styles.sender : styles.receiver]}
    >
      <SkeletonBox width={isSender ? 150 : 200} height={50} borderRadius={12} />

      <View style={styles.row}>
        {isSender ? (
          <>
            <SkeletonBox width={40} height={10} borderRadius={2} />
            <SkeletonBox width={15} height={15} borderRadius={7.5} />
          </>
        ) : (
          <>
            <SkeletonBox width={60} height={25} borderRadius={100} />
            <SkeletonBox width={60} height={25} borderRadius={100} />
            <SkeletonBox width={60} height={25} borderRadius={100} />
          </>
        )}
      </View>
    </View>
  );
};

export default ChatBubbleSkeleton;

const styles = StyleSheet.create({
  mainContainer: {
    marginBottom: 10,
    width: "100%",
    paddingHorizontal: 10,
  },
  sender: {
    alignItems: "flex-end",
  },
  receiver: {
    alignItems: "flex-start",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 5,
    marginTop: 7,
  },
});
