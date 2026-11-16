import { keepLocalCopy, pick, types } from "@react-native-documents/picker";
import moment from "moment";
import { ActivityIndicator, Linking, StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { Bone, SkeletonGroup } from "../../../../components/Skeleton";
import AnimatedDashedBorder from "../../../../components/Auth/AnimatedDashedBorder";
import { post } from "../../../../services/ApiRequest";
import { ToastMessage } from "../../../../utils/ToastMessage";
import { BoxIcon, GOLD, HelperRow, MS, MSF, WHITE_16, WHITE_4, WHITE_48, WHITE_64, WHITE_8, X } from "./CareerUI";

/**
 * Job-application documents — Figma Profile › "My-Documents" (8337:8870)
 * and Matching/Jobs › "Job-Apply" (8336:3960). Shared by Settings › My
 * Documents, the Apply form and the poster's candidate Documents tab.
 */

export const DOCUMENT_SECTIONS = [
  { kind: "resume", chip: "Resume", title: "My Resume", icon: "article", add: "Add a new Resume" },
  { kind: "certificate", chip: "Certificates", title: "My Certificates", icon: "description", add: "Add a new Certificate" },
  { kind: "id", chip: "IDs", title: "My Identity Documents", icon: "badge", add: "Add a new ID" },
];

export const documentIcon = (kind) => DOCUMENT_SECTIONS.find((s) => s.kind === kind)?.icon || "description";

const fileType = (doc) => {
  const ext = String(doc?.mimetype || "").split("/")[1] || String(doc?.url || "").split(".").pop();
  return (ext || "pdf").toUpperCase();
};

/**
 * Picks one PDF and uploads it privately (POST career/documents/upload — no
 * public link; the server hands out short-lived links). Resolves
 * `{ name, path, mimetype, size }`, or null when cancelled / failed.
 */
export const pickAndUploadPdf = async () => {
  let file;
  try {
    // "open" mode: iOS hands back a link to the file instead of copying it at
    // selection time (the import copy hangs the Files picker); the file is
    // copied into the app below with keepLocalCopy
    [file] = await pick({ type: [types.pdf], mode: "open" });
  } catch (e) {
    return null; // cancelled
  }
  if (!file?.uri) return null;
  if (file.type && file.type !== "application/pdf") {
    ToastMessage("Only provide a PDF.", "error");
    return null;
  }
  try {
    // the picked URL is security-scoped (iOS Files): copy it into the app
    // first, as UploadImage does, then upload the local copy
    const [copy] = await keepLocalCopy({
      files: [{ uri: file.uri, fileName: file.name || "document.pdf", type: "application/pdf" }],
      destination: "cachesDirectory",
    });
    if (copy?.status !== "success" || !copy.localUri) throw new Error(copy?.copyError || "copy failed");
    const form = new FormData();
    form.append("file", { uri: copy.localUri, type: "application/pdf", name: file.name || "document.pdf" });
    const res = await post("career/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    const data = res?.data?.data;
    if (!data?.path) throw new Error("upload failed");
    return { ...data, name: String(file.name || data.name || "Document").replace(/\.pdf$/i, "") };
  } catch (e) {
    console.log("document upload error", e);
    ToastMessage(e?.message && e?.status ? e.message : "Upload failed, please try again", "error");
    return null;
  }
};

/**
 * Figma document row (8337:8706): 32 square white 4% + 16 icon white 64% ·
 * 8 · name Medium 16 −0.5pt / 8 / "PDF" • "Jun 24, 2026" Regular 12 −2%
 * white 48% (3pt white 16% dot, gap 2) · 32 circle white 4% with
 * `delete_forever` 16 white 64%.
 */
export const DocumentRow = ({ doc, onPress, onDelete, deleting }) => (
  <View style={styles.row}>
    <TouchableOpacity activeOpacity={0.7} disabled={!onPress} onPress={onPress} style={styles.rowMain}>
      <View style={styles.fileBox}>
        <Icons family={MSF} name={documentIcon(doc?.kind)} size={16} color={WHITE_64} />
      </View>
      <View style={styles.column}>
        <CustomText
          label={doc?.name}
          fontSize={16}
          letterSpacing={-0.5}
          fontFamily={fonts.medium}
          color="#FFFFFF"
          numberOfLines={1}
          marginTop={-X(16)}
          marginBottom={-X(16)}
        />
        <View style={styles.meta}>
          <CustomText label={fileType(doc)} {...META} />
          {!!doc?.createdAt && (
            <>
              <View style={styles.metaDot} />
              <CustomText label={moment(doc.createdAt).format("MMM D, YYYY")} {...META} />
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
    {!!onDelete && (
      <TouchableOpacity activeOpacity={0.7} disabled={deleting} onPress={onDelete} hitSlop={6} style={styles.circle}>
        {deleting ? (
          <ActivityIndicator size="small" color={WHITE_64} />
        ) : (
          <Icons family={MSF} name="delete_forever" size={16} color={WHITE_64} />
        )}
      </TouchableOpacity>
    )}
  </View>
);

const META = {
  fontSize: 12,
  letterSpacing: -0.24,
  color: WHITE_48,
  marginTop: -X(12),
  marginBottom: -X(12),
};

/**
 * Figma "Add a new …" block (8337:9109): 32 square white 4% + `add` 16
 * white · 8 · Medium 14 −4% — 6 — `info` 12 + "Only provide a PDF." Light
 * 12 #A19375 (gap 2).
 */
export const AddDocumentRow = ({ label, onPress, busy }) => (
  <View style={styles.addBlock}>
    <TouchableOpacity activeOpacity={0.7} disabled={busy} onPress={onPress} style={styles.addRow}>
      <View style={styles.fileBox}>
        {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icons family={MS} name="add" size={16} color="#FFFFFF" />}
      </View>
      <CustomText label={label} fontSize={14} letterSpacing={-0.56} fontFamily={fonts.medium} color="#FFFFFF" />
    </TouchableOpacity>
    <View style={styles.info}>
      <BoxIcon name="info" size={12} color={GOLD} />
      <CustomText
        label="Only provide a PDF."
        fontSize={12}
        fontFamily={fonts.light}
        color={GOLD}
        marginTop={-X(12)}
        marginBottom={-X(12)}
      />
    </View>
  </View>
);

export const openDocument = (doc) => {
  if (doc?.url) Linking.openURL(doc.url).catch(() => ToastMessage("Could not open the file", "error"));
};

/**
 * Figma Job-Apply "Submit Your Resume" drop zone (8336:4041): 88 tall r12,
 * animated dashed 1pt white 8% border (8/8), padding 16, `add` 40 white 48% — 8 — `info` 12 +
 * "pdf format only." Regular 12 −3% white 64% (gap 4).
 */
export const UploadDropZone = ({ onPress, busy }) => (
  <View style={styles.dropBlock}>
    <TouchableOpacity activeOpacity={0.7} disabled={busy} onPress={onPress} style={styles.dropZone}>
      {/* Figma stroke: 1pt white 8%, dash 8 / gap 8, round caps — animated
          like the Add-account card on the profile selector */}
      <AnimatedDashedBorder color={WHITE_8} borderRadius={12} dashLength={8} gapLength={8} lineCap="round" />
      {busy ? <ActivityIndicator color={WHITE_48} /> : <Icons family={MS} name="add" size={40} color={WHITE_48} />}
    </TouchableOpacity>
    <HelperRow label="pdf format only." color={WHITE_64} letterSpacing={-0.36} />
  </View>
);

/** Loading rows (same geometry as DocumentRow) */
export const DocumentRowsSkeleton = ({ count = 1 }) => (
  <SkeletonGroup>
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.rowMain}>
            <Bone width={32} height={32} radius={0} />
            <View style={styles.column}>
              <Bone width={150 + ((i * 41) % 60)} height={11} />
              <Bone width={100} height={8} />
            </View>
          </View>
          <Bone width={32} height={32} radius={100} />
        </View>
      ))}
    </View>
  </SkeletonGroup>
);

const styles = StyleSheet.create({
  list: { gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 32 },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  fileBox: { width: 32, height: 32, backgroundColor: WHITE_4, alignItems: "center", justifyContent: "center" },
  column: { flex: 1, gap: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 2 },
  metaDot: { width: 3, height: 3, borderRadius: 100, backgroundColor: WHITE_16 },
  circle: { width: 32, height: 32, borderRadius: 100, backgroundColor: WHITE_4, alignItems: "center", justifyContent: "center" },
  addBlock: { gap: 6 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 32 },
  // no fixed height: a 12pt Material Symbols glyph clips in an exactly-12pt row
  info: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 12 },
  dropBlock: { gap: 8 },
  dropZone: {
    height: 88,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

export const documentStyles = styles;
