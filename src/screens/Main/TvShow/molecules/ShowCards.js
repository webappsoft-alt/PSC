import { memo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import { toggleSaveShow } from "../../../../services/showApi";
import { ToastMessage } from "../../../../utils/ToastMessage";
import {
  GlassFill,
  Glyph,
  SHOWS,
  baseline,
  capGap,
  capTop,
  fitLine,
  formatCount,
} from "./showsLayout";

/**
 * Figma Show-Feed cards (all images r12, pad 8):
 *  · Large  240×245 — image 240×135 · 8 · meta 12 · 8 · synopsis (3 lines)
 *                     · 8 · MATCH 18 · 8 · watched-by 12   (Group 48095569)
 *  · Ranked 272     — rank SemiBold 40 @64% (24 box) · 8 · Large
 *  · Square 140×222 — image 140×140 · 12 · name · viewers · avatars · MATCH
 *  · Roundel 96     — image 96 circle · 12 · name · subtitle
 *  · Poster 108×148 / Tall 160×320 — image only
 * Image overlay: 20 creator avatar (left) · 32 bookmark_add (right, #121212
 * 64% + blur 16); bottom: green NEW badge (square / poster cards).
 */

export const Avatar = ({ uri, color, size }) =>
  uri ? (
    <FastImage
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color || SHOWS.white16,
      }}
    />
  );

export const SaveButton = ({ show, fill = SHOWS.dark64 }) => {
  const [saved, setSaved] = useState(!!show?.isSaved);
  const onPress = async () => {
    const next = !saved;
    setSaved(next); // optimistic
    try {
      const res = await toggleSaveShow(show._id);
      if (res?.data?.success) setSaved(!!res.data.data?.saved);
    } catch (e) {
      setSaved(!next);
      ToastMessage(e?.message || "Could not save this show", "error");
    }
  };
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={styles.save}
    >
      <GlassFill fill={fill} />
      <Glyph
        family={saved ? "MaterialSymbolsRoundedFilled" : "MaterialSymbolsRounded"}
        name={saved ? "bookmark" : "bookmark_add"}
        size={20}
        color={SHOWS.white}
      />
    </TouchableOpacity>
  );
};

/** "-20%" / "Sponsored" labels on a card image (Figma Frame 48095932, 20 tall) */
export const ImageLabels = ({ discount, sponsored, style, pillFill = SHOWS.dark64 }) =>
  discount || sponsored ? (
    <View style={[styles.imageLabels, style]}>
      {discount ? (
        <View style={styles.discountTag}>
          <Glyph family="MaterialSymbolsRoundedFilled" name="sell" size={12} color={SHOWS.white} />
          <CustomText label={`-${discount}%`} fontSize={12} fontFamily={fonts.medium} color={SHOWS.white} marginTop={fitLine(12, 12)} marginBottom={fitLine(12, 12)} />
        </View>
      ) : (
        <View />
      )}
      {sponsored ? (
        <View style={styles.sponsoredPill}>
          <GlassFill fill={pillFill} />
          <CustomText label="Sponsored" fontSize={12} fontFamily={fonts.medium} color={SHOWS.white} marginTop={fitLine(12, 12)} marginBottom={fitLine(12, 12)} />
        </View>
      ) : null}
    </View>
  ) : null;

/** NEW badge on the image (square / poster cards): #1D9053, r6, pad 4. */
const NewBadge = () => (
  <View style={styles.newBadge}>
    <CustomText
      label="NEW"
      fontSize={12}
      fontFamily={fonts.semiBold}
      color={SHOWS.white}
    />
  </View>
);

/** Image with the 8pt overlay (avatar · save on top, optional bottom row). */
const ShowImage = ({ show, width, height, radius = 12, bottom }) => (
  <View style={[styles.image, { width, height, borderRadius: radius }]}>
    {show?.cover ? (
      <FastImage
        source={{ uri: show.cover }}
        style={StyleSheet.absoluteFill}
        resizeMode={FastImage.resizeMode.cover}
      />
    ) : null}
    <View style={styles.imageTop}>
      <Avatar
        uri={show?.creator?.avatar}
        color={show?.creator?.profileColor}
        size={20}
      />
      <SaveButton show={show} />
    </View>
    {bottom ? <View style={styles.imageBottom}>{bottom}</View> : <View />}
  </View>
);

const MatchPill = ({ match, small }) =>
  match ? (
    <View style={[styles.match, small && styles.matchSmall]}>
      <CustomText
        label={`${match}% MATCH`}
        fontSize={small ? 10 : 12}
        fontFamily={fonts.semiBold}
        letterSpacing={(small ? 10 : 12) * -0.005}
        color={SHOWS.green}
      />
    </View>
  ) : null;

const Dot = () => <View style={styles.dot} />;

