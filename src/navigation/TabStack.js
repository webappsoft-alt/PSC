import { BlurView } from "@react-native-community/blur";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LinearGradient from "react-native-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { setIsTabBarVisible as setReduxTabBarVisible } from "../store/reducer/playerSlice";
import fonts from "../assets/fonts";
import { useTheme } from "../contexts/ThemeContext";
import {
  CreatePostSvg,
  FavouriteSvg,
  FriendSvg,
  GoLiveSvg,
  HomeSvg,
  Matching,
  Movie,
  ShowsSvg,
  SocialFeedSvg,
  StorySvg,
} from "../assets/svgs";
import CustomText from "../components/CustomText";
import CustomModal from "../components/CustomModal";
import CustomModalGooglePlaces from "../components/CustomModalGooglePlaces";
import { setLocation } from "../store/reducer/usersSlice";
import Icons from "../components/Icons";
import ImageFast from "../components/ImageFast";
import BandMateMatching from "../screens/Main/BandMateMatching";
import CameraScreen from "../screens/Main/CameraScreen";
import Event from "../screens/Main/Event";
import Home from "../screens/Main/Home/Index";
import Profile from "../screens/Main/Profile/Profile";
import Shows from "../screens/Main/TvShow/Shows";
import { COLORS } from "../utils/COLORS";
import Shorts from "../screens/Main/Shorts/index";
import FeedHeader from "../screens/Main/Home/molecules/FeedHeader";
import {
  navToneAnim,
  setNavRect,
  setNavToneEnabled,
} from "../utils/navTone";
import FeedFilterSheet, {
  DEFAULT_FEED_FILTERS,
} from "../screens/Main/Home/molecules/FeedFilterSheet";
import FilterModal from "../components/CarFilterModal";
import {
  enabledTopicNames,
  loadFeedTopics,
  persistFeedTopics,
  resolveFeedTopics,
} from "../utils/feedTopics";
import CustomButton from "../components/CustomButton";
import ViewerWatchScreen from "../screens/Main/LiveScreens/ViewerWatchScreen";

const TAB_NAMES = [
  "Technology",
  "Politics",
  "Sports",
  "Music",
  "Fashion",
  "Entertainment",
  "Gaming",
  "Food",
  "Health",
];

const Tab = createBottomTabNavigator();

const HOME_PAGE_INDEX = 1;

// Pager page indices
// 0: Camera
// 1: Home
// 2: Shorts
// 3: ShowsFromShorts  ← new: Shows opened from Shorts (no tab bar, with header)
// 4: Matching
// 5: Events
// 6: Shows (tab)
// 7: Profile

const PAGER_HOME_INDEX = 1;
const PAGER_SHORTS_INDEX = 2;
const PAGER_SHOWS_FROM_SHORTS_INDEX = 3;
const PAGER_MATCHING_INDEX = 4;
const PAGER_EVENTS_INDEX = 5;
const PAGER_SHOWS_INDEX = 6;
const PAGER_PROFILE_INDEX = 7;

// Maps tab route name -> pager index
const TAB_TO_PAGER = {
  Home: PAGER_HOME_INDEX,
  Matching: PAGER_MATCHING_INDEX,
  Events: PAGER_EVENTS_INDEX,
  Shows: PAGER_SHOWS_INDEX,
  Profile: PAGER_PROFILE_INDEX,
};

// Material Symbols Rounded (filled) — Figma bottom nav
const TAB_ICON_BY_ROUTE = {
  Home: "home",
  Matching: "group",
  Events: "stadium",
  Shows: "live_tv",
};

