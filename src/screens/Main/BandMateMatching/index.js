import { StyleSheet, View } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import { Matching } from "../../../assets/svgs";
import CustomText from "../../../components/CustomText";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { get } from "../../../services/ApiRequest";
import {
  appendCardData,
  setCardData,
} from "../../../store/reducer/MatchingSlice";
import { matchingFilterQuery } from "../../../utils/matchingFilters";
import { useTheme } from "../../../contexts/ThemeContext";
import MatchingModal from "./MachingModal";
import ExtrasSheet from "./molecules/ExtrasSheet";
import MatchCard from "./molecules/MatchCard";
import MatchCardSkeleton from "./molecules/MatchCardSkeleton";
import MatchingHeader from "./molecules/MatchingHeader";

const TAB_NAMES = ["For You", "Nearby"];

const BandMateMatching = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const [tab, setTab] = useState("For You");
  const [extrasSheet, setExtrasSheet] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { cardData, filters } = useSelector((state) => state.matching);
  const filterQuery = matchingFilterQuery(filters);

  // Keeps the pagination effect from fetching the same page twice before
  // `page` has been updated, which would append duplicate profiles
  const isFetchingRef = useRef(false);
  const requestIdRef = useRef(0);

  const getMatchCardData = async (
    pageNumber = 1,
    isInitial = false,
    loading,
  ) => {
    if (isFetchingRef.current && !isInitial) return;
    isFetchingRef.current = true;
    const requestId = ++requestIdRef.current;

    try {
      setLoading(loading);
      // Nearby: closest → furthest (no cut-off) · For You: interest ranking
      const base =
        tab === "Nearby"
          ? `matching/recommendations?limit=40&sort=nearby&page=${pageNumber}`
          : `matching/recommendations?limit=40&page=${pageNumber}`;
      const endpoint = filterQuery ? `${base}&${filterQuery}` : base;
      const response = await get(endpoint);
      // console.log("response---data coming", response?.data);
      // A newer request (tab change / refresh) has been fired meanwhile,
      // applying this response would bring already swiped profiles back
      if (requestId !== requestIdRef.current) return;
      const recommendations = response.data?.recommendations || [];
      const hasMoreData = response.data?.hasMore ?? false;

      if (pageNumber === 1) {
        dispatch(setCardData(recommendations));
      } else {
        dispatch(appendCardData(recommendations));
      }
      setHasMore(hasMoreData);
      setPage(pageNumber);
    } catch (error) {
      console.error("Error fetching match cards:", error);
    } finally {
      if (requestId === requestIdRef.current) {
        isFetchingRef.current = false;
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    getMatchCardData(1, true, true);
  }, [tab, filterQuery]);

  // Pagination trigger when card length is less than 3
  useEffect(() => {
    if (cardData.length > 0 && cardData.length < 3 && hasMore && !loading) {
      getMatchCardData(page + 1, false, false);
    }
  }, [cardData.length, hasMore, loading]);

  return (
    <ScreenWrapper translucent paddingHorizontal={0} paddingBottom={0}>
      {/* Figma › Matching › New-Home: the profile photo is full-bleed, the
          header + For You / Nearby toggle float over it */}
      {loading && page === 1 ? (
        <MatchCardSkeleton />
      ) : cardData && cardData.length > 0 ? (
        <MatchCard
          data={cardData}
          onExtrasNeeded={setExtrasSheet}
          onMatch={setMatch}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Matching
            height={80}
            width={80}
            color={colors.iconMuted}
            marginBottom={10}
          />
          <CustomText
            label="No More Users"
            fontSize={32}
            fontFamily={fonts.BoldItalic}
            color={colors.text}
            marginTop={12}
            fontStyle={"italic"}
          />
          <CustomText
            label="There are no recommendations right now."
            fontFamily={fonts.medium}
            color={colors.iconMuted}
          />
        </View>
      )}

      <MatchingHeader
        tab={tab}
        setTab={setTab}
        tabNames={TAB_NAMES}
        onFilterPress={() => navigation.navigate("FilterScreen")}
        onNotificationPress={() => navigation.navigate("Notification")}
      />

      <ExtrasSheet
        type={extrasSheet}
        onClose={() => setExtrasSheet(null)}
        onAction={(sheet) => {
          setExtrasSheet(null);
          if (sheet?.route) navigation.navigate(...sheet.route);
        }}
      />
      <MatchingModal
        match={match}
        onClose={() => {
          // the matched card stays on screen under the modal; it leaves now
          const done = match?.onDone;
          setMatch(null);
          done?.();
        }}
      />

    </ScreenWrapper>
  );
};

export default BandMateMatching;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
});
