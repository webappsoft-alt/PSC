import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSelector } from "react-redux";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import GlassBackButton from "../../../components/GlassBackButton";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper, { ScreenFlatList, ScreenHeaderSpacer } from "../../../components/ScreenWrapper";
import { Bone, SkeletonGroup } from "../../../components/Skeleton";
import { get } from "../../../services/ApiRequest";

const X = (fs) => fs * 0.35;
const INK = "#121212";
const BAND = "#262626";
const W4 = "rgba(255, 255, 255, 0.04)";
const W8 = "rgba(255, 255, 255, 0.08)";
const W12 = "rgba(255, 255, 255, 0.12)";
const W16 = "rgba(255, 255, 255, 0.16)";
const W48 = "rgba(255, 255, 255, 0.48)";
const W64 = "rgba(255, 255, 255, 0.64)";
const GOLD = "#A19375";
const GREEN = "#37B874";
const RED = "#EE1045";
const MSF = "MaterialSymbolsRoundedFilled";

const T = ({ fs, ls = 0, ff = fonts.regular, color = "#FFFFFF", ...rest }) => (
  <CustomText fontSize={fs} letterSpacing={ls} fontFamily={ff} color={color} marginTop={-X(fs)} marginBottom={-X(fs)} {...rest} />
);

// Figma filter chips: All · Upvotes · Downvotes · Comments · Responses
const FILTERS = [
  { key: "all", label: "All" },
  { key: "upvote", label: "Upvotes" },
  { key: "downvote", label: "Downvotes" },
  { key: "comment", label: "Comments" },
  { key: "response", label: "Responses" },
];

// Figma's exact vectors (Material Icons Round, outline chat bubble)
const PATHS = {
  upvote:
    "M8.66681 12.6667V5.22001L11.9201 8.47334C12.1801 8.73334 12.6068 8.73334 12.8668 8.47334C13.1268 8.21334 13.1268 7.79334 12.8668 7.53334L8.47348 3.14001C8.21348 2.88001 7.79348 2.88001 7.53348 3.14001L3.13348 7.52667C2.87348 7.78667 2.87348 8.20667 3.13348 8.46667C3.39348 8.72667 3.81348 8.72667 4.07348 8.46667L7.33348 5.22001V12.6667C7.33348 13.0333 7.63348 13.3333 8.00014 13.3333C8.36681 13.3333 8.66681 13.0333 8.66681 12.6667Z",
  downvote:
    "M7.33348 3.33335V10.78L4.08014 7.52669C3.82014 7.26669 3.39348 7.26669 3.13348 7.52669C2.87348 7.78669 2.87348 8.20669 3.13348 8.46669L7.52681 12.86C7.78681 13.12 8.20681 13.12 8.46681 12.86L12.8601 8.46669C13.1201 8.20669 13.1201 7.78669 12.8601 7.52669C12.6001 7.26669 12.1801 7.26669 11.9201 7.52669L8.66681 10.78V3.33335C8.66681 2.96669 8.36681 2.66669 8.00014 2.66669C7.63348 2.66669 7.33348 2.96669 7.33348 3.33335Z",
  comment:
    "M2.66699 11.4466L3.44699 10.6666H13.3337V2.66665H2.66699V11.4466ZM2.66699 1.33331H13.3337C14.067 1.33331 14.667 1.93331 14.667 2.66665V10.6666C14.667 11.4 14.067 12 13.3337 12H4.00033L1.33366 14.6666V2.66665C1.33366 1.93331 1.93366 1.33331 2.66699 1.33331Z",
  response:
    "M4.66632 4.66667H11.333V5.86C11.333 6.16 11.693 6.30667 11.8996 6.09333L13.7596 4.23333C13.893 4.1 13.893 3.89333 13.7596 3.76L11.8996 1.9C11.693 1.69333 11.333 1.84 11.333 2.14V3.33333H3.99965C3.63298 3.33333 3.33298 3.63333 3.33298 4V6.66667C3.33298 7.03333 3.63298 7.33333 3.99965 7.33333C4.36632 7.33333 4.66632 7.03333 4.66632 6.66667V4.66667ZM11.333 11.3333H4.66632V10.14C4.66632 9.84 4.30632 9.69333 4.09965 9.90667L2.23965 11.7667C2.10632 11.9 2.10632 12.1067 2.23965 12.24L4.09965 14.1C4.30632 14.3067 4.66632 14.16 4.66632 13.86V12.6667H11.9996C12.3663 12.6667 12.6663 12.3667 12.6663 12V9.33333C12.6663 8.96667 12.3663 8.66667 11.9996 8.66667C11.633 8.66667 11.333 8.96667 11.333 9.33333V11.3333Z",
  // 24 box
  chevron:
    "M9.28957 6.71002C8.89957 7.10002 8.89957 7.73002 9.28957 8.12002L13.1696 12L9.28957 15.88C8.89957 16.27 8.89957 16.9 9.28957 17.29C9.67957 17.68 10.3096 17.68 10.6996 17.29L15.2896 12.7C15.6796 12.31 15.6796 11.68 15.2896 11.29L10.6996 6.70002C10.3196 6.32002 9.67957 6.32002 9.28957 6.71002Z",
  // 14 box
  info:
    "M6.41699 4.08335H7.58366V5.25002H6.41699V4.08335ZM7.00033 9.91669C7.32116 9.91669 7.58366 9.65419 7.58366 9.33335V7.00002C7.58366 6.67919 7.32116 6.41669 7.00033 6.41669C6.67949 6.41669 6.41699 6.67919 6.41699 7.00002V9.33335C6.41699 9.65419 6.67949 9.91669 7.00033 9.91669ZM7.00033 1.16669C3.78033 1.16669 1.16699 3.78002 1.16699 7.00002C1.16699 10.22 3.78033 12.8334 7.00033 12.8334C10.2203 12.8334 12.8337 10.22 12.8337 7.00002C12.8337 3.78002 10.2203 1.16669 7.00033 1.16669ZM7.00033 11.6667C4.42783 11.6667 2.33366 9.57252 2.33366 7.00002C2.33366 4.42752 4.42783 2.33335 7.00033 2.33335C9.57283 2.33335 11.667 4.42752 11.667 7.00002C11.667 9.57252 9.57283 11.6667 7.00033 11.6667Z",
};
const Glyph = ({ d, box, color }) => (
  <Svg width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
    <Path d={d} fill={color} />
  </Svg>
);

