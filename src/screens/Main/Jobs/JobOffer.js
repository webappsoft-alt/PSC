import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import GlassBackButton from "../../../components/GlassBackButton";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { del, get, patch, put } from "../../../services/ApiRequest";
import { ToastMessage } from "../../../utils/ToastMessage";
import { CareerHeader, FieldBox, INK, MSF, SHEET_BG, WHITE_16, WHITE_4, WHITE_48, WHITE_64, X } from "../Career/molecules/CareerUI";
import { FilterChip } from "./JobMarketplace";
import { JobInfoSections } from "./JobDetail";
import {
  CANDIDATE_FILTERS,
  ChevronCircle,
  DeleteOfferSheet,
  Segmented,
  StarChip,
  StatusChip,
  candidateChip,
} from "./molecules/OfferUI";
import { OfferSkeleton } from "./molecules/JobSkeletons";

const BLUE = "#007BFF";

const initials = (u) =>
  `${(u?.firstName || "")[0] || ""}${(u?.lastName || "")[0] || ""}`.toUpperCase() || (u?.username || "?")[0].toUpperCase();
export const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.username || "";
export const userPlace = (u) =>
  [u?.location?.city || u?.profile?.city, u?.location?.country || u?.profile?.country].filter(Boolean).join(", ");

/** 40 round avatar (photo, else initials — PSC avatar rule) */
export const Avatar = ({ user, size = 40 }) => (
  <View style={[styles.avatar, { width: size, height: size, backgroundColor: user?.profile?.profileColor || WHITE_16 }]}>
    {user?.profile?.avatar ? (
      <ImageFast source={{ uri: user.profile.avatar }} style={{ width: size, height: size }} />
    ) : (
      <CustomText label={initials(user)} fontSize={size * 0.35} fontFamily={fonts.semiBold} color="#FFFFFF" />
    )}
  </View>
);

/**
 * Figma candidate row (8265:8020): 40 avatar r100 · column gap 6 — name
 * Medium 16 −0.5 (11) · `location_on` 10 blue + place Regular 10 −4% white
 * 64% — · star chip / status chip (gap 2) · 32 chevron circle; rows split by
 * 1pt white 4% (gap 12).
 */
const CandidateRow = ({ candidate, onPress }) => {
  const u = candidate.user || {};
  const place = userPlace(u);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.row}>
      <Avatar user={u} />
      <View style={styles.rowColumn}>
        <CustomText label={fullName(u)} fontSize={16} letterSpacing={-0.5} fontFamily={fonts.medium} color="#FFFFFF" numberOfLines={1} marginTop={(11 - 22.4) / 2} marginBottom={(11 - 22.4) / 2} />
        {!!place && (
          <View style={styles.placeRow}>
            <Icons family={MSF} name="location_on" size={10} color={BLUE} />
            <CustomText label={place} fontSize={10} letterSpacing={-0.4} color={WHITE_64} numberOfLines={1} marginTop={-X(10)} marginBottom={-X(10)} />
          </View>
        )}
      </View>
      <View style={styles.chips}>
        {candidate.starred && <StarChip />}
        <StatusChip chip={candidateChip(candidate)} />
      </View>
      <ChevronCircle onPress={onPress} />
    </TouchableOpacity>
  );
};

/**
 * Figma Matching/Jobs › offer "Overview" (8265:7776), the poster's view.
 * Header 100: back · title SemiBold 20 −4% · `more_vert` 20 (→ Delete This
 * Offer sheet). Section #121212 padding 8 gap 12: Overview / Details
 * segmented · "PAUSE THIS OFFER" / "STRICTLY FILTER CANDIDATES" boxes with
 * the app toggle · All / New / Approved / Declined chips. Section padding 12
 * gap 16: "Candidates" Medium 18 −0.5 + rows. "Details" shows the offer's
 * Job-Detail sections.
 */
