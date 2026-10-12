import { useNavigation } from "@react-navigation/native";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTabBarVisibility } from "../../../../navigation/TabStack";
import LinearGradient from "react-native-linear-gradient";
import {
  gyroscope,
  SensorTypes,
  setUpdateIntervalForType,
} from "react-native-sensors";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import { PNGIcons } from "../../../../assets/images/icons";
import Blur from "../../../../components/Blur";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import { post } from "../../../../services/ApiRequest";
import {
  addCardToTop,
  removeCard,
} from "../../../../store/reducer/MatchingSlice";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MatchCard = ({ isCross, data }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { userData } = useSelector((state) => state.users);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Redux is the single source of truth for the stack, a local copy of it can
  // fall out of sync and bring an already swiped profile back on screen
  const cards = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [history, setHistory] = useState([]);
  // Set while the final card leaves, so the wrapper is hidden with a plain
  // (non-animated) style before the whole component unmounts
  const [isLastCardLeaving, setIsLastCardLeaving] = useState(false);
  const isAnimatingRef = useRef(false);
  const stackSizeRef = useRef(0);

  const { setPagerScrollEnabled } = useTabBarVisibility();
  const pagerScrollRef = useRef();
  pagerScrollRef.current = setPagerScrollEnabled;

  const nextCardLift = useRef(new Animated.Value(10)).current;
  const sliderAnimation = useRef(new Animated.Value(0)).current;

  const currentCardRef = useRef(null);

  useEffect(() => {
    currentCardRef.current = cards[0];
    stackSizeRef.current = cards.length;
  }, [cards]);
  // All card animations are JS-driven (useNativeDriver: false) on purpose.
  // With the native driver the JS-side value is never updated, so any
  // re-render while a card is swiped off screen (gradient state, slider
  // tick, stack change) commits the stale JS transform (0 = centre) and on
  // the new architecture that paints before the native node re-attaches,
  // flashing the swiped card back on screen. JS-driven values are always
  // current, so every commit carries the real position. The gesture already
  // drives `pan` from JS on every move, so this is the natural driver here.
  // Current card animations
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateCard = useRef(new Animated.Value(0)).current;
  const gradientOpacity = useRef(new Animated.Value(0)).current;
  const gradientTranslateY = useRef(new Animated.Value(200)).current;

  // Next card animations
  const nextCardScale = useRef(new Animated.Value(0.9)).current;
  const nextCardTranslateY = useRef(new Animated.Value(10)).current;

  // Gesture animations
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;

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
      colors: ["#F41857", "#F4185700"],
      direction: "left",
      rotation: -8,
    },
    {
      colors: ["#007AFE", "#007AFE00"],
      direction: "up",
      rotation: 0,
    },
    {
      colors: ["#1ED760", "#1ED76000"],
      direction: "right",
      rotation: 8,
    },
    {
      colors: ["#8400E7", "#8400E700"],
      direction: "right",
      rotation: 15,
    },
  ];

  // Auto-advance slider every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      goToNextImage();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentImageIndex]);

  // Start slider animation when image changes
  useEffect(() => {
    startSliderAnimation();
  }, [currentImageIndex]);

  const startSliderAnimation = () => {
    // Reset animation
    sliderAnimation.setValue(0);

    // Start the fill animation
    Animated.timing(sliderAnimation, {
      toValue: 1,
      duration: 3000, // 3 seconds
      useNativeDriver: false,
    }).start();
  };

  const goToNextImage = () => {
    const currentProfile = cards[0];
    const images =
      currentProfile?.profile?.matchingImages?.length > 0
        ? currentProfile.profile.matchingImages
        : currentProfile?.profile?.avatar
        ? [currentProfile.profile.avatar]
        : [];
    if (images.length === 0) return;
    const nextIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(nextIndex);
  };

  const handleSwipe = (direction) => {
    // Called once the gesture animation finished, it already set the guard
    let index;
    switch (direction) {
      case "left":
        index = 1;
        break;
      case "right":
        index = 3;
        break;
      case "up":
        index = 2;
        break;
      default:
        return;
    }
    handleButtonPress(index, true);
  };

  const checkCountAndAlert = (type) => {
    if (type === "dislike" || type === "like") return true;

    const keyMap = {
      superlike: "supperLikes",
      boost: "boosts",
      rewind: "rewinds",
    };
    const backendKey = keyMap[type];
    if (!backendKey) return true;

    const count =
      userData?.[backendKey] ?? userData?.profile?.[backendKey] ?? 0;
    if (count <= 0) {
      Alert.alert(
        `No more ${type === "superlike" ? "Super Like" : type}s`,
        `You have no more ${
          type === "superlike" ? "Super Like" : type
        }s left. Would you like to buy more?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Buy More",
            onPress: () => navigation.navigate("Plans"),
          },
        ],
      );
      return false;
    }
    return true;
  };

  const handleInteraction = async (type, profileId) => {
    try {
      let body = {
        toUser: profileId,
        interactionType: type,
      };

      if (type === "boost") {
        body.boostDuration = 60;
      }

      // Update local Redux state for specific interactions
      if (type === "superlike" || type === "boost" || type === "rewind") {
        const keyMap = {
          superlike: "supperLikes",
          boost: "boosts",
          rewind: "rewinds",
        };
        const backendKey = keyMap[type];

        if (backendKey) {
          let newUserData = { ...userData };
          if (
            newUserData.profile &&
            newUserData.profile[backendKey] !== undefined
          ) {
            newUserData.profile = {
              ...newUserData.profile,
              [backendKey]: Math.max(
                0,
                (newUserData.profile[backendKey] || 0) - 1,
              ),
            };
          } else if (newUserData[backendKey] !== undefined) {
            newUserData = {
              ...newUserData,
              [backendKey]: Math.max(0, (newUserData[backendKey] || 0) - 1),
            };
          }
          dispatch(setUserData(newUserData));
        }
      }

      const response = await post("matching/interactions", body);
      // console.log("interaction response------>", response.data);
    } catch (error) {
      console.error(`Error with ${type} interaction:`, error);
    }
  };

  const handleButtonPress = async (index, fromGesture = false) => {
    if (index === 0) {
      handleRewind();
      return;
    }

    // A second swipe while the previous one is still animating would reset the
    // card that is currently flying out and snap it back into view
    if (!fromGesture && isAnimatingRef.current) return;

    const currentProfile = currentCardRef.current;
    if (!currentProfile) {
      // The gesture already moved the card away, bring it back
      if (fromGesture) resetCardPosition();
      return;
    }

    const profileId = currentProfile._id || currentProfile.id;
    const action = buttonActions[index];

    // Map button index to interaction type
    let interactionType;
    switch (index) {
      case 1:
        interactionType = "dislike";
        break;
      case 2:
        interactionType = "superlike";
        break;
      case 3:
        interactionType = "like";
        break;
      case 4:
        interactionType = "boost";
        break;
      default:
        return;
    }

    if (!checkCountAndAlert(interactionType)) {
      // The gesture already moved the card away, bring it back
      if (fromGesture) resetCardPosition();
      return;
    }

    isAnimatingRef.current = true;

    // Call API
    handleInteraction(interactionType, profileId);

    // Set gradient colors
    setCurrentGradientColors(action.colors);

    // Reset gradient position to bottom before animation
    gradientTranslateY.setValue(200);

    // Animate next card coming forward
    Animated.parallel([
      Animated.timing(nextCardScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(nextCardTranslateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.spring(nextCardLift, {
        toValue: -25, // 👈 upward lift changed to -25 to match marginTop: 25
        friction: 5,
        tension: 60,
        useNativeDriver: false,
      }),
    ]).start();

    // Animate gradient appearance from bottom to top
    Animated.sequence([
      Animated.parallel([
        Animated.timing(gradientOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(gradientTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(gradientOpacity, {
        toValue: 0.7,
        duration: 1500,
        useNativeDriver: false,
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
            useNativeDriver: false,
          }),
        );
        animations.push(
          Animated.timing(rotateCard, {
            toValue: action.rotation,
            duration: 400,
            useNativeDriver: false,
          }),
        );
      } else if (action.direction === "right") {
        animations.push(
          Animated.timing(translateX, {
            toValue: screenWidth * 1.5,
            duration: 400,
            useNativeDriver: false,
          }),
        );
        animations.push(
          Animated.timing(rotateCard, {
            toValue: action.rotation,
            duration: 400,
            useNativeDriver: false,
          }),
        );
      } else if (action.direction === "up") {
        animations.push(
          Animated.timing(translateY, {
            toValue: -screenHeight * 1.5,
            duration: 400,
            useNativeDriver: false,
          }),
        );
      }

      Animated.parallel(animations).start(() => {
        setTimeout(() => {
          goToNextCard();
        }, 100);
      });
    }, 400);
  };

  const goToNextCard = () => {
    const removedCard = currentCardRef.current;
    if (removedCard) {
      setHistory((prevHistory) => [...prevHistory, removedCard]);
    }
    setCurrentImageIndex(0); // Reset to first image when changing cards
    if (stackSizeRef.current <= 1) {
      // Last card: the parent unmounts this component once the stack is empty,
      // and unmounting a native-animated view restores its transform to the
      // centre for a frame. Hide it with a plain style first, then remove.
      setIsLastCardLeaving(true);
      requestAnimationFrame(() => dispatch(removeCard()));
      return;
    }
    dispatch(removeCard());
    // The shared animations are reset by the layout effect below once the new
    // top card is actually on screen (keyed to the card id) so the card flying
    // out is never snapped back into view
  };

  const handleRewind = () => {
    if (isAnimatingRef.current) return;

    if (history.length === 0) {
      ToastMessage("No Previous Post found");
      return;
    }

    if (!checkCountAndAlert("rewind")) return;

    const lastCard = history[history.length - 1];
    const profileId = lastCard._id || lastCard.id;

    handleInteraction("rewind", profileId);

    dispatch(addCardToTop(lastCard));
    setHistory((prevHistory) => prevHistory.slice(0, -1));
    setCurrentImageIndex(0);
  };

  const resetCardPosition = () => {
    translateX.setValue(0);
    translateY.setValue(0);
    rotateCard.setValue(0);
    nextCardLift.setValue(10);
    gradientOpacity.setValue(0);
    gradientTranslateY.setValue(200);
    setCurrentGradientColors(["transparent", "transparent"]);
    pan.setValue({ x: 0, y: 0 });
    rotate.setValue(0);
    sliderAnimation.setValue(0);

    // Reset next card animation for next swipe
    nextCardScale.setValue(0.9);
    nextCardTranslateY.setValue(10);
  };

  // The animated values are shared by every card, so they are reset only when
  // the visible top card actually changes. Keying this to the card id (which
  // arrives through Redux) guarantees the reset runs after the new card is
  // mounted, never while the just-swiped card is still on top, which is what
  // was snapping the outgoing card back into view.
  const topCardId = cards[0]?._id || cards[0]?.id;
  useLayoutEffect(() => {
    resetCardPosition();
    isAnimatingRef.current = false;
  }, [topCardId]);

  // PanResponder for gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimatingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isAnimatingRef.current) return false;
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        pagerScrollRef.current?.(false);
      },
      onPanResponderTerminate: () => {
        pagerScrollRef.current?.(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;

        // Update position
        pan.setValue({ x: dx, y: dy });

        // Add rotation based on horizontal movement for better visual feedback
        const rotation = dx * 0.1;
        rotate.setValue(rotation);

        // Show gradient during swipe
        const swipeThreshold = 30;
        if (Math.abs(dx) > swipeThreshold) {
          // Set gradient colors based on swipe direction
          if (dx < 0) {
            // Swiping left - red gradient
            setCurrentGradientColors(["#FF4B4B", "#FF4B4B00"]);
          } else {
            // Swiping right - green gradient
            setCurrentGradientColors(["#1ED760", "#1ED76000"]);
          }

          // Calculate opacity based on swipe distance
          const opacity = Math.min(Math.abs(dx) / 150, 1);
          gradientOpacity.setValue(opacity);
          gradientTranslateY.setValue(0);
        } else {
          // Reset gradient when not swiping far enough
          gradientOpacity.setValue(0);
          gradientTranslateY.setValue(200);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        pagerScrollRef.current?.(true);
        const { dx, dy, vx, vy } = gestureState;
        const swipeThreshold = 50;
        const velocityThreshold = 0.5;

        // Check if it's a left swipe
        if (dx < -swipeThreshold || vx < -velocityThreshold) {
          // Block further gestures until this card has been replaced
          isAnimatingRef.current = true;

          // Set gradient for left swipe
          setCurrentGradientColors(["#FF4B4B", "#FF4B4B00"]);
          gradientTranslateY.setValue(200);

          // Animate gradient appearance
          Animated.sequence([
            Animated.parallel([
              Animated.timing(gradientOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
              }),
              Animated.timing(gradientTranslateY, {
                toValue: 0,
                duration: 500,
                useNativeDriver: false,
              }),
            ]),
            Animated.timing(gradientOpacity, {
              toValue: 0.7,
              duration: 1500,
              useNativeDriver: false,
            }),
          ]).start();

          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: -screenWidth * 2, y: dy },
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(rotate, {
              toValue: -15,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start(() => {
            handleSwipe("left");
          });
        }
        // Check if it's a right swipe
        else if (dx > swipeThreshold || vx > velocityThreshold) {
          // Block further gestures until this card has been replaced
          isAnimatingRef.current = true;

          // Set gradient for right swipe
          setCurrentGradientColors(["#1ED760", "#1ED76000"]);
          gradientTranslateY.setValue(200);

          // Animate gradient appearance
          Animated.sequence([
            Animated.parallel([
              Animated.timing(gradientOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
              }),
              Animated.timing(gradientTranslateY, {
                toValue: 0,
                duration: 500,
                useNativeDriver: false,
              }),
            ]),
            Animated.timing(gradientOpacity, {
              toValue: 0.7,
              duration: 1500,
              useNativeDriver: false,
            }),
          ]).start();

          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: screenWidth * 2, y: dy },
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(rotate, {
              toValue: 15,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start(() => {
            handleSwipe("right");
          });
        }
        // Check if it's an upward swipe
        else if (dy < -swipeThreshold || vy < -velocityThreshold) {
          if (!checkCountAndAlert("superlike")) {
            // If superlike count is zero, spring back instead of swiping
            Animated.parallel([
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false,
                friction: 5,
                tension: 40,
              }),
              Animated.spring(rotate, {
                toValue: 0,
                useNativeDriver: false,
                friction: 5,
                tension: 40,
              }),
            ]).start();

            // Reset gradient
            gradientOpacity.setValue(0);
            gradientTranslateY.setValue(200);
            setCurrentGradientColors(["transparent", "transparent"]);
            return;
          }

          // Block further gestures until this card has been replaced
          isAnimatingRef.current = true;

          Animated.timing(pan, {
            toValue: { x: dx, y: -screenHeight * 2 },
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            handleSwipe("up");
          });
        }
        // If not a swipe, return to original position
        else {
          // Reset gradient
          gradientOpacity.setValue(0);
          gradientTranslateY.setValue(200);
          setCurrentGradientColors(["transparent", "transparent"]);

          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              friction: 5,
              tension: 40,
            }),
            Animated.spring(rotate, {
              toValue: 0,
              useNativeDriver: false,
              friction: 5,
              tension: 40,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  const cardRotation = rotateCard.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ["-15deg", "0deg", "15deg"],
  });

  // Combine gesture rotation with button press rotation
  const combinedRotate = Animated.add(rotate, rotateCard).interpolate({
    inputRange: [-30, 0, 30],
    outputRange: ["-30deg", "0deg", "30deg"],
    extrapolate: "clamp",
  });

  const gyroX = useRef(new Animated.Value(0)).current;
  const gyroY = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   setUpdateIntervalForType(SensorTypes.gyroscope, 60);

  //   const subscription = gyroscope.subscribe(({ x, y }) => {
  //     // Map gyro movement to small subtle translations
  //     Animated.spring(gyroX, {
  //       toValue: x * 25,
  //       useNativeDriver: false,
  //     }).start();

  //     Animated.spring(gyroY, {
  //       toValue: y * 25,
  //       useNativeDriver: false,
  //     }).start();
  //   });

  //   return () => subscription.unsubscribe();
  // }, []);

  const currentProfile = cards[0];
  const nextProfile = cards[1];

  const renderCard = (profile, isCurrent = true) => {
    // Determine the images to show
    const imagesToDisplay =
      profile?.profile?.matchingImages?.length > 0
        ? profile.profile.matchingImages
        : profile?.profile?.avatar
        ? [profile.profile.avatar]
        : [];

    const hasImages = imagesToDisplay.length > 0;
    const profileColor = profile?.profile?.profileColor || COLORS.gray48;

    // Calculate Age
    const calculateAge = (dobString) => {
      if (!dobString) return "";
      const birthDate = new Date(dobString);
      const today = new Date();
      let ageValue = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        ageValue--;
      }
      return ageValue;
    };

    const age = calculateAge(profile?.dob);

    const source = hasImages
      ? { uri: imagesToDisplay[isCurrent ? currentImageIndex : 0] }
      : null;

    return (
      <View
        style={[
          styles.image,
          !hasImages && { backgroundColor: profileColor },
          { overflow: "hidden" },
        ]}
      >
        {hasImages ? (
          <ImageFast
            key={profile?._id || profile?.id}
            source={source}
            style={[styles.image, { position: "absolute" }]}
            onPress={() =>
              navigation.navigate("MatchingDetail", { item: profile })
            }
          />
        ) : (
          <Pressable
            key={profile?._id || profile?.id}
            style={styles.image}
            onPress={() =>
              navigation.navigate("MatchingDetail", { item: profile })
            }
          />
        )}
        <View style={styles.overlay} pointerEvents="none" />

        <View style={styles.innerContainer} pointerEvents="box-none">
          <View style={styles.headerRow} pointerEvents="box-none">
            <View style={styles.row}>
              <Image source={Images.verifiedBadge} style={styles.verifyStar} />
              <CustomText
                label={profile?.profile?.category?.toUpperCase() || "MEMBER"}
                fontSize={12}
                marginLeft={8}
                fontFamily={fonts.medium}
                color={COLORS.white}
              />
            </View>

            {isCross ? (
              <TouchableOpacity
                style={{
                  height: 32,
                  width: 32,
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  borderRadius: 99,
                }}
              >
                <Blur />
                <ImageFast
                  onPress={() => navigation.goBack()}
                  source={Images.cross}
                  style={{ height: 20, width: 20 }}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.bg}>
                <CustomText
                  label={`${profile?.compatibilityScore || 0}%`}
                  fontFamily={fonts.semiBold}
                  color={COLORS.white}
                />
              </View>
            )}
          </View>

          {/* footer */}
          <View pointerEvents="box-none">
            <CustomText
              label={`${profile?.firstName || ""} ${age ? `, ${age}` : ""}`}
              fontSize={40}
              fontFamily={fonts.bold}
              color={COLORS.white}
            />

            <View style={styles.locationRow}>
              <Image source={PNGIcons.pin} style={styles.pinIcon} />
              <CustomText
                label={
                  profile?.location?.city
                    ? `${profile.location.city}, ${profile.location.country}`
                    : "Unknown Location"
                }
                fontSize={12}
                fontFamily={fonts.medium}
                marginLeft={3}
                color={COLORS.white}
              />
              {profile?.distance !== undefined && (
                <CustomText
                  label={`${profile.distance} km`}
                  fontSize={12}
                  color={COLORS.gray64}
                  fontFamily={fonts.medium}
                  marginLeft={4}
                />
              )}
            </View>

            <CustomText
              label={`${profile?.profileViews || 0} total Profile View${
                profile?.profileViews === 1 ? "" : "s"
              }`}
              fontSize={11}
              fontFamily={fonts.medium}
              marginTop={8}
              color={COLORS.white}
            />

            <View style={styles.genreRow}>
              {profile?.industry?.length > 0 &&
                profile?.industry?.slice(0, 3)?.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.genrePill}>
                    <Blur />
                    <CustomText
                      label={item}
                      fontFamily={fonts.medium}
                      fontSize={12}
                      textTransform="capitalize"
                      color={COLORS.white}
                    />
                  </View>
                ))}
            </View>
            {profile?.profile?.bio && (
              <Pressable
                style={styles.footerRow}
                onPress={() =>
                  navigation.navigate("MatchingDetail", { item: profile })
                }
              >
                <CustomText
                  label={profile?.profile?.bio || "No bio available."}
                  fontSize={12}
                  fontFamily={fonts.medium}
                  color={COLORS.white}
                />

                <Image source={PNGIcons.forward} style={styles.forwardIcon} />
              </Pressable>
            )}

            {/* Dynamic Slider */}
            {hasImages && imagesToDisplay.length > 1 && (
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                  {imagesToDisplay.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.block,
                        {
                          backgroundColor: "#FFFFFF17",
                          borderRadius: 99,
                          overflow: "hidden",
                        },
                      ]}
                    >
                      {index === currentImageIndex && isCurrent && (
                        <Animated.View
                          style={[
                            StyleSheet.absoluteFill,
                            {
                              backgroundColor: COLORS.white,
                              width: sliderAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0%", "100%"],
                              }),
                            },
                          ]}
                        />
                      )}
                      {index < currentImageIndex && isCurrent && (
                        <View
                          style={[
                            StyleSheet.absoluteFill,
                            {
                              backgroundColor: COLORS.white,
                            },
                          ]}
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Animated Gradient Overlay - only for current card */}
        {isCurrent && (
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
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={styles.gradientFill}
            />
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Next Card (Preview) - This will become the current card after swipe */}
      {nextProfile && (
        // Stable key: this native-animated wrapper must never unmount, only its
        // content changes per card (see note on the current card below)
        <Animated.View
          key="next-card"
          style={[
            styles.cardWrapper,
            styles.nextCard,
            {
              transform: [
                { scale: nextCardScale },
                { translateY: Animated.add(nextCardTranslateY, nextCardLift) },
              ],
            },
          ]}
        >
          {renderCard(nextProfile, false)}
        </Animated.View>
      )}

      {/* Current Card */}
      {/*
        Stable key on purpose. When a native-driven Animated.View unmounts, RN
        restores its native props to their defaults (translate 0 = centre)
        and on Fabric that can paint one frame before the view is removed,
        so keying this wrapper by profile id made every swiped card flash back
        on screen. Keeping the wrapper mounted and swapping only its content
        avoids the unmount entirely.
      */}
      <Animated.View
        key="current-card"
        {...panResponder.panHandlers}
        style={[
          styles.cardWrapper,
          styles.currentCard,
          isLastCardLeaving && styles.hidden,
          {
            backgroundColor: "#FFFFFF29",
            transform: [
              {
                translateX: Animated.add(
                  Animated.add(pan.x, translateX),
                  gyroX,
                ),
              },
              {
                translateY: Animated.add(
                  Animated.add(pan.y, translateY),
                  gyroY,
                ),
              },
              { rotate: combinedRotate },
            ],
          },
        ]}
      >
        {renderCard(currentProfile, true)}
      </Animated.View>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        {[
          PNGIcons.btn1,
          PNGIcons.btn2,
          PNGIcons.btn3,
          PNGIcons.btn4,
          PNGIcons.btn5,
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
                index === 0 || index === 4 ? styles.smallBtn : styles.largeBtn,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default MatchCard;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 6,
  },
  cardWrapper: {
    width: "100%",
    padding: 4,
    backgroundColor: "#FFFFFF29",
    borderColor: "#FFFFFF29",
    borderRadius: 34,
    borderWidth: 1,
  },
  currentCard: {
    position: "absolute",
    zIndex: 2,
  },
  hidden: {
    opacity: 0,
  },
  nextCard: {
    position: "absolute",
    zIndex: 1,
    marginTop: 25,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  image: {
    height: Platform.OS == "ios" ? screenHeight * 0.56 : screenHeight * 0.55,
    width: "100%",
    borderRadius: 32,
  },
  innerContainer: {
    padding: 14,
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
  verifyStar: {
    height: 22,
    width: 22,
  },
  bg: {
    backgroundColor: "#FFFFFF29",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#FFFFFF7A",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
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
    marginVertical: 12,
  },
  genrePill: {
    borderRadius: 99,
    padding: 4,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
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
    marginTop:
      Platform.OS == "ios"
        ? screenHeight * 0.56 + 30
        : screenHeight * 0.55 + 30,
    padding: 6,
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
    height: 200,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  gradientFill: {
    flex: 1,
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
  block: {
    flex: 1,
    height: 6,
    position: "relative",
  },
});
