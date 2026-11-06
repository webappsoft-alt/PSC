import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import GlassBackButton from "../../../components/GlassBackButton";
import PullRefreshIndicator, { PULL_TINT, usePullScroll } from "../../../components/PullRefreshIndicator";
import Icons from "../../../components/Icons";
import ScreenWrapper, {
  ScreenFlatList,
  ScreenHeaderInsetConsumer,
  ScreenHeaderSpacer,
} from "../../../components/ScreenWrapper";
import { useTabBarVisibility } from "../../../navigation/TabStack";
import { get } from "../../../services/ApiRequest";
import { setJobFilters } from "../../../store/reducer/MatchingSlice";
import { JOB_STATUS_FILTERS, JOB_TOPICS, countJobFilters, jobFilterParams, resolveJobFilters } from "../../../utils/career";
import { GlassFill } from "../BandMateMatching/molecules/matchLayout";
import { HEADER_TOP_GAP, INK, MSF, SHEET_BG, SearchPill, WHITE_4, WHITE_48, WHITE_64, X } from "../Career/molecules/CareerUI";
import { feedLocationLabel } from "../Home/molecules/FeedHeader";
import JobCard from "./molecules/JobCard";
import JobFiltersSheet from "./molecules/JobFiltersSheet";
import { JobListSkeleton } from "./molecules/JobSkeletons";

const BLUE = "rgba(0, 123, 255, 1)";
const RED = "#EE1045";
const PAGE = 20;
const SCREEN_HEIGHT = Dimensions.get("window").height;

/** Figma topic chip 32h p0/8 r8 white 4%: Bold Italic 14 −4% uppercase white 64% (also when active); active → 6px blue dot */
export const TopicChip = ({ label, active, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.topicChip}>
    <GlassFill borderRadius={8} />
    <CustomText
      label={label}
      fontSize={14}
      letterSpacing={-0.56}
      fontFamily={fonts.BoldItalic}
      fontStyle="italic"
      textTransform="uppercase"
      color={WHITE_64}
    />
    {active && <View style={styles.topicDot} />}
  </TouchableOpacity>
);

/** Figma filter chip 32h p0/12 r100: active white 8% + Medium 14 white, idle 1px white 4% + white 64% */
export const FilterChip = ({ label, active, onPress, icon }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={[styles.filterChip, !active && styles.filterChipIdle]}
  >
    {active && <GlassFill borderRadius={100} fill="rgba(255, 255, 255, 0.08)" />}
    <CustomText label={label} fontSize={14} fontFamily={fonts.medium} color={active ? "#FFFFFF" : WHITE_64} />
    {!!icon && <Icons family="MaterialSymbolsRounded" name={icon} size={16} color={active ? "#FFFFFF" : WHITE_64} />}
  </TouchableOpacity>
);

/** Figma header 40 circle (transparent fill) with a white 64% glyph */
const HeaderIcon = ({ name, size, onPress, dot, family = "MaterialSymbolsRounded" }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} hitSlop={6} style={styles.headerIcon}>
    <Icons family={family} name={name} size={size} color={WHITE_64} />
    {dot && <View style={styles.redDot} />}
  </TouchableOpacity>
);

/**
 * Bottom-nav "Jobs" tab — Figma Matching/Jobs › "Job-Listing" (8265:4912).
 * Page #262626; header #121212 136 tall: padding 52/12/8/12 gap 4 — row 40
 * (search 40 · `location_on` 16 blue + "Los Angeles, CA" SemiBold 20 −6% +
 * `keyboard_arrow_down` 16 white 48% centred · `tune` 24 white 64% in a 40
 * circle with an 8 #EE1045 dot (top 4 / right 4) when a filter is on), topic
 * chips row (gap 3). List #121212 1 below the header: padding 8 gap 12,
 * cards split by 359×1 white 4%.
 * Search (Figma 8204:8715, header 180, gap 8): pill 44 (padding 12, gap 10,
 * `search` 24, Medium 16 placeholder white 64%, filled `cancel` 22) + 40
 * close circle (`close` 20) · topic chips · Type / Active / Paused / Expired
 * chips (gap 6). Filters: Figma "Filters-Job-Marketplace" sheet.
 */
