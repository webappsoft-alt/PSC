import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import fonts from "../../../assets/fonts";
import Blur from "../../../components/Blur";
import CustomText from "../../../components/CustomText";
import GlassBackButton from "../../../components/GlassBackButton";
import ScreenWrapper from "../../../components/ScreenWrapper";
import Icons from "../../../components/Icons";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  POLITICAL_CRITERIA,
  POLITICAL_MAP_INTRO,
  POLITICAL_NOTICE,
  POLITICAL_ORIENTATIONS,
  POLITICAL_SCOPE_NOTE,
  getOrientation,
} from "../../../utils/political";

const MS = "MaterialSymbolsRounded";
const MSF = "MaterialSymbolsRoundedFilled";

// RN line boxes are 1.4 × fontSize; Figma trims text boxes to the cap height
// (≈0.7 × fontSize), so 0.35 × fontSize per side comes out of each gap.
const X = (fs) => Math.round(fs * 0.35 * 10) / 10;

/**
 * Figma "Political-Information" (5 variants, one per label).
 * Frame: #121212, V gap 32, padding 116 / 8 / 50 / 8 (header 100 + 16).
 * Header 375×100: linear gradient label colour → #121212, row padding 52/12/8/12,
 * back 40 circle (white 4%) · title SemiBold 20 −0.5% centred · 40 spacer.
 */
