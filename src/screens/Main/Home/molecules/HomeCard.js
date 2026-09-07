import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const HomeCard = () => {
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
        <ImageFast source={Images.short2} style={styles.image}>
          <View style={styles.innerContainer}>
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: "#1414163D",
                    borderRadius: 99,
                    paddingVertical: 8,
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
              <Image
                source={Images.moreIconNoBg}
                style={styles.moreIcon}
                tintColor={COLORS.white}
              />
            </View>

            <View
              style={{
                height:
                  Platform.OS == "ios"
                    ? screenHeight * 0.4
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
                  onPress={() => handleButtonPress(index)}
                  activeOpacity={0.8}
                >
                  <ImageFast
                    source={item}
                    removeLoading
                    style={[
                      styles.btnStyle,
                      index === 0 || index === 4
                        ? styles.smallBtn
                        : styles.largeBtn,
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
    height: Platform.OS == "ios" ? screenHeight * 0.86 : screenHeight * 0.75,
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
    marginRight: 18,
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
    padding: 12,
    gap: 16,
  },
  btnStyle: {
    resizeMode: "contain",
  },
  smallBtn: {
    height: 48,
    width: 48,
  },
  largeBtn: {
    height: 56,
    width: 56,
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
});
