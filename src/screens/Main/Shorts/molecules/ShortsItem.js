import React, { memo, useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Image,
  Dimensions,
  PanResponder,
} from "react-native";
import Video from "react-native-video";
import LinearGradient from "react-native-linear-gradient";
import ImageFast from "../../../../components/ImageFast";
import CustomText from "../../../../components/CustomText";
import Blur from "../../../../components/Blur";
import { Images } from "../../../../assets/images";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import LeftBottomOverlay from "./LeftBottomOverlay";
import RightBottomOverlay from "./RightBottomOverlay";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const ShortsItem = ({
  item,
  index,
  currentIndex,
  activeFocus,
  navigation,
  onCommentPress,
  onSharePress,
  localCommentCount,
  insetsBottom,
  overlayAnim,
  overlayVisible,
  toggleOverlay,
}) => {
  const isCurrentVideo = index === currentIndex;
  const itemId = item._id || item.id;
  const videoUri = item.video || item.uri;
  const shouldPause = !isCurrentVideo || !activeFocus;

  const [isLoading, setIsLoading] = useState(false);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const videoRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scrubberWidthRef = useRef(0);
  const durationRef = useRef(0);

  // Sync progress animation with video progress
  const handleProgress = useCallback(
    (data) => {
      if (durationRef.current > 0 && !isScrubbing) {
        const progress = (data.currentTime / durationRef.current) * 100;
        progressAnim.setValue(progress);
      }
    },
    [isScrubbing, progressAnim],
  );

  const handleLoad = useCallback((data) => {
    setIsLoading(false);
    const d = typeof data?.duration === "number" ? data.duration : 0;
    if (d > 0) {
      durationRef.current = d;
    }
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleToggleRepeat = useCallback(() => {
    setIsRepeatEnabled((prev) => !prev);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsScrubbing(true);
        if (scrubberWidthRef.current > 0 && durationRef.current > 0) {
          const touchX = evt.nativeEvent.locationX;
          const clampedX = Math.max(
            0,
            Math.min(touchX, scrubberWidthRef.current),
          );
          const progress = (clampedX / scrubberWidthRef.current) * 100;
          progressAnim.setValue(progress);
        }
      },
      onPanResponderMove: (evt) => {
        if (scrubberWidthRef.current > 0 && durationRef.current > 0) {
          const touchX = evt.nativeEvent.locationX;
          const clampedX = Math.max(
            0,
            Math.min(touchX, scrubberWidthRef.current),
          );
          const progress = (clampedX / scrubberWidthRef.current) * 100;
          const seekTime =
            (clampedX / scrubberWidthRef.current) * durationRef.current;
          progressAnim.setValue(progress);
          if (videoRef.current) {
            videoRef.current.seek(seekTime);
          }
        }
      },
      onPanResponderRelease: (evt) => {
        if (scrubberWidthRef.current > 0 && durationRef.current > 0) {
          const touchX = evt.nativeEvent.locationX;
          const clampedX = Math.max(
            0,
            Math.min(touchX, scrubberWidthRef.current),
          );
          const seekTime =
            (clampedX / scrubberWidthRef.current) * durationRef.current;
          if (videoRef.current) {
            videoRef.current.seek(seekTime);
          }
        }
        setIsScrubbing(false);
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
      },
    }),
  ).current;

  // Reset progress when index changes
  useEffect(() => {
    if (isCurrentVideo) {
      progressAnim.setValue(0);
    }
  }, [isCurrentVideo, progressAnim]);

  return (
    <View style={styles.videoContainer}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleOverlay}
        style={styles.videoTouchable}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          resizeMode={item?.size == "16:9 ratio" ? "cover" : "contain"}
          repeat={isRepeatEnabled}
          paused={shouldPause}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onProgress={handleProgress}
          progressUpdateInterval={100} // Increased interval for performance, can be lower if needed
          onError={(error) => {
            console.error("Video Error:", error);
            setIsLoading(false);
          }}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="obey"
          bufferConfig={{
            minBufferMs: 2500,
            maxBufferMs: 10000,
            bufferForPlaybackMs: 1000,
            bufferForPlaybackAfterRebufferMs: 1500,
          }}
          poster={item.thumbnail}
          posterResizeMode="cover"
          shutterColor="transparent"
        />
      </TouchableOpacity>

      {/* ── Username tag (top-right) ── */}
      <Animated.View
        style={[styles.usernameTag, { opacity: overlayAnim }]}
        pointerEvents={overlayVisible ? "auto" : "none"}
      >
        <ImageFast
          source={Images.linked}
          style={styles.linkedIcon}
          onPress={() => navigation.navigate("SearchScreen")}
        />
        <CustomText
          label={item?.author?.username || "viktor.sola"}
          fontSize={12}
          color={COLORS.white}
          fontFamily={fonts.medium}
          onPress={() =>
            navigation.navigate("UserProfile", {
              userId: item?.author?._id,
            })
          }
        />
      </Animated.View>

      {/* ── Overlays ── */}
      <Animated.View
        style={{ opacity: overlayAnim }}
        pointerEvents={overlayVisible ? "auto" : "none"}
      >
        <LeftBottomOverlay item={item} />
        <RightBottomOverlay
          item={item}
          onCommentPress={onCommentPress}
          localCommentCount={localCommentCount}
          onSharePress={onSharePress}
          onVoteUpdate={() => {}}
        />
      </Animated.View>

      <LinearGradient
        colors={["rgba(18, 18, 18, 1)", "rgba(18, 18, 18, 0)"]}
        style={styles.topGradient}
        pointerEvents="none"
      />

      <LinearGradient
        colors={["rgba(60, 61, 55, 0)", "rgba(18, 18, 18, 1)"]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* ── Bottom input row ── */}
      <Animated.View
        style={[
          styles.inPutContainer,
          { bottom: insetsBottom },
          { opacity: overlayAnim },
        ]}
        pointerEvents={overlayVisible ? "auto" : "none"}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onCommentPress}
          style={styles.commentInputPlaceholder}
        >
          <Blur
            blurAmount={4}
            blurType="light"
            zIndex={0}
            pointerEvents="none"
          />
          <CustomText
            label={"Type message"}
            fontFamily={fonts.medium}
            fontSize={16}
            color={COLORS.gray48}
          />
        </TouchableOpacity>
        <View style={styles.rowOnly}>
          <TouchableOpacity onPress={handleToggleRepeat}>
            <Image
              source={Images.reloadReel}
              style={[
                styles.reloadIcon,
                { opacity: isRepeatEnabled ? 1 : 0.5 },
              ]}
            />
          </TouchableOpacity>

          {/* Custom Video Scrubber */}
          <View
            style={styles.scrubberContainer}
            onLayout={(e) =>
              (scrubberWidthRef.current = e.nativeEvent.layout.width)
            }
          >
            <View
              style={[
                styles.scrubberTrack,
                isScrubbing && styles.scrubberTrackScrubbing,
              ]}
            >
              <Animated.View
                style={[
                  styles.scrubberProgress,
                  isScrubbing && styles.scrubberProgressScrubbing,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
              <View
                style={styles.scrubberTouchArea}
                {...panResponder.panHandlers}
              >
                <Animated.View
                  style={[
                    styles.scrubberThumb,
                    isScrubbing && styles.scrubberThumbVisible,
                    {
                      left: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {isLoading && isCurrentVideo && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}
    </View>
  );
};

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.item?._id === nextProps.item?._id &&
    prevProps.currentIndex === nextProps.currentIndex &&
    prevProps.activeFocus === nextProps.activeFocus &&
    prevProps.localCommentCount === nextProps.localCommentCount &&
    prevProps.overlayVisible === nextProps.overlayVisible &&
    prevProps.overlayAnim === nextProps.overlayAnim
  );
};

export default memo(ShortsItem, areEqual);

const styles = StyleSheet.create({
  videoContainer: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: COLORS.black,
    position: "relative",
  },
  videoTouchable: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  usernameTag: {
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 16,
    marginRight: 12,
    position: "absolute",
    zIndex: 100,
    top: 130,
    right: 0,
  },
  linkedIcon: {
    height: 16,
    width: 16,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 1,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 1,
  },
  inPutContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999,
  },
  commentInputPlaceholder: {
    width: "100%",
    height: 48,
    backgroundColor: "transparent",
    borderRadius: 99,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  rowOnly: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  reloadIcon: {
    height: 24,
    width: 24,
  },
  scrubberContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 10,
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    position: "relative",
    overflow: "visible",
  },
  scrubberTrackScrubbing: {
    height: 8,
    borderRadius: 4,
  },
  scrubberProgress: {
    height: 4,
    backgroundColor: COLORS.white,
    borderRadius: 2,
    position: "absolute",
    left: 0,
    top: 0,
  },
  scrubberProgressScrubbing: {
    height: 8,
    borderRadius: 4,
  },
  scrubberTouchArea: {
    position: "absolute",
    top: -20,
    left: 0,
    right: 0,
    bottom: -20,
  },
  scrubberThumb: {
    width: 0,
    height: 0,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    position: "absolute",
    top: "50%",
    marginTop: -6,
    marginLeft: -6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  scrubberThumbVisible: {
    width: 12,
    height: 12,
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});
