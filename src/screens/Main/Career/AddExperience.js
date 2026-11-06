import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomDatePicker from "../../../components/CustomDatePicker";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { del, post, put } from "../../../services/ApiRequest";
import { RATING_GROUPS, RATING_MAX, RECOMMEND_OPTIONS, ratingCount } from "../../../utils/career";
import { ToastMessage } from "../../../utils/ToastMessage";
import {
  CareerHeader,
  FieldBox,
  FooterButton,
  HelperRow,
  INK,
  LogoBox,
  MS,
  SHEET_BG,
  SectionTitle,
  SelectChip,
  WHITE_4,
  WHITE_48,
  WHITE_64,
  X,
} from "./molecules/CareerUI";

const ERROR = "#EE1045";
const DESCRIPTION_MAX = 250;

/**
 * Figma Matching › "Add-An-Experience" (8038:11420): #262626 page, #121212
 * sections 1pt apart — General (padding 16/12, gap 20: Job Title / Worked At /
 * Employment Type fields, each with a "Please pick one" helper 6 below),
 * Employment Timeline (switch field + Starting / Ending date row, gap 8),
 * Rate Your Experience (padding 12, gap 16: 48 logo, keyword groups gap 12,
 * chips 28 r100; recommend chips 32, three equal), What did This Role bring
 * you (160 textarea, "Maximum characters 0/250"), footer Continue.
 * Also edits an existing experience (route.params.item with an _id).
 */