// Figma row head: 28 r6 tinted box with a 16 icon · Medium 14 −4% text
const KIND = {
  upvote: { icon: "arrow_upward", color: GREEN, box: "rgba(55, 184, 116, 0.12)", text: "You upvoted a post from" },
  downvote: { icon: "arrow_downward", color: RED, box: "rgba(238, 16, 69, 0.12)", text: "You downvoted a post from" },
  comment: { icon: "chat_bubble", color: "#FFFFFF", box: W12, text: "You commented a post from" },
  response: { icon: "repeat", color: "#FFFFFF", box: W12, text: "You responded to a post from" },
};

// Figma groups: Today · Yesterday · More than 3 days ago (2–3 days by count)
const dayGroup = (at) => {
  const days = moment().startOf("day").diff(moment(at).startOf("day"), "days");
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 3) return `${days} days ago`;
  return "More than 3 days ago";
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const Row = ({ item, first, onPress }) => {
  const k = KIND[item.type] || KIND.comment;
  return (
    <>
      {!first && <View style={styles.rule} />}
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
        <View style={styles.col}>
          <View style={styles.head}>
            <View style={[styles.kindBox, { backgroundColor: k.box }]}>
              <Glyph d={PATHS[item.type] || PATHS.comment} box={16} color={k.color} />
            </View>
            <T fs={14} ls={-0.56} ff={fonts.medium} label={k.text} numberOfLines={1} containerStyle={styles.shrink} />
          </View>
          <View style={styles.mid}>
            <View style={styles.midText}>
              {!!item.author && (
                <View style={styles.authorRow}>
                  {item.author.avatar ? (
                    <ImageFast source={{ uri: item.author.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.center, { backgroundColor: item.author.profileColor || W8 }]}>
                      <CustomText label={initials(item.author.name)} fontSize={7} fontFamily={fonts.semiBold} color="#FFFFFF" />
                    </View>
                  )}
                  <T fs={14} ls={-0.28} ff={fonts.medium} label={item.author.name} numberOfLines={1} containerStyle={styles.shrink} />
                </View>
              )}
              {!!item.quote && (
                <CustomText
                  label={`“${item.quote}”`}
                  fontSize={12}
                  letterSpacing={-0.48}
                  color={W64}
                  numberOfLines={2}
                  lineHeight={18} // Figma: line-height auto (Poppins 1.5)
                  marginTop={-(18 - 0.7 * 12) / 2}
                  marginBottom={-(18 - 0.7 * 12) / 2}
                />
              )}
            </View>
            {!!item.thumbnail && <ImageFast source={{ uri: item.thumbnail }} style={styles.thumb} />}
          </View>
          <View style={styles.meta}>
            <T fs={12} ls={-0.48} ff={fonts.medium} color={W48} label={moment(item.at).format("D MMM YYYY [at] h:mm A")} />
            {!!item.criterion && (
              <>
                <View style={styles.dot} />
                <View style={styles.chip}>
                  <T fs={10} ff={fonts.medium} color={W64} label={item.criterion.toUpperCase()} />
                </View>
              </>
            )}
          </View>
        </View>
        <Glyph d={PATHS.chevron} box={24} color={W64} />
      </TouchableOpacity>
    </>
  );
};

