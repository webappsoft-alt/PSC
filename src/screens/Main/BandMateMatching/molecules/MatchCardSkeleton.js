import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions, Platform } from "react-native";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MatchCardSkeleton = () => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
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

  const SkeletonBox = ({
    width,
    height,
    borderRadius = 8,
    style,
    backgroundColor = colors.surfaceAlt,
  }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Card Skeleton */}
      <View style={styles.cardWrapper}>
        <View style={styles.imagePlaceholder}>
          <View style={styles.innerContainer}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.row}>
                <SkeletonBox width={22} height={22} borderRadius={11} />
                <SkeletonBox
                  width={120}
                  height={14}
                  borderRadius={4}
                  style={{ marginLeft: 8 }}
                />
              </View>
              <SkeletonBox width={32} height={32} borderRadius={16} />
            </View>

            {/* Footer */}
            <View>
              {/* Name and Age */}
              <SkeletonBox
                width={180}
                height={44}
                borderRadius={8}
                style={{ marginBottom: 10 }}
              />

              {/* Location Row */}
              <View style={styles.locationRow}>
                <SkeletonBox width={12} height={12} borderRadius={6} />
                <SkeletonBox
                  width={60}
                  height={12}
                  borderRadius={4}
                  style={{ marginLeft: 4 }}
                />
                <SkeletonBox
                  width={40}
                  height={12}
                  borderRadius={4}
                  style={{ marginLeft: 4 }}
                />
              </View>

              {/* Monthly Views */}
              <SkeletonBox
                width={140}
                height={11}
                borderRadius={4}
                style={{ marginTop: 8 }}
              />

              {/* Genre/Interest pills */}
              <View style={styles.genreRow}>
                <SkeletonBox width={80} height={24} borderRadius={99} />
                <SkeletonBox width={80} height={24} borderRadius={99} />
                <SkeletonBox width={80} height={24} borderRadius={99} />
              </View>

              {/* Description box */}
              <View style={styles.footerRow}>
                <SkeletonBox width="85%" height={32} borderRadius={4} />
                <SkeletonBox width={28} height={28} borderRadius={14} />
              </View>

              {/* Slider bars */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                  <SkeletonBox width="30%" height={6} borderRadius={3} />
                  <SkeletonBox width="30%" height={6} borderRadius={3} />
                  <SkeletonBox width="30%" height={6} borderRadius={3} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <SkeletonBox width={48} height={48} borderRadius={24} />
        <SkeletonBox width={56} height={56} borderRadius={28} />
        <SkeletonBox width={56} height={56} borderRadius={28} />
        <SkeletonBox width={56} height={56} borderRadius={28} />
        <SkeletonBox width={48} height={48} borderRadius={24} />
      </View>
    </View>
  );
};

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    marginTop: 16,
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 6,
  },
  cardWrapper: {
    width: "100%",
    padding: 4,
    backgroundColor: "#ffffff03",
    borderColor: colors.border,
    borderRadius: 34,
    borderWidth: 1,
  },
  imagePlaceholder: {
    height: Platform.OS == "ios" ? screenHeight * 0.56 : screenHeight * 0.55,
    width: "100%",
    borderRadius: 32,
    backgroundColor: colors.surfaceAlt,
    padding: 14,
  },
  innerContainer: {
    justifyContent: "space-between",
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  genreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  sliderContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  sliderTrack: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 100,
    overflow: "hidden",
    gap: 8,
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
    padding: 6,
    gap: 16,
  },
});

export default MatchCardSkeleton;
