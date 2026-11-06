import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import FlagImage from "../../../components/FlagImage";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { get, post } from "../../../services/ApiRequest";
import { companyLogo, companyName, companyOf } from "../../../utils/career";
import { languageOf } from "../../../utils/languages";
import { ToastMessage } from "../../../utils/ToastMessage";
import { DetailSkeleton } from "./molecules/JobSkeletons";
import { GlassFill } from "../BandMateMatching/molecules/matchLayout";
import { CareerHeader, FieldBox, GOLD, HelperRow, INK, MSF, SHEET_BG, WHITE_48, WHITE_64, X, nameInitials } from "../Career/molecules/CareerUI";

const BLUE = "#007BFF";
const ANSWER_MAX = 50;

/** Figma section: #121212, padding 12, gap 16, title Medium 18 −0.5 (13 trimmed) */
export const DetailSection = ({ title, icon, children, style }) => (
  <View style={[styles.section, style]}>
    {icon ? (
      <View style={styles.iconTitle}>
        <Icons family={MSF} name={icon} size={16} color="#FFFFFF" />
        <CustomText
          label={title}
          fontSize={18}
          letterSpacing={-0.09}
          fontFamily={fonts.medium}
          color="#FFFFFF"
          marginTop={-X(18)}
          marginBottom={-X(18)}
          containerStyle={styles.shrink}
        />
      </View>
    ) : (
      <CustomText
        label={title}
        fontSize={18}
        letterSpacing={-0.5}
        fontFamily={fonts.medium}
        color="#FFFFFF"
        marginTop={-X(18)}
        marginBottom={-X(18)}
      />
    )}
    {children}
  </View>
);

/** Figma body copy: Regular 14 −2% white 64% */
export const BodyText = ({ label }) => (
  <CustomText label={label} fontSize={14} letterSpacing={-0.28} color={WHITE_64} marginTop={-X(14)} marginBottom={-X(14)} />
);

/** Figma unordered list (indent 1): "•" at the left edge, text 14.5 in */
export const Bullets = ({ text }) => {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);
  return (
    <View>
      {lines.map((l, i) => (
        <View key={`${i}-${l}`} style={styles.bulletRow}>
          <CustomText label="•" fontSize={14} color={WHITE_64} containerStyle={styles.bullet} marginTop={i === 0 ? -X(14) : 0} />
          <CustomText
            label={l}
            fontSize={14}
            letterSpacing={-0.28}
            color={WHITE_64}
            marginTop={i === 0 ? -X(14) : 0}
            marginBottom={i === lines.length - 1 ? -X(14) : 0}
            containerStyle={styles.grow}
          />
        </View>
      ))}
    </View>
  );
};

/**
 * Figma language row: 32 × 22 flag · column gap 8 — name Medium 16 −0.5
 * (11) · native Regular 12 white 48% (8) · level Medium 14 −4% white (10)
 */
export const LanguageRow = ({ item }) => {
  const lang = languageOf(item?.code) || languageOf(item?.name);
  const name = lang?.name?.replace(/ \(US\)$/, "") || item?.name || "";
  return (
    <View style={styles.langRow}>
      <FlagImage code={lang?.flag} width={32} height={22} radius={3} />
      <View style={styles.langColumn}>
        <CustomText label={name} fontSize={16} letterSpacing={-0.5} fontFamily={fonts.medium} color="#FFFFFF" marginTop={(11 - 22.4) / 2} marginBottom={(11 - 22.4) / 2} />
        {!!lang?.native && (
          <CustomText label={lang.native.replace(/ \(US\)$/, "")} fontSize={12} color={WHITE_48} marginTop={(8 - 16.8) / 2} marginBottom={(8 - 16.8) / 2} />
        )}
        {!!item?.proficiency && item.proficiency !== "Any" && (
          <CustomText label={item.proficiency} fontSize={14} letterSpacing={-0.56} fontFamily={fonts.medium} color="#FFFFFF" marginTop={(10 - 19.6) / 2} marginBottom={(10 - 19.6) / 2} />
        )}
      </View>
    </View>
  );
};

