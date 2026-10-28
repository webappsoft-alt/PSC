import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import fonts from "../../../assets/fonts";
import CustomModalGooglePlaces from "../../../components/CustomModalGooglePlaces";
import CustomSwitch from "../../../components/CustomSwitch";
import CustomText from "../../../components/CustomText";
import HeaderProgressiveBlur from "../../../components/HeaderProgressiveBlur";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useTheme } from "../../../contexts/ThemeContext";
import { get } from "../../../services/ApiRequest";
import { setMatchingFilters } from "../../../store/reducer/MatchingSlice";
import { COLORS } from "../../../utils/COLORS";
import {
  AGE_BOUNDS,
  DEFAULT_MATCHING_FILTERS,
  DISTANCE_BOUNDS,
  INTERESTED_IN_OPTIONS,
  nichesForIndustries,
  countActiveFilters,
  hasGoldAccess,
  matchingFilterQuery,
  resolveMatchingFilters,
} from "../../../utils/matchingFilters";
import { GlassFill, capGap } from "./molecules/matchLayout";

/**
 * Figma › Matching › "Filters" (375 × 1140): #262626 page, #121212 sections
 * stacked 2pt apart, fixed header (status bar + 56) and fixed CTA (12 / 56 /
 * home-indicator). Text offsets convert Figma's cap-trimmed gaps to the 1.4
 * CustomText line box (see capGap).
 */
const PAGE_BG = "#262626";
const SECTION_BG = "#121212";
const GOLD = "#A19375";
const PAD_H = 12;
const SECTION_GAP = 2;
const HEADER_ROW = 56;
const CTA_PAD_TOP = 12;
const CTA_HEIGHT = 56;
const TITLE_SIZE = 18;
// section title cap top sits 16 below the section top
const TITLE_PAD_TOP = capGap(16, 0, TITLE_SIZE);
// title → first control (row / chips / slider frame), 16 apart
const TITLE_TO_CONTENT = capGap(16, TITLE_SIZE, 0);
// a 12pt-icon row whose 12pt text box (16.8) overhangs the icon by 2.4
const ROW12_OVERHANG = (12 * 1.4 - 12) / 2;
const SEEK_FRAME = 24; // track + 12pt thumbs, centred 10 below the frame top
const INDUSTRY_COLLAPSED = 6;
const NICHE_COLLAPSED = 7;

const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
  >
    {!active && <GlassFill fill="rgba(255, 255, 255, 0.04)" />}
    <CustomText
      label={label}
      fontSize={12}
      fontFamily={fonts.medium}
      textTransform="capitalize"
      color={active ? "#121212" : COLORS.white}
    />
  </TouchableOpacity>
);

const SectionTitle = ({ label }) => (
  <CustomText
    label={label}
    fontSize={TITLE_SIZE}
    fontFamily={fonts.medium}
    letterSpacing={-0.5}
    color={COLORS.white}
  />
);

const InfoRow = ({ label, color, style }) => (
  <View style={[styles.infoRow, style]}>
    <Icons
      family="MaterialSymbolsRounded"
      name="info"
      size={12}
      color={color}
    />
    <CustomText
      label={label}
      fontSize={12}
      fontFamily={fonts.regular}
      letterSpacing={-0.36}
      color={color}
      containerStyle={styles.flex}
    />
  </View>
);

