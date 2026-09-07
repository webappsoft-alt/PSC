import { Images } from "../assets/images";
import ProgressiveBlur from "./ProgressiveBlur";
import { COLORS } from "../utils/COLORS";
import { BlurView } from "@react-native-community/blur";
import React, { useRef, useState } from "react";
import Video from "react-native-video";
import {Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated} from "react-native";
import CustomText from "./CustomText";
import type { TextOverlayDecoration } from "@/components/VideoTrimmer";

import fonts from "../assets/fonts";
import Text from "./ScaledText";

export type Media = {
  uri: string;
  type: "image" | "video";
};

type Props = {
  images?: Media[];
  onAdd?: () => void;
  loading?: boolean;
  canDelete?: boolean;
  isUploader?: boolean;
  aspectRatio: "9:16" | "16:9";
  onDelete?: (uri: string) => void;
  textOverlay?:
    | {
        text: string;
        color: string;
        fontSize: number;
        fontStyle: "normal" | "italic";
        fontFamily?: string;
        textDecoration: TextOverlayDecoration;
        textAlign: "center" | "left" | "right";
        fontWeight: "400" | "700";
        hasBackground?: boolean;
        backgroundColor?: string;
        position: { x: number; y: number };
      }
    | Array<{
        text: string;
        color: string;
        fontSize: number;
        fontStyle: "normal" | "italic";
        fontFamily?: string;
        textDecoration: TextOverlayDecoration;
        textAlign: "center" | "left" | "right";
        fontWeight: "400" | "700";
        hasBackground?: boolean;
        backgroundColor?: string;
        position?: { x: number; y: number };
      }>;
};

const PHONE_WIDTH = 220;
const PHONE_HEIGHT_9_16 = 390;
const PHONE_HEIGHT_16_9 = 260;

