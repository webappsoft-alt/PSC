import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import { getPalette } from "@somesoap/react-native-image-palette";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import LinearGradient from "react-native-linear-gradient";
import { COLORS } from "../utils/COLORS";
import ImageFast from "./ImageFast";
import Blur from "./Blur";

const ArtistDetailCard = ({ images }) => {
  const navigation = useNavigation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [bgColor, setBgColor] = useState("");
  const scrollViewRef = useRef(null);

  const screenWidth = Dimensions.get("window").width;

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateCard = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const uri = images?.length > 0 ? images[selectedIndex] : null;
    if (!uri) return;
    getPalette(uri)
      .then((palette) => {
        if (palette?.vibrant) setBgColor(palette.vibrant);
      })
      .catch(() => {});
  }, [images, selectedIndex]);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setScrollOffset(contentOffsetX);
    const index = Math.round(contentOffsetX / screenWidth);
    if (index !== selectedIndex && index >= 0 && index < images?.length) {
      setSelectedIndex(index);
    }
  };

  const cardRotation = rotateCard.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ["-15deg", "0deg", "15deg"],
  });

  return (
    <View>
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
        <View style={{ alignItems: "center", width: screenWidth }}>
          {/* Ambient Background */}
          {images?.[selectedIndex] && (
            <View
              pointerEvents="none"
              style={[
                styles.glowShadowContainer,
                {
                  height: 390,
                  width: screenWidth,
                  shadowColor: bgColor || "#FFFFFF",
                },
              ]}
            >
              <View style={styles.ambientWrapper}>
                <ImageFast
                  source={{ uri: images[selectedIndex] }}
                  style={{
                    height: 390,
                    width: screenWidth,
                  }}
                />
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType="dark"
                  blurAmount={10}
                />
              </View>
            </View>
          )}

          {/* Glow Effect */}
          <View
            pointerEvents="none"
            style={[
              styles.glowBg,
              {
                height: 390 * 0.8,
                top: 390 * 0.1,
              },
            ]}
          />

          {/* Swipable Carousel */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled={true}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={screenWidth}
            snapToAlignment="start"
            disableIntervalMomentum={true}
            style={{ width: screenWidth }}
          >
            {images?.map((item, index) => (
              <View key={index} style={{ width: screenWidth }}>
                <ImageFast
                  source={{ uri: item }}
                  style={styles.imgStyle}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["#14141499", "#14141440", "transparent"]}
                  start={{ x: 0.5, y: 1 }}
                  end={{ x: 0.5, y: 0.3 }}
                  style={[styles.bottomGradient, { pointerEvents: "none" }]}
                />
              </View>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          {images?.length > 1 && (
            <View style={styles.rowSwipper}>
              {/* <Blur borderRadius={6} /> */}
              {images.map((img, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === selectedIndex
                      ? [
                          styles.activeIndicator,
                          { backgroundColor: COLORS.white },
                        ]
                      : styles.inactiveIndicator,
                    index === selectedIndex && styles.activeWidth,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Bottom Indicators (Optional: keeping AuthSlider if needed for consistency with other parts) */}
        </View>
      </Animated.View>
    </View>
  );
};

export default ArtistDetailCard;

const styles = StyleSheet.create({
  cardWrapper: {
    width: "100%",
    height: 390,
  },
  imgStyle: {
    width: "100%",
    height: 390,
    resizeMode: "cover",
  },
  innerContainer: {
    justifyContent: "flex-end",
    flex: 1,
    padding: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  genrePill: {
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 4,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,

    overflow: "hidden",
  },
  gradientFill: {
    flex: 1,
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    padding: 12,
    gap: 20,
  },
  btnStyle: {
    resizeMode: "contain",
  },
  largeBtn: {
    height: 48,
    width: 48,
  },

  bottomGradient: {
    ...StyleSheet.absoluteFillObject,

    bottom: 0,
  },
  pinIcon: {
    height: 12,
    width: 12,
    tintColor: COLORS.white,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  glowShadowContainer: {
    position: "absolute",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 20,
  },
  ambientWrapper: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  glowBg: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 12,
    opacity: 0.8,
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 50,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    paddingHorizontal: 12,
  },
  rowSwipper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: COLORS.white04,
    padding: 3,
    borderRadius: 99,
    overflow: "hidden",
  },
  indicator: {
    height: 6,
    borderRadius: 99,
  },
  activeWidth: {
    width: 30,
  },
  activeIndicator: {
    width: 30,
  },
  inactiveIndicator: {
    width: 6,
    backgroundColor: COLORS.gray48,
  },
});
