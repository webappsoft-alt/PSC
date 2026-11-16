import { StackActions, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import LogoAvatar, { isLogoAvatar } from "../../../../components/LogoAvatar";
import {
  ScreenFlatList,
  ScreenHeaderSpacer,
  useScreenHeaderInset,
} from "../../../../components/ScreenWrapper";
import { Bone, SkeletonGroup } from "../../../../components/Skeleton";
import UserBadge from "../../../../components/UserBadge";
import { openPagerTab } from "../../../../navigation/TabStack";
import { del, get, post } from "../../../../services/ApiRequest";
import { ToastMessage } from "../../../../utils/ToastMessage";
import { TAB_NAMES } from "./PostTab";
import TopicChips from "./TopicChips";

const X = (fs) => Math.round(fs * 0.35 * 10) / 10;
const INK = "#121212";
const W4 = "rgba(255, 255, 255, 0.04)";
const W64 = "rgba(255, 255, 255, 0.64)";
const MS = "MaterialSymbolsRounded";
const PAGE = 20;

const T = ({ fs, ls = 0, ff = fonts.regular, color = "#FFFFFF", ...rest }) => (
  <CustomText
    fontSize={fs}
    letterSpacing={ls}
    fontFamily={ff}
    color={color}
    marginTop={-X(fs)}
    marginBottom={-X(fs)}
    {...rest}
  />
);
const compact = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n || 0);
const initials = (u) =>
  `${(u?.firstName || "")[0] || ""}${
    (u?.lastName || "")[0] || ""
  }`.toUpperCase() || (u?.username || "?")[0].toUpperCase();

/**
 * Figma Search-People row (3738:5445): 56 round avatar · 12 · column gap 6 —
 * name Medium 14 −0.07 + badge 14 + username pill (16, white 4%, Regular 10
 * white 64%) · job Regular 12 −0.06 white 64% • in-common N + `group` 12 ·
 * topics Regular 10 −0.05 white 64% split by 2pt dots — · 40 circle white 4%
 * with `add` 20 (follow) / `check` (following).
 */
/**
 * `companyLayout` = Figma Search-People-From-Company row (8361:8743): line 2
 * `location_on` 10 + city · 3pt dot · job (Regular 12 −0.24), line 3
 * in-common N + `group` 10 · 2pt dots · topics.
 */