/**
 * Figma answer box: 351 × 160 r12 white 4% padding 12, column gap 10 —
 * label Medium 12 uppercase white 64% (8) · answer Medium 16 (11); helper
 * row 8 below ("0/50 characters.").
 */
export const AnswerBox = ({ label, value, onChangeText, editable, maxLength = ANSWER_MAX, onEndEditing, placeholder = "The position consists in...", error }) => (
  <View style={styles.answerGroup}>
    <View style={styles.answerBox}>
      <GlassFill borderRadius={12} />
      <CustomText
        label={label}
        fontSize={12}
        fontFamily={fonts.medium}
        textTransform="uppercase"
        color={WHITE_64}
        marginTop={(8 - 16.8) / 2}
        marginBottom={(8 - 16.8) / 2}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline
        maxLength={maxLength}
        onEndEditing={onEndEditing}
        placeholder={placeholder}
        // grey, so an empty box never reads as an answer
        placeholderTextColor={WHITE_48}
        style={styles.answerInput}
      />
    </View>
    <HelperRow
      label={error ? "Please answer this question to apply." : `${(value || "").length}/${maxLength} characters.`}
      color={error ? "#EE1045" : WHITE_48}
      letterSpacing={0}
    />
  </View>
);

/**
 * Figma hero 375 × 375 (Job-Detail / candidate): cover + #121212 0→100%
 * gradient; bottom block padding 12, gap 12 — NEW chip + time · title
 * SemiBold 32 −4% · subtitle Medium 16 −0.5 · 14 `location_on` blue + place
 * Regular 14 −4% white 64%. `right`: e.g. the candidate's 40 chat circle,
 * bottom-right (12 in).
 */
