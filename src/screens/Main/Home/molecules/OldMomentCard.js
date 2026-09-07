import { useNavigation } from "@react-navigation/native";
import { getPalette } from "@somesoap/react-native-image-palette";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import Video from "react-native-video";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { selectStoryUploadStatus } from "../../../../store/reducer/appSlice";
import { COLORS } from "../../../../utils/COLORS";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Story Border Component
const StoryBorder = ({ segments = 1, size = 72, colors = [] }) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapAngle = segments == 1 ? 0 : 15;
  const totalGapAngle = gapAngle * segments;
  const segmentAngle = (360 - totalGapAngle) / segments;

  const segmentLength = (segmentAngle / 360) * circumference;

  // Fallback to your original colors if the prop is empty
  const activeColors =
    colors.length > 0 ? colors : [COLORS.red1, COLORS.blue, COLORS.green];

  return (
    <Svg width={size} height={size} style={styles.storyBorder}>
      {Array.from({ length: segments }).map((_, index) => {
        // Calculate the rotation for this specific segment
        // They are spaced evenly by (360 / segments) degrees
        const rotateAngle = -90 + index * (360 / segments);

        // Pick a color, cycling if there are fewer colors than segments
        const strokeColor = activeColors[index % activeColors.length];

        return (
          <Circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            // Draw one segment (segmentLength) and leave the rest of the circle empty
            strokeDasharray={`${segmentLength} ${
              circumference - segmentLength
            }`}
            strokeLinecap="round"
            rotation={rotateAngle}
            origin={`${size / 2}, ${size / 2}`}
          />
        );
      })}
    </Svg>
  );
};

