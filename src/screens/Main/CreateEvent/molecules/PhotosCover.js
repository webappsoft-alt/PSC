import { BlurView } from "@react-native-community/blur";
import { getPalette } from "@somesoap/react-native-image-palette";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import Blur from "../../../../components/Blur";
import CustomText from "../../../../components/CustomText";
import ErrorComponent from "../../../../components/ErrorComponent";
import ImageFast from "../../../../components/ImageFast";
import ProgressiveBlur from "../../../../components/ProgressiveBlur";
import UploadImageCustom from "../../../../components/UploadImageCustom";
import { COLORS } from "../../../../utils/COLORS";
import { isColorDark, uploadAndGetUrl } from "../../../../utils/constants";
import { useTheme } from "../../../../contexts/ThemeContext";
import AddImgBtn from "./AddImgBtn";

const { width: screenWidth } = Dimensions.get("window");

const ratioToNumber = {
  "1:1": 1,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

const ratioToCropSize = {
  "1:1": { width: 1000, height: 1000 },
  "16:9": { width: 1600, height: 900 },
  "9:16": { width: 900, height: 1600 },
};

const UploadSkeleton = () => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={{
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: colors.surfaceAlt,
        opacity,
      }}
    />
  );
};

const PhotosCover = ({ media, setMedia }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [type, setType] = useState("1:1");
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [imageModal, setImageModal] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [bgColor, setBgColor] = useState("");
  const [isImageDark, setIsImageDark] = useState(true);
  const cameraRef = useRef(null);
  const scrollViewRef = useRef(null);

  const aspectRatio = ratioToNumber[type];
  const cropSize = ratioToCropSize[type];

  const getImageHeight = () => {
    switch (type) {
      case "16:9":
        return (screenWidth - 24) * (9 / 16);
      case "9:16":
        return (screenWidth - 24) * (16 / 9);
      case "1:1":
      default:
        return screenWidth - 24;
    }
  };

  useEffect(() => {
    const uri = images.length > 0 ? images[selectedIndex] : null;
    if (!uri) return;
    getPalette(uri)
      .then((palette) => {
        if (palette?.vibrant) {
          setBgColor(palette.vibrant);
          setIsImageDark(isColorDark(palette.vibrant));
        }
      })
      .catch(() => {});
  }, [images, selectedIndex]);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setScrollOffset(contentOffsetX);
    const index = Math.round(contentOffsetX / (screenWidth - 24));
    if (index !== selectedIndex && index >= 0 && index < images.length) {
      setSelectedIndex(index);
    }
  };

  const getBorderRadiusStyle = (index) => {
    const cardWidth = screenWidth - 24;
    const scrollProgress = scrollOffset / cardWidth;
    const currentIndex = Math.round(scrollProgress);
    const isScrolling = Math.abs(scrollProgress - currentIndex) > 0.01;

    if (!isScrolling) {
      return { borderRadius: 16 };
    }

    if (index === Math.floor(scrollProgress)) {
      return {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 0,
      };
    } else if (index === Math.ceil(scrollProgress)) {
      return {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 16,
      };
    }

    return { borderRadius: 16 };
  };

  const handleChange = async (result) => {
    if (!result?.path) return;

    try {
      setUploading(true);

      const uploadedUrl = await uploadAndGetUrl(result);
      setImages((prev) => {
        const newArr = [...prev, uploadedUrl];
        if (newArr.length === 1) setSelectedIndex(0);
        return newArr;
      });

      setMedia((prev) => [
        ...prev,
        {
          url: uploadedUrl,
          size: type,
        },
      ]);
    } finally {
      setUploading(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setImgLoading(true);
      setUploading(true);

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: "quality",
      });

      if (photo?.path) {
        const fileObj = {
          uri: photo.path,
          type: "image/jpeg",
          name: "camera_photo.jpg",
        };

        const uploadedUrl = await uploadAndGetUrl(fileObj);

        setImages((prev) => [...prev, uploadedUrl]);

        setMedia((prev) => [
          ...prev,
          {
            url: uploadedUrl,
            size: type,
          },
        ]);
      }
    } finally {
      setUploading(false);
      setImgLoading(false);
      setImageModal(false);
    }
  };

  const handleDelete = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setMedia((prev) => prev.filter((_, i) => i !== index));

    if (index === selectedIndex) {
      setSelectedIndex(0);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, animated: true });
      }
    } else if (index < selectedIndex) {
      setSelectedIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (media.length > 0) {
      setMedia((prev) =>
        prev.map((item) => ({
          url: item.url,
          size: type,
        })),
      );
    }
  }, [type]);

  return (
    <View>
      <CustomText
        label="Photos Cover"
        fontSize={18}
        lineHeight={18 * 1.4}
        fontFamily={fonts.medium}
        color={colors.text}
        marginBottom={8}
      />
      {images.length === 0 && (
        <View>
          <TouchableOpacity
            onPress={() => setImageModal(true)}
            style={styles.cover}
          >
            {/* <Image source={Images.camera1} style={styles.cameraIcon} /> */}
          </TouchableOpacity>
          <ErrorComponent
            errorTitle={"Only .jpg .png . Maximum 2MB."}
            color={colors.iconMuted}
            marginBottom={9}
          />
        </View>
      )}
      {images.length > 0 && (
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          {/* Ambient Background */}
          {images[selectedIndex] && (
            <View
              style={[
                styles.glowShadowContainer,
                {
                  height: getImageHeight(),
                  width: screenWidth - 24,
                },
              ]}
            >
              <View style={styles.ambientWrapper}>
                <ImageFast
                  source={{ uri: images[selectedIndex] }}
                  style={{
                    height: getImageHeight(),
                    width: screenWidth - 24,
                    borderRadius: 16,
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

          {/* Swipable Carousel */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={screenWidth - 24}
            snapToAlignment="center"
            disableIntervalMomentum={true}
            style={{ width: screenWidth - 24, borderRadius: 16 }}
          >
            {images.map((imageUri, index) => (
              <View
                key={index}
                style={{
                  width: screenWidth - 24,
                  height: getImageHeight(),
                }}
              >
                <ImageFast
                  source={{ uri: imageUri }}
                  style={[
                    {
                      height: getImageHeight(),
                      width: screenWidth - 24,
                    },
                    getBorderRadiusStyle(index),
                  ]}
                  resizeMode="cover"
                />
                <View style={styles.topBlurContainer} pointerEvents="none">
                  <ProgressiveBlur
                    intensity={80}
                    direction="top"
                    tint={isImageDark ? "dark" : "light"}
                    height={60}
                    style={{
                      borderTopLeftRadius:
                        getBorderRadiusStyle(index).borderTopLeftRadius,
                      borderTopRightRadius:
                        getBorderRadiusStyle(index).borderTopRightRadius,
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                    }}
                  />
                </View>
                <View style={styles.bottomBlurContainer} pointerEvents="none">
                  <ProgressiveBlur
                    intensity={80}
                    direction="bottom"
                    tint={isImageDark ? "dark" : "light"}
                    height={60}
                    style={{
                      borderBottomLeftRadius:
                        getBorderRadiusStyle(index).borderBottomLeftRadius,
                      borderBottomRightRadius:
                        getBorderRadiusStyle(index).borderBottomRightRadius,
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                    }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Image Count Indicator */}

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.trashIconContainer}
            onPress={() => handleDelete(selectedIndex)}
          >
            <Blur />
            <Image source={Images.bin} style={styles.trashIcon} />
          </TouchableOpacity>
        </View>
      )}

      {/* Pagination Dots */}
      {images?.length > 1 && (
        <View style={styles.rowSwipper}>
          {images?.map((img, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === selectedIndex
                  ? [styles.activeIndicator, { backgroundColor: colors.text }]
                  : styles.inactiveIndicator,
                index === selectedIndex && styles.activeWidth,
              ]}
            />
          ))}
        </View>
      )}
      {images.length > 0 && (
        <View style={styles.tabsRow}>
          {["1:1", "16:9", "9:16"].map((item) => {
            const isActive = item === type;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setType(item)}
                activeOpacity={0.7}
              >
                <CustomText
                  label={`${item} ratio`}
                  fontSize={14}
                  fontFamily={fonts.medium}
                  color={isActive ? colors.text : colors.iconMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <View style={styles.thumbRow}>
        <AddImgBtn
          title={images.length ? "Add more" : "Add image"}
          onPress={() => setImageModal(true)}
        />

        {uploading && (
          <View style={{ marginLeft: 8 }}>
            <UploadSkeleton />
          </View>
        )}

        {images.length > 0 && (
          <FlatList
            horizontal
            data={images}
            keyExtractor={(_, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => {
                  scrollViewRef.current?.scrollTo({
                    x: index * (screenWidth - 24),
                    animated: true,
                  });
                }}
                style={[
                  styles.thumbWrapper,
                  index === selectedIndex && styles.thumbWrapperSelected,
                ]}
              >
                <ImageFast source={{ uri: item }} style={styles.thumbnail} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      <UploadImageCustom
        images={images}
        camera={cameraRef}
        onDelete={handleDelete}
        imageModal={imageModal}
        imgLoading={imgLoading}
        handleChange={handleChange}
        handleCapture={handleCapture}
        setImageModal={setImageModal}
        mediaType="photo"
        cropSize={cropSize}
      />
    </View>
  );
};

export default PhotosCover;

const createStyles = (colors) => StyleSheet.create({
  previewContainer: {
    width: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: colors.mode === "dark" ? "#1B1B1B" : colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },

  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 0,
  },

  thumbnail: {
    width: 58,
    height: 58,
    borderRadius: 8,
  },
  thumbWrapper: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.background,
    padding: 3,
    borderRadius: 12,
  },
  thumbWrapperSelected: {
    borderColor: colors.text,
  },

  thumbRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  listContent: {
    paddingLeft: 12,
  },

  trashIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    height: 36,
    width: 36,
    overflow: "hidden",
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  trashIcon: {
    width: 20,
    height: 20,
    tintColor: colors.text,
  },
  cover: {
    width: "100%",
    height: 351,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: colors.mode === "dark" ? "#1B1B1B" : colors.border,
    overflow: "hidden",
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  glowShadowContainer: {
    position: "absolute",
    borderRadius: 16,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 20,
  },
  ambientWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
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
  countBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  rowSwipper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
    alignSelf: "center",
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
    backgroundColor: colors.iconMuted,
  },
  topBlurContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    overflow: "hidden",
    zIndex: 1,
  },
  bottomBlurContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    overflow: "hidden",
    zIndex: 1,
  },
});
