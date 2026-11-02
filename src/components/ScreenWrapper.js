import {
  NavigationRouteContext,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import {
  cloneElement,
  createContext,
  forwardRef,
  useImperativeHandle,
  isValidElement,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const AnimatedKeyboardAwareScrollView = Animated.createAnimatedComponent(
  KeyboardAwareScrollView
);
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HeaderProgressiveBlur, {
  FooterProgressiveBlur,
} from "./HeaderProgressiveBlur";
import useScrollEdgeBlur from "../hooks/useScrollEdgeBlur";
import ImageFast from "./ImageFast";

import { Images } from "../assets/images";
import { useTheme } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

/**
 * Client rules: "the header has progressive blur everywhere", the blur is a
 * frosted overlay (never a solid hide), and headers / footers blur only while
 * content sits under them. On screens with scrolling content the header
 * floats over it (Figma "Header": absolute from y 0, status bar included,
 * progressive background blur 16 → 0) and the content scrolls underneath;
 * the same for a floating footer (blur 0 → 16 towards the screen bottom).
 *
 * `scrollEnabled` screens get all of this automatically. Screens that scroll
 * their own FlatList / ScrollView pass `headerBlur` (and `footerBlur` when
 * they have a footer), spread `useScreenScrollProps()(ownOnScroll)` on the
 * list, and put <ScreenHeaderSpacer /> at its top and <ScreenFooterSpacer />
 * at its end.
 */
const ScreenHeaderInsetContext = createContext(0);
const ScreenFooterInsetContext = createContext(0);
const noopScrollProps = (own) =>
  typeof own === "function" ? { onScroll: own } : own || {};
const ScreenScrollPropsContext = createContext(noopScrollProps);
// measured header heights per route, so a revisit lays out on the first frame
const headerHeightCache = new Map();

/** Total height covered by the floating header (status bar included). */
export const useScreenHeaderInset = () => useContext(ScreenHeaderInsetContext);

/** Render-prop access to the inset, for screens that render ScreenWrapper
 *  themselves: <ScreenHeaderInsetConsumer>{(inset) => …}</…> */
export const ScreenHeaderInsetConsumer = ScreenHeaderInsetContext.Consumer;

/** Height covered by the floating footer. */
export const useScreenFooterInset = () => useContext(ScreenFooterInsetContext);

/** scrollProps(ownOnScroll | { onScroll, onLayout, … }) → props for the list
 *  that scrolls under this screen's header / footer (drives their blur). */
export const useScreenScrollProps = () => useContext(ScreenScrollPropsContext);

/**
 * Wraps a scrollable (FlatList, ScrollView, KeyboardAwareScrollView, …) so it
 * reports its scroll to the ScreenWrapper it is rendered in — the floating
 * header / footer then blur only while content sits under them. The
 * component's own onScroll / onLayout / onContentSizeChange keep working.
 */
export const withScreenScroll = (Component) => {
  const Wrapped = forwardRef((props, ref) => {
    const scrollProps = useContext(ScreenScrollPropsContext);
    return <Component ref={ref} {...scrollProps(props)} />;
  });
  Wrapped.displayName = `ScreenScroll(${
    Component.displayName || Component.name || "Scrollable"
  })`;
  return Wrapped;
};
export const ScreenFlatList = withScreenScroll(FlatList);
export const ScreenScrollView = withScreenScroll(ScrollView);

/** Empty box as tall as the floating footer — last item of a list. */
export const ScreenFooterSpacer = ({ extra = 0 }) => {
  const inset = useScreenFooterInset();
  return <View pointerEvents="none" style={{ height: inset + extra }} />;
};

/**
 * Sticky header (stickyHeaderIndices) for screens whose header floats over
 * the content: it sticks right below the floating header instead of at the
 * very top of the scroll view, where the header would cover it.
 */
const BelowHeaderSticky = forwardRef(
  ({ onLayout, scrollAnimatedValue, nativeID, children }, ref) => {
    const inset = useContext(ScreenHeaderInsetContext);
    const [layoutY, setLayoutY] = useState(null);
    // ScrollView hands every sticky header the next one's y; not needed here
    useImperativeHandle(ref, () => ({ setNextHeaderY: () => {} }), []);
    const start = layoutY == null ? null : Math.max(0, layoutY - inset);
    const translateY =
      start == null
        ? 0
        : scrollAnimatedValue.interpolate({
            inputRange: [start - 1, start, start + 1],
            outputRange: [0, 0, 1],
            extrapolateLeft: "clamp",
            extrapolateRight: "extend",
          });
    return (
      <Animated.View
        nativeID={nativeID}
        collapsable={false}
        onLayout={(e) => {
          setLayoutY(e.nativeEvent.layout.y);
          onLayout?.(e);
        }}
        style={{ zIndex: 10, transform: [{ translateY }] }}
      >
        {children}
      </Animated.View>
    );
  },
);

/** Empty box as tall as the floating header — first item of a list. */
export const ScreenHeaderSpacer = ({ extra = 0 }) => {
  const inset = useScreenHeaderInset();
  return <View pointerEvents="none" style={{ height: inset + extra }} />;
};

const FocusAwareStatusBar = (props) => {
  const isFocused = useIsFocused();
  return isFocused ? (
    <StatusBar
      barStyle={props.barStyle || "light-content"}
      backgroundColor={props.backgroundColor || "#121212"}
      translucent={props.translucent}
      {...props}
    />
  ) : null;
};

const ScreenWrapper = ({
  children,
  statusBarColor,
  translucent = false,
  scrollEnabled = false,
  backgroundImage,
  backgroundColor,
  headerUnScrollable = () => null,
  footerUnScrollable = () => null,
  barStyle,
  refreshControl,
  paddingBottom,
  nestedScrollEnabled,
  paddingHorizontal = 12,
  isAuth,
  paddingLeft,
  paddingRight,
  removeLoading,
  imageBottom = 70,
  onScroll,
  scrollEventThrottle = 16,
  headerFloating = false,
  scrollRef,
  stickyHeaderIndices,
  // progressive-blur floating header; defaults on for `scrollEnabled` screens
  headerBlur,
  // header colour when it differs from the page background
  headerBlurColor,
  // floating footer with the progressive blur; defaults on for
  // `scrollEnabled` screens (own-list screens add <ScreenFooterSpacer />)
  footerBlur,
  // ({ header, footer }) whenever content starts / stops sitting under the
  // header or footer (tab pages forward it to the bottom-nav blur)
  onScrollEdgeChange,
}) => {
  const navigation = useNavigation();
  // (context, not useRoute — that throws outside a screen)
  const route = useContext(NavigationRouteContext);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const edge = useScrollEdgeBlur({ onChange: onScrollEdgeChange });
  const headerElement = headerUnScrollable?.() ?? null;
  const footerElement = footerUnScrollable?.() ?? null;
  const blurHeader =
    !!headerElement && !isAuth && (headerBlur ?? scrollEnabled);
  const blurFooter =
    !!footerElement && !isAuth && (footerBlur ?? scrollEnabled);
  const [footerHeight, setFooterHeight] = useState(0);
  const onFooterLayout = useCallback((e) => {
    const h = Math.round(e.nativeEvent.layout.height);
    setFooterHeight((prev) => (prev === h ? prev : h));
  }, []);
  const footerInset = blurFooter ? footerHeight : 0;
  const cacheKey = route?.key ? route.name : null;
  const [headerHeight, setHeaderHeight] = useState(() =>
    cacheKey ? headerHeightCache.get(cacheKey) ?? null : null
  );
  const onHeaderLayout = useCallback(
    (e) => {
      const h = Math.round(e.nativeEvent.layout.height);
      if (cacheKey) headerHeightCache.set(cacheKey, h);
      setHeaderHeight((prev) => (prev === h ? prev : h));
    },
    [cacheKey]
  );
  // header + status bar, i.e. where the content starts at rest
  const headerInset = blurHeader ? headerHeight ?? 0 : 0;
  // until the header is measured the content stays hidden for that frame, so
  // it never jumps down under the header
  const contentHidden = blurHeader && headerHeight == null;
  const resolvedBackgroundColor = backgroundColor || colors.background;
  const resolvedStatusBarColor = statusBarColor || colors.statusBarColor;
  const resolvedBarStyle = barStyle || colors.statusBarStyle;

  const content = () => {
    return (
      <ScreenHeaderInsetContext.Provider value={headerInset}>
      <ScreenFooterInsetContext.Provider value={footerInset}>
      <ScreenScrollPropsContext.Provider value={edge.scrollProps}>
        <View
          style={{
            flex: 1,
            backgroundColor: backgroundImage
              ? "transparent"
              : resolvedBackgroundColor,
            // blurred header spans the status bar too (Figma Header y 0)
            paddingTop: translucent || blurHeader ? 0 : insets.top,
            paddingBottom: paddingBottom,
          }}
        >
          <FocusAwareStatusBar
            barStyle={resolvedBarStyle}
            backgroundColor={resolvedStatusBarColor}
            translucent={translucent}
          />
          {!translucent && !blurHeader && (
            <SafeAreaView style={{ backgroundColor: resolvedStatusBarColor }} />
          )}
          {isAuth ? (
            <ImageFast
              source={Images.backIcon}
              style={{ width: 41, height: 41, margin: 16 }}
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
              }}
            />
          ) : null}

          {/* Floating header with the progressive blur behind it */}
          {blurHeader && (
            <View
              pointerEvents="box-none"
              onLayout={onHeaderLayout}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 999,
                paddingTop: translucent ? 0 : insets.top,
              }}
            >
              <HeaderProgressiveBlur
                color={headerBlurColor || resolvedBackgroundColor}
                visible={edge.headerVisible}
              />
              {headerElement}
            </View>
          )}

          {/* Floating header */}
          {headerFloating && !blurHeader && (
            <View
              // Only the header's own controls should catch touches, the empty
              // container must let taps reach the content underneath it
              pointerEvents="box-none"
              style={{
                position: "absolute",
                top: translucent ? 0 : insets.top,
                left: 0,
                right: 0,
                zIndex: 999,
              }}
            >
              {headerElement}
            </View>
          )}

          {/* Non-floating header */}
          {!headerFloating && !blurHeader && headerElement}

          {scrollEnabled ? (
            <AnimatedKeyboardAwareScrollView
              ref={scrollRef}
              nestedScrollEnabled={nestedScrollEnabled}
              refreshControl={
                // the pull-to-refresh spinner appears below the floating
                // header, not hidden under it
                blurHeader &&
                isValidElement(refreshControl) &&
                refreshControl.props?.progressViewOffset == null
                  ? cloneElement(refreshControl, {
                      progressViewOffset: headerInset,
                    })
                  : refreshControl
              }
              {...edge.scrollProps({ onScroll, scrollEventThrottle })}
              stickyHeaderIndices={stickyHeaderIndices}
              StickyHeaderComponent={
                blurHeader && stickyHeaderIndices?.length
                  ? BelowHeaderSticky
                  : undefined
              }
              style={{
                flex: 1,
                backgroundColor: resolvedBackgroundColor,
                paddingHorizontal,
                paddingLeft,
                paddingRight,
                opacity: contentHidden ? 0 : 1,
              }}
              contentContainerStyle={
                blurHeader || blurFooter
                  ? { paddingTop: headerInset, paddingBottom: footerInset }
                  : undefined
              }
              scrollIndicatorInsets={
                blurHeader || blurFooter
                  ? { top: headerInset, bottom: footerInset }
                  : undefined
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              enableResetScrollToCoords={false}
            >
              {children}
            </AnimatedKeyboardAwareScrollView>
          ) : (
            <View
              style={{
                paddingHorizontal,
                flex: 1,
                paddingLeft,
                paddingRight,
                opacity: contentHidden ? 0 : 1,
              }}
            >
              {children}
            </View>
          )}
          {/* Floating footer with the progressive blur behind it */}
          {blurFooter ? (
            <View
              pointerEvents="box-none"
              onLayout={onFooterLayout}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: paddingBottom || 0,
                zIndex: 999,
              }}
            >
              <FooterProgressiveBlur
                color={resolvedBackgroundColor}
                visible={edge.footerVisible}
              />
              {footerElement}
            </View>
          ) : (
            footerElement
          )}
        </View>
      </ScreenScrollPropsContext.Provider>
      </ScreenFooterInsetContext.Provider>
      </ScreenHeaderInsetContext.Provider>
    );
  };

  return backgroundImage ? (
    <View style={{ width, height: height + imageBottom, zIndex: 999 }}>
      {content()}
      <ImageFast
        source={backgroundImage}
        removeLoading={removeLoading}
        style={{
          width,
          height: height + 70,
          position: "absolute",
          zIndex: -1,
        }}
        resizeMode="cover"
      />
    </View>
  ) : (
    content()
  );
};

export default ScreenWrapper;
