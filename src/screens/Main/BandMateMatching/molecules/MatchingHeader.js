import { useNavigation } from "@react-navigation/native";
import { Image, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ProgressiveBlur from "../../../../components/ProgressiveBlur";
import { COLORS } from "../../../../utils/COLORS";
import {
  GlassFill,
  HEADER_PAD_BOTTOM,
  HEADER_PAD_H,
  HEADER_ROW_HEIGHT,
  HEADER_TOP_GAP,
  TOGGLE_HEIGHT,
  capGap,
} from "./matchLayout";

/**
 * Figma › Matching › New-Home "Header" (375 × 104) + "Toggle".
 * Row (40): avatar 32 · 12 · greeting (17 / 12, 8 apart) … bell · 8 · filter
 * (40 circles, white 4% + blur 16, 24 icons white 48%).
 * Toggle (hug, 40): pad 4 · gap 4 · r100 · white 4% + blur 16; chips 32 tall,
 * padding 16, active white 12% + Medium 14 white, idle Regular 14 white 64%.
 */
const AVATAR_SIZE = 32;
const CIRCLE_SIZE = 40;
const ICON_COLOR = "rgba(255, 255, 255, 0.48)";
const GREETING_SIZE = 17;
const SUBTITLE_SIZE = 12;
// greeting trimmed boxes sit 8 apart (12 + 8 + 8 = 28)
const GREETING_GAP = capGap(8, GREETING_SIZE, SUBTITLE_SIZE);
// the 1.4 line boxes add 5.95 above the greeting cap and 4.2 under the
// subtitle baseline — lift the centred column by half the difference so the
// glyphs (not the boxes) are centred like Figma
const GREETING_CENTER_FIX =
  GREETING_SIZE * 0.353 - SUBTITLE_SIZE * 0.35;

const CircleButton = ({ name, onPress, children }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={styles.circle}
  >
    <GlassFill />
    <Icons
      family="MaterialSymbolsRounded"
      name={name}
      size={24}
      color={ICON_COLOR}
    />
    {children}
  </TouchableOpacity>
);

const MatchingHeader = ({
  tab,
  setTab,
  tabNames = [],
  onFilterPress,
  onNotificationPress,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userData } = useSelector((state) => state.users);
  const { notificationDot } = useSelector((state) => state.notification);

  const openProfile = () =>
    navigation.navigate("UserProfile", { userId: userData?._id });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingTop: insets.top + HEADER_TOP_GAP }]}
    >
      {/* Figma: progressive background blur 16 → 0 over the 104pt header */}
      {Platform.OS === "ios" && (
        <ProgressiveBlur
          pointerEvents="none"
          direction="top"
          tint="ultraThinMaterialDark"
          intensity={16}
          height={insets.top + HEADER_TOP_GAP + HEADER_ROW_HEIGHT + HEADER_PAD_BOTTOM}
          borderRadius={0}
          style={styles.headerBlur}
        />
      )}

      <View style={styles.row} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openProfile}
          style={styles.profile}
        >
          {userData?.profile?.avatar ? (
            <Image
              source={{ uri: userData.profile.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    userData?.profile?.profileColor || COLORS.gray48,
                },
              ]}
            />
          )}
          <View style={styles.greeting}>
            <CustomText
              label={`Hi ${userData?.firstName || ""} 👋`}
              fontSize={GREETING_SIZE}
              fontFamily={fonts.medium}
              letterSpacing={-0.5}
              color={COLORS.white}
              numberOfLines={1}
            />
            <CustomText
              label="Hope you had a great day!"
              fontSize={SUBTITLE_SIZE}
              fontFamily={fonts.medium}
              letterSpacing={-0.5}
              color={COLORS.gray64}
              marginTop={GREETING_GAP}
              numberOfLines={1}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <CircleButton
            name="notifications_active"
            onPress={onNotificationPress}
          >
            {notificationDot && <View style={styles.dot} />}
          </CircleButton>
          <CircleButton name="filter_list" onPress={onFilterPress} />
        </View>
      </View>

      {/* For You / Nearby */}
      <View style={styles.toggle}>
        <GlassFill />
        {tabNames.map((name) => {
          const active = tab === name;
          return (
            <TouchableOpacity
              key={name}
              activeOpacity={0.7}
              onPress={() => setTab?.(name)}
              style={styles.chip}
            >
              {active && (
                <GlassFill fill="rgba(255, 255, 255, 0.12)" />
              )}
              <CustomText
                label={name}
                fontSize={14}
                fontFamily={active ? fonts.medium : fonts.regular}
                color={active ? COLORS.white : COLORS.gray64}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default MatchingHeader;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  row: {
    height: HEADER_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HEADER_PAD_H,
    marginBottom: HEADER_PAD_BOTTOM,
  },
  profile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  greeting: {
    flexShrink: 1,
    marginBottom: GREETING_CENTER_FIX, // shifts the centred column up by half
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.red1,
  },
  toggle: {
    alignSelf: "center",
    height: TOGGLE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    gap: 4,
    borderRadius: 100,
  },
  chip: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
