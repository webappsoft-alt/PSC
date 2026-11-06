import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomDatePicker from "../../../components/CustomDatePicker";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { del, post, put } from "../../../services/ApiRequest";
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
  WHITE_4,
  WHITE_48,
  WHITE_64,
  X,
} from "./molecules/CareerUI";

const ERROR = "#EE1045";
const DESCRIPTION_MAX = 250;

/**
 * Add / edit an education entry — same page pattern as Add-An-Experience
 * (General: School from the directory "Select-Education" + Degree;
 * Timeline: currently studying switch + dates; description).
 */
const AddEducation = ({ route }) => {
  const navigation = useNavigation();
  const item = route?.params?.item || null;
  const isEdit = !!item?._id;

  const [school, setSchool] = useState(
    item?.institution && typeof item.institution === "object"
      ? item.institution
      : item?.school
      ? { _id: item.institution, name: item.school }
      : null,
  );
  const [degree, setDegree] = useState(item?.degree || "");
  const [current, setCurrent] = useState(item?.current ?? false);
  const [startDate, setStartDate] = useState(item?.startDate ? new Date(item.startDate) : null);
  const [endDate, setEndDate] = useState(item?.graduationDate ? new Date(item.graduationDate) : null);
  const [description, setDescription] = useState(item?.description || "");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const picked = route?.params || {};
  useEffect(() => {
    if (picked.pickedSchool) setSchool(picked.pickedSchool);
  }, [picked.pickedSchool]);
  useEffect(() => {
    if (picked.pickedDegree) setDegree(picked.pickedDegree);
  }, [picked.pickedDegree]);

  const errors = useMemo(
    () => ({ school: !school, degree: !degree, startDate: !startDate, endDate: !current && !endDate }),
    [school, degree, startDate, endDate, current],
  );
  const hasError = Object.values(errors).some(Boolean);

  const submit = async () => {
    setSubmitted(true);
    if (hasError) return;
    try {
      setSaving(true);
      const body = {
        institution: school?._id,
        school: school?.name,
        degree,
        current,
        startDate,
        graduationDate: current ? null : endDate,
        location: school?.address?.city
          ? `${school.address.city}${school.address.country ? `, ${school.address.country}` : ""}`
          : item?.location || "",
        description,
      };
      const res = isEdit ? await put(`career/education/${item._id}`, body) : await post("career/education", body);
      if (res?.data?.success) {
        ToastMessage(isEdit ? "Education updated" : "Education added", "success");
        navigation.goBack();
      }
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      setSaving(true);
      const res = await del(`career/education/${item._id}`);
      if (res?.data?.success) navigation.goBack();
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not remove", "error");
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
      headerUnScrollable={() => <CareerHeader title={isEdit ? "Edit Education" : "Add An Education"} />}
      footerUnScrollable={() => <FooterButton label="Continue" onPress={submit} loading={saving} />}
    >
      <View style={styles.page}>
        <View style={styles.section}>
          <SectionTitle label="General" />
          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <FieldBox
                label="School"
                value={school?.name}
                placeholder="Select a school"
                leading={school ? <LogoBox uri={school.logo} name={school.name} size={14} radius={100} icon="school" /> : null}
                onPress={() =>
                  navigation.navigate("SelectCompany", {
                    kind: "school",
                    value: school?._id,
                    returnTo: "AddEducation",
                    paramKey: "pickedSchool",
                  })
                }
              />
              {helper(errors.school)}
            </View>
            <View style={styles.fieldGroup}>
              <FieldBox
                label="Degree"
                value={degree}
                placeholder="Select a degree"
                onPress={() =>
                  navigation.navigate("SelectJobTitle", {
                    value: degree,
                    returnTo: "AddEducation",
                    paramKey: "pickedDegree",
                    placeholder: "Search a degree...",
                    mode: "degree",
                  })
                }
              />
              {helper(errors.degree)}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle label="Timeline" />
          <View style={styles.fields}>
            <FieldBox
              label="Currently studying there"
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
                    leadingIcon={{ name: "event", color: "#FFFFFF" }}
                    error={submitted && errors.endDate ? "Required" : null}
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { gap: 12 }]}>
          <SectionTitle label="What did you learn there" />
          <CustomText
            label="Highlight your key achievements, skills, and what you learned through this education."
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
                placeholder="E.g. Graduated with honours..."
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
              <CustomText label="Remove this education" fontSize={14} fontFamily={fonts.medium} color={ERROR} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default AddEducation;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  // #121212 sections split by 1pt #262626 lines (Figma page fill), status
  // bar / header stay #121212
  page: { gap: 1, paddingTop: 1, paddingBottom: 1, backgroundColor: SHEET_BG },
  section: { backgroundColor: INK, paddingVertical: 16, paddingHorizontal: 12, gap: 20 },
  fields: { gap: 8 },
  fieldGroup: { gap: 6 },
  dateRow: { flexDirection: "row", gap: 8 },
  textarea: { height: 160, borderRadius: 12, backgroundColor: WHITE_4, padding: 12 },
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
