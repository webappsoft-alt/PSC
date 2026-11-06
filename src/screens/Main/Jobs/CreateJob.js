import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import fonts from "../../../assets/fonts";
import CustomModalGooglePlaces from "../../../components/CustomModalGooglePlaces";
import CustomText from "../../../components/CustomText";
import FlagImage from "../../../components/FlagImage";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { patch, post, put } from "../../../services/ApiRequest";
import {
  APPLICATION_RANGES,
  CONTRACT_TYPES,
  CURRENCIES,
  EDUCATION_DEGREES,
  EXPERIENCE_LEVELS,
  JOB_TOPICS,
  PAYMENT_TERMS,
  PRIVACY_OPTIONS,
  WORK_ARRANGEMENTS,
  currencyFlag,
} from "../../../utils/career";
import { COUNTRIES } from "../../../utils/COUNTRIES";
import { LANGUAGE_PROFICIENCIES } from "../../../utils/languages";
import { nichesForIndustries } from "../../../utils/matchingFilters";
import { awaitPick } from "../../../utils/pickerBus";
import { ToastMessage } from "../../../utils/ToastMessage";
import { GlassFill } from "../BandMateMatching/molecules/matchLayout";
import {
  CareerHeader,
  FieldBox,
  GOLD,
  HelperRow,
  INK,
  LogoBox,
  MS,
  MSF,
  TextFieldBox,
  WHITE_4,
  WHITE_48,
  WHITE_64,
  WHITE_8,
  X,
} from "../Career/molecules/CareerUI";
import { AnswerBox } from "./JobDetail";
import JobOptionSheet from "./molecules/JobOptionSheet";
import { LanguageValue } from "./molecules/LanguageSheet";

const ERROR = "#EE1045";
const TITLE_MAX = 60;
const TEXT_MAX = 500;
const QUESTION_MAX = 100;
const QUESTIONS = 3;

const countryCode = (name) => {
  const v = String(name || "").trim().toLowerCase();
  if (!v) return "";
  if (v.length === 2) return v.toUpperCase();
  const c = COUNTRIES.find((x) => x.name.toLowerCase() === v) || COUNTRIES.find((x) => v.includes(x.name.toLowerCase()));
  return c?.code || "";
};
const workModeLabel = (v) => WORK_ARRANGEMENTS.find((w) => w.value === v)?.label || "";

/** Figma section title Medium 18 −0.5% (13 trimmed); `icon` = 16 glyph + 4 */
const Title = ({ label, icon }) =>
  icon ? (
    <View style={styles.iconTitle}>
      <Icons family={MSF} name={icon} size={16} color="#FFFFFF" />
      <CustomText label={label} fontSize={18} letterSpacing={-0.09} fontFamily={fonts.medium} color="#FFFFFF" marginTop={-X(18)} marginBottom={-X(18)} />
    </View>
  ) : (
    <CustomText label={label} fontSize={18} letterSpacing={-0.09} fontFamily={fonts.medium} color="#FFFFFF" marginTop={-X(18)} marginBottom={-X(18)} />
  );

const Line = () => <View style={styles.line} />;

/** Field box + 8 + helper row (Figma 76 groups) */
const Group = ({ children, helper, error }) => (
  <View style={styles.group}>
    {children}
    {!!helper && <HelperRow label={helper} letterSpacing={-0.24} color={error ? ERROR : WHITE_48} />}
  </View>
);

/** Figma 171.5 × 56 date box: label · 16 `event` + date Medium 16 */
const DateBox = ({ label, value, onPress }) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.dateBox}>
    <GlassFill borderRadius={12} />
    <CustomText label={label} fontSize={12} fontFamily={fonts.medium} textTransform="uppercase" color={WHITE_64} marginTop={(8 - 16.8) / 2} marginBottom={(8 - 16.8) / 2} />
    <View style={styles.dateRow}>
      <Icons family={MS} name="event" size={16} color="#FFFFFF" />
      <CustomText
        label={value ? moment(value).format("MMM D, YYYY") : "Select"}
        fontSize={16}
        fontFamily={fonts.medium}
        color={value ? "#FFFFFF" : WHITE_48}
        marginTop={(11 - 22.4) / 2}
        marginBottom={(11 - 22.4) / 2}
      />
    </View>
  </TouchableOpacity>
);