export const DetailHero = ({ cover, isNew, time, title, subtitle, place, right, monogram }) => {
  const { width } = useWindowDimensions();
  const initials = !cover ? nameInitials(monogram) : "";
  return (
    <View style={[styles.hero, { height: width }]}>
      {!!cover && <ImageFast source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
      {!!initials && (
        <View style={styles.monogram}>
          <CustomText label={initials} fontSize={Math.round(width * 0.32)} fontFamily={fonts.semiBold} color="rgba(255, 255, 255, 0.08)" />
        </View>
      )}
      <LinearGradient colors={["rgba(18, 18, 18, 0)", "rgba(18, 18, 18, 1)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.heroRow}>
        <View style={styles.heroBlock}>
          <View style={styles.timeRow}>
            {isNew && <NewChip />}
            {!!time && (
              <CustomText label={time} fontSize={14} letterSpacing={-0.28} fontFamily={fonts.medium} color="#FFFFFF" marginTop={-X(14)} marginBottom={-X(14)} />
            )}
          </View>
          <CustomText label={title} fontSize={32} letterSpacing={-1.28} fontFamily={fonts.semiBold} color="#FFFFFF" marginTop={-X(32)} marginBottom={-X(32)} />
          {!!subtitle && (
            <CustomText label={subtitle} fontSize={16} letterSpacing={-0.5} fontFamily={fonts.medium} color="#FFFFFF" marginTop={-X(16)} marginBottom={-X(16)} />
          )}
          {!!place && (
            <View style={styles.placeRow}>
              <Icons family={MSF} name="location_on" size={14} color={BLUE} />
              <CustomText label={place} fontSize={14} letterSpacing={-0.56} color={WHITE_64} marginTop={-X(14)} marginBottom={-X(14)} />
            </View>
          )}
        </View>
        {right}
      </View>
    </View>
  );
};

/** Figma "NEW" chip: 20h p0/6 r4 #007BFF 16% + blur, SemiBold 10 −0.5% #007BFF */
export const NewChip = () => (
  <View style={styles.newChip}>
    <GlassFill borderRadius={4} fill="rgba(0, 123, 255, 0.16)" />
    <CustomText label="NEW" fontSize={10} letterSpacing={-0.05} fontFamily={fonts.semiBold} color={BLUE} />
  </View>
);

/**
 * Job-Detail sections after the hero (shared with the poster's offer
 * "Details" tab): Get To Know {company} · Job Description · Key
 * Responsibilities · Language · Education / Experience Requirement ·
 * Question asked #N.
 */
export const JobInfoSections = ({ job, answers = [], editable, onAnswer, showQuestions = true, answerLabel = "Your answer:", showErrors }) => {
  const company = companyOf(job);
  return (
    <>
          {!!company?.description && (
            <DetailSection title={`Get To Know ${companyName(job)}`}>
              <BodyText label={company.description} />
            </DetailSection>
          )}
          {!!job.description && (
            <DetailSection title="Job Description">
              <BodyText label={job.description} />
            </DetailSection>
          )}
          {!!job.responsibilities && (
            <DetailSection title="Key Responsibilities">
              <Bullets text={job.responsibilities} />
            </DetailSection>
          )}
          {!!job.languages?.length && (
            <DetailSection title="Language">
              <View style={styles.langList}>
                {job.languages.map((l, i) => (
                  <LanguageRow key={`${l.code}-${i}`} item={l} />
                ))}
              </View>
            </DetailSection>
          )}
          {!!job.educationDegree && (
            <DetailSection title="Education Requirement" icon="location_on">
              <FieldBox label="Education Degree" value={job.educationDegree} trailing="none" valueLetterSpacing={0} />
            </DetailSection>
          )}
          {!!job.experience && (
            <DetailSection title="Experience Requirement" icon="location_on">
              <View style={styles.fieldGroup}>
                <FieldBox label="Experience" value={job.experience} trailing="none" valueLetterSpacing={0} />
                <HelperRow label="Have spent at least this amount of time in this industry." letterSpacing={-0.24} />
              </View>
            </DetailSection>
          )}
          {showQuestions && (job.questions || []).map((q, i) => (
            <DetailSection key={`q-${i}`} title={q || `Question asked #${i + 1}`}>
              <AnswerBox
                label={answerLabel}
                value={answers[i] || ""}
                editable={editable}
                error={showErrors && editable && !String(answers[i] || "").trim()}
                onChangeText={(t) => onAnswer?.(i, t)}
              />
            </DetailSection>
          ))}
    </>
  );
};

/**
 * Figma Matching/Jobs › "Job-Detail" (8276:10874), the applicant's view.
 * Page #262626, sections #121212 1pt apart. Header 100: back · title
 * SemiBold 20 −4% · `more_vert` 20 in a 40 circle. Hero 375 × 375: company
 * cover + #121212 0→100% gradient; bottom block padding 12, gap 12: "NEW"
 * chip (20h p0/6 r4 #007BFF 16%, SemiBold 10 −0.5% blue) + "23 hours ago"
 * Medium 14 −2% · title SemiBold 32 −4% · company Medium 16 −0.5 · 14
 * `location_on` blue + Regular 14 −4% white 64%. "Apply Now" band padding 8:
 * 40 r100 #A19375, Medium 16 −0.5 #121212. Then Get To Know {company} · Job
 * Description · Key Responsibilities · Language · Education Requirement ·
 * Experience Requirement · Question asked #N (answer boxes).
 */
const JobDetail = ({ route }) => {
  const navigation = useNavigation();
  const jobId = route?.params?.jobId;
  const [job, setJob] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [triedApply, setTriedApply] = useState(false);
  const scrollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await get(`jobs/${jobId}`);
      if (res?.data?.success) {
        const data = res.data.data;
        setJob(data);
        setAnswers((data.questions || []).map((_, i) => data.myAnswers?.[i] || ""));
      }
    } catch (e) {
      ToastMessage("Could not load this offer", "error");
      navigation.goBack();
    }
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const apply = async () => {
    if (!job || busy) return;
    // answers are mandatory (not when withdrawing)
    if (!job.applied && (job.questions || []).some((_, i) => !String(answers[i] || "").trim())) {
      setTriedApply(true);
      ToastMessage("Please answer every question to apply", "error");
      // the questions sit at the end of the page — take the user there
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd?.({ animated: true }));
      return;
    }
    try {
      setBusy(true);
      const res = await post(`jobs/${job._id}/apply`, { answers });
      if (res?.data?.success) {
        ToastMessage(res.data.data?.applied ? "Application sent" : "Application withdrawn", "success");
        await load();
      }
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  };

  const company = companyOf(job);
  // hero: the company page's cover → company logo → the poster's cover; the
  // imported directory companies have none, so the hero then shows the
  // company initials (PSC avatar rule) instead of an empty block
  const poster = job?.postedBy && typeof job.postedBy === "object" ? job.postedBy : null;
  const cover = company?.pscUser?.profile?.cover || companyLogo(job) || poster?.profile?.cover;
  const place = [job?.location?.city, job?.location?.country].filter(Boolean).join(", ");
  const isNew = job?.createdAt && moment().diff(moment(job.createdAt), "hours") < 24;
  const canApply = job && !job.isOwner && job.status === "active";

  return (
    <ScreenWrapper
      scrollEnabled
      scrollRef={scrollRef}
      paddingHorizontal={0.1}
      paddingBottom={0.1}
      backgroundColor={INK}
      headerBlurColor={INK}
      headerUnScrollable={() => (
        <View style={styles.header}>
          <CareerHeader
            title={job?.title || ""}
            titleLetterSpacing={-0.8}
            right={null}
          />
        </View>
      )}
    >
      {!job ? (
        <DetailSkeleton />
      ) : (
        <View style={styles.page}>
          <DetailHero
            cover={cover}
            isNew={isNew}
            time={moment(job.createdAt).fromNow()}
            title={job.title}
            subtitle={companyName(job)}
            place={place}
            monogram={companyName(job)}
          />

          {canApply && (
            <View style={styles.applyBand}>
              <TouchableOpacity activeOpacity={0.8} onPress={apply} disabled={busy} style={[styles.applyBtn, busy && styles.dim]}>
                <CustomText
                  label={job.applied ? "Withdraw Application" : "Apply Now"}
                  fontSize={16}
                  letterSpacing={-0.5}
                  fontFamily={fonts.medium}
                  color={INK}
                />
              </TouchableOpacity>
            </View>
          )}

          <JobInfoSections
            job={job}
            answers={answers}
            editable={canApply && !job.applied}
            onAnswer={(i, t) => setAnswers((arr) => arr.map((v, j) => (j === i ? t : v)))}
            showErrors={triedApply}
          />
          {/* Figma: last section padding-bottom 112 (clears the bottom bar) */}
          <View style={styles.bottomSpace} />
        </View>
      )}
    </ScreenWrapper>
  );
};

export default JobDetail;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  shrink: { flexShrink: 1 },
  dim: { opacity: 0.5 },
  header: {},
  loading: { height: 300, alignItems: "center", justifyContent: "center" },
  page: { gap: 1, backgroundColor: SHEET_BG },
  hero: { backgroundColor: INK, justifyContent: "flex-end", overflow: "hidden" },
  monogram: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", paddingBottom: "30%" },
  heroRow: { flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 12 },
  heroBlock: { flex: 1, gap: 12 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  newChip: { height: 20, paddingHorizontal: 6, borderRadius: 4, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  applyBand: { backgroundColor: INK, padding: 8 },
  applyBtn: { height: 40, borderRadius: 100, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  section: { backgroundColor: INK, padding: 12, gap: 16 },
  iconTitle: { flexDirection: "row", alignItems: "center", gap: 4, height: 16 },
  bulletRow: { flexDirection: "row" },
  bullet: { width: 14.5 },
  langList: { gap: 12 },
  langRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  langColumn: { flex: 1, gap: 8 },
  fieldGroup: { gap: 6 },
  answerGroup: { gap: 8 },
  answerBox: { height: 160, borderRadius: 12, padding: 12, gap: 10, overflow: "hidden" },
  answerInput: {
    flex: 1,
    padding: 0,
    marginTop: -5.5,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: "#FFFFFF",
    textAlignVertical: "top",
  },
  bottomSpace: { height: 100, backgroundColor: INK, marginTop: -1 },
});
