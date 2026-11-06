import { StackActions, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper, { ScreenFlatList, ScreenHeaderSpacer } from "../../../components/ScreenWrapper";
import { get, post } from "../../../services/ApiRequest";
import { LETTER_RANGES, formatCompact } from "../../../utils/career";
import { ToastMessage } from "../../../utils/ToastMessage";
import { GlassFill } from "../BandMateMatching/molecules/matchLayout";
import { CompanyRowsSkeleton } from "../Jobs/molecules/JobSkeletons";
import {
  CloseCircle,
  Dot,
  HEADER_TOP_GAP,
  INK,
  LogoBox,
  MSF,
  Radio,
  SearchPill,
  Separator,
  WHITE_4,
  WHITE_48,
  WHITE_64,
  WHITE_8,
  X,
} from "./molecules/CareerUI";

const PAGE = 30;

/**
 * Figma Matching › "Select-Company" (8038:11802) — also the school picker
 * ("Select-Education" 8038:11963, same rows: "London, UK • 1.4k Studied
 * there"). Header 144: padding 56/12/8, gap 8 — search pill 40 + close 40,
 * letter chips row (gap 3, 32 r8 white 4%, Bold Italic 14 −4% uppercase
 * white 64%). Rows 65 padding 16 gap 8: 32 logo · name Medium 16 −0.5 ·
 * subtitle Medium 14 −0.5 white 48% • 3 dot • `group` 16 + "1.4k working"
 * Medium 10 · radio 24 (gold when selected).
 */
const SelectCompany = ({ route }) => {
  const navigation = useNavigation();
  const kind = route?.params?.kind === "school" ? "school" : "company";
  const returnTo = route?.params?.returnTo || "AddExperience";
  const paramKey = route?.params?.paramKey || "pickedCompany";
  const [selected, setSelected] = useState(route?.params?.value || null);
  const userData = useSelector((state) => state.users.userData);
  const currentIds = (userData?.experiences || [])
    .filter((e) => e.current)
    .map((e) => String(e.company?._id || e.company));

  const [query, setQuery] = useState("");
  const [range, setRange] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // the key of the rows on screen — a new chip / topic / filter / search
  // shows the skeleton at once (no old rows, no "No …" flash, no debounce gap)
  const [loadedKey, setLoadedKey] = useState(null);
  const reqRef = useRef(0);

  const load = useCallback(
    async (nextPage = 1) => {
      const id = ++reqRef.current;
      try {
        setLoading(true);
        // new search / letter → skeleton instead of the old rows
        if (nextPage === 1) setItems([]);
        const params = new URLSearchParams({ kind, page: String(nextPage), limit: String(PAGE) });
        if (query.trim()) params.set("q", query.trim());
        if (range) params.set("range", range);
        const res = await get(`career/companies?${params.toString()}`);
        if (id !== reqRef.current) return;
        if (res?.data?.success) {
          const data = res.data.data;
          setItems((prev) => (nextPage === 1 ? data.items : [...prev, ...data.items]));
          setTotal(data.total);
          setPage(nextPage);
        }
      } catch (e) {
        console.log("companies load error", e);
      } finally {
        // even a failed request settles the key (shows empty state, not a stuck skeleton)
        if (id === reqRef.current && nextPage === 1) setLoadedKey(`${query.trim()}|${range}`);
        if (id === reqRef.current) setLoading(false);
      }
    },
    [kind, query, range],
  );

  useEffect(() => {
    const t = setTimeout(() => load(1), 250);
    return () => clearTimeout(t);
  }, [load]);

  const pick = (company) => {
    setSelected(company._id);
    navigation.dispatch(StackActions.popTo(returnTo, { [paramKey]: company }, { merge: true }));
  };

  // not in the directory yet (typed name, or a company people already have
  // on their profile) → create the directory entry, then pick it
  const addNew = async (item) => {
    try {
      const res = await post("career/companies", {
        name: (item?.name || query).trim(),
        kind,
        // PSC company account → the directory entry links to it (logo, industry, city)
        pscUser: item?.pscUser,
        logo: item?.logo,
        category: item?.source === "account" ? item?.category : undefined,
        city: item?.address?.city,
        country: item?.address?.country,
      });
      if (res?.data?.success) pick(res.data.data);
      else ToastMessage(res?.data?.message || "Could not add it", "error");
    } catch (e) {
      console.log("add company error", e?.response?.data || e?.message);
      ToastMessage(e?.response?.data?.message || `Could not add it (${e?.response?.status || "network"})`, "error");
    }
  };

  const term = query.trim();
  const exact = items.some((c) => (c.name || "").toLowerCase() === term.toLowerCase());
  const showAdd = !!term && !loading && !exact && loadedKey === `${query.trim()}|${range}`;

  const renderItem = ({ item }) => {
    const isSelected = String(item._id) === String(selected);
    const count = kind === "school" ? item.studiedCount : item.workingCount;
    const sub = item.category || item.legalForm || item.address?.city || (kind === "school" ? "School" : "Company");
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => (item._id ? pick(item) : addNew(item))} style={styles.row}>
        <LogoBox uri={item.logo} name={item.name} size={32} radius={0} icon={kind === "school" ? "school" : "domain"} />
        <View style={styles.rowColumn}>
          <CustomText
            label={item.name}
            fontSize={16}
            letterSpacing={-0.5}
            fontFamily={fonts.medium}
            color="#FFFFFF"
            numberOfLines={1}
            marginTop={-X(16)}
            marginBottom={-X(16)}
          />
          <View style={styles.subRow}>
            <CustomText
              label={sub}
              fontSize={14}
              letterSpacing={-0.5}
              fontFamily={fonts.medium}
              color={WHITE_48}
              numberOfLines={1}
              marginTop={-X(14)}
              marginBottom={-X(14)}
              containerStyle={styles.shrink}
            />
            {!!count && (
              <>
                <Dot />
                <Icons family={MSF} name={kind === "school" ? "school" : "group"} size={16} color={WHITE_48} />
                <CustomText
                  label={`${formatCompact(count)} ${kind === "school" ? "Studied there" : "working"}`}
                  fontSize={10}
                  fontFamily={fonts.medium}
                  color={WHITE_48}
                  marginTop={-X(10)}
                  marginBottom={-X(10)}
                />
              </>
            )}
          </View>
        </View>
        {currentIds.includes(String(item._id)) && (
          <CustomText label="Currently here" fontSize={14} fontFamily={fonts.medium} color={WHITE_64} />
        )}
        <Radio selected={isSelected} />
      </TouchableOpacity>
    );
  };

  const stale = loadedKey !== `${query.trim()}|${range}`;
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
              placeholder={kind === "school" ? "Search a school..." : "Search a business..."}
              autoFocus
            />
            <CloseCircle onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.letters}>
            {LETTER_RANGES.map((r) => {
              const active = range === r;
              return (
                <TouchableOpacity
                  key={r}
                  activeOpacity={0.7}
                  onPress={() => setRange(active ? null : r)}
                  style={[styles.letterChip, active && { backgroundColor: WHITE_8 }]}
                >
                  {!active && <GlassFill borderRadius={8} />}
                  <CustomText
                    label={r}
                    fontSize={14}
                    letterSpacing={-0.56}
                    fontFamily={fonts.BoldItalic}
                    textTransform="uppercase"
                    color={active ? "#FFFFFF" : WHITE_64}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    >
      <ScreenFlatList
        data={stale ? [] : items}
        keyExtractor={(item) => String(item._id || item.pscUser || `typed:${item.nameLower || item.name}`)}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <>
            <ScreenHeaderSpacer />
            {showAdd && (
              <>
                <TouchableOpacity activeOpacity={0.7} onPress={() => addNew()} style={styles.row}>
                  <View style={styles.addBox}>
                    <Icons family={MSF} name="add" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.rowColumn}>
                    <CustomText
                      label={`Add "${term}"`}
                      fontSize={16}
                      letterSpacing={-0.5}
                      fontFamily={fonts.medium}
                      color="#FFFFFF"
                      numberOfLines={1}
                      marginTop={-X(16)}
                      marginBottom={-X(16)}
                    />
                    <CustomText
                      label={kind === "school" ? "Not in the directory yet" : "Not in the directory yet"}
                      fontSize={14}
                      letterSpacing={-0.5}
                      fontFamily={fonts.medium}
                      color={WHITE_48}
                      marginTop={-X(14)}
                      marginBottom={-X(14)}
                    />
                  </View>
                </TouchableOpacity>
                <Separator />
              </>
            )}
          </>
        }
        ListFooterComponent={
          loading && items.length ? (
            <ActivityIndicator color={WHITE_48} style={styles.loader} />
          ) : (
            <View style={styles.loader} />
          )
        }
        ListEmptyComponent={
          loading || stale ? (
            <CompanyRowsSkeleton />
          ) : (
            <View style={styles.empty}>
              <CustomText
                label={term ? "No results" : kind === "school" ? "No schools yet" : "No companies yet"}
                fontSize={14}
                fontFamily={fonts.medium}
                color={WHITE_48}
              />
            </View>
          )
        }
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

export default SelectCompany;

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  header: {
    paddingTop: HEADER_TOP_GAP + 4,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  letters: { flexDirection: "row", gap: 3 },
  letterChip: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  row: {
    height: 65,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowColumn: { flex: 1, gap: 6 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  addBox: { width: 32, height: 32, backgroundColor: WHITE_4, alignItems: "center", justifyContent: "center" },
  loader: { height: 120, paddingTop: 16 },
  empty: { paddingTop: 40, alignItems: "center" },
});
