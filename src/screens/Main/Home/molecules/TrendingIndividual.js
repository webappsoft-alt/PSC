import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import { useTheme } from "../../../../contexts/ThemeContext";
import { del, get, post } from "../../../../services/ApiRequest";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";
import Divider from "../../../../components/Divider";

const TrendingIndividual = () => {
  const isFocus = useIsFocused();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const userData = useSelector((state) => state.users.userData);

  const [individual, setIndividual] = useState([]);
  const [localFollowState, setLocalFollowState] = useState({});

  const getIndividual = useCallback(async () => {
    try {
      const res = await get("relationships/recommended");
      setIndividual(res.data.data.users);
    } catch (error) {}
  }, []);

  useEffect(() => {
    if (isFocus) {
      getIndividual();
    }
  }, [getIndividual, isFocus]);

  const handleFollow = async (userId, name = "User") => {
    try {
      setLocalFollowState((prev) => ({ ...prev, [userId]: true }));
      await post(`relationships/follow/${userId}`);
      ToastMessage(`You are now following ${name}`, "success");
    } catch (error) {
      console.error("Error following user:", error);
      setLocalFollowState((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnfollow = async (userId, name = "User") => {
    try {
      setLocalFollowState((prev) => ({ ...prev, [userId]: false }));
      await del(`relationships/unfollow/${userId}`);
      ToastMessage(`Unfollowed ${name}`);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      setLocalFollowState((prev) => ({ ...prev, [userId]: true }));
    }
  };

  const isFollowing = (user) => {
    const userId = user?._id;
    if (localFollowState[userId] !== undefined) {
      return localFollowState[userId];
    }
    return user?.stats?.followers?.includes(userData?._id) || false;
  };

  if (!individual?.length) return null;

  return (
    <>
      <View style={{ paddingHorizontal: 8, backgroundColor: colors.background }}>
        <View style={styles.rowBetween}>
          <CustomText
            label={"Trending Individuals"}
            fontFamily={fonts.medium}
            fontSize={18}
          />
          <View style={styles.row}>
            <CustomText
              label={"SEE MORE"}
              fontFamily={fonts.semiBold}
              fontSize={12}
              color={COLORS.gray2}
              onPress={() =>
                navigation.navigate("SearchScreen", { tab: "people" })
              }
            />
            <Image source={Images.forwardBg} style={styles.icon} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12, gap: 8 }}
        >
          {individual?.map((item, index) => {
            const hasCover = !!item?.profile?.cover;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  navigation.navigate("UserProfile", {
                    item: item,
                    userId: item._id,
                  });
                }}
              >
                <ImageBackground
                  key={index}
                  source={hasCover ? { uri: item?.profile?.cover } : null}
                  style={{
                    height: 220,
                    width: 140,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingHorizontal: 8,
                    overflow: "hidden",
                    backgroundColor: hasCover
                      ? undefined
                      : item?.profile?.profileColor,
                  }}
                  resizeMode="cover"
                >
                  {hasCover && (
                    <View
                      style={{
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: "rgba(0,0,0,0.25)",
                      }}
                    />
                  )}

                  {item?.profile?.avatar ? (
                    <Image
                      source={{ uri: item?.profile?.avatar }}
                      style={styles.profileIcon}
                    />
                  ) : (
                    <View
                      style={{
                        height: 40,
                        width: 40,
                        borderRadius: 99,
                        borderWidth: 2,
                        borderColor: COLORS.gray48,
                        backgroundColor: item?.profile?.profileColor,
                      }}
                    />
                  )}

                  <CustomText
                    label={item?.firstName + " " + item?.lastName}
                    marginTop={12}
                    numberOfLines={1}
                    fontFamily={fonts.medium}
                  />

                  <View style={styles.row}>
                    <CustomText
                      label={`${item?.followersCount || 0} `}
                      fontSize={12}
                      fontFamily={fonts.medium}
                    />
                    <CustomText
                      label="Followers"
                      fontSize={12}
                      color={COLORS.gray48}
                    />
                  </View>

                  <CustomButton
                    title={isFollowing(item) ? "Following" : "Follow"}
                    height={32}
                    backgroundColor={isFollowing(item) ? "transparent" : "#fff"}
                    color={isFollowing(item) ? "#fff" : COLORS.black}
                    borderWidth={isFollowing(item) ? 1 : 0}
                    borderColor={isFollowing(item) ? "#fff" : undefined}
                    borderRadius={12}
                    marginTop={12}
                    marginBottom={8}
                    fontSize={14}
                    onPress={() => {
                      const name = `${item.firstName} ${item.lastName}`;
                      if (isFollowing(item)) {
                        handleUnfollow(item._id, name);
                      } else {
                        handleFollow(item._id, name);
                      }
                    }}
                  />
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <Divider marginBottom={12} marginTop={8} thickness={4} />
    </>
  );
};

export default React.memo(TrendingIndividual);

const styles = StyleSheet.create({
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
  profileIcon: {
    height: 40,
    width: 40,
    borderRadius: 99,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
