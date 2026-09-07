import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import { PNGIcons } from "../../../../assets/images/icons";
import Blur from "../../../../components/Blur";
import CustomText from "../../../../components/CustomText";
import Divider from "../../../../components/Divider";
import ImageFast from "../../../../components/ImageFast";
import { post } from "../../../../services/ApiRequest";
import { removeCard } from "../../../../store/reducer/MatchingSlice";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MatchDetailCard = ({ isCross, item, scrollY }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sliderAnimation = useRef(new Animated.Value(0)).current;

  const imagesToDisplay =
    item?.profile?.matchingImages?.length > 0
      ? item.profile.matchingImages
      : item?.profile?.avatar
      ? [item.profile.avatar]
      : [];

  const hasImages = imagesToDisplay.length > 0;
  const profileColor = item?.profile?.profileColor || COLORS.gray48;

  // Auto-advance slider every 3 seconds
  useEffect(() => {
    if (imagesToDisplay.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagesToDisplay.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [imagesToDisplay.length]);

  // Start slider animation when image changes
  useEffect(() => {
    if (imagesToDisplay.length <= 1) return;
    sliderAnimation.setValue(0);
    Animated.timing(sliderAnimation, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
  }, [currentImageIndex, imagesToDisplay.length]);

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

  const age = calculateAge(item?.dob);
  const insets = useSafeAreaInsets();

  const headerRowOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, insets.top + 80],
        outputRange: [1, 0],
        extrapolate: "clamp",
      })
    : 1;

  const checkCountAndAlert = (type) => {
    if (type === "dislike" || type === "like") return true;
    const keyMap = { superlike: "supperLikes" };
    const backendKey = keyMap[type];
    if (!backendKey) return true;
    const count =
      userData?.[backendKey] ?? userData?.profile?.[backendKey] ?? 0;
    if (count <= 0) {
      Alert.alert(
        "No more Super Likes",
        "You have no more Super Likes left. Would you like to buy more?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Buy More", onPress: () => navigation.navigate("Plans") },
        ],
      );
      return false;
    }
    return true;
  };

  const handleInteraction = async (type, profileId) => {
    try {
      let body = { toUser: profileId, interactionType: type };
      if (type === "superlike") {
        const backendKey = "supperLikes";
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
      await post("matching/interactions", body);
    } catch (error) {
      console.error(`Error with ${type} interaction:`, error);
    }
  };

  const handleButtonPress = async (index) => {
    const profileId = item._id || item.id;
    if (!profileId) return;
    let interactionType;
    switch (index) {
      case 0:
        interactionType = "dislike";
        break;
      case 1:
        interactionType = "superlike";
        break;
      case 2:
        interactionType = "like";
        break;
      default:
        return;
    }
    if (!checkCountAndAlert(interactionType)) return;

    dispatch(removeCard());
    navigation.goBack();

    handleInteraction(interactionType, profileId)
      .then(() => {
        const messages = {
          dislike: "Profile passed",
          superlike: "Super Like sent!",
          like: "Profile liked!",
        };
        ToastMessage(messages[interactionType] || "Action successful");
      })
      .catch((error) => {
        console.error("Interaction failed:", error);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <View
          style={[
            styles.imageContainer,
            !hasImages && { backgroundColor: profileColor },
          ]}
        >
          {hasImages ? (
            <ImageFast
              source={{ uri: imagesToDisplay[currentImageIndex] }}
              style={styles.image}
              removeLoading
            />
          ) : (
            <View style={styles.image} />
          )}
          <View style={styles.overlay} pointerEvents="none" />

          <View style={styles.innerContainer} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.headerRow,
                { marginTop: insets.top, opacity: headerRowOpacity },
              ]}
              pointerEvents="box-none"
            >
              <View style={styles.row}>
                <Image
                  source={Images.verifiedBadge}
                  style={styles.verifyStar}
                />
                <CustomText
                  label={item?.profile?.category?.toUpperCase() || "MEMBER"}
                  fontSize={12}
                  marginLeft={8}
                  fontFamily={fonts.medium}
                  color={COLORS.white}
                />
              </View>

              {isCross ? (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.crossBtn}
                >
                  <Blur />
                  <Image
                    source={Images.cross}
                    style={{ height: 20, width: 20 }}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.bg}>
                  <CustomText
                    label={`${item?.compatibilityScore || 0}%`}
                    fontFamily={fonts.semiBold}
                    color={COLORS.white}
                  />
                </View>
              )}
            </Animated.View>

            <View pointerEvents="box-none">
              <CustomText
                label={`${item?.firstName || ""} ${age ? `, ${age}` : ""}`}
                fontSize={40}
                fontFamily={fonts.bold}
                color={COLORS.white}
              />

              <View style={styles.locationRow}>
                <Image source={PNGIcons.pin} style={styles.pinIcon} />
                <CustomText
                  label={
                    item?.location?.city
                      ? `${item.location.city}, ${item.location.country}`
                      : "Unknown Location"
                  }
                  fontSize={12}
                  fontFamily={fonts.medium}
                  marginLeft={3}
                  color={COLORS.white}
                />
                {item?.distance !== undefined && (
                  <CustomText
                    label={`${item.distance} km`}
                    fontSize={12}
                    color={COLORS.gray64}
                    fontFamily={fonts.medium}
                    marginLeft={4}
                  />
                )}
              </View>

              <CustomText
                label={`${item?.profileViews || 0} total Profile View${
                  item?.profileViews === 1 ? "" : "s"
                }`}
                fontSize={11}
                fontFamily={fonts.medium}
                marginTop={8}
                color={COLORS.white}
              />

              <View style={styles.genreRow}>
                {item?.industry?.length > 0 &&
                  item?.industry?.slice(0, 3)?.map((genre, index) => (
                    <View key={index} style={styles.genrePill}>
                      <Blur />
                      <CustomText
                        label={genre}
                        fontFamily={fonts.medium}
                        fontSize={12}
                        textTransform="capitalize"
                        color={COLORS.white}
                      />
                    </View>
                  ))}
              </View>

              {item?.profile?.bio && (
                <View style={styles.footerRow}>
                  <CustomText
                    label={item?.profile?.bio || "No bio available."}
                    fontSize={12}
                    fontFamily={fonts.medium}
                    color={COLORS.white}
                  />
                </View>
              )}

              {/* Dynamic Slider */}
              {hasImages && imagesToDisplay.length > 1 && (
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderTrack}>
                    {imagesToDisplay.map((_, index) => (
                      <View key={index} style={styles.block}>
                        {index === currentImageIndex && (
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
                        {index < currentImageIndex && (
                          <View
                            style={[
                              StyleSheet.absoluteFill,
                              { backgroundColor: COLORS.white },
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
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={() => handleButtonPress(0)}
          activeOpacity={0.8}
        >
          <ImageFast
            source={PNGIcons.btn2}
            removeLoading
            style={styles.btnStyle}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleButtonPress(1)}
          activeOpacity={0.8}
        >
          <ImageFast
            source={PNGIcons.btn3}
            removeLoading
            style={styles.btnStyle}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleButtonPress(2)}
          activeOpacity={0.8}
        >
          <ImageFast
            source={PNGIcons.btn4}
            removeLoading
            style={styles.btnStyle}
          />
        </TouchableOpacity>
      </View>
      <Divider marginTop={18} />
    </View>
  );
};

export default MatchDetailCard;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  cardWrapper: {
    width: "100%",
  },
  imageContainer: {
    height: Platform.OS === "ios" ? screenHeight * 0.56 : screenHeight * 0.55,
    width: "100%",
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  innerContainer: {
    padding: 16,
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
  crossBtn: {
    height: 32,
    width: 32,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 99,
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
    marginBottom: 5,
  },
  forwardIcon: {
    height: 28,
    width: 28,
    tintColor: COLORS.gray64,
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    marginTop: 20,
    paddingHorizontal: 40,
    width: "70%",
    alignSelf: "center",
  },
  btnStyle: {
    height: 56,
    width: 56,
    resizeMode: "contain",
  },
  sliderContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 10,
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
    backgroundColor: "#FFFFFF17",
    borderRadius: 99,
    overflow: "hidden",
  },
});
