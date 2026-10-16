import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";

/**
 * Figma `Home-Feed` header (375×170 @ 44pt status bar):
 * paddingTop 48 (status bar 44 + 4) · row gap 4 · paddingH 8 · paddingBottom 6
 * Row 1 (36): search · 📍 location ⌄ · bell / inbox
 * Row 2 (40): Feed (SemiBoldItalic 32) + Shorts — hides on scroll (Pinterest-style)
 * Row 3 (32): topic chips — For You (white pill) · + · TECHNOLOGY · …
 */

export const FEED_HEADER_TOP_GAP = 4;
export const FEED_HEADER_ROW1_HEIGHT = 36;
export const FEED_HEADER_ROW2_HEIGHT = 40;
export const FEED_HEADER_CHIPS_HEIGHT = 32;
export const FEED_HEADER_ROW_GAP = 4;
export const FEED_HEADER_BOTTOM_PAD = 6;

/** Height below the status-bar inset (overlay already pads insets.top). */
export const FEED_HEADER_CONTENT_HEIGHT =
  FEED_HEADER_TOP_GAP +
  FEED_HEADER_ROW1_HEIGHT +
  FEED_HEADER_ROW_GAP +
  FEED_HEADER_ROW2_HEIGHT +
  FEED_HEADER_ROW_GAP +
  FEED_HEADER_CHIPS_HEIGHT +
  FEED_HEADER_BOTTOM_PAD; // 4+36+4+40+4+32+6 = 126 → 44 (status bar) + 126 = Figma's 170

// Figma reference: paddingTop 48 = 44pt status bar + 4 → use real inset + 4 on device.
export const feedHeaderHeight = (topInset = 44) =>
  Math.max(topInset, 44) + FEED_HEADER_CONTENT_HEIGHT;

const CIRCLE_BTN_SIZE = 36;

const US_STATE_ABBR = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY", "District of Columbia": "DC",
};