const HomeWithCameraPager = ({ route, navigation }) => {
  const pagerRef = useRef(null);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { colors, themeMode, isDark } = useTheme();
  const {
    setIsTabBarVisible,
    headerAnim,
    feedRowAnim,
    pagerScrollEnabled,
    registerPagerRef,
    setActivePagerPage,
    pagerProgressShared,
  } = useTabBarVisibility();

  const attachPagerRef = useCallback(
    (ref) => {
      pagerRef.current = ref;
      registerPagerRef(ref);
    },
    [registerPagerRef],
  );

  const [currentPage, setCurrentPage] = useState(HOME_PAGE_INDEX);
  const [tab, setTab] = useState(null);
  // "+" chip → the app's existing topic sheet in toggle mode: a switch per
  // topic, on = shown as a header chip. Saved on device (utils/feedTopics).
  const [topicSheetVisible, setTopicSheetVisible] = useState(false);
  // Header tune button → Figma "Filters" sheet (sorting / time period / topics)
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [feedFilters, setFeedFilters] = useState(DEFAULT_FEED_FILTERS);
  const [topicPrefs, setTopicPrefs] = useState(() => resolveFeedTopics(null));
  const enabledTopics = useMemo(() => enabledTopicNames(topicPrefs), [topicPrefs]);

  useEffect(() => {
    let alive = true;
    loadFeedTopics().then((prefs) => alive && setTopicPrefs(prefs));
    return () => {
      alive = false;
    };
  }, []);

  const handleTopicToggle = useCallback(
    (name, enabled) => {
      const selectedName = tab !== null ? enabledTopics[tab] : null;
      const nextPrefs = topicPrefs.map((t) =>
        t.name === name ? { ...t, enabled } : t,
      );
      const nextEnabled = enabledTopicNames(nextPrefs);
      setTopicPrefs(nextPrefs);
      persistFeedTopics(nextPrefs);
      // keep the same chip selected if it is still shown
      const nextIndex = selectedName ? nextEnabled.indexOf(selectedName) : -1;
      setTab(nextIndex >= 0 ? nextIndex : null);
    },
    [tab, enabledTopics, topicPrefs],
  );

  // Figma: tapping the header location opens the location picker; the chosen
  // area becomes the feed's area filter (posts published around that place).
  const dispatch = useDispatch();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const handleFeedLocationSelect = useCallback(
    (loc) => {
      if (!loc) return;
      dispatch(
        setLocation({
          ...loc,
          city: loc.city || null,
          state: loc.state || null,
          country: loc.country || null,
          countryCode: loc.countryCode || null,
          feedArea: true,
        }),
      );
      setLocationModalVisible(false);
    },
    [dispatch],
  );
  const [isCameraActive, setIsCameraActive] = useState(false);
  const isCameraActiveRef = useRef(false);
  const pagerProgress = useRef(new Animated.Value(HOME_PAGE_INDEX)).current;

  const animateHeader = useCallback(
    (visible) => {
      Animated.timing(headerAnim, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    [headerAnim],
  );

  useEffect(() => {
    if (!isFocused || !pagerRef.current) return;
    setIsTabBarVisible(true);
  }, [isFocused, setIsTabBarVisible]);

  useEffect(() => {
    if (isFocused) return;
    if (!isCameraActiveRef.current) return;
    isCameraActiveRef.current = false;
    setIsCameraActive(false);
  }, [isFocused]);

  const { requestedPagerPage, clearRequestedPagerPage } = useTabBarVisibility();
  useEffect(() => {
    if (requestedPagerPage !== null && pagerRef.current) {
      pagerRef.current.setPageWithoutAnimation(requestedPagerPage);
      clearRequestedPagerPage();
    }
  }, [requestedPagerPage, clearRequestedPagerPage]);

  const handlePageChange = useCallback(
    (e) => {
      const pageIndex = e.nativeEvent.position;
      setCurrentPage((prevPage) =>
        prevPage === pageIndex ? prevPage : pageIndex,
      );
      setActivePagerPage(pageIndex);
      // adaptive tab bar tone only follows media on the Home feed
      setNavToneEnabled(pageIndex === PAGER_HOME_INDEX);

      pagerProgress.setValue(pageIndex);
      pagerProgressShared.setValue(pageIndex);

      const nextIsCameraActive = pageIndex === 0 && isFocused;
      if (isCameraActiveRef.current !== nextIsCameraActive) {
        isCameraActiveRef.current = nextIsCameraActive;
        setIsCameraActive(nextIsCameraActive);
      }

      if (pageIndex === PAGER_HOME_INDEX) {
        setIsTabBarVisible(true);
      } else if (pageIndex === PAGER_SHORTS_INDEX) {
        setIsTabBarVisible(false);
      } else if (pageIndex === PAGER_SHOWS_FROM_SHORTS_INDEX) {
        // Live opened from Shorts — show tab bar, hide header
        setIsTabBarVisible(true);
      } else if (pageIndex === PAGER_MATCHING_INDEX) {
        setIsTabBarVisible(true);
      } else if (pageIndex === PAGER_EVENTS_INDEX) {
        setIsTabBarVisible(true);
      } else if (pageIndex === PAGER_SHOWS_INDEX) {
        setIsTabBarVisible(true);
      } else if (pageIndex === PAGER_PROFILE_INDEX) {
        setIsTabBarVisible(true);
      } else {
        // Camera (0) or any other
        setIsTabBarVisible(false);
      }
    },
    [isFocused, setActivePagerPage, setIsTabBarVisible],
  );

  const handlePageScroll = useCallback(
    (e) => {
      const { position, offset } = e.nativeEvent;
      const val = position + offset;
      pagerProgress.setValue(val);
      pagerProgressShared.setValue(val);

      const nextIsCameraActive = (position === 0 || offset > 0) && isFocused;
      if (isCameraActiveRef.current !== nextIsCameraActive) {
        isCameraActiveRef.current = nextIsCameraActive;
        setIsCameraActive(nextIsCameraActive);
      }
    },
    [isFocused, pagerProgress, pagerProgressShared],
  );

  const onSetPage = useCallback((index) => {
    pagerRef.current?.setPageWithoutAnimation(index);
  }, []);

  // Header visible on pages 1 (Home), 2 (Shorts)
  // Fades in from page 0→1, fades out from page 2→3
  const headerOpacity = pagerProgress.interpolate({
    inputRange: [0, 0.8, 1, 2, 2.3],
    outputRange: [0, 0, 1, 1, 0],
    extrapolate: "clamp",
  });

  const bgOpacity = pagerProgress.interpolate({
    inputRange: [1, 1.2, 2, 2.2, 3],
    outputRange: themeMode === "light" ? [1, 1, 1, 0, 0] : [1, 0, 0, 0, 0],
    extrapolate: "clamp",
  });

  const isHeaderVisible =
    currentPage >= PAGER_HOME_INDEX && currentPage <= PAGER_SHORTS_INDEX;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          opacity: Animated.multiply(headerOpacity, headerAnim),
          paddingTop: insets.top,
          pointerEvents: "box-none",
        }}
        pointerEvents={isHeaderVisible ? "box-none" : "none"}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                themeMode === "dark" ? "rgba(18, 18, 18, 0.97)" : "transparent",
              opacity: bgOpacity,
            },
          ]}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={themeMode === "light" ? "light" : "dark"}
            blurAmount={2}
            reducedTransparencyFallbackColor="#FFFFFF35"
          />
          {themeMode === "light" && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: "rgba(0, 0, 0, 0.32)",
                },
              ]}
            />
          )}
        </Animated.View>
        <FeedHeader
          isShort={currentPage === PAGER_SHORTS_INDEX}
          isLive={
            currentPage === PAGER_SHOWS_FROM_SHORTS_INDEX ||
            currentPage === PAGER_SHOWS_INDEX
          }
          pagerProgress={pagerProgress}
          onSetPage={onSetPage}
          tab={tab}
          setTab={setTab}
          tabNames={enabledTopics}
          feedRowAnim={feedRowAnim}
          onLocationPress={() => setLocationModalVisible(true)}
          onAddTopicPress={() => setTopicSheetVisible(true)}
          onFilterPress={() => setFilterSheetVisible(true)}
        />
      </Animated.View>

      <PagerView
        ref={attachPagerRef}
        style={styles.pager}
        initialPage={HOME_PAGE_INDEX}
        offscreenPageLimit={2}
        overScrollMode="never"
        scrollEnabled={pagerScrollEnabled}
        onPageSelected={handlePageChange}
        onPageScroll={handlePageScroll}
      >
        {/* Page 0 - Camera */}
        <View key="camera" style={styles.pagerPage}>
          <CameraScreen
            navigation={navigation}
            isCameraActive={isCameraActive}
          />
        </View>

        {/* Page 1 - Home */}
        <View key="home" style={styles.pagerPage}>
          <Home
            route={route}
            pagerProgress={pagerProgress}
            onSetPage={onSetPage}
            isFocusedPage={currentPage === PAGER_HOME_INDEX && isFocused}
            sharedTab={tab}
            sharedTabNames={enabledTopics}
            feedFilters={feedFilters}
          />
        </View>

        {/* Page 2 - Shorts */}
        <View key="shorts" style={styles.pagerPage}>
          <Shorts
            pagerProgress={pagerProgress}
            onSetPage={onSetPage}
            isFocusedPage={currentPage === PAGER_SHORTS_INDEX && isFocused}
            sharedTab={tab}
            animateHeader={animateHeader}
          />
        </View>

        {/* Page 3 - Live from Shorts (tab bar hidden, header hidden) */}
        <View key="shows-from-shorts" style={styles.pagerPage}>
          <ViewerWatchScreen
            isFocusedPage={
              currentPage === PAGER_SHOWS_FROM_SHORTS_INDEX && isFocused
            }
            suppressOverlay
          />
        </View>

        {/* Page 4 - Matching */}
        <View key="matching" style={styles.pagerPage}>
          <BandMateMatching
            isFocusedPage={currentPage === PAGER_MATCHING_INDEX && isFocused}
          />
        </View>

        {/* Page 5 - Events */}
        <View key="events" style={styles.pagerPage}>
          <Event
            isFocusedPage={currentPage === PAGER_EVENTS_INDEX && isFocused}
          />
        </View>

        {/* Page 6 - Shows (tab bar visible) */}
        <View key="shows-tab" style={styles.pagerPage}>
          <ViewerWatchScreen
            isFocusedPage={currentPage === PAGER_SHOWS_INDEX && isFocused}
          />
        </View>

        {/* Page 7 - Profile */}
        <View key="profile" style={styles.pagerPage}>
          <Profile
            isFocusedPage={currentPage === PAGER_PROFILE_INDEX && isFocused}
          />
        </View>
      </PagerView>

      <CustomModalGooglePlaces
        isVisible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onLocationSelect={handleFeedLocationSelect}
      />
      <FilterModal
        isVisible={topicSheetVisible}
        onDisable={() => setTopicSheetVisible(false)}
        title="Pick Your Interests"
        toggleMode
        enabledItems={enabledTopics}
        onToggleItem={handleTopicToggle}
      />
      <FeedFilterSheet
        visible={filterSheetVisible}
        onDismiss={() => setFilterSheetVisible(false)}
        filters={feedFilters}
        onApply={setFeedFilters}
        enabledTopics={enabledTopics}
        onToggleTopic={handleTopicToggle}
      />
    </View>
  );
};

