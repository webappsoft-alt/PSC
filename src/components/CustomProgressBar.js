import { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import CustomText from "./CustomText";

const { width } = Dimensions.get("window");

const CustomProgressBar = ({
  duration = 10000, // 10 seconds
  leftLabel = "5 MIN MARGIN",
  centerLabel = "ON-TIME",
  rightLabel = "5 MIN MARGIN",
  progressColor = "#37B874",
  backgroundColor = "#E5E5E5",
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const progressBarWidth = width - 65;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();
  }, []);

  const carPosition = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, progressBarWidth], // 40 is car width
  });
  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, progressBarWidth],
  });

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.circle, { backgroundColor: progressColor }]} />
        <View style={[styles.progressTrack, { backgroundColor }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: progressColor,
                width: progressWidth,
                height: 12,
              },
            ]}
          />
          <Animated.View style={[styles.car, { left: carPosition }]}>
            <Image
              source={Images.CarProgress}
              style={styles.carImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <View style={[styles.circle2, { backgroundColor: "#121212A3" }]} />
      </View>
      <View style={styles.labelsContainer}>
        <CustomText
          label={leftLabel}
          color={"#121212A3"}
          fontFamily={fonts.medium}
          fontSize={12}
          lineHeight={12 * 1.4}
          textAlign="left"
        />
        <CustomText
          label={centerLabel}
          color={"#37B874"}
          fontFamily={fonts.semiBold}
          fontSize={12}
          lineHeight={12 * 1.4}
          textAlign="center"
        />
        <CustomText
          label={rightLabel}
          color={"#121212A3"}
          fontFamily={fonts.medium}
          lineHeight={12 * 1.4}
          fontSize={12}
          textAlign="right"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 100,
    zIndex: 2,
    borderWidth: 2,
    borderColor: "#fff",
    position: "absolute",
    top: 7,
    left: 20,
    zIndex: 2,
  },
  circle2: {
    width: 16,
    height: 16,
    borderRadius: 100,
    zIndex: 2,
    borderWidth: 2,
    borderColor: "#fff",
    position: "absolute",
    top: 8,
    right: 20,
    zIndex: 2,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    borderRadius: 4,
    marginHorizontal: -7, // Overlap with circles
    position: "relative",
    zIndex: 1,
  },
  progressFill: {
    height: "100%",
    borderRadius: 100,
    position: "absolute",
    left: 0,
    top: 0,
  },
  car: {
    position: "absolute",
    top: -9.6,
    width: 40,
    height: 32,
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 3,
  },
  carImage: {
    width: "100%",
    height: "100%",
    zIndex: 3,
  },
});

export default CustomProgressBar;
