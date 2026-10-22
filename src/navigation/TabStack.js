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
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  PlatformColor,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from "@callstack/liquid-glass";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LinearGradient from "react-native-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
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
import FeedHeader, {
  FEED_HEADER_COLLAPSE,
} from "../screens/Main/Home/molecules/FeedHeader";
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
import ProgressiveBlur from "../components/ProgressiveBlur";
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

// Viral (components/MainPager.tsx): while a page is swiped, every page turns
// into a rounded card (r52), side pages shrink to 0.96 and sit 4pt apart, and
// the space between them reads as pure black against the screens' #121212.
const PAGE_RADIUS_MAX = 52;
const PAGE_GAP = 4;
const PAGE_SCALE_DRAG = 0.96;
const PAGE_BACKDROP = "#000000";

const PagerPage = ({
  index,
  pageScroll,
  pagerChrome,
  pagerDrag,
  gap = true,
  // PagerView clones each page with an absolute-fill style
  style,
  children,
}) => {
  // 1 when this page is centred, 0 one page away (Viral's 1 - progress)
  const closeness = pageScroll.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });
  const scale = Animated.multiply(closeness, pagerDrag).interpolate({
    inputRange: [0, 1],
    outputRange: [1, PAGE_SCALE_DRAG],
  });
  return (
    <View
      style={[styles.pagerPage, style, { backgroundColor: PAGE_BACKDROP }]}
      collapsable={false}
    >
      <Animated.View
        style={{
          flex: 1,
          overflow: "hidden",
          borderRadius: Animated.multiply(pagerChrome, PAGE_RADIUS_MAX),
          // Viral: Home only rounds; the other pages also inset and scale
          marginHorizontal: gap ? Animated.multiply(pagerChrome, PAGE_GAP) : 0,
          transform: gap ? [{ scale }] : [],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
};

// native-driven onPageScroll (Animated.event) so the tab chip follows the
// swipe on the UI thread
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

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

// Ported from Viral `components/PagerTabBar` (client: "re-use the one on
// Viral, adapt the colours"). Figma "Bottom nav": 335 × 60 on a 375 frame
// (20 from each edge), padding 4, five equal 52-tall slots, the active slot
// drawn as a pill chip (white 4%) sliding behind its icon.
const NAV_BAR_HEIGHT = 60;
const NAV_BAR_PAD = 4;
const NAV_TAB_HEIGHT = NAV_BAR_HEIGHT - NAV_BAR_PAD * 2;
const NAV_BAR_INSET = 20;
// Figma (Feed Posts › New-Feed-Filter nav): each tab is a 72 × 52 slot with
// a -8 gap, so the #080808 r100 chip is 72 wide and the tab centres sit
// (bar − pad·2 − 72) / 4 apart
const NAV_CHIP_WIDTH = 72;
// Figma "Plus" (Home-Feed, fixed): 60 circle, #1E1E1E 64% + background
// blur, 1px white 8% inside stroke, `add` 28 white 64%, right 12 / bottom 20
const FAB_SIZE = 60;
// Figma nav container (375 × 112): progressive background blur 0 → 16 and a
// #121212 0% → 100% linear fill, top → bottom; pad 32 above the 60 bar,
// 20 below (= the bar's bottom offset, added at render)
const NAV_PROGRESSIVE_HEIGHT = 32 + NAV_BAR_HEIGHT;
// iOS 26+: the bar is real Liquid Glass (same as Viral / Reddit) — the system
// re-tints the glass and `labelColor` from the content behind it, natively.
// Elsewhere we fall back to blur + the JS tone probe (utils/navTone).
// iOS 26+: real Liquid Glass with the system-adaptive selected icon / chip
// (Reddit / iOS 26 TabView). Everywhere else the Figma bar: #1E1E1E 64% +
// blur 16, #080808 chip, white / white-48% icons.
const USE_LIQUID_GLASS = true;
const NATIVE_GLASS =
  USE_LIQUID_GLASS && Platform.OS === "ios" && !!isLiquidGlassSupported;
// Figma Home-Feed nav: active icon white on a #080808 chip, inactive icons
// white 48%
const TAB_ICON_ACTIVE = "#FFFFFF";
const TAB_ICON_INACTIVE = "rgba(255, 255, 255, 0.48)";
const GLASS_LABEL = NATIVE_GLASS ? PlatformColor("labelColor") : null;
const NAV_TAB_SPRING = { damping: 20, stiffness: 320, mass: 0.55 };
const TAB_ROUTE_ORDER = ["Home", "Matching", "Events", "Shows", "Profile"];

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
    pagerPositionNative,
    pagerOffsetNative,
    setChipFollow,
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

  // Drag-to-reorder in the "+" sheet (Viral's Pick Your Interests): the new
  // order becomes the header chip order; the selected chip stays selected.
  const handleTopicReorder = useCallback(
    (orderedNames) => {
      const selectedName = tab !== null ? enabledTopics[tab] : null;
      const byName = new Map(topicPrefs.map((t) => [t.name, t]));
      const nextPrefs = orderedNames.map((n) => byName.get(n)).filter(Boolean);
      const nextEnabled = enabledTopicNames(nextPrefs);
      setTopicPrefs(nextPrefs);
      persistFeedTopics(nextPrefs);
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
  // Viral pager chrome: `pagerChrome` drives the radius/gap (on while the
  // finger is down or the page is settling), `pagerDrag` the 0.96 scale
  // (eases out 250ms after release)
  const pagerChrome = useRef(new Animated.Value(0)).current;
  // separate from pagerProgress on purpose: pagerProgress feeds the header
  // opacity together with a native-driven animation, which moves it (and
  // anything built on it) to the native driver — the page cards animate
  // margin/radius, which only the JS driver supports
  const pageScroll = useRef(new Animated.Value(HOME_PAGE_INDEX)).current;
  const pagerDrag = useRef(new Animated.Value(0)).current;
  const handlePageScrollStateChanged = useCallback(
    (e) => {
      const state = e.nativeEvent.pageScrollState;
      if (state === "dragging") {
        // the tab chip tracks the swipe natively from here on
        setChipFollow(1);
        pagerChrome.setValue(1);
        pagerDrag.setValue(1);
      } else if (state === "settling") {
        Animated.timing(pagerDrag, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      } else if (state === "idle") {
        pagerDrag.stopAnimation();
        pagerDrag.setValue(0);
        pagerChrome.setValue(0);
      }
    },
    [pagerChrome, pagerDrag, setChipFollow],
  );

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
      pageScroll.setValue(pageIndex);
      pagerProgressShared.setValue(pageIndex);
      // keep the native chip source in sync after jumps (tab taps use
      // setPageWithoutAnimation, which may not emit scroll events)
      pagerPositionNative.setValue(pageIndex);
      pagerOffsetNative.setValue(0);

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
      pageScroll.setValue(val);
      pagerProgressShared.setValue(val);

      const nextIsCameraActive = (position === 0 || offset > 0) && isFocused;
      if (isCameraActiveRef.current !== nextIsCameraActive) {
        isCameraActiveRef.current = nextIsCameraActive;
        setIsCameraActive(nextIsCameraActive);
      }
    },
    [isFocused, pagerProgress, pagerProgressShared],
  );
  // native mirror of the scroll for the tab chip; the JS handler above still
  // runs as the listener (header fade, page cards, camera)
  const onPageScrollNative = useMemo(
    () =>
      Animated.event(
        [
          {
            nativeEvent: {
              position: pagerPositionNative,
              offset: pagerOffsetNative,
            },
          },
        ],
        { useNativeDriver: true, listener: handlePageScroll },
      ),
    [handlePageScroll, pagerPositionNative, pagerOffsetNative],
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

  const headerCollapseY = useMemo(
    () =>
      feedRowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-FEED_HEADER_COLLAPSE, 0],
      }),
    [feedRowAnim],
  );

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
        {/* header background shrinks with the Feed/Shorts row collapse
            (native-driven translate on its own view, separate from the
            JS-driven page-swipe opacity) */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateY: headerCollapseY }] },
          ]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                // Figma: the header is solid #121212 like every section —
                // the dark BlurView tint lifted it to ~#191919, a visible
                // step against the feed, so it is light-theme only
                backgroundColor:
                  themeMode === "dark" ? colors.background : "transparent",
                opacity: bgOpacity,
              },
            ]}
          >
            {themeMode === "light" && (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType="light"
                blurAmount={2}
                reducedTransparencyFallbackColor="#FFFFFF35"
              />
            )}
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

      <AnimatedPagerView
        ref={attachPagerRef}
        style={styles.pager}
        initialPage={HOME_PAGE_INDEX}
        offscreenPageLimit={2}
        overScrollMode="never"
        scrollEnabled={pagerScrollEnabled}
        onPageSelected={handlePageChange}
        onPageScroll={onPageScrollNative}
        onPageScrollStateChanged={handlePageScrollStateChanged}
      >
        {/* Page 0 - Camera */}
        <View key="camera" style={styles.pagerPage}>
          <CameraScreen
            navigation={navigation}
            isCameraActive={isCameraActive}
          />
        </View>

        {/* Page 1 - Home */}
        <PagerPage
          key="home"
          index={1}
          pageScroll={pageScroll}
          pagerChrome={pagerChrome}
          pagerDrag={pagerDrag}
          gap={false}
        >
          <Home
            route={route}
            pagerProgress={pagerProgress}
            onSetPage={onSetPage}
            isFocusedPage={currentPage === PAGER_HOME_INDEX && isFocused}
            sharedTab={tab}
            sharedTabNames={enabledTopics}
            feedFilters={feedFilters}
          />
        </PagerPage>

        {/* Page 2 - Shorts */}
        <PagerPage
          key="shorts"
          index={2}
          pageScroll={pageScroll}
          pagerChrome={pagerChrome}
          pagerDrag={pagerDrag}
        >
          <Shorts
            pagerProgress={pagerProgress}
            onSetPage={onSetPage}
            isFocusedPage={currentPage === PAGER_SHORTS_INDEX && isFocused}
            sharedTab={tab}
            animateHeader={animateHeader}
          />
        </PagerPage>

        {/* Page 3 - Live from Shorts (tab bar hidden, header hidden) */}
        <PagerPage
          key="shows-from-shorts"
          index={3}
          pageScroll={pageScroll}
          pagerChrome={pagerChrome}
          pagerDrag={pagerDrag}
        >
          <ViewerWatchScreen
            isFocusedPage={
              currentPage === PAGER_SHOWS_FROM_SHORTS_INDEX && isFocused
            }
            suppressOverlay
          />
        </PagerPage>

        {/* Page 4 - Matching */}
        <PagerPage
          key="matching"
          index={4}
          pageScroll={pageScroll}
          pagerChrome={pagerChrome}
          pagerDrag={pagerDrag}
        >
          <BandMateMatching
            isFocusedPage={currentPage === PAGER_MATCHING_INDEX && isFocused}
          />
        </PagerPage>

        {/* Page 5 - Events */}
        <PagerPage
          key="events"
          index={5}
          pageScroll={pageScroll}
          pagerChrome={pagerChrome}
          pagerDrag={pagerDrag}
        >
          <Event
            isFocusedPage={currentPage === PAGER_EVENTS_INDEX && isFocused}
          />
        </PagerPage>

        {/* Page 6 - Shows (tab bar visible) */}
        <PagerPage
          key="shows-tab"
          index={6}
          pageScroll={pageScroll}
          pagerChrome={pagerChrome}
          pagerDrag={pagerDrag}
        >
          <ViewerWatchScreen
            isFocusedPage={currentPage === PAGER_SHOWS_INDEX && isFocused}
          />
        </PagerPage>

        {/* Page 7 - Profile */}
        <PagerPage
          key="profile"
          index={7}
          pageScroll={pageScroll}
          pagerChrome={pagerChrome}
          pagerDrag={pagerDrag}
        >
          <Profile
            isFocusedPage={currentPage === PAGER_PROFILE_INDEX && isFocused}
          />
        </PagerPage>
      </AnimatedPagerView>

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
        filters={topicPrefs}
        enabledItems={enabledTopics}
        onToggleItem={handleTopicToggle}
        onReorder={handleTopicReorder}
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
// Figma "New-Feed-Create": 48 rows, gap 8 (56 apart), and 24 between the
// last row ("Post") and the close button. The rows are stacked 2pt apart
// (marginBottom -46) above a 20pt bottom margin, from a container 30pt above
// the FAB's bottom; these offsets lift row k to 84 + 56·(5 − k) above the
// FAB's bottom, i.e. the FAB's top (60) + 24.
const CREATE_MENU_OFFSETS = [-304, -250, -196, -142, -88, -34];

