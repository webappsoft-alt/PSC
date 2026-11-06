import moment from "moment";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import {
  BulletList,
  EL,
  Fit,
  GlassFill,
  Glyph,
  MS,
  MSF,
  Section,
  SectionTitle,
  Txt,
  colorOf,
  formatK,
  trim,
} from "./electionLayout";
import InitialsFill from "../../../../components/InitialsFill";

/* ───────────── sources · title · tags (Figma Frame 2085664227) ───────────── */

const Divider = () => <View style={styles.vDivider} />;

/** pad 16/12/12/12 · gap 16 */
export const ElectionInfo = ({ election }) => {
  const tags = Array.isArray(election?.tags) ? election.tags.filter(Boolean) : [];
  return (
    <Section gap={16} style={styles.info}>
      {/* sources row: 32 · pad 8 · white 4% · r8 */}
      <View style={styles.sources}>
        <GlassFill fill={EL.white04} borderRadius={8} />
        <View style={[styles.row, { gap: 2 }]}>
          <Glyph family={MSF} name="article" size={12} color={EL.white} />
          <Fit
            size={10}
            box={7}
            label={`${Number(election?.sourcesCount) || 0} Sources`}
            fontFamily={fonts.medium}
            letterSpacing={-0.1}
            color={EL.white}
          />
        </View>
        <Divider />
        <Fit size={12} box={8} label="AI Structured Summary" color={EL.white64} />
        <Divider />
        <View style={[styles.row, { gap: 4 }]}>
          <Glyph family={MSF} name="group" size={16} color={EL.white48} />
          <View style={[styles.row, { gap: 2 }]}>
            <Fit
              size={10}
              box={7}
              label={formatK(election?.followersCount)}
              fontFamily={fonts.medium}
              letterSpacing={-0.05}
              color={EL.white}
            />
            <Fit
              size={10}
              box={7}
              label="following"
              fontFamily={fonts.medium}
              letterSpacing={-0.05}
              color={EL.white64}
            />
          </View>
        </View>
      </View>

      {/* title: SemiBold 20 / −2% */}
      <Txt
        size={20}
        label={election?.title || ""}
        fontFamily={fonts.semiBold}
        letterSpacing={-0.4}
        color={EL.white}
        containerStyle={styles.fullWidth}
      />

      {/* tags (Menu - Library): chips 28 · pad 8 · white 4% · gap 4 */}
      {tags.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsScroll}
          contentContainerStyle={styles.tags}
        >
          {tags.map((tag) => (
            <View key={tag} style={styles.chip}>
              <GlassFill fill={EL.white04} />
              <Fit
                size={12}
                box={8}
                label={String(tag).replace(/^#/, "")}
                fontFamily={fonts.medium}
                color={EL.white48}
              />
            </View>
          ))}
        </ScrollView>
      ) : null}
    </Section>
  );
};

/* ─────────────────────────── SI Summary (8170:3233) ─────────────────────────── */

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Client: "a tagged user in a post or text has its profile picture attached"
 * — every candidate name in the summary gets its 14pt avatar inline, before
 * the name in Medium white; the rest is Regular @64.
 */
const useSummaryParts = (text, results) =>
  useMemo(() => {
    const src = typeof text === "string" ? text : "";
    const cands = (results || [])
      .filter((r) => r?.name && String(r.name).trim().length > 1)
      .sort((a, b) => String(b.name).length - String(a.name).length);
    if (!src || !cands.length) return [{ text: src }];
    const re = new RegExp(`(${cands.map((c) => escapeRe(String(c.name))).join("|")})`, "g");
    const byName = new Map(cands.map((c) => [String(c.name), c]));
    return src
      .split(re)
      .filter((s) => s !== "")
      .map((s) => (byName.has(s) ? { text: s, candidate: byName.get(s) } : { text: s }));
  }, [text, results]);

const InlineAvatar = ({ candidate }) => {
  const uri = candidate?.user?.profile?.avatar;
  return (
    <View style={styles.inlineAvatarBox}>
      <View style={[styles.inlineAvatar, { backgroundColor: colorOf(candidate) }]}>
        {uri ? (
                <FastImage source={{ uri }} style={StyleSheet.absoluteFill} />
              ) : (
                <InitialsFill user={candidate?.user} name={candidate?.name} size={14} />
              )}
      </View>
    </View>
  );
};

