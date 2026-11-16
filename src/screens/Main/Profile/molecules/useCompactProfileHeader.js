import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Compact scrolled header (Figma "Header-When-Scrolling-Instagram-Inspired",
 * motion after the MakeItAnimated "Instagram Profile Screen Tabs Animation").
 *
 * Every step is linked to the scroll position (so it follows the finger and
 * reverses on the way back) and runs on the UI thread: `scroll` is the
 * ScrollView's native-driven value (ScreenWrapper `onStickyScrollValue`).
 * The tabs pin when the offset equals the profile card's height (P); over
 * the last 56pt before that the pieces arrive one after another:
 *   expanded title fades → background → avatar + name slide down → Follow
 *   pops in → icon tabs rise as the text tabs fade → sort row settles just
 *   after the pin.
 */
export default function useCompactProfileHeader(scroll) {
  const [cardH, setCardH] = useState(null);
  const [interactive, setInteractive] = useState(false);

  const onCardLayout = useCallback((e) => {
    const h = Math.round(e.nativeEvent.layout.height);
    setCardH((prev) => (prev === h ? prev : h));
  }, []);

  const anim = useMemo(() => {
    if (!scroll || cardH == null) return null;
    const P = cardH;
    const range = (a, b, from, to) =>
      scroll.interpolate({ inputRange: [P + a, P + b], outputRange: [from, to], extrapolate: "clamp" });
    return {
      // the expanded header's title + icons leave first, so the two names
      // never sit on top of each other
      bigHeaderOpacity: range(-64, -44, 1, 0),
      bg: range(-56, -32, 0, 1),
      identityOpacity: range(-40, -4, 0, 1),
      identityY: range(-40, -4, 12, 0),
      followOpacity: range(-36, 0, 0, 1),
      followScale: range(-36, 0, 0.88, 1),
      tabsOpacity: range(-28, 0, 0, 1),
      tabsY: range(-28, 0, 10, 0),
      sortOpacity: range(-16, 12, 0, 1),
      sortY: range(-16, 12, 8, 0),
      textTabsOpacity: range(-36, -12, 1, 0),
    };
  }, [scroll, cardH]);

  useEffect(() => {
    if (!scroll || cardH == null) return undefined;
    const id = scroll.addListener(({ value }) => {
      const on = value >= cardH - 4;
      setInteractive((prev) => (prev === on ? prev : on));
    });
    return () => scroll.removeListener(id);
  }, [scroll, cardH]);

  return { onCardLayout, anim, interactive };
}
