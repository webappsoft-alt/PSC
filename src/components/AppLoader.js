import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { COLORS } from "../utils/COLORS";
import { Images } from "../assets/images";
import CustomModal from "./CustomModal";

const { width, height } = Dimensions.get("screen");

const AppLoader = ({ isVisible }) => {
  const dotAnimations = useRef(
    [1, 2, 3, 4].map(() => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    const animateDots = () => {
      const animations = dotAnimations.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(anim, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      });

      Animated.parallel(animations).start();
    };

    animateDots();
  }, []);

  return (
    <CustomModal isVisible={isVisible}>
      <View style={styles.container}>
        <StatusBar hidden />
        <Image source={Images.appIcon} style={styles.image} />
        <View style={styles.dotsContainer}>
          {[1, 2, 3, 4].map((i, index) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: COLORS.dotColor,
                  opacity: dotAnimations[index],
                  transform: [
                    {
                      scale: dotAnimations[index].interpolate({
                        inputRange: [0.3, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  container: {
    height,
    width,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 15,
    marginTop: 50,
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 100,
  },
});

export default AppLoader;
