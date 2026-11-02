import { useCallback, useMemo, useRef } from "react";
import { Animated } from "react-native";

/**
 * Client rule: headers and footers blur only while content sits under them.
 * At rest (list at the top / nothing behind the footer) they are clear.
 *
 * Returns two native-driven 0 → 1 values and the props to spread on the
 * ScrollView / FlatList whose content moves under the header / footer:
 *
 *   const edge = useScrollEdgeBlur();
 *   <FlatList {...edge.scrollProps(myOnScroll)} />
 *   <HeaderProgressiveBlur visible={edge.headerVisible} />
 *
 * `onChange({ header, footer })` reports every change (tab pages forward it
 * to the shared feed header / bottom-nav blur).
 *
 * `headerVisible` turns on as soon as the content is scrolled up at all;
 * `footerVisible` while there is more content below the viewport (it ends on
 * the footer spacer, so at the end of a list the footer is clear again).
 */
const FADE_MS = 180;
// sub-pixel scroll jitter (bounce, layout rounding) never toggles the blur
const EPSILON = 1;

export default function useScrollEdgeBlur({ onChange } = {}) {
  // latest onChange without re-creating the handlers
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const headerVisible = useRef(new Animated.Value(0)).current;
  const footerVisible = useRef(new Animated.Value(0)).current;
  const state = useRef({
    header: false,
    footer: false,
    y: 0,
    viewport: 0,
    content: 0,
    inverted: false,
  }).current;

  const fade = useCallback((value, on) => {
    Animated.timing(value, {
      toValue: on ? 1 : 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();
  }, []);

  const update = useCallback(() => {
    // content above the viewport / content below it
    const above = state.y > EPSILON;
    const below =
      state.viewport > 0 && state.y + state.viewport < state.content - EPSILON;
    // an inverted list (chat) starts at the bottom: offset 0 = newest message
    const header = state.inverted ? below : above;
    const footer = state.inverted ? above : below;
    let changed = false;
    if (header !== state.header) {
      state.header = header;
      fade(headerVisible, header);
      changed = true;
    }
    if (footer !== state.footer) {
      state.footer = footer;
      fade(footerVisible, footer);
      changed = true;
    }
    // reported on every update, not only on a change: a page that was
    // remounted or re-shown (tab pages share one feed header / nav blur)
    // must be able to re-assert its state; listeners compare and no-op
    if (onChangeRef.current) onChangeRef.current({ header, footer, changed });
  }, [state, fade, headerVisible, footerVisible]);

  const onScroll = useCallback(
    (e) => {
      const n = e?.nativeEvent;
      if (!n) return;
      state.y = n.contentOffset?.y ?? 0;
      if (n.layoutMeasurement?.height) state.viewport = n.layoutMeasurement.height;
      if (n.contentSize?.height) state.content = n.contentSize.height;
      update();
    },
    [state, update],
  );

  const onLayout = useCallback(
    (e) => {
      state.viewport = e?.nativeEvent?.layout?.height ?? state.viewport;
      update();
    },
    [state, update],
  );

  const onContentSizeChange = useCallback(
    (_w, h) => {
      state.content = h ?? state.content;
      update();
    },
    [state, update],
  );

  /**
   * Props for the scrolling list. Pass the screen's own handlers so they keep
   * working: scrollProps(onScroll) or scrollProps({ onScroll, onLayout, … }).
   * An Animated.event (not a plain function) can't be chained, so for those
   * the screen keeps its event and the blur follows the drag/momentum ends.
   */
  const scrollProps = useCallback(
    (own) => {
      const o = typeof own === "function" ? { onScroll: own } : own || {};
      const ownScrollIsFn = typeof o.onScroll === "function";
      state.inverted = !!o.inverted;
      // keep every other handler the list was given
      const props = {
        ...o,
        scrollEventThrottle: o.scrollEventThrottle ?? 16,
        onLayout: (e) => {
          onLayout(e);
          o.onLayout?.(e);
        },
        onContentSizeChange: (w, h) => {
          onContentSizeChange(w, h);
          o.onContentSizeChange?.(w, h);
        },
      };
      if (o.onScroll && !ownScrollIsFn) {
        // Animated.event: leave it in charge of onScroll, follow the drag /
        // momentum events instead
        props.onScrollBeginDrag = (e) => {
          onScroll(e);
          o.onScrollBeginDrag?.(e);
        };
        props.onScrollEndDrag = (e) => {
          onScroll(e);
          o.onScrollEndDrag?.(e);
        };
        props.onMomentumScrollEnd = (e) => {
          onScroll(e);
          o.onMomentumScrollEnd?.(e);
        };
      } else {
        props.onScroll = (e) => {
          onScroll(e);
          o.onScroll?.(e);
        };
      }
      return props;
    },
    [state, onScroll, onLayout, onContentSizeChange],
  );

  return useMemo(
    () => ({
      headerVisible,
      footerVisible,
      onScroll,
      onLayout,
      onContentSizeChange,
      scrollProps,
    }),
    [headerVisible, footerVisible, onScroll, onLayout, onContentSizeChange, scrollProps],
  );
}
