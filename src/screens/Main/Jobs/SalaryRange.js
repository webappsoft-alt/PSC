import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import { setJobFilters } from "../../../store/reducer/MatchingSlice";
import { SALARY_BOUNDS, SALARY_STEP, formatMoney, resolveJobFilters } from "../../../utils/career";
import { GlassFill } from "../BandMateMatching/molecules/matchLayout";
import { CareerHeader, GOLD, INK, SHEET_BG, WHITE_64, WHITE_8, X } from "../Career/molecules/CareerUI";

const PAD = 12;
const THUMB = 28;

/** Figma value box 171.5 × 56 r12 white 4% padding 12, column gap 10: label Regular 12 white 64% (8) · value Medium 16 white (11) */
const ValueBox = ({ label, value }) => (
  <View style={styles.box}>
    <GlassFill borderRadius={12} />
    <CustomText
      label={label}
      fontSize={12}
      color={WHITE_64}
      numberOfLines={1}
      marginTop={(8 - 12 * 1.4) / 2}
      marginBottom={(8 - 12 * 1.4) / 2}
    />
    <CustomText
      label={value}
      fontSize={16}
      fontFamily={fonts.medium}
      color="#FFFFFF"
      numberOfLines={1}
      marginTop={(11 - 16 * 1.4) / 2}
      marginBottom={(11 - 16 * 1.4) / 2}
    />
  </View>
);

/**
 * Figma Matching/Jobs › "Salary-Range" (8265:4755). Page #262626; header
 * #121212 100 (back + "Salary Range" SemiBold 20 −0.5%); 1pt gap; section
 * #121212 padding 12, gap 16: "Range" Medium 18 −0.5%, Minimum / Maximum
 * boxes (gap 8), slider 28 tall — track 4 r100 white 8%, selected #A19375,
 * 28 thumbs #D9D9D9; 1pt gap; footer #121212 padding 12/12/34: "Reset" 48
 * r100 white 4% Medium 18.
 */
const SalaryRange = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const saved = useSelector((state) => state.matching?.jobFilters);
  const [range, setRange] = useState(() => resolveJobFilters(saved).salary || SALARY_BOUNDS);

  const commit = (v) => {
    const any = v[0] <= SALARY_BOUNDS[0] && v[1] >= SALARY_BOUNDS[1];
    dispatch(setJobFilters({ salary: any ? null : v }));
  };

  return (
    <View style={styles.page}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <CareerHeader title="Salary Range" />
      </View>

      <View style={styles.section}>
        <CustomText
          label="Range"
          fontSize={18}
          letterSpacing={-0.09}
          fontFamily={fonts.medium}
          color="#FFFFFF"
          marginTop={-X(18)}
          marginBottom={-X(18)}
        />
        <View style={styles.boxes}>
          <ValueBox label="Minimum" value={formatMoney(range[0])} />
          <ValueBox label="Maximum" value={formatMoney(range[1])} />
        </View>
        <View style={styles.slider}>
          {/* Figma track spans the full 351; the thumbs travel inside it */}
          <View style={styles.trackBg} />
          <MultiSlider
            values={range}
            min={SALARY_BOUNDS[0]}
            max={SALARY_BOUNDS[1]}
            step={SALARY_STEP}
            sliderLength={width - PAD * 2 - THUMB}
            onValuesChange={setRange}
            onValuesChangeFinish={(v) => {
              setRange(v);
              commit(v);
            }}
            allowOverlap={false}
            minMarkerOverlapDistance={THUMB}
            containerStyle={styles.sliderContainer}
            trackStyle={styles.track}
            selectedStyle={styles.selected}
            unselectedStyle={styles.unselected}
            customMarker={() => <View style={styles.thumb} />}
            touchDimensions={{ height: 48, width: 48, borderRadius: 24, slipDisplacement: 200 }}
          />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.reset}
          onPress={() => {
            setRange(SALARY_BOUNDS);
            commit(SALARY_BOUNDS);
          }}
        >
          <GlassFill borderRadius={100} />
          <CustomText label="Reset" fontSize={18} fontFamily={fonts.medium} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SalaryRange;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: SHEET_BG, gap: 1 },
  header: { backgroundColor: INK },
  section: { flex: 1, backgroundColor: INK, padding: PAD, gap: 16 },
  boxes: { flexDirection: "row", gap: 8 },
  box: { flex: 1, height: 56, borderRadius: 12, padding: 12, gap: 10, overflow: "hidden" },
  // thumbs are 28 wide: the track runs between their centres, so the slider
  // is inset by half a thumb on each side and the thumbs reach the edges
  slider: { height: THUMB, paddingHorizontal: THUMB / 2, justifyContent: "center" },
  sliderContainer: { height: THUMB },
  track: { height: 4, borderRadius: 100 },
  selected: { backgroundColor: GOLD },
  unselected: { backgroundColor: "transparent" },
  trackBg: { position: "absolute", left: 0, right: 0, top: (THUMB - 4) / 2, height: 4, borderRadius: 100, backgroundColor: WHITE_8 },
  thumb: { width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: "#D9D9D9" },
  footer: { backgroundColor: INK, paddingTop: 12, paddingHorizontal: 12 },
  reset: { height: 48, borderRadius: 100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
