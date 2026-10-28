import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import { ShowsSvg } from "../../../assets/svgs";
import CustomText from "../../../components/CustomText";
import {
  getNavBarClearance,
  openPagerTab,
  useTabBarVisibility,
} from "../../../navigation/TabStack";
import { fetchShowsFeed, setShowsSeeMore } from "../../../services/showApi";
import { PSC_TOPICS } from "../../../utils/feedTopics";
import { ToastMessage } from "../../../utils/ToastMessage";
import FamousCreators from "./molecules/FamousCreators";
import {
  LargeShowCard,
  PosterShowCard,
  RankedShowCard,
  RoundelShowCard,
  SquareShowCard,
} from "./molecules/ShowCards";
import ShowsFeedSkeleton from "./molecules/ShowsFeedSkeleton";
import { HowItWorks, SeeMore } from "./molecules/ShowsPromoBlocks";
import ShowsHeader, { showsHeaderHeight } from "./molecules/ShowsHeader";
import ShowsSectionHeader from "./molecules/ShowsSectionHeader";
import {
  SECTION_GAP,
  SECTION_PAD_BOTTOM,
  SECTION_PAD_H,
  SECTION_PAD_TOP,
  SECTION_SEPARATOR,
  SHOWS,
} from "./molecules/showsLayout";

/**
 * Figma › Shows › "Show-Feed" (3738:2915 / search state 3746:2248).
 * #262626 page, #121212 sections stacked 1pt apart under a fixed blurred
 * gradient header. Sections come from GET /shows/feed (empty ones are left
 * out by the server). Each section maps to the Figma header copy + card type.
 */
const ALL_TOPICS = PSC_TOPICS.map((t) => t.name);
const SEARCH_DEBOUNCE_MS = 350;

const muted = SHOWS.white64;
const gold = SHOWS.gold;

const sectionConfig = (section) => {
  const p = section.params || {};
  switch (section.key) {
    case "topShows":
      return {
        card: "large",
        lines: [
          { size: 12, text: `Best Of ${p.year || new Date().getFullYear()}`, color: muted },
          {
            size: 18,
            parts: [
              { text: "Top" },
              { text: "Shows", weight: "semiBold", color: gold, gold: true, gap: 4 },
            ],
          },
        ],
      };
    case "top10":
      return {
        card: "ranked",
        icon: true,
        lines: [
          { size: 12, text: "Top 10 In", color: muted },
          { size: 18, text: p.region || "" },
        ],
      };
    case "dailyUpdate":
      return {
        card: "square",
        lines: [
          { size: 14, text: "Your Daily Update" },
          { size: 14, text: "About", color: muted },
          { size: 18, text: p.topic || "" },
        ],
      };
    case "newShows":
      return { card: "roundel", icon: true, lines: [{ size: 18, text: "New Shows" }] };
    case "essentials":
      return { card: "poster", icon: true, lines: [{ size: 18, text: "Essentials" }] };
    case "onlyOnPsc":
      return { card: "tall", icon: true, lines: [{ size: 18, text: "Only On PSC" }] };
    case "notToMiss":
      return {
        card: "large",
        icon: true,
        lines: [
          { size: 18, text: "Shows" },
          { size: 12, text: "You Would Not Like To Miss!", color: muted },
        ],
      };
    case "peopleFrom":
      return {
        card: "large",
        icon: true,
        lines: [
          {
            size: 12,
            inline: true,
            parts: [
              { text: "People From ", color: muted },
              { text: p.region || "", weight: "semiBold" },
            ],
          },
          { size: 18, text: "Love These" },
        ],
      };
    case "friendsWatched":
      return {
        card: "large",
        singleHeight: 16,
        lines: [{ size: 18, text: "Your Friends Have Watched" }],
      };
    case "exclusive":
      return {
        card: "large",
        lines: [
          { size: 12, text: "Exclusive Shows In", color: muted },
          { size: 18, text: p.topic || "" },
        ],
      };
    case "drivenByMen":
    case "drivenByWomen":
      return {
        card: "large",
        lines: [
          { size: 12, text: "Shows Driven By", color: muted },
          { size: 18, text: p.gender || "" },
        ],
      };
    case "watchedBy":
      return {
        card: "large",
        lines: [
          { size: 12, text: "Shows Watched By", color: muted },
          {
            size: 18,
            text: p.others ? `${p.name} & ${p.others} Others` : p.name || "",
          },
        ],
      };
    default:
      return null;
  }
};

const RANK_BLEED = 12;

