import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ListenButton from "../../../../components/ListenButton";
import ImageFast from "../../../../components/ImageFast";
import LogoAvatar, { isLogoAvatar } from "../../../../components/LogoAvatar";
import { Bone, SkeletonGroup } from "../../../../components/Skeleton";
import { get, post } from "../../../../services/ApiRequest";
import { titleCase } from "../../../../utils/career";
import { getProfileAccent } from "../../../../utils/profileTier";
import { languageOf } from "../../../../utils/languages";
import { ToastMessage } from "../../../../utils/ToastMessage";
import { BoxIcon } from "../../Career/molecules/CareerUI";
import { AboutIcon } from "./AboutIcons";
import CompanyInsightsSections, { RichSub, UNLOCK_COPY, UnlockCard } from "./CompanyInsightsSections";

const X = (fs) => Math.round(fs * 0.35 * 10) / 10;
const INK = "#121212";
const W4 = "rgba(255, 255, 255, 0.04)";
const W48 = "rgba(255, 255, 255, 0.48)";
const W64 = "rgba(255, 255, 255, 0.64)";
const BLUE = "#007BFF";
const GREEN = "#37B874";

const T = ({ fs, ls = 0, ff = fonts.regular, color = "#FFFFFF", trim = true, ...rest }) => (
  <CustomText
    fontSize={fs}
    letterSpacing={ls}
    fontFamily={ff}
    color={color}
    {...(trim ? { marginTop: -X(fs), marginBottom: -X(fs) } : {})}
    {...rest}
  />
);

