import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import CustomSwitch from "../../../components/CustomSwitch";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { get, post } from "../../../services/ApiRequest";
import {
  EXPERIENCE_LEVELS,
  companyName,
  companyOf,
} from "../../../utils/career";
import { LANGUAGE_PROFICIENCIES } from "../../../utils/languages";
import { ToastMessage } from "../../../utils/ToastMessage";
import {
  CareerHeader,
  FieldBox,
  FooterButton,
  GOLD,
  HelperRow,
  INK,
  SHEET_BG,
  TextFieldBox,
  WHITE_4,
  X,
} from "../Career/molecules/CareerUI";
import {
  DocumentRow,
  UploadDropZone,
  openDocument,
  pickAndUploadPdf,
} from "../Career/molecules/DocumentUI";
import {
  ANSWER_MAX,
  AnswerBox,
  BodyText,
  Bullets,
  DetailHero,
  DetailSection,
  LanguageRow,
  jobHeroProps,
} from "./JobDetail";
import { DetailSkeleton } from "./molecules/JobSkeletons";
import JobOptionSheet from "./molecules/JobOptionSheet";

const MOTIVATION_MAX = 1000;
const KNOWLEDGE_LEVELS = LANGUAGE_PROFICIENCIES.filter((p) => p !== "Any");
// Figma copy under the language / experience fields
const TIME_HELPER = "Have spent at least this amount of time in this industry.";

const sameLanguage = (a, b) =>
  (a?.code && b?.code && a.code === b.code) ||
  (!!a?.name && a.name.toLowerCase() === String(b?.name || "").toLowerCase());

/**
 * Two steps (client): step 1 Figma "Job-Apply" 8336:3960 — hero · Get To
 * Know · Job Description · Key Responsibilities · Language · Education ·
 * Experience, footer "Next Step"; step 2 Figma "Job-Apply" 8382:2561 — hero
 * · Submit Your Resume · questions · What Motivates You, footer "Apply Now".
 * Same header on both; back (header or gesture) on step 2 returns to step 1.
 *
 * Figma Matching/Jobs › "Job-Apply" (8336:3960). Header 100 (back · job
 * title SemiBold 20 −4%) · hero 375 · sections #121212 1pt apart: Get To
 * Know · Job Description · Key Responsibilities · Language (each required
 * language + "My Knowledge" field) · Education Requirement (degree + switch)
 * · Experience Requirement ("Do you have this experience?" switch +
 * Experience field) · Submit Your Resume (drop zone / file, Portfolio URL) ·
 * Question asked #N (0/150) · What Motivates You To Apply Here (0/1’000).
 * Floating footer: "Apply Now" 48 r100 #A19375, Medium 18 #121212.
 * The resume is pre-filled from Settings › My Documents; a file uploaded
 * here goes with this application only.
 */
// scroll to y on the ScreenWrapper's AnimatedKeyboardAwareScrollView ref —
// it only exposes scrollToPosition(x, y, animated), not scrollTo(), and
// scrollRef.current?.scrollTo?.() silently no-ops since scrollTo is undefined
const scrollRefTo = (ref, y, animated = false) => {
  try {
    const comp = ref.current;
    if (!comp) return;
    if (typeof comp.scrollTo === "function") comp.scrollTo({ y, animated });
    else if (typeof comp.scrollToPosition === "function") comp.scrollToPosition(0, y, animated);
    else if (typeof comp.getNode === "function") {
      const node = comp.getNode();
      if (typeof node?.scrollTo === "function") node.scrollTo({ y, animated });
      else if (typeof node?.scrollToPosition === "function") node.scrollToPosition(0, y, animated);
    }
  } catch (e) {
    console.log("scrollRefTo error", e);
  }
};