const JobOffer = ({ route }) => {
  const navigation = useNavigation();
  const jobId = route?.params?.jobId;
  const [job, setJob] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [filter, setFilter] = useState("All");
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  // leave the screen only after the delete sheet has fully closed
  const deleted = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await get(`jobs/${jobId}`);
      if (res?.data?.success) setJob(res.data.data);
    } catch (e) {
      ToastMessage("Could not load this offer", "error");
      navigation.goBack();
    }
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  // reload when coming back from a candidate (status / star changed)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const setPaused = async (paused) => {
    if (!job || job.status === "expired" && paused) return;
    const prev = job;
    setJob({ ...job, status: paused ? "paused" : "active" });
    try {
      const res = await patch(`jobs/${job._id}/status`, { status: paused ? "paused" : "active" });
      if (res?.data?.success) setJob(res.data.data);
    } catch (e) {
      setJob(prev);
      ToastMessage(e?.response?.data?.message || "Could not update the offer", "error");
    }
  };

  const setStrict = async (v) => {
    if (!job) return;
    const prev = job;
    setJob({ ...job, strictFilter: v });
    try {
      const res = await put(`jobs/${job._id}`, { strictFilter: v });
      if (res?.data?.success) setJob(res.data.data);
    } catch (e) {
      setJob(prev);
      ToastMessage(e?.response?.data?.message || "Could not update the offer", "error");
    }
  };

  const remove = async () => {
    try {
      setBusy(true);
      const res = await del(`jobs/${job._id}`);
      if (res?.data?.success) {
        deleted.current = true;
        setSheet(false);
        ToastMessage("Offer deleted", "success");
      }
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not delete the offer", "error");
    } finally {
      setBusy(false);
    }
  };

  const candidates = (job?.candidates || []).filter((c) => c?.user && (CANDIDATE_FILTERS.find((f) => f.label === filter)?.match(c) ?? true));
  const pauseLabel = job?.status === "expired" ? "Expired" : job?.status === "paused" ? "Currently Paused" : "Currently Active";

  return (
    <>
      <ScreenWrapper
        scrollEnabled
        paddingHorizontal={0.1}
        paddingBottom={0.1}
        backgroundColor={INK}
        headerBlurColor={INK}
        headerUnScrollable={() => (
          <View style={styles.header}>
            <CareerHeader
              title={job?.title || ""}
              titleLetterSpacing={-0.8}
              right={
                job ? (
                  <GlassBackButton icon="more_vert" iconSize={20} color={WHITE_64} accessibilityLabel="More options" onPress={() => setSheet(true)} />
                ) : null
              }
            />
          </View>
        )}
      >
        {!job ? (
          <OfferSkeleton />
        ) : (
          <View style={styles.page}>
            <View style={styles.top}>
              <Segmented options={["Overview", "Details"]} value={tab} onChange={setTab} />
              {tab === "Overview" && (
                <>
                  <FieldBox
                    label="Pause this offer"
                    value={pauseLabel}
                    trailing="switch"
                    switchValue={job.status === "paused"}
                    switchDisabled={job.status === "expired"}
                    onSwitch={(v) => setPaused(v)}
                    valueLetterSpacing={0}
                  />
                  <FieldBox
                    label="Strictly filter candidates"
                    value={job.strictFilter === false ? "No" : "Yes"}
                    trailing="switch"
                    switchValue={job.strictFilter !== false}
                    onSwitch={(v) => setStrict(v)}
                    valueLetterSpacing={0}
                  />
                  <View style={styles.filters}>
                    {CANDIDATE_FILTERS.map((f) => (
                      <FilterChip key={f.label} label={f.label} active={filter === f.label} onPress={() => setFilter(f.label)} />
                    ))}
                  </View>
                </>
              )}
            </View>

            {tab === "Overview" ? (
              <View style={styles.section}>
                <CustomText label="Candidates" fontSize={18} letterSpacing={-0.5} fontFamily={fonts.medium} color="#FFFFFF" marginTop={-X(18)} marginBottom={-X(18)} />
                {candidates.length ? (
                  <View style={styles.list}>
                    {candidates.map((c, i) => (
                      <View key={String(c.user?._id || i)} style={styles.list}>
                        {i > 0 && <View style={styles.separator} />}
                        <CandidateRow
                          candidate={c}
                          onPress={() => navigation.navigate("JobCandidate", { jobId: job._id, userId: c.user._id })}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <CustomText
                    label={filter === "All" ? "No candidates yet." : `No ${filter.toLowerCase()} candidates.`}
                    fontSize={14}
                    letterSpacing={-0.28}
                    color={WHITE_48}
                  />
                )}
              </View>
            ) : (
              <JobInfoSections job={job} showQuestions={false} />
            )}
            {/* Figma bottom bar area (112) */}
            <View style={styles.bottomSpace} />
          </View>
        )}
      </ScreenWrapper>
      <DeleteOfferSheet
        visible={sheet}
        onDismiss={() => setSheet(false)}
        onConfirm={remove}
        busy={busy}
        onClosed={() => deleted.current && navigation.goBack()}
      />
    </>
  );
};

export default JobOffer;

const styles = StyleSheet.create({
  header: {},
  loading: { height: 300, alignItems: "center", justifyContent: "center" },
  page: { gap: 1, backgroundColor: SHEET_BG },
  top: { backgroundColor: INK, padding: 8, gap: 12 },
  filters: { flexDirection: "row", gap: 6 },
  section: { backgroundColor: INK, padding: 12, gap: 16 },
  list: { gap: 12 },
  separator: { height: 1, backgroundColor: WHITE_4 },
  row: { height: 40, flexDirection: "row", alignItems: "center", gap: 8 },
  rowColumn: { flex: 1, gap: 6 },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  chips: { flexDirection: "row", alignItems: "center", gap: 2 },
  avatar: { borderRadius: 100, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  bottomSpace: { height: 100, backgroundColor: INK, marginTop: -1 },
});