// Default value = no-ops, so a render that lands on a stale context (Fast
// Refresh re-creating this module) degrades gracefully instead of crashing
// with "Cannot read property 'setIsTabBarVisible' of undefined".
const noop = () => {};
const TabBarVisibilityContext = createContext({
  isTabBarVisible: true,
  setIsTabBarVisible: noop,
  headerAnim: new Animated.Value(1),
  pagerScrollEnabled: true,
  setPagerScrollEnabled: noop,
  registerPagerRef: noop,
  activePagerPage: PAGER_HOME_INDEX,
  setActivePagerPage: noop,
  pagerProgressShared: new Animated.Value(PAGER_HOME_INDEX),
  pagerPositionNative: new Animated.Value(PAGER_HOME_INDEX),
  pagerOffsetNative: new Animated.Value(0),
  chipFollow: new Animated.Value(0),
  setChipFollow: noop,
  requestedPagerPage: null,
  clearRequestedPagerPage: noop,
  navigateToPagerPage: noop,
  feedRowAnim: new Animated.Value(1),
  setFeedRowVisible: noop,
  isPlusVisible: true,
  setPlusVisible: noop,
});

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
  // native mirrors of the pager scroll (position + offset) and a 0/1 switch:
  // 1 = the tab chip follows the swipe, 0 = it runs its own tap spring
  const pagerPositionNative = useRef(
    new Animated.Value(PAGER_HOME_INDEX),
  ).current;
  const pagerOffsetNative = useRef(new Animated.Value(0)).current;
  const chipFollow = useRef(new Animated.Value(0)).current;
  const chipFollowRef = useRef(0);
  const setChipFollow = useCallback(
    (v) => {
      if (chipFollowRef.current === v) return;
      chipFollowRef.current = v;
      chipFollow.setValue(v);
    },
    [chipFollow],
  );

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
        duration: 300,
        easing: Easing.out(Easing.cubic),
        // opacity/translate only (FeedHeader) → native thread, no jank
        useNativeDriver: true,
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
      pagerPositionNative,
      pagerOffsetNative,
      chipFollow,
      setChipFollow,
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
      pagerPositionNative,
      pagerOffsetNative,
      chipFollow,
      setChipFollow,
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
      style={styles.customButtonContainer}
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
        style={styles.iconMainContainer}
        activeOpacity={1}
        onPress={onPress}
      >
        {/* Active icon on the sliding chip — also tone-adaptive (iOS 26
            TabView: icons turn dark while light media is behind the glass) */}
        {IconComponent && isFocused && NATIVE_GLASS && (
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name={IconComponent}
            size={28}
            color={TAB_ICON_ACTIVE}
          />
        )}
        {IconComponent && !isFocused && NATIVE_GLASS && (
          <View style={styles.glassMutedIcon}>
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name={IconComponent}
              size={28}
              color={GLASS_LABEL}
            />
          </View>
        )}
        {IconComponent && isFocused && !NATIVE_GLASS && (
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name={IconComponent}
            size={28}
            color={TAB_ICON_ACTIVE}
          />
        )}
        {IconComponent && !isFocused && !NATIVE_GLASS && (
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
                size={28}
                color={themeMode === "light" ? COLORS.white : TAB_ICON_INACTIVE}
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
                size={28}
                color="#121212"
              />
            </Animated.View>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

// Viral (assets/images/tabsIcons/*): the active tab icon is filled with the
// accent as a diagonal gradient, accent → generateAccentColor(accent)
// (saturation +45, lightness +7). PSC accent #A19375 → #DAB158.
const TAB_ACCENT = COLORS.buttonColor;
const TAB_ACCENT_2 = "#DAB158";
// The gold glyph is rendered with no fixed-size box around it, exactly like
// the inactive icons (a 26 box clamped the font's taller text box and pushed
// the glyph ~3pt down). The #DAB158 copy is laid over it in a layer the same
// size as that glyph, faded in through a diagonal mask → Viral's gradient.
const GradientTabIcon = ({ name, size = 28 }) => (
  <View>
    <Icons
      family="MaterialSymbolsRoundedFilled"
      name={name}
      size={size}
      color={TAB_ACCENT}
    />
    <MaskedView
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      maskElement={
        <LinearGradient
          colors={["rgba(0, 0, 0, 0)", "#000000"]}
          start={{ x: 0.14, y: 0.14 }}
          end={{ x: 0.52, y: 0.87 }}
          style={StyleSheet.absoluteFill}
        />
      }
    >
      <Icons
        family="MaterialSymbolsRoundedFilled"
        name={name}
        size={size}
        color={TAB_ACCENT_2}
      />
    </MaskedView>
  </View>
);

// Selected-tab chip: iOS 26 / Reddit selection bubble. It is built from
// three opaque parts (two half-circle caps + a middle bar, so it can stretch
// with native transforms) and faded as one group — inside the native glass a
// system grey that follows the glass (lighter on light media, darker on
// dark), outside it the iOS fill grey at 24%.
// Figma: the active chip is solid #080808 (r100) on every platform — also
// inside the iOS 26 glass, where only the inactive icons adapt
const TAB_CHIP_FILL = "#080808";
const TAB_CHIP_OPACITY = 1;

const BarShell = NATIVE_GLASS ? LiquidGlassView : View;

const CustomTabBar = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  // Viral (app/(tabs)/index.tsx): bar bottom = max(12, safe area − 4)
  const tabBarBottomOffset = Math.max(12, (insets.bottom ?? 0) - 4);
  const { colors, themeMode } = useTheme();
  const {
    isTabBarVisible,
    activePagerPage,
    navigateToPagerPage,
    pagerPositionNative,
    pagerOffsetNative,
    chipFollow,
    setChipFollow,
  } = useTabBarVisibility();
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

  // Threads-style "+" on the Home feed: hidden by default; when you scroll
  // down and the bar slides away, the "+" pops in as a floating button; when
  // you scroll back up and the bar returns, it hides again. Other pages keep
  // it with the bar as before, and it stays while the create menu is open.
  // Threads behaviour on every tab: the "+" is hidden while the bar is
  // visible and floats in when the bar hides on scroll
  const plusVisibleEffective = menuOpen || !isTabBarVisible;
  const plusAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(plusAnim, {
      toValue: plusVisibleEffective ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [plusVisibleEffective, plusAnim]);
  // Liquid Glass drops out of a layer that is faded, so with native glass
  // the "+" is hidden by scaling to 0 only; the fallback keeps the fade
  const plusScale = plusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [NATIVE_GLASS ? 0 : 0.5, 1],
  });

  useEffect(() => {
    setOptimisticActivePage(activePagerPage);
  }, [activePagerPage]);

  const handleNavigateToPagerPage = useCallback(
    (pageIndex) => {
      // tap → the chip springs from the tab it's on (Viral), not the pager
      // (tapX / lastTabRef are declared further down; read at call time)
      tapX.setValue(lastTabRef.current);
      setChipFollow(0);
      setOptimisticActivePage(pageIndex);
      navigateToPagerPage(pageIndex);
    },
    [navigateToPagerPage, setChipFollow],
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

  // Viral PagerTabBar: the active chip slides between equal slots and ticks
  // a selection haptic when the tab changes.
  const [barWidth, setBarWidth] = useState(
    Dimensions.get("window").width - NAV_BAR_INSET * 2,
  );
  const rowPad = NATIVE_GLASS ? NAV_BAR_PAD : NAV_BAR_PAD - 1;
  const slotWidth = Math.max(
    1,
    (barWidth - rowPad * 2 - NAV_CHIP_WIDTH) / (TAB_ROUTE_ORDER.length - 1),
  );
  const activeTabIndex = Math.max(
    0,
    TAB_ROUTE_ORDER.findIndex((name) => isTabPagerActive(name)),
  );
  // Native-driven chip (Viral PagerTabBar / SlidingTabIndicator).
  // While the screens are dragged it follows the pager on the UI thread
  // (pages: camera / home / shorts / live = Home, then Matching, Events,
  // Shows, Profile); a tab tap springs it from the previous tab instead.
  const tapX = useRef(new Animated.Value(activeTabIndex)).current;
  const lastTabRef = useRef(activeTabIndex);
  const pagerTab = useMemo(
    () =>
      Animated.add(pagerPositionNative, pagerOffsetNative).interpolate({
        inputRange: [0, 3, 7],
        outputRange: [0, 0, TAB_ROUTE_ORDER.length - 1],
        extrapolate: "clamp",
      }),
    [pagerPositionNative, pagerOffsetNative],
  );
  const chipPos = useMemo(
    () =>
      Animated.add(
        Animated.multiply(pagerTab, chipFollow),
        Animated.multiply(tapX, Animated.subtract(1, chipFollow)),
      ),
    [pagerTab, chipFollow, tapX],
  );
  useEffect(() => {
    Animated.spring(tapX, {
      toValue: activeTabIndex,
      useNativeDriver: true,
      ...NAV_TAB_SPRING,
    }).start();
    if (lastTabRef.current !== activeTabIndex) {
      lastTabRef.current = activeTabIndex;
      ReactNativeHapticFeedback.trigger("selection", {
        enableVibrateFallback: false,
        ignoreAndroidSystemSettings: false,
      });
    }
  }, [activeTabIndex, tapX]);
  // Viral SlidingTabIndicator: mid-travel the pill stretches by
  // 4·t·(1−t)·0.42 of a slot (t = progress between two tabs), centred on
  // the travelling position. Width can't be animated natively, so the caps
  // slide apart and the middle bar scales.
  const chipStretch = useMemo(() => {
    const max = slotWidth * 0.42;
    const inputRange = [];
    const outputRange = [];
    for (let i = 0; i < TAB_ROUTE_ORDER.length - 1; i += 1) {
      [0, 0.25, 0.5, 0.75].forEach((t) => {
        inputRange.push(i + t);
        outputRange.push(4 * t * (1 - t) * max);
      });
    }
    inputRange.push(TAB_ROUTE_ORDER.length - 1);
    outputRange.push(0);
    return chipPos.interpolate({ inputRange, outputRange, extrapolate: "clamp" });
  }, [chipPos, slotWidth]);
  const chipBase = Animated.multiply(chipPos, slotWidth);
  const chipHalfStretch = Animated.multiply(chipStretch, 0.5);
  const chipMidWidth = Math.max(1, NAV_CHIP_WIDTH - NAV_TAB_HEIGHT) + 2;
  const chipLeftX = Animated.subtract(chipBase, chipHalfStretch);
  const chipRightX = Animated.add(
    Animated.add(chipBase, NAV_CHIP_WIDTH - NAV_TAB_HEIGHT / 2),
    chipHalfStretch,
  );
  const chipMidX = Animated.add(chipBase, NAV_TAB_HEIGHT / 2 - 1);
  const chipMidScale = Animated.add(
    1,
    Animated.multiply(chipStretch, 1 / chipMidWidth),
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
        <View
          style={[styles.menuContainer, { bottom: 30 + tabBarBottomOffset }]}
        >
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
                  // Figma: label → circle 16
                  marginRight={16}
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
          style={[styles.leftMenuContainer, { bottom: 30 + tabBarBottomOffset }]}
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
            // Viral: bar bottom edge max(12, safe area − 4) above the screen
            // bottom (was 20 + safe area, 24pt higher on Face ID phones);
            // 10 top margin + 60 bar + that offset
            height: 70 + tabBarBottomOffset,
            transform: [{ translateY: tabTranslateY }],
          },
        ]}
      >
        {/* Figma nav container: progressive background blur (0 → 16),
            from 32pt above the bar to the screen bottom, + #121212 0% → 100%.
            Under the iOS 26 glass the dark fill is left out and the blur uses
            the near-tint-free ultra-thin material: UIGlassEffect picks light
            / dark from the luminance of the pixels behind it, and a dark
            fill there kept it reading "dark" over light media. */}
        <View
          pointerEvents="none"
          style={[
            styles.navProgressive,
            { height: NAV_PROGRESSIVE_HEIGHT + tabBarBottomOffset },
          ]}
        >
          <ProgressiveBlur
            pointerEvents="none"
            direction="bottom"
            tint={
              NATIVE_GLASS
                ? themeMode === "light"
                  ? "ultraThinMaterialLight"
                  : "ultraThinMaterialDark"
                : themeMode === "light"
                  ? "light"
                  : "dark"
            }
            intensity={16}
            height={NAV_PROGRESSIVE_HEIGHT + tabBarBottomOffset}
            borderRadius={0}
            style={StyleSheet.absoluteFill}
          />
          {!NATIVE_GLASS && (
            <LinearGradient
              pointerEvents="none"
              colors={
                themeMode === "light"
                  ? ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 1)"]
                  : ["rgba(18, 18, 18, 0)", "rgba(18, 18, 18, 1)"]
              }
              style={StyleSheet.absoluteFill}
            />
          )}
        </View>
        <BarShell
          style={[
            styles.tabContentContainer,
            NATIVE_GLASS && styles.tabGlass,
          ]}
          {...(NATIVE_GLASS
            ? { effect: "regular", colorScheme: "system" }
            : null)}
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
          {/* Fallback chrome (Android / iOS < 26): blur + 64% black (dark)
              or 64% white (light) */}
          {!NATIVE_GLASS && (
          <BlurView
            style={[StyleSheet.absoluteFillObject, styles.navChrome]}
            blurType={themeMode === "light" ? "light" : "dark"}
            blurAmount={16}
            reducedTransparencyFallbackColor={
              themeMode === "light" ? "#FFFFFFA3" : "#000000A3"
            }
          />
          )}
          {/* tint follows the media behind the bar (iOS 26 glass): the
              64% black layer fades out and a 64% white one fades in as
              `navToneAnim` goes 0 → 1, together with the icon cross-fade */}
          {!NATIVE_GLASS && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.default,
              styles.navChrome,
              {
                backgroundColor:
                  themeMode === "light"
                    ? "rgba(255, 255, 255, 0.64)"
                    : "rgba(30, 30, 30, 0.64)",
                opacity:
                  themeMode === "light"
                    ? 1
                    : navToneAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0],
                      }),
              },
            ]}
          />
          )}
          {!NATIVE_GLASS && themeMode !== "light" && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.default,
                styles.navChrome,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.64)",
                  opacity: navToneAnim,
                },
              ]}
            />
          )}
          {/* sliding active chip (Viral SlidingTabIndicator) */}
          <View
            pointerEvents="none"
            needsOffscreenAlphaCompositing
            style={[
              styles.navChip,
              NATIVE_GLASS && styles.navChipGlass,
              { width: barWidth, opacity: TAB_CHIP_OPACITY },
            ]}
          >
            <Animated.View
              style={[
                styles.chipCap,
                { transform: [{ translateX: chipLeftX }] },
              ]}
            >
              <View style={[styles.chipCapCircle, { left: 0 }]} />
            </Animated.View>
            <Animated.View
              style={[
                styles.chipMid,
                {
                  width: chipMidWidth,
                  transform: [
                    { translateX: chipMidX },
                    { scaleX: chipMidScale },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.chipCap,
                { transform: [{ translateX: chipRightX }] },
              ]}
            >
              <View
                style={[styles.chipCapCircle, { left: -NAV_TAB_HEIGHT / 2 }]}
              />
            </Animated.View>
          </View>

          <View
            onLayout={(e) => {
              const w = e?.nativeEvent?.layout?.width;
              if (w && Math.abs(w - barWidth) > 1) setBarWidth(w);
            }}
            style={[styles.navRow, NATIVE_GLASS && styles.navRowGlass]}
          >
            {state.routes.map((route, index) => (
              <View
                key={route.key}
                style={{
                  width: NAV_CHIP_WIDTH,
                  // Figma -8 gap: slots overlap so each icon centre sits on
                  // the chip centre at every bar width
                  marginLeft: index === 0 ? 0 : slotWidth - NAV_CHIP_WIDTH,
                }}
              >
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
              </View>
            ))}
          </View>
        </BarShell>
      </Animated.View>

      {/* Animated Plus Button */}
      <Animated.View
        pointerEvents={plusVisibleEffective ? "auto" : "none"}
        style={[
          styles.plusButton,
          NATIVE_GLASS && styles.plusButtonGlass,
          {
            // Outside the sliding bar, so it stays put (floating) when the
            // bar hides on scroll down and the bar returns around it on
            // scroll up — Threads behaviour.
            zIndex: 1000,
            // FAB shares the bar's bottom line
            bottom: tabBarBottomOffset,
            // native glass must not be clipped by its parent or it doesn't
            // render; the LiquidGlassView carries its own 30pt radius
            overflow: NATIVE_GLASS ? "visible" : "hidden",
            opacity: NATIVE_GLASS ? 1 : plusAnim,
            transform: [{ scale: plusScale }],
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
        {NATIVE_GLASS ? (
          // same Liquid Glass as the bar — the system tints the circle and
          // the icon from the content behind it
          <LiquidGlassView
            style={[StyleSheet.absoluteFill, { borderRadius: FAB_SIZE / 2 }]}
            effect="regular"
            interactive
            colorScheme="dark"
            // Figma: #1E1E1E 64% — plain glass has no contrast on #121212
            // or on white media, the tint keeps the "+" readable everywhere
            tintColor="rgba(30, 30, 30, 0.64)"
          />
        ) : (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={themeMode === "light" ? "light" : "dark"}
            blurAmount={16}
            reducedTransparencyFallbackColor="#1E1E1E"
          />
        )}
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
              color={COLORS.white}
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
    width: 28,
    height: 28,
    borderRadius: 99,
  },
  customButtonContainer: {
    width: NAV_CHIP_WIDTH,
    height: NAV_TAB_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  iconMainContainer: {
    width: NAV_CHIP_WIDTH,
    height: NAV_TAB_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  // Figma "Bottom nav": 335 × 60, r999, pad 4, 1px white 16% stroke
  tabContentContainer: {
    borderRadius: NAV_BAR_HEIGHT / 2,
    alignSelf: "stretch",
    marginTop: 10,
    marginHorizontal: NAV_BAR_INSET,
    height: NAV_BAR_HEIGHT,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  // native Liquid Glass draws its own capsule + edge highlight
  tabGlass: { borderWidth: 0, overflow: "visible" },
  glassMutedIcon: { opacity: 0.48 },
  // the blur / tint layers get the same radius so no square corner can
  // bleed through the 1px stroke on iOS
  navChrome: { borderRadius: NAV_BAR_HEIGHT / 2, overflow: "hidden" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    height: NAV_BAR_HEIGHT - 2,
    paddingHorizontal: NAV_BAR_PAD - 1,
  },
  // no 1px stroke inside the native glass → full 60 / pad 4
  navRowGlass: { height: NAV_BAR_HEIGHT, paddingHorizontal: NAV_BAR_PAD },
  navChipGlass: { top: NAV_BAR_PAD, left: NAV_BAR_PAD },
  navChip: {
    position: "absolute",
    top: NAV_BAR_PAD - 1,
    left: NAV_BAR_PAD - 1,
    height: NAV_TAB_HEIGHT,
  },
  chipCap: {
    position: "absolute",
    top: 0,
    left: 0,
    width: NAV_TAB_HEIGHT / 2,
    height: NAV_TAB_HEIGHT,
    overflow: "hidden",
  },
  chipCapCircle: {
    position: "absolute",
    top: 0,
    width: NAV_TAB_HEIGHT,
    height: NAV_TAB_HEIGHT,
    borderRadius: NAV_TAB_HEIGHT / 2,
    backgroundColor: TAB_CHIP_FILL,
  },
  chipMid: {
    position: "absolute",
    top: 0,
    left: 0,
    height: NAV_TAB_HEIGHT,
    backgroundColor: TAB_CHIP_FILL,
  },
  navProgressive: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
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
    right: 12,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 30, 0.64)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  // glass draws the lens; keep Figma's 1px white 8% stroke for the edge on
  // dark backgrounds
  plusButtonGlass: { backgroundColor: "transparent" },
  toneIconBox: { width: 28, height: 28 },
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
    // Figma: menu circles share the close button's centre line
    // (FAB right 12 + 60/2 = 42 → 48 circle's right edge at 18)
    right: 18,
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
