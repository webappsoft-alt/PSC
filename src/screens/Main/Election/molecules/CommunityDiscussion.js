import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../../assets/fonts";
import UserBadge from "../../../../components/UserBadge";
import {
  EL,
  Fit,
  GlassFill,
  Glyph,
  MS,
  MSF,
  RailHeader,
  Section,
  Txt,
  formatK,
  userName,
  withAlpha,
} from "./electionLayout";
import InitialsFill from "../../../../components/InitialsFill";

/**
 * Figma Community Discussion (8103:4465): pad 12/12/16/12 · gap 16; card
 * 348 · pad 12/8 · gap 12 · white 4% · r12 — header 32 (avatar 24 in a 32
 * ring 2pt #007BFF · name Medium 14 + badge 14 / username Regular 14 @48 ·
 * Follow 28 white r8 · more 32), text Regular 12 @64, stat chips 28 r4.
 */
const CARD_W = 348;

/**
 * Figma stat chips (Frame 17): 52 × 28, left-aligned (primary MIN), gap 2,
 * pad L/R per chip — upvotes 4/6, downvotes 8/4, comments 6/4, others 4/4.
 */
const Stat = ({
  icon,
  family = MS,
  iconColor,
  label,
  labelColor = EL.white,
  fill = EL.white04,
  iconFirst = true,
  semiBold,
  padL = 4,
  padR = 4,
}) => (
  <View style={[styles.stat, { paddingLeft: padL, paddingRight: padR }]}>
    <GlassFill fill={fill} borderRadius={4} />
    {iconFirst ? <Glyph family={family} name={icon} size={16} color={iconColor} /> : null}
    <Fit
      size={12}
      box={8}
      label={label}
      fontFamily={semiBold ? fonts.semiBold : fonts.medium}
      letterSpacing={semiBold ? -0.24 : -0.06}
      color={labelColor}
    />
    {!iconFirst ? <Glyph family={family} name={icon} size={16} color={iconColor} /> : null}
  </View>
);

const PostCard = ({ post, isMine, following, onOpen, onOpenUser, onFollow }) => {
  const author = post?.userId && typeof post.userId === "object" ? post.userId : null;
  const text = Array.isArray(post?.description)
    ? post.description.filter(Boolean).join("\n")
    : post?.description || "";
  const stats = post?.stats || {};
  const uri = author?.profile?.avatar;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onOpen} style={styles.card}>
      <GlassFill fill={EL.white04} borderRadius={12} />
      <View style={styles.cardHead}>
        <TouchableOpacity activeOpacity={0.8} onPress={onOpenUser} style={styles.author}>
          <View style={styles.ring}>
            <View style={styles.avatar}>
              {uri ? (
                <FastImage source={{ uri }} style={StyleSheet.absoluteFill} />
              ) : (
                <InitialsFill user={author} size={24} />
              )}
            </View>
          </View>
          <View style={styles.names}>
            <View style={[styles.inline, { gap: 2 }]}>
              <Fit
                size={14}
                box={10}
                label={userName(author)}
                fontFamily={fonts.medium}
                letterSpacing={-0.07}
                color={EL.white}
                containerStyle={styles.shrink}
              />
              <UserBadge user={author} size={14} />
            </View>
            <Fit
              size={14}
              box={10}
              label={author?.username || ""}
              letterSpacing={-0.28}
              color={EL.white48}
            />
          </View>
        </TouchableOpacity>
        <View style={[styles.inline, { gap: 8 }]}>
          {!isMine && author?._id ? (
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={following}
              onPress={onFollow}
              style={styles.followBtn}
            >
              <Fit
                size={14}
                box={10}
                label={following ? "Following" : "Follow"}
                fontFamily={fonts.medium}
                color={EL.section}
              />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity activeOpacity={0.7} onPress={onOpen} style={styles.more}>
            <GlassFill fill={EL.white04} />
            <Glyph family={MS} name="more_vert" size={16} color={EL.white82} />
          </TouchableOpacity>
        </View>
      </View>
      {text ? <Txt size={12} label={text} color={EL.white64} numberOfLines={4} /> : null}
      <View style={styles.stats}>
        <Stat
          icon="arrow_upward"
          iconColor={EL.green}
          label={formatK(stats.upvotes)}
          labelColor={EL.green}
          fill={withAlpha(EL.green, 0.16)}
          semiBold
          padL={4}
          padR={6}
        />
        <Stat
          icon="arrow_downward"
          iconColor={EL.white64}
          label={formatK(stats.downvotes)}
          iconFirst={false}
          padL={8}
          padR={4}
        />
        <Stat
          icon="chat_bubble"
          iconColor={EL.white48}
          label={formatK(stats.comments)}
          padL={6}
          padR={4}
        />
        <Stat icon="north_east" iconColor={EL.white48} label={formatK(stats.shares)} />
        <Stat icon="repeat" iconColor={EL.white48} label={formatK(stats.reposts)} />
        <Stat icon="bookmark_add" family={MSF} iconColor={EL.white64} label={formatK(stats.saved)} />
      </View>
    </TouchableOpacity>
  );
};