const ChipsSection = ({
  title,
  options,
  selected,
  onToggle,
  collapsedCount,
  emptyHint,
}) => {
  const [expanded, setExpanded] = useState(false);
  const canCollapse = collapsedCount && options.length > collapsedCount;
  const visible =
    canCollapse && !expanded ? options.slice(0, collapsedCount) : options;
  return (
    <View style={[styles.section, styles.sectionTitled]}>
      <SectionTitle label={title} />
      {options.length === 0 && emptyHint ? (
        <InfoRow
          label={emptyHint}
          color={COLORS.white}
          style={{
            opacity: 0.48,
            marginTop: TITLE_TO_CONTENT - ROW12_OVERHANG,
            marginBottom: -ROW12_OVERHANG,
          }}
        />
      ) : null}
      <View style={[styles.chipsWrap, { marginTop: TITLE_TO_CONTENT }, options.length === 0 && { display: "none" }]}>
        {visible.map((option) => (
          <Chip
            key={option}
            label={option}
            active={selected.includes(option)}
            onPress={() => onToggle(option)}
          />
        ))}
      </View>
      {canCollapse && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpanded((v) => !v)}
          style={styles.seeMore}
        >
          <CustomText
            label={expanded ? "See less" : "See more"}
            fontSize={11}
            fontFamily={fonts.medium}
            color={COLORS.white}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// The live value stays local while a thumb is dragged (only this section
// re-renders → smooth), the filters update once on release, and the parent
// ScrollView is locked meanwhile so it can't steal the gesture (which made
// the thumb jump back).
const RangeSection = ({
  title,
  bounds,
  values,
  unit,
  onChange,
  width,
  onSlideStart,
  onSlideEnd,
}) => {
  const [live, setLive] = useState(values);
  // follow outside changes (Reset all)
  useEffect(() => {
    setLive(values);
  }, [values[0], values[1]]);

  return (
    <View style={[styles.section, styles.rangeSection]}>
      <SectionTitle label={title} />
      <View style={[styles.seekFrame, { marginTop: TITLE_TO_CONTENT }]}>
        <MultiSlider
          values={values}
          min={bounds[0]}
          max={bounds[1]}
          step={1}
          sliderLength={width}
          onValuesChangeStart={onSlideStart}
          onValuesChange={setLive}
          onValuesChangeFinish={(v) => {
            setLive(v);
            onChange(v);
            onSlideEnd?.();
          }}
          allowOverlap={false}
          containerStyle={styles.sliderContainer}
          trackStyle={styles.sliderTrack}
          selectedStyle={styles.sliderSelected}
          unselectedStyle={styles.sliderUnselected}
          customMarker={() => <View style={styles.thumb} />}
          touchDimensions={{ height: 48, width: 48, borderRadius: 24, slipDisplacement: 200 }}
        />
      </View>
      {/* values 16 below the track (cap top at track bottom + 16) */}
      <View style={[styles.rangeLabels, { marginTop: RANGE_LABELS_GAP }]}>
        <CustomText
          label={`${live[0]} ${unit}`}
          fontSize={12}
          fontFamily={fonts.medium}
          color={RANGE_LABEL}
        />
        <CustomText
          label={`${live[1]} ${unit}`}
          fontSize={12}
          fontFamily={fonts.medium}
          color={RANGE_LABEL}
        />
      </View>
      <InfoRow
        label="Only meet and be visible to people within that range."
        color={COLORS.white}
        style={{ opacity: 0.48, marginTop: RANGE_INFO_GAP }}
      />
    </View>
  );
};

const MatchingFilters = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { userData } = useSelector((state) => state.users);
  const saved = useSelector((state) => state.matching?.filters);

  const [draft, setDraft] = useState(() => resolveMatchingFilters(saved));
  const [industryOptions, setIndustryOptions] = useState([]);
  const [count, setCount] = useState(null);
  const [placesVisible, setPlacesVisible] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const lockScroll = () => setScrollEnabled(false);
  const unlockScroll = () => setScrollEnabled(true);
  const countRequest = useRef(0);

  const goldAccess = hasGoldAccess(userData);
  const activeCount = countActiveFilters(draft);
  const query = matchingFilterQuery(draft);
  const headerHeight = insets.top + HEADER_ROW;
  const ctaPadBottom = insets.bottom > 0 ? insets.bottom : 12;
  const ctaHeight = CTA_PAD_TOP + CTA_HEIGHT + ctaPadBottom;

  // industries real users have (plus anything already selected)
  useEffect(() => {
    let alive = true;
    get("matching/filter-options")
      .then((res) => {
        const list = res?.data?.data?.industries;
        if (alive && Array.isArray(list)) setIndustryOptions(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const industries = useMemo(() => {
    const merged = [...industryOptions];
    draft.industries.forEach((i) => {
      if (!merged.includes(i)) merged.unshift(i);
    });
    return merged;
  }, [industryOptions, draft.industries]);

  // live "Discover N Profiles"
  useEffect(() => {
    const id = ++countRequest.current;
    const timer = setTimeout(() => {
      get(`matching/filter-count${query ? `?${query}` : ""}`)
        .then((res) => {
          const value = res?.data?.data?.count;
          if (id === countRequest.current && Number.isFinite(value)) {
            setCount(value);
          }
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const update = (patch) => setDraft((prev) => ({ ...prev, ...patch }));
  const toggleIn = (key, value) =>
    setDraft((prev) => {
      const list = prev[key] || [];
      return {
        ...prev,
        [key]: list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value],
      };
    });
  const nicheOptions = nichesForIndustries(draft.industries);
  // deselecting an industry drops its niches
  const toggleIndustry = (value) =>
    setDraft((prev) => {
      const industries = prev.industries.includes(value)
        ? prev.industries.filter((v) => v !== value)
        : [...prev.industries, value];
      const allowed = nichesForIndustries(industries);
      return {
        ...prev,
        industries,
        niches: prev.niches.filter((n) => allowed.includes(n)),
      };
    });
  // at least one of Individuals / Companies stays on
  const setLookingFor = (key, value) =>
    setDraft((prev) => {
      const other = key === "individuals" ? "companies" : "individuals";
      if (!value && !prev[other]) return prev;
      return { ...prev, [key]: value };
    });

  const onMapPress = () => {
    if (!goldAccess) {
      navigation.navigate("Plans");
      return;
    }
    setPlacesVisible(true);
  };

  const onPlaceSelect = (loc) => {
    setPlacesVisible(false);
    const lat = Number(loc?.latitude);
    const lng = Number(loc?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    update({
      mapCenter: {
        lat,
        lng,
        label: loc?.city || loc?.address || "Selected location",
      },
    });
  };

  const onDiscover = () => {
    dispatch(setMatchingFilters(draft));
    navigation.goBack();
  };

  const discoverLabel =
    count === null
      ? "Discover Profiles"
      : `Discover ${count} Profile${count === 1 ? "" : "s"}`;

  return (
    <ScreenWrapper
      translucent
      paddingHorizontal={0}
      paddingBottom={0}
      backgroundColor={PAGE_BG}
    >
      <ScrollView
        scrollEnabled={scrollEnabled}
        style={{ backgroundColor: PAGE_BG }}
        contentContainerStyle={{
          paddingTop: headerHeight + SECTION_GAP,
          paddingBottom: ctaHeight + SECTION_GAP,
          gap: SECTION_GAP,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Select On The Map */}
        <View
          style={[
            styles.section,
            styles.mapSection,
            !goldAccess && { paddingBottom: 12 - ROW12_OVERHANG },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onMapPress}
            style={styles.mapRow}
          >
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="map"
              size={24}
              color={COLORS.white}
            />
            <CustomText
              label={draft.mapCenter?.label || "Select On The Map"}
              fontSize={16}
              fontFamily={fonts.medium}
              letterSpacing={-0.5}
              color={COLORS.white}
              numberOfLines={1}
              containerStyle={styles.flex}
            />
            {draft.mapCenter ? (
              <TouchableOpacity
                hitSlop={8}
                onPress={() => update({ mapCenter: null })}
              >
                <Icons
                  family="MaterialSymbolsRounded"
                  name="close"
                  size={24}
                  color={COLORS.gray64}
                />
              </TouchableOpacity>
            ) : (
              <Icons
                family="MaterialSymbolsRounded"
                name="chevron_right"
                size={24}
                color={COLORS.gray64}
              />
            )}
          </TouchableOpacity>
          {!goldAccess && (
            <InfoRow
              label="Subscribe at least to the Gold plan to access this feature."
              color="#FFCF83"
              style={{ marginTop: 16 - ROW12_OVERHANG }}
            />
          )}
        </View>

        {/* I'm looking for */}
        <View style={[styles.section, styles.sectionTitled]}>
          <SectionTitle label="I’m looking for" />
          {[
            ["individuals", "Individuals"],
            ["companies", "Companies"],
          ].map(([key, label], index) => (
            <View
              key={key}
              style={[
                styles.switchRow,
                { marginTop: index === 0 ? TITLE_TO_CONTENT : 16 },
              ]}
            >
              <CustomText
                label={label}
                fontSize={16}
                fontFamily={fonts.regular}
                letterSpacing={-0.5}
                color={COLORS.gray64}
              />
              <CustomSwitch
                value={draft[key]}
                setValue={(v) => setLookingFor(key, v)}
                bgColor={GOLD}
              />
            </View>
          ))}
        </View>

        <ChipsSection
          title="Interested in"
          options={INTERESTED_IN_OPTIONS}
          selected={draft.interestedIn}
          onToggle={(v) => toggleIn("interestedIn", v)}
        />
        {industries.length > 0 && (
          <ChipsSection
            title="Industry"
            options={industries}
            selected={draft.industries}
            onToggle={toggleIndustry}
            collapsedCount={INDUSTRY_COLLAPSED}
          />
        )}
        {/* Niche is relative to the selected industries (client) */}
        <ChipsSection
          title="Niche"
          options={nicheOptions}
          selected={draft.niches}
          onToggle={(v) => toggleIn("niches", v)}
          collapsedCount={NICHE_COLLAPSED}
          emptyHint="Select an industry to see its niches."
        />

        <RangeSection
          title="Distance range"
          bounds={DISTANCE_BOUNDS}
          values={draft.distance}
          unit="km"
          onChange={(v) => update({ distance: v })}
          width={width - PAD_H * 2}
          onSlideStart={lockScroll}
          onSlideEnd={unlockScroll}
        />
        <RangeSection
          title="Age range"
          bounds={AGE_BOUNDS}
          values={draft.age}
          unit="yrs"
          onChange={(v) => update({ age: v })}
          width={width - PAD_H * 2}
          onSlideStart={lockScroll}
          onSlideEnd={unlockScroll}
        />
      </ScrollView>

      {/* Header: status bar + 56 (pad 8 / 12) */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Figma Header: progressive background blur, content scrolls under */}
        <HeaderProgressiveBlur />
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <GlassFill fill={colors.surfaceAlt} />
              <Icons
                family="MaterialSymbolsRounded"
                name="chevron_left"
                size={20}
                color={COLORS.gray64}
              />
            </TouchableOpacity>
            <View style={styles.titleRow}>
              <CustomText
                label="Filters"
                fontSize={20}
                fontFamily={fonts.semiBold}
                letterSpacing={-0.1}
                color={COLORS.white}
              />
              {activeCount > 0 && (
                <View style={styles.badge}>
                  <CustomText
                    label={String(activeCount)}
                    fontSize={14}
                    fontFamily={fonts.medium}
                    color="#121212"
                  />
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setDraft(DEFAULT_MATCHING_FILTERS)}
            style={styles.resetButton}
          >
            <GlassFill fill="rgba(161, 147, 117, 0.08)" />
            <CustomText
              label="Reset all"
              fontSize={14}
              fontFamily={fonts.medium}
              color={GOLD}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* CTA: pad 12 / 12 / home indicator */}
      <View style={[styles.cta, { paddingBottom: ctaPadBottom }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onDiscover}
          style={styles.ctaButton}
        >
          <CustomText
            label={discoverLabel}
            fontSize={18}
            fontFamily={fonts.medium}
            letterSpacing={-0.2}
            color="#121212"
          />
        </TouchableOpacity>
      </View>

      <CustomModalGooglePlaces
        isVisible={placesVisible}
        onClose={() => setPlacesVisible(false)}
        onLocationSelect={onPlaceSelect}
      />
    </ScreenWrapper>
  );
};

export default MatchingFilters;

const RANGE_LABEL = "rgba(222, 222, 222, 0.6)"; // #DEDEDE @ 60%
// Figma: track 815–819 in the 805 frame, value caps at 835 (16 below)
const RANGE_LABELS_GAP = capGap(16 - (SEEK_FRAME - 14), 0, 12);
// value baseline 843 → info row (12pt frame at 869, text centred)
const RANGE_INFO_GAP = capGap(26, 12, 0) - ROW12_OVERHANG;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  headerRow: {
    height: HEADER_ROW,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PAD_H,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    backgroundColor: SECTION_BG,
    paddingHorizontal: PAD_H,
  },
  sectionTitled: {
    paddingTop: TITLE_PAD_TOP,
    paddingBottom: 16,
  },
  mapSection: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  mapRow: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  switchRow: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 4,
    rowGap: 6,
  },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: COLORS.white,
  },
  // Figma: 26pt pill with a 1px OUTSIDE stroke → 28 drawn, 16 / 16 spacing
  // measured from the 26pt box
  seeMore: {
    alignSelf: "center",
    height: 28,
    marginTop: 15,
    marginBottom: -1,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PAGE_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeSection: {
    paddingTop: TITLE_PAD_TOP,
    paddingBottom: 16 - ROW12_OVERHANG,
  },
  seekFrame: {
    height: SEEK_FRAME,
    justifyContent: "center",
  },
  sliderContainer: {
    height: SEEK_FRAME,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderSelected: {
    backgroundColor: COLORS.white,
  },
  sliderUnselected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  thumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SECTION_BG,
    paddingTop: CTA_PAD_TOP,
    paddingHorizontal: PAD_H,
  },
  ctaButton: {
    height: CTA_HEIGHT,
    borderRadius: 100,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
});