const IconCircle = ({ name, size = 20, onPress, style, filled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        {
          height: CIRCLE_BTN_SIZE,
          width: CIRCLE_BTN_SIZE,
          borderRadius: 99,
          backgroundColor: colors.surfaceAlt,
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
    >
      <Icons
        family={filled ? "MaterialSymbolsRoundedFilled" : "MaterialSymbolsRounded"}
        name={name}
        size={size}
        color={COLORS.white}
      />
    </TouchableOpacity>
  );
};

const Dot = ({ top = 2, right = 2 }) => (
  <View
    style={{
      position: "absolute",
      top,
      right,
      height: 8,
      width: 8,
      borderRadius: 99,
      backgroundColor: COLORS.red1,
      zIndex: 2,
    }}
  />
);

const FeedHeader = ({
  isShort,
  isLive,
  pagerProgress,
  onSetPage,
  tab,
  setTab,
  tabNames = [],
  feedRowAnim,
  onLocationPress,
  onAddTopicPress,
  onFilterPress,
}) => {
  const navigation = useNavigation();
  const { colors, themeMode } = useTheme();
  const { notificationDot } = useSelector((state) => state.notification);
  const location = useSelector((state) => state.users.location);

  // Figma: "Los Angeles, CA" — city + short region
  const region =
    US_STATE_ABBR[location?.state] ||
    (location?.countryCode === "US"
      ? location?.state
      : location?.countryCode || location?.state || location?.country);
  const locationLabel = location?.city
    ? `${location.city}${region ? `, ${region}` : ""}`
    : "Set location";

  // Feed / Shorts color cross-fade while swiping pages
  const feedColor = pagerProgress
    ? pagerProgress.interpolate({
        inputRange: [1, 2],
        outputRange: [COLORS.white, COLORS.gray48],
        extrapolate: "clamp",
      })
    : isShort || isLive
    ? COLORS.gray48
    : COLORS.white;

  const shortsColor = pagerProgress
    ? pagerProgress.interpolate({
        inputRange: [1, 2, 3],
        outputRange: [COLORS.gray48, COLORS.white, COLORS.gray48],
        extrapolate: "clamp",
      })
    : isShort
    ? COLORS.white
    : COLORS.gray48;

  const homeIconsOpacity = pagerProgress
    ? pagerProgress.interpolate({
        inputRange: [1, 1.2, 2],
        outputRange: [1, 0, 0],
        extrapolate: "clamp",
      })
    : isShort || isLive
    ? 0
    : 1;

  const shortsIconsOpacity = pagerProgress
    ? pagerProgress.interpolate({
        inputRange: [1, 1.8, 2],
        outputRange: [0, 0, 1],
        extrapolate: "clamp",
      })
    : isShort || isLive
    ? 1
    : 0;

  // Row 2 (Feed / Shorts) fades out AND collapses on scroll down so the topic
  // chips slide up into its space; fades/expands back on scroll up.
  const row2Opacity = feedRowAnim || 1;
  const row2Height = feedRowAnim
    ? feedRowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, FEED_HEADER_ROW2_HEIGHT + FEED_HEADER_ROW_GAP],
      })
    : FEED_HEADER_ROW2_HEIGHT + FEED_HEADER_ROW_GAP;
  const [row2Hidden, setRow2Hidden] = useState(false);
  useEffect(() => {
    if (!feedRowAnim) return undefined;
    const id = feedRowAnim.addListener(({ value }) => setRow2Hidden(value < 0.05));
    return () => feedRowAnim.removeListener(id);
  }, [feedRowAnim]);

  const handleFeedPress = () => {
    if (onSetPage) onSetPage(1);
  };
  const handleShortsPress = () => {
    if (onSetPage) onSetPage(2);
  };

  const isTopicActive = (index) => tab === index;

  return (
    <View style={styles.container}>
      {/* ───────── Row 1: search · location · bell / inbox ───────── */}
      <View style={styles.row1}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("SearchScreen")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icons
            family="MaterialSymbolsRounded"
            name="search"
            size={26}
            color={COLORS.white}
          />
        </TouchableOpacity>

        {/* Location pill — centered in the free space between the icons */}
        <View style={styles.locationWrap}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.locationBtn}
            onPress={onLocationPress}
            disabled={!onLocationPress}
          >
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="location_on"
              size={17}
              color="#007BFF"
            />
            <CustomText
              label={locationLabel}
              fontSize={20}
              lineHeight={24}
              fontFamily={fonts.semiBold}
              color={COLORS.white}
              letterSpacing={-1.2}
              marginLeft={4}
              numberOfLines={1}
              containerStyle={{ flexShrink: 1 }}
            />
            <Icons
              family="MaterialSymbolsRounded"
              name="keyboard_arrow_down"
              size={18}
              color={COLORS.gray64}
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.row1Right}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Notification")}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Icons
              family="MaterialSymbolsRounded"
              name="notifications_active"
              size={24}
              color={COLORS.white}
            />
            {notificationDot && <Dot top={-1} right={-1} />}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Chat")}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Icons
              family="MaterialSymbolsRounded"
              name="inbox"
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ───────── Row 2: Feed / Shorts — collapses on scroll ───────── */}
      <Animated.View
        style={[
          styles.row2Wrap,
          { opacity: row2Opacity, height: row2Height },
        ]}
        pointerEvents={row2Hidden ? "none" : "auto"}
      >
        <View style={styles.row2}>
          <View style={styles.row}>
            <TouchableOpacity onPress={handleFeedPress} activeOpacity={0.7}>
              <Animated.Text
                style={{
                  fontSize: 32,
                  lineHeight: 38,
                  letterSpacing: -1.9,
                  fontFamily: fonts.semiBoldItalic,
                  fontStyle: "italic",
                  color: feedColor,
                  includeFontPadding: false,
                }}
              >
                Feed
              </Animated.Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShortsPress} activeOpacity={0.7}>
              <Animated.Text
                style={{
                  fontSize: 18,
                  letterSpacing: -0.7,
                  fontFamily: fonts.semiBoldItalic,
                  fontStyle: "italic",
                  color: shortsColor,
                  marginLeft: 8,
                  includeFontPadding: false,
                }}
              >
                Shorts
              </Animated.Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row2Right}>
            {/* Home-state buttons: globe + filters */}
            <Animated.View
              style={[
                styles.row,
                {
                  gap: 8,
                  position: "absolute",
                  right: 0,
                  opacity: homeIconsOpacity,
                },
              ]}
              pointerEvents={isShort || isLive ? "none" : "auto"}
            >
              <IconCircle name="language" size={20} onPress={() => {}} />
              <IconCircle name="tune" size={20} onPress={onFilterPress} />
            </Animated.View>

            {/* Shorts-state button: camera */}
            <Animated.View
              style={{
                position: "absolute",
                right: 0,
                opacity: shortsIconsOpacity,
              }}
              pointerEvents={isShort || isLive ? "auto" : "none"}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate("CameraScreen")}
                activeOpacity={0.7}
              >
                <Icons
                  family="MaterialSymbolsRounded"
                  name="photo_camera"
                  size={24}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      {/* ───────── Row 3: topic chips ───────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.chipsContent}
      >
        {/* For You */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setTab && setTab(null)}
          style={[
            styles.forYouChip,
            {
              backgroundColor: tab === null ? COLORS.white : colors.surfaceAlt,
            },
          ]}
        >
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="explore"
            size={18}
            color={tab === null ? "#121212" : COLORS.gray64}
          />
          <CustomText
            label="For You"
            fontSize={14}
            lineHeight={18}
            fontFamily={fonts.BoldItalic}
            fontStyle="italic"
            letterSpacing={-0.56}
            color={tab === null ? "#121212" : COLORS.gray64}
            marginLeft={4}
          />
        </TouchableOpacity>

        {/* + add topic */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAddTopicPress}
          disabled={!onAddTopicPress}
          style={[styles.plusChip, { backgroundColor: colors.surfaceAlt }]}
        >
          <Icons
            family="MaterialSymbolsRounded"
            name="add"
            size={18}
            color={COLORS.white}
          />
        </TouchableOpacity>

        {tabNames.map((name, index) => {
          const active = isTopicActive(index);
          return (
            <TouchableOpacity
              key={name}
              activeOpacity={0.7}
              onPress={() => setTab && setTab(active ? null : index)}
              style={[
                styles.topicChip,
                {
                  backgroundColor: active ? COLORS.white : colors.surfaceAlt,
                },
              ]}
            >
              <CustomText
                label={name.toUpperCase()}
                fontSize={14}
                lineHeight={18}
                fontFamily={fonts.BoldItalic}
                fontStyle="italic"
                letterSpacing={-0.56}
                color={active ? "#121212" : COLORS.gray64}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default FeedHeader;

const styles = StyleSheet.create({
  container: {
    paddingTop: FEED_HEADER_TOP_GAP,
    paddingBottom: FEED_HEADER_BOTTOM_PAD,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  row1: {
    height: FEED_HEADER_ROW1_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: FEED_HEADER_ROW_GAP,
  },
  locationWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },
  row1Right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  row2Wrap: {
    overflow: "hidden",
  },
  row2: {
    height: FEED_HEADER_ROW2_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 12,
    paddingRight: 8,
  },
  row2Right: {
    width: 90,
    height: CIRCLE_BTN_SIZE + 4,
    justifyContent: "center",
  },
  chipsContent: {
    gap: 4,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  forYouChip: {
    height: FEED_HEADER_CHIPS_HEIGHT,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
    paddingRight: 10,
  },
  plusChip: {
    height: FEED_HEADER_CHIPS_HEIGHT,
    width: FEED_HEADER_CHIPS_HEIGHT,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  topicChip: {
    height: FEED_HEADER_CHIPS_HEIGHT,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
});