const AddExperience = ({ route }) => {
  const navigation = useNavigation();
  const item = route?.params?.item || null;
  const isEdit = !!item?._id;

  const [title, setTitle] = useState(item?.title || "");
  const [company, setCompany] = useState(
    item?.company && typeof item.company === "object"
      ? item.company
      : item?.companyName
      ? { _id: item.company, name: item.companyName, logo: item.companyLogo }
      : null,
  );
  const [employmentType, setEmploymentType] = useState(item?.employmentType || "");
  const [current, setCurrent] = useState(item?.current ?? true);
  const [startDate, setStartDate] = useState(item?.startDate ? new Date(item.startDate) : null);
  const [endDate, setEndDate] = useState(item?.endDate ? new Date(item.endDate) : null);
  const [rating, setRating] = useState({
    environment: item?.rating?.environment || [],
    management: item?.rating?.management || [],
    career: item?.rating?.career || [],
    recommend: item?.rating?.recommend || "",
  });
  const [description, setDescription] = useState(item?.description || "");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // values picked on the Select-* screens come back through popTo(merge)
  const picked = route?.params || {};
  useEffect(() => {
    if (picked.pickedTitle) setTitle(picked.pickedTitle);
  }, [picked.pickedTitle]);
  useEffect(() => {
    if (picked.pickedCompany) setCompany(picked.pickedCompany);
  }, [picked.pickedCompany]);
  useEffect(() => {
    if (picked.pickedEmploymentType) setEmploymentType(picked.pickedEmploymentType);
  }, [picked.pickedEmploymentType]);

  const keywords = ratingCount(rating);
  const errors = useMemo(
    () => ({
      title: !title,
      company: !company,
      employmentType: !employmentType,
      startDate: !startDate,
      endDate: !current && !endDate,
    }),
    [title, company, employmentType, startDate, endDate, current],
  );
  const hasError = Object.values(errors).some(Boolean);

  const toggleKeyword = (groupKey, option) => {
    setRating((r) => {
      const list = r[groupKey] || [];
      if (list.includes(option)) return { ...r, [groupKey]: list.filter((o) => o !== option) };
      if (ratingCount(r) >= RATING_MAX) return r;
      return { ...r, [groupKey]: [...list, option] };
    });
  };

  const submit = async () => {
    setSubmitted(true);
    if (hasError) return;
    try {
      setSaving(true);
      const body = {
        title,
        company: company?._id,
        companyName: company?.name,
        employmentType,
        current,
        startDate,
        endDate: current ? null : endDate,
        location: company?.address?.city
          ? `${company.address.city}${company.address.country ? `, ${company.address.country}` : ""}`
          : item?.location || "",
        description,
        rating,
      };
      const res = isEdit ? await put(`career/experience/${item._id}`, body) : await post("career/experience", body);
      if (res?.data?.success) {
        ToastMessage(isEdit ? "Experience updated" : "Experience added", "success");
        navigation.goBack();
      }
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not save the experience", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      setSaving(true);
      const res = await del(`career/experience/${item._id}`);
      if (res?.data?.success) navigation.goBack();
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not remove the experience", "error");
    } finally {
      setSaving(false);
    }
  };

  const helper = (error, label = "Please pick one") => (
    <HelperRow label={label} color={submitted && error ? ERROR : WHITE_48} />
  );

  return (
    <ScreenWrapper
      scrollEnabled
      paddingHorizontal={0.1}
      backgroundColor={INK}
      headerBlurColor={INK}
      headerUnScrollable={() => <CareerHeader title={isEdit ? "Edit Experience" : "Add An Experience"} />}
      footerUnScrollable={() => <FooterButton label="Continue" onPress={submit} loading={saving} />}
    >
      <View style={styles.page}>
        {/* General */}
        <View style={styles.section}>
          <SectionTitle label="General" />
          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <FieldBox
                label="Job Title"
                value={title}
                placeholder="Select a job title"
                onPress={() => navigation.navigate("SelectJobTitle", { value: title, returnTo: "AddExperience" })}
              />
              {helper(errors.title)}
            </View>
            <View style={styles.fieldGroup}>
              <FieldBox
                label="Worked At"
                value={company?.name}
                placeholder="Select a company"
                leading={company ? <LogoBox uri={company.logo} name={company.name} size={14} radius={100} /> : null}
                onPress={() =>
                  navigation.navigate("SelectCompany", { kind: "company", value: company?._id, returnTo: "AddExperience" })
                }
              />
              {helper(errors.company)}
            </View>
            <View style={styles.fieldGroup}>
              <FieldBox
                label="Employment Type"
                value={employmentType}
                placeholder="Select a type"
                onPress={() =>
                  navigation.navigate("SelectEmploymentType", { value: employmentType, returnTo: "AddExperience" })
                }
              />
              {helper(errors.employmentType)}
            </View>
          </View>
        </View>

        {/* Employment Timeline */}
        <View style={styles.section}>
          <SectionTitle label="Employment Timeline" />
          <View style={styles.fields}>
            <FieldBox
              label="Currently working in this role"
              value={current ? "Yes" : "No"}
              trailing="switch"
              switchValue={current}
              onSwitch={setCurrent}
            />
            <View style={styles.dateRow}>
              <View style={styles.grow}>
                <CustomDatePicker
                  withLabel="Starting date"
                  placeholder="Select"
                  value={startDate}
                  setValue={setStartDate}
                  maxDate={current ? new Date() : endDate || new Date()}
                  leadingIcon={{ name: "event", color: "#FFFFFF" }}
                  error={submitted && errors.startDate ? "Required" : null}
                />
              </View>
              <View style={styles.grow}>
                {current ? (
                  <FieldBox
                    label="Ending date"
                    value="Present"
                    valueColor={WHITE_64}
                    valueLetterSpacing={0}
                    valueRowGap={4}
                    leading={<Icons family={MS} name="event" size={16} color={WHITE_64} />}
                    trailing="none"
                  />
                ) : (
                  <CustomDatePicker
                    withLabel="Ending date"
                    placeholder="Select"
                    value={endDate}
                    setValue={setEndDate}
                    minDate={startDate || undefined}
                    maxDate={new Date()}
                    leadingIcon={{ name: "event", color: "#FFFFFF" }}
                    error={submitted && errors.endDate ? "Required" : null}
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Rate Your Experience */}
        <View style={[styles.section, styles.rateSection]}>
          <SectionTitle label="Rate Your Experience" />
          <CustomText
            label="How would you describe your experience? Select up to 5 keywords."
            fontSize={12}
            color={WHITE_64}
            marginTop={-X(12)}
            marginBottom={-X(12)}
          />
          <LogoBox uri={company?.logo} name={company?.name} size={48} radius={12} />
          {RATING_GROUPS.map((g) => (
            <View key={g.key} style={styles.group}>
              <CustomText
                label={g.title}
                fontSize={14}
                fontFamily={fonts.medium}
                color="#FFFFFF"
                marginTop={-X(14)}
                marginBottom={-X(14)}
              />
              <View style={styles.chips}>
                {g.options.map((o) => {
                  const selected = (rating[g.key] || []).includes(o);
                  return (
                    <SelectChip
                      key={o}
                      label={o}
                      selected={selected}
                      disabled={!selected && keywords >= RATING_MAX}
                      onPress={() => toggleKeyword(g.key, o)}
                    />
                  );
                })}
              </View>
            </View>
          ))}
          <View style={styles.group}>
            <CustomText
              label="Would you recommend working there?"
              fontSize={14}
              fontFamily={fonts.medium}
              color="#FFFFFF"
              marginTop={-X(14)}
              marginBottom={-X(14)}
            />
            <View style={styles.recommendRow}>
              {RECOMMEND_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o}
                  activeOpacity={0.8}
                  onPress={() => setRating((r) => ({ ...r, recommend: r.recommend === o ? "" : o }))}
                  style={[styles.recommendChip, rating.recommend === o ? styles.chipOn : styles.chipOff]}
                >
                  <CustomText
                    label={o}
                    fontSize={12}
                    fontFamily={fonts.medium}
                    color={rating.recommend === o ? INK : WHITE_48}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* What did This Role bring you */}
        <View style={[styles.section, { gap: 12 }]}>
          <SectionTitle label="What did This Role bring you" />
          <CustomText
            label="Highlight your key achievements, skills, and what you learned through this experience."
            fontSize={12}
            color={WHITE_64}
            marginTop={-X(12)}
            marginBottom={-X(12)}
          />
          <View style={styles.fieldGroup}>
            <View style={styles.textarea}>
              <TextInput
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, DESCRIPTION_MAX))}
                placeholder="E.g. We are unveiling..."
                placeholderTextColor={WHITE_48}
                multiline
                maxLength={DESCRIPTION_MAX}
                textAlignVertical="top"
                style={styles.textareaInput}
              />
            </View>
            <HelperRow label={`Maximum characters ${description.length}/${DESCRIPTION_MAX}`} />
          </View>
          {isEdit && (
            <TouchableOpacity activeOpacity={0.7} onPress={remove} disabled={saving} style={styles.removeRow}>
              <CustomText label="Remove this experience" fontSize={14} fontFamily={fonts.medium} color={ERROR} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default AddExperience;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  // #121212 sections split by 1pt #262626 lines (Figma page fill), status
  // bar / header stay #121212
  page: { gap: 1, paddingTop: 1, paddingBottom: 1, backgroundColor: SHEET_BG },
  section: {
    backgroundColor: INK,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 20,
  },
  rateSection: { padding: 12, gap: 16 },
  fields: { gap: 8 },
  fieldGroup: { gap: 6 },
  dateRow: { flexDirection: "row", gap: 8 },
  group: { gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  recommendRow: { flexDirection: "row", gap: 4 },
  recommendChip: {
    flex: 1,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOff: { borderWidth: 1, borderColor: WHITE_4 },
  chipOn: { backgroundColor: "#FFFFFF" },
  textarea: {
    height: 160,
    borderRadius: 12,
    backgroundColor: WHITE_4,
    padding: 12,
  },
  textareaInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontFamily: fonts.regular,
    fontSize: 16,
    letterSpacing: -0.48,
    color: "#FFFFFF",
  },
  removeRow: { height: 40, alignItems: "center", justifyContent: "center" },
});