const OrientationTiles = ({ selected, onSelect }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.tiles, { backgroundColor: colors.surface }]}>
      {POLITICAL_ORIENTATIONS.map((o) => {
        const active = o.value === selected;
        return (
          <TouchableOpacity
            key={o.key}
            activeOpacity={0.8}
            disabled={!onSelect}
            onPress={() => onSelect?.(o.value)}
            style={[styles.tile, active && { backgroundColor: "#FFFFFF" }]}
          >
            {/* Figma: the active Center dot turns #121212 @64 on the white tile */}
            <View style={[styles.dot, { backgroundColor: active && o.activeDot ? o.activeDot : o.dot }]} />
            <CustomText
              label={o.tileLabel}
              fontSize={12}
              letterSpacing={-0.12}
              fontFamily={fonts.medium}
              textAlign={"center"}
              color={
                active
                  ? "#121212"
                  : o.value === 0 || o.value === 1
                  ? "rgba(255, 255, 255, 0.48)"
                  : "rgba(160, 160, 160, 1)"
              }
              containerStyle={styles.tileLabel}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export { OrientationTiles };

const PoliticalInformation = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  // the profile's own orientation — shown, never picked (client: the tiles
  // are not tappable; the label comes from the user's PSC activity)
  // `value: null` = not enough PSC activity yet → "Insufficient Data"
  // (client weighting doc §3): no tile is active, criteria show a dash
  const insufficient = route?.params?.value === null;
  const value = insufficient ? null : route?.params?.value ?? 2;
  const userId = route?.params?.userId;
  const myId = useSelector((st) => st.users.userData?._id);
  // history is private: only the owner sees the button (API is owner-only)
  const isMine = !!userId && String(userId) === String(myId);
  const orientation = useMemo(() => {
    const base = getOrientation(value) || POLITICAL_ORIENTATIONS[2];
    if (!insufficient) return base;
    return {
      ...base,
      label: "Insufficient Data",
      overview:
        "PSC needs more political activity from you before it can define your orientation. Your posts, comments, responses and votes on political posts all count, each with its own weight.",
      positions: base.positions.map(() => "—"),
    };
  }, [value, insufficient]);

  const text64 = "rgba(255, 255, 255, 0.64)";
  // Figma header: status area + 40 row + 8 (insets fall back to the Figma 52)
  const headerHeight = (insets.top > 0 ? insets.top + 8 : 60) + 40 + 8;

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      scrollEnabled
      translucent
      headerBlur
      headerUnScrollable={() => (
        <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 60, height: headerHeight }]}>
          {/* orientation tint over the shared frosted blur — gradient to
              transparent so the blur shows through (client: never a solid) */}
          <LinearGradient
            colors={[orientation.headerColor, "rgba(18, 18, 18, 0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <GlassBackButton onPress={() => navigation.goBack()} />
          <CustomText
            label={orientation.label}
            fontSize={20}
            letterSpacing={-0.1}
            fontFamily={fonts.semiBold}
            color={colors.text}
            textAlign={"center"}
            containerStyle={styles.grow}
          />
          {/* Figma: 40 glass circle with `history` → Interaction History */}
          {isMine ? (
            <GlassBackButton
            icon="history"
            onPress={() => navigation.navigate("InteractionHistory", { userId })}
            accessibilityLabel="Interaction history"
          />
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      )}
    >
      <View style={[styles.content, { paddingTop: 16 - X(24) }]}>
        {/* Political Map */}
        <View style={styles.section16}>
          <CustomText
            label="Political Map"
            fontSize={24}
            letterSpacing={-0.48}
            fontFamily={fonts.semiBold}
            color={colors.text}
          />
          <CustomText
            label={POLITICAL_MAP_INTRO}
            fontSize={14}
            letterSpacing={-0.28}
            color={text64}
            marginTop={-X(24) - X(14)}
          />
        </View>

        <OrientationTiles selected={value} />

        {/* Overview */}
        <View style={styles.section12}>
          <CustomText label="Overview" fontSize={16} fontFamily={fonts.medium} color={colors.text} />
          <CustomText
            label={orientation.overview}
            fontSize={14}
            letterSpacing={-0.28}
            color={text64}
            marginTop={-X(16) - X(14)}
          />
        </View>

        {/* The 10 key criteria */}
        <View style={styles.section12}>
          <CustomText
            label="The 10 key criteria"
            fontSize={18}
            fontFamily={fonts.semiBold}
            color={colors.text}
          />
          <View style={[styles.readRow, { marginTop: -X(18) - X(12) }]}>
            <CustomText
              label="Read below about this system"
              fontSize={12}
              fontFamily={fonts.light}
              textDecorationLine="underline" // Figma: underlined
              color={text64}
            />
            <Icons family={MS} name="info" size={12} color={text64} />
          </View>
        </View>

        <View style={styles.criteria}>
          {POLITICAL_CRITERIA.map((c, i) => (
            <View key={c.key}>
              {i > 0 && <View style={styles.separator} />}
              <View style={styles.criterionRow}>
                <Icons family={MSF} name={c.icon} size={20} color={colors.text} />
                <CustomText
                  label={c.label}
                  fontSize={14}
                  fontFamily={fonts.medium}
                  color={colors.text}
                />
                <CustomText
                  label={orientation.positions[i]}
                  fontSize={14}
                  fontFamily={fonts.light}
                  color={text64}
                  textAlign={"right"}
                  containerStyle={styles.grow}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Important Notice */}
        <View style={[styles.notice, { backgroundColor: colors.surface }]}>
          <Blur blurType={isDark ? "dark" : "xlight"} borderRadius={12} />
          <View style={styles.noticeTitle}>
            <Icons family={MSF} name="info" size={16} color="rgba(255, 255, 255, 0.48)" />
            <CustomText
              label="Important Notice"
              fontSize={16}
              fontFamily={fonts.medium}
              color={colors.text}
            />
          </View>
          <CustomText
            label={`${POLITICAL_NOTICE}\n\n${POLITICAL_SCOPE_NOTE}`}
            fontSize={12}
            fontFamily={fonts.light}
            color={text64}
            marginTop={12 - X(16) - X(12)}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default PoliticalInformation;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  content: {
    paddingHorizontal: 8,
    paddingBottom: 50,
    gap: 32,
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  section16: { gap: 16 },
  section12: { gap: 12 },
  readRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  tiles: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    borderRadius: 12,
  },
  tile: {
    flex: 1,
    height: 73,
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 12 - X(12),
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  tileLabel: {
    alignSelf: "stretch",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 100,
  },
  criteria: {
    gap: 16 - 2 * X(14),
  },
  criterionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    marginBottom: 16 - 2 * X(14),
  },
  notice: {
    padding: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  noticeTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