/** "NEW · TOPIC · S2, E2" (Figma meta row, SemiBold 10 @64%). */
const MetaRow = ({ show }) => {
  const ep = show?.latestEpisode;
  const items = [];
  if (show?.isNew) {
    items.push(
      <View key="new" style={styles.newTag}>
        <CustomText
          label="NEW"
          fontSize={10}
          // Figma centres the 7pt caps in the 12pt tag (2.5 / 2.5); iOS
          // draws Poppins ⅓pt low, so lift it to match
          marginTop={fitLine(10, 12) - 1 / 3}
          marginBottom={fitLine(10, 12) + 1 / 3}
          fontFamily={fonts.semiBold}
          letterSpacing={-0.05}
          color={SHOWS.green}
        />
      </View>,
    );
  }
  if (show?.topic) {
    items.push(
      <CustomText
        key="topic"
        label={show.topic}
        textTransform="uppercase"
        fontSize={10}
        marginTop={fitLine(10, 12)}
        marginBottom={fitLine(10, 12)}
        fontFamily={fonts.semiBold}
        letterSpacing={-0.05}
        color={SHOWS.white64}
      />,
    );
  }
  if (ep) {
    items.push(
      <CustomText
        key="ep"
        label={`S${ep.seasonNumber}, E${ep.episodeNumber}`}
        fontSize={10}
        marginTop={fitLine(10, 12)}
        marginBottom={fitLine(10, 12)}
        fontFamily={fonts.semiBold}
        letterSpacing={-0.4}
        color={SHOWS.white64}
      />,
    );
  }
  return (
    <View style={styles.meta}>
      {items.map((item, i) => (
        <View key={i} style={styles.metaItem}>
          {i > 0 ? <Dot /> : null}
          {item}
        </View>
      ))}
    </View>
  );
};

/** "Watched by Viktor & 3 others" with a 12 avatar. */
const WatchedBy = ({ watchedBy }) =>
  watchedBy ? (
    <View style={styles.watched}>
      <Avatar
        uri={watchedBy.avatar}
        color={watchedBy.profileColor}
        size={12}
      />
      <View style={styles.watchedText}>
        <CustomText
          label="Watched by "
          fontSize={12}
          marginTop={fitLine(12, 12)}
          marginBottom={fitLine(12, 12)}
          letterSpacing={-0.06}
          color={SHOWS.white64}
        />
        <CustomText
          label={watchedBy.name}
          fontSize={12}
          marginTop={fitLine(12, 12)}
          marginBottom={fitLine(12, 12)}
          fontFamily={fonts.medium}
          letterSpacing={-0.06}
          color={SHOWS.white}
          numberOfLines={1}
          containerStyle={{ flexShrink: 1 }}
        />
        {watchedBy.others > 0 ? (
          <CustomText
            label={`& ${watchedBy.others} other${watchedBy.others > 1 ? "s" : ""}`}
            fontSize={12}
          marginTop={fitLine(12, 12)}
          marginBottom={fitLine(12, 12)}
            letterSpacing={-0.06}
            color={SHOWS.white64}
          />
        ) : null}
      </View>
    </View>
  ) : null;

/* ─────────────────────────────── Large ─────────────────────────────── */

export const LargeShowCard = memo(({ show, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.large}>
    <ShowImage
      show={show}
      width={240}
      height={135}
      bottom={<ImageLabels discount={show?.discountPercent} sponsored={show?.sponsored} />}
    />
    {/* image → meta 8 */}
    <View style={{ marginTop: 8 }}>
      <MetaRow show={show} />
    </View>
    {!!show?.synopsis && (
      <CustomText
        label={show.synopsis}
        fontSize={12}
        fontFamily={fonts.medium}
        color={SHOWS.white}
        numberOfLines={3}
        // meta (12 box) → synopsis cap 8
        marginTop={8 + capTop(12)}
      />
    )}
    {show?.match ? (
      <View style={{ marginTop: show?.synopsis ? 8 + baseline(12) : 8 }}>
        <MatchPill match={show.match} />
      </View>
    ) : null}
    {show?.watchedBy ? (
      <View
        style={{
          marginTop: !show?.match && show?.synopsis ? 8 + baseline(12) : 8,
        }}
      >
        <WatchedBy watchedBy={show.watchedBy} />
      </View>
    ) : null}
  </TouchableOpacity>
));

/* ─────────────────────────────── Ranked ────────────────────────────── */

export const RankedShowCard = memo(({ show, onPress }) => (
  <View style={styles.ranked}>
    <View style={styles.rankBox}>
      <CustomText
        label={String(show?.rank || "")}
        fontSize={40}
        fontFamily={fonts.semiBold}
        color={SHOWS.white64}
        // Figma: 24 × 24 box, line height 24, untrimmed — the 40pt line is
        // centred on that box from the card's top edge (cap ~2 above it);
        // the feed list leaves room above for it (RANK_BLEED in Shows.js)
        marginTop={fitLine(40, 24)}
      />
    </View>
    <LargeShowCard show={show} onPress={onPress} />
  </View>
));