const RowSkeleton = () => (
  <View style={styles.row}>
    <View style={styles.col}>
      <View style={styles.head}>
        <Bone width={28} height={28} radius={6} />
        <Bone width={160} height={10} />
      </View>
      <Bone width={200} height={10} />
      <Bone width={230} height={8} />
      <Bone width={180} height={8} />
    </View>
  </View>
);

/**
 * Figma Profile › "Interaction History" (8416:4235): header (back · title
 * SemiBold 20 · filter chips) · Breakdown intro · one #121212 section per day
 * (title Medium 18) with a white-4% r12 card of rows. Tap → the post.
 */
const InteractionHistory = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const me = useSelector((s) => s.users.userData);
  // history is owner-only on the server, so always ask for the signed-in
  // account (never a stale id carried over from another account's screen)
  const userId = me?._id || route.params?.userId;

  const [type, setType] = useState("all");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadedKey, setLoadedKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const req = useRef(0);

  const load = useCallback(
    async (next = 1, mode) => {
      const id = ++req.current;
      if (mode === "refresh") setRefreshing(true);
      try {
        const r = await get(`ai/political/${userId}/history?type=${type}&page=${next}&limit=20`);
        if (id !== req.current) return;
        const d = r?.data?.data || {};
        setItems((prev) => (next === 1 ? d.items || [] : [...prev, ...(d.items || [])]));
        setHasMore(!!d.hasMore);
        setPage(next);
        setError(null);
      } catch (e) {
        if (id === req.current) setError(e?.message || "Could not load your history");
      } finally {
        if (id === req.current) {
          if (next === 1) setLoadedKey(type);
          setRefreshing(false);
        }
      }
    },
    [userId, type],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  // day sections
  const sections = [];
  for (const it of items) {
    const g = dayGroup(it.at);
    const last = sections[sections.length - 1];
    if (last && last.title === g) last.items.push(it);
    else sections.push({ title: g, items: [it] });
  }
  const loading = loadedKey !== type;

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      scrollEnabled={false}
      statusBarColor={INK}
      headerUnScrollable={() => (
        // Figma header: padding 52/12/8/12 · gap 12 — title row 40 · chips 32
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <GlassBackButton onPress={() => navigation.goBack()} />
            <T fs={20} ls={-0.1} ff={fonts.semiBold} label="Interaction History" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {FILTERS.map((f) => {
              const active = f.key === type;
              return (
                <TouchableOpacity
                  key={f.key}
                  activeOpacity={0.7}
                  onPress={() => setType(f.key)}
                  style={[styles.filter, active ? styles.filterOn : styles.filterOff]}
                >
                  <T fs={14} ff={fonts.medium} color={active ? "#FFFFFF" : W64} label={f.label} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    >
      <ScreenFlatList
        data={loading ? [] : sections}
        keyExtractor={(s) => s.title}
        ListHeaderComponent={
          <>
            <ScreenHeaderSpacer />
            {/* Figma "Breakdown": padding 16/12, gap 12 · info 14 + Medium 16 gold */}
            <View style={styles.breakdown}>
              <View style={styles.breakdownHead}>
                <Glyph d={PATHS.info} box={14} color={GOLD} />
                <T fs={16} ls={-0.5} ff={fonts.medium} color={GOLD} label="Breakdown" />
              </View>
              <CustomText
                label="Your chronological record of your interactions on PSC that contribute to your political orientation profile."
                fontSize={14}
                letterSpacing={-0.56}
                color={W48}
                marginTop={-X(14)}
                marginBottom={-X(14)}
              />
            </View>
            <View style={styles.band} />
          </>
        }
        ItemSeparatorComponent={() => <View style={styles.band} />}
        renderItem={({ item: s }) => (
          <View style={styles.section}>
            <T fs={18} ls={-0.09} ff={fonts.medium} label={s.title} />
            <View style={styles.card}>
              {s.items.map((it, i) => (
                <Row
                  key={it._id}
                  item={it}
                  first={i === 0}
                  onPress={() => navigation.navigate("DetailPageWithId", { postId: it.postId })}
                />
              ))}
              <View pointerEvents="none" style={styles.cardStroke} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <SkeletonGroup>
              <View style={styles.section}>
                <Bone width={80} height={13} />
                <View style={styles.card}>
                  <RowSkeleton />
                  <View style={styles.rule} />
                  <RowSkeleton />
                  <View style={styles.rule} />
                  <RowSkeleton />
                  <View pointerEvents="none" style={styles.cardStroke} />
                </View>
              </View>
            </SkeletonGroup>
          ) : (
            <View style={styles.empty}>
              <Icons family={MSF} name="history" size={80} color={W48} />
              <CustomText
                label={error ? "Something went wrong" : "No Interactions"}
                fontSize={32}
                fontFamily={fonts.BoldItalic}
                fontStyle="italic"
                color="#FFFFFF"
                marginTop={12}
                textAlign="center"
              />
              <CustomText
                label={error || "Your votes, comments and responses on political posts will appear here."}
                fontFamily={fonts.medium}
                color={W48}
                textAlign="center"
              />
            </View>
          )
        }
        onEndReached={() => hasMore && !loading && load(page + 1)}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, "refresh")} tintColor="#FFFFFF" />}
      />
    </ScreenWrapper>
  );
};

export default InteractionHistory;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  shrink: { flexShrink: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  // Figma header: solid #121212 (no blur over the #262626 page)
  header: { paddingTop: 8, paddingBottom: 8, gap: 12, backgroundColor: INK },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 16, height: 40, paddingHorizontal: 12 },
  filters: { gap: 6, paddingHorizontal: 12 },
  filter: { height: 32, borderRadius: 100, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  filterOn: { backgroundColor: W8 },
  filterOff: { borderWidth: 1, borderColor: W4 },
  listContent: { flexGrow: 1, backgroundColor: BAND },
  band: { height: 1, backgroundColor: BAND },
  breakdown: { backgroundColor: INK, paddingVertical: 16, paddingHorizontal: 12, gap: 12 },
  breakdownHead: { flexDirection: "row", alignItems: "center", gap: 4 },
  section: { backgroundColor: INK, padding: 12, gap: 16 },
  card: { borderRadius: 12, backgroundColor: W4, overflow: "hidden" },
  // Figma strokes sit inside the box without moving content (an RN border
  // would push every row 1pt down / right), so the stroke is an overlay
  cardStroke: { ...StyleSheet.absoluteFillObject, borderRadius: 12, borderWidth: 1, borderColor: W4 },
  rule: { height: 1, backgroundColor: W4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  col: { flex: 1, gap: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 6 },
  kindBox: { width: 28, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  mid: { flexDirection: "row", gap: 12 },
  midText: { flex: 1, gap: 8 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  avatar: { width: 16, height: 16, borderRadius: 100, overflow: "hidden" },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: W4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 3, height: 3, borderRadius: 100, backgroundColor: W16 },
  chip: { height: 16, borderRadius: 4, paddingHorizontal: 4, backgroundColor: W4, justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40, paddingHorizontal: 20, minHeight: 400, backgroundColor: INK },
});
