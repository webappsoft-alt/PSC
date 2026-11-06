import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { get, patch } from "../../../services/ApiRequest";
import {
  companyLogo,
  companyName,
  formatDateRange,
  formatDuration,
  schoolLogo,
  schoolName,
} from "../../../utils/career";
import { ToastMessage } from "../../../utils/ToastMessage";
import { GlassFill } from "../BandMateMatching/molecules/matchLayout";
import { CareerHeader, GOLD, INK, MS, MSF, SHEET_BG, WHITE_4, WHITE_48, WHITE_64 } from "../Career/molecules/CareerUI";
import { Item } from "../Profile/molecules/CareerTab";
import { FilterChip } from "./JobMarketplace";
import { AnswerBox, BodyText, DetailHero, DetailSection, LanguageRow } from "./JobDetail";
import { fullName, userPlace } from "./JobOffer";
import { GREEN, RED } from "./molecules/OfferUI";
import { DetailSkeleton } from "./molecules/JobSkeletons";

const TABS = ["Profile", "Q&A", "Documents", "Notes"];
const NOTE_MAX = 500;

/**
 * Figma approve / decline pill (32 r100 inside the 40 white 4% "Filter
 * Options" bar): idle 16% tint + 16 glyph in the colour; picked → solid
 * colour + #121212 glyph.
 */
const DecisionPill = ({ icon, color, tint, active, onPress }) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.pill, { backgroundColor: active ? color : tint }]}>
    <Icons family={MS} name={icon} size={16} color={active ? INK : color} />
  </TouchableOpacity>
);

/**
 * Figma Matching/Jobs › candidate (8265:8152 Profile, 8276:9886 Q&A).
 * Header 100 (back · job title SemiBold 20 −4%). Hero 375 × 375: candidate
 * photo, NEW + "23 hours ago", name SemiBold 32 −4%, "48 years old" Medium
 * 16 −0.5, place; 40 white chat circle (`chat` 20 #121212). Band #121212
 * padding 8 gap 12: 40 star circle + approve / decline bar · "Visit PSC
 * Profile" 40 #A19375 · Profile / Q&A / Documents / Notes chips. Profile:
 * Get To Know · Current Position · Last Position · Experience · Education ·
 * Language · Skills. Q&A: "{NAME}'S ANSWER:" boxes.
 */
