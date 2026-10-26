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
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { getNavBarClearance, useTabBarVisibility } from "../../../../navigation/TabStack";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { post } from "../../../../services/ApiRequest";
import {
  addCardToTop,
  removeCard,
} from "../../../../store/reducer/MatchingSlice";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import { COUNTRIES } from "../../../../utils/COUNTRIES";
import { ToastMessage } from "../../../../utils/ToastMessage";
import {
  ACTIONS_ABOVE_NAV,
  ACTIONS_HEIGHT,
  BARS_HEIGHT,
  BARS_TOP_FROM_INSET,
  CARD_PAD_H,
  GlassFill,
  INFO_ABOVE_ACTIONS,
  INFO_PAD_H,
  TITLES_GAP,
  TITLES_HEIGHT,
  capGap,
} from "./matchLayout";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MatchCard = ({ data, onExtrasNeeded, onMatch }) => {
  const insets = useSafeAreaInsets();
  const navClearance = getNavBarClearance(insets.bottom);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { userData } = useSelector((state) => state.users);
  // The PanResponder (created once) calls into these handlers, so they read
  // the latest user (super like / boost counts) through a ref, not a stale
  // first-render copy
  const userDataRef = useRef(userData);
  userDataRef.current = userData;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Redux is the single source of truth for the stack, a local copy of it can
  // fall out of sync and bring an already swiped profile back on screen
  const cards = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [history, setHistory] = useState([]);
  // Figma "NOT ENOUGH EXTRAS" sheet / It's-a-match live on the screen
  // (index.js) so they survive this stack unmounting after the last card
  const setExtrasSheet = (type) => onExtrasNeeded?.(type);
  const setMatch = (payload) => onMatch?.(payload);
  // Set while the final card leaves, so the wrapper is hidden with a plain
  // (non-animated) style before the whole component unmounts
  const [isLastCardLeaving, setIsLastCardLeaving] = useState(false);
  const isAnimatingRef = useRef(false);
  const stackSizeRef = useRef(0);

  const { setPagerScrollEnabled } = useTabBarVisibility();
  const pagerScrollRef = useRef();
  pagerScrollRef.current = setPagerScrollEnabled;

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
      colors: ["#64CD75", "#64CD7500"],
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
      userDataRef.current?.[backendKey] ??
      userDataRef.current?.profile?.[backendKey] ??
      0;
    if (count <= 0) {
      // Figma "NOT ENOUGH EXTRAS" sheet (superlike / rewind / boost)
      setExtrasSheet(type);
      return false;
    }
    return true;
  };

  const handleInteraction = async (type, profileId, profile) => {
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
          let newUserData = { ...userDataRef.current };
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
      const result = response?.data?.data;
      if (result?.isMatch && profile) {
        const id = profile._id || profile.id;
        // The modal is normally already open (predicted from hasLikedMe):
        // only add the server's matchData (conversationId for "Say hi!").
        // Unpredicted match → open it now.
        setMatch((prev) =>
          prev && (prev.profile?._id || prev.profile?.id) === id
            ? { ...prev, matchData: result.matchData }
            : prev || {
                profile,
                matchData: result.matchData,
                interactionType: type,
              },
        );
      }
      return result || null;
    } catch (error) {
      // a like refused for a limit → "No more likes?" sheet
      const status = error?.response?.status ?? error?.status;
      if ((type === "like" || type === "superlike") && (status === 403 || status === 429)) {
        setExtrasSheet(type === "like" ? "likes" : "superlike");
      }
      console.error(`Error with ${type} interaction:`, error);
      return null;
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
    handleInteraction(interactionType, profileId, currentProfile);

    // Liking someone who already liked you is always a match (the server
    // checks the same like / super like). Open "It's a match" right away over
    // THIS card and keep it on screen; it leaves once the modal is closed.
    const willMatch =
      ["like", "superlike", "boost"].includes(interactionType) &&
      !!currentProfile.hasLikedMe;

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

    const flyOut = () => {
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
    };

    if (willMatch) {
      setMatch({
        profile: currentProfile,
        matchData: null,
        interactionType,
        // called by the screen when the modal closes
        onDone: () => setTimeout(flyOut, 150),
      });
      return;
    }

    // Animate card movement after a short delay
    setTimeout(flyOut, 400);
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
    gradientOpacity.setValue(0);
    gradientTranslateY.setValue(200);
    setCurrentGradientColors(["transparent", "transparent"]);
    pan.setValue({ x: 0, y: 0 });
    rotate.setValue(0);
    sliderAnimation.setValue(0);
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
            setCurrentGradientColors(["#64CD75", "#64CD7500"]);
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
          setCurrentGradientColors(["#64CD75", "#64CD7500"]);
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

          if (currentCardRef.current?.hasLikedMe) {
            // predicted match: card settles back under "It's a match"
            Animated.parallel([
              Animated.spring(pan, { toValue: { x: 0, y: 0 }, ...MATCH_SETTLE }),
              Animated.spring(rotate, { toValue: 0, ...MATCH_SETTLE }),
            ]).start();
          } else {
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
            ]).start();
          }
          handleSwipe("right");
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

          if (currentCardRef.current?.hasLikedMe) {
            // predicted match: card settles back under "It's a match"
            Animated.parallel([
              Animated.spring(pan, { toValue: { x: 0, y: 0 }, ...MATCH_SETTLE }),
              Animated.spring(rotate, { toValue: 0, ...MATCH_SETTLE }),
            ]).start();
          } else {
            Animated.timing(pan, {
              toValue: { x: dx, y: -screenHeight * 2 },
              duration: 300,
              useNativeDriver: false,
            }).start();
          }
          handleSwipe("up");
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

  // Figma › Matching › New-Home: everything is laid out from the safe-area
  // top (story bars / title row) and from the nav bar (action row / info)
  const barsTop = insets.top + BARS_TOP_FROM_INSET;
  const titlesTop = barsTop + BARS_HEIGHT + TITLES_GAP;
  const actionsBottom = navClearance + ACTIONS_ABOVE_NAV;
  const infoBottom = actionsBottom + ACTIONS_HEIGHT + INFO_ABOVE_ACTIONS;

  // Client: tapping the photo opens the person's profile directly (no
  // MatchingDetail page in PSC)
  const openDetail = (profile) => {
    const userId = profile?._id || profile?.id;
    if (userId) navigation.navigate("UserProfile", { userId });
  };

  // Client: no card pile. The next profile sits exactly under the top card
  // (invisible at rest); warm its photos so it is ready when revealed.
  useEffect(() => {
    const p = nextProfile?.profile;
    const uris = (
      p?.matchingImages?.length ? p.matchingImages : p?.avatar ? [p.avatar] : []
    ).filter((u) => typeof u === "string" && u);
    if (uris.length) FastImage.preload(uris.map((uri) => ({ uri })));
  }, [nextProfile?._id]);

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
      if (isNaN(birthDate.getTime())) return "";
      const today = new Date();
      let ageValue = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        ageValue--;
      }
      return ageValue;
    };

    const age = calculateAge(profile?.dob);
    const imageIndex = isCurrent
      ? Math.min(currentImageIndex, imagesToDisplay.length - 1)
      : 0;
    const source = hasImages ? { uri: imagesToDisplay[imageIndex] } : null;

    const isVerified = !!profile?.profile?.isVerified;
    const roleLabel = profile?.role === "company" ? "COMPANY" : "INDIVIDUAL";

    const city = profile?.location?.city;
    const country = profile?.location?.country;
    // Figma: "Austin, US" — city + ISO country code
    const countryCode = countryToCode(country);
    const placeLabel = city
      ? countryCode
        ? `${city}, ${countryCode}`
        : city
      : countryCode;
    const distance =
      typeof profile?.distance === "number"
        ? `${Math.round(profile.distance)} km`
        : "";

    const jobTitle = profile?.occupation?.jobTitle;
    const company = profile?.occupation?.company;
    const jobLabel =
      jobTitle && company ? `${jobTitle} at ${company}` : jobTitle || company;

    const monthlyViews = Number(profile?.monthlyViews) || 0;
    const bio = profile?.profile?.bio;
    const industries = Array.isArray(profile?.industry)
      ? profile.industry.filter(Boolean).slice(0, 3)
      : [];

    // Figma "Frame 54": items 12 apart (vertical auto layout, trimmed text);
    // the icon rows are 12pt frames with the 8pt text centred (2 inset)
    const infoItems = [
      {
        key: "name",
        fontSize: 44,
        inset: 0,
        node: (
          <CustomText
            label={`${profile?.firstName || ""}${age !== "" ? `, ${age}` : ""}`}
            fontSize={44}
            fontFamily={fonts.semiBold}
            letterSpacing={-0.88}
            color={COLORS.white}
            textAlign="center"
            numberOfLines={1}
          />
        ),
      },
    ];
    if (placeLabel || distance) {
      infoItems.push({
        key: "place",
        fontSize: 12,
        inset: 2,
        node: (
          <View style={styles.iconRow}>
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="location_on"
              size={12}
              color={META_ICON_COLOR}
            />
            {!!placeLabel && (
              <CustomText
                label={placeLabel}
                fontSize={12}
                fontFamily={fonts.medium}
                color={COLORS.white}
                numberOfLines={1}
                containerStyle={styles.shrink}
              />
            )}
            {!!distance && (
              <CustomText
                label={distance}
                fontSize={12}
                fontFamily={fonts.medium}
                color={COLORS.gray64}
              />
            )}
          </View>
        ),
      });
    }
    if (jobLabel) {
      infoItems.push({
        key: "job",
        fontSize: 12,
        inset: 2,
        node: (
          <View style={styles.iconRow}>
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="work"
              size={12}
              color={META_ICON_COLOR}
            />
            <CustomText
              label={jobLabel}
              fontSize={12}
              fontFamily={fonts.medium}
              color={COLORS.white}
              numberOfLines={1}
              containerStyle={styles.shrink}
            />
          </View>
        ),
      });
    }
    infoItems.push({
      key: "views",
      fontSize: 11,
      inset: 0,
      node: (
        <CustomText
          label={`${monthlyViews} monthly profile view${
            monthlyViews === 1 ? "" : "s"
          }`}
          fontSize={11}
          fontFamily={fonts.medium}
          color={COLORS.white}
        />
      ),
    });
    if (bio) {
      infoItems.push({
        key: "bio",
        fontSize: 12,
        inset: 0,
        node: (
          <CustomText
            label={bio}
            fontSize={12}
            fontFamily={fonts.medium}
            color={COLORS.gray64}
            textAlign="center"
            numberOfLines={2}
          />
        ),
      });
    }
    if (industries.length > 0) {
      infoItems.push({
        key: "chips",
        fontSize: 0,
        inset: 0,
        node: (
          <View style={styles.chipsRow}>
            {industries.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.chip}>
                <GlassFill
                  borderRadius={16}
                  fill="rgba(255, 255, 255, 0.16)"
                />
                <CustomText
                  label={item}
                  fontSize={12}
                  fontFamily={fonts.medium}
                  textTransform="capitalize"
                  color={COLORS.white}
                />
              </View>
            ))}
          </View>
        ),
      });
    }
    // the last frame sits 24 above the action row: give back the part of the
    // text line box that hangs below its baseline (minus the row inset)
    const lastItem = infoItems[infoItems.length - 1];
    const infoBottomOffset =
      infoBottom - (lastItem.fontSize * 0.35 - lastItem.inset);

    return (
      <View
        style={[
          styles.card,
          !hasImages && { backgroundColor: profileColor },
        ]}
      >
        {hasImages ? (
          <ImageFast
            key={profile?._id || profile?.id}
            source={source}
            removeLoading
            style={StyleSheet.absoluteFill}
            onPress={() => openDetail(profile)}
          />
        ) : (
          <Pressable
            key={profile?._id || profile?.id}
            style={StyleSheet.absoluteFill}
            onPress={() => openDetail(profile)}
          />
        )}

        {/* Figma frame fill: #121212 8% (top) → 100% (bottom) over the photo */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(18, 18, 18, 0.08)", "rgba(18, 18, 18, 1)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Story bars: 4 tall, 6 apart, active white, idle white 8% */}
        {hasImages && (
          <View
            pointerEvents="none"
            style={[styles.barsRow, { top: barsTop }]}
          >
            {imagesToDisplay.map((_, index) => (
              <View key={index} style={styles.bar}>
                <GlassFill
                  fill="rgba(255, 255, 255, 0.08)"
                  blurAmount={32}
                />
                {isCurrent && index === imageIndex && (
                  <Animated.View
                    style={[
                      styles.barFill,
                      {
                        width: sliderAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                )}
                {isCurrent && index < imageIndex && (
                  <View style={[styles.barFill, { width: "100%" }]} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* VERIFIED INDIVIDUAL · 64% */}
        <View
          pointerEvents="none"
          style={[styles.titlesRow, { top: titlesTop }]}
        >
          <View style={styles.titleLeft}>
            {isVerified && (
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="verified_user"
                size={18}
                color="#0D72EA"
              />
            )}
            <CustomText
              label={`${isVerified ? "VERIFIED " : ""}${roleLabel}`}
              fontSize={12}
              fontFamily={fonts.medium}
              color={COLORS.gray64}
              numberOfLines={1}
            />
          </View>
          <View style={styles.scoreBadge}>
            <GlassFill fill="rgba(255, 255, 255, 0.16)" />
            <CustomText
              label={`${profile?.compatibilityScore || 0}%`}
              fontSize={14}
              fontFamily={fonts.semiBold}
              letterSpacing={-0.14}
              color={COLORS.gray64}
            />
          </View>
        </View>

        {/* Name · place · job · views · bio · industries */}
        <View
          pointerEvents="none"
          style={[styles.info, { bottom: infoBottomOffset }]}
        >
          {infoItems.map((item, index) => {
            const prev = infoItems[index - 1];
            return (
              <View
                key={item.key}
                style={[
                  styles.infoItem,
                  prev && {
                    marginTop:
                      capGap(
                        12 + prev.inset + item.inset,
                        prev.fontSize,
                        item.fontSize,
                      ),
                  },
                ]}
              >
                {item.node}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Next profile, drawn exactly under the current card (same size and
          position, no scale / offset), so no pile is ever visible: it only
          shows through while the top card is dragged or flies away, instead
          of a black screen. Stable key, only its content changes. */}
      {nextProfile && (
        <View
          key="next-card"
          pointerEvents="none"
          style={[styles.cardWrapper, styles.nextCard]}
        >
          {renderCard(nextProfile, false)}
        </View>
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

      {/* Figma "Icons rt": rewind · nope · super like · like · boost */}
      <View
        pointerEvents="box-none"
        style={[styles.actionsRow, { bottom: actionsBottom }]}
      >
        {ACTION_BUTTONS.map((item, index) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => handleButtonPress(index)}
            activeOpacity={0.8}
            style={[
              styles.actionRing,
              {
                width: item.size,
                height: item.size,
                borderColor: item.color,
              },
            ]}
          >
            <View style={[styles.actionFill, { backgroundColor: item.color }]}>
              {/* rotation on a wrapper View: a transform on the icon's Text
                  is not reliably kept on iOS (Fabric), which flipped the
                  nope / super like arrows back to pointing right */}
              <View
                style={[
                  {
                    width: item.iconSize,
                    height: item.iconSize,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  item.rotate && { transform: [{ rotate: item.rotate }] },
                ]}
              >
                {/* centre the glyph's outline (measured from the font) before
                    rotating, so each arrow sits centred whichever way it
                    points */}
                <View
                  style={{
                    transform: [
                      {
                        translateX:
                          (0.5 - (GLYPH_CENTER_X[item.icon] ?? 0.5)) *
                          item.iconSize,
                      },
                      // the glyph lands 0.1em low in its box on iOS
                      // (measured on all five buttons)
                      { translateY: -0.1 * item.iconSize },
                    ],
                  }}
                >
                  <Icons
                    family="MaterialSymbolsRoundedFilled"
                    name={item.icon}
                    size={item.iconSize}
                    color="#121212"
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipe glow — Figma like state: nav container (32 above the bar to
          the bottom) filled clear → colour 24% at 64% → colour */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            height: navClearance + 32,
            opacity: gradientOpacity,
            transform: [{ translateY: gradientTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={glowStops(currentGradientColors[0])}
          locations={[0, 0.64, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export default MatchCard;

const COUNTRY_CODES = COUNTRIES.reduce((map, item) => {
  if (item?.name && item?.code) map[item.name.toLowerCase()] = item.code;
  return map;
}, {});
const countryToCode = (country) => {
  if (!country || typeof country !== "string") return "";
  const trimmed = country.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  return COUNTRY_CODES[trimmed.toLowerCase()] || trimmed;
};

// predicted match: the swiped card settles back under "It's a match"
const MATCH_SETTLE = { friction: 7, tension: 60, useNativeDriver: false };

// Figma: place / job glyphs (12) are #EBEAEC
const META_ICON_COLOR = "#EBEAEC";

// Figma "Frame 2085664017…21": 1px ring in the button colour, 4 padding,
// inner disc with a 1px white 16% inside stroke, #121212 Material glyph
const ACTION_BUTTONS = [
  { key: "rewind", color: "#FF4B4B", size: 48, icon: "fast_rewind", iconSize: 24 },
  { key: "nope", color: "#F41857", size: 56, icon: "play_arrow", iconSize: 40, rotate: "180deg" },
  { key: "superlike", color: "#007AFF", size: 64, icon: "play_arrow", iconSize: 40, rotate: "-90deg" },
  { key: "like", color: "#1ED760", size: 56, icon: "play_arrow", iconSize: 40 },
  { key: "boost", color: "#8400E7", size: 48, icon: "bolt", iconSize: 24 },
];

// Horizontal centre of each glyph's outline as a fraction of its em box,
// read from MaterialSymbolsRoundedFilled.ttf (vertically they are centred in
// the font's 1.2em line box). play_arrow is drawn 4.4% right of centre, which
// the 180° / −90° rotations turned into a left / up offset.
const GLYPH_CENTER_X = {
  play_arrow: 0.5443,
  fast_rewind: 0.5167,
  bolt: 0.4952,
};

const hexAlpha = (hex, alpha) =>
  typeof hex === "string" && /^#[0-9a-f]{6}$/i.test(hex)
    ? `${hex}${alpha}`
    : "transparent";

const glowStops = (base) => [
  hexAlpha(base, "00"),
  hexAlpha(base, "3D"), // 24%
  hexAlpha(base, ""),
];

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  cardWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#121212",
    overflow: "hidden",
  },
  currentCard: {
    zIndex: 2,
  },
  nextCard: {
    zIndex: 1,
  },
  hidden: {
    opacity: 0,
  },
  card: {
    flex: 1,
    overflow: "hidden",
  },
  barsRow: {
    position: "absolute",
    left: CARD_PAD_H,
    right: CARD_PAD_H,
    height: BARS_HEIGHT,
    flexDirection: "row",
    gap: 6,
  },
  bar: {
    flex: 1,
    height: BARS_HEIGHT,
    borderRadius: 100,
    overflow: "hidden",
  },
  barFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.white,
  },
  titlesRow: {
    position: "absolute",
    left: CARD_PAD_H,
    right: CARD_PAD_H,
    height: TITLES_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 8,
  },
  scoreBadge: {
    height: TITLES_HEIGHT,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    position: "absolute",
    left: INFO_PAD_H,
    right: INFO_PAD_H,
    alignItems: "center",
  },
  infoItem: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    maxWidth: "100%",
  },
  shrink: {
    flexShrink: 1,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  chip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ACTIONS_HEIGHT,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  actionRing: {
    borderRadius: 100,
    borderWidth: 1,
    padding: 4,
  },
  actionFill: {
    flex: 1,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
  },
});