// Figma `Create` menu (FAB): top → bottom
const CREATE_MENU_ITEMS = [
  { label: "Go Live", icon: "fiber_manual_record", filled: true, route: "PublishLive" },
  { label: "Story", icon: "web_stories", filled: true, route: "CameraScreen" },
  { label: "Radio", icon: "mic", filled: true, route: "CreateAudio" },
  { label: "Poll", icon: "ballot", filled: true, route: "CreatePost", params: { postType: "poll" } },
  { label: "Picture", icon: "photo_camera", filled: true, route: "CreatePost", params: { postType: "picture" } },
  { label: "Post", icon: "edit", filled: true, route: "CreatePost" },
];
const CREATE_MENU_OFFSETS = [-310, -250, -190, -130, -70, -10];

const TabBarVisibilityContext = createContext();

export const useTabBarVisibility = () => useContext(TabBarVisibilityContext);

export const TabBarVisibilityProvider = ({ children }) => {
  const [isTabBarVisible, setIsTabBarVisibleState] = useState(true);
  const [pagerScrollEnabled, setPagerScrollEnabledState] = useState(true);
  const headerAnim = useRef(new Animated.Value(1)).current;
  const pagerRefHolder = useRef(null);
  const pagerLockedRef = useRef(false);
  const isTabBarVisibleRef = useRef(true);
  const pendingPagerPageRef = useRef(null);
  const dispatch = useDispatch();

  const [activePagerPage, setActivePagerPageState] = useState(PAGER_HOME_INDEX);

  const pagerProgressShared = useRef(
    new Animated.Value(PAGER_HOME_INDEX),
  ).current;

  const [requestedPagerPage, setRequestedPagerPage] = useState(null);

  // Figma Home-Feed: the Feed/Shorts row collapses on scroll (Pinterest-style)
  const feedRowAnim = useRef(new Animated.Value(1)).current;
  const feedRowVisibleRef = useRef(true);
  const setFeedRowVisible = useCallback(
    (visible) => {
      if (feedRowVisibleRef.current === visible) return;
      feedRowVisibleRef.current = visible;
      Animated.timing(feedRowAnim, {
        toValue: visible ? 1 : 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [feedRowAnim],
  );

  // Threads-style "+" button — hidden at the top of the feed, shows on scroll
  const [isPlusVisible, setIsPlusVisibleState] = useState(false);
  const setPlusVisible = useCallback((visible) => {
    setIsPlusVisibleState((prev) => (prev === visible ? prev : visible));
  }, []);

  const setActivePagerPage = useCallback((page) => {
    if (
      pendingPagerPageRef.current !== null &&
      pendingPagerPageRef.current !== page
    ) {
      return;
    }

    if (pendingPagerPageRef.current === page) {
      pendingPagerPageRef.current = null;
    }

    setActivePagerPageState((prevPage) =>
      prevPage === page ? prevPage : page,
    );
  }, []);

  const clearRequestedPagerPage = useCallback(() => {
    setRequestedPagerPage((prevPage) => (prevPage === null ? prevPage : null));
  }, []);

  const setIsTabBarVisible = useCallback(
    (visible) => {
      if (isTabBarVisibleRef.current === visible) return;
      isTabBarVisibleRef.current = visible;
      setIsTabBarVisibleState(visible);
      dispatch(setReduxTabBarVisible(visible));
    },
    [dispatch],
  );

  const isTabStackFocused = useIsFocused();

  useEffect(() => {
    dispatch(setReduxTabBarVisible(isTabStackFocused));
  }, [isTabStackFocused, dispatch]);

  const registerPagerRef = useCallback((ref) => {
    pagerRefHolder.current = ref;
  }, []);

  const setPagerScrollEnabled = useCallback((enabled) => {
    if (enabled) {
      if (!pagerLockedRef.current) return;
      pagerLockedRef.current = false;
      pagerRefHolder.current?.setScrollEnabled?.(true);
      setPagerScrollEnabledState(true);
    } else {
      if (pagerLockedRef.current) return;
      pagerLockedRef.current = true;
      pagerRefHolder.current?.setScrollEnabled?.(false);
    }
  }, []);

  const navigateToPagerPage = useCallback((pageIndex) => {
    pendingPagerPageRef.current = pageIndex;
    setActivePagerPageState((prevPage) =>
      prevPage === pageIndex ? prevPage : pageIndex,
    );

    if (pagerRefHolder.current) {
      pagerRefHolder.current.setPageWithoutAnimation(pageIndex);
      return;
    }

    setRequestedPagerPage(pageIndex);
  }, []);

  const value = useMemo(
    () => ({
      isTabBarVisible,
      setIsTabBarVisible,
      headerAnim,
      pagerScrollEnabled,
      setPagerScrollEnabled,
      registerPagerRef,
      activePagerPage,
      setActivePagerPage,
      pagerProgressShared,
      requestedPagerPage,
      clearRequestedPagerPage,
      navigateToPagerPage,
      feedRowAnim,
      setFeedRowVisible,
      isPlusVisible,
      setPlusVisible,
    }),
    [
      isTabBarVisible,
      setIsTabBarVisible,
      headerAnim,
      pagerScrollEnabled,
      setPagerScrollEnabled,
      registerPagerRef,
      activePagerPage,
      setActivePagerPage,
      pagerProgressShared,
      requestedPagerPage,
      clearRequestedPagerPage,
      navigateToPagerPage,
      feedRowAnim,
      setFeedRowVisible,
      isPlusVisible,
      setPlusVisible,
    ],
  );

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
};

const CustomTabBarButton = memo(({ onPress, isActive }) => {
  const userData = useSelector((state) => state.users.userData);
  const { themeMode } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.customButtonContainer,
        isActive && {
          backgroundColor: COLORS.white,
          borderRadius: 99,
        },
      ]}
      onPress={onPress}
      activeOpacity={1}
    >
      {!userData?.profile?.avatar ? (
        <View
          style={[
            styles.buzz,
            {
              backgroundColor: userData?.profile?.profileColor,
            },
          ]}
        />
      ) : (
        <ImageFast
          source={{ uri: userData.profile.avatar }}
          style={styles.buzz}
        />
      )}
    </TouchableOpacity>
  );
});

