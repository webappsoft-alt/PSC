import { useIsFocused, useNavigation } from "@react-navigation/native";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const AnimatedKeyboardAwareScrollView = Animated.createAnimatedComponent(
  KeyboardAwareScrollView,
);
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ImageFast from "./ImageFast";

import { Images } from "../assets/images";
import { useTheme } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

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
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const resolvedBackgroundColor = backgroundColor || colors.background;
  const resolvedStatusBarColor = statusBarColor || colors.statusBarColor;
  const resolvedBarStyle = barStyle || colors.statusBarStyle;

  const content = () => {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: backgroundImage
            ? "transparent"
            : resolvedBackgroundColor,
          paddingTop: translucent ? 0 : insets.top,
          paddingBottom: paddingBottom,
        }}
      >
        <FocusAwareStatusBar
          barStyle={resolvedBarStyle}
          backgroundColor={resolvedStatusBarColor}
          translucent={translucent}
        />
        {!translucent && (
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

        {/* Floating header */}
        {headerFloating && (
          <View
            style={{
              position: "absolute",
              top: translucent ? 0 : insets.top,
              left: 0,
              right: 0,
              zIndex: 999,
            }}
          >
            {headerUnScrollable()}
          </View>
        )}

        {/* Non-floating header */}
        {!headerFloating && headerUnScrollable()}

        {scrollEnabled ? (
          <AnimatedKeyboardAwareScrollView
            ref={scrollRef}
            nestedScrollEnabled={nestedScrollEnabled}
            refreshControl={refreshControl}
            onScroll={onScroll}
            scrollEventThrottle={scrollEventThrottle}
            stickyHeaderIndices={stickyHeaderIndices}
            style={{
              flex: 1,
              backgroundColor: resolvedBackgroundColor,
              paddingHorizontal,
              paddingLeft,
              paddingRight,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            enableResetScrollToCoords={false}
          >
            {children}
          </AnimatedKeyboardAwareScrollView>
        ) : (
          <View
            style={{ paddingHorizontal, flex: 1, paddingLeft, paddingRight }}
          >
            {children}
          </View>
        )}
        {footerUnScrollable()}
      </View>
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
