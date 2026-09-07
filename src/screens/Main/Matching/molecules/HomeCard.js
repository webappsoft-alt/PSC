import {
  StyleSheet,
  Image,
  View,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useRef, useState } from "react";
import LinearGradient from "react-native-linear-gradient";
import ImageFast from "../../../../components/ImageFast";
import { PNGIcons } from "../../../../assets/images/icons";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import { Images } from "../../../../assets/images";
import AuthSlider from "../../../../components/Auth/AuthSlider";
import { useNavigation } from "@react-navigation/native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const HomeCard = ({ isCross }) => {
  const navigation = useNavigation();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateCard = useRef(new Animated.Value(0)).current;
  const gradientOpacity = useRef(new Animated.Value(0)).current;
  const gradientTranslateY = useRef(new Animated.Value(200)).current;
  const [currentGradientColors, setCurrentGradientColors] = useState([
    "transparent",
    "transparent",
  ]);

  const buttonActions = [
    {
      colors: ["#FF4B4B", "#FF4B4B00"],
      direction: "left",
      rotation: -15,
    },
    {
      colors: ["#1ED760", "#1ED76000"],
      direction: "right",
      rotation: 8,
    },
    {
      colors: ["#007AFE", "#007AFE00"],
      direction: "up",
      rotation: 0,
    },
    {
      colors: ["#F41857", "#F4185700"],
      direction: "left",
      rotation: -8,
    },
    {
      colors: ["#8400E7", "#8400E700"],
      direction: "right",
      rotation: 15,
    },
  ];

  const handleButtonPress = (index) => {
    const action = buttonActions[index];

    // Set gradient colors
    setCurrentGradientColors(action.colors);

    // Reset gradient position to bottom before animation
    gradientTranslateY.setValue(200);

    // Animate gradient appearance from bottom to top
    Animated.sequence([
      Animated.parallel([
        Animated.timing(gradientOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(gradientTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(gradientOpacity, {
        toValue: 0.7,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate card movement after a short delay
    setTimeout(() => {
      const animations = [];

      if (action.direction === "left") {
        animations.push(
          Animated.timing(translateX, {
            toValue: -screenWidth * 1.5,
            duration: 400,
            useNativeDriver: true,
          }),
        );
        animations.push(
          Animated.timing(rotateCard, {
            toValue: action.rotation,
            duration: 400,
            useNativeDriver: true,
          }),
        );
      } else if (action.direction === "right") {
        animations.push(
          Animated.timing(translateX, {
            toValue: screenWidth * 1.5,
            duration: 400,
            useNativeDriver: true,
          }),
        );
        animations.push(
          Animated.timing(rotateCard, {
            toValue: action.rotation,
            duration: 400,
            useNativeDriver: true,
          }),
        );
      } else if (action.direction === "up") {
        animations.push(
          Animated.timing(translateY, {
            toValue: -screenHeight * 1.5,
            duration: 400,
            useNativeDriver: true,
          }),
        );
      }

      Animated.parallel(animations).start(() => {
        setTimeout(() => {
          resetCardPosition();
        }, 100);
      });
    }, 400);
  };

  const resetCardPosition = () => {
    translateX.setValue(0);
    translateY.setValue(0);
    rotateCard.setValue(0);
    gradientOpacity.setValue(0);
    gradientTranslateY.setValue(200);
    setCurrentGradientColors(["transparent", "transparent"]);

    // Here you would typically load the next card
    // onNextCard && onNextCard();
  };

  const cardRotation = rotateCard.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ["-15deg", "0deg", "15deg"],
  });

  return (
    <>
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [
              { translateX },
              { translateY },
              { rotate: cardRotation },
            ],
          },
        ]}
      >
        <ImageFast
          onPress={() => navigation.navigate("MatchingDetail")}
          source={Images.short3}
          style={[
            styles.image,
            {
              height:
                Platform.OS == "ios" && isCross
                  ? screenHeight * 0.65
                  : Platform.OS == "ios"
                  ? screenHeight * 0.78
                  : screenHeight * 0.75,
            },
          ]}
        >
          {/* Bottom Gradient Overlay */}
          <View style={styles.blackOverlay} />
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0, 0, 0, 1.8)"]}
            style={styles.bottomGradient}
            pointerEvents="none"
          />

          <View style={styles.innerContainer}>
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: "#1414163D",
                    borderRadius: 99,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                  },
                ]}
              >
                <Image
                  source={Images.locationUnderline}
                  style={styles.locationUnderline}
                  tintColor={COLORS.white}
                />
                <CustomText
                  label={"8 miles"}
                  fontSize={12}
                  lineHeight={12 * 1.4}
                  marginLeft={8}
                  fontFamily={fonts.medium}
                />
              </View>
              {isCross ? (
                <ImageFast
                  onPress={() => navigation.goBack()}
                  source={Images.matchingCross}
                  style={{ height: 48, width: 48 }}
                />
              ) : (
                <View style={styles.bg}>
                  <Image
                    source={Images.link}
                    style={styles.locationUnderline}
                    tintColor={COLORS.white}
                  />
                  <CustomText
                    label={"97%"}
                    fontSize={14}
                    marginLeft={4}
                    fontFamily={fonts.semiBold}
                  />
                </View>
              )}
            </View>

            <View
              style={{
                height:
                  // "45%"
                  Platform.OS == "ios" && isCross
                    ? screenHeight * 0.32
                    : Platform.OS == "ios"
                    ? screenHeight * 0.33
                    : screenHeight * 0.35,
              }}
            />
            {/* footer */}
            <View style={{ alignSelf: "center", alignItems: "center" }}>
              <View style={styles.locationRow}>
                <Image source={Images.handTap} style={styles.pinIcon} />
                <CustomText
                  label={"Tap to view profile"}
                  fontSize={12}
                  lineHeight={12 * 1.4}
                  fontFamily={fonts.semiBold}
                  color={"#c4c4c4"}
                />
              </View>
              <View style={styles.locationRow}>
                <View style={styles.greenDot} />
                <Image source={Images.verify} style={styles.verify} />

                <CustomText
                  label={"Catie,"}
                  fontSize={32}
                  fontFamily={fonts.semiBold}
                />
                <CustomText
                  label={"21"}
                  fontSize={32}
                  fontFamily={fonts.semiBold}
                  color={"#FFFFFFCC"}
                />
              </View>

              <View style={styles.genreRow}>
                <View style={styles.interestFill}>
                  <CustomText
                    label={"Interest 1"}
                    fontFamily={fonts.semiBold}
                  />
                </View>
                <View style={styles.interestFill}>
                  <CustomText
                    label={"Interest 1"}
                    fontFamily={fonts.semiBold}
                  />
                </View>
                <View style={styles.interestFill}>
                  <CustomText
                    label={"Interest 1"}
                    fontFamily={fonts.semiBold}
                  />
                </View>
              </View>

              <CustomText
                label={"Producer at Pixar"}
                fontSize={16}
                fontFamily={fonts.regular}
              />
            </View>

            <Animated.View
              style={[
                styles.gradientOverlay,
                {
                  opacity: gradientOpacity,
                  transform: [{ translateY: gradientTranslateY }],
                },
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={currentGradientColors}
                start={{ x: 0.5, y: 1 }} // Start from bottom
                end={{ x: 0.5, y: 0 }} // End at top
                style={styles.gradientFill}
              />
            </Animated.View>

            <View style={styles.bottomContainer}>
              {[
                Images.btn1,
                Images.btn2,
                Images.btn3,
                Images.btn4,
                Images.btn5,
              ]?.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() =>
                    index == 4
                      ? navigation.navigate("Chat")
                      : handleButtonPress(index)
                  }
                  activeOpacity={0.8}
                  style={{
                    height: index == 2 ? 72 : 56,
                    width: index == 2 ? 72 : 56,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 99,
                    backgroundColor: "#0000003d",
                    borderWidth: 1,
                    borderColor: "#272727",
                  }}
                >
                  <ImageFast
                    source={item}
                    removeLoading
                    style={[
                      styles.btnStyle,
                      index === 0 ? styles.largeBtn : styles.smallBtn,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Animated Gradient Overlay */}
        </ImageFast>
      </Animated.View>
    </>
  );
};

export default HomeCard;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    alignItems: "center",
    width: "100%",
  },
  verify: {
    height: 16,
    width: 14,
  },
  image: {
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  innerContainer: {
    padding: 12,
    // justifyContent: "space-between",
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
  locationUnderline: {
    height: 16,
    width: 16,
  },
  moreIcon: {
    height: 37,
    width: 32,
  },
  bg: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#64CD757A",
    borderRadius: 99,
    padding: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pinIcon: {
    height: 12,
    width: 12,
    tintColor: COLORS.white,
  },
  genreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  interestFill: {
    borderRadius: 99,
    backgroundColor: "#1414167A",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: Platform.OS == "android" ? "100%" : "90%",
  },
  forwardIcon: {
    height: 28,
    width: 28,
    tintColor: COLORS.gray64,
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 16,
  },
  btnStyle: {
    resizeMode: "contain",
  },
  smallBtn: {
    height: 24,
    width: 24,
  },
  largeBtn: {
    height: 32,
    width: 32,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200, // Fixed height
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  gradientFill: {
    flex: 1,
  },
  greenDot: {
    height: 12,
    width: 12,
    borderRadius: 99,
    backgroundColor: "#64cd75",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  blackOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(18, 18, 18, 0.5)",
    zIndex: 0,
  },
});
