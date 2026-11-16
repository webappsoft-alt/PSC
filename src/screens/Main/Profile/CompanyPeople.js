import {
  StackActions,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import GlassBackButton from "../../../components/GlassBackButton";
import Icons from "../../../components/Icons";
import ScreenWrapper, {
  ScreenFlatList,
  ScreenHeaderSpacer,
} from "../../../components/ScreenWrapper";
import { SkeletonGroup } from "../../../components/Skeleton";
import TopTab from "../../../components/TopTab";
import { openPagerTab } from "../../../navigation/TabStack";
import { del, get, post } from "../../../services/ApiRequest";
import { ToastMessage } from "../../../utils/ToastMessage";
import { accentA } from "../../../utils/profileTier";
import { SearchPill } from "../Career/molecules/CareerUI";
import {
  PersonRow,
  RowSkeleton,
} from "../SearchScreen/molecules/PeopleSearchList";

const X = (fs) => Math.round(fs * 0.35 * 10) / 10;
const INK = "#121212";
const BAND = "#262626";
const W48 = "rgba(255, 255, 255, 0.48)";
const W64 = "rgba(255, 255, 255, 0.64)";

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

/**
 * Key Individuals "SEE MORE" → everyone on PSC working at this company,
 * grouped by job title (Figma Search-People-From-Company 8361:8743):
 * search pill + close · job-title chips (profile-tab style) · one #121212
 * section per title (16 Medium −0.5 + count · `group` 16) with
 * Search-People person rows (48pt avatars), sections 1px apart.
 */
const CompanyPeople = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, accent = "#37B874" } = route.params || {};
  const me = useSelector((s) => s.users.userData);

  const [groups, setGroups] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState(null); // selected job-title chip
  const [titles, setTitles] = useState([]); // full chip list (unfiltered)
  const [follow, setFollow] = useState({});
  const req = useRef(0);

  const load = useCallback(
    async (mode) => {
      const id = ++req.current;
      if (mode === "refresh") setRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        const r = await get(
          `career/about/${userId}/people?${params.toString()}`,
        );
        if (id !== req.current) return;
        const g = r?.data?.data?.groups || [];
        setGroups(g);
        if (!query.trim()) setTitles(g.map((x) => x.title));
      } catch (e) {
        console.log("company people error", e);
      } finally {
        if (id === req.current) {
          setLoaded(true);
          setRefreshing(false);
        }
      }
    },
    [userId, query],
  );

  useEffect(() => {
    const t = setTimeout(() => load(), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

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

  const visible = title ? groups.filter((g) => g.title === title) : groups;

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      scrollEnabled={false}
      headerBlur
      headerUnScrollable={() => (
        <View style={styles.header}>
          <View style={styles.fieldRow}>
            <View style={styles.grow}>
              <SearchPill
                value={query}
                onChangeText={setQuery}
                placeholder="Search for people or job titles..."
                height={40}
                iconSize={20}
                fontSize={14}
                letterSpacing={-0.28}
                placeholderColor={W64}
                paddingHorizontal={10}
                gap={4}
              />
            </View>
            <GlassBackButton
              icon="close"
              iconSize={20}
              color={W64}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Close"
            />
          </View>
          {titles.length > 0 && (
            <TopTab
              rounded
              oval
              tab={title == null ? null : titles.indexOf(title)}
              setTab={(i) =>
                setTitle(
                  i == null || i === -1 || titles[i] === title
                    ? null
                    : titles[i],
                )
              }
              tabNames={titles}
              marginTop={0}
              marginBottom={0}
              height={32}
              paddingHorizontal={12}
              borderWidth={1}
              borderColor={accentA(accent, 0.04)}
              activeBorderColor="transparent"
              activeColor={accentA(accent, 0.08)}
              ovalBg={accentA(accent, 0)}
              textColor={accentA(accent, 1)}
              textFontSize={14}
              textLetterSpacing={-0.5}
            />
          )}
        </View>
      )}
    >
      <ScreenFlatList
        data={loaded ? visible : []}
        keyExtractor={(g) => g.title}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <View style={styles.groupHead}>
              <T
                fs={16}
                ls={-0.5}
                ff={fonts.medium}
                label={item.title}
                numberOfLines={1}
                containerStyle={styles.grow}
              />
              <View style={styles.count}>
                <T
                  fs={14}
                  ls={-0.07}
                  ff={fonts.medium}
                  color={W64}
                  label={compact(item.count)}
                />
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="group"
                  size={16}
                  color={W64}
                />
              </View>
            </View>
            <View style={styles.rows}>
              {item.users.map((u) => (
                <PersonRow
                  key={u._id}
                  user={u}
                  avatarSize={48}
                  companyLayout
                  following={isFollowing(u)}
                  onToggle={() => toggle(u)}
                  onPress={() => open(u)}
                />
              ))}
            </View>
          </View>
        )}
        ListHeaderComponent={<ScreenHeaderSpacer />}
        ItemSeparatorComponent={() => <View style={styles.band} />}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="group"
                size={80}
                color={W48}
              />
              <CustomText
                label="No PSC Members"
                fontSize={32}
                fontFamily={fonts.BoldItalic}
                fontStyle="italic"
                color="#FFFFFF"
                marginTop={12}
                textAlign="center"
              />
              <CustomText
                label={
                  query || title
                    ? "No one matches your search."
                    : "No one on PSC works at this company yet."
                }
                fontFamily={fonts.medium}
                color={W48}
                textAlign="center"
              />
            </View>
          ) : (
            <SkeletonGroup>
              <View style={styles.section}>
                <View style={styles.rows}>
                  <RowSkeleton avatarSize={48} />
                  <RowSkeleton avatarSize={48} />
                  <RowSkeleton avatarSize={48} />
                  <RowSkeleton avatarSize={48} />
                </View>
              </View>
            </SkeletonGroup>
          )
        }
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load("refresh")}
            tintColor="#FFFFFF"
          />
        }
      />
    </ScreenWrapper>
  );
};

export default CompanyPeople;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  header: { paddingTop: 8, paddingHorizontal: 12, paddingBottom: 12, gap: 12 },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 40 },
  listContent: { flexGrow: 1, backgroundColor: INK },
  // Figma 8361:8743: #121212 sections (padding 12, gap 12) 1px apart
  section: { backgroundColor: INK, padding: 12, gap: 12 },
  band: { height: 1, backgroundColor: BAND },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  count: { flexDirection: "row", alignItems: "center", gap: 4 },
  rows: { gap: 8 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: 320,
  },
});
