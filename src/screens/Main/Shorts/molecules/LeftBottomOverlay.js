import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import { del, post } from "../../../../services/ApiRequest";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";
import { Tags } from "../../../../assets/svgs";
import Blur from "../../../../components/Blur";

const LeftBottomOverlay = ({ item }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const userData = useSelector((state) => state.users.userData);
  const [localFollowing, setLocalFollowing] = useState(null);

  const isFollowing =
    localFollowing !== null
      ? localFollowing
      : item?.author?.stats?.followers?.includes(userData?._id) || false;

  const isOwner = userData?._id === item?.author?._id;

  const handleFollowPress = async () => {
    const userId = item?.author?._id;
    if (!userId || isOwner) return;

    const currentlyFollowing = isFollowing;
    try {
      setLocalFollowing(!currentlyFollowing);
      const username = item?.author?.firstName || "User";
      if (currentlyFollowing) {
        await del(`relationships/unfollow/${userId}`);
        ToastMessage(`Unfollowed ${username}`);
      } else {
        await post(`relationships/follow/${userId}`);
        ToastMessage(`You are now following ${username}`, "success");
      }
    } catch (error) {
      console.log("Error following/unfollowing:", error);
      setLocalFollowing(currentlyFollowing);
    }
  };

  return (
    <View style={[styles.leftOverlay, { bottom: insets.bottom + 100 }]}>
      <CustomText
        label={
          Array.isArray(item?.description)
            ? item?.description[0]
            : item?.description || item?.caption
        }
        fontFamily={fonts.medium}
        numberOfLines={2}
        fontSize={14}
        color={COLORS.white}
        lineHeight={18}
        marginBottom={10}
      />
      {item?.hashtags?.slice(0, 3)?.map((item, index) => (
        <View style={styles.tagBg} key={index}>
          <Blur />
          <Tags width={12} height={12} color={COLORS.gray48} />
          <CustomText
            label={`${item}`}
            fontSize={12}
            color={COLORS.gray2}
            fontFamily={fonts.medium}
            marginLeft={2}
          />
        </View>
      ))}

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("UserProfile", { userId: item?.author?._id })
        }
        activeOpacity={0.9}
        style={styles.creatorInfo}
      >
        {item?.author?.profile?.avatar ? (
          <ImageFast
            source={
              item?.author?.profile?.avatar
                ? { uri: item?.author?.profile?.avatar }
                : ""
            }
            style={[
              styles.creatorImage,
              { borderColor: COLORS.gray48, borderWidth: 1 },
            ]}
          />
        ) : (
          <View
            style={[
              styles.creatorImage,
              {
                backgroundColor: item?.author?.profile?.profileColor,
              },
            ]}
          />
        )}
        <CustomText
          label={
            item?.author?.firstName
              ? `${item.author.firstName} ${item.author.lastName || ""}`
              : item?.creator?.name
          }
          fontSize={16}
          color={COLORS.white}
        />
        <Image source={Images.verified} style={styles.verifiedIcon} />
        {!isOwner && (
          <CustomButton
            title={isFollowing ? "Following" : "Follow"}
            onPress={handleFollowPress}
            width={isFollowing ? "28%" : "22%"}
            height={32}
            borderRadius={99}
            fontSize={12}
            marginLeft={8}
            backgroundColor={isFollowing ? COLORS.gray64 : COLORS.white}
            color={isFollowing ? COLORS.white : COLORS.black}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default LeftBottomOverlay;

const styles = StyleSheet.create({
  leftOverlay: {
    position: "absolute",
    left: 16,
    right: 100,
    zIndex: 20,
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 12,
  },
  creatorImage: {
    width: 40,
    height: 40,
    borderRadius: 99,
    marginRight: 10,
  },
  verifiedIcon: {
    height: 14,
    width: 14,
    marginLeft: 4,
  },
  tagBg: {
    backgroundColor: COLORS.inputBg,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 99,
    paddingLeft: 8,
    paddingRight: 10,
    alignSelf: "flex-start",
    height: 24,
    overflow: "hidden",
  },
});
