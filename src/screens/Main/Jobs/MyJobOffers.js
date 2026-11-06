import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import PullRefreshIndicator, { PULL_TINT, usePullScroll } from "../../../components/PullRefreshIndicator";
import ScreenWrapper, {
  ScreenFlatList,
  ScreenHeaderInsetConsumer,
  ScreenHeaderSpacer,
} from "../../../components/ScreenWrapper";
import { get } from "../../../services/ApiRequest";
import { JOB_STATUS_FILTERS } from "../../../utils/career";
import { GlassFill } from "../BandMateMatching/molecules/matchLayout";
import { CareerHeader, INK, SHEET_BG, WHITE_4, WHITE_48, WHITE_64 } from "../Career/molecules/CareerUI";
import { FilterChip } from "./JobMarketplace";
import JobCard from "./molecules/JobCard";
import { JobListSkeleton } from "./molecules/JobSkeletons";

const PAGE = 20;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const FILTERS = ["All", ...JOB_STATUS_FILTERS];

/**
 * Figma Matching › "My-Job-Offers" (8005:9253 header, 8005:8717 list).
 * Header 147: padding 52/12/8 gap 15 — back 40 · "My Job Offers" SemiBold 20
 * · "Create +" pill (32 r99 white 4%, padding 10/10/10/12, Medium 16 −0.5% +
 * `add` 16); filters All / Active / Paused / Expired. Cards (51 logo, status
 * badge, "16 Candidates · 8 Pre-selected") in a list padding 8 gap 12.
 */
const MyJobOffers = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState("All");
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  // the key of the rows on screen — a new chip / topic / filter / search
  // shows the skeleton at once (no old rows, no "No …" flash, no debounce gap)
  const [loadedKey, setLoadedKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const pull = usePullScroll();
  const loadedFilter = useRef(null);
  const reqRef = useRef(0);

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
        if (filter !== "All") params.set("status", filter.toLowerCase());
        const res = await get(`jobs/mine?${params.toString()}`);
        if (id !== reqRef.current) return;
        if (res?.data?.success) {
          const data = res.data.data;
          setJobs((prev) => (nextPage === 1 ? data.items : [...prev, ...data.items]));
          setTotal(data.total);
          setPage(nextPage);
        }
      } catch (e) {
        console.log("my jobs load error", e);
      } finally {
        // even a failed request settles the key (shows empty state, not a stuck skeleton)
        if (id === reqRef.current && nextPage === 1) setLoadedKey(filter);
        if (id === reqRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [filter],
  );

  // a new chip → skeleton; coming back to the screen → quiet reload
  useFocusEffect(
    useCallback(() => {
      load(1, loadedFilter.current === filter ? "silent" : undefined);
      loadedFilter.current = filter;
    }, [load, filter]),
  );

  const stale = loadedKey !== filter;
  return (
      <ScreenWrapper
        paddingHorizontal={0.1}
        scrollEnabled={false}
        headerBlur
        backgroundColor={INK}
        headerBlurColor={INK}
        headerUnScrollable={() => (
          <View style={styles.header}>
            <CareerHeader
              title="My Job Offers"
              right={
                <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("CreateJob")} style={styles.createBtn}>
                  <GlassFill borderRadius={99} />
                  <CustomText label="Create" fontSize={16} letterSpacing={-0.08} fontFamily={fonts.medium} color="#FFFFFF" />
                  <Icons family="MaterialSymbolsRounded" name="add" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              }
            />
            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <FilterChip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
              ))}
            </View>
          </View>
        )}
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
                  {/* Figma: list starts 1pt below the header (#262626 shows), first card 8 in */}
                  <View style={styles.band} />
                </>
              }
              renderItem={({ item }) => (
                <JobCard
                  job={item}
                  mine
                  onPress={() =>
                    // a draft goes back to the form; published offers open their Overview
                    item.status === "draft"
                      ? navigation.navigate("CreateJob", { job: item })
                      : navigation.navigate("JobOffer", { jobId: item._id })
                  }
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.cardRule} />}
              style={styles.listBg}
              contentContainerStyle={styles.list}
              ListFooterComponent={
                loading && jobs.length ? <ActivityIndicator color={WHITE_64} style={styles.footer} /> : <View style={styles.footer} />
              }
              onScroll={pull.onScroll}
              ListEmptyComponent={
                loading || stale ? (
                  <JobListSkeleton mine />
                ) : (
                  <View style={styles.empty}>
                    <Icons family="MaterialSymbolsRoundedFilled" name="work" size={80} color={WHITE_48} />
                    <CustomText
                      label="No Offers"
                      fontSize={32}
                      fontFamily={fonts.BoldItalic}
                      fontStyle="italic"
                      color="#FFFFFF"
                      marginTop={12}
                    />
                    <CustomText
                      label={filter === "All" ? "Create your first job offer." : `No ${filter.toLowerCase()} offers.`}
                      fontFamily={fonts.medium}
                      color={WHITE_48}
                    />
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
  );
};

export default MyJobOffers;

const styles = StyleSheet.create({
  header: { gap: 15 - 8, paddingBottom: 8 },
  createBtn: {
    height: 32,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
  },
  filters: { flexDirection: "row", gap: 6, paddingHorizontal: 12 },
  list: { paddingHorizontal: 8, gap: 12, flexGrow: 1 },
  listBg: { backgroundColor: INK },
  band: { height: 1, backgroundColor: SHEET_BG, marginHorizontal: -8, marginBottom: -4 },
  separator: { height: 1, backgroundColor: WHITE_4 },
  // FlatList renders the separator inside the card's cell, so the list gap
  // only applies after it — Figma: card · 12 · 1pt white 4% rule · 12 · card
  cardRule: { height: 1, backgroundColor: WHITE_4, marginTop: 12 },
  footer: { height: 60, paddingTop: 16 },
  empty: { height: SCREEN_HEIGHT / 1.5, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
});
