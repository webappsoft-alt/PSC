import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import LogoAvatar, { LOGO_INSET, isLogoAvatar } from "../../../../components/LogoAvatar";
import { ProfileHeaderBackground, ProfileNameBadge } from "./ProfileHeader";

const X = (fs) => fs * 0.35; // CustomText line box 1.4×fs → cap box
const INK = "#121212";
const W4 = "rgba(255, 255, 255, 0.04)";
const W64 = "rgba(255, 255, 255, 0.64)";
const MSF = "MaterialSymbolsRoundedFilled";

// Figma's exact vectors (Material Icons Round, 24 box unless noted)
const FIG = {
  Posts:
    "M3 21H20C20.55 21 21 20.55 21 20V19C21 18.45 20.55 18 20 18H3C2.45 18 2 18.45 2 19V20C2 20.55 2.45 21 3 21ZM20 8H3C2.45 8 2 8.45 2 9V15C2 15.55 2.45 16 3 16H20C20.55 16 21 15.55 21 15V9C21 8.45 20.55 8 20 8ZM2 4V5C2 5.55 2.45 6 3 6H20C20.55 6 21 5.55 21 5V4C21 3.45 20.55 3 20 3H3C2.45 3 2 3.45 2 4Z",
  Reposts:
    "M6.99996 7H17V8.79C17 9.24 17.54 9.46 17.85 9.14L20.64 6.35C20.84 6.15 20.84 5.84 20.64 5.64L17.85 2.85C17.54 2.54 17 2.76 17 3.21V5H5.99996C5.44996 5 4.99996 5.45 4.99996 6V10C4.99996 10.55 5.44996 11 5.99996 11C6.54996 11 6.99996 10.55 6.99996 10V7ZM17 17H6.99996V15.21C6.99996 14.76 6.45996 14.54 6.14996 14.86L3.35996 17.65C3.15996 17.85 3.15996 18.16 3.35996 18.36L6.14996 21.15C6.45996 21.46 6.99996 21.24 6.99996 20.79V19H18C18.55 19 19 18.55 19 18V14C19 13.45 18.55 13 18 13C17.45 13 17 13.45 17 14V17Z",
  Mentions:
    "M12.7201 2.03001C6.63007 1.60001 1.60007 6.63001 2.03007 12.72C2.39007 18.01 7.01007 22 12.3101 22H16.0001C16.5501 22 17.0001 21.55 17.0001 21C17.0001 20.45 16.5501 20 16.0001 20H12.3301C8.60007 20 5.18007 17.58 4.25007 13.97C2.76007 8.17001 8.16007 2.76001 13.9601 4.26001C17.5801 5.18001 20.0001 8.60001 20.0001 12.33V13.43C20.0001 14.22 19.2901 15 18.5001 15C17.7101 15 17.0001 14.22 17.0001 13.43V12.18C17.0001 9.67001 15.2201 7.41001 12.7401 7.06001C9.34007 6.57001 6.47007 9.51001 7.08007 12.93C7.42007 14.84 8.91007 16.42 10.8001 16.87C12.6401 17.3 14.3901 16.71 15.5401 15.54C16.4301 16.76 18.2101 17.4 19.8401 16.75C21.1801 16.22 22.0001 14.85 22.0001 13.41V12.32C22.0001 7.01001 18.0101 2.39001 12.7201 2.03001ZM12.0001 15C10.3401 15 9.00007 13.66 9.00007 12C9.00007 10.34 10.3401 9.00001 12.0001 9.00001C13.6601 9.00001 15.0001 10.34 15.0001 12C15.0001 13.66 13.6601 15 12.0001 15Z",
  Media:
    "M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.9 13.98L11 16.51L14.1 12.52C14.3 12.26 14.7 12.26 14.9 12.53L18.41 17.21C18.66 17.54 18.42 18.01 18.01 18.01H6.02C5.6 18.01 5.37 17.53 5.63 17.2L8.12 14C8.31 13.74 8.69 13.73 8.9 13.98Z",
  Audio:
    "M9.22 7H4.78C4.3 6.47 4 5.77 4 5C4 3.34 5.34 2 7 2C8.66 2 10 3.34 10 5C10 5.77 9.7 6.47 9.22 7ZM16.24 2.01C18.32 2.13 20 4.08 20 6.16V21C20 21.55 19.55 22 19 22C18.45 22 18 21.55 18 21V6.09C18 5.13 17.36 4.23 16.42 4.04C15.14 3.78 14 4.76 14 6V17.84C14 19.92 12.32 21.87 10.24 21.99C7.92 22.13 6 20.29 6 18H5.45C5.19 18 4.98 17.81 4.95 17.55L4.11 9.1C4.05 8.51 4.51 8 5.1 8H8.9C9.49 8 9.95 8.51 9.9 9.1L9.05 17.55C9.02 17.81 8.8 18 8.55 18H8C8 19.24 9.14 20.22 10.42 19.96C11.36 19.77 12 18.87 12 17.91V6C12 3.71 13.92 1.87 16.24 2.01Z",
  Shorts:
    "M14 5C14 3.9 13.1 3 12 3H11V2C11 1.45 10.55 1 10 1H6C5.45 1 5 1.45 5 2V3H4C2.9 3 2 3.9 2 5V20C2 21.1 2.9 22 4 22H12C13.1 22 14 21.1 14 20H20C21.1 20 22 19.1 22 18V7C22 5.9 21.1 5 20 5H14ZM12 18H10V16H12V18ZM12 9H10V7H12V9ZM16 18H14V16H16V18ZM16 9H14V7H16V9ZM20 18H18V16H20V18ZM20 9H18V7H20V9Z",
  // 20 box
  sort: "M7.20836 2.79166L4.88336 5.11666C4.61669 5.375 4.80003 5.825 5.17503 5.825H6.66669V10.8333C6.66669 11.2917 7.04169 11.6667 7.50003 11.6667C7.95836 11.6667 8.33336 11.2917 8.33336 10.8333V5.825H9.82503C10.2 5.825 10.3834 5.375 10.1167 5.11666L7.79169 2.79166C7.63336 2.63333 7.36669 2.63333 7.20836 2.79166ZM13.3334 14.175V9.16666C13.3334 8.70833 12.9584 8.33333 12.5 8.33333C12.0417 8.33333 11.6667 8.70833 11.6667 9.16666V14.175H10.175C9.80003 14.175 9.61669 14.625 9.88336 14.8833L12.2084 17.2C12.375 17.3583 12.6334 17.3583 12.8 17.2L15.125 14.8833C15.3917 14.625 15.2 14.175 14.8334 14.175H13.3334Z",
  // 16 box
  plus: "M11.9999 8.66665H8.66659V12C8.66659 12.3666 8.36659 12.6666 7.99992 12.6666C7.63325 12.6666 7.33325 12.3666 7.33325 12V8.66665H3.99992C3.63325 8.66665 3.33325 8.36665 3.33325 7.99998C3.33325 7.63331 3.63325 7.33331 3.99992 7.33331H7.33325V3.99998C7.33325 3.63331 7.63325 3.33331 7.99992 3.33331C8.36659 3.33331 8.66659 3.63331 8.66659 3.99998V7.33331H11.9999C12.3666 7.33331 12.6666 7.63331 12.6666 7.99998C12.6666 8.36665 12.3666 8.66665 11.9999 8.66665Z",
};
// app tabs with no Figma icon → the matching Material Symbol (filled)
const SYMBOL = { Career: "work", Replies: "forum", Liked: "favorite", Saved: "bookmark", About: "info", Jobs: "work", Events: "event" };