// Animated Plus Border Component
const AnimatedPlusBorder = ({ size = 72 }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.storyBorder,
        {
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.buttonColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

const MomentItem = ({
  item,
  index,
  navigation,
  handleStoryPress,
  myStories,
}) => {
  const [storyColors, setStoryColors] = useState([]);
  const [myStoryColors, setMyStoryColors] = useState([]);
  const { userData } = useSelector((state) => state.users);
  const storyUploadStatus = useSelector(selectStoryUploadStatus);
  const currentUserId = userData?._id;

  const extractColors = async (stories, setter) => {
    const colors = [];
    for (const story of stories) {
      const hasViewed = story.views?.includes(currentUserId);
      if (hasViewed) {
        colors.push("#525252ff");
      } else {
        if (story.media?.type === "image" && story.media?.url) {
          try {
            const palette = await getPalette(story.media.url);
            if (palette?.vibrant) {
              colors.push(palette.vibrant);
            } else if (palette?.muted) {
              colors.push(palette.muted);
            } else if (palette?.dominant) {
              colors.push(palette.dominant);
            } else {
              colors.push(COLORS.buttonColor);
            }
          } catch (e) {
            console.log("Palette error", e);
            colors.push(COLORS.buttonColor);
          }
        } else {
          colors.push(COLORS.buttonColor);
        }
      }
    }
    if (colors.length === 0) colors.push(COLORS.buttonColor);
    setter(colors);
  };

  useEffect(() => {
    if (item?.stories && currentUserId) {
      extractColors(item.stories, setStoryColors);
    }
  }, [item, currentUserId]);

  useEffect(() => {
    if (myStories?.stories && currentUserId) {
      extractColors(myStories.stories, setMyStoryColors);
    }
  }, [myStories, currentUserId]);

  const handleMyStoryPress = () => {
    if (myStories?.stories?.length > 0) {
      navigation.navigate("StoryViewer", {
        userStories: [
          {
            ...myStories,
            username: "My Story",
            userImage: { uri: userData?.profilePicture },
            user: [userData],
          },
        ],
        initialUserIndex: 0,
        isMyStory: true,
      });
    } else {
      navigation.navigate("CameraScreen");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => {
        if (index === 0) {
          handleMyStoryPress();
        } else {
          handleStoryPress(item, index);
        }
      }}
      onLongPress={() => {
        if (index === 0) {
          navigation.navigate("CameraScreen");
        }
      }}
      style={styles.cardWrapper}
    >
      {item?.type === "add" ? (
        <View style={styles.storyContainer}>
          {storyUploadStatus === "uploading" ? (
            <AnimatedPlusBorder size={72} />
          ) : myStories?.stories?.length > 0 && myStoryColors.length > 0 ? (
            <StoryBorder
              segments={myStories.stories.length}
              size={72}
              colors={myStoryColors}
            />
          ) : storyUploadStatus === "success" ? (
            <StoryBorder
              segments={15}
              size={72}
              colors={[COLORS.buttonColor]}
            />
          ) : (
            <View style={styles.card}>
              <Icons
                name={"plus"}
                family={"Feather"}
                color={COLORS.white}
                size={30}
              />
            </View>
          )}
          {(storyUploadStatus === "uploading" ||
            storyUploadStatus === "success" ||
            myStories?.stories?.length > 0) && (
            <View
              style={[
                styles.card,
                {
                  position: "absolute",
                  borderWidth: 0,
                  backgroundColor: "transparent",
                },
              ]}
            >
              <Icons
                name={"plus"}
                family={"Feather"}
                color={COLORS.white}
                size={30}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.storyContainer}>
          {item?.stories?.length > 0 && storyColors.length > 0 && (
            <StoryBorder
              segments={item?.stories?.length}
              size={72}
              colors={storyColors}
            />
          )}
          <View style={styles.imageContainer}>
            {item?.stories?.[0]?.media?.type === "video" ? (
              <Video
                source={{ uri: item?.stories?.[0]?.media?.url }}
                style={styles.cardImage}
                resizeMode={"cover"}
                muted={true}
                paused={true}
              />
            ) : (
              <ImageFast
                source={{ uri: item?.stories?.[0]?.media?.url }}
                style={styles.cardImage}
                resizeMode={"cover"}
              />
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MomentCard = ({ storiesData, myStoriesData }) => {
  const navigation = useNavigation();

  const data = useMemo(() => {
    const apiStories = storiesData?.map((item) => ({
      ...item,
      type: "story",
      username: item.user?.[0]?.username || "User",
      userImage: { uri: item.user?.[0]?.profilePicture },
    }));
    return [{ type: "add" }, ...apiStories];
  }, [storiesData]);

  const handleStoryPress = (item, index) => {
    if (item.type === "story" && item.stories) {
      const validStories = data.filter(
        (d) => d.type === "story" && d.stories && d.stories.length > 0,
      );
      const initialIndex = validStories.findIndex(
        (s) => s.userId === item.userId,
      );

      navigation.navigate("StoryViewer", {
        userStories: validStories,
        initialUserIndex: initialIndex,
      });
    }
  };

  const handlePlayAll = () => {
    const validStories = data.filter(
      (d) => d.type === "story" && d.stories && d.stories.length > 0,
    );
    if (validStories.length > 0) {
      navigation.navigate("StoryViewer", {
        userStories: validStories,
        initialUserIndex: 0,
      });
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.row, styles.spaceBetween]}>
        <View style={styles.row}>
          <CustomText
            label={"MOMENTS"}
            color={COLORS.gray2}
            fontFamily={fonts.medium}
          />
          <CustomText
            label={storiesData.length.toString()}
            color={COLORS.white}
            fontFamily={fonts.medium}
          />
        </View>
        <TouchableOpacity style={styles.row} onPress={handlePlayAll}>
          <Icons
            name={"controller-play"}
            family={"Entypo"}
            color={"#FFFFFF29"}
          />
          <CustomText
            label={"PLAY ALL"}
            color={COLORS.white}
            fontFamily={fonts.medium}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(_, i) => `moment-${i}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <MomentItem
            item={item}
            index={index}
            navigation={navigation}
            handleStoryPress={handleStoryPress}
            myStories={myStoriesData?.[0]}
          />
        )}
      />
    </View>
  );
};

export default React.memo(MomentCard);

const styles = StyleSheet.create({
  mainContainer: { padding: 12, backgroundColor: COLORS.black },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  spaceBetween: { justifyContent: "space-between" },
  listContent: { gap: 10, marginTop: 16 },
  cardWrapper: {
    position: "relative",
  },
  card: {
    padding: 12,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: "#FFFFFF0A",
    height: 72,
    width: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  storyContainer: {
    height: 72,
    width: 72,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  storyBorder: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  imageContainer: {
    height: 64,
    width: 64,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: COLORS.black,
    borderWidth: 3,
    borderColor: COLORS.black,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
});