const PagerTabBarItem = memo(
  ({
    routeName,
    routeKey,
    isFocused,
    navigation,
    navigateToPagerPage,
    toggleLeftMenu,
    setLeftSelectedFeedType,
  }) => {
    const { colors, themeMode } = useTheme();
    const onPress = useCallback(() => {
      const event = navigation.emit({
        type: "tabPress",
        target: routeKey,
        canPreventDefault: true,
      });

      if (routeName === "Home") {
        if (isFocused) {
          if (!event.defaultPrevented) {
            toggleLeftMenu();
          }
        } else if (!event.defaultPrevented) {
          setLeftSelectedFeedType("social");
          navigation.navigate(routeName, { feedType: "social" });
          navigateToPagerPage(PAGER_HOME_INDEX);
        }
      } else if (
        routeName === "Matching" ||
        routeName === "Events" ||
        routeName === "Shows" ||
        routeName === "Profile"
      ) {
        if (!event.defaultPrevented) {
          navigation.navigate("Home");
          navigateToPagerPage(TAB_TO_PAGER[routeName]);
        }
      } else if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    }, [
      isFocused,
      navigateToPagerPage,
      navigation,
      routeKey,
      routeName,
      setLeftSelectedFeedType,
      toggleLeftMenu,
    ]);

    if (routeName === "Profile") {
      return <CustomTabBarButton onPress={onPress} isActive={isFocused} />;
    }

    const IconComponent = TAB_ICON_BY_ROUTE[routeName];

    return (
      <TouchableOpacity
        style={[
          styles.iconMainContainer,
          isFocused && {
            backgroundColor: COLORS.white,
          },
        ]}
        activeOpacity={1}
        onPress={onPress}
      >
        {IconComponent && isFocused && (
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name={IconComponent}
            size={26}
            color={COLORS.black}
          />
        )}
        {IconComponent && !isFocused && (
          // iOS 26-style adaptive icon: cross-fades to dark while light media
          // is behind the glass bar (utils/navTone)
          <View style={styles.toneIconBox}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.toneIconLayer,
                {
                  opacity: navToneAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                },
              ]}
            >
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name={IconComponent}
                size={26}
                color={themeMode === "light" ? COLORS.white : colors.iconMuted}
              />
            </Animated.View>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.toneIconLayer,
                { opacity: navToneAnim },
              ]}
            >
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name={IconComponent}
                size={26}
                color="#121212"
              />
            </Animated.View>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

const CustomTabBar = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, themeMode } = useTheme();
  const { isTabBarVisible, activePagerPage, navigateToPagerPage } =
    useTabBarVisibility();
  const [optimisticActivePage, setOptimisticActivePage] =
    useState(activePagerPage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [leftSelectedFeedType, setLeftSelectedFeedType] = useState("social");

  const tabTranslateY = useRef(new Animated.Value(0)).current;
  const tabBarPillRef = useRef(null);

  useEffect(() => {
    Animated.timing(tabTranslateY, {
      toValue: isTabBarVisible ? 0 : 300,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible]);

  // Threads-style "+": part of the bar while it's shown; when the bar slides
  // away on scroll down the "+" stays behind as a floating button, and the
  // bar comes back around it on scroll up.
  const plusVisibleEffective = true;
  const plusAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(plusAnim, {
      toValue: plusVisibleEffective ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [plusVisibleEffective, plusAnim]);
  const plusScale = plusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  useEffect(() => {
    setOptimisticActivePage(activePagerPage);
  }, [activePagerPage]);

  const handleNavigateToPagerPage = useCallback(
    (pageIndex) => {
      setOptimisticActivePage(pageIndex);
      navigateToPagerPage(pageIndex);
    },
    [navigateToPagerPage],
  );

  // Animation values for right menu
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(
    CREATE_MENU_ITEMS.map(() => new Animated.Value(0)),
  ).current;
  const menuTranslate = useRef(
    CREATE_MENU_ITEMS.map(() => new Animated.Value(0)),
  ).current;

  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Animation values for left menu
  const leftScaleAnim1 = useRef(new Animated.Value(0)).current;
  const leftScaleAnim2 = useRef(new Animated.Value(0)).current;
  const leftScaleAnim3 = useRef(new Animated.Value(0)).current;

  const leftTranslateY1 = useRef(new Animated.Value(0)).current;
  const leftTranslateY2 = useRef(new Animated.Value(0)).current;
  const leftTranslateY3 = useRef(new Animated.Value(0)).current;

  const leftOverlayOpacity = useRef(new Animated.Value(0)).current;

  const toggleMenu = useCallback(() => {
    if (!menuOpen) {
      setMenuOpen(true);
      Animated.parallel([
        Animated.spring(rotateAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        ...CREATE_MENU_ITEMS.flatMap((_, idx) => {
          const delay = (CREATE_MENU_ITEMS.length - 1 - idx) * 40;
          return [
            Animated.spring(menuScale[idx], {
              toValue: 1,
              delay,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(menuTranslate[idx], {
              toValue: CREATE_MENU_OFFSETS[idx],
              delay,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
          ];
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(rotateAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        ...CREATE_MENU_ITEMS.flatMap((_, idx) => [
          Animated.spring(menuScale[idx], {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(menuTranslate[idx], {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]),
      ]).start(() => setMenuOpen(false));
    }
  }, [
    menuOpen,
    overlayOpacity,
    rotateAnim,
    menuScale,
    menuTranslate,
  ]);

  const toggleLeftMenu = useCallback(() => {
    if (!leftMenuOpen) {
      setLeftMenuOpen(true);
      Animated.parallel([
        Animated.timing(leftOverlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(leftScaleAnim1, {
          toValue: 1,
          delay: 100,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(leftTranslateY1, {
          toValue: -130,
          delay: 100,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(leftScaleAnim2, {
          toValue: 1,
          delay: 50,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(leftTranslateY2, {
          toValue: -70,
          delay: 50,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(leftScaleAnim3, {
          toValue: 1,
          delay: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(leftTranslateY3, {
          toValue: -10,
          delay: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(leftOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(leftScaleAnim1, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(leftTranslateY1, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(leftScaleAnim2, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(leftTranslateY2, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(leftScaleAnim3, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(leftTranslateY3, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start(() => setLeftMenuOpen(false));
    }
  }, [
    leftMenuOpen,
    leftOverlayOpacity,
    leftScaleAnim1,
    leftScaleAnim2,
    leftScaleAnim3,
    leftTranslateY1,
    leftTranslateY2,
    leftTranslateY3,
  ]);

  const handleOptionPress = (route, params) => {
    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      ...CREATE_MENU_ITEMS.flatMap((_, idx) => [
        Animated.spring(menuScale[idx], {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(menuTranslate[idx], {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]),
    ]).start(() => {
      setMenuOpen(false);
      navigation.navigate(route, params);
    });
  };

  const handleProGatedPress = (route, params) => {
    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      ...CREATE_MENU_ITEMS.flatMap((_, idx) => [
        Animated.spring(menuScale[idx], {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(menuTranslate[idx], {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]),
    ]).start(() => {
      setMenuOpen(false);
      navigation.navigate(route, params);
    });
  };

  const handleLeftOptionPress = (route, params) => {
    Animated.parallel([
      Animated.timing(leftOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(leftScaleAnim1, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(leftTranslateY1, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(leftScaleAnim2, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(leftTranslateY2, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(leftScaleAnim3, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(leftTranslateY3, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start(() => {
      setLeftMenuOpen(false);

      if (route === "Home") {
        const type = params?.feedType || "social";
        setLeftSelectedFeedType(type);
      }

      navigation.navigate(route, params);
    });
  };

  const rotation = useMemo(
    () =>
      rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "135deg"],
      }),
    [rotateAnim],
  );

  // Simple active state check — no animation, instant highlight
  const isTabPagerActive = useCallback(
    (routeName) => optimisticActivePage === TAB_TO_PAGER[routeName],
    [optimisticActivePage],
  );

  return (
    <>
      {/* Right Menu Overlay */}
      {menuOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <LinearGradient
            colors={[`${colors.background}B3`, `${COLORS.buttonColor}`]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={toggleMenu}
          />
        </Animated.View>
      )}

      {/* Left Menu Overlay */}
      {leftMenuOpen && (
        <Animated.View
          style={[styles.overlay, { opacity: leftOverlayOpacity }]}
        >
          <LinearGradient
            colors={[`${colors.background}B3`, `${COLORS.buttonColor}`]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={toggleLeftMenu}
          />
        </Animated.View>
      )}

      {/* Floating Right Menu Options — Figma create menu: 6 items, 48px gold circles, 24 SemiBold labels, gap 10 */}
      {menuOpen && (
        <View style={[styles.menuContainer, { bottom: 50 + insets.bottom }]}>
          {CREATE_MENU_ITEMS.map((menuItem, idx) => (
            <Animated.View
              key={menuItem.label}
              style={[
                styles.menuOptionWrapper,
                {
                  marginBottom: idx === CREATE_MENU_ITEMS.length - 1 ? 20 : -46,
                  transform: [
                    { translateY: menuTranslate[idx] },
                    { scale: menuScale[idx] },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.menuOption}
                activeOpacity={0.8}
                onPress={() =>
                  menuItem.pro
                    ? handleProGatedPress(menuItem.route, menuItem.params)
                    : handleOptionPress(menuItem.route, menuItem.params)
                }
              >
                <CustomText
                  label={menuItem.label}
                  fontSize={24}
                  fontFamily={fonts.semiBold}
                  letterSpacing={-0.5}
                  marginRight={10}
                  color={COLORS.white}
                />
                <View style={styles.menuButton}>
                  <Icons
                    family={
                      menuItem.filled
                        ? "MaterialSymbolsRoundedFilled"
                        : "MaterialSymbolsRounded"
                    }
                    name={menuItem.icon}
                    size={24}
                    color={COLORS.white}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Floating Left Menu Options */}
      {leftMenuOpen && (
        <View
          style={[styles.leftMenuContainer, { bottom: 50 + insets.bottom }]}
        >
          <Animated.View
            style={[
              styles.menuOptionWrapper,
              {
                marginBottom: -46,
                transform: [
                  { translateY: leftTranslateY1 },
                  { scale: leftScaleAnim1 },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.leftMenuOption}
              activeOpacity={0.8}
              onPress={() =>
                handleLeftOptionPress("Home", { feedType: "favourite" })
              }
            >
              <View style={styles.menuButton}>
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="stars"
                  size={24}
                  color={COLORS.white}
                />
              </View>
              <CustomText
                label="Favorites"
                fontSize={24}
                fontFamily={fonts.semiBold}
                letterSpacing={-0.5}
                marginLeft={10}
                marginRight={12}
                color={
                  leftSelectedFeedType === "favourite"
                    ? COLORS.white
                    : "#A19375"
                }
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.menuOptionWrapper,
              {
                marginBottom: -46,
                transform: [
                  { translateY: leftTranslateY2 },
                  { scale: leftScaleAnim2 },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.leftMenuOption}
              activeOpacity={0.8}
              onPress={() =>
                handleLeftOptionPress("Home", { feedType: "friends" })
              }
            >
              <View style={styles.menuButton}>
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="groups"
                  size={24}
                  color={COLORS.white}
                />
              </View>
              <CustomText
                label="Friends"
                fontSize={24}
                fontFamily={fonts.semiBold}
                letterSpacing={-0.5}
                marginLeft={10}
                marginRight={12}
                color={
                  leftSelectedFeedType === "friends" ? COLORS.white : "#A19375"
                }
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.menuOptionWrapper,
              {
                marginBottom: 20,
                transform: [
                  { translateY: leftTranslateY3 },
                  { scale: leftScaleAnim3 },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.leftMenuOption}
              activeOpacity={0.8}
              onPress={() =>
                handleLeftOptionPress("Home", { feedType: "social" })
              }
            >
              <View style={styles.menuButton}>
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="rss_feed"
                  size={24}
                  color={COLORS.white}
                />
              </View>
              <CustomText
                label="Social Feed"
                fontSize={24}
                fontFamily={fonts.semiBold}
                letterSpacing={-0.5}
                marginLeft={10}
                marginRight={12}
                color={
                  leftSelectedFeedType === "social" ? COLORS.white : "#A19375"
                }
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <Animated.View
        style={[
          styles.tabMainContainer,
          {
            height: 90 + insets.bottom,
            transform: [{ translateY: tabTranslateY }],
          },
        ]}
      >
        <View
          style={styles.tabContentContainer}
          collapsable={false}
          ref={(node) => {
            tabBarPillRef.current = node;
          }}
          onLayout={() => {
            // window rect of the glass pill → navTone probe line
            requestAnimationFrame(() =>
              tabBarPillRef.current?.measureInWindow?.((x, y, w, h) => {
                if (h > 0) setNavRect({ y, height: h });
              }),
            );
          }}
        >
          <BlurView
            style={StyleSheet.absoluteFillObject}
            blurType={"light"}
            blurAmount={6}
            reducedTransparencyFallbackColor="#FFFFFF35"
          />
          {themeMode === "light" && (
            <View
              pointerEvents="none"
              style={[
                styles.default,
                {
                  backgroundColor: "rgba(0, 0, 0, 0.32)",
                },
              ]}
            />
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: 4,
              backgroundColor:
                menuOpen || leftMenuOpen
                  ? themeMode === "dark"
                    ? "#ffffff14"
                    : "rgba(0,0,0,0.06)"
                  : "transparent",
            }}
          >
            {state.routes.map((route) => (
              <PagerTabBarItem
                key={route.key}
                routeName={route.name}
                routeKey={route.key}
                isFocused={isTabPagerActive(route.name)}
                navigation={navigation}
                navigateToPagerPage={handleNavigateToPagerPage}
                toggleLeftMenu={toggleLeftMenu}
                setLeftSelectedFeedType={setLeftSelectedFeedType}
              />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Animated Plus Button */}
      <Animated.View
        pointerEvents={plusVisibleEffective ? "auto" : "none"}
        style={[
          styles.plusButton,
          {
            // Outside the sliding bar, so it stays put (floating) when the
            // bar hides on scroll down and the bar returns around it on
            // scroll up — Threads behaviour.
            zIndex: 1000,
            bottom: 14 + insets.bottom,
            overflow: "hidden",
            opacity: plusAnim,
            transform: [
              // Floating only on the Home feed; elsewhere it still hides
              // together with the bar (Shorts, Live, …)
              {
                translateY:
                  activePagerPage === PAGER_HOME_INDEX || menuOpen
                    ? 0
                    : tabTranslateY,
              },
              { scale: plusScale },
            ],
            // backgroundColor: menuOpen
            //   ? themeMode === "dark"
            //     ? COLORS.white
            //     : COLORS.black
            //   : themeMode === "dark"
            //   ? "#FFFFFF35"
            //   : "rgba(0, 0, 0, 0.35)",
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.plusButtonTouchable, {}]}
          activeOpacity={0.7}
          onPress={toggleMenu}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Icons
              family="MaterialSymbolsRounded"
              name="add"
              size={28}
              color="#121212"
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <CustomModal
        isBlur
        isVisible={showUpgradeModal}
        onDisable={() => setShowUpgradeModal(false)}
        reducedTransparencyFallbackColor="rgba(0,0,0,0.1)"
      >
        <View
          style={{
            margin: 10,
            borderRadius: 32,
            padding: 4,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.surfaceAlt,
          }}
        >
          <BlurView
            blurType={themeMode === "dark" ? "light" : "dark"}
            blurAmount={10}
            reducedTransparencyFallbackColor="#FFFFFF29"
            style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]}
          />
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 28,
              width: "100%",
              alignSelf: "center",
              padding: 18,
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginBottom: 20,
              }}
            >
              <CustomText
                label="Upgrade to Pro"
                fontFamily={fonts.semiBold}
                fontSize={20}
                color={colors.text}
              />
              <TouchableOpacity
                onPress={() => setShowUpgradeModal(false)}
                style={{
                  padding: 8,
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 20,
                }}
              >
                <Icons
                  name="close"
                  family="AntDesign"
                  color={colors.text}
                  size={16}
                />
              </TouchableOpacity>
            </View>

            <CustomText
              label="Create Events and Reels to grow your audience and connect with your community."
              fontFamily={fonts.medium}
              fontSize={15}
              color={colors.textSecondary}
              textAlign="center"
              lineHeight={22}
              marginBottom={30}
            />

            <CustomButton
              onPress={() => {
                setShowUpgradeModal(false);
                navigation.navigate("PlansViral");
              }}
              title="Go Pro"
            />
          </View>
        </View>
      </CustomModal>
    </>
  );
};

const TabStackContent = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeWithCameraPager}
        screenOptions={{
          tabBarStyle: { display: "none" },
          swipeEnabled: true,
          animationEnabled: true,
        }}
      />
      <Tab.Screen name="Matching" component={BandMateMatching} />
      <Tab.Screen name="Events" component={Event} />
      <Tab.Screen name="Shows" component={Shows} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

const TabStack = () => {
  return (
    <TabBarVisibilityProvider>
      <TabStackContent />
    </TabBarVisibilityProvider>
  );
};

export default TabStack;

const styles = StyleSheet.create({
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  buzz: {
    width: 46,
    height: 46,
    borderRadius: 99,
  },
  customButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconMainContainer: {
    width: 48,
    height: 48,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContentContainer: {
    backgroundColor: COLORS?.light?.inputBackground,
    borderRadius: 100,
    alignSelf: "flex-start",
    marginTop: 10,
    marginLeft: 20,
    height: 56,
    overflow: "hidden",
  },
  tabMainContainer: {
    paddingTop: 10,
    width: "100%",
    position: "absolute",
    zIndex: 999,
    bottom: 0,
  },
  plusButton: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  toneIconBox: { width: 26, height: 26 },
  toneIconLayer: { alignItems: "center", justifyContent: "center" },
  plusButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBG: {
    width: "100%",
    height: "100%",
    position: "absolute",
    bottom: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  menuContainer: {
    position: "absolute",
    right: 20,
    zIndex: 999,
    alignItems: "flex-end",
  },
  leftMenuContainer: {
    position: "absolute",
    left: 20,
    zIndex: 999,
    alignItems: "flex-start",
  },
  menuOptionWrapper: {
    marginBottom: 16,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "red",
  },
  leftMenuOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 99,
    backgroundColor: COLORS.buttonColor,
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  icons: {
    height: 24,
    width: 24,
  },
  iconLeft: {
    height: 24,
    width: 24,
  },
  pager: {
    flex: 1,
  },
  pagerPage: {
    flex: 1,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    gap: 6,
    paddingBottom: 10,
  },
  default: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