export const CommunityDiscussion = ({ post, myId, following, onOpen, onOpenUser, onFollow }) => {
  const author = post?.userId && typeof post.userId === "object" ? post.userId : null;
  return (
    <Section gap={16} style={styles.railSection}>
      <RailHeader icon="live_tv" title="Community Discussion" />
      {post?._id ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bleed}
          contentContainerStyle={styles.rail}
        >
          <PostCard
            post={post}
            isMine={!!author?._id && String(author._id) === String(myId)}
            following={following}
            onOpen={onOpen}
            onOpenUser={onOpenUser}
            onFollow={onFollow}
          />
        </ScrollView>
      ) : (
        <Txt size={14} label="No community discussion yet." color={EL.white64} />
      )}
    </Section>
  );
};

/* ─────────────── Related Shows / Related Job Offers (design only) ─────────────── */

/**
 * Figma 8103:4507 / 8103:4525: rail of 96-wide items 16 apart — 96 circle,
 * 12 below the texts (gap 8): Medium 12 white · Regular 10 / −4% @64
 * (jobs: + salary Medium 10 white). Static placeholders for now (no data
 * source yet); the Figma artwork is drawn as a translucent circle with the
 * section's icon.
 */
const SHOW_ITEMS = Array.from({ length: 4 }, (_, i) => ({ id: `s${i}`, lines: ["Event Name", "& 3 others"] }));
const JOB_ITEMS = Array.from({ length: 4 }, (_, i) => ({
  id: `j${i}`,
  lines: ["Job Title", "120k - 140k", "Company", "Full-Time"],
}));

const RailItem = ({ icon, lines }) => (
  <View style={styles.item}>
    <View style={styles.itemImage}>
      <GlassFill fill={EL.white04} />
      <Glyph family={MSF} name={icon} size={32} color={EL.white48} />
    </View>
    <View style={styles.itemText}>
      {lines.map((l, i) => (
        <Txt
          key={l}
          size={i === 0 ? 12 : 10}
          label={l}
          fontFamily={i === 0 || (icon === "work" && i === 1) ? fonts.medium : fonts.regular}
          letterSpacing={i === 0 ? 0 : -0.4}
          color={i === 0 || (icon === "work" && i === 1) ? EL.white : EL.white64}
          textAlign="center"
          numberOfLines={1}
        />
      ))}
    </View>
  </View>
);

export const RelatedRail = ({ kind }) => {
  const jobs = kind === "jobs";
  return (
    <Section gap={16} style={styles.railSection}>
      <RailHeader
        icon={jobs ? "work" : "live_tv"}
        family={jobs ? MSF : MS}
        title={jobs ? "Related Job Offers" : "Related Shows"}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={[styles.rail, { gap: 16 }]}
      >
        {(jobs ? JOB_ITEMS : SHOW_ITEMS).map((it) => (
          <RailItem key={it.id} icon={jobs ? "work" : "live_tv"} lines={it.lines} />
        ))}
      </ScrollView>
    </Section>
  );
};

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  inline: { flexDirection: "row", alignItems: "center" },
  railSection: { paddingBottom: 16 },
  bleed: { marginHorizontal: -12, flexGrow: 0 },
  rail: { paddingHorizontal: 12, gap: 6 },
  card: {
    width: CARD_W,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
    gap: 12,
  },
  cardHead: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  author: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  ring: {
    width: 32,
    height: 32,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: EL.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 24, height: 24, borderRadius: 12, overflow: "hidden", backgroundColor: EL.white16 },
  names: { flex: 1, gap: 6 },
  followBtn: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: EL.white,
    alignItems: "center",
    justifyContent: "center",
  },
  more: {
    width: 32,
    height: 32,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  stats: { height: 28, flexDirection: "row", alignItems: "center", gap: 4 },
  stat: {
    flex: 1,
    height: 28,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 2,
  },
  item: { width: 96, gap: 12, alignItems: "center" },
  itemImage: {
    width: 96,
    height: 96,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: { alignSelf: "stretch", gap: 8, alignItems: "center" },
});
