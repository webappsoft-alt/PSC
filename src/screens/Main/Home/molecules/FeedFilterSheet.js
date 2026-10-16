import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import LottieView from "lottie-react-native";
import fonts from "../../../../assets/fonts";
import CustomSwitch from "../../../../components/CustomSwitch";
import CustomText from "../../../../components/CustomText";
import FloatingSheet, {
  SheetActions,
  SheetSectionLabel,
} from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";
import { PSC_TOPICS } from "../../../../utils/feedTopics";

/**
 * Figma "Filters-Sorting" (header tune button).
 * Sorting tab: SORTING BY (Most Recent / Most Popular) + TIME PERIOD
 * (Today / Last 3 Days / Last 7 Days). Topics tab: the same topic switches
 * as the "+" sheet. Reset All clears, Confirm applies.
 */
export const DEFAULT_FEED_FILTERS = { sortBy: "createdAt", period: null };

const SORT_OPTIONS = [
  { value: "createdAt", label: "Most Recent" },
  { value: "popular", label: "Most Popular" },
];
const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "3d", label: "Last 3 Days" },
  { value: "7d", label: "Last 7 Days" },
];

const RadioRow = ({ label, selected, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
      <CustomText
        label={label}
        fontSize={16}
        lineHeight={18}
        letterSpacing={-0.5}
        fontFamily={fonts.medium}
        color={colors.text}
      />
      <Icons
        family="MaterialCommunityIcons"
        name={selected ? "radiobox-marked" : "radiobox-blank"}
        size={24}
        color={selected ? COLORS.buttonColor : COLORS.gray48}
      />
    </TouchableOpacity>
  );
};

const Segment = ({ tab, setTab }) => {
  const { colors } = useTheme();
  const item = (key, icon, label) => {
    const active = tab === key;
    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.8}
        onPress={() => setTab(key)}
        style={[
          styles.segmentItem,
          active && { backgroundColor: "#121212" },
        ]}
      >
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name={icon}
          size={18}
          color={active ? colors.text : COLORS.gray64}
        />
        <CustomText
          label={label}
          fontSize={16}
          fontFamily={fonts.medium}
          color={active ? colors.text : COLORS.gray64}
        />
      </TouchableOpacity>
    );
  };
  return (
    <View style={[styles.segment, { backgroundColor: colors.surfaceAlt }]}>
      {item("sorting", "sort", "Sorting")}
      {item("topics", "category", "Topics")}
    </View>
  );
};

const FeedFilterSheet = ({
  visible,
  onDismiss,
  filters,
  onApply,
  enabledTopics = [],
  onToggleTopic,
}) => {
  const { colors } = useTheme();
  const [tab, setTab] = useState("sorting");
  const [draft, setDraft] = useState(filters || DEFAULT_FEED_FILTERS);

  useEffect(() => {
    if (visible) setDraft(filters || DEFAULT_FEED_FILTERS);
  }, [visible, filters]);

  return (
    <FloatingSheet
      visible={visible}
      onDismiss={onDismiss}
      title="Filters"
      subtitle="Search according to you taste."
    >
      <Segment tab={tab} setTab={setTab} />

      {tab === "sorting" ? (
        <View style={{ gap: 20 }}>
          <View>
          <SheetSectionLabel label="SORTING BY" />
          {SORT_OPTIONS.map((o) => (
            <RadioRow
              key={o.value}
              label={o.label}
              selected={draft.sortBy === o.value}
              onPress={() => setDraft((d) => ({ ...d, sortBy: o.value }))}
            />
          ))}
          </View>
          <View>
          <SheetSectionLabel label="TIME PERIOD" />
          {PERIOD_OPTIONS.map((o) => (
            <RadioRow
              key={o.value}
              label={o.label}
              selected={draft.period === o.value}
              onPress={() =>
                setDraft((d) => ({
                  ...d,
                  period: d.period === o.value ? null : o.value,
                }))
              }
            />
          ))}
          </View>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          {PSC_TOPICS.map((t) => (
            <View
              key={t.name}
              style={[styles.topicRow, { borderBottomColor: colors.surfaceAlt }]}
            >
              <LottieView
                source={t.animation}
                autoPlay
                loop
                style={{ width: 24, height: 24 }}
              />
              <CustomText
                label={t.name}
                fontSize={16}
                fontFamily={fonts.medium}
                color={colors.text}
                marginLeft={12}
                containerStyle={{ flex: 1 }}
              />
              <CustomSwitch
                value={enabledTopics.includes(t.name)}
                setValue={(on) => onToggleTopic?.(t.name, on)}
              />
            </View>
          ))}
        </ScrollView>
      )}

      <SheetActions
        onReset={() => setDraft(DEFAULT_FEED_FILTERS)}
        onConfirm={() => {
          onApply?.(draft);
          onDismiss?.();
        }}
      />
    </FloatingSheet>
  );
};

export default FeedFilterSheet;

const styles = StyleSheet.create({
  // Figma: 319 fill × 44, r100, white 4%, pad 4, gap 4
  segment: {
    flexDirection: "row",
    height: 44,
    borderRadius: 100,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    height: 36,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  // Figma: text at x16 (Medium 16 / 18 / −0.5px), radio 24 on the right
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
    paddingLeft: 16,
    paddingRight: 4,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingLeft: 16,
    paddingRight: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
