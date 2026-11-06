import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import GlassBackButton from "../../../components/GlassBackButton";
import Icons from "../../../components/Icons";
import ScreenWrapper, { ScreenFlatList, ScreenHeaderSpacer } from "../../../components/ScreenWrapper";
import { get, post, put } from "../../../services/ApiRequest";
import { getProfile } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import { SkillRowsSkeleton } from "../Jobs/molecules/JobSkeletons";
import { GOLD, HEADER_TOP_GAP, INK, MS, MSF, SHEET_BG, SearchPill, Separator, WHITE_16, WHITE_48, WHITE_64, X } from "./molecules/CareerUI";

const MAX_SKILLS = 50;
const PAGE = 40;

/** Figma row: 64 tall, padding 16, gap 12 — Medium 16 −2% · 24 circle (white 16% / filled #A19375 check) */
const SkillRow = ({ label, selected, onPress, add }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
    <CustomText
      label={label}
      fontSize={16}
      letterSpacing={-0.32}
      fontFamily={fonts.medium}
      color="#FFFFFF"
      numberOfLines={1}
      marginTop={-X(16)}
      marginBottom={-X(16)}
      containerStyle={styles.grow}
    />
    {add ? (
      <Icons family={MS} name="add_circle" size={24} color={WHITE_64} />
    ) : selected ? (
      <Icons family={MSF} name="check_circle" size={24} color={GOLD} />
    ) : (
      <Icons family={MS} name="circle" size={24} color={WHITE_16} />
    )}
  </TouchableOpacity>
);

/**
 * Figma Profile › "Select-Skills". Header 100 (#121212, padding 52/12/8):
 * search pill 40 (r100 white 4%, padding 10, gap 4, `search` 20 white 64%,
 * Medium 14 placeholder white 48%, filled `cancel` 20 white 48%) · 8 · 40
 * close circle (`close` 20). 1pt gap, then 64pt rows split by 1pt white 4%.
 * Skills come from the community catalogue (client: "make it as the
 * hashtags") — a typed skill that doesn't exist yet can be added for
 * everyone. Picks are saved as you go.
 */
const EditSkills = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [skills, setSkills] = useState(route?.params?.skills || []);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [exact, setExact] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // the key of the rows on screen — a new chip / topic / filter / search
  // shows the skeleton at once (no old rows, no "No …" flash, no debounce gap)
  const [loadedKey, setLoadedKey] = useState(null);
  const reqRef = useRef(0);
  const saveTimer = useRef(null);
  const dirty = useRef(false);
  const latest = useRef(skills);
  latest.current = skills;

  const load = useCallback(
    async (nextPage = 1) => {
      const id = ++reqRef.current;
      try {
        setLoading(true);
        if (nextPage === 1) setItems([]);
        const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE) });
        if (query.trim()) params.set("q", query.trim());
        const res = await get(`career/skills/catalog?${params.toString()}`);
        if (id !== reqRef.current) return;
        if (res?.data?.success) {
          const data = res.data.data;
          setItems((prev) => (nextPage === 1 ? data.items : [...prev, ...data.items]));
          setTotal(data.total);
          setExact(!!data.exact);
          setPage(nextPage);
        }
      } catch (e) {
        console.log("skills catalog error", e);
      } finally {
        // even a failed request settles the key (shows empty state, not a stuck skeleton)
        if (id === reqRef.current && nextPage === 1) setLoadedKey(query.trim());
        if (id === reqRef.current) setLoading(false);
      }
    },
    [query],
  );

  useEffect(() => {
    const t = setTimeout(() => load(1), 250);
    return () => clearTimeout(t);
  }, [load]);

  const persist = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    try {
      await put("career/skills", { skills: latest.current });
      dispatch(getProfile());
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not save your skills", "error");
    }
  }, [dispatch]);

  // save shortly after each pick, and when leaving the screen
  const scheduleSave = () => {
    dirty.current = true;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, 600);
  };
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      persist();
    },
    [persist],
  );

  const isOn = (name) => skills.some((s) => s.toLowerCase() === String(name).toLowerCase());
  const toggle = (name) => {
    if (isOn(name)) setSkills((list) => list.filter((s) => s.toLowerCase() !== name.toLowerCase()));
    else {
      if (skills.length >= MAX_SKILLS) {
        ToastMessage(`You can add up to ${MAX_SKILLS} skills`, "error");
        return;
      }
      setSkills((list) => [...list, name]);
    }
    scheduleSave();
  };

  const term = query.trim();
  const addNew = async () => {
    try {
      const res = await post("career/skills/catalog", { name: term });
      const name = res?.data?.data?.name || term;
      if (!isOn(name)) toggle(name);
      setQuery("");
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not add this skill", "error");
    }
  };

  // picked skills stay on top (when not searching), then the catalogue
  const catalogNames = items.map((i) => i.name);
  const pinned = term ? [] : skills.filter((s) => !catalogNames.some((n) => n.toLowerCase() === s.toLowerCase()));
  const data = [...pinned.map((name) => ({ _id: `mine:${name}`, name })), ...items];
  const showAdd = !!term && !exact && !loading && loadedKey === term;

  const stale = loadedKey !== query.trim();
  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      scrollEnabled={false}
      headerBlur
      backgroundColor={INK}
      headerUnScrollable={() => (
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <SearchPill
              value={query}
              onChangeText={setQuery}
              placeholder="UI/UX..."
              height={40}
              iconSize={20}
              fontSize={14}
              letterSpacing={0}
              paddingHorizontal={10}
              gap={4}
              clearFamily={MSF}
              clearSize={20}
              clearColor={WHITE_48}
            />
            <GlassBackButton icon="close" iconSize={20} color={WHITE_64} accessibilityLabel="Close" onPress={() => navigation.goBack()} />
          </View>
        </View>
      )}
    >
      <ScreenFlatList
        data={stale ? [] : data}
        keyExtractor={(item) => String(item._id || item.name)}
        renderItem={({ item }) => <SkillRow label={item.name} selected={isOn(item.name)} onPress={() => toggle(item.name)} />}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <>
            <ScreenHeaderSpacer />
            {/* Figma: list starts 1pt below the header */}
            <View style={styles.band} />
            {showAdd && (
              <>
                <SkillRow label={`Add “${term}”`} add onPress={addNew} />
                <Separator />
              </>
            )}
          </>
        }
        ListEmptyComponent={
          loading || stale ? (
            <SkillRowsSkeleton />
          ) : !showAdd ? (
            <View style={styles.empty}>
              <CustomText label="No skills yet" fontSize={14} fontFamily={fonts.medium} color={WHITE_48} />
            </View>
          ) : null
        }
        ListFooterComponent={<View style={styles.footer} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!loading && items.length < total) load(page + 1);
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
};

export default EditSkills;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  header: { paddingTop: HEADER_TOP_GAP, paddingHorizontal: 12, paddingBottom: 8 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 40 },
  band: { height: 1, backgroundColor: SHEET_BG },
  row: { height: 64, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  empty: { paddingTop: 40, alignItems: "center" },
  footer: { height: 120 },
});
