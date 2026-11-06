import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { get, post, put } from "../../../../services/ApiRequest";
import {
  companyLogo,
  companyName,
  formatDateRange,
  formatDuration,
  schoolLogo,
  schoolName,
} from "../../../../utils/career";
import { ToastMessage } from "../../../../utils/ToastMessage";
import {
  Dot,
  LogoBox,
  MS,
  MSF,
  WHITE_4,
  WHITE_48,
  WHITE_64,
  X,
} from "../../Career/molecules/CareerUI";
import { LanguageRow } from "../../Jobs/JobDetail";
import LanguageSheet from "../../Jobs/molecules/LanguageSheet";
import { CareerSkeleton } from "../../Jobs/molecules/JobSkeletons";

/**
 * Profile › "Career" tab (Figma Profile-Premium+ 8030:10693 own / edit view,
 * 8038:12532 visitor view). Sections on #121212 split by 1px white 4%:
 * own view padding 16 gap 16 (title row 16 + "EDIT / DONE ✓"), visitor view
 * padding 16 gap 24. Item: 32 logo · 8 · column (title Medium 14 −4%,
 * company Medium 16 −0.5, dates Medium 14 −4% white 48% • 3px dot • duration,
 * `location_on` 12 + place) — visitor items end with a 32 circle thumbs-up
 * ("verify this experience") and "N Verified this experience".
 */
const TEXT_14 = { fontSize: 14, letterSpacing: -0.56, fontFamily: fonts.medium };

const SectionHeader = ({ title, isOwner, editing, onToggle }) => (
  <View style={styles.titleRow}>
    <CustomText
      label={title}
      fontSize={18}
      letterSpacing={-0.09}
      fontFamily={fonts.medium}
      color="#FFFFFF"
      marginTop={-X(18) + (16 - 13) / 2}
      marginBottom={-X(18) + (16 - 13) / 2}
      containerStyle={styles.grow}
    />
    {isOwner && (
      <TouchableOpacity activeOpacity={0.7} onPress={onToggle} hitSlop={8} style={styles.editBtn}>
        <CustomText
          label={editing ? "DONE" : "EDIT"}
          fontSize={12}
          fontFamily={fonts.semiBold}
          color={WHITE_64}
          marginTop={-X(12) + (16 - 8) / 2}
          marginBottom={-X(12) + (16 - 8) / 2}
        />
        <Icons family={MSF} name={editing ? "check" : "edit"} size={16} color="#FFFFFF" />
      </TouchableOpacity>
    )}
  </View>
);