const Glyph = ({ d, box = 24, color = "#FFFFFF" }) => (
  <Svg width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
    <Path d={d} fill={color} />
  </Svg>
);

export const TabIcon = ({ name, color = "#FFFFFF" }) =>
  FIG[name] ? <Glyph d={FIG[name]} color={color} /> : <Icons family={MSF} name={SYMBOL[name] || "circle"} size={24} color={color} />;

const T = ({ fs, ls = 0, ff = fonts.regular, color = "#FFFFFF", ...rest }) => (
  <CustomText fontSize={fs} letterSpacing={ls} fontFamily={ff} color={color} marginTop={-X(fs)} marginBottom={-X(fs)} {...rest} />
);

const Avatar = ({ user }) => {
  const size = 32;
  const uri = user?.profile?.avatar;
  if (!uri) return <View style={[styles.avatar, { backgroundColor: user?.profile?.profileColor || W4 }]} />;
  if (isLogoAvatar(user)) {
    const inner = Math.round(size * (1 - 2 * LOGO_INSET));
    return (
      <LogoAvatar size={size}>
        <ImageFast source={{ uri }} style={{ width: inner, height: inner }} resizeMode="contain" />
      </LogoAvatar>
    );
  }
  return <ImageFast source={{ uri }} style={styles.avatar} />;
};