export const PersonRow = ({
  user,
  following,
  onToggle,
  onPress,
  avatarSize = 56,
  companyLayout = false,
}) => {
  const av = { width: avatarSize, height: avatarSize };
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
  const topics = (user.industry || []).slice(0, 3);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.row}>
      <View style={styles.rowMain}>
        {user.profile?.avatar && isLogoAvatar(user) ? (
          <LogoAvatar uri={user.profile.avatar} size={avatarSize} />
        ) : user.profile?.avatar ? (
          <ImageFast
            source={{ uri: user.profile.avatar }}
            style={[styles.avatar, av]}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              av,
              styles.center,
              { backgroundColor: user.profile?.profileColor || W4 },
            ]}
          >
            <CustomText
              label={initials(user)}
              fontSize={Math.round(avatarSize * 0.36)}
              fontFamily={fonts.semiBold}
              color="#FFFFFF"
            />
          </View>
        )}
        <View style={styles.column}>
          <View style={styles.nameRow}>
            <View style={styles.nameWrap}>
              <T
                fs={14}
                ls={-0.07}
                ff={fonts.medium}
                label={name}
                numberOfLines={1}
                containerStyle={styles.shrink}
              />
              <UserBadge user={user} size={14} showUnverified={false} />
            </View>
            {!!user.username && (
              <View style={styles.userPill}>
                <T
                  fs={10}
                  color={W64}
                  label={user.username}
                  numberOfLines={1}
                />
              </View>
            )}
          </View>
          {companyLayout ? (
            <>
              <View style={styles.inline}>
                {!!user.location?.city && (
                  <View style={styles.iconText}>
                    <Icons
                      family="MaterialSymbolsRoundedFilled"
                      name="location_on"
                      size={10}
                      color={W64}
                    />
                    <T
                      fs={12}
                      ls={-0.24}
                      color={W64}
                      label={user.location.city}
                      numberOfLines={1}
                    />
                  </View>
                )}
                {!!user.location?.city && !!user.occupation?.jobTitle && (
                  <View style={styles.dot3} />
                )}
                {!!user.occupation?.jobTitle && (
                  <T
                    fs={12}
                    ls={-0.24}
                    color={W64}
                    label={user.occupation.jobTitle}
                    numberOfLines={1}
                    containerStyle={styles.shrink}
                  />
                )}
              </View>
              {(user.inCommonCount > 0 || topics.length > 0) && (
                <View style={styles.topics}>
                  {user.inCommonCount > 0 && (
                    <View style={styles.iconText}>
                      <T
                        fs={10}
                        ls={-0.05}
                        color={W64}
                        label={String(user.inCommonCount)}
                      />
                      <Icons
                        family="MaterialSymbolsRoundedFilled"
                        name="group"
                        size={10}
                        color={W64}
                      />
                    </View>
                  )}
                  {topics.map((t, i) => (
                    <View key={t} style={styles.topic}>
                      {(i > 0 || user.inCommonCount > 0) && (
                        <View style={[styles.dot2, styles.dot2Lead]} />
                      )}
                      <T fs={10} ls={-0.05} color={W64} label={t} />
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            (!!user.occupation?.jobTitle || user.inCommonCount > 0) && (
              <View style={styles.inline}>
                {!!user.occupation?.jobTitle && (
                  <T
                    fs={12}
                    ls={-0.06}
                    color={W64}
                    label={user.occupation.jobTitle}
                    numberOfLines={1}
                    containerStyle={styles.shrink}
                  />
                )}
                {!!user.occupation?.jobTitle && user.inCommonCount > 0 && (
                  <View style={styles.dot4} />
                )}
                {user.inCommonCount > 0 && (
                  <View style={styles.common}>
                    <T fs={12} color={W64} label={String(user.inCommonCount)} />
                    <Icons
                      family="MaterialSymbolsRoundedFilled"
                      name="group"
                      size={12}
                      color={W64}
                    />
                  </View>
                )}
              </View>
            )
          )}
          {!companyLayout && topics.length > 0 && (
            <View style={styles.topics}>
              {topics.map((t, i) => (
                <View key={t} style={styles.topic}>
                  {i > 0 && <View style={styles.dot2} />}
                  <T fs={10} ls={-0.05} color={W64} label={t} />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        hitSlop={6}
        style={styles.follow}
      >
        <Icons
          family={"MaterialSymbolsRoundedFilled"}
          name={following ? "how_to_reg" : "add"}
          size={20}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export const RowSkeleton = ({ avatarSize = 56 }) => (
  <View style={styles.row}>
    <View style={styles.rowMain}>
      <Bone width={avatarSize} height={avatarSize} radius={100} />
      <View style={styles.column}>
        <Bone width={150} height={10} />
        <Bone width={100} height={8} />
        <Bone width={130} height={7} />
      </View>
    </View>
    <Bone width={40} height={40} radius={100} />
  </View>
);

/**
 * Search › People results — Figma Search-People (2276:954): sort bar (48,
 * padding 8/12: "Recent" chip 32 r100 white 4% `sort` 16 + Medium 14 ·
 * total Medium 14 −0.07 white 64% + `group` 20) · list (padding 16/12, rows
 * 8 apart split by 1pt white 4%). Data: GET relationships/search-people.
 */
const PeopleSearchList = ({ query, topic, onTopic, isActive }) => {
  const navigation = useNavigation();
  const headerInset = useScreenHeaderInset();
  const me = useSelector((s) => s.users.userData);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadedKey, setLoadedKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [follow, setFollow] = useState({});
  const req = useRef(0);
  const key = `${query}|${topic || ""}`;

  const load = useCallback(
    async (next = 1, mode) => {
      const id = ++req.current;
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query || "",
          page: String(next),
          limit: String(PAGE),
        });
        if (topic) params.set("topic", topic);
        const r = await get(`relationships/search-people?${params.toString()}`);
        if (id !== req.current) return;
        const d = r?.data?.data || {};
        setItems((prev) =>
          next === 1 ? d.items || [] : [...prev, ...(d.items || [])],
        );
        setTotal(d.total || 0);
        setPage(next);
      } catch (e) {
        console.log("search people error", e);
      } finally {
        if (id === req.current) {
          if (next === 1) setLoadedKey(`${query}|${topic || ""}`);
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [query, topic],
  );

  // debounce typing; a new query / topic shows the skeleton at once
  useEffect(() => {
    if (!isActive) return undefined;
    const t = setTimeout(() => load(1), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, isActive, query]);

  const isFollowing = (u) =>
    follow[u._id] !== undefined ? follow[u._id] : !!u.isFollowing;
  const toggle = async (u) => {
    const now = !isFollowing(u);
    setFollow((f) => ({ ...f, [u._id]: now }));
    try {
      if (now) {
        const res = await post(`relationships/follow/${u._id}`);
        ToastMessage(
          res?.data?.message ||
            `You are now following ${u.firstName || u.username}`,
          "success",
        );
      } else {
        await del(`relationships/unfollow/${u._id}`);
        ToastMessage(`Unfollowed ${u.firstName || u.username}`);
      }
    } catch (e) {
      setFollow((f) => ({ ...f, [u._id]: !now }));
    }
  };

  const open = (u) => {
    if (u._id === me?._id) {
      navigation.dispatch(StackActions.popTo("TabStack"));
      openPagerTab("Profile");
      return;
    }
    navigation.navigate("UserProfile", { userId: u._id });
  };

  const stale = loadedKey !== key;
  const data = stale ? [] : items;

  return (
    <ScreenFlatList
      data={data}
      keyExtractor={(u) => String(u._id)}
      ListHeaderComponent={
        <>
          <ScreenHeaderSpacer />
          {/* client: the category tabs are the same as the Home feed's chips */}
          <View style={styles.topicsRow}>
            <TopicChips topics={TAB_NAMES} value={topic} onChange={onTopic} />
          </View>
          <View style={styles.sortBar}>
            <View style={styles.sortChip}>
              <Icons family={MS} name="sort" size={16} color="#FFFFFF" />
              <T fs={14} ff={fonts.medium} label="Recent" />
            </View>
            <View style={styles.count}>
              <T
                fs={14}
                ls={-0.07}
                ff={fonts.medium}
                color={W64}
                label={compact(total)}
              />
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="group"
                size={20}
                color="#FFFFFF"
              />
            </View>
          </View>
          <View style={styles.band} />
          {/* Figma 2276:954: the list frame starts with 16pt top padding */}
          <View style={styles.listTop} />
        </>
      }
      contentContainerStyle={styles.listContent}
      renderItem={({ item, index }) => (
        <View style={styles.cell}>
          {index > 0 && <View style={styles.rule} />}
          <PersonRow
            user={item}
            following={isFollowing(item)}
            onToggle={() => toggle(item)}
            onPress={() => open(item)}
          />
        </View>
      )}
      ListEmptyComponent={
        loading || stale ? (
          <SkeletonGroup>
            <View style={styles.cell}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i}>
                  {i > 0 && <View style={styles.rule} />}
                  <RowSkeleton />
                </View>
              ))}
            </View>
          </SkeletonGroup>
        ) : (
          <View style={styles.empty}>
            <CustomText
              label="No people found"
              fontFamily={fonts.medium}
              color={W64}
            />
          </View>
        )
      }
      ListFooterComponent={
        loading && items.length && !stale ? (
          <ActivityIndicator color={W64} style={styles.footer} />
        ) : (
          <View style={styles.footer} />
        )
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (!loading && !stale && items.length < total) load(page + 1);
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          progressViewOffset={headerInset}
          onRefresh={() => load(1, "refresh")}
          tintColor={W64}
        />
      }
      style={styles.list}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
};

export default PeopleSearchList;

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  list: { backgroundColor: "#262626" },
  listContent: { flexGrow: 1, backgroundColor: INK },
  topicsRow: { paddingTop: 4, paddingBottom: 12, backgroundColor: INK },
  sortBar: {
    height: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: INK,
  },
  sortChip: {
    height: 32,
    borderRadius: 100,
    backgroundColor: W4,
    paddingLeft: 8,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  count: { flexDirection: "row", alignItems: "center", gap: 4 },
  band: { height: 1, backgroundColor: "#262626" },
  listTop: { height: 16, backgroundColor: INK },
  cell: { paddingHorizontal: 12, backgroundColor: INK },
  rule: { height: 1, backgroundColor: W4, marginVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 100, overflow: "hidden" },
  column: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  nameWrap: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  userPill: {
    height: 16,
    borderRadius: 100,
    backgroundColor: W4,
    paddingHorizontal: 4,
    justifyContent: "center",
    maxWidth: 110,
  },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot4: { width: 4, height: 4, borderRadius: 100, backgroundColor: W64 },
  common: { flexDirection: "row", alignItems: "center", gap: 4 },
  topics: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  topic: { flexDirection: "row", alignItems: "center", gap: 2, marginRight: 2 },
  dot2: { width: 2, height: 2, borderRadius: 100, backgroundColor: W64 },
  dot2Lead: { marginLeft: 2 },
  dot3: { width: 3, height: 3, borderRadius: 100, backgroundColor: W64 },
  iconText: { flexDirection: "row", alignItems: "center", gap: 2 },
  follow: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: W4,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { height: 40, paddingTop: 12 },
  empty: { paddingVertical: 60, alignItems: "center" },
});
