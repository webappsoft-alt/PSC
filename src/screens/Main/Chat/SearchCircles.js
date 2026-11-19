import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { Animated, FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useTheme } from "../../../contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { joinCircle, searchCircles } from "../../../services/ChatService";
import { PSC_TOPICS } from "../../../utils/feedTopics";
import { ToastMessage } from "../../../utils/ToastMessage";
import CircleJoinSheet from "./molecules/CircleJoinSheet";
import ConversationBoxSkeleton from "./molecules/ConversationBoxSkeleton";

/**
 * Figma Chat page "Search-A-Circle" (7921:9328), from the Circles page search.
 * Header pad 56/12/8/12, gap 8: search bar 40 (r100 white 4%, pad 16/10,
 * search 20 @64%, "Search for Circles..." Medium 14 −1% @48%, cancel 20 @48%)
 * · 8 · close 40 circle white 4% (close 20 @64%); topic chips 32 (pad 8, r8,
 * white 4%, Bold Italic 14 −4% @64%; picked = white + #121212), gap 3.
 * Rows pad 16 gap 8 with 1px 4% lines: image 40 r12 · 8 · title Medium 16
 * −0.5 · 6 · topic Medium 14 @48% · dot 3 · group 16 + "1.4k members"
 * Medium 10 · forum 20 in a 40 white 4% circle; description Medium 10, 2 lines.
 * Joining shows the TOS sheet first; members open the Circle straight away.
 *
 * Empty search input (Figma "Search-A-Circle-Empty-Search-Input", node 8505):
 * no query / topic → featured Circles as square r24 cards (351 x 351 at the
 * 375pt reference width — scaled to screen width here, see cardSize), list
 * pad 12 gap 12, card pad 12 space-between, vertical gradient per topic; top
 * row = title SemiBold 24 −4% white + meta, and a 32 circle white 4% close
 * (close 16 @64%) pinned top-right · picture 112 r8 between waveform bars
 * (10 marks/side, width 2, heights 6/4/2(dot)/4/6/12/16/24/48/88 fading
 * white 16%→48% toward the picture, see WAVE) · "Join The Conversation"
 * pill 40 white (campaign 18 + Medium 16 −4% #121212, gap 4). Header has a
 * 1px #262626 line below the topic chips.
 */
// card gradients (Figma: Health #00283A → #004360, Sports green)
const CARD_GRADIENTS = {
  Health: ["#00283A", "#004360"],
  Sports: ["#0B3A1F", "#0E5E2E"],
  Technology: ["#1A1F3A", "#2B3470"],
  Politics: ["#3A1A1A", "#6B2B2B"],
  Finance: ["#1F2E1A", "#3C5A2B"],
  Travel: ["#0A3A3A", "#0F6060"],
  Automotive: ["#2A2A2A", "#4A4A4A"],
  Music: ["#2A1A3A", "#4B2B6B"],
  Entertainment: ["#3A1A2E", "#6B2B55"],
  Fashion: ["#3A2A1A", "#6B4B2B"],
  Animals: ["#2E3A1A", "#556B2B"],
  Food: ["#3A2A0A", "#6B4B0F"],
  Gaming: ["#1A2A3A", "#2B4B6B"],
  Education: ["#1A2E3A", "#2B556B"],
};
// Figma inspect (node 8505-10833, "92 Hug x 88 Hug" group, gap 8): 10 marks
// per side, each width 2, all vertically centered. Measured left->right
// (card edge -> picture) via the Layers panel, one rectangle at a time:
// H  6   4   2*  4   6   12  16  24  48  88
// O 16% 16% 16% 16% 16% 32% 32% 48% 48% 48%
// (* the resting "dot"). Opacity and height both ramp up toward the
// picture; the last bar is full height (88) right against it.
const WAVE = [
  { h: 6, o: 0.16 },
  { h: 4, o: 0.16 },
  { h: 2, o: 0.16 },
  { h: 4, o: 0.16 },
  { h: 6, o: 0.16 },
  { h: 12, o: 0.32 },
  { h: 16, o: 0.32 },
  { h: 24, o: 0.48 },
  { h: 48, o: 0.48 },
  { h: 88, o: 0.48 },
];