/** Figma sort row (44): sort 20 + "Most Recent" Medium 14 · layout toggle 24.
 *  Also shown above the post list, like the Media tab's "Most Recent" row. */
export const ProfileSortRow = ({ sortKey = "recent", onSort, layout = "list", onLayoutToggle }) => (
  <View style={styles.sortRow}>
    <TouchableOpacity activeOpacity={0.7} onPress={onSort} style={styles.sortBtn} accessibilityLabel="Sort posts">
      <Glyph d={FIG.sort} box={20} />
      <T fs={14} ls={-0.07} ff={fonts.medium} label={sortKey === "popular" ? "Most Popular" : "Most Recent"} />
    </TouchableOpacity>
    <TouchableOpacity activeOpacity={0.7} onPress={onLayoutToggle} accessibilityLabel={layout === "grid" ? "List view" : "Grid view"}>
      {layout === "grid" ? <Icons family={MSF} name="grid_view" size={24} color="#FFFFFF" /> : <Glyph d={FIG.Posts} />}
    </TouchableOpacity>
  </View>
);

/** Icon tab bar: equal cells; the active white-4% tile springs between them. */
const IconTabs = ({ tabNames, tab, onTab, style }) => {
  const [w, setW] = useState(0);
  const pos = useRef(new Animated.Value(tab)).current;
  useEffect(() => {
    Animated.spring(pos, { toValue: tab, useNativeDriver: true, damping: 20, stiffness: 260, mass: 0.8 }).start();
  }, [tab, pos]);
  const n = Math.max(1, tabNames.length);
  const cell = w / n;
  return (
    <Animated.View style={[styles.tabs, style]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabIndicator,
            {
              width: cell,
              transform: [
                { translateX: pos.interpolate({ inputRange: [0, Math.max(1, n - 1)], outputRange: [0, cell * Math.max(1, n - 1)] }) },
              ],
            },
          ]}
        />
      )}
      {tabNames.map((t, i) => (
        <TouchableOpacity key={t} activeOpacity={0.7} onPress={() => onTab?.(i)} accessibilityLabel={t} style={styles.tabCell}>
          <TabIcon name={t} />
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

/** Tab content entrance: a short fade + 8pt rise (re-keyed per tab). */
export const TabFade = ({ children }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
      {children}
    </Animated.View>
  );
};

/**
 * Figma Profile › "Header-When-Scrolling-Instagram-Inspired" (3751:4621):
 * shown once the profile's tabs reach the top. Top bar (cover + tier
 * gradient, padding 52/12/12, 38 row): 32 avatar · name Medium 14 −0.5% +
 * badge / username Regular 14 white 64% (gap 6) · white Follow pill 32 r12.
 * Icon tab bar 44 (equal cells, active white 4%). Sort row 44: sort 20 +
 * "Most Recent" Medium 14 · layout toggle 24. Frame #121212, shadow 0/8/16.
 * `anim` (useCompactProfileHeader) links every piece to the scroll.
 */
const ProfileCompactHeader = ({
  user,
  isOwn,
  anim,
  interactive,
  tabNames = [],
  tab,
  onTab,
  followText,
  onFollowPress,
  showSort,
  sortKey = "recent",
  onSort,
  layout = "list",
  onLayoutToggle,
}) => {
  const insets = useSafeAreaInsets();
  if (!anim) return null;
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || "";
  const isFollow = followText === "Follow";
  return (
    <View pointerEvents={interactive ? "box-none" : "none"} style={styles.frame}>
      {/* frame + top bar background (cover + tier gradient), one fade */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.frameBg, { opacity: anim.bg }]} />
      <View style={[styles.topBar, { paddingTop: insets.top > 0 ? insets.top + 8 : 52 }]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: anim.bg }]}>
          <ProfileHeaderBackground user={user} isUser={isOwn} coverImage={user?.profile?.hideCover === false ? null : user?.profile?.cover} />
        </Animated.View>
        <Animated.View style={[styles.identity, { opacity: anim.identityOpacity, transform: [{ translateY: anim.identityY }] }]}>
          <Avatar user={user} />
          <View style={styles.nameCol}>
            <View style={styles.nameRow}>
              <T fs={14} ls={-0.07} ff={fonts.medium} label={name} numberOfLines={1} containerStyle={styles.shrink} />
              <View style={styles.badges}>
                <ProfileNameBadge user={user} />
              </View>
            </View>
            {!!user?.username && <T fs={14} ls={-0.07} color={W64} label={user.username} numberOfLines={1} />}
          </View>
        </Animated.View>
        {!isOwn && !!onFollowPress && (
          <Animated.View style={{ opacity: anim.followOpacity, transform: [{ scale: anim.followScale }] }}>
            <TouchableOpacity activeOpacity={0.8} onPress={onFollowPress} style={[styles.follow, !isFollow && styles.followPlain]}>
              {isFollow && <Glyph d={FIG.plus} box={16} color={INK} />}
              <T fs={14} ls={-0.07} ff={fonts.medium} color={INK} label={followText} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* icon tabs */}
      <IconTabs tabNames={tabNames} tab={tab} onTab={onTab} style={{ opacity: anim.tabsOpacity, transform: [{ translateY: anim.tabsY }] }} />

      {/* sort + layout */}
      {showSort && (
        <Animated.View style={{ opacity: anim.sortOpacity, transform: [{ translateY: anim.sortY }] }}>
          <ProfileSortRow sortKey={sortKey} onSort={onSort} layout={layout} onLayoutToggle={onLayoutToggle} />
        </Animated.View>
      )}
    </View>
  );
};

export default ProfileCompactHeader;

const styles = StyleSheet.create({
  frame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // above ScreenWrapper's floating header container (zIndex 999): the
    // flattened view tree stacks them together
    zIndex: 1000,
    elevation: 1000,
  },
  frameBg: {
    backgroundColor: INK,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 8, // Figma blur 16 = 2 × iOS radius
  },
  shrink: { flexShrink: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    minHeight: 38,
    overflow: "hidden",
  },
  identity: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, height: 38 },
  avatar: { width: 32, height: 32, borderRadius: 100, overflow: "hidden" },
  nameCol: { flexShrink: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, minHeight: 14 },
  badges: { flexDirection: "row", alignItems: "center", gap: 2, height: 14 },
  follow: {
    height: 32,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 10,
    paddingRight: 12,
  },
  followPlain: { paddingLeft: 12 },
  tabs: { flexDirection: "row", height: 44 },
  tabCell: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabIndicator: { position: "absolute", top: 0, bottom: 0, left: 0, backgroundColor: W4 },
  sortRow: {
    height: 44,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
});
