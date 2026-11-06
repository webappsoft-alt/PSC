import { useCallback, useRef } from "react";
import { ActivityIndicator, Animated, Platform, StyleSheet } from "react-native";

/**
 * iOS draws the RefreshControl spinner at the very top of the list, under a
 * floating (blurred) header, so it can't be seen. Same fix as the Home feed:
 * the RefreshControl gets `tintColor="transparent"` on iOS and this spinner
 * is drawn just below the header, fading in with the pull and staying while
 * refreshing.
 *   const pull = usePullScroll();
 *   <List onScroll={pull.onScroll} refreshControl={<RefreshControl tintColor={PULL_TINT} … />} />
 *   <PullRefreshIndicator scrollY={pull.scrollY} refreshing={refreshing} top={headerInset} />
 */
export const PULL_TINT = Platform.OS === "ios" ? "transparent" : undefined;

export const usePullScroll = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useCallback((e) => scrollY.setValue(e.nativeEvent.contentOffset.y), [scrollY]);
  return { scrollY, onScroll };
};

const PullRefreshIndicator = ({ scrollY, refreshing, top = 0, color = "#FFFFFF" }) => {
  if (Platform.OS !== "ios") return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          top: top + 18,
          opacity: refreshing
            ? 1
            : scrollY.interpolate({ inputRange: [-70, -20], outputRange: [1, 0], extrapolate: "clamp" }),
        },
      ]}
    >
      <ActivityIndicator size="small" color={color} />
    </Animated.View>
  );
};

export default PullRefreshIndicator;

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 5 },
});
