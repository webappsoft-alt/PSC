import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";

import CustomModal from "./CustomModal";

import { BlurView } from "@react-native-community/blur";
import { Images } from "../assets/images";

const { width, height } = Dimensions.get("window");

const ImageFast = forwardRef(
  (
    {
      source,
      style,
      resizeMode,
      isView,
      loading,
      children,
      onPress,
      hitSlop,
      removeLoading,
      tintColor, // optional tint
    },
    ref,
  ) => {
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isViewModal, setIsViewModal] = useState(false);

    useImperativeHandle(ref, () => ({
      showModal: () => setIsViewModal(true),
      hideModal: () => setIsViewModal(false),
    }));

    const SkeletonLoader = () => {
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

      const interpolatedBackground = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ["#e0e0e0", "#c0c0e0"],
      });

      return (
        <View style={styles.skeletonContainer}>
          <Animated.View
            style={[
              styles.skeleton,
              { backgroundColor: interpolatedBackground },
            ]}
          />
          <Animated.View
            style={[
              styles.skeleton,
              styles.skeletonShort,
              { backgroundColor: interpolatedBackground },
            ]}
          />
          <Animated.View
            style={[
              styles.skeleton,
              { backgroundColor: interpolatedBackground },
            ]}
          />
        </View>
      );
    };

    return (
      <TouchableOpacity
        hitSlop={hitSlop}
        onPress={isView ? () => setIsViewModal(true) : onPress}
        activeOpacity={0.6}
        disabled={!isView && !onPress}
        style={[
          style,
          { overflow: "hidden" },
          (loading || isImageLoading) && styles.centered,
        ]}
      >
        {isViewModal && (
          <CustomModal
            isBlur
            isVisible={isViewModal}
            onDisable={() => setIsViewModal(false)}
          >
            <TouchableOpacity
              activeOpacity={0.6}
              style={[
                styles.icon,
                {
                  height: 32,
                  width: 32,
                  borderRadius: 99,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
              onPress={() => setIsViewModal(false)}
            >
              <BlurView
                blurType="light"
                blurAmount={16}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 16,
                }}
              />

              <Image source={Images.cross} style={{ width: 18, height: 18 }} />
            </TouchableOpacity>

            <FastImage
              onLoadStart={() => setIsImageLoading(true)}
              onLoadEnd={() => setIsImageLoading(false)}
              source={source}
              resizeMode="contain"
              style={{ width: width, height: height - 70 }}
            />
          </CustomModal>
        )}
        <FastImage
          onLoadStart={
            removeLoading ? undefined : () => setIsImageLoading(true)
          }
          onLoadEnd={removeLoading ? undefined : () => setIsImageLoading(false)}
          source={source}
          resizeMode={resizeMode}
          style={[
            { width: "100%", height: "100%" },
            tintColor ? { tintColor } : null,
          ]}
        >
          <View style={styles.absoluteFill}>{children}</View>
        </FastImage>
        {loading || isImageLoading ? (
          <View style={styles.absoluteFill}>
            <SkeletonLoader />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  absoluteFill: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  icon: {
    alignSelf: "flex-end",
    marginBottom: -50,
    marginRight: 10,
    top: Platform.OS === "ios" ? 50 : 0,
    zIndex: 999,
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  skeleton: {
    width: "100%",
    height: "100%",
  },
  skeletonShort: {
    width: "100%",
    height: "100%",
  },
});

export default ImageFast;
