import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Platform, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import ImageFast from "../../../components/ImageFast";

import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";

const { width, height } = Dimensions.get("window");
const slideHeight = height / 1.5 - 20;

const CustomRangeSlider = ({ currentSlide, totalSlides, marginTop, bg }) => {
  const progressRefs = useRef(
    Array.from({ length: totalSlides }, () => new Animated.Value(0))
  );

  useEffect(() => {
    progressRefs.current.forEach((animValue, index) => {
      if (index < currentSlide) {
        animValue.setValue(1);
      } else if (index === currentSlide) {
        animValue.setValue(0);
        Animated.timing(animValue, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }).start();
      } else {
        animValue.setValue(0);
      }
    });
  }, [currentSlide, totalSlides]);

  return (
    <View style={[styles.sliderContainer, { marginTop: marginTop || 20 }]}>
      <View style={styles.sliderTrack}>
        {Array.from({ length: totalSlides }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.block,
              {
                backgroundColor: bg || "#FFFFFF29",
                overflow: "hidden",
              },
            ]}
            
          >
            <Animated.View
              style={{
                height: "100%",
                backgroundColor: "#FFFFFF",
                width: progressRefs.current[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const OnBoarding1 = () => {
  const flatListRef = useRef();
  const navigation = useNavigation();

  const [currentIndex, setCurrentIndex] = useState(0);
  // Create animated values for all slides (follow OnBoarding pattern)
  const slideAnimations = useRef(
    Array.from(
      { length: 4 },
      (_, index) => new Animated.Value(index === 0 ? 0 : width)
    )
  ).current;

  const backgroundImages = [
    Images.onBoard7,
    Images.onBoard6,
    Images.onBoard7,
    Images.onBoard6,
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % 4;

      Animated.parallel([
        // Move current slide out to the left
        Animated.timing(slideAnimations[currentIndex], {
          toValue: -width,
          duration: 500,
          useNativeDriver: true,
        }),
        // Move next slide in from the right
        Animated.timing(slideAnimations[nextIndex], {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset previous slide position for future use
        slideAnimations[currentIndex].setValue(width);
        setCurrentIndex(nextIndex);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, slideAnimations]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        animated: true,
        index: currentIndex,
      });
    }
  }, [currentIndex]);

  const renderSlide = (index) => (
    <Animated.View
      key={index}
      style={[
        styles.slideContainer,
        {
          transform: [{ translateX: slideAnimations[index] }],
          zIndex: index === currentIndex ? 2 : 1,
        },
      ]}
    >
      <ScreenWrapper
        removeLoading
        paddingHorizontal={0.1}
        statusBarColor="transparent"
        barStyle="light-content"
        backgroundImage={backgroundImages[index]}
      >
        <View style={styles.topContainer}>
          <ImageFast
            removeLoading
            source={Images.onBoardingSign}
            style={{
              height: 85,
              width: 180,
              marginTop: Platform.OS == "android" ? 10 : 0,
            }}
          />
          <CustomRangeSlider
            currentSlide={currentIndex}
            totalSlides={4}
            bg={COLORS.disabled}
          />
        </View>
        <View style={styles.container}>
          <View
            style={{
              paddingHorizontal: 12,
              marginBottom: Platform.OS == "android" ? 30 : 26,
            }}
          >
            <CustomText
              label={
                index == 0
                  ? `Whenever you need to move somewhere`
                  : index == 1
                  ? `Discover unique places only known by locals`
                  : index == 2
                  ? `Whenever you need to move somewhere`
                  : index == 3
                  ? `Discover unique places only known by locals`
                  : `Whenever you need to move somewhere`
              }
              fontSize={24}
              fontFamily={fonts.semiBold}
              color={COLORS.white}
              lineHeight={24 * 1.4}
              marginBottom={5}
            />

            <CustomText
              label={
                index == 0
                  ? `There is a suited Chauffeur awaiting for your to show the way.`
                  : index == 1
                  ? `People`
                  : index == 2
                  ? `There is a suited Chauffeur awaiting for your to show the way.`
                  : index == 3
                  ? `People`
                  : `There is a suited Chauffeur awaiting for your to show the way.`
              }
              fontSize={16}
              color={COLORS.tabIcon}
              marginBottom={40}
              lineHeight={16 * 1.4}
            />

            <CustomButton
              title="Continue"
              backgroundColor={COLORS.white}
              color={COLORS.black}
              isBoarder
              secondBorderColor="#FFFFFF7A"
              onPress={() => navigation.navigate("AllowNotification")}
            />
          </View>
        </View>
      </ScreenWrapper>
    </Animated.View>
  );

  return (
    <View style={styles.mainContainer}>
      {backgroundImages.map((_, index) => renderSlide(index))}
    </View>
  );
};

export default OnBoarding1;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  slideContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  topContainer: {
    width: width,
    alignItems: "center",
    height: height - slideHeight + 230,
    marginTop: 10,
  },
  container: {
    width: width,
    justifyContent: "flex-end",
    height: height - slideHeight + 16,
    padding: 10,
    bottom: 60,
    position: "absolute",
  },
  sliderContainer: {
    width: "100%",
    alignItems: "center",
  },
  sliderTrack: {
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  block: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 26,
    zIndex: 999,
    // height: 100,
  },
});