const JobApply = ({ route }) => {
  const navigation = useNavigation();
  const jobId = route?.params?.jobId;
  const [job, setJob] = useState(route?.params?.job || null);
  const [knowledge, setKnowledge] = useState([]);
  const [hasDegree, setHasDegree] = useState(false);
  const [hasExperience, setHasExperience] = useState(false);
  const [experience, setExperience] = useState("");
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [answers, setAnswers] = useState([]);
  const [motivation, setMotivation] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sheet, setSheet] = useState(null); // { title, options, value, onConfirm }
  const [sheetValue, setSheetValue] = useState(null);
  const scrollRef = useRef(null);
  const questionsY = useRef(0);
  const [step, setStep] = useState(1);
  const leaving = useRef(false); // set once the application is sent
  const stepFade = useRef(new Animated.Value(1)).current;

  // step change: the page cross-dissolves — it fades out where it is, the
  // step swaps and the scroll resets to the top while nothing is visible,
  // then the new step fades in (below). Blanking it instantly and jumping to
  // the top in the same frame is what read as a jerk.
  const goToStep = (next) => {
    if (next === step) return;
    Animated.timing(stepFade, { toValue: 0, duration: 140, useNativeDriver: true }).start(
      ({ finished }) => {
        if (!finished) return;
        scrollRefTo(scrollRef, 0, false);
        setStep(next);
      },
    );
  };

  // fades the step in once its content is mounted (TabFade timing)
  useEffect(() => {
    Animated.timing(stepFade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // back gesture / hardware back on step 2 → step 1, not out of the form
  useEffect(() => {
    if (step !== 2) return undefined;
    return navigation.addListener("beforeRemove", (e) => {
      if (leaving.current) return;
      e.preventDefault();
      goToStep(1);
    });
  }, [step, navigation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [jobRes, careerRes, docsRes] = await Promise.all([
          get(`jobs/${jobId}`),
          get("career/me").catch(() => null),
          get("career/documents").catch(() => null),
        ]);
        if (!alive) return;
        const data = jobRes?.data?.data;
        if (!data) throw new Error("no job");
        setJob(data);
        setAnswers((data.questions || []).map(() => ""));
        setExperience(data.experience || "");
        // "My Knowledge" starts from the levels on the user's profile
        const mine = careerRes?.data?.data?.languages || [];
        setKnowledge(
          (data.languages || []).map((l) => {
            const own = mine.find((m) => sameLanguage(m, l));
            return own && own.proficiency !== "Any" ? own.proficiency : "";
          }),
        );
        const resume = (docsRes?.data?.data || []).find(
          (d) => d.kind === "resume",
        );
        if (resume) setDocuments((cur) => (cur.length ? cur : [resume]));
      } catch (e) {
        ToastMessage("Could not load this offer", "error");
        navigation.goBack();
      }
    })();
    return () => {
      alive = false;
    };
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openSheet = (config) => {
    setSheetValue(config.value || null);
    setSheet(config);
  };

  const pickResume = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const file = await pickAndUploadPdf();
      if (file)
        setDocuments([
          { ...file, kind: "resume", createdAt: new Date().toISOString() },
        ]);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!job || sending) return;
    // every question must be answered — take the user to the questions
    if (
      (job.questions || []).some((_, i) => !String(answers[i] || "").trim())
    ) {
      setTried(true);
      ToastMessage("Please answer every question to apply", "error");
      scrollRefTo(scrollRef, Math.max(0, questionsY.current - 120), true);
      return;
    }
    try {
      setSending(true);
      const res = await post(`jobs/${job._id}/apply`, {
        answers,
        documents,
        languages: (job.languages || [])
          .map((l, i) => ({
            code: l.code,
            name: l.name,
            proficiency: knowledge[i],
          }))
          .filter((l) => l.proficiency),
        hasDegree: job.educationDegree ? hasDegree : undefined,
        hasExperience: job.experience ? hasExperience : undefined,
        experience: experience || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        motivation: motivation.trim() || undefined,
      });
      if (res?.data?.success) {
        ToastMessage("Application sent", "success");
        leaving.current = true;
        navigation.goBack();
      }
    } catch (e) {
      ToastMessage(
        e?.response?.data?.message || "Something went wrong",
        "error",
      );
    } finally {
      setSending(false);
    }
  };

  const company = companyOf(job);
  const ready = !!job?.questions;
  // Figma: step 1's last section also ends 112 above the frame bottom
  const lastOfStep1 = job?.experience
    ? "experience"
    : job?.educationDegree
      ? "education"
      : job?.languages?.length
        ? "language"
        : job?.responsibilities
          ? "responsibilities"
          : job?.description
            ? "description"
            : "about";
  const endStep1 = (key) => (lastOfStep1 === key ? styles.lastSection : undefined);

  return (
    <>
      <ScreenWrapper
        scrollEnabled
        scrollRef={scrollRef}
        paddingHorizontal={0.1}
        backgroundColor={INK}
        headerBlurColor={INK}
        headerUnScrollable={() => (
          <CareerHeader
            title={job?.title || ""}
            titleLetterSpacing={-0.8}
            onBack={step === 2 ? () => goToStep(1) : undefined}
          />
        )}
        footerUnScrollable={() =>
          ready ? (
            step === 1 ? (
              <FooterButton glass label="Next Step" onPress={() => goToStep(2)} />
            ) : (
              <FooterButton
                glass
                label="Apply Now"
                loadingLabel="Sending…"
                onPress={submit}
                loading={sending}
              />
            )
          ) : null
        }
      >
        {!ready ? (
          <DetailSkeleton />
        ) : (
          <Animated.View style={[styles.page, { opacity: stepFade }]}>
            <DetailHero {...jobHeroProps(job)} />

            <View style={styles.steps}>
            {step === 1 && (
            <>
            {!!company?.description && (
              <DetailSection title={`Get To Know ${companyName(job)}`} style={endStep1("about")}>
                <BodyText label={company.description} />
              </DetailSection>
            )}
            {!!job.description && (
              <DetailSection title="Job Description" style={endStep1("description")}>
                <BodyText label={job.description} />
              </DetailSection>
            )}
            {!!job.responsibilities && (
              <DetailSection title="Key Responsibilities" style={endStep1("responsibilities")}>
                <Bullets text={job.responsibilities} />
              </DetailSection>
            )}

            {!!job.languages?.length && (
              <DetailSection title="Language" style={endStep1("language")}>
                <View style={styles.list}>
                  {job.languages.map((l, i) => (
                    <View key={`${l.code}-${i}`} style={styles.list}>
                      {i > 0 && <View style={styles.rule} />}
                      <LanguageRow item={l} />
                      <View style={styles.fieldGroup}>
                        <FieldBox
                          label="My Knowledge"
                          value={knowledge[i]}
                          placeholder="Select your level"
                          valueLetterSpacing={0}
                          chevronColor="rgba(255, 255, 255, 0.64)"
                          onPress={() =>
                            openSheet({
                              title: "Language Proficiency",
                              options: KNOWLEDGE_LEVELS,
                              value: knowledge[i],
                              onConfirm: (v) =>
                                setKnowledge((arr) =>
                                  arr.map((x, j) => (j === i ? v || "" : x)),
                                ),
                            })
                          }
                        />
                        <HelperRow label={TIME_HELPER} letterSpacing={-0.24} />
                      </View>
                    </View>
                  ))}
                </View>
              </DetailSection>
            )}

            {!!job.educationDegree && (
              <DetailSection title="Education Requirement" titleLetterSpacing={-0.09} style={endStep1("education")}>
                <FieldBox
                  label="Education Degree"
                  value={job.educationDegree}
                  trailing="switch"
                  switchValue={hasDegree}
                  onSwitch={setHasDegree}
                  switchColor={GOLD}
                  valueLetterSpacing={0}
                />
              </DetailSection>
            )}

            {!!job.experience && (
              <DetailSection title="Experience Requirement" titleLetterSpacing={-0.09} style={endStep1("experience")}>
                <View style={styles.switchRow}>
                  <CustomText
                    label="Do you have this experience?"
                    fontSize={16}
                    fontFamily={fonts.medium}
                    color="#FFFFFF"
                    marginTop={-X(16)}
                    marginBottom={-X(16)}
                    containerStyle={styles.grow}
                  />
                  <CustomSwitch
                    value={hasExperience}
                    setValue={setHasExperience}
                    bgColor={GOLD}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <FieldBox
                    label="Experience"
                    value={experience}
                    valueLetterSpacing={0}
                    chevronColor="rgba(255, 255, 255, 0.64)"
                    onPress={() =>
                      openSheet({
                        title: "Experience",
                        options: EXPERIENCE_LEVELS,
                        value: experience,
                        onConfirm: (v) => setExperience(v || ""),
                      })
                    }
                  />
                  <HelperRow label={TIME_HELPER} letterSpacing={-0.24} />
                </View>
              </DetailSection>
            )}

            </>
            )}

            {step === 2 && (
            <>
            <View style={styles.resumeSection}>
              <CustomText
                label="Submit Your Resume"
                fontSize={18}
                letterSpacing={-0.09}
                fontFamily={fonts.medium}
                color="#FFFFFF"
                marginTop={-X(18)}
                marginBottom={-X(18)}
              />
              {documents.length ? (
                documents.map((d, i) => (
                  <DocumentRow
                    key={`${d.path || d.url}-${i}`}
                    doc={d}
                    onPress={d.url ? () => openDocument(d) : undefined}
                    onDelete={() =>
                      setDocuments((arr) => arr.filter((_, j) => j !== i))
                    }
                  />
                ))
              ) : (
                <UploadDropZone onPress={pickResume} busy={uploading} />
              )}
              <View style={styles.portfolioGroup}>
                <TextFieldBox
                  label="Portfolio URL"
                  value={portfolioUrl}
                  onChangeText={setPortfolioUrl}
                  placeholder="www.sola/portfolio.com"
                  keyboardType="url"
                  autoCapitalize="none"
                  maxLength={300}
                  valueLetterSpacing={0}
                />
                <HelperRow
                  label="Please paste the link to your direct portfolio."
                  letterSpacing={-0.24}
                />
              </View>
            </View>

            {!!job.questions?.length && (
              <View
                onLayout={(e) => (questionsY.current = e.nativeEvent.layout.y)}
                style={styles.questions}
              >
                {(job.questions || []).map((q, i) => (
                  <DetailSection
                    key={`q-${i}`}
                    title={q || `Question asked #${i + 1}`}
                  >
                    <AnswerBox
                      label="Your answer:"
                      value={answers[i] || ""}
                      editable
                      maxLength={ANSWER_MAX}
                      error={tried && !String(answers[i] || "").trim()}
                      onChangeText={(t) =>
                        setAnswers((arr) =>
                          arr.map((v, j) => (j === i ? t : v)),
                        )
                      }
                    />
                  </DetailSection>
                ))}
              </View>
            )}

            <DetailSection
              title="What Motivates You To Apply Here"
              style={styles.lastSection}
            >
              <AnswerBox
                label="Your answer:"
                value={motivation}
                editable
                maxLength={MOTIVATION_MAX}
                onChangeText={setMotivation}
              />
            </DetailSection>
            </>
            )}
            </View>
          </Animated.View>
        )}
      </ScreenWrapper>

      <JobOptionSheet
        visible={!!sheet}
        onDismiss={() => setSheet(null)}
        title={sheet?.title}
        options={sheet?.options || []}
        selected={sheetValue}
        onToggle={(v) => setSheetValue(v)}
        onConfirm={() => {
          sheet?.onConfirm?.(sheetValue);
          setSheet(null);
        }}
      />
    </>
  );
};

export default JobApply;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  page: { gap: 1, backgroundColor: SHEET_BG },
  steps: { gap: 1 },
  list: { gap: 16 },
  rule: { height: 1, backgroundColor: WHITE_4 },
  fieldGroup: { gap: 6 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 28,
  },
  resumeSection: {
    backgroundColor: INK,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 12,
  },
  portfolioGroup: { gap: 6 },
  questions: { gap: 1 },
  // Figma: last section padding-bottom 112 to the frame bottom, the 94pt
  // footer overlaps it; the scroll view already insets by the footer height
  lastSection: { paddingBottom: 112 - 94 },
});
