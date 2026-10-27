import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import TopicLottie from "../../../components/TopicLottie";
import { PSC_TOPICS } from "../../../utils/feedTopics";
import { emitShowPick } from "../../../utils/showPicks";
import { ToastMessage } from "../../../utils/ToastMessage";
import { CircleButton, Radio } from "./molecules/ShowForm";
import { GlassFill, SHOWS } from "./molecules/showsLayout";

/**
 * Figma Shows › "Select-Genre" (7580:13229). Header #121212, pad (status bar
 * + 12) / 12 / 8 / 12, gap 8: search pill (40, r100, white 4%, pad 10,
 * 24 search @64%, Medium 14 placeholder @48%, 22 cancel @48%) · 8 · 40 close
 * circle; picked genres as chips (32, r8, white 4%, pad 10, Medium 14 @64%,
 * 14 cancel @48%), in list order. List: 64pt rows, pad 16, 1pt white 4%
 * rules: animated topic icon (as the post topic list) · Medium 16 −0.5px
 * white; 24 radio (white 48% / gold). Up to 3 genres.
 * Long-press a row and drag to reorder (no handle in Figma).
 */
const MAX_GENRES = 3;
const ROW_HEIGHT = 65; // 64 row + 1pt rule
const ALL = PSC_TOPICS.map((t) => t.name);

const haptic = (type) =>
  ReactNativeHapticFeedback.trigger(type, {
    enableVibrateFallback: false,
    ignoreAndroidSystemSettings: false,
  });