const JobCandidate = ({ route }) => {
  const navigation = useNavigation();
  const { jobId, userId } = route?.params || {};
  const [job, setJob] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [wasNew, setWasNew] = useState(false);
  const [career, setCareer] = useState(null);
  const [tab, setTab] = useState("Profile");
  const [note, setNote] = useState("");
  // notes save while typing (0.8 s after the last key) and when leaving —
  // not only on blur, which doesn't fire for a hardware keyboard / going back
  const noteTimer = useRef(null);
  const savedNote = useRef("");
  const pendingNote = useRef(null);
  const saveNote = useCallback(
    (text) => {
      if (text == null || text === savedNote.current) return;
      savedNote.current = text;
      pendingNote.current = null;
      patch(`jobs/${jobId}/candidates/${userId}`, { note: text }).catch(() => {
        savedNote.current = null;
        ToastMessage("Could not save your note", "error");
      });
    },
    [jobId, userId],
  );
  const onNoteChange = (text) => {
    setNote(text);
    pendingNote.current = text;
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => saveNote(text), 800);
  };
  useEffect(
    () => () => {
      clearTimeout(noteTimer.current);
      if (pendingNote.current != null) saveNote(pendingNote.current);
    },
    [saveNote],
  );

  const pick = (data) => (data?.candidates || []).find((c) => String(c.user?._id || c.user) === String(userId));

  const load = useCallback(async () => {
    try {
      const [jobRes, careerRes] = await Promise.all([get(`jobs/${jobId}`), get(`career/user/${userId}`).catch(() => null)]);
      if (jobRes?.data?.success) {
        const data = jobRes.data.data;
        const c = pick(data);
        setJob(data);
        setCandidate(c || null);
        setNote(c?.note || "");
        savedNote.current = c?.note || "";
        if (c && !c.seen && c.status === "applied") {
          setWasNew(true);
          patch(`jobs/${jobId}/candidates/${userId}`, { seen: true }).catch(() => {});
        }
      }
      setCareer(careerRes?.data?.success ? careerRes.data.data : {});
    } catch (e) {
      ToastMessage("Could not load this candidate", "error");
      navigation.goBack();
    }
  }, [jobId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const update = async (body) => {
    const prev = candidate;
    setCandidate((c) => ({ ...c, ...body }));
    try {
      const res = await patch(`jobs/${jobId}/candidates/${userId}`, body);
      if (res?.data?.success) {
        setJob(res.data.data);
        const c = pick(res.data.data);
        if (c) setCandidate(c);
      }
    } catch (e) {
      setCandidate(prev);
      ToastMessage(e?.response?.data?.message || "Could not update the candidate", "error");
    }
  };

  const u = candidate?.user || {};
  const first = u.firstName || u.username || "";
  const age = u.dob && moment(u.dob).isValid() ? moment().diff(moment(u.dob), "years") : null;
  const current = (career?.current || [])[0];
  const past = (career?.experiences || []).filter((e) => !e.current);
  const last = past[0];
  const others = past.slice(1);
  const education = career?.education || [];
  const languages = career?.languages || [];
  const skills = career?.skills || [];

  const expItem = (e) => (
    <Item
      key={e._id}
      variant="candidate"
      logo={companyLogo(e)}
      title={e.title}
      subtitle={companyName(e)}
      dateRange={formatDateRange(e.startDate, e.endDate, e.current)}
      duration={formatDuration(e.startDate, e.endDate, e.current)}
      location={e.location}
      description={e.description}
      verifiedBy={e.verifiedBy}
    />
  );

  return (
    <ScreenWrapper
      scrollEnabled
      paddingHorizontal={0.1}
      paddingBottom={0.1}
      backgroundColor={INK}
      headerBlurColor={INK}
      headerUnScrollable={() => (
        <View style={styles.header}>
          <CareerHeader title={job?.title || ""} titleLetterSpacing={-0.8} />
        </View>
      )}
    >
      {!job || !career ? (
        <DetailSkeleton actions={2} />
      ) : !candidate ? (
        <View style={styles.loading}>
          <CustomText label="This candidate withdrew." color={WHITE_48} />
        </View>
      ) : (
        <View style={styles.page}>
          <DetailHero
            cover={u.profile?.cover || u.profile?.avatar}
            isNew={wasNew}
            time={candidate.appliedAt ? moment(candidate.appliedAt).fromNow() : ""}
            title={fullName(u)}
            subtitle={age != null ? `${age} years old` : ""}
            place={userPlace(u)}
            monogram={fullName(u)}
            right={
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.chat}
                onPress={() =>
                  navigation.navigate("InboxScreen", { recipientId: u._id, recipientName: fullName(u), otherUser: u })
                }
              >
                <Icons family={MSF} name="chat" size={20} color={INK} />
              </TouchableOpacity>
            }
          />

          <View style={styles.band}>
            <View style={styles.actions}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => update({ starred: !candidate.starred })} style={styles.star}>
                <GlassFill borderRadius={100} />
                <Icons
                  family={candidate.starred ? MSF : MS}
                  name="star"
                  size={20}
                  color={candidate.starred ? GOLD : WHITE_64}
                />
              </TouchableOpacity>
              <View style={styles.decision}>
                <GlassFill borderRadius={100} />
                <DecisionPill
                  icon="check"
                  color={GREEN}
                  tint="rgba(55, 184, 116, 0.16)"
                  active={candidate.status === "preselected"}
                  onPress={() => update({ status: candidate.status === "preselected" ? "applied" : "preselected" })}
                />
                <DecisionPill
                  icon="close"
                  color={RED}
                  tint="rgba(238, 16, 69, 0.16)"
                  active={candidate.status === "rejected"}
                  onPress={() => update({ status: candidate.status === "rejected" ? "applied" : "rejected" })}
                />
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.visit}
              onPress={() => navigation.navigate("UserProfile", { userId: u._id, item: u })}
            >
              <CustomText label="Visit PSC Profile" fontSize={16} letterSpacing={-0.5} fontFamily={fonts.medium} color={INK} />
            </TouchableOpacity>
            <View style={styles.tabs}>
              {TABS.map((t) => (
                <FilterChip key={t} label={t} active={tab === t} onPress={() => setTab(t)} />
              ))}
            </View>
          </View>

          {tab === "Profile" && (
            <>
              {!!u.profile?.bio && (
                <DetailSection title={`Get To Know ${first}`}>
                  <BodyText label={u.profile.bio} />
                </DetailSection>
              )}
              {!!current && <DetailSection title="Current Position">{expItem(current)}</DetailSection>}
              {!!last && <DetailSection title="Last Position">{expItem(last)}</DetailSection>}
              {others.length > 0 && (
                <DetailSection title="Experience">
                  <View style={styles.items}>{others.map(expItem)}</View>
                </DetailSection>
              )}
              {education.length > 0 && (
                <DetailSection title="Education">
                  <View style={styles.items}>
                    {education.map((ed) => (
                      <Item
                        key={ed._id}
                        variant="candidate"
                        logo={schoolLogo(ed)}
                        title={ed.degree || ed.primaryMajor || "Student"}
                        subtitle={schoolName(ed)}
                        dateRange={formatDateRange(ed.startDate, ed.graduationDate, ed.current)}
                        duration={formatDuration(ed.startDate, ed.graduationDate, ed.current)}
                        location={ed.location}
                        description={ed.description}
                        verifiedBy={ed.verifiedBy}
                      />
                    ))}
                  </View>
                </DetailSection>
              )}
              {languages.length > 0 && (
                <DetailSection title="Language">
                  <View style={styles.items}>
                    {languages.map((l, i) => (
                      <LanguageRow key={`${l.code}-${i}`} item={l} />
                    ))}
                  </View>
                </DetailSection>
              )}
              {skills.length > 0 && (
                <DetailSection title="Skills">
                  <View style={styles.skills}>
                    {skills.map((sk) => (
                      <View key={sk} style={styles.skill}>
                        <CustomText label={sk} fontSize={12} fontFamily={fonts.medium} color={WHITE_48} />
                      </View>
                    ))}
                  </View>
                </DetailSection>
              )}
            </>
          )}

          {tab === "Q&A" &&
            ((job.questions || []).length ? (
              job.questions.map((q, i) => (
                <DetailSection key={`q-${i}`} title={q || `Question asked #${i + 1}`}>
                  <AnswerBox label={`${first}’s answer:`} value={candidate.answers?.[i] || ""} editable={false} placeholder="" />
                </DetailSection>
              ))
            ) : (
              <DetailSection title="Q&A">
                <BodyText label="This offer has no questions." />
              </DetailSection>
            ))}

          {tab === "Documents" && (
            <DetailSection title="Documents">
              <BodyText label={`${first} hasn’t shared any documents yet.`} />
            </DetailSection>
          )}

          {tab === "Notes" && (
            <DetailSection title="Notes">
              <AnswerBox
                label="Your notes:"
                value={note}
                editable
                maxLength={NOTE_MAX}
                placeholder="Only you can see these notes..."
                onChangeText={onNoteChange}
              />
            </DetailSection>
          )}

          <View style={styles.bottomSpace} />
        </View>
      )}
    </ScreenWrapper>
  );
};

export default JobCandidate;

const styles = StyleSheet.create({
  header: {},
  loading: { height: 300, alignItems: "center", justifyContent: "center" },
  page: { gap: 1, backgroundColor: SHEET_BG },
  chat: { width: 40, height: 40, borderRadius: 100, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  band: { backgroundColor: INK, padding: 8, gap: 12 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  star: { width: 40, height: 40, borderRadius: 100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  decision: { flex: 1, height: 40, borderRadius: 100, padding: 4, gap: 4, flexDirection: "row", overflow: "hidden" },
  pill: { flex: 1, height: 32, borderRadius: 100, alignItems: "center", justifyContent: "center" },
  visit: { height: 40, borderRadius: 100, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", gap: 6 },
  items: { gap: 12 },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 4, rowGap: 6 },
  skill: { height: 28, paddingHorizontal: 10, borderRadius: 75, backgroundColor: WHITE_4, alignItems: "center", justifyContent: "center" },
  bottomSpace: { height: 101, backgroundColor: INK, marginTop: -1 },
});
