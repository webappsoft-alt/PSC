import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import {
  createShow,
  deleteShow,
  fetchMyShows,
} from "../../../services/showApi";
import { emitShowPick, onShowPick } from "../../../utils/showPicks";
import { ToastMessage } from "../../../utils/ToastMessage";
import DeleteShowSheet from "./molecules/DeleteShowSheet";
import NewShowSheet from "./molecules/NewShowSheet";
import { CircleButton, FormHeader, ListRow, Radio } from "./molecules/ShowForm";
import { GlassFill, SHOWS } from "./molecules/showsLayout";

/**
 * Figma Shows › "Select-Show" (7580:13351). Header (status bar + 12) / 12 /
 * 8 / 12, gap 12: back · "Search" (SemiBold 20) · 40 add circle (→ New
 * Show); 44 search pill (r100, white 4%, pad 12, gap 4, 22 search @64%,
 * Medium 14, 22 cancel @48%). #121212 list 1pt below: 64pt rows (pad 16,
 * gap 10): radio · Medium 16 −2% · 24 delete_forever @48% (→ Delete Show).
 */
const EMPTY_DRAFT = {
  showName: "",
  synopsis: "",
  worldLogo: "",
  worldLogoLocal: "",
  visibleTo: "public",
};

const SelectShow = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const selectedId = route?.params?.selectedId;

  const [search, setSearch] = useState("");
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const reopenSheet = useRef(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const requestId = useRef(0);
  const load = useCallback(async (query) => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetchMyShows(query);
      if (id !== requestId.current) return;
      setShows(res?.data?.data?.items || []);
    } catch (e) {
      // a failed request must not look like "no shows"
      if (id === requestId.current) {
        setShows([]);
        ToastMessage(e?.message || "Could not load your shows", "error");
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  // "Visible To" comes back from the option screen → reopen the sheet
  useEffect(
    () =>
      onShowPick((pick) => {
        if (pick?.visibleTo) {
          setDraft((d) => ({ ...d, visibleTo: pick.visibleTo }));
        }
      }),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      if (reopenSheet.current) {
        reopenSheet.current = false;
        const t = setTimeout(() => setSheetVisible(true), 250);
        return () => clearTimeout(t);
      }
      return undefined;
    }, []),
  );

  const pick = (show) => {
    emitShowPick({ show });
    navigation.goBack();
  };

  const openVisibleTo = () => {
    reopenSheet.current = true;
    setSheetVisible(false);
    // let the sheet finish closing before the next screen slides in
    setTimeout(
      () =>
        navigation.navigate("ShowOptionPicker", {
          kind: "visibleTo",
          value: draft.visibleTo,
        }),
      300,
    );
  };

  const confirmNewShow = async () => {
    if (!draft.showName.trim()) return;
    setSaving(true);
    try {
      const res = await createShow({
        showName: draft.showName.trim(),
        synopsis: draft.synopsis.trim(),
        worldLogo: draft.worldLogo || "",
        availableTo: [draft.visibleTo || "public"],
      });
      const show = res?.data?.data;
      if (show?._id) {
        ToastMessage("Show created", "success");
        setSheetVisible(false);
        setDraft(EMPTY_DRAFT);
        // the new show becomes the episode's show
        setTimeout(() => pick(show), 300);
      }
    } catch (e) {
      ToastMessage(e?.message || "Could not create the show", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete?._id) return;
    setDeleting(true);
    try {
      await deleteShow(toDelete._id);
      setShows((list) => list.filter((s) => s._id !== toDelete._id));
      emitShowPick({ removedShowId: toDelete._id });
      ToastMessage("Show deleted", "success");
      setToDelete(null);
    } catch (e) {
      ToastMessage(e?.message || "Could not delete the show", "error");
    } finally {
      setDeleting(false);
    }
  };

  // header: status bar + 12 + 40 + 12 + 44 + 8
  const headerHeight = insets.top + 12 + 40 + 12 + 44 + 8;

  return (
    <View style={styles.page}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: headerHeight + 1,
          paddingBottom: insets.bottom + 24,
          flexGrow: 1,
        }}
      >
        <View style={[styles.list, !shows.length && styles.listEmpty]}>
          {loading && !shows.length ? (
            [0, 1, 2, 3].map((i) => (
              <View key={i}>
                <View style={styles.skeletonRow}>
                  <View style={styles.skeletonRadio} />
                  <View style={styles.skeletonText} />
                </View>
                {i < 3 ? <View style={styles.separator} /> : null}
              </View>
            ))
          ) : shows.length ? (
            shows.map((show, index) => (
              <ListRow
                key={show._id}
                onPress={() => pick(show)}
                last={index === shows.length - 1}
              >
                <Radio checked={show._id === selectedId} />
                <CustomText
                  label={show.showName}
                  fontSize={16}
                  fontFamily={fonts.medium}
                  letterSpacing={-0.32}
                  color={SHOWS.white}
                  numberOfLines={1}
                  containerStyle={styles.flex}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setToDelete(show)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icons
                    family="MaterialSymbolsRoundedFilled"
                    name="delete_forever"
                    size={24}
                    color={SHOWS.white48}
                  />
                </TouchableOpacity>
              </ListRow>
            ))
          ) : (
            <View style={styles.empty}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="live_tv"
                size={48}
                color={SHOWS.white48}
              />
              <CustomText
                label={search.trim() ? "No Results" : "No Shows Yet"}
                fontSize={24}
                fontFamily={fonts.semiBold}
                letterSpacing={-0.48}
                color={SHOWS.white}
                marginTop={12}
              />
              <CustomText
                label={
                  search.trim()
                    ? `None of your shows match “${search.trim()}”.`
                    : "Tap + to create your first show, then add episodes to it."
                }
                fontSize={14}
                fontFamily={fonts.medium}
                color={SHOWS.white48}
                textAlign="center"
              />
            </View>
          )}
        </View>
      </ScrollView>

      <FormHeader
        title="Search"
        topPad={12}
        titleGap={12}
        onBack={() => navigation.goBack()}
        right={<CircleButton icon="add" onPress={() => setSheetVisible(true)} />}
      >
        <View style={styles.search}>
          <GlassFill fill={SHOWS.white04} />
          <Icons
            family="MaterialSymbolsRounded"
            name="search"
            size={22}
            color={SHOWS.white64}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search your shows..."
            placeholderTextColor={SHOWS.white48}
            selectionColor={SHOWS.gold}
            autoCorrect={false}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSearch("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="cancel"
                size={22}
                color={SHOWS.white48}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </FormHeader>

      <NewShowSheet
        visible={sheetVisible}
        draft={draft}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        onDismiss={() => setSheetVisible(false)}
        onVisibleToPress={openVisibleTo}
        onConfirm={confirmNewShow}
        saving={saving}
      />
      <DeleteShowSheet
        show={toDelete}
        visible={!!toDelete}
        onDismiss={() => (deleting ? null : setToDelete(null))}
        onConfirm={confirmDelete}
        deleting={deleting}
      />
    </View>
  );
};

export default SelectShow;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: SHOWS.page,
  },
  list: {
    backgroundColor: SHOWS.section,
  },
  listEmpty: {
    flex: 1,
  },
  search: {
    height: 44,
    borderRadius: 100,
    overflow: "hidden",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  searchInput: {
    flex: 1,
    height: 44,
    padding: 0,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: SHOWS.white,
  },
  separator: {
    height: 1,
    backgroundColor: SHOWS.white04,
  },
  skeletonRow: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  skeletonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 2,
    backgroundColor: SHOWS.white04,
  },
  skeletonText: {
    width: 140,
    height: 12,
    borderRadius: 4,
    backgroundColor: SHOWS.white04,
  },
  empty: {
    flex: 1,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
});
