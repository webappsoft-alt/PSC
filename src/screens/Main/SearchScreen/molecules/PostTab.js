import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import TopTab from "../../../../components/TopTab";
import { get } from "../../../../services/ApiRequest";
import AnimatedListItem from "../../../../utils/AnimatedListItem";
import { COLORS } from "../../../../utils/COLORS";
import SearchCard from "./SearchCard";
import SearchCardSkeleton from "./SearchCardSkeleton";
import { useTheme } from "../../../../contexts/ThemeContext";

const TAB_NAMES = [
  "Technology",
  "Politics",
  "Sports",
  "Music",
  "Entertainment",
  "Fashion",
  "Food",
  "Gaming",
  "Health",
];

const PostTab = ({ isActive }) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [tab, setTab] = useState(null);
  const [trendingPost, setTrendingPost] = useState(null);
  const [latestTrends, setLatestTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrendingPosts = useCallback(async () => {
    try {
      let endpoint = "posts/trending?limit=10&timeRange=30";
      if (tab !== null) {
        endpoint += `&topic=${TAB_NAMES[tab]}`;
      }

      const response = await get(endpoint);
      if (response?.data?.success) {
        const data = response.data.data;
        if (data && data.length > 0) {
          setTrendingPost(data[0]);
        } else {
          setTrendingPost(null);
        }
      }
    } catch (error) {
      console.error("fetchTrendingPosts error", error);
    }
  }, [tab]);

  const fetchHashtagTrends = useCallback(async () => {
    try {
      let endpoint = "hashtag/top";
      if (tab !== null) {
        endpoint += `?topic=${TAB_NAMES[tab]}`;
      }

      const response = await get(endpoint);
      if (response?.data?.success) {
        const hashtags = response.data.data?.hashtags || [];
        const formattedTrends = hashtags.map((hashtag) => ({
          _id: hashtag._id,
          tag: hashtag.tag,
          count: hashtag.postIds?.length,
          topic: hashtag.topic,
          stats: hashtag.stats,
        }));
        setLatestTrends(formattedTrends);
      } else {
        setLatestTrends([]);
      }
    } catch (error) {
      console.error("fetchHashtagTrends error", error);
      setLatestTrends([]);
    }
  }, [tab]);

  useEffect(() => {
    if (isActive) {
      setLoading(true);
      Promise.all([fetchTrendingPosts(), fetchHashtagTrends()]).finally(() => {
        setLoading(false);
      });
    }
  }, [isActive, fetchTrendingPosts, fetchHashtagTrends, tab]);

  const author = trendingPost?.author || {};
  const displayName =
    `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
    "Display Name";
  const description = Array.isArray(trendingPost?.description)
    ? trendingPost.description[0]
    : trendingPost?.description ||
      "This is just few words about the caption of the post it might stay on up to three lines but not more...";

  const topicLabel = `#1 TRENDING IN ${
    tab !== null ? TAB_NAMES[tab].toUpperCase() : "TECHNOLOGY"
  }`;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await Promise.all([fetchTrendingPosts(), fetchHashtagTrends()]);
            setRefreshing(false);
          }}
          tintColor={isDark ? COLORS.white : colors.text}
        />
      }
    >
      <View
        style={[
          styles.row,
          {
            marginBottom: 12,
            paddingHorizontal: 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setTab(null)}
          activeOpacity={0.7}
          style={{
            backgroundColor: tab === null ? (isDark ? COLORS.white : colors.text) : (isDark ? "#FFFFFF0A" : colors.surfaceAlt),
            height: 32,
            width: 36,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 8,
          }}
        >
          <Icons
            family="MaterialCommunityIcons"
            name="compass"
            size={22}
            color={tab === null ? (isDark ? COLORS.black : COLORS.white) : (isDark ? COLORS.white : colors.textSecondary)}
          />
        </TouchableOpacity>
        <TopTab
          rounded
          tab={tab}
          setTab={setTab}
          borderRadius={8}
          tabNames={TAB_NAMES}
        />
      </View>
      {loading && !trendingPost ? (
        <View
          style={{
            height: 220,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? "#272727" : colors.surfaceAlt,
          }}
        >
          <ActivityIndicator color={isDark ? COLORS.white : colors.text} size="large" />
        </View>
      ) : trendingPost ? (
        <AnimatedListItem index={0} delay={1}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("CommentScreen", {
                item: trendingPost,
                postData: {
                  displayName,
                  username: author.username,
                  description,
                  likesCount: trendingPost.stats?.upvotes || 0,
                  commentsCount: trendingPost.stats?.comments || 0,
                  repostsCount: trendingPost.stats?.reposts || 0,
                  images: trendingPost.images || [],
                },
              })
            }
          >
            <ImageFast
              source={
                trendingPost.images?.[0]
                  ? { uri: trendingPost.images[0] }
                  : Images.dotBg
              }
              style={{
                width: "100%",
                height: 220,
                backgroundColor: isDark ? "#272727" : colors.surfaceAlt,
                justifyContent: "flex-start",
              }}
            >
              <View style={{ padding: 12 }}>
                <CustomText
                  label={description}
                  fontSize={20}
                  fontFamily={fonts.medium}
                  numberOfLines={3}
                />
              </View>
            </ImageFast>

            <LinearGradient
              colors={["#A1937500", "#A19375"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradient}
            >
              <View style={[styles.row, { padding: 12 }]}>
                <ImageFast
                  source={
                    author.profile?.avatar
                      ? { uri: author.profile.avatar }
                      : Images.searchPlaceholder
                  }
                  style={{ height: 36, width: 36, borderRadius: 18 }}
                />
                <View style={{ flex: 1 }}>
                  <CustomText
                    label={topicLabel}
                    fontFamily={fonts.medium}
                    fontSize={16}
                    color={COLORS.subtitle}
                  />
                  <View style={styles.row}>
                    <CustomText
                      label={"By"}
                      fontFamily={fonts.regular}
                      fontSize={16}
                      color={COLORS.subtitle}
                    />
                    <CustomText
                      label={displayName}
                      fontFamily={fonts.semiBold}
                      fontSize={20}
                    />
                  </View>
                </View>
                <Icons
                  name={"chevron-forward-outline"}
                  family={"Ionicons"}
                  color={COLORS.gray64}
                  size={22}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedListItem>
      ) : null}

      <View style={{ paddingHorizontal: 12 }}>
        <AnimatedListItem index={1} delay={15}>
          <CustomText
            label={"Latest Trends"}
            fontFamily={fonts.medium}
            fontSize={16}
            marginTop={16}
            marginBottom={6}
          />
        </AnimatedListItem>

        {latestTrends?.map((item, index) => (
          <AnimatedListItem key={item._id} index={index} delay={20}>
            <SearchCard
              item={item}
              onPress={() =>
                navigation.navigate("PostFilter", { hashtag: item?.tag })
              }
            />
          </AnimatedListItem>
        ))}
        {!loading && latestTrends?.length === 0 && !trendingPost && (
          <CustomText
            label="No trends found"
            color={isDark ? COLORS.subtitle : colors.textSecondary}
            marginTop={20}
            alignSelf="center"
          />
        )}
        {loading && (
          <View style={{ marginTop: 20 }}>
            <SearchCardSkeleton key="skeleton-1" />
            <SearchCardSkeleton key="skeleton-2" />
            <SearchCardSkeleton key="skeleton-3" />
            <SearchCardSkeleton key="skeleton-4" />
            <SearchCardSkeleton key="skeleton-5" />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default PostTab;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gradient: {
    height: 80,
    width: "100%",
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
});
