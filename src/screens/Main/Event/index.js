import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { Movie, ShowsSvg } from "../../../assets/svgs";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper, {
  ScreenHeaderInsetConsumer,
  ScreenHeaderSpacer,
} from "../../../components/ScreenWrapper";
import SearchInput from "../../../components/SearchInput";
import TopTab from "../../../components/TopTab";
import { useTabBarVisibility } from "../../../navigation/TabStack";
import { get } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import { getLocationWithPermission } from "../../../utils/LocationUtils";
import EventDetailCard from "./molecules/EventDetailCard";
import EventDetailCardSkeleton from "./molecules/EventDetailCardSkeleton";
import FilterModal from "./molecules/FilterModal";

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

const SORT_LABELS = {
  latest: "Latest",
  priceLowToHigh: "Lowest → Highest",
  priceHighToLow: "Highest → Lowest",
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Map date option label → offset in days
const DATE_OFFSET_DAYS = {
  "Within A Day": 1,
  "Within 3 Days": 3,
  "Within 7 Days": 7,
  "Within 2 Weeks": 14,
  "Within A Month": 30,
};

// Returns { startDateFrom, startDateTo } as ISO 8601 strings
const getDateRange = (option) => {
  const days = DATE_OFFSET_DAYS[option];
  if (!days) return null;
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + days);
  return {
    startDateFrom: from.toISOString().split("T")[0],
    startDateTo: to.toISOString().split("T")[0],
  };
};

