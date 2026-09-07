import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Video from "react-native-video";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import { useTheme } from "../../../../contexts/ThemeContext";
import { get } from "../../../../services/ApiRequest";
import { COLORS } from "../../../../utils/COLORS";
import Divider from "../../../../components/Divider";

const ReelCard = ({ onSetPage, isScreenActive = true }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReels();
  }, []);

  useEffect(() => {
    if (isScreenActive && reels.length > 0) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % reels.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isScreenActive, reels]);

  const fetchReels = async () => {
    try {
      const response = await get("posts?&type=reel&limit=3");
      if (response?.data?.success && response?.data?.data) {
        setReels(response.data.data.slice(0, 3));
      }
    } catch (error) {
      console.log("fetchReels error", error);
    } finally {
      setLoading(false);
    }
  };

  // 🚫 DO NOT RENDER ANYTHING IF NO DATA
  if (loading || !reels || reels.length === 0) {
    return null;
  }

  return (
    <>
      <View style={{ paddingHorizontal: 12, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={styles.rowBetween}>
          <CustomText
            label={"Shorts You Might Like"}
            fontFamily={fonts.medium}
            fontSize={18}
          />

          <TouchableOpacity
            onPress={() => {
              navigation.setParams({ selectedReel: null });
              onSetPage?.(2);
            }}
            style={styles.row}
          >
            <CustomText
              label={"SEE MORE"}
              fontFamily={fonts.semiBold}
              fontSize={12}
              color={COLORS.gray2}
            />
            <Image source={Images.forwardBg} style={styles.icon} />
          </TouchableOpacity>
        </View>

        {/* Reels */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12, gap: 8 }}
        >
          {reels?.map((item, index) => {
            const videoUri = item.video || item.uri;
            const isActive = index === activeIndex;

            return (
              <TouchableOpacity
                key={item._id || index}
                style={styles.reelContainer}
                onPress={() => {
                  navigation.setParams({ selectedReel: item });
                  onSetPage?.(2);
                }}
              >
                <Video
                  source={{ uri: videoUri }}
                  style={styles.video}
                  resizeMode="cover"
                  repeat
                  paused={!isScreenActive || !isActive}
                  muted
                  playInBackground={false}
                  playWhenInactive={false}
                  poster={item.thumbnail}
                  posterResizeMode="cover"
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Divider marginBottom={12} marginTop={8} thickness={4} />
    </>
  );
};

export default React.memo(ReelCard);

const styles = StyleSheet.create({
  reelContainer: {
    height: 220,
    width: 140,
    borderRadius: 12,
    overflow: "hidden",
  },
  video: {
    height: 220,
    width: 140,
    borderRadius: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    height: 14,
    width: 14,
    marginLeft: 4,
  },
});
