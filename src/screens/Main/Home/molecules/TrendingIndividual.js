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
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { del, get, post } from "../../../../services/ApiRequest";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";

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
      {/* Figma "Trending Individuals" (Home-Feed 375 × 242): pad H12 V12,
          title row → cards gap 16 */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <View style={styles.rowBetween}>
          <CustomText
            label={"Trending Individuals"}
            fontFamily={fonts.medium}
            fontSize={18}
            letterSpacing={-0.5}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.seeMore}
            onPress={() =>
              navigation.navigate("SearchScreen", { tab: "people" })
            }
          >
            {/* Figma: "See more" SemiBold 12 white 48% · 16 circle white 4%
                with a gold (#A19375) chevron */}
            <CustomText
              label={"SEE MORE"}
              fontSize={12}
              fontFamily={fonts.semiBold}
              color={COLORS.gray48}
            />
            <View style={[styles.seeMoreIcon, { backgroundColor: colors.surface }]}>
              <Icons
                family="MaterialSymbolsRounded"
                name="chevron_right"
                size={12}
                color={COLORS.gray48}
              />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cards}
        >
          {individual?.map((item, index) => {
            const hasCover = !!item?.profile?.cover;
            const following = isFollowing(item);

            return (
              <TouchableOpacity
                key={item?._id || index}
                activeOpacity={0.8}
                onPress={() => {
                  navigation.navigate("UserProfile", {
                    item: item,
                    userId: item._id,
                  });
                }}
              >
                {/* Figma Follow-Suggestions card: 140 × 186, r8, pad 8,
                    content bottom-aligned, image + #121212 32% overlay */}
                <ImageBackground
                  // Figma: the person's photo fills the card (cover, else avatar)
                  source={
                    hasCover
                      ? { uri: item?.profile?.cover }
                      : item?.profile?.avatar
                      ? { uri: item?.profile?.avatar }
                      : null
                  }
                  style={[
                    styles.card,
                    {
                      backgroundColor: hasCover
                        ? undefined
                        : item?.profile?.profileColor || colors.surfaceAlt,
                    },
                  ]}
                  resizeMode="cover"
                >
                  {(hasCover || item?.profile?.avatar) && (
                    <View style={styles.cardOverlay} />
                  )}

                  <View style={styles.cardInfo}>
                    {item?.profile?.avatar ? (
                      <Image
                        source={{ uri: item?.profile?.avatar }}
                        style={styles.profileIcon}
                      />
                    ) : (
                      <View
                        style={[
                          styles.profileIcon,
                          {
                            borderWidth: 2,
                            borderColor: COLORS.gray48,
                            backgroundColor: item?.profile?.profileColor,
                          },
                        ]}
                      />
                    )}
                    <View style={styles.cardText}>
                      <CustomText
                        label={`${item?.firstName || ""} ${item?.lastName || ""}`.trim()}
                        numberOfLines={1}
                        fontFamily={fonts.medium}
                        fontSize={14}
                        letterSpacing={-0.14}
                        textAlign="center"
                      />
                      <View style={styles.row}>
                        <CustomText
                          label={`${formatCount(item?.followersCount)} `}
                          fontSize={12}
                          fontFamily={fonts.medium}
                          letterSpacing={-0.06}
                        />
                        <CustomText
                          label="Followers"
                          fontSize={12}
                          letterSpacing={-0.06}
                          color={COLORS.gray48}
                        />
                      </View>
                    </View>
                  </View>

                  <CustomButton
                    title={following ? "Following" : "Follow"}
                    height={32}
                    backgroundColor={following ? "transparent" : COLORS.white}
                    color={following ? COLORS.white : "#121212"}
                    borderWidth={following ? 1 : 0}
                    borderColor={following ? COLORS.white : undefined}
                    borderRadius={4}
                    fontSize={14}
                    fontFamily={fonts.medium}
                    onPress={() => {
                      const name = `${item.firstName} ${item.lastName}`;
                      if (following) {
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
      {/* Section's own 1px feed separator — rendered only when the section
          is, so an empty section never leaves a doubled line behind */}
      <View style={{ height: 1, backgroundColor: COLORS.authHeader }} />
    </>
  );
};

// 2400 → "2.4K", 2400000 → "2.4M" (Figma shows "2.4M Followers")
const formatCount = (n) => {
  const v = Number(n) || 0;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${v}`;
};

export default React.memo(TrendingIndividual);

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Figma: "See more" #A19375 + 16 circle (white 4%) with a 48% chevron, gap 4
  seeMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeMoreIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cards: { gap: 8 },
  card: {
    width: 140,
    height: 186,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    overflow: "hidden",
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 18, 18, 0.32)",
  },
  // Figma render (measured): avatar bottom → name caps 12, name baseline →
  // followers caps 7, followers baseline → button 15. With CustomText's
  // 1.4 line boxes that is avatar → 8 → name → 0 → followers → 12 → button
  cardInfo: {
    alignItems: "center",
    gap: 8,
  },
  cardText: {
    alignItems: "center",
    gap: 0,
  },
  profileIcon: {
    height: 40,
    width: 40,
    borderRadius: 99,
  },
});