// Figma list gaps: ranked / roundel rows 16, the others 8
const CARD_GAP = { large: 8, ranked: 16, square: 8, roundel: 16, poster: 8, tall: 8 };
// card widths (ranked = 24 number + 8 + 240 card) → carousels snap card by card
const CARD_WIDTH = { large: 240, ranked: 272, square: 140, roundel: 96, poster: 108, tall: 160 };

const renderCard = (card, show, onPress) => {
  switch (card) {
    case "ranked":
      return <RankedShowCard show={show} onPress={onPress} />;
    case "square":
      return <SquareShowCard show={show} onPress={onPress} />;
    case "roundel":
      return <RoundelShowCard show={show} onPress={onPress} />;
    case "poster":
      return <PosterShowCard show={show} onPress={onPress} />;
    case "tall":
      return <PosterShowCard show={show} onPress={onPress} tall />;
    default:
      return <LargeShowCard show={show} onPress={onPress} />;
  }
};

const ShowsSection = ({ section, onPressShow }) => {
  const config = sectionConfig(section);
  if (!config) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ShowsSectionHeader
          lines={config.lines}
          icon={config.icon}
          singleHeight={config.singleHeight}
        />
      </View>
      <FlatList
        horizontal
        data={section.items}
        keyExtractor={(item, index) => String(item?._id || index)}
        renderItem={({ item }) =>
          renderCard(config.card, item, () => onPressShow?.(item))
        }
        showsHorizontalScrollIndicator={false}
        // client: carousels scroll and snap — each swipe settles with a card
        // on the 12pt left margin
        snapToInterval={(CARD_WIDTH[config.card] ?? 240) + (CARD_GAP[config.card] ?? 8)}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        // a horizontal list clips at its own edges; the ranked row's big
        // numbers rise above the cards (Figma), so that row's list starts
        // RANK_BLEED higher and pads its content back down by the same amount
        style={config.card === "ranked" ? { marginTop: -RANK_BLEED } : null}
        contentContainerStyle={[
          styles.rowContent,
          { gap: CARD_GAP[config.card] ?? 8 },
          config.card === "ranked" ? { paddingTop: RANK_BLEED } : null,
        ]}
      />
    </View>
  );
};