/* ─────────────────────────────── Square ────────────────────────────── */

export const SquareShowCard = memo(({ show, onPress }) => {
  const avatars = show?.watchedBy?.avatars || [];
  // Figma: name · 8 · viewers · 8 · avatars 14 · 8 · MATCH 16 (all centred)
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.square}>
      <ShowImage
        show={show}
        width={140}
        height={140}
        bottom={show?.isNew ? <NewBadge /> : null}
      />
      <CustomText
        label={show?.showName}
        fontSize={12}
        fontFamily={fonts.medium}
        letterSpacing={-0.06}
        textAlign="center"
        color={SHOWS.white}
        numberOfLines={1}
        marginTop={12 + capTop(12)}
      />
      <CustomText
        label={`${formatCount(show?.views)} viewers`}
        fontSize={12}
        fontFamily={fonts.medium}
        letterSpacing={-0.06}
        textAlign="center"
        color={SHOWS.white64}
        numberOfLines={1}
        marginTop={capGap(8, 12, 12)}
      />
      {avatars.length ? (
        <View style={[styles.avatarStack, { marginTop: 8 + baseline(12) }]}>
          {avatars.map((a, i) => (
            <View key={i} style={i > 0 && { marginLeft: -4 }}>
              <Avatar uri={a.avatar} color={a.profileColor} size={14} />
            </View>
          ))}
        </View>
      ) : null}
      {show?.match ? (
        <View
          style={[
            styles.centerRow,
            { marginTop: avatars.length ? 8 : 8 + baseline(12) },
          ]}
        >
          <MatchPill match={show.match} small />
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

/* ─────────────────────────────── Roundel ───────────────────────────── */

export const RoundelShowCard = memo(({ show, onPress }) => {
  const creator = show?.creator;
  const by = creator
    ? creator.firstName
      ? `${creator.firstName} ${creator.lastName || ""}`.trim()
      : creator.username
    : "";
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.roundel}>
      <View style={styles.roundelImage}>
        {show?.cover ? (
          <FastImage source={{ uri: show.cover }} style={StyleSheet.absoluteFill} />
        ) : null}
      </View>
      <CustomText
        label={show?.showName}
        fontSize={12}
        fontFamily={fonts.medium}
        textAlign="center"
        color={SHOWS.white}
        numberOfLines={1}
        marginTop={12 + capTop(12)}
      />
      {!!by && (
        <CustomText
          label={by}
          fontSize={10}
          letterSpacing={-0.4}
          textAlign="center"
          color={SHOWS.white64}
          numberOfLines={1}
          marginTop={capGap(8, 12, 10)}
        />
      )}
    </TouchableOpacity>
  );
});

/* ─────────────────────────── Poster / Tall ─────────────────────────── */

export const PosterShowCard = memo(({ show, onPress, tall }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
    <ShowImage
      show={show}
      width={tall ? 160 : 108}
      height={tall ? 320 : 148}
      bottom={show?.isNew ? <NewBadge /> : null}
    />
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  imageLabels: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  discountTag: {
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: SHOWS.green,
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  sponsoredPill: {
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 100,
    overflow: "hidden",
    justifyContent: "center",
  },
  image: {
    overflow: "hidden",
    backgroundColor: SHOWS.white04,
    padding: 8,
    justifyContent: "space-between",
  },
  imageTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  imageBottom: {
    flexDirection: "row",
    justifyContent: "center",
  },
  save: {
    width: 32,
    height: 32,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: SHOWS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  large: {
    width: 240,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newTag: {
    paddingHorizontal: 3,
    borderRadius: 2,
    backgroundColor: SHOWS.greenSoft,
    justifyContent: "center",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 100,
    backgroundColor: SHOWS.white16,
  },
  match: {
    alignSelf: "flex-start",
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: SHOWS.greenSoft,
    justifyContent: "center",
  },
  matchSmall: {
    alignSelf: "center",
    height: 16,
  },
  watched: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  watchedText: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ranked: {
    flexDirection: "row",
    gap: 8,
  },
  rankBox: {
    width: 24,
    alignItems: "center",
    overflow: "visible",
  },
  square: {
    width: 140,
  },
  avatarStack: {
    height: 14,
    flexDirection: "row",
    justifyContent: "center",
  },
  centerRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  roundel: {
    width: 96,
  },
  roundelImage: {
    width: 96,
    height: 96,
    borderRadius: 100,
    overflow: "hidden",
    backgroundColor: SHOWS.white04,
  },
});