export const SISummary = ({
  text,
  results,
  playing,
  audioLoading,
  onListen,
  translated,
  translating,
  onTranslate,
  showTranslateIcon = true,
}) => {
  const parts = useSummaryParts(text, results);
  return (
    <Section gap={12}>
      {/* row 28: sparkle 16 · 4 · title | Listen pill */}
      <View style={styles.summaryHead}>
        <View style={[styles.row, styles.flex, { gap: 4 }]}>
          <Glyph family={MSF} name="auto_awesome" size={16} color={EL.white} />
          <SectionTitle label="SI Summary" />
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={audioLoading}
          onPress={onListen}
          style={styles.listen}
        >
          <Glyph
            family={MSF}
            name={playing ? "pause" : "play_arrow"}
            size={12}
            color={EL.white}
          />
          <Fit
            size={14}
            box={10}
            label={audioLoading ? "Loading" : playing ? "Pause" : "Listen"}
            fontFamily={fonts.medium}
            color={EL.white64}
          />
        </TouchableOpacity>
      </View>

      {/* summary: Regular 14 / −2% @64, names Medium white with avatar */}
      <CustomText
        fontSize={14}
        letterSpacing={-0.28}
        color={EL.white64}
        marginTop={trim(14)}
        marginBottom={trim(14)}
      >
        {parts.map((p, i) =>
          p.candidate ? (
            <Text key={i}>
              <InlineAvatar candidate={p.candidate} />
              <Text style={styles.summaryName}>{` ${p.text}`}</Text>
            </Text>
          ) : (
            <Text key={i}>{p.text}</Text>
          ),
        )}
      </CustomText>

      {/* Translate to French: translate 12 · 2 · Regular 12 #007BFF */}
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={translating}
        onPress={onTranslate}
        style={[styles.row, { gap: 2, alignSelf: "flex-start" }]}
      >
        {showTranslateIcon ? (
          <Glyph family={MS} name="translate" size={12} color={EL.blue} />
        ) : null}
        <Fit
          size={12}
          box={8}
          label={
            translating ? "Translating…" : translated ? "Show original" : "Translate to French"
          }
          color={EL.blue}
        />
      </TouchableOpacity>
    </Section>
  );
};

/* ─────────────────────────── Schedule (8121:6565) ─────────────────────────── */

export const Schedule = ({ schedule }) => {
  const items = (Array.isArray(schedule) ? schedule : [])
    .filter((s) => s && (s.label || s.date))
    .map((s) => {
      const date = s.date && moment(s.date).isValid() ? moment(s.date).format("MMMM D, YYYY") : "";
      return [s.label, date].filter(Boolean).join(": ");
    });
  if (!items.length) return null;
  return (
    <Section gap={12}>
      {/* Figma: fixed 18pt title box (cap centred) */}
      <SectionTitle label="Schedule" box={18} />
      <Txt size={14} label="Key dates" fontFamily={fonts.medium} color={EL.white} />
      <BulletList items={items} />
    </Section>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  flex: { flex: 1 },
  fullWidth: { alignSelf: "stretch" },
  info: { paddingTop: 16, alignItems: "center" },
  sources: {
    alignSelf: "stretch",
    height: 32,
    padding: 8,
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  vDivider: {
    width: 1,
    height: 16,
    backgroundColor: EL.white16,
  },
  tagsScroll: { alignSelf: "stretch", marginHorizontal: -12, flexGrow: 0 },
  tags: { paddingHorizontal: 12, gap: 4, alignItems: "center" },
  chip: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryHead: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  listen: {
    height: 28,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: EL.white04,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  // inline avatar: 14 circle, centred on the cap height (Figma y −2 / +2)
  inlineAvatarBox: {
    width: 14,
    height: 14,
    transform: [{ translateY: 2 }],
  },
  inlineAvatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
  },
  summaryName: {
    fontFamily: fonts.medium,
    color: EL.white,
  },
});
