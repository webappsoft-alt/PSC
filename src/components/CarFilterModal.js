import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { findTopic } from "../utils/feedTopics";
import TopicLottie from "./TopicLottie";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import CustomButton from "./CustomButton";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import Divider from "./Divider";
import CustomSwitch from "./CustomSwitch";
import Icons from "./Icons";
import { useTheme } from "../contexts/ThemeContext";

// Fallback default topics (used when no data is passed)
const DEFAULT_FILTERS = [
  { name: "Technology", image: Images.Topis1 },
  { name: "Politics", image: Images.Topis2 },
  { name: "Sports", image: Images.Topis3 },
  { name: "Music", image: Images.Topis4 },
  { name: "Entertainment", image: Images.Topis5 },
  { name: "Fashion", image: Images.Topis6 },
  { name: "Food", image: Images.Topis7 },
  { name: "Gaming", image: Images.Topis8 },
  { name: "Health", image: Images.Topis9 },
];

const ROW_HEIGHT = 64;

const haptic = (type) =>
  ReactNativeHapticFeedback.trigger(type, {
    enableVibrateFallback: false,
    ignoreAndroidSystemSettings: false,
  });

function moveItem(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Viral's "Pick Your Interests" row: drag handle · topic · switch. Dragging
 * the handle lifts the row, the others slide out of the way, and the drop
 * position becomes the topic's order (= header chip order).
 */
function DraggableTopicRow({
  item,
  index,
  count,
  dragIndex,
  dragTranslation,
  onDragStart,
  onDragEnd,
  enabled,
  onToggle,
  lottieReady,
  styles,
  colors,
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const active = dragIndex.value;
    if (active === index) {
      return {
        zIndex: 20,
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        transform: [{ translateY: dragTranslation.value }],
      };
    }
    if (active < 0) {
      return {
        zIndex: 0,
        backgroundColor: "transparent",
        transform: [{ translateY: 0 }],
      };
    }
    const offset = Math.round(dragTranslation.value / ROW_HEIGHT);
    const target = Math.max(0, Math.min(count - 1, active + offset));
    let shift = 0;
    if (active < target && index > active && index <= target) {
      shift = -ROW_HEIGHT;
    } else if (active > target && index >= target && index < active) {
      shift = ROW_HEIGHT;
    }
    return {
      zIndex: 0,
      backgroundColor: "transparent",
      transform: [{ translateY: shift }],
    };
  });

  const dragGesture = Gesture.Pan()
    .activeOffsetY([-3, 3])
    .onStart(() => {
      dragIndex.value = index;
      dragTranslation.value = 0;
      runOnJS(onDragStart)(index);
    })
    .onUpdate((event) => {
      dragTranslation.value = event.translationY;
    })
    .onEnd(() => {
      const from = dragIndex.value;
      const offset = Math.round(dragTranslation.value / ROW_HEIGHT);
      const to = Math.max(0, Math.min(count - 1, from + offset));
      dragIndex.value = -1;
      dragTranslation.value = 0;
      runOnJS(onDragEnd)(from, to);
    })
    .onFinalize(() => {
      dragIndex.value = -1;
      dragTranslation.value = 0;
    });

  return (
    <Animated.View style={[styles.filterItem, animatedStyle]}>
      <GestureDetector gesture={dragGesture}>
        <View style={styles.dragHandle} hitSlop={8}>
          <Icons
            family="MaterialSymbolsRounded"
            name="menu"
            size={22}
            color={colors.text}
          />
        </View>
      </GestureDetector>
      <View style={[styles.row, { flex: 1 }]}>
        <TopicLottie name={item.name} ready={lottieReady} />
        <CustomText
          label={item.name}
          color={colors.text}
          fontFamily={fonts.medium}
          fontSize={16}
          marginLeft={12}
          numberOfLines={1}
        />
      </View>
      <CustomSwitch value={enabled} setValue={(on) => onToggle(item.name, on)} />
    </Animated.View>
  );
}