const formatCount = (n) =>
  n >= 1000000 ? `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}m` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n || 0);

const SearchCircles = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Real on-screen Y where the list starts (below the floating header),
  // measured live instead of guessed — a guess here (header height + top
  // inset) was consistently off and left the cards smaller than the space
  // actually available. Falls back to an estimate for the first frame,
  // before onLayout has fired.
  const [listTop, setListTop] = useState(null);
  const headerInset = listTop ?? insets.top + 101;
  const dividerOpacity = useRef(new Animated.Value(1)).current;
  // useScrollEdgeBlur reports on EVERY scroll event, not only on a change —
  // restarting the timing each frame never let it finish, so the line crawled
  // out long after the scroll. Fade only when the state actually flips, the
  // same 180ms the header blur itself uses.
  const headerCovered = useRef(false);
  const onHeaderScrollEdgeChange = ({ header }) => {
    if (header === headerCovered.current) return;
    headerCovered.current = header;
    Animated.timing(dividerOpacity, { toValue: header ? 0 : 1, duration: 180, useNativeDriver: true }).start();
  };
  // Figma card is 351 Fill x 351 Fill inside a 375pt frame (12 list padding either
  // side), square at that reference width. Width always follows the real screen
  // width (cardSize); height instead follows how much vertical space is actually
  // left (featuredCardHeight, below) so every featured card fits on screen
  // without scrolling, on any device.
  const cardSize = windowWidth - 24;

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinTarget, setJoinTarget] = useState(null);
  const [joining, setJoining] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    (async () => {
      try {
        const res = await searchCircles({ search: query, topic });
        if (requestId !== requestIdRef.current) return;
        setCircles(res?.data?.data || []);
      } catch (e) {
        console.log("Error searching circles:", e);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    })();
  }, [query, topic]);

  const openCircle = (c) =>
    navigation.navigate("InboxScreen", {
      conversationId: c._id,
      isGroup: true,
      groupType: "circle",
      recipientName: c.name,
      groupPicture: c.picture,
      memberCount: c.memberCount,
    });

  const join = async () => {
    if (!joinTarget || joining) return;
    setJoining(true);
    try {
      const res = await joinCircle(joinTarget._id);
      const circle = res?.data?.data;
      if (!res?.data?.success || !circle) throw new Error("failed");
      setCircles((prev) => prev.map((c) => (String(c._id) === String(circle._id) ? circle : c)));
      setJoinTarget(null);
      ToastMessage(`You joined ${circle.name}`);
      openCircle(circle);
    } catch (e) {
      ToastMessage("Could not join this Circle", "error");
    } finally {
      setJoining(false);
    }
  };

  // No backend endpoint for this yet — hides the suggestion locally for this
  // session only (it will show again on the next search/refresh).
  const dismissFeatured = (item) => setCircles((prev) => prev.filter((c) => String(c._id) !== String(item._id)));

  const featured = !query && !topic;
  // Space left below the header for the featured list: screen height minus
  // the header, the bottom safe area, the trailing <View height:48/> spacer
  // below the list (line ~307), and the list's own 12+12 padding.
  const featuredAvailableHeight = windowHeight - headerInset - 24;
  const featuredCardHeight = featured
    ? Math.max(260, Math.min(cardSize, (featuredAvailableHeight - 12 * Math.max(circles.length - 1, 0)) / Math.max(circles.length, 1)))
    : cardSize;

  const renderFeatured = ({ item }) => {
    const onPress = () => (item.isMember ? openCircle(item) : setJoinTarget(item));
    const gradient = CARD_GRADIENTS[item.topic] || CARD_GRADIENTS.Health;
    const bars = (keyPrefix, reversed) =>
      (reversed ? [...WAVE].reverse() : WAVE).map((b, i) => (
        <View key={`${keyPrefix}${i}`} style={[styles.bar, { height: b.h, backgroundColor: `rgba(255, 255, 255, ${b.o})` }]} />
      ));
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, { width: cardSize, height: featuredCardHeight }]}>
        <LinearGradient colors={gradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.cardTopRow}>
          <View style={styles.cardHead}>
            <CustomText label={item.name} fontSize={24} fontFamily={fonts.semiBold} letterSpacing={-0.96} marginBottom={-8} color="#FFFFFF" numberOfLines={2} />
            <View style={styles.cardMeta}>
              {!!item.topic && (
                <>
                  <CustomText label={String(item.topic).toUpperCase()} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.14} color="rgba(255, 255, 255, 0.64)" />
                  <View style={[styles.dot, { backgroundColor: "rgba(255, 255, 255, 0.64)" }]} />
                </>
              )}
              <CustomText label={formatCount(item.memberCount).toUpperCase()} fontSize={14} fontFamily={fonts.semiBold} letterSpacing={-0.14} color="#FFFFFF" />
              <CustomText label="members" fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.14} color="rgba(255, 255, 255, 0.64)" />
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7} hitSlop={8} onPress={() => dismissFeatured(item)} style={styles.cardClose}>
            <Icons family="MaterialSymbolsRounded" name="close" size={16} color="rgba(255, 255, 255, 0.64)" />
          </TouchableOpacity>
        </View>
        <View style={styles.cardWave}>
          <View style={styles.bars}>{bars("l", false)}</View>
          {item.picture ? (
            <FastImage source={{ uri: item.picture }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.center, { backgroundColor: "rgba(255, 255, 255, 0.12)" }]}>
              <CustomText label={(item.name?.[0] || "?").toUpperCase()} fontSize={40} fontFamily={fonts.semiBold} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.bars}>{bars("r", true)}</View>
        </View>
        <View style={styles.cardButton}>
          <Icons family="MaterialSymbolsRoundedFilled" name="campaign" size={18} color="#121212" />
          <CustomText label="Join The Conversation" fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.64} color="#121212" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const onPress = () => (item.isMember ? openCircle(item) : setJoinTarget(item));
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
        <View style={styles.rowTop}>
          {item.picture ? (
            <FastImage source={{ uri: item.picture }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.center, { backgroundColor: tint(0.08) }]}>
              <CustomText label={(item.name?.[0] || "?").toUpperCase()} fontSize={16} fontFamily={fonts.semiBold} color={colors.text} />
            </View>
          )}
          <View style={styles.texts}>
            <CustomText label={item.name} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={colors.text} numberOfLines={1} />
            <View style={styles.meta}>
              {!!item.topic && (
                <CustomText label={item.topic} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.5} color={tint(0.48)} />
              )}
              {!!item.topic && <View style={[styles.dot, { backgroundColor: tint(0.48) }]} />}
              <Icons family="MaterialSymbolsRoundedFilled" name="group" size={16} color={tint(0.48)} />
              <CustomText label={`${formatCount(item.memberCount)} members`} fontSize={10} fontFamily={fonts.medium} letterSpacing={-0.05} color={colors.text} />
            </View>
          </View>
          <View style={[styles.action, { backgroundColor: tint(0.04) }]}>
            <Icons family="MaterialSymbolsRounded" name="forum" size={20} color={colors.text} />
          </View>
        </View>
        {!!item.description && (
          <CustomText label={item.description} fontSize={10} fontFamily={fonts.medium} letterSpacing={-0.05} color={colors.text} numberOfLines={2} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      onScrollEdgeChange={onHeaderScrollEdgeChange}
      headerUnScrollable={() => (
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <View style={[styles.searchBar, { backgroundColor: tint(0.04) }]}>
              <Icons family="MaterialSymbolsRounded" name="search" size={20} color={tint(0.64)} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search for Circles..."
                placeholderTextColor={tint(0.48)}
                style={[styles.input, { color: colors.text }]}
                autoCorrect={false}
                autoFocus
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                  <Icons family="MaterialSymbolsRoundedFilled" name="cancel" size={20} color={tint(0.48)} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.close, { backgroundColor: tint(0.04) }]}>
              <Icons family="MaterialSymbolsRounded" name="close" size={20} color={tint(0.64)} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {PSC_TOPICS.map((t) => {
              const on = topic === t.name;
              return (
                <TouchableOpacity
                  key={t.name}
                  activeOpacity={0.7}
                  onPress={() => setTopic(on ? "" : t.name)}
                  style={[styles.chip, { backgroundColor: on ? (isDark ? "#FFFFFF" : "#121212") : tint(0.04) }]}
                >
                  <CustomText
                    label={t.name}
                    fontSize={14}
                    fontFamily={fonts.BoldItalic}
                    fontStyle="italic"
                    letterSpacing={-0.56}
                    color={on ? (isDark ? "#121212" : "#FFFFFF") : tint(0.64)}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Animated.View style={[styles.headerDivider, { opacity: dividerOpacity }]} />
        </View>
      )}
      scrollEnabled
    >
      {loading ? (
        [1, 2, 3, 4, 5].map((k) => <ConversationBoxSkeleton key={k} />)
      ) : (
        <FlatList
          data={circles}
          onLayout={featured ? (e) => setListTop(e.nativeEvent.layout.y) : undefined}
          scrollEnabled={false}
          keyExtractor={(item) => String(item._id)}
          renderItem={featured ? renderFeatured : renderItem}
          contentContainerStyle={featured ? styles.featuredList : undefined}
          ItemSeparatorComponent={featured ? undefined : () => <View style={[styles.line, { backgroundColor: tint(0.04) }]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <CustomText label={query || topic ? "No Circles found" : "No Circles yet"} fontSize={16} fontFamily={fonts.semiBold} color={colors.text} textAlign="center" />
              <CustomText label="Create one from the + on the Circles tab." fontSize={14} color={tint(0.64)} textAlign="center" marginTop={4} />
            </View>
          }
        />
      )}
      <View style={{ height: 48 }} />
      <CircleJoinSheet
        visible={!!joinTarget}
        circle={joinTarget}
        joining={joining}
        onDismiss={() => setJoinTarget(null)}
        onJoin={join}
      />
    </ScreenWrapper>
  );
};

export default SearchCircles;

const styles = StyleSheet.create({
  header: {
    paddingTop: 12, // Figma 56 − 44pt status bar
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  // Figma: 1px #262626 line below the chips row — clear at rest, fades out
  // on scroll (dividerOpacity) instead of sitting as a hard edge over the
  // header's own progressive blur once content is behind it.
  headerDivider: {
    height: 1,
    marginHorizontal: -12, // header has paddingHorizontal 12; line is edge-to-edge
    backgroundColor: "#262626",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    letterSpacing: -0.14,
    paddingVertical: 0,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: {
    gap: 3,
    alignItems: "center",
  },
  chip: {
    height: 32,
    borderRadius: 8,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  row: {
    padding: 16,
    gap: 8,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 100,
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    height: 1,
  },
  // featured cards (empty search input) — card is always square: width === height,
  // computed from the screen width (see cardSize) so it fits every device.
  featuredList: { padding: 12, gap: 12 },
  card: {
    borderRadius: 24,
    padding: 12,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  cardHead: { flex: 1, gap: 12 },
  cardClose: { width: 32, height: 32, borderRadius: 100, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255, 255, 255, 0.04)" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardWave: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  bars: { width: 92, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bar: { width: 2, borderRadius: 2 },
  cardImage: { width: 112, height: 112, borderRadius: 8 },
  cardButton: {
    height: 40,
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  empty: {
    alignItems: "center",
    paddingTop: 64,
    paddingHorizontal: 32,
  },
});