const Shows = ({ isFocusedPage, topics, onAddTopicPress }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const userData = useSelector((state) => state.users.userData);
  const { setIsTabBarVisible } = useTabBarVisibility();

  const [topic, setTopic] = useState(null);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [feed, setFeed] = useState({ sections: [], newTopics: [], seeMore: "" });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);
  const loadedOnce = useRef(false);

  const chipTopics = topics?.length ? topics : ALL_TOPICS;

  // debounce the search field → query
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async ({ silent } = {}) => {
      const id = ++requestId.current;
      if (!silent) setLoading(true);
      try {
        const res = await fetchShowsFeed({ topic, search: query });
        if (id !== requestId.current) return;
        if (res?.data?.success) {
          setFeed({
            sections: res.data.data?.sections || [],
            newTopics: res.data.data?.newTopics || [],
            seeMore: res.data.data?.seeMore || "",
          });
        }
      } catch (e) {
        console.log("Shows feed failed:", e?.message || e);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          loadedOnce.current = true;
        }
      }
    },
    [topic, query],
  );

  // topic chip / search → skeleton + reload
  useEffect(() => {
    load();
  }, [load]);

  // back on the tab (e.g. after publishing an episode) → refresh quietly
  useEffect(() => {
    if (isFocusedPage && loadedOnce.current) load({ silent: true });
  }, [isFocusedPage]);

  // the selected chip must stay visible in the user's chip list
  useEffect(() => {
    if (topic && !chipTopics.includes(topic)) setTopic(null);
  }, [chipTopics, topic]);

  // header: Figma purple gradient + blur at the top; turns into the solid
  // PSC header (progressive edge) once the feed scrolls under it
  const scrollY = useRef(new Animated.Value(0)).current;

  // tab bar hides on scroll down (the + button shows), returns on scroll up
  const lastY = useRef(0);
  const barVisible = useRef(true);
  const onScroll = useCallback(
    (e) => {
      if (!isFocusedPage) return;
      const y = e.nativeEvent.contentOffset.y;
      if (y < 0) return;
      const diff = y - lastY.current;
      if (Math.abs(diff) < 20) return;
      const show = diff < 0;
      if (barVisible.current !== show) {
        barVisible.current = show;
        setIsTabBarVisible(show);
      }
      lastY.current = y;
    },
    [isFocusedPage, setIsTabBarVisible],
  );
  useEffect(() => {
    if (isFocusedPage) {
      barVisible.current = true;
      lastY.current = 0;
    }
  }, [isFocusedPage]);

  const onPressCreator = (creator) => {
    if (!creator?._id) return;
    if (creator._id === userData?._id) {
      openPagerTab("Profile");
      return;
    }
    navigation.navigate("UserProfile", { userId: creator._id });
  };

  const headerHeight = showsHeaderHeight(insets.top);

  // "What Would Like To See More?" → saved on the account, feed re-ranks
  const onSeeMore = async (choice) => {
    const next = feed.seeMore === choice ? "" : choice;
    setFeed((f) => ({ ...f, seeMore: next }));
    try {
      await setShowsSeeMore(next);
      load({ silent: true });
    } catch (e) {
      ToastMessage(e?.message || "Could not save your choice", "error");
    }
  };

  // Figma Show-Feed order: "How Does It Work" sits after Only On PSC and
  // "What Would Like To See More?" after Shows Driven By Men
  const sections = useMemo(() => {
    const list = [...(feed.sections || [])];
    if (!list.length) return list;
    const IMAGE_BLOCKS = ["howItWorks", "seeMore", "famousCreators"];
    const after = (key, fallbackIndex) => {
      const i = list.findIndex((s) => s.key === key);
      return i >= 0 ? i + 1 : fallbackIndex;
    };
    // never put two image-background blocks next to each other — with a
    // small catalogue the Figma neighbours may be missing, so slide the
    // block up until it sits between card sections (or leave it out)
    const insert = (key, index) => {
      let i = Math.min(index, list.length);
      const touches = (at) =>
        IMAGE_BLOCKS.includes(list[at - 1]?.key) || IMAGE_BLOCKS.includes(list[at]?.key);
      while (i > 1 && touches(i)) i -= 1;
      if (!touches(i) && i > 0) list.splice(i, 0, { key });
    };
    insert("howItWorks", after("onlyOnPsc", Math.min(3, list.length)));
    insert("seeMore", after("drivenByMen", list.length));
    return list;
  }, [feed.sections]);

  return (
    <View style={styles.page}>
      <ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false, listener: onScroll },
        )}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: headerHeight + SECTION_SEPARATOR,
          paddingBottom: getNavBarClearance(insets.bottom) + 24,
          gap: SECTION_SEPARATOR,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={SHOWS.white}
            progressViewOffset={headerHeight}
            onRefresh={() => {
              setRefreshing(true);
              load({ silent: true });
            }}
          />
        }
      >
        {loading ? (
          <ShowsFeedSkeleton />
        ) : sections.length === 0 ? (
          <View style={styles.empty}>
            <ShowsSvg height={80} width={80} color={SHOWS.white48} />
            <CustomText
              label={query ? "No Results" : "No Shows"}
              fontSize={32}
              fontFamily={fonts.BoldItalic}
              fontStyle="italic"
              color={SHOWS.white}
              marginTop={12}
            />
            <CustomText
              label={
                query
                  ? `No shows match “${query}”.`
                  : topic
                  ? `There are no ${topic} shows yet.`
                  : "There are no shows right now."
              }
              fontFamily={fonts.medium}
              color={SHOWS.white48}
              textAlign="center"
            />
          </View>
        ) : (
          sections.map((section) =>
            section.key === "howItWorks" ? (
              <HowItWorks key={section.key} />
            ) : section.key === "seeMore" ? (
              <SeeMore
                key={section.key}
                value={feed.seeMore}
                onChange={onSeeMore}
                onSomethingElse={onAddTopicPress}
              />
            ) : section.key === "famousCreators" ? (
              <FamousCreators
                key={section.key}
                creators={section.items}
                onPressCreator={onPressCreator}
              />
            ) : (
              <ShowsSection
                key={section.key}
                section={section}
                onPressShow={(show) =>
                  show?._id && navigation.navigate("ShowDetail", { showId: show._id })
                }
              />
            ),
          )
        )}
      </ScrollView>

      <ShowsHeader
        scrollY={scrollY}
        topics={chipTopics}
        topic={topic}
        onTopicChange={setTopic}
        newTopics={feed.newTopics}
        onAddTopicPress={onAddTopicPress}
        searching={searching}
        onSearchOpen={() => setSearching(true)}
        onSearchClose={() => {
          setSearching(false);
          setSearch("");
        }}
        search={search}
        onSearchChange={setSearch}
      />
    </View>
  );
};

export default Shows;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: SHOWS.page,
  },
  section: {
    backgroundColor: SHOWS.section,
    paddingTop: SECTION_PAD_TOP,
    paddingBottom: SECTION_PAD_BOTTOM,
    gap: SECTION_GAP,
  },
  sectionHeader: {
    paddingHorizontal: SECTION_PAD_H,
  },
  rowContent: {
    paddingHorizontal: SECTION_PAD_H,
    alignItems: "flex-start",
  },
  empty: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: SHOWS.section,
  },
});
