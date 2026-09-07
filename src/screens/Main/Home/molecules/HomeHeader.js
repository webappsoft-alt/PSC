import { useNavigation } from "@react-navigation/native";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import {
  HomeBellSvg,
  HomeChatSvg,
  HomeSearchSvg,
} from "../../../../assets/svgs";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useSocket } from "../../../../components/SocketProvider";
import { COLORS } from "../../../../utils/COLORS";

const HomeHeader = ({ isShort, isHome, isLive, pagerProgress, onSetPage }) => {
  const navigation = useNavigation();
  const socket = useSocket();
  const { notificationDot } = useSelector((state) => state.notification);

  // Smooth color interpolation for Feed and Shorts
  const feedColor = pagerProgress
    ? pagerProgress.interpolate({
        inputRange: [1, 2],
        outputRange: [COLORS.white, COLORS.gray2],
        extrapolate: "clamp",
      })
    : isShort || isLive
    ? COLORS.gray2
    : COLORS.white;

  const shortsColor = pagerProgress
    ? pagerProgress.interpolate({
        inputRange: [1, 2, 3],
        outputRange: [COLORS.gray2, COLORS.white, COLORS.gray2],
        extrapolate: "clamp",
      })
    : isShort
    ? COLORS.white
    : COLORS.gray2;

  const liveColor = pagerProgress
    ? pagerProgress.interpolate({
        inputRange: [2, 3],
        outputRange: [COLORS.gray2, COLORS.white],
        extrapolate: "clamp",
      })
    : isLive
    ? COLORS.white
    : COLORS.gray2;

  // Opacity interpolation for right-side icons
  const homeIconsOpacity = pagerProgress
    ? pagerProgress.interpolate({
        inputRange: [1, 1.2, 2],
        outputRange: [1, 0, 0],
        extrapolate: "clamp",
      })
    : isShort || isLive
    ? 0
    : 1;

  const shortsIconsOpacity = pagerProgress
    ? pagerProgress.interpolate({
        inputRange: [1, 1.8, 2],
        outputRange: [0, 0, 1],
        extrapolate: "clamp",
      })
    : isShort || isLive
    ? 1
    : 0;

  const handleFeedPress = () => {
    if (onSetPage) {
      onSetPage(1);
    } else {
      navigation.reset({ index: 0, routes: [{ name: "MainStack" }] });
    }
  };

  const handleShortsPress = () => {
    if (onSetPage) {
      onSetPage(2);
    } else {
      navigation.navigate("Shorts");
    }
  };

  const handleLivePress = () => {
    if (onSetPage) {
      onSetPage(3);
    } else {
      navigation.navigate("Shows");
    }
  };

  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: "space-between",
          paddingHorizontal: 12,
          // height: 50,
        },
      ]}
    >
      <View style={styles.row}>
        <TouchableOpacity onPress={handleFeedPress} activeOpacity={0.7}>
          <Animated.Text
            style={{
              fontSize: 20,
              fontFamily: fonts.semiBold,
              color: feedColor,
            }}
          >
            Feed
          </Animated.Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShortsPress} activeOpacity={0.7}>
          <Animated.Text
            style={{
              fontSize: 20,
              fontFamily: fonts.semiBold,
              color: shortsColor,
              marginLeft: 12,
            }}
          >
            Shorts
          </Animated.Text>
        </TouchableOpacity>
        {!isHome && (
          <TouchableOpacity
            onPress={handleLivePress}
            activeOpacity={0.7}
            style={styles.row}
          >
            <Animated.Text
              style={{
                fontSize: 20,
                fontFamily: fonts.semiBold,
                color: liveColor,
                marginLeft: 12,
              }}
            >
              Live
            </Animated.Text>
            <View
              style={{
                height: 8,
                width: 8,
                borderRadius: 99,
                backgroundColor: "rgba(238, 16, 69, 1)",
                marginLeft: 4,
              }}
            />
          </TouchableOpacity>
        )}
      </View>

      <View
        style={{
          width: 130,
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        {/* Home Icons */}
        <Animated.View
          style={[
            styles.row,
            {
              gap: 8,
              position: "absolute",
              opacity: homeIconsOpacity,
              pointerEvents: isShort || isLive ? "none" : "auto",
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("SearchScreen")}
            activeOpacity={0.7}
          >
            <HomeSearchSvg width={40} height={40} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Notification")}
            activeOpacity={0.7}
          >
            <HomeBellSvg width={40} height={40} color={COLORS.white} />
            {notificationDot && (
              <View
                style={{
                  position: "absolute",
                  top: 4,
                  right: 7,
                  backgroundColor: "red",
                  height: 8,
                  width: 8,
                  borderRadius: 99,
                }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Chat")}
            activeOpacity={0.7}
          >
            <HomeChatSvg width={40} height={40} color={COLORS.white} />
          </TouchableOpacity>
        </Animated.View>

        {/* Shorts Icons */}
        <Animated.View
          style={{
            position: "absolute",
            opacity: shortsIconsOpacity,
            pointerEvents: isShort || isLive ? "auto" : "none",
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("CameraScreen")}
            activeOpacity={0.7}
          >
            <Icons
              family="Feather"
              name="camera"
              size={24}
              color={COLORS.white}
              marginRight={8}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
