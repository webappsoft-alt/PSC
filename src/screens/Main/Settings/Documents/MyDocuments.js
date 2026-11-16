import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import ScreenWrapper from "../../../../components/ScreenWrapper";
import { del, get, post } from "../../../../services/ApiRequest";
import { ToastMessage } from "../../../../utils/ToastMessage";
import { CareerHeader, INK, SHEET_BG, SectionTitle, WHITE_4 } from "../../Career/molecules/CareerUI";
import {
  AddDocumentRow,
  DOCUMENT_SECTIONS,
  DocumentRow,
  DocumentRowsSkeleton,
  openDocument,
  pickAndUploadPdf,
} from "../../Career/molecules/DocumentUI";
import { FilterChip } from "../../Jobs/JobMarketplace";
import { DeleteOfferSheet } from "../../Jobs/molecules/OfferUI";

const CHIPS = ["All", ...DOCUMENT_SECTIONS.map((s) => s.chip)];

/**
 * Settings › My Documents — Figma Profile › "My-Documents" (8337:8870).
 * Header 144 (#121212, padding 52/12/8/12, gap 12): back 40 · "My
 * Documents" SemiBold 20 −0.5% · chips All / Resume / Certificates / IDs
 * (32 r100, gap 6). Page #262626 shows 1pt under the header; content
 * #121212, sections (padding 16, gap 24) split by 1pt white 4%: title
 * Medium 18 · rows (gap 16) · "Add a new …" + "Only provide a PDF.".
 * These files are kept on the account and pre-fill job applications.
 */
const MyDocuments = () => {
  const [chip, setChip] = useState("All");
  const [docs, setDocs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(null); // kind being uploaded
  const [confirm, setConfirm] = useState(null); // doc to delete
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await get("career/documents");
      if (res?.data?.success) setDocs(res.data.data || []);
    } catch (e) {
      console.log("documents load error", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const add = async (kind) => {
    if (adding) return;
    setAdding(kind);
    try {
      const file = await pickAndUploadPdf();
      if (!file) return;
      const res = await post("career/documents", { ...file, kind });
      if (res?.data?.success) setDocs(res.data.data || []);
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not add the document", "error");
    } finally {
      setAdding(null);
    }
  };

  const remove = async () => {
    if (!confirm || deleting) return;
    setDeleting(true);
    try {
      const res = await del(`career/documents/${confirm._id}`);
      if (res?.data?.success) setDocs(res.data.data || []);
      setConfirm(null);
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not delete the document", "error");
    } finally {
      setDeleting(false);
    }
  };

  const sections = DOCUMENT_SECTIONS.filter((s) => chip === "All" || s.chip === chip);

  return (
    <>
      <ScreenWrapper
        scrollEnabled
        paddingHorizontal={0.1}
        backgroundColor={INK}
        headerBlur
        headerBlurColor={INK}
        headerUnScrollable={() => (
          <View style={styles.header}>
            <CareerHeader title="My Documents" titleLetterSpacing={-0.1} />
            <View style={styles.chips}>
              {CHIPS.map((c) => (
                <FilterChip key={c} label={c} active={chip === c} onPress={() => setChip(c)} />
              ))}
            </View>
          </View>
        )}
      >
        <View style={styles.band} />
        {sections.map((s, i) => {
          const items = docs.filter((d) => d.kind === s.kind);
          return (
            <View key={s.kind}>
              {i > 0 && <View style={styles.rule} />}
              <View style={styles.section}>
                <SectionTitle label={s.title} letterSpacing={-0.5} />
                {!loaded ? (
                  <DocumentRowsSkeleton />
                ) : items.length ? (
                  <View style={styles.list}>
                    {items.map((d) => (
                      <DocumentRow key={d._id} doc={d} onPress={() => openDocument(d)} onDelete={() => setConfirm(d)} />
                    ))}
                  </View>
                ) : null}
                <AddDocumentRow label={s.add} busy={adding === s.kind} onPress={() => add(s.kind)} />
              </View>
            </View>
          );
        })}
      </ScreenWrapper>
      <DeleteOfferSheet
        visible={!!confirm}
        onDismiss={() => !deleting && setConfirm(null)}
        onConfirm={remove}
        busy={deleting}
        title="Delete This Document"
        confirmLabel="Yes, Delete This Document"
      />
    </>
  );
};

export default MyDocuments;

const styles = StyleSheet.create({
  // CareerHeader carries the 8 bottom padding of its row → 12 − 8 to the chips
  header: { gap: 4, paddingBottom: 8 },
  chips: { flexDirection: "row", gap: 6, paddingHorizontal: 12 },
  band: { height: 1, backgroundColor: SHEET_BG },
  section: { padding: 16, gap: 24, backgroundColor: INK },
  list: { gap: 16 },
  rule: { height: 1, backgroundColor: WHITE_4 },
});