const FilterModal = ({
  isVisible,
  onDisable,
  onItemPress,
  title,
  subtitle,
  onConfirm,
  filters,
  data, // alias for filters to keep API flexible
  multiSelect = false, // New prop for multi-select mode
  selectedItems = [], // Array of selected items for multi-select
  singleSelect = false, // New prop for single-select mode with confirm button
  toggleMode = false, // Figma home "+" sheet: a switch per row (on = chip shown)
  enabledItems = [], // names currently on (toggleMode)
  onToggleItem, // (name, enabled) => void (toggleMode)
  onReorder, // (orderedNames) => void (toggleMode drag)
}) => {
  const insests = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [selectedIndex, setSelectedIndex] = useState(null);
  // Topic Lotties load from asset URIs off the main thread (see
  // topicAnimationSource), so they can mount on the first frame like Viral.
  const lottieReady = true;
  const dragIndex = useSharedValue(-1);
  const dragTranslation = useSharedValue(0);
  const [dragging, setDragging] = useState(false);
  const [localSelectedItems, setLocalSelectedItems] = useState([]);
  const prevIsVisible = useRef(false);

  // Update local selection when modal opens (not closes)
  useEffect(() => {
    if (isVisible && !prevIsVisible.current) {
      setLocalSelectedItems(selectedItems || []);
    }
    prevIsVisible.current = isVisible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Prefer externally passed data; fall back to defaults
  const items =
    filters && filters.length
      ? filters
      : data && data.length
      ? data
      : DEFAULT_FILTERS;

  const handleItemToggle = (item) => {
    if (toggleMode) {
      onToggleItem?.(item.name, !enabledItems.includes(item.name));
      return;
    }
    if (multiSelect) {
      const isSelected = localSelectedItems.includes(item.name);
      if (isSelected) {
        if (singleSelect) {
          // In singleSelect mode, clicking the same item doesn't necessarily need to deselect
          // or it can deselect if we want to allow "none"
          setLocalSelectedItems([]);
        } else {
          setLocalSelectedItems(
            localSelectedItems.filter((i) => i !== item.name),
          );
        }
      } else {
        if (singleSelect) {
          setLocalSelectedItems([item.name]);
        } else {
          setLocalSelectedItems([...localSelectedItems, item.name]);
        }
      }
    } else {
      setSelectedIndex(items.indexOf(item));
      onItemPress?.(item, items.indexOf(item));
    }
  };

  const handleDragStart = useCallback(() => {
    setDragging(true);
    haptic("impactLight");
  }, []);

  const handleDragEnd = useCallback(
    (from, to) => {
      setDragging(false);
      const names = items.map((i) => i.name);
      const next = moveItem(names, from, to);
      if (next === names) return;
      haptic("selection");
      onReorder?.(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, onReorder],
  );

  const handleConfirm = () => {
    if (multiSelect && onConfirm) {
      onConfirm(localSelectedItems);
    }
    onDisable();
  };

  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      {/* RNGH gestures inside a native Modal need their own root view */}
      <GestureHandlerRootView style={styles.mainContainer}>
        <View style={styles.headerContainer}>
          <View
            style={[
              styles.row,
              { paddingTop: insests.top, paddingHorizontal: 12 },
            ]}
          >
            <TouchableOpacity
              onPress={onDisable}
              activeOpacity={0.6}
              style={styles.backIcon}
            >
              <Icons
                name="keyboard-arrow-left"
                family="MaterialIcons"
                size={26}
                color={colors.text}
              />
            </TouchableOpacity>

            <CustomText
              label={title}
              color={colors.text}
              fontFamily={fonts.semiBold}
              textTransform="capitalize"
              fontSize={20}
            />
          </View>

          <Divider
            marginTop={8}
            marginBottom={0}
            thickness={2}
            color={colors.white04}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEnabled={!dragging}
          >
            {toggleMode
              ? items.map((f, idx) => (
                  <DraggableTopicRow
                    key={f.name}
                    item={f}
                    index={idx}
                    count={items.length}
                    dragIndex={dragIndex}
                    dragTranslation={dragTranslation}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    enabled={enabledItems.includes(f.name)}
                    onToggle={(name, on) => onToggleItem?.(name, on)}
                    lottieReady={lottieReady}
                    styles={styles}
                    colors={colors}
                  />
                ))
              : items.map((f, idx) => {
              const isSelected = multiSelect
                ? localSelectedItems.includes(f.name)
                : selectedIndex === idx;
              return (
                <TouchableOpacity
                   key={`${f.name}-${idx}`}
                  activeOpacity={0.7}
                  style={[styles.filterItem]}
                  onPress={() => handleItemToggle(f)}
                >
                  <View style={styles.row}>
                    {findTopic(f?.name)?.animation ? (
                      <TopicLottie name={f.name} ready={lottieReady} />
                    ) : f?.image ? (
                      <Image source={f.image} style={styles.filterImage} />
                    ) : null}
                    <View>
                      <CustomText
                        label={f.name}
                        color={colors.text}
                        fontFamily={fonts.medium}
                        fontSize={16}
                        marginLeft={f?.image || findTopic(f?.name) ? 12 : 0}
                      />
                      {f.subtitle && (
                        <CustomText
                          label={f.subtitle}
                          color={colors.textSecondary}
                          fontFamily={fonts.medium}
                          fontSize={14}
                          marginLeft={f?.image ? 12 : 0}
                        />
                      )}
                    </View>
                  </View>
                  {toggleMode ? (
                    <CustomSwitch
                      value={enabledItems.includes(f.name)}
                      setValue={(enabled) => onToggleItem?.(f.name, enabled)}
                    />
                  ) : (
                    <View
                      style={
                        isSelected
                          ? styles.circleIndicatorUnselected
                          : styles.circleIndicator
                      }
                    >
                      <View
                        style={[
                          styles.innerCircle,
                          isSelected && styles.innerCircleSelected,
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {multiSelect && (
            <View style={styles.buttonContainer}>
              <CustomButton
                title={`Confirm ${
                  localSelectedItems.length > 0
                    ? `(${localSelectedItems.length})`
                    : ""
                }`}
                onPress={handleConfirm}
              />
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </CustomModal>
  );
};

export default FilterModal;

const createStyles = (colors, isDark) => StyleSheet.create({
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.background,
    borderRadius: 22,
  },
  headerContainer: {
    backgroundColor: colors.background,
    flex: 1,
  },

  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    backgroundColor: colors.white04,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#FFFFFF0A" : colors.border,
    padding: 16,
    height: ROW_HEIGHT,
  },
  dragHandle: {
    width: 32,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  filterImage: {
    width: 16,
    height: 16,
    borderRadius: 6,
    resizeMode: "cover",
  },
  filterAnimation: {
    width: 24,
    height: 24,
  },
  circleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: isDark ? "#FFFFFF7A" : "rgba(18, 18, 18, 0.32)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  circleIndicatorUnselected: {
    borderColor: COLORS.buttonColor,
    borderWidth: 1,
    borderRadius: 100,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 100,
    backgroundColor: "transparent",
  },
  innerCircleSelected: {
    backgroundColor: COLORS.buttonColor,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 24,
  },
});