/** 32 circle: white 4% idle, white when the viewer verified / in edit mode */
const Circle = ({ icon, active, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    hitSlop={6}
    style={[styles.circle, { backgroundColor: active ? "#FFFFFF" : WHITE_4 }]}
  >
    <Icons family={MSF} name={icon} size={16} color={active ? "#121212" : "#FFFFFF"} />
  </TouchableOpacity>
);

const VerifiedRow = ({ verifiedBy = [] }) => {
  if (!verifiedBy.length) return null;
  return (
    <View style={styles.verifiedRow}>
      <View style={styles.avatarStack}>
        {verifiedBy.slice(0, 3).map((u, i) => (
          <View
            key={u?._id || i}
            style={[
              styles.miniAvatar,
              { marginLeft: i === 0 ? 0 : -4, backgroundColor: u?.profile?.profileColor || WHITE_4 },
            ]}
          >
            {!!u?.profile?.avatar && (
              <ImageFast source={{ uri: u.profile.avatar }} style={styles.miniAvatarImg} />
            )}
          </View>
        ))}
      </View>
      <CustomText
        label={String(verifiedBy.length)}
        fontSize={12}
        letterSpacing={-0.12}
        fontFamily={fonts.medium}
        color="#FFFFFF"
        marginTop={-X(12)}
        marginBottom={-X(12)}
      />
      <CustomText
        label="Verified this experience"
        fontSize={12}
        letterSpacing={-0.24}
        color={WHITE_48}
        marginTop={-X(12)}
        marginBottom={-X(12)}
      />
    </View>
  );
};

// `variant="candidate"`: Figma job candidate profile (8265:8152) — no circle,
// description Medium 14 −4%, verified row shown
export const Item = ({ logo, title, subtitle, dateRange, duration, location, description, verifiedBy, isOwner, editing, verified, onCircle, variant }) => {
  const candidate = variant === "candidate";
  const ownText = isOwner || candidate;
  return (
  <View style={styles.itemRow}>
    <LogoBox uri={logo} name={subtitle} size={32} radius={0} />
    <View style={[styles.itemColumn, (isOwner && !editing) || candidate ? null : styles.itemColumnNarrow]}>
      <View style={styles.infoBlock}>
        <CustomText label={title} {...TEXT_14} color="#FFFFFF" marginTop={-X(14)} marginBottom={-X(14)} />
        <CustomText
          label={subtitle}
          fontSize={16}
          letterSpacing={-0.5}
          fontFamily={fonts.medium}
          color="#FFFFFF"
          marginTop={-X(16)}
          marginBottom={-X(16)}
        />
        {!!dateRange && (
          <View style={styles.metaRow}>
            <CustomText label={dateRange} {...TEXT_14} color={WHITE_48} marginTop={-X(14)} marginBottom={-X(14)} />
            {!!duration && (
              <>
                <Dot />
                <CustomText label={duration} {...TEXT_14} color={WHITE_48} marginTop={-X(14)} marginBottom={-X(14)} />
              </>
            )}
          </View>
        )}
        {!!location && (
          <View style={styles.locationRow}>
            <Icons family={MSF} name="location_on" size={12} color={WHITE_48} />
            <CustomText label={location} {...TEXT_14} color={WHITE_48} marginTop={-X(14)} marginBottom={-X(14)} />
          </View>
        )}
      </View>
      {!!description && (
        <CustomText
          label={description}
          fontSize={ownText ? 14 : 12}
          letterSpacing={ownText ? -0.56 : -0.24}
          fontFamily={ownText ? fonts.medium : fonts.regular}
          color={WHITE_48}
          marginTop={-X(ownText ? 14 : 12)}
          marginBottom={-X(ownText ? 14 : 12)}
        />
      )}
      {!isOwner && <VerifiedRow verifiedBy={verifiedBy} />}
    </View>
    {!isOwner && !candidate && <Circle icon="thumb_up" active={verified} onPress={onCircle} />}
    {isOwner && editing && <Circle icon="edit" active onPress={onCircle} />}
  </View>
  );
};

const AddRow = ({ label, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.addRow}>
    <View style={styles.addBox}>
      <Icons family={MS} name="add" size={16} color="#FFFFFF" />
    </View>
    <CustomText label={label} {...TEXT_14} color="#FFFFFF" />
  </TouchableOpacity>
);

const Skills = ({ skills = [], isOwner, onAdd }) => (
  <View style={[styles.section, { gap: isOwner ? 16 : 24 }]}>
    <CustomText
      label="Skills"
      fontSize={18}
      letterSpacing={-0.09}
      fontFamily={fonts.medium}
      color="#FFFFFF"
      marginTop={-X(18)}
      marginBottom={-X(18)}
    />
    <View style={styles.chips}>
      {skills.map((s) => (
        <View key={s} style={[styles.chip, isOwner ? styles.chipOwn : styles.chipVisitor]}>
          <CustomText label={s} fontSize={12} fontFamily={fonts.medium} color={WHITE_48} />
        </View>
      ))}
      {isOwner && (
        <TouchableOpacity activeOpacity={0.7} onPress={onAdd} style={[styles.chip, styles.chipOwn, styles.chipAdd]}>
          <Icons family={MS} name="add" size={12} color={WHITE_48} />
          <CustomText label="Add Skill" fontSize={12} fontFamily={fonts.medium} color={WHITE_48} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const CareerTab = ({ userId, isOwner, viewerId }) => {
  const navigation = useNavigation();
  const [career, setCareer] = useState(null);
  const [editing, setEditing] = useState({});
  // Figma Profile-Premium+ "Language" (8265:9227): null | { index } (index −1 = new)
  const [langSheet, setLangSheet] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await get(isOwner ? "career/me" : `career/user/${userId}`);
      if (res?.data?.success) setCareer(res.data.data);
    } catch (e) {
      console.log("career load error", e);
    }
  }, [isOwner, userId]);

  // (re)load when the tab shows and after Add / Edit screens pop back
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleVerify = async (kind, item) => {
    try {
      const res = await post(`career/verify/${userId}/${kind}/${item._id}`);
      if (res?.data?.success) load();
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not verify", "error");
    }
  };

  const isVerified = (item) => (item.verifiedBy || []).some((u) => String(u?._id || u) === String(viewerId));
  const toggleEdit = (key) => setEditing((e) => ({ ...e, [key]: !e[key] }));
  const openExperience = (item) => navigation.navigate("AddExperience", { item });
  const openEducation = (item) => navigation.navigate("AddEducation", { item });

  const sectionGap = isOwner ? 16 : 24;
  const current = career?.current || [];
  const experiences = (career?.experiences || []).filter((e) => !e.current);
  const education = career?.education || [];
  const skills = career?.skills || [];
  const languages = career?.languages || [];
  const saveLanguages = async (list) => {
    try {
      const res = await put("career/languages", { languages: list });
      if (res?.data?.success) setCareer(res.data.data);
    } catch (e) {
      ToastMessage(e?.response?.data?.message || "Could not save the language", "error");
    }
  };
  const renderExperience = (e, key) => (
    <Item
      key={e._id}
      logo={companyLogo(e)}
      title={e.title}
      subtitle={companyName(e)}
      dateRange={formatDateRange(e.startDate, e.endDate, e.current)}
      duration={formatDuration(e.startDate, e.endDate, e.current)}
      location={e.location}
      description={e.description}
      verifiedBy={e.verifiedBy}
      isOwner={isOwner}
      editing={editing[key]}
      verified={isVerified(e)}
      onCircle={() => (isOwner ? openExperience(e) : toggleVerify("experience", e))}
    />
  );

  if (!career) return <View style={styles.container}><CareerSkeleton /></View>;

  return (
    <View style={styles.container}>
      {(isOwner || current.length > 0) && (
        <>
          <View style={[styles.section, { gap: sectionGap }]}>
            <SectionHeader title="Current Position" isOwner={isOwner} editing={editing.current} onToggle={() => toggleEdit("current")} />
            {current.length > 0 ? (
              <View style={styles.list}>{current.map((e) => renderExperience(e, "current"))}</View>
            ) : (
              <AddRow label="Add your current position" onPress={() => openExperience({ current: true })} />
            )}
          </View>
          <View style={styles.separator} />
        </>
      )}

      {(isOwner || experiences.length > 0) && (
        <>
          <View style={[styles.section, { gap: sectionGap }]}>
            <SectionHeader title="Experience" isOwner={isOwner} editing={editing.experience} onToggle={() => toggleEdit("experience")} />
            <View style={[styles.list, !isOwner && { gap: 16 }]}>
              {experiences.map((e) => renderExperience(e, "experience"))}
              {isOwner && <AddRow label="Add a new Experience" onPress={() => openExperience(null)} />}
            </View>
          </View>
          <View style={styles.separator} />
        </>
      )}

      {(isOwner || education.length > 0) && (
        <>
          <View style={[styles.section, { gap: sectionGap }]}>
            <SectionHeader title="Education" isOwner={isOwner} editing={editing.education} onToggle={() => toggleEdit("education")} />
            <View style={styles.list}>
              {education.map((ed) => (
                <Item
                  key={ed._id}
                  logo={schoolLogo(ed)}
                  title={ed.degree || ed.primaryMajor || "Student"}
                  subtitle={schoolName(ed)}
                  dateRange={formatDateRange(ed.startDate, ed.graduationDate, ed.current)}
                  duration={formatDuration(ed.startDate, ed.graduationDate, ed.current)}
                  location={ed.location}
                  description={ed.description}
                  verifiedBy={ed.verifiedBy}
                  isOwner={isOwner}
                  editing={editing.education}
                  verified={isVerified(ed)}
                  onCircle={() => (isOwner ? openEducation(ed) : toggleVerify("education", ed))}
                />
              ))}
              {isOwner && <AddRow label="Add a new Education" onPress={() => openEducation(null)} />}
            </View>
          </View>
          <View style={styles.separator} />
        </>
      )}

      {(isOwner || languages.length > 0) && (
        <>
          <View style={[styles.section, { gap: sectionGap }]}>
            <SectionHeader title="Language" isOwner={isOwner} editing={editing.language} onToggle={() => toggleEdit("language")} />
            <View style={styles.list}>
              {languages.map((l, i) => (
                <View key={`${l.code}-${i}`} style={styles.itemRow}>
                  <View style={styles.grow}>
                    <LanguageRow item={l} />
                  </View>
                  {isOwner && editing.language && <Circle icon="edit" active onPress={() => setLangSheet({ index: i })} />}
                </View>
              ))}
              {isOwner && <AddRow label="Add a new Language" onPress={() => setLangSheet({ index: -1 })} />}
            </View>
          </View>
          <View style={styles.separator} />
        </>
      )}

      {(isOwner || skills.length > 0) && (
        <Skills
          skills={skills}
          isOwner={isOwner}
          onAdd={() => navigation.navigate("EditSkills", { skills })}
        />
      )}

      {isOwner && (
        <LanguageSheet
          visible={!!langSheet}
          value={langSheet && langSheet.index >= 0 ? languages[langSheet.index] : null}
          onDismiss={() => setLangSheet(null)}
          onRemove={
            langSheet && langSheet.index >= 0
              ? () => {
                  const idx = langSheet.index;
                  setLangSheet(null);
                  saveLanguages(languages.filter((_, j) => j !== idx));
                }
              : undefined
          }
          onConfirm={(lang) => {
            const idx = langSheet?.index ?? -1;
            setLangSheet(null);
            const rest = languages.filter((l, j) => j !== idx && l.code !== lang.code);
            const list = idx >= 0 ? languages.map((l, j) => (j === idx ? lang : l)).filter((l, j) => j === idx || l.code !== lang.code) : [...rest, lang];
            saveLanguages(list);
          }}
        />
      )}
    </View>
  );
};

export default CareerTab;

const styles = StyleSheet.create({
  container: { backgroundColor: "#121212", paddingBottom: 100 },
  empty: { height: 200 },
  grow: { flex: 1 },
  section: { padding: 16 },
  separator: { height: 1, backgroundColor: WHITE_4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 16, height: 16 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4, height: 16 },
  list: { gap: 12 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  itemColumn: { flex: 1, gap: 12 },
  itemColumnNarrow: { flex: 1 },
  infoBlock: { gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  miniAvatar: { width: 12, height: 12, borderRadius: 100, overflow: "hidden" },
  miniAvatarImg: { width: 12, height: 12 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 32 },
  addBox: { width: 32, height: 32, backgroundColor: WHITE_4, alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, rowGap: 6 },
  chip: { alignItems: "center", justifyContent: "center", backgroundColor: WHITE_4, flexDirection: "row" },
  chipOwn: { height: 28, paddingHorizontal: 10, borderRadius: 75 },
  chipVisitor: { height: 32, paddingHorizontal: 12, borderRadius: 100 },
  chipAdd: { gap: 2, backgroundColor: "transparent", borderWidth: 1, borderColor: WHITE_4 },
});