const initials = (name) =>
  String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K` : String(n || 0));

/** Figma section header: title Medium 18 −0.5pt · "SEE MORE" SemiBold 12 + 16 circle with gold chevron */
const SectionHeader = ({ title, onMore }) => (
  <View style={styles.headerRow}>
    <T fs={18} ls={-0.5} ff={fonts.medium} label={title} containerStyle={styles.grow} />
    {!!onMore && (
      <TouchableOpacity activeOpacity={0.7} onPress={onMore} style={styles.more} hitSlop={8}>
        <T fs={12} ff={fonts.semiBold} color={W64} label="SEE MORE" />
        <View style={styles.moreCircle}>
          <AboutIcon name="see" size={14} color="#A19375" />
        </View>
      </TouchableOpacity>
    )}
  </View>
);

/** 96pt round avatar + name (Medium 12) + caption (Regular 10 −0.4) — Key Individuals / Similar Companies */
const PersonCard = ({ name, avatar, color, caption, icon, onPress, isLogo }) => (
  <TouchableOpacity activeOpacity={onPress ? 0.8 : 1} disabled={!onPress} onPress={onPress} style={styles.card}>
    {avatar && isLogo ? (
      <LogoAvatar uri={avatar} size={96} />
    ) : avatar ? (
      <ImageFast source={{ uri: avatar }} style={styles.cardAvatar} />
    ) : (
      <View style={[styles.cardAvatar, styles.center, { backgroundColor: color || W4 }]}>
        <T fs={28} ff={fonts.semiBold} label={initials(name)} trim={false} />
      </View>
    )}
    <View style={styles.cardText}>
      <T fs={12} ff={fonts.medium} label={name} textAlign="center" numberOfLines={2} />
      {!!caption && (
        <View style={styles.cardCaption}>
          {!!icon && <AboutIcon name={icon} size={12} color="#FFFFFF" opacity={0.48} />}
          <T fs={10} ls={-0.4} color={W64} label={caption} textAlign="center" numberOfLines={1} />
        </View>
      )}
    </View>
  </TouchableOpacity>
);

/** label (Regular 12 −0.48 white 64%) · value (Medium 12) and an 8pt bar */
const Bar = ({ label, value, color, barFirst }) => {
  const row = (
    <View style={styles.barRow}>
      <T fs={12} ls={-0.48} color={W64} label={label} />
      <T fs={12} ls={-0.48} ff={fonts.medium} label={`${value}%`} />
    </View>
  );
  const bar = (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
  return <View style={styles.barItem}>{barFirst ? <>{bar}{row}</> : <>{row}{bar}</>}</View>;
};

const Chip = ({ label, count, flex, icon, iconAfter, iconColor = "#FFFFFF" }) => (
  <View style={[styles.chip, flex && styles.chipFlex]}>
    {!!icon && !iconAfter && <Icons family="MaterialSymbolsRoundedFilled" name={icon} size={12} color={iconColor} />}
    <T fs={12} ff={fonts.medium} color={W48} label={label} />
    {count > 0 && <T fs={10} color={W64} label={String(count)} />}
    {!!icon && iconAfter && <Icons family="MaterialSymbolsRoundedFilled" name={icon} size={12} color={iconColor} />}
  </View>
);

const Footnote = ({ count }) => (
  <View style={styles.footnote}>
    <AboutIcon name="info" size={12} color="#FFFFFF" opacity={0.48} />
    <Text style={styles.footnoteText}>
      Based on <Text style={styles.footnoteStrong}>{count} PSC verified</Text> former and current employees.
    </Text>
  </View>
);

const FactRow = ({ icon, label, value }) => (
  <View style={styles.factRow}>
    <AboutIcon name={icon} size={24} color="#FFFFFF" opacity={0.48} />
    <View style={styles.factText}>
      <T fs={12} ls={-0.12} ff={fonts.medium} color={W48} label={label.toUpperCase()} />
      <T fs={16} ls={-0.5} ff={fonts.medium} label={value} numberOfLines={1} />
    </View>
  </View>
);

/**
 * Company / Pro profile "About" tab — Figma Profile › Careem (8064:13706).
 * Sections #121212 1pt apart: About (+ Translate, source attribution) ·
 * employees · Key Individuals · facts · Workplace Reputation + Gender
 * Representation · Similar Companies. Data: GET career/about/:userId.
 */
const CompanyAboutTab = ({ user }) => {
  const navigation = useNavigation();
  const userData = useSelector((s) => s.users.userData);
  const viewingSelf = !!userData?._id && String(userData._id) === String(user?._id);
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);
  const keyRef = useRef(null);
  const similarRef = useRef(null);

  const id = user?._id;
  useEffect(() => {
    if (!id) return;
    let alive = true;
    const load = (quiet) =>
      get(`career/about/${id}`)
        .then((r) => alive && setData(r?.data?.data || null))
        .catch(() => alive && !quiet && setFailed(true));
    setData(null);
    load(false);
    // back from the claim / report screens: refresh quietly (claim status changes)
    const unsub = navigation.addListener("focus", () => load(true));
    return () => {
      alive = false;
      unsub();
    };
  }, [id, navigation]);

  const appLang = languageOf(userData?.profile?.language);
  const canTranslate = !!data?.bio && appLang && appLang.code !== "en";

  const translate = async () => {
    if (translated) return setTranslated(null);
    setTranslating(true);
    try {
      const r = await post("ai/translate", { text: data.bio, target: appLang.code });
      setTranslated(r?.data?.data?.translation || null);
    } catch (e) {
      ToastMessage(e?.message || "Could not translate", "error");
    } finally {
      setTranslating(false);
    }
  };

  if (failed) return null;
  if (!data) {
    return (
      <SkeletonGroup>
        <View style={[styles.section, { gap: 12 }]}>
          <Bone width={160} height={13} />
          <Bone width={340} height={10} />
          <Bone width={300} height={10} />
          <Bone width={320} height={10} />
        </View>
      </SkeletonGroup>
    );
  }

  const facts = [
    data.facts.founded && { icon: "founded", label: "Founded", value: moment(data.facts.founded).format("D MMMM, YYYY") },
    data.facts.headquarters && { icon: "hq", label: "Headquarters", value: data.facts.headquarters },
    data.facts.industry && { icon: "industry", label: "Industry", value: titleCase(data.facts.industry) },
    data.facts.type && { icon: "type", label: "Type", value: data.facts.type },
    data.facts.countries && { icon: "countries", label: "Operating in", value: `${data.facts.countries} ${data.facts.countries === 1 ? "country" : "countries"}` },
  ].filter(Boolean);
  const website = data.facts.website;
  const rep = data.reputation;
  const openUser = (uid) => uid && navigation.push("UserProfile", { userId: uid });

  return (
    <View style={styles.page}>
      {/* stock price section removed — client: no legal data source for
          commercial republishing (paid licences only, scraping not allowed) */}
      {/* About {name} */}
      <View style={[styles.section, { gap: 12 }]}>
        {/* Figma row 28, space-between: sparkle 16 · title | Listen pill */}
        <View style={styles.aboutHead}>
          <View style={[styles.aboutTitle, styles.shrink]}>
            <AboutIcon name="aboutTitle" size={16} />
            <T fs={18} ls={-0.5} ff={fonts.medium} label={`About ${data.name}`} containerStyle={styles.shrink} numberOfLines={1} />
          </View>
          {!!data.bio && (
            <ListenButton
              getAudioUrl={async () => {
                const r = await post(`career/about/${id}/listen`, { text: translated || data.bio });
                return r?.data?.data?.audioUrl;
              }}
            />
          )}
        </View>
        {!!data.bio && <T fs={12} color={W64} label={translated || data.bio} trim={false} />}
        {canTranslate && (
          <TouchableOpacity activeOpacity={0.7} onPress={translate} style={styles.translate} disabled={translating}>
            {translating ? <ActivityIndicator size="small" color={BLUE} /> : <AboutIcon name="translate" size={12} color={BLUE} />}
            <T fs={12} color={BLUE} label={translated ? "Show original" : `Translate in ${appLang.name}`} />
          </TouchableOpacity>
        )}
        {!!data.attribution?.text && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => data.attribution.wikipediaUrl && Linking.openURL(data.attribution.wikipediaUrl).catch(() => {})}
          >
            <T fs={10} color={W48} label={data.attribution.text} trim={false} />
          </TouchableOpacity>
        )}
        {/* client: profiles are claimed only through a PSC invitation — no
            self-claim entry; reporting wrong info stays free for everyone */}
        {!viewingSelf && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.claimLink}
            onPress={() => navigation.navigate("ClaimProfile", { profileId: user?._id, name: data.name, mode: "report" })}
          >
            <BoxIcon name="flag" size={14} color={W64} />
            <T fs={12} ff={fonts.medium} color={W64} label="Report inaccurate info" />
          </TouchableOpacity>
        )}
      </View>

      {/* employees */}
      {(data.employees.estimated || data.employees.onPsc > 0) && (
        <View style={[styles.section, { gap: 12 }]}>
          {!!data.employees.estimated && (
            <View style={styles.empRow}>
              <Logo user={user} />
              <View style={styles.empText}>
                <T fs={12} ls={-0.12} ff={fonts.medium} color={W48} label="ESTIMATED TOTAL EMPLOYEES" />
                <View style={styles.inline}>
                  <AboutIcon name="employees" size={16} color="#FFFFFF" opacity={0.48} />
                  <T fs={16} ls={-0.5} ff={fonts.medium} label={Number(data.employees.estimated).toLocaleString("en-US")} />
                </View>
              </View>
            </View>
          )}
          {data.employees.onPsc > 0 && (
            <View style={styles.empRow}>
              <Logo user={user} />
              <View style={styles.empText}>
                <T fs={12} ls={-0.12} ff={fonts.medium} color={W48} label="VERIFIED EMPLOYEES ON PSC" />
                <View style={styles.inline}>
                  <AboutIcon name="verified" size={14} color={BLUE} />
                  <T fs={16} ls={-0.5} ff={fonts.medium} label={`${data.employees.verified} verified`} />
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Key Individuals */}
      {data.keyIndividuals.length > 0 && (
        <View style={[styles.section, styles.carouselSection]}>
          <SectionHeader title="Key Individuals" onMore={() => navigation.navigate("CompanyPeople", { userId: user._id, accent: getProfileAccent(user) })} />
          <ScrollView ref={keyRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {data.keyIndividuals.map((k, i) => (
              <PersonCard key={`${k.name}-${i}`} name={k.name} avatar={k.avatar} color={k.profileColor} caption={k.role} onPress={k.user ? () => openUser(k.user) : undefined} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* facts */}
      {(website || facts.length > 0) && (
        <View style={[styles.section, { gap: 8 }]}>
          {!!website && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(website).catch(() => {})} style={styles.box}>
              <T fs={14} ff={fonts.semiBold} label="Official Website" />
              <View style={styles.linkRow}>
                <AboutIcon name="link" size={14} color={BLUE} />
                <T fs={14} color={BLUE} label={website.replace(/^https?:\/\//, "").replace(/\/$/, "")} numberOfLines={1} containerStyle={styles.shrink} />
              </View>
            </TouchableOpacity>
          )}
          {facts.length > 0 && (
            <View style={[styles.box, { gap: 12 }]}>
              {facts.map((f, i) => (
                <View key={f.label} style={styles.factWrap}>
                  {i > 0 && <View style={styles.rule} />}
                  <FactRow {...f} />
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <CompanyInsightsSections insights={data.insights} name={data.name} logo={user?.profile?.avatar} />

      {/* Workplace Reputation (Figma 8064:13706: title + subtitle, bars,
          keyword chips, recommend stacked bar + Yes/Neutral/No) */}
      {rep && (
        <View style={[styles.section, styles.repSection]}>
          <View style={styles.titleBlock}>
            <T fs={18} ls={-0.5} ff={fonts.medium} label="Workplace Reputation" />
            <RichSub before="Discover what employees think about " name={data.name} after="." ls={-0.24} />
          </View>
          <View style={styles.bars}>
            <Bar label="Work environment" value={rep.environment.percent} color={GREEN} />
            <Bar label="Management" value={rep.management.percent} color={GREEN} />
            <Bar label="Career & benefits" value={rep.career.percent} color={GREEN} />
            <Bar label="Recommend" value={rep.recommend.percent} color={GREEN} />
          </View>
          {[
            ["environment", "Work environment"],
            ["management", "Management"],
            ["career", "Career & benefits"],
          ].map(([k, title]) => (
            <View key={k} style={styles.keywordGroup}>
              <T fs={14} ff={fonts.medium} label={title} />
              <View style={styles.chips}>
                {rep[k].keywords.map((w) => (
                  <Chip key={w.label} label={w.label === "Collboarative" ? "Collaborative" : w.label} count={w.count} />
                ))}
              </View>
            </View>
          ))}
          <View style={styles.keywordGroup}>
            <T fs={14} ff={fonts.medium} label="Would you recommend working there?" />
            {rep.recommend.counts.Yes + rep.recommend.counts.Neutral + rep.recommend.counts.No > 0 && (
              <View style={styles.recBar}>
                {rep.recommend.counts.Yes > 0 && <View style={{ flex: rep.recommend.counts.Yes, backgroundColor: "#45CA77" }} />}
                {rep.recommend.counts.Neutral > 0 && <View style={{ flex: rep.recommend.counts.Neutral, backgroundColor: "rgba(255, 255, 255, 0.16)" }} />}
                {rep.recommend.counts.No > 0 && <View style={{ flex: rep.recommend.counts.No, backgroundColor: "#EE1045" }} />}
              </View>
            )}
            <View style={styles.recRow}>
              <Chip label="Yes" count={rep.recommend.counts.Yes} flex icon="thumb_up" iconColor="#37B874" />
              <Chip label="Neutral" count={rep.recommend.counts.Neutral} flex icon="remove" iconColor={W64} />
              <Chip label="No" count={rep.recommend.counts.No} flex icon="thumb_down" iconAfter iconColor="#EE1045" />
            </View>
          </View>
          <Footnote count={rep.basedOn} />
        </View>
      )}

      {/* non-premium viewer: Workplace Reputation keeps its box with a lock card */}
      {!rep && data.reputationLocked && (
        <View style={[styles.section, styles.repSection]}>
          <View style={styles.titleBlock}>
            <T fs={18} ls={-0.5} ff={fonts.medium} label="Workplace Reputation" />
            <RichSub before="Discover what employees think about " name={data.name} after="." ls={-0.24} />
          </View>
          <UnlockCard onPress={() => navigation.navigate("Plans")} {...UNLOCK_COPY.workplace} />
        </View>
      )}

      {/* Gender Representation (Figma: own section, bar above its label) */}
      {data.gender && (
        <View style={[styles.section, styles.repSection]}>
          <T fs={18} ls={-0.5} ff={fonts.medium} label="Gender Representation" />
          <View style={styles.genderBars}>
            <Bar label="Men Representation" value={data.gender.men} color="#007AFF" barFirst />
            <Bar label="Women Representation" value={data.gender.women} color="#DB00E7" barFirst />
            <Bar label="Undefined Representation" value={data.gender.other} color="#FFFFFF" barFirst />
          </View>
          <Footnote count={data.gender.basedOn} />
        </View>
      )}

      {/* Similar Companies */}
      {data.similar.length > 0 && (
        <View style={[styles.section, styles.carouselSection]}>
          <SectionHeader title="Similar Companies" onMore={data.similar.length > 3 ? () => similarRef.current?.scrollToEnd() : undefined} />
          <ScrollView ref={similarRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {data.similar.map((s) => (
              <PersonCard key={s._id} name={s.name} avatar={s.avatar} isLogo={s.isLogo} color={s.profileColor} caption={compact(s.followersCount)} icon="followers" onPress={() => openUser(s._id)} />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

/** Figma 40 × 40 company image (square) */
const Logo = ({ user }) =>
  user?.profile?.avatar && isLogoAvatar(user) ? (
    <LogoAvatar uri={user.profile.avatar} size={40} radius={0} />
  ) : user?.profile?.avatar ? (
    <ImageFast source={{ uri: user.profile.avatar }} style={styles.logo} />
  ) : (
    <View style={[styles.logo, styles.center, { backgroundColor: user?.profile?.profileColor || W4 }]}>
      <T fs={14} ff={fonts.semiBold} label={initials(`${user?.firstName || ""} ${user?.lastName || ""}`)} trim={false} />
    </View>
  );

export default CompanyAboutTab;

const styles = StyleSheet.create({
  claimLink: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  grow: { flex: 1 },
  shrink: { flexShrink: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  page: { gap: 1, backgroundColor: "#262626" },
  section: { backgroundColor: INK, padding: 12 },
  aboutHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 28 },
  aboutTitle: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 28 },
  translate: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  empRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 40 },
  logo: { width: 40, height: 40, overflow: "hidden" },
  empText: { flex: 1, gap: 6 },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 },
  carouselSection: { paddingBottom: 16, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 18, minHeight: 16 },
  more: { flexDirection: "row", alignItems: "center", gap: 4 },
  moreCircle: { width: 16, height: 16, borderRadius: 100, backgroundColor: W4, alignItems: "center", justifyContent: "center" },
  carousel: { gap: 16, paddingRight: 12 },
  card: { width: 96, gap: 12, alignItems: "center" },
  cardAvatar: { width: 96, height: 96, borderRadius: 100, overflow: "hidden" },
  cardText: { width: 96, gap: 8, alignItems: "center" },
  cardCaption: { flexDirection: "row", alignItems: "center", gap: 2 },
  box: { backgroundColor: W4, borderRadius: 8, padding: 12, gap: 6 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  factWrap: { gap: 12 },
  factRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 25 },
  factText: { flex: 1, gap: 6 },
  rule: { height: 1, backgroundColor: W4 },
  repSection: { gap: 16 },
  titleBlock: { gap: 12 },
  recBar: { height: 24, borderRadius: 100, overflow: "hidden", flexDirection: "row", backgroundColor: W4 },
  bars: { gap: 12 },
  genderBars: { gap: 10 },
  barItem: { gap: 6 },
  barRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  barTrack: { height: 8, borderRadius: 100, backgroundColor: W4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 100 },
  keywordGroup: { gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: { height: 28, borderRadius: 100, borderWidth: 1, borderColor: W4, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  chipFlex: { flex: 1, height: 32, justifyContent: "center", gap: 4 },
  recRow: { flexDirection: "row", gap: 4 },
  footnote: { flexDirection: "row", alignItems: "center", gap: 2 },
  // Figma 10 Regular white 64% · count phrase Medium white; 1.4 line box trimmed
  footnoteText: { flexShrink: 1, fontSize: 10, lineHeight: 14, fontFamily: fonts.regular, color: W64, marginTop: -X(10), marginBottom: -X(10) },
  footnoteStrong: { fontFamily: fonts.medium, color: "#FFFFFF" },
});
