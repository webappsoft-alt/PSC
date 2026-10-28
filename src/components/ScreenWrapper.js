import {
  NavigationRouteContext,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const AnimatedKeyboardAwareScrollView = Animated.createAnimatedComponent(
  KeyboardAwareScrollView
);
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HeaderProgressiveBlur from "./HeaderProgressiveBlur";
import ImageFast from "./ImageFast";

import { Images } from "../assets/images";
import { useTheme } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

/**
 * Client rule: "the header has progressive blur everywhere" — on screens with
 * scrolling content the header floats over it (Figma "Header": absolute from
 * y 0, status bar included, progressive background blur 16 → 0) and the
 * content scrolls underneath.
 *
 * `scrollEnabled` screens get this automatically. Screens that scroll their
 * own FlatList / ScrollView pass `headerBlur` and put <ScreenHeaderSpacer />
 * (or `useScreenHeaderInset()` as top padding) at the top of their list.
 */
const ScreenHeaderInsetContext = createContext(0);
// measured header heights per route, so a revisit lays out on the first frame
const headerHeightCache = new Map();

/** Total height covered by the floating header (status bar included). */
export const useScreenHeaderInset = () => useContext(ScreenHeaderInsetContext);

/** Render-prop access to the inset, for screens that render ScreenWrapper
 *  themselves: <ScreenHeaderInsetConsumer>{(inset) => …}</…> */
export const ScreenHeaderInsetConsumer = ScreenHeaderInsetContext.Consumer;

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
}) => {
  const navigation = useNavigation();
  // (context, not useRoute — that throws outside a screen)
  const route = useContext(NavigationRouteContext);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const headerElement = headerUnScrollable?.() ?? null;
  const blurHeader =
    !!headerElement && !isAuth && (headerBlur ?? scrollEnabled);
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
              onScroll={onScroll}
              scrollEventThrottle={scrollEventThrottle}
              stickyHeaderIndices={stickyHeaderIndices}
              style={{
                flex: 1,
                backgroundColor: resolvedBackgroundColor,
                paddingHorizontal,
                paddingLeft,
                paddingRight,
                opacity: contentHidden ? 0 : 1,
              }}
              contentContainerStyle={
                blurHeader ? { paddingTop: headerInset } : undefined
              }
              scrollIndicatorInsets={
                blurHeader ? { top: headerInset } : undefined
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
          {footerUnScrollable()}
        </View>
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