const moveItem = (list, from, to) => {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const GenreRow = ({
  name,
  index,
  count,
  checked,
  last,
  canDrag,
  dragIndex,
  dragY,
  onToggle,
  onDragStart,
  onDragEnd,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const active = dragIndex.value;
    if (active === index) {
      return {
        zIndex: 20,
        backgroundColor: "#1A1A1A",
        transform: [{ translateY: dragY.value }, { scale: 1.02 }],
      };
    }
    if (active < 0) {
      return { zIndex: 0, transform: [{ translateY: 0 }, { scale: 1 }] };
    }
    const target = Math.max(
      0,
      Math.min(count - 1, active + Math.round(dragY.value / ROW_HEIGHT)),
    );
    let shift = 0;
    if (active < target && index > active && index <= target) shift = -ROW_HEIGHT;
    else if (active > target && index >= target && index < active) shift = ROW_HEIGHT;
    return { zIndex: 0, transform: [{ translateY: shift }, { scale: 1 }] };
  });

  const tap = Gesture.Tap()
    .maxDuration(400)
    .onEnd((_e, success) => {
      if (success) runOnJS(onToggle)(name);
    });
  const drag = Gesture.Pan()
    .enabled(canDrag)
    .activateAfterLongPress(300)
    .onStart(() => {
      dragIndex.value = index;
      dragY.value = 0;
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      dragY.value = e.translationY;
    })
    .onEnd(() => {
      const from = dragIndex.value;
      const to = Math.max(0, Math.min(count - 1, from + Math.round(dragY.value / ROW_HEIGHT)));
      dragIndex.value = -1;
      dragY.value = 0;
      runOnJS(onDragEnd)(from, to);
    })
    .onFinalize(() => {
      dragIndex.value = -1;
      dragY.value = 0;
    });

  return (
    <GestureDetector gesture={Gesture.Exclusive(drag, tap)}>
      <Animated.View style={[styles.rowWrap, animatedStyle]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <TopicLottie name={name} />
            <CustomText
              label={name}
              fontSize={16}
              fontFamily={fonts.medium}
              letterSpacing={-0.5}
              color={SHOWS.white}
            />
          </View>
          <Radio checked={checked} idleColor={SHOWS.white48} />
        </View>
        {!last ? <View style={styles.rule} /> : null}
      </Animated.View>
    </GestureDetector>
  );
};

/**
 * The full-screen topic list (Shows genres, Circle topic). `single`: one
 * topic, tapping a row picks it and closes; no reordering.
 */
export const TopicPicker = ({
  initial = [],
  initialOrder = [],
  max = MAX_GENRES,
  single = false,
  placeholder = "Sci-Fi...",
  emptyLabel = "No genre matches your search.",
  onChange,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState(initial);
  const [order, setOrder] = useState(() => {
    const saved = initialOrder;
    // saved drag order, plus any topic that isn't in it yet
    return [...saved.filter((n) => ALL.includes(n)), ...ALL.filter((n) => !saved.includes(n))];
  });
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const dragIndex = useSharedValue(-1);
  const dragY = useSharedValue(0);

  const query = search.trim().toLowerCase();
  const rows = useMemo(
    () => (query ? order.filter((n) => n.toLowerCase().includes(query)) : order),
    [order, query],
  );
  // picked chips follow the list order
  const pickedOrdered = useMemo(
    () => order.filter((n) => picked.includes(n)),
    [order, picked],
  );

  // keep the form in sync on every change, so close / back both keep them
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!single) onChange?.(pickedOrdered, order);
  }, [pickedOrdered, order]);

  // side effects (the toast) stay out of the state updater — React may run
  // updaters during render, and a toast there updates another component
  const toggle = useCallback(
    (name) => {
      if (single) {
        setPicked([name]);
        onChange?.([name], order);
        onClose?.();
        return;
      }
      if (picked.includes(name)) {
        setPicked((prev) => prev.filter((g) => g !== name));
        return;
      }
      if (picked.length >= max) {
        ToastMessage(`You can pick up to ${max} genres`, "error");
        return;
      }
      setPicked((prev) =>
        prev.includes(name) || prev.length >= max ? prev : [...prev, name],
      );
    },
    [picked, single, order, max, onChange, onClose],
  );

  const onDragStart = useCallback(() => {
    setDragging(true);
    haptic("impactLight");
  }, []);
  const onDragEnd = useCallback((from, to) => {
    setDragging(false);
    if (from === to) return;
    haptic("selection");
    setOrder((prev) => moveItem(prev, from, to));
  }, []);

  // single pick: the radio shows the choice, no chips row
  const showChips = !single && pickedOrdered.length > 0;
  const headerHeight = insets.top + 12 + 40 + (showChips ? 8 + 32 : 0) + 8;

  return (
    <View style={styles.page}>
      <ScrollView
        scrollEnabled={!dragging}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: headerHeight + 1,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={styles.list}>
          {rows.map((name, index) => (
            <GenreRow
              key={name}
              name={name}
              index={index}
              count={rows.length}
              checked={picked.includes(name)}
              last={index === rows.length - 1}
              // reordering works on the full list, not on search results
              canDrag={!query && !single}
              dragIndex={dragIndex}
              dragY={dragY}
              onToggle={toggle}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
          {rows.length === 0 ? (
            <View style={styles.empty}>
              <CustomText
                label={emptyLabel}
                fontSize={14}
                fontFamily={fonts.medium}
                color={SHOWS.white48}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <GlassFill fill={SHOWS.white04} />
            <Icons
              family="MaterialSymbolsRounded"
              name="search"
              size={24}
              color={SHOWS.white64}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={placeholder}
              placeholderTextColor={SHOWS.white48}
              selectionColor={SHOWS.gold}
              autoCorrect={false}
              style={styles.searchInput}
            />
            {search ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSearch("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="cancel"
                  size={22}
                  color={SHOWS.white48}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          {/* picks are already synced to the form — close just leaves */}
          <CircleButton icon="close" size={20} onPress={onClose} />
        </View>
        {showChips ? (
          <View style={styles.chips}>
            {pickedOrdered.map((name) => (
              <TouchableOpacity
                key={name}
                activeOpacity={0.7}
                onPress={() => toggle(name)}
                style={styles.chip}
              >
                <GlassFill fill={SHOWS.white04} borderRadius={8} />
                <CustomText
                  label={name}
                  fontSize={14}
                  fontFamily={fonts.medium}
                  color={SHOWS.white64}
                />
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="cancel"
                  size={14}
                  color={SHOWS.white48}
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const SelectGenre = ({ route }) => {
  const navigation = useNavigation();
  return (
    <TopicPicker
      initial={route?.params?.genres || []}
      initialOrder={route?.params?.order || []}
      onChange={(genres, genreOrder) => emitShowPick({ genres, genreOrder })}
      onClose={() => navigation.goBack()}
    />
  );
};

export default SelectGenre;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: SHOWS.page,
  },
  list: {
    backgroundColor: SHOWS.section,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: SHOWS.section,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchRow: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  search: {
    flex: 1,
    height: 40,
    borderRadius: 100,
    overflow: "hidden",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  searchInput: {
    flex: 1,
    height: 40,
    padding: 0,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: SHOWS.white,
  },
  chips: {
    height: 32,
    flexDirection: "row",
    gap: 4,
  },
  chip: {
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowWrap: {
    backgroundColor: SHOWS.section,
  },
  row: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    // post topic list: 24 animated icon · 12 · name
    gap: 12,
  },
  rule: {
    height: 1,
    backgroundColor: SHOWS.white04,
  },
  empty: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
