import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StyleSheet, Image, View, TouchableOpacity } from "react-native";

import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import { PNGIcons } from "../../../../assets/images/icons";
import Blur from "../../../../components/Blur";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const MatchingHeader = ({ onFilterPress, onNotificationPress }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userData } = useSelector((state) => state.users);
  const { notificationDot } = useSelector((state) => state.notification);
  const { colors } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);

  const data = [
    {
      key: "rewinds",
      icon: Images.rewinds,
      color: "#FF4B4B",
      count: userData?.rewinds || userData?.profile?.rewinds || 0,
    },
    {
      key: "supperLikes",
      icon: Images.superLikes,
      color: "#007AFE",
      count: userData?.supperLikes || userData?.profile?.supperLikes || 0,
    },
    {
      key: "boosts",
      icon: Images.boosts,
      color: "#8400E7",
      count: userData?.boosts || userData?.profile?.boosts || 0,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % data.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentItem = data[currentIndex];

  return (
    <View style={[styles.header]}>
      {!userData?.profile?.avatar ? (
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() =>
            navigation.navigate("UserProfile", {
              userId: userData?._id,
            })
          }
          style={{
            borderRadius: 99,
            height: 40,
            width: 40,
            backgroundColor: userData?.profile?.profileColor,
          }}
        />
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate("UserProfile", {
              userId: userData?._id,
            })
          }
        >
          <Image
            source={{ uri: userData?.profile?.avatar }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() =>
          navigation.navigate("UserProfile", {
            userId: userData?._id,
          })
        }
        style={styles.profileInfo}
      >
        <CustomText
          label={`Hi ${userData?.firstName} 👋`}
          fontSize={17}
          lineHeight={17 * 1.4}
          color={colors.text}
          fontFamily={fonts.medium}
        />
        <CustomText
          label={"Hope you had a great day!"}
          fontSize={12}
          lineHeight={12 * 1.4}
          color={colors.iconMuted}
          fontFamily={fonts.medium}
        />
      </TouchableOpacity>

      <View style={styles.imageRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Plans")}
          style={[styles.pillContainer, { backgroundColor: currentItem.color }]}
        >
          <Blur />
          <Image
            source={currentItem.icon}
            style={styles.pillIcon}
            tintColor={COLORS.white}
          />
          <CustomText
            label={currentItem.count}
            fontSize={12}
            fontFamily={fonts.bold}
            marginLeft={4}
            color={COLORS.white}
          />
        </TouchableOpacity>

        {notificationDot && (
          <View
            style={{
              position: "absolute",
              top: 6,
              right: 10,
              backgroundColor: "red",
              height: 8,
              width: 8,
              borderRadius: 99,
            }}
          />
        )}
        <TouchableOpacity activeOpacity={0.7} onPress={onNotificationPress}>
          <Image
            source={PNGIcons.notiBell}
            style={[styles.image, { tintColor: colors.text }]}
          />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={onFilterPress}>
          <Image
            source={PNGIcons.filterBell}
            style={[styles.image, { tintColor: colors.text }]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MatchingHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  image: {
    height: 40,
    width: 40,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    minWidth: 45,
    justifyContent: "center",
    overflow: "hidden",
    height: 30,
  },
  pillIcon: {
    height: 16,
    width: 16,
  },
});