const Event = () => {
  const navigation = useNavigation();
  const userData = useSelector((state) => state.users.userData);
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [openFilter, setOpenFilter] = useState(false);
  const [tab, setTab] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // Active filter state
  const [activeFilters, setActiveFilters] = useState({
    sortBy: null,
    distanceRange: null,
    date: null,
  });

  // console.log("userData?.location--", userData?.location);

  const isFilterActive =
    activeFilters.sortBy !== null ||
    activeFilters.distanceRange !== null ||
    activeFilters.date !== null;

  const getEvents = async (
    selectedTab = null,
    filters = activeFilters,
    isRefreshing = false,
  ) => {
    if (!isRefreshing) {
      setEvents([]);
      setLoading(true);
    }
    try {
      const params = [];

      if (selectedTab !== null) {
        params.push(`category=${TAB_NAMES[selectedTab]}`);
      }

      // Sort By
      if (filters?.sortBy) {
        params.push(`sortBy=${filters.sortBy}`);
      }

      // Distance with lat / lng from user location
      if (filters?.distanceRange) {
        const [min, max] = filters.distanceRange;
        params.push(`minDistance=${min}&maxDistance=${max}`);
        let lat = userData?.location?.coordinates?.[0];
        let lng = userData?.location?.coordinates?.[1];

        if (!lat || !lng) {
          try {
            const loc = await getLocationWithPermission();
            lat = loc?.latitude;
            lng = loc?.longitude;
          } catch (e) {
            console.warn("Fallback location fetch failed:", e);
          }
        }

        if (lat !== undefined && lng !== undefined) {
          params.push(`lat=${lat}&lng=${lng}`);
        }
      }

      // Date → ISO 8601
      if (filters?.date) {
        const range = getDateRange(filters.date);
        if (range) {
          params.push(
            `startDateFrom=${encodeURIComponent(
              range.startDateFrom,
            )}&startDateTo=${encodeURIComponent(range.startDateTo)}`,
          );
        }
      }

      const endpoint =
        params.length > 0 ? `events?${params.join("&")}` : "events";

      console.log("endpoint======>", endpoint);

      const response = await get(endpoint);
      if (response.data?.success) {
        setEvents(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEvents(tab, activeFilters);
  }, [tab]);

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    getEvents(tab, filters);
  };

  const clearSingleFilter = (key) => {
    const newFilters = { ...activeFilters, [key]: null };
    setActiveFilters(newFilters);
    getEvents(tab, newFilters, true);
  };

  const { setIsTabBarVisible } = useTabBarVisibility();
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastContentOffset = useRef(0);

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      if (value < 0) return;
      const currentOffset = value;
      const direction =
        currentOffset > lastContentOffset.current ? "down" : "up";
      if (Math.abs(currentOffset - lastContentOffset.current) > 20) {
        if (direction === "down") {
          setIsTabBarVisible(false);
        } else {
          setIsTabBarVisible(true);
        }
        lastContentOffset.current = currentOffset;
      }
    });
    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, setIsTabBarVisible]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      paddingBottom={0.1}
      translucent
      headerBlur
      headerUnScrollable={() => (
        <View style={{ paddingHorizontal: 12 }}>
          {/* Search bar with filter badge */}
          <View>
            <SearchInput
              placeholder={"Search event..."}
              isCross
              isChange
              source={Images.filterOutline}
              CrossPressBack={() => setOpenFilter(true)}
            />
            {isFilterActive && (
              <View style={styles.filterBadge} pointerEvents="none" />
            )}
          </View>

          {/* Active filter chips */}
          {isFilterActive && (
            <View style={styles.activeFiltersRow}>
              {activeFilters.sortBy && (
                <TouchableOpacity
                  style={styles.filterChip}
                  activeOpacity={0.8}
                  onPress={() => clearSingleFilter("sortBy")}
                >
                  <CustomText
                    label={
                      SORT_LABELS[activeFilters.sortBy] || activeFilters.sortBy
                    }
                    fontSize={10}
                    fontFamily={fonts.medium}
                    color={COLORS.white}
                  />
                  <Icons
                    family="Ionicons"
                    name="close"
                    size={10}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              )}
              {activeFilters.distanceRange && (
                <TouchableOpacity
                  style={styles.filterChip}
                  activeOpacity={0.8}
                  onPress={() => clearSingleFilter("distanceRange")}
                >
                  <CustomText
                    label={`${activeFilters.distanceRange[0]}-${activeFilters.distanceRange[1]} km`}
                    fontSize={10}
                    fontFamily={fonts.medium}
                    color={COLORS.white}
                  />
                  <Icons
                    family="Ionicons"
                    name="close"
                    size={10}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              )}
              {activeFilters.date && (
                <TouchableOpacity
                  style={styles.filterChip}
                  activeOpacity={0.8}
                  onPress={() => clearSingleFilter("date")}
                >
                  <CustomText
                    label={activeFilters.date}
                    fontSize={10}
                    fontFamily={fonts.medium}
                    color={COLORS.white}
                  />
                  <Icons
                    family="Ionicons"
                    name="close"
                    size={10}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => setTab(null)}
              activeOpacity={0.7}
              style={{
                backgroundColor: tab === null ? colors.text : colors.white04,
                height: 34,
                width: 40,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 8,
              }}
            >
              <Icons
                family="MaterialCommunityIcons"
                name="compass"
                size={22}
                color={
                  tab === null
                    ? isDark
                      ? COLORS.black
                      : colors.background
                    : colors.text
                }
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
        </View>
      )}
    >
      <ScreenHeaderInsetConsumer>
        {(headerInset) => (
      <FlatList
        data={loading ? [1, 2, 3, 4, 5] : events || []}
        // list starts below the floating blurred header, scrolls under it
        ListHeaderComponent={<ScreenHeaderSpacer />}
        keyExtractor={(item, index) =>
          loading ? index.toString() : item._id || index.toString()
        }
        renderItem={({ item, index }) =>
          loading ? (
            <EventDetailCardSkeleton borderTopWidth={index === 0 ? 6 : 4} />
          ) : (
            <EventDetailCard
              item={item}
              borderTopWidth={index === 0 ? 6 : 4}
              onCardPress={() =>
                navigation.navigate("EventDetail", { id: item._id })
              }
              onInfoPress={() =>
                navigation.navigate("EventDetail", { id: item._id })
              }
              marginBottom={index === events.length - 1 ? 120 : 0}
            />
          )
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.noDataContainer}>
              <ShowsSvg
                height={80}
                width={80}
                color={colors.iconMuted}
                marginBottom={10}
              />
              <CustomText
                label="No Events"
                fontSize={32}
                fontFamily={fonts.BoldItalic}
                color={colors.text}
                marginTop={12}
                fontStyle={"italic"}
              />
              <CustomText
                label="There are no events right now."
                fontFamily={fonts.medium}
                color={colors.iconMuted}
              />
              {/* <CustomButton
                title={"create new event"}
                onPress={() => navigation.navigate("CreateEvent")}
                width={"60%"}
              /> */}
            </View>
          )
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={loading && events.length > 0}
            progressViewOffset={headerInset}
            onRefresh={() => getEvents(tab, activeFilters, true)}
          />
        }
        contentContainerStyle={
          !loading && events?.length === 0 ? { flex: 1 } : {}
        }
        showsVerticalScrollIndicator={false}
      />
        )}
      </ScreenHeaderInsetConsumer>

      {/* <View style={{ height: 120 }} /> */}

      <FilterModal
        isVisible={openFilter}
        onModalClose={() => setOpenFilter(false)}
        onApplyFilters={handleApplyFilters}
        activeFilters={activeFilters}
      />
    </ScreenWrapper>
  );
};

export default Event;

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    noDataContainer: {
      height: SCREEN_HEIGHT / 1.5,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    filterBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: COLORS.buttonColor,
      zIndex: 10,
      borderWidth: 1.5,
      borderColor: isDark ? COLORS.black : colors.background,
    },
    activeFiltersRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 6,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 99,
      backgroundColor: COLORS.buttonColor,
    },
  });