const JobMarketplace = ({ isFocusedPage, onLocationPress }) => {
  const { reportPageEdges } = useTabBarVisibility();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const location = useSelector((state) => state.users.location);
  const myId = useSelector((state) => state.users.userData?._id);
  const savedFilters = useSelector((state) => state.matching?.jobFilters);
  const filters = resolveJobFilters(savedFilters);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState(null);
  // null = closed · "filters" = Filters sheet · "types" = straight to Contract Types (search "Type" chip)
  const [sheet, setSheet] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  // first load shows the skeleton (never "No Jobs" before the answer)
  const [loading, setLoading] = useState(true);
  // the key of the rows on screen — a new chip / topic / filter / search
  // shows the skeleton at once (no old rows, no "No …" flash, no debounce gap)
  const [loadedKey, setLoadedKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const pull = usePullScroll();
  const reqRef = useRef(0);
  const filterOn = countJobFilters(filters) > 0;
  const filterKey = JSON.stringify(filters);

  // mode: "refresh" = pull (spinner) · "silent" = focus reload · default =
  // new query / filter (list cleared → skeleton)
  const load = useCallback(
    async (nextPage = 1, mode) => {
      const id = ++reqRef.current;
      try {
        if (mode === "refresh") setRefreshing(true);
        else if (mode !== "silent") {
          setLoading(true);
          if (nextPage === 1) setJobs([]);
        }
        const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE) });
        if (query.trim()) params.set("q", query.trim());
        if (topic) params.set("topic", topic);
        jobFilterParams(JSON.parse(filterKey), params);
        const res = await get(`jobs?${params.toString()}`);
        if (id !== reqRef.current) return;
        if (res?.data?.success) {
          const data = res.data.data;
          setJobs((prev) => (nextPage === 1 ? data.items : [...prev, ...data.items]));
          setTotal(data.total);
          setPage(nextPage);
        }
      } catch (e) {
        console.log("jobs load error", e);
      } finally {
        // even a failed request settles the key (shows empty state, not a stuck skeleton)
        if (id === reqRef.current && nextPage === 1) setLoadedKey(`${query.trim()}|${topic}|${filterKey}`);
        if (id === reqRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [query, topic, filterKey],
  );

  useEffect(() => {
    const t = setTimeout(() => load(1), 250);
    return () => clearTimeout(t);
  }, [load]);

  // refresh when the tab comes back (an offer created / edited elsewhere)
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      if (isFocusedPage) load(1, "silent");
    }, [isFocusedPage]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    if (filters.status) dispatch(setJobFilters({ status: null }));
  };

  const topicsRow = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topics}>
      {JOB_TOPICS.map((t) => (
        <TopicChip key={t} label={t} active={topic === t} onPress={() => setTopic(topic === t ? null : t)} />
      ))}
    </ScrollView>
  );

  const stale = loadedKey !== `${query.trim()}|${topic}|${filterKey}`;
  return (
    <>
      <ScreenWrapper
        onScrollEdgeChange={(edges) => reportPageEdges?.("Jobs", edges)}
        paddingHorizontal={0.1}
        paddingBottom={0.1}
        headerBlur
        backgroundColor={SHEET_BG}
        headerBlurColor={INK}
        headerUnScrollable={() =>
          searchOpen ? (
            <View style={[styles.header, styles.headerSearch]}>
              <View style={[styles.row1, styles.rowSearch]}>
                <View style={styles.searchPill}>
                  <SearchPill
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search topics..."
                    height={44}
                    iconSize={24}
                    fontSize={16}
                    letterSpacing={0}
                    placeholderColor={WHITE_64}
                    paddingHorizontal={12}
                    gap={10}
                    clearFamily={MSF}
                    clearSize={22}
                    autoFocus
                  />
                </View>
                <GlassBackButton icon="close" iconSize={20} color={WHITE_64} onPress={closeSearch} accessibilityLabel="Close search" />
              </View>
              {topicsRow}
              <View style={styles.filters}>
                <FilterChip label="Type" active onPress={() => setSheet("types")} />
                {JOB_STATUS_FILTERS.map((st) => (
                  <FilterChip
                    key={st}
                    label={st}
                    active={filters.status === st}
                    onPress={() => dispatch(setJobFilters({ status: filters.status === st ? null : st }))}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.header}>
              <View style={styles.row1}>
                <HeaderIcon family="Feather" name="search" size={21} onPress={() => setSearchOpen(true)} />
                <View style={styles.locationWrap}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.locationBtn}
                    onPress={onLocationPress}
                    disabled={!onLocationPress}
                  >
                    <Icons family="MaterialSymbolsRoundedFilled" name="location_on" size={16} color={BLUE} />
                    <CustomText
                      label={feedLocationLabel(location)}
                      fontSize={20}
                      letterSpacing={-1.2}
                      fontFamily={fonts.semiBold}
                      color="#FFFFFF"
                      numberOfLines={1}
                      marginTop={-X(20) + 1}
                      marginBottom={-X(20) + 1}
                      containerStyle={styles.shrink}
                    />
                    <Icons family="MaterialSymbolsRounded" name="keyboard_arrow_down" size={16} color={WHITE_48} />
                  </TouchableOpacity>
                </View>
                <HeaderIcon name="tune" size={24} dot={filterOn} onPress={() => setSheet("filters")} />
              </View>
              {topicsRow}
            </View>
          )
        }
      >
        <ScreenHeaderInsetConsumer>
          {(headerInset) => (
            <>
            <ScreenFlatList
              data={stale ? [] : jobs}
              keyExtractor={(item) => String(item._id)}
              ListHeaderComponent={
                <>
                  <ScreenHeaderSpacer />
                  {/* Figma: 1pt #262626 band between the header and the list */}
                  <View style={styles.band} />
                </>
              }
              renderItem={({ item }) => (
                <JobCard
                  job={item}
                  onPress={() =>
                    // the poster manages their own offer (Figma Jobs Pro Management)
                    String(item.postedBy?._id || item.postedBy) === String(myId)
                      ? navigation.navigate("JobOffer", { jobId: item._id })
                      : navigation.navigate("JobDetail", { jobId: item._id })
                  }
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.cardRule} />}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListFooterComponent={
                loading && jobs.length ? <ActivityIndicator color={WHITE_64} style={styles.footer} /> : <View style={styles.footer} />
              }
              onScroll={pull.onScroll}
              ListEmptyComponent={
                loading || stale ? (
                  <JobListSkeleton />
                ) : (
                  <View style={styles.empty}>
                    <Icons family="MaterialSymbolsRoundedFilled" name="work" size={80} color={WHITE_48} />
                    <CustomText
                      label="No Jobs"
                      fontSize={32}
                      fontFamily={fonts.BoldItalic}
                      fontStyle="italic"
                      color="#FFFFFF"
                      marginTop={12}
                    />
                    <CustomText
                      label={query || topic || filterOn || filters.status ? "No offers match your filters." : "There are no job offers right now."}
                      fontFamily={fonts.medium}
                      color={WHITE_48}
                    />
                    {(filterOn || !!filters.status) && (
                      // same pill as the Filters sheet "Clear All"
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.clearBtn}
                        onPress={() => dispatch(setJobFilters({ types: [], modes: [], schedules: [], salary: null, status: null }))}
                      >
                        <GlassFill borderRadius={100} />
                        <CustomText label="Clear All" fontSize={16} fontFamily={fonts.medium} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                )
              }
              refreshControl={
                <RefreshControl refreshing={refreshing} progressViewOffset={headerInset} onRefresh={() => load(1, "refresh")} tintColor={PULL_TINT || WHITE_64} />
              }
              onEndReachedThreshold={0.4}
              onEndReached={() => {
                if (!loading && jobs.length < total) load(page + 1);
              }}
              showsVerticalScrollIndicator={false}
            />
            <PullRefreshIndicator scrollY={pull.scrollY} refreshing={refreshing} top={headerInset} color={WHITE_64} />
            </>
          )}
        </ScreenHeaderInsetConsumer>
      </ScreenWrapper>

      <JobFiltersSheet
        visible={!!sheet}
        initialStep={sheet === "types" ? "types" : null}
        onDismiss={() => setSheet(null)}
      />
    </>
  );
};

export default JobMarketplace;

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  header: {
    paddingTop: HEADER_TOP_GAP,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 4,
  },
  row1: { height: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  rowSearch: { gap: 8 },
  headerIcon: { width: 40, height: 40, borderRadius: 100, alignItems: "center", justifyContent: "center" },
  redDot: { position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 100, backgroundColor: RED },
  locationWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  locationBtn: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: "100%" },
  headerSearch: { gap: 8 },
  // Figma "Field + Cancel" row is 40 tall; the 44 pill overhangs it by 2
  searchPill: { flex: 1, height: 44, marginVertical: -2, flexDirection: "row" },
  topics: { flexDirection: "row", gap: 3 },
  topicChip: {
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
  },
  topicDot: { width: 6, height: 6, borderRadius: 100, backgroundColor: BLUE },
  filters: { flexDirection: "row", gap: 6 },
  filterChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    overflow: "hidden",
  },
  filterChipIdle: { borderWidth: 1, borderColor: WHITE_4 },
  // list gap is 12, the first card sits 8 below the band
  // Figma: list frame starts 1px below the 136 header (y 137) — the page's
  // #262626 shows through that 1px; first card 8 below it
  band: { height: 1, backgroundColor: SHEET_BG, marginHorizontal: -8, marginBottom: -4 },
  list: { backgroundColor: INK },
  listContent: { paddingHorizontal: 8, gap: 12, flexGrow: 1 },
  separator: { height: 1, backgroundColor: WHITE_4 },
  // FlatList renders the separator inside the card's cell, so the list gap
  // only applies after it — Figma: card · 12 · 1pt white 4% rule · 12 · card
  cardRule: { height: 1, backgroundColor: WHITE_4, marginTop: 12 },
  footer: { height: 140, paddingTop: 16 },
  // same as the Events tab empty state (noDataContainer)
  empty: { height: SCREEN_HEIGHT / 1.5, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  clearBtn: { height: 48, paddingHorizontal: 24, borderRadius: 100, alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 20 },
});