const StoryPreview: React.FC<Props> = ({
  onAdd,
  onDelete,
  isUploader,
  aspectRatio,
  images = [],
  loading = false,
  canDelete = false,
  textOverlay,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const phoneHeight =
    aspectRatio === "9:16" ? PHONE_HEIGHT_9_16 : PHONE_HEIGHT_16_9;
  const theme = {
    background: COLORS.black,
    cardBackground: COLORS.white16,
    text: COLORS.white,
    textSecondary: COLORS.gray,
    textTertiary: COLORS.gray2,
    border: COLORS.gray5,
    borderLight: COLORS.white04,
  };

  const showPagination = images.length > 1;
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / PHONE_WIDTH);
    setCurrentIndex(Math.min(index, images.length - 1));
  };

  const handleThumbnailPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * PHONE_WIDTH,
      animated: true,
    });
    setCurrentIndex(index);
  };

  // Calculate scaling for text overlay
  // The original text overlay was on a screen with SCREEN_WIDTH
  // We need to scale it to PHONE_WIDTH
  const SCREEN_WIDTH = 375; // Default assumption if not provided, but better to get it from Dimensions
  const scale = PHONE_WIDTH / SCREEN_WIDTH;
  const overlays = Array.isArray(textOverlay)
    ? textOverlay
    : textOverlay
    ? [textOverlay]
    : [];

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={[styles.outerBorder, { borderColor: theme.borderLight }]}>
          {loading && (
            <View style={styles.loader}>
              <CustomText
                textAlign="center"
                alignSelf="center"
                label="Uploading..."
                fontFamily={Fonts.medium}
              />
            </View>
          )}
          <View
            style={{
              position: "relative",
              width: PHONE_WIDTH,
              height: phoneHeight,
            }}
          >
            <Animated.ScrollView
              horizontal
              pagingEnabled
              ref={scrollViewRef}
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false },
              )}
              scrollEventThrottle={16}
              style={{ width: PHONE_WIDTH, height: phoneHeight }}
            >
              {images.map((item, index) => (
                <View
                  key={`${item.uri}-${index}`}
                  style={[styles.phoneFrame, { height: phoneHeight }]}
                >
                  {item.type === "video" ? (
                    <Video
                      source={{ uri: item.uri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                      muted
                      repeat
                      shouldPlay
                    />
                  ) : (
                    <Image
                      source={{ uri: item.uri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  )}

                  {overlays.map((overlay, oIdx) => {
                    const pos = overlay.position ?? { x: 0, y: 0 };
                    if (!overlay.text || overlay.text.trim().length === 0)
                      return null;
                    return (
                      <View
                        key={`${item.uri}-${index}-overlay-${oIdx}`}
                        style={[
                          styles.textOverlay,
                          {
                            transform: [
                              { translateX: pos.x * scale },
                              { translateY: pos.y * scale },
                            ],
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: overlay.color,
                            fontSize: overlay.fontSize * scale,
                            fontStyle: overlay.fontStyle,
                            fontFamily: overlay.fontFamily || fonts.bold,
                            textDecorationLine: overlay.textDecoration,
                            textAlign: overlay.textAlign,
                            fontWeight: overlay.fontWeight,
                            backgroundColor: overlay.hasBackground
                              ? overlay.backgroundColor || "transparent"
                              : "transparent",
                            paddingHorizontal: overlay.hasBackground ? 8 : 0,
                            paddingVertical: overlay.hasBackground ? 6 : 0,
                            borderRadius: overlay.hasBackground ? 12 : 0,
                          }}
                        >
                          {overlay.text}
                        </Text>
                      </View>
                    );
                  })}

                  {images?.length === 1 ? (
                    <View style={styles.previewOverlay}>
                      <ProgressiveBlur
                        intensity={40}
                        direction="bottom"
                        tint="dark"
                        height={120}
                        style={styles.blurBottom}
                      >
                        <Text style={styles.previewText}>Preview</Text>
                      </ProgressiveBlur>
                    </View>
                  ) : null}
                </View>
              ))}
            </Animated.ScrollView>

            {/* Fixed Delete Button - Outside ScrollView */}
            {images?.length && canDelete ? (
              <BlurView tint="light" intensity={20} style={styles.deleteButton}>
                <TouchableOpacity
                  onPress={() => onDelete?.(images[currentIndex]?.uri)}
                >
                  <Image
                    source={Images.delete}
                    style={{ width: 12, height: 15, tintColor: "#FFFFFF" }}
                  />
                </TouchableOpacity>
              </BlurView>
            ) : null}

            {/* Fixed Pagination Overlay - Outside ScrollView */}
            {showPagination && (
              <View style={styles.previewOverlay}>
                <ProgressiveBlur
                  intensity={40}
                  direction="bottom"
                  tint="dark"
                  height={60}
                  style={styles.blurBottom}
                >
                  <View style={styles.paginationContainer}>
                    {images.map((_, index) => {
                      const inputRange = [
                        (index - 1) * PHONE_WIDTH,
                        index * PHONE_WIDTH,
                        (index + 1) * PHONE_WIDTH,
                      ];

                      const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 32, 8],
                        extrapolate: "clamp",
                      });

                      const backgroundColor = scrollX.interpolate({
                        inputRange,
                        outputRange: ["#FFFFFF7A", "#FFFFFF", "#FFFFFF7A"],
                        extrapolate: "clamp",
                      });

                      return (
                        <Animated.View
                          key={index}
                          style={[
                            styles.dot,
                            {
                              width: dotWidth,
                              backgroundColor,
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                </ProgressiveBlur>
              </View>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.ratioButton, { backgroundColor: theme.text }]}
      >
        <Text style={[styles.ratioText, { color: theme.background }]}>
          9:16 ratio
        </Text>
      </TouchableOpacity>

      {isUploader && (
        <View style={styles.galleryContainer}>
          <View style={styles.outer}>
            <TouchableOpacity style={styles.addPic} onPress={onAdd}>
              <Image
                source={Images.camera1}
                style={{ width: 20, height: 20, tintColor: "#FFFFFF" }}
              />
              <CustomText
                fontSize={8}
                marginTop={4}
                label="Add more"
                textAlign={"center"}
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            style={styles.thumbnailScroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: "center" }}
          >
            {images.map((item, index) => (
              <TouchableOpacity
                key={`thumb-${item.uri}-${index}`}
                onPress={() => handleThumbnailPress(index)}
                style={[
                  styles.thumbnail,
                  currentIndex === index && styles.activeThumbnail,
                ]}
              >
                {item.type === "video" ? (
                  <Video
                    source={{ uri: item.uri }}
                    style={styles.thumbnailImage}
                    resizeMode={"cover"}
                    muted
                    paused={true}
                  />
                ) : (
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default StoryPreview;
const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  loader: {
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  phoneFrame: {
    width: PHONE_WIDTH,
    backgroundColor: "#000",
    borderRadius: 14,
    overflow: "hidden",
  },
  blurBottom: {
    width: "100%",
  },
  previewOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  textOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  previewText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 10,
    fontFamily: fonts.bold,
  },

  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    padding: 4,
    borderRadius: 100,
    borderColor: "#FFFFFF29",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 100,
    backgroundColor: "#FFFFFF7A",
  },
  activeDot: {
    width: 32,
    height: 8,
    backgroundColor: "#FFFFFF",
  },

  ratioButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
  },

  ratioText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    fontWeight: "600",
  },

  outerBorder: {
    padding: 4,
    borderWidth: 3,
    borderColor: COLORS.gray5,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  galleryContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 30,
  },

  thumbnailScroll: {
    flex: 1,
  },

  thumbnail: {
    marginRight: 8,
  },
  activeThumbnail: {
    borderColor: "#fff",
    borderRadius: 12,
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  thumbnailImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },

  addPic: {
    width: 62,
    height: 62,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 10,
    borderColor: "#FFFFFF0A",
  },
  outer: {
    borderWidth: 1,
    borderRadius: 12,
    width: 68,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#FFFFFF0A",
  },
  deleteButton: {
    padding: 8,
    width: 36,
    height: 36,
    position: "absolute",
    top: 10,
    right: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 18,
    overflow: "hidden",
    borderColor: "#FFFFFF29",
  },
  previewBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "#007AFF", // blue
    justifyContent: "center",
    alignItems: "center",
  },
});