/**
 * Figma Matching/Jobs › "Create-a-Job" (8265:8379), step 1 of 2. Page
 * #121212. Header 116: back (40, white 8%) · 16 · "New Job Offer" SemiBold
 * 20 −0.5%; 4pt progress bars (gap 4, white / white 4%). Content 12 in, 16
 * below the header, gap 32: "Let’s build a Successful Job Offer" SemiBold 24
 * −2% + subtitle Regular 14 −2% white 64% (gap 12) · form (gap 12, sections
 * split by 1pt white 4%): General Details · Skills · Time Period · Payment ·
 * applicants / range · Privacy. Footer 150 (padding 12/12/34, gap 8):
 * Continue (48 #A19375, Medium 18) + Save As Draft (white 4%).
 * Step 2 (Questions) is not in the Figma yet: it reuses the step-1 pieces.
 */
const CreateJob = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const job = route?.params?.job || null;
  const isEdit = !!job?._id;

  const [step, setStep] = useState(1);
  // client request: pick the hiring company from the directory (optional —
  // the backend falls back to the poster's company)
  const [company, setCompany] = useState(() =>
    job?.company && typeof job.company === "object"
      ? job.company
      : job?.companyName
        ? { _id: job.company, name: job.companyName, logo: job.companyLogo }
        : null,
  );
  const pickedCompany = route?.params?.pickedCompany;
  useEffect(() => {
    if (pickedCompany) setCompany(pickedCompany);
  }, [pickedCompany]);
  const [workMode, setWorkMode] = useState(job?.workMode || "");
  const [location, setLocation] = useState({ city: job?.location?.city || "", country: job?.location?.country || "" });
  const [topic, setTopic] = useState(job?.topic || "");
  const [field, setField] = useState(job?.field || "");
  const [title, setTitle] = useState(job?.title || "");
  const [description, setDescription] = useState(job?.description || "");
  const [responsibilities, setResponsibilities] = useState(job?.responsibilities || "");
  const [educationDegree, setEducationDegree] = useState(job?.educationDegree || "");
  const [experience, setExperience] = useState(job?.experience || "");
  const [languages, setLanguages] = useState(job?.languages?.length ? job.languages : [{ code: "", proficiency: "Elementary" }]);
  const [determined, setDetermined] = useState(!!job?.timePeriod?.determined);
  const [start, setStart] = useState(job?.timePeriod?.start ? new Date(job.timePeriod.start) : new Date());
  const [end, setEnd] = useState(job?.timePeriod?.end ? new Date(job.timePeriod.end) : moment().add(1, "month").toDate());
  const [employmentType, setEmploymentType] = useState(job?.employmentType || "");
  const [currency, setCurrency] = useState(job?.salary?.currency || "USD");
  const [salary, setSalary] = useState(job?.salary?.max != null ? String(job.salary.max) : "");
  const [paymentTerms, setPaymentTerms] = useState(job?.paymentTerms || "");
  const [maxApplicants, setMaxApplicants] = useState(job?.maxApplicants ? String(job.maxApplicants) : "");
  const [applicationRange, setApplicationRange] = useState(job?.applicationRange || "");
  const [privacy, setPrivacy] = useState(job?.privacy || "Public");
  const [questions, setQuestions] = useState(() => Array.from({ length: QUESTIONS }, (_, i) => job?.questions?.[i] || ""));
  const [sheet, setSheet] = useState(null); // { key, title, subtitle, options, value, clear, onConfirm }
  const [sheetValue, setSheetValue] = useState(null);
  const [places, setPlaces] = useState(false);
  const [dateFor, setDateFor] = useState(null); // "start" | "end"
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = useMemo(
    () => ({ workMode: !workMode, location: !location.city && !location.country, topic: !topic, title: !title.trim(), employmentType: !employmentType }),
    [workMode, location, topic, title, employmentType],
  );
  const hasError = Object.values(errors).some(Boolean);
  const err = (k) => submitted && errors[k];

  const openSheet = (config) => {
    setSheetValue(config.value ?? null);
    setSheet(config);
  };

  const pickLanguage = (index) => {
    awaitPick("language", (lang) =>
      setLanguages((list) => list.map((l, i) => (i === index ? { ...l, code: lang.code, name: lang.name } : l))),
    );
    navigation.navigate("Language", { pick: true, value: languages[index]?.code });
  };

  const body = (status) => ({
    ...(company ? { company: company._id, companyName: company.name } : {}),
    title: title.trim(),
    workMode: workMode || undefined,
    location,
    topic: topic || undefined,
    field,
    description,
    responsibilities,
    educationDegree,
    experience,
    languages: languages.filter((l) => l.code),
    timePeriod: determined ? { determined: true, start, end } : { determined: false },
    employmentType: employmentType || undefined,
    salary: salary ? { min: Number(salary), max: Number(salary), currency, period: "Yearly" } : undefined,
    paymentTerms,
    maxApplicants: maxApplicants ? Number(maxApplicants) : null,
    applicationRange: applicationRange || "Global",
    privacy,
    questions: questions.map((q) => q.trim()).filter(Boolean),
    ...(status ? { status } : {}),
  });

  const save = async (status) => {
    if (status !== "draft") {
      setSubmitted(true);
      if (hasError) {
        setStep(1);
        ToastMessage("Please complete the highlighted fields", "error");
        return;
      }
    } else if (!title.trim()) {
      setSubmitted(true);
      ToastMessage("Add a job title to save a draft", "error");
      return;
    }
    try {
      setSaving(true);
      const payload = body(status);
      const res = isEdit ? await put(`jobs/${job._id}`, payload) : await post("jobs", payload);
      // publishing a saved draft
      if (res?.data?.success && isEdit && job.status === "draft" && status !== "draft") {
        await patch(`jobs/${job._id}/status`, { status: "active" });
      }
      if (res?.data?.success) {
        ToastMessage(status === "draft" ? "Draft saved" : isEdit ? "Offer updated" : "Offer published", "success");
        navigation.goBack();
      }
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not save the offer", "error");
    } finally {
      setSaving(false);
    }
  };

  const onContinue = () => {
    if (step === 1) {
      setSubmitted(true);
      if (hasError) {
        ToastMessage("Please complete the highlighted fields", "error");
        return;
      }
      setStep(2);
      return;
    }
    save();
  };

  const niches = nichesForIndustries(topic ? [topic] : []);

  return (
    <>
      <ScreenWrapper
        scrollEnabled
        paddingHorizontal={0.1}
        backgroundColor={INK}
        headerBlurColor={INK}
        headerUnScrollable={() => (
          <View style={styles.header}>
            <CareerHeader
              title={isEdit ? "Edit Job Offer" : "New Job Offer"}
              gap={16}
              backFill={WHITE_8}
              onBack={() => (step === 2 ? setStep(1) : navigation.goBack())}
            />
            <View style={styles.progress}>
              <View style={[styles.bar, styles.barOn]} />
              <View style={[styles.bar, step === 2 ? styles.barOn : styles.barOff]} />
            </View>
          </View>
        )}
        footerUnScrollable={() => (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {/* Figma "Frame 10": white 1% + background blur 16 over the form */}
            <GlassFill borderRadius={0} fill="rgba(255, 255, 255, 0.01)" blurAmount={16} />
            <TouchableOpacity activeOpacity={0.8} disabled={saving} onPress={onContinue} style={[styles.cta, styles.ctaGold, saving && styles.dim]}>
              <CustomText label={step === 1 ? "Continue" : isEdit ? "Save" : "Publish"} fontSize={18} fontFamily={fonts.medium} color={INK} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} disabled={saving} onPress={() => save("draft")} style={[styles.cta, saving && styles.dim]}>
              <GlassFill borderRadius={100} />
              <CustomText label="Save As Draft" fontSize={18} fontFamily={fonts.medium} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      >
        <View style={styles.content}>
          <View style={styles.intro}>
            <CustomText
              label={step === 1 ? "Let’s build a Successful Job Offer" : "Questions for candidates"}
              fontSize={24}
              letterSpacing={-0.48}
              fontFamily={fonts.semiBold}
              color="#FFFFFF"
              marginTop={-X(24)}
              marginBottom={-X(24)}
            />
            <CustomText
              label={step === 1 ? "Tell us more about the new position." : "Ask up to 3 questions. Candidates answer them when they apply."}
              fontSize={14}
              letterSpacing={-0.28}
              color={WHITE_64}
              marginTop={-X(14)}
              marginBottom={-X(14)}
            />
          </View>

          {step === 2 ? (
            <View style={styles.form}>
              {questions.map((q, i) => (
                <AnswerBox
                  key={`q-${i}`}
                  label={`Question #${i + 1}`}
                  value={q}
                  editable
                  maxLength={QUESTION_MAX}
                  placeholder="Ask your question..."
                  onChangeText={(t) => setQuestions((list) => list.map((v, j) => (j === i ? t : v)))}
                />
              ))}
            </View>
          ) : (
            <View style={styles.form}>
              {/* General Details */}
              <View style={styles.section}>
                <Title label="General Details" />
                <View style={styles.fields16}>
                  <Group helper="The company hiring for this position.">
                    <FieldBox
                      chevronColor={WHITE_64}
                      label="Company"
                      value={company?.name || ""}
                      placeholder="Select a company"
                      leading={company ? <LogoBox uri={company.logo} name={company.name} size={12} radius={100} /> : null}
                      valueRowGap={4}
                      valueLetterSpacing={0}
                      onPress={() =>
                        navigation.navigate("SelectCompany", {
                          returnTo: "CreateJob",
                          paramKey: "pickedCompany",
                          value: company?._id,
                        })
                      }
                    />
                  </Group>
                  <Group helper="Choose the most relevant option." error={err("workMode")}>
                    <FieldBox
                      chevronColor={WHITE_64}
                      label="Location Based"
                      value={workModeLabel(workMode)}
                      valueLetterSpacing={0}
                      onPress={() =>
                        openSheet({
                          title: "Location-Based",
                          options: WORK_ARRANGEMENTS,
                          value: workMode,
                          onConfirm: (v) => v && setWorkMode(v),
                        })
                      }
                    />
                  </Group>
                  <Group helper="Where" error={err("location")}>
                    <FieldBox
                      chevronColor={WHITE_64}
                      label="Based In"
                      value={[location.country, location.city].filter(Boolean).join(" ") || ""}
                      placeholder="Select an address"
                      leading={location.country ? <FlagImage code={location.country} size={12} /> : null}
                      valueRowGap={4}
                      valueLetterSpacing={0}
                      onPress={() => setPlaces(true)}
                    />
                  </Group>
                  <Group helper="Choose the most relevant industry" error={err("topic")}>
                    <FieldBox
                      chevronColor={WHITE_64}
                      label="Industry"
                      value={topic}
                      valueLetterSpacing={0}
                      onPress={() =>
                        openSheet({
                          title: "Industry",
                          options: JOB_TOPICS,
                          value: topic,
                          onConfirm: (v) => {
                            if (!v) return;
                            if (v !== topic) setField("");
                            setTopic(v);
                          },
                        })
                      }
                    />
                  </Group>
                  <Group helper="Choose the most relevant industry">
                    <FieldBox
                      chevronColor={WHITE_64}
                      label="Field"
                      value={field}
                      placeholder={topic ? "Select" : "Pick an industry first"}
                      valueLetterSpacing={0}
                      onPress={() =>
                        niches.length &&
                        openSheet({ title: "Field", options: niches, value: field, onConfirm: (v) => v && setField(v) })
                      }
                    />
                  </Group>
                  <Group helper={`${title.length}/${TITLE_MAX} characters.`} error={err("title")}>
                    <TextFieldBox label="Job Title" value={title} onChangeText={setTitle} placeholder="UI/UX Designer" maxLength={TITLE_MAX} />
                  </Group>
                  <AnswerBox label="Job Description" value={description} editable maxLength={TEXT_MAX} onChangeText={setDescription} />
                  <AnswerBox label="Key Responsibilities" value={responsibilities} editable maxLength={TEXT_MAX} onChangeText={setResponsibilities} />
                </View>
              </View>
              <Line />

              {/* Skills */}
              <View style={styles.section}>
                <Title label="Skills" icon="location_on" />
                <View style={styles.fields8}>
                  <FieldBox
                    chevronColor={WHITE_64}
                    label="Education Degree"
                    value={educationDegree}
                    valueLetterSpacing={0}
                    onPress={() =>
                      openSheet({ title: "Education Degree", options: EDUCATION_DEGREES, value: educationDegree, onConfirm: (v) => setEducationDegree(v || "") })
                    }
                  />
                  <FieldBox
                    chevronColor={WHITE_64}
                    label="Experience"
                    value={experience}
                    valueLetterSpacing={0}
                    onPress={() => openSheet({ title: "Experience", options: EXPERIENCE_LEVELS, value: experience, onConfirm: (v) => setExperience(v || "") })}
                  />
                  <Line />
                  <View style={styles.fields12}>
                    {languages.map((l, i) => (
                      <View key={`lang-${i}`} style={styles.fields12}>
                        {i > 0 && <Line />}
                        <View style={styles.fields8}>
                          <Group helper="Select a language candidates need.">
                            <LanguageValue code={l.code} onPress={() => pickLanguage(i)} />
                          </Group>
                          <FieldBox
                            chevronColor={WHITE_64}
                            label="Language Proficiency"
                            value={l.proficiency}
                            valueLetterSpacing={0}
                            onPress={() =>
                              openSheet({
                                title: "Language Proficiency",
                                options: LANGUAGE_PROFICIENCIES,
                                value: l.proficiency,
                                onConfirm: (v) => v && setLanguages((list) => list.map((x, j) => (j === i ? { ...x, proficiency: v } : x))),
                              })
                            }
                          />
                          {i > 0 && (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => setLanguages((list) => list.filter((_, j) => j !== i))}
                              style={styles.removeBar}
                              accessibilityLabel="Remove language"
                            >
                              <Icons family={MSF} name="delete_forever" size={20} color={ERROR} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                  <Line />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setLanguages((list) => [...list, { code: "", proficiency: "Elementary" }])}
                    style={styles.addLanguage}
                  >
                    <GlassFill borderRadius={12} />
                    <Icons family={MS} name="add" size={20} color="#FFFFFF" />
                    <CustomText label="Add A Language" fontSize={14} fontFamily={fonts.medium} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              <Line />

              {/* Time Period */}
              <View style={styles.section}>
                <Title label="Time Period" />
                <View style={styles.segmented}>
                  <GlassFill borderRadius={100} />
                  {[
                    ["Undetermined", false],
                    ["Determined", true],
                  ].map(([label, v]) => (
                    <TouchableOpacity key={label} activeOpacity={0.8} onPress={() => setDetermined(v)} style={[styles.segment, determined === v && styles.segmentOn]}>
                      <CustomText label={label} fontSize={14} fontFamily={fonts.medium} color={determined === v ? INK : WHITE_48} />
                    </TouchableOpacity>
                  ))}
                </View>
                {determined && (
                  <View style={styles.dates}>
                    <DateBox label="Starting Date" value={start} onPress={() => setDateFor("start")} />
                    <DateBox label="Ending Date" value={end} onPress={() => setDateFor("end")} />
                  </View>
                )}
              </View>
              <Line />

              {/* Payment */}
              <View style={styles.section}>
                <Title label="Payment" icon="location_on" />
                <View style={styles.fields12}>
                  <Group helper="Choose the most relevant option." error={err("employmentType")}>
                    <FieldBox
                      chevronColor={WHITE_64}
                      label="Contract Type"
                      value={employmentType}
                      valueLetterSpacing={0}
                      onPress={() =>
                        openSheet({ title: "Contract Types", options: CONTRACT_TYPES, value: employmentType, onConfirm: (v) => v && setEmploymentType(v) })
                      }
                    />
                  </Group>
                  <Group helper="Tap the currency to change it.">
                    <View style={styles.salaryBox}>
                      <View style={styles.salaryColumn}>
                        <CustomText label="Salary (Yearly)" fontSize={12} fontFamily={fonts.medium} textTransform="uppercase" color={WHITE_64} marginTop={(8 - 16.8) / 2} marginBottom={(8 - 16.8) / 2} />
                        <View style={styles.salaryRow}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.currency}
                            onPress={() => openSheet({ title: "Currency", options: CURRENCIES, value: currency, onConfirm: (v) => v && setCurrency(v) })}
                          >
                            <FlagImage code={currencyFlag(currency)} size={12} />
                            <CustomText label={currency} fontSize={16} fontFamily={fonts.medium} color="#FFFFFF" marginTop={(11 - 22.4) / 2} marginBottom={(11 - 22.4) / 2} />
                          </TouchableOpacity>
                          <TextInput
                            value={salary}
                            onChangeText={(t) => setSalary(t.replace(/[^0-9]/g, ""))}
                            keyboardType="number-pad"
                            placeholder="$4,500.00"
                            placeholderTextColor={WHITE_48}
                            style={styles.salaryInput}
                          />
                        </View>
                      </View>
                      <Icons family={MS} name="chevron_right" size={24} color={WHITE_64} />
                    </View>
                  </Group>
                  <Group helper="How often the salary is paid.">
                    <FieldBox
                      chevronColor={WHITE_64}
                      label="Payment Terms"
                      value={paymentTerms}
                      valueLetterSpacing={0}
                      onPress={() => openSheet({ title: "Payment Terms", options: PAYMENT_TERMS, value: paymentTerms, onConfirm: (v) => setPaymentTerms(v || "") })}
                    />
                  </Group>
                </View>
              </View>
              <Line />

              <View style={styles.fields16}>
                <Group helper="Set a limit for ease of management.">
                  <TextFieldBox
                    label="Set Maximum Applicants"
                    value={maxApplicants}
                    onChangeText={(t) => setMaxApplicants(t.replace(/[^0-9]/g, ""))}
                    placeholder="200"
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </Group>
                <Group helper="Choose the most relevant option.">
                  <FieldBox
                    chevronColor={WHITE_64}
                    label="Range Of Application"
                    value={applicationRange}
                    valueLetterSpacing={0}
                    onPress={() =>
                      openSheet({
                        title: "Range of Application",
                        subtitle: "Find the perfect fit for you!",
                        options: APPLICATION_RANGES,
                        value: applicationRange,
                        clear: true,
                        onConfirm: (v) => setApplicationRange(v || ""),
                      })
                    }
                  />
                </Group>
              </View>
              <Line />

              <FieldBox
                chevronColor={WHITE_64}
                label="Privacy"
                value={privacy}
                valueLetterSpacing={0}
                onPress={() => openSheet({ title: "Privacy", options: PRIVACY_OPTIONS, value: privacy, onConfirm: (v) => v && setPrivacy(v) })}
              />
            </View>
          )}
          <View style={styles.footerSpace} />
        </View>
      </ScreenWrapper>

      <JobOptionSheet
        visible={!!sheet}
        onDismiss={() => setSheet(null)}
        title={sheet?.title}
        subtitle={sheet?.subtitle}
        options={sheet?.options || []}
        selected={sheetValue}
        onToggle={(v) => setSheetValue(v)}
        onClear={sheet?.clear ? () => setSheetValue(null) : undefined}
        onConfirm={() => {
          sheet?.onConfirm?.(sheetValue);
          setSheet(null);
        }}
      />

      <CustomModalGooglePlaces
        isVisible={places}
        onClose={() => setPlaces(false)}
        onLocationSelect={(loc) => {
          setPlaces(false);
          setLocation({ city: loc?.city || loc?.address || "", country: countryCode(loc?.country) });
        }}
      />

      {!!dateFor && (
        <DatePicker
          modal
          open
          mode="date"
          date={dateFor === "start" ? start : end}
          minimumDate={dateFor === "end" ? start : undefined}
          onConfirm={(d) => {
            if (dateFor === "start") {
              setStart(d);
              if (end < d) setEnd(moment(d).add(1, "month").toDate());
            } else setEnd(d);
            setDateFor(null);
          }}
          onCancel={() => setDateFor(null)}
          theme="dark"
          buttonColor={GOLD}
          confirmButtonColor={GOLD}
        />
      )}
    </>
  );
};

export default CreateJob;

const styles = StyleSheet.create({
  dim: { opacity: 0.5 },
  header: { paddingBottom: 8 },
  // Figma: 12 below the back row, two 4pt bars (gap 4)
  progress: { flexDirection: "row", gap: 4, paddingHorizontal: 12, marginTop: 12 - 8 },
  bar: { flex: 1, height: 4, borderRadius: 100 },
  barOn: { backgroundColor: "#FFFFFF" },
  barOff: { backgroundColor: WHITE_4 },
  content: { paddingHorizontal: 12, paddingTop: 16, gap: 32 },
  intro: { gap: 12 },
  form: { gap: 12 },
  section: { gap: 16 },
  iconTitle: { flexDirection: "row", alignItems: "center", gap: 4, height: 16 },
  line: { height: 1, backgroundColor: WHITE_4 },
  group: { gap: 8 },
  fields16: { gap: 16 },
  fields12: { gap: 12 },
  fields8: { gap: 8 },
  removeBar: { height: 32, borderRadius: 8, backgroundColor: "rgba(238, 16, 69, 0.16)", alignItems: "center", justifyContent: "center" },
  addLanguage: { height: 40, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden" },
  segmented: { height: 40, borderRadius: 100, padding: 4, gap: 4, flexDirection: "row", overflow: "hidden" },
  segment: { flex: 1, height: 32, borderRadius: 100, alignItems: "center", justifyContent: "center" },
  segmentOn: { backgroundColor: "#FFFFFF" },
  dates: { flexDirection: "row", gap: 8 },
  dateBox: { flex: 1, height: 56, borderRadius: 12, padding: 12, gap: 10, overflow: "hidden" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, height: 16 },
  salaryBox: { height: 56, borderRadius: 12, padding: 12, backgroundColor: WHITE_4, flexDirection: "row", alignItems: "center", gap: 10 },
  salaryColumn: { flex: 1, gap: 10 },
  salaryRow: { flexDirection: "row", alignItems: "center", gap: 4, height: 12 },
  currency: { flexDirection: "row", alignItems: "center", gap: 4 },
  salaryInput: { flex: 1, padding: 0, height: 22, marginVertical: -5, fontFamily: fonts.medium, fontSize: 16, color: "#FFFFFF" },
  footer: { paddingTop: 12, paddingHorizontal: 12, gap: 8, overflow: "hidden" },
  cta: { height: 48, borderRadius: 100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  ctaGold: { backgroundColor: GOLD },
  footerSpace: { height: 24 },
});
