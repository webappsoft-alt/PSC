import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { PaymnetsImages } from "../../../../assets/images/paymnets";
import CustomText from "../../../../components/CustomText";
import UserBadge from "../../../../components/UserBadge";
import {
  GlassFill,
  Glyph,
  SHOWS,
  baseline,
  capTop,
  fitLine,
  formatCount,
} from "./showsLayout";

/**
 * Figma › Shows › "SHOW DETAIL PAGE" (2234:1887) — the collapsible blocks
 * under the episode info: rating row, Buying Protection, Apply A Promo Code,
 * Ratings & Reviews. All values are the Figma inspect values.
 */
const MS = "MaterialSymbolsRounded";
const MSF = "MaterialSymbolsRoundedFilled";
const GOLD_SOFT = "rgba(161, 147, 117, 0.16)";
const BRONZE = "#A57A3A";
const STAR_YELLOW = "#FBBC05";
const STROKE_04 = "rgba(255, 255, 255, 0.04)";
const STROKE_08 = "rgba(255, 255, 255, 0.08)";
const DARK_STROKE_04 = "rgba(18, 18, 18, 0.04)";

/** text whose cap height is centred in a Figma row of `box` pt */
export const Fit = ({ size, box, ...props }) => (
  <CustomText
    fontSize={size}
    marginTop={fitLine(size, box)}
    marginBottom={fitLine(size, box)}
    numberOfLines={1}
    {...props}
  />
);

const compact = (n = 0) => {
  const v = Number(n) || 0;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(v);
};

/* ───────────────────── rating row (2234:1916, 351×20) ───────────────────── */

/** 5 × 20 stars · "4.7" SemiBold 16 · 4 · "(1.2k reviews)" Medium 12 @64% · 4 · Best pill */
export const RatingRow = ({ rating }) => {
  const average = Number(rating?.average) || 0;
  const count = Number(rating?.count) || 0;
  return (
    <View style={styles.ratingRow}>
      <View style={styles.row}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Glyph
            key={i}
            family={MSF}
            name="star"
            size={20}
            color={i < Math.round(average) ? SHOWS.white : SHOWS.white16}
          />
        ))}
        <Fit
          size={16}
          box={20}
          label={average ? average.toFixed(1) : "0.0"}
          fontFamily={fonts.semiBold}
          color={SHOWS.white}
        />
      </View>
      <View style={[styles.row, { gap: 4 }]}>
        <Fit
          size={12}
          box={16}
          label={`(${compact(count)} review${count === 1 ? "" : "s"})`}
          fontFamily={fonts.medium}
          color={SHOWS.white64}
        />
        {rating?.badge ? (
          <View style={styles.bestPill}>
            <Fit
              size={12}
              box={16}
              label={rating.badge}
              fontFamily={fonts.medium}
              letterSpacing={-0.06}
              color={SHOWS.gold}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};

/* ─────────────────── collapsible block header (351×24) ─────────────────── */

const BlockHeader = ({ icon, iconGap = 6, title, open, onToggle }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onToggle} style={styles.blockHeader}>
    <View style={[styles.row, { gap: iconGap }, styles.shrink]}>
      {icon ? <Glyph family={MSF} name={icon} size={20} color={SHOWS.white} /> : null}
      <Fit
        size={16}
        box={20}
        label={title}
        fontFamily={fonts.semiBold}
        color={SHOWS.white}
        containerStyle={styles.shrink}
      />
    </View>
    <Glyph
      family={MS}
      name={open ? "expand_more" : "chevron_right"}
      size={24}
      color={SHOWS.white64}
    />
  </TouchableOpacity>
);

const useOpen = (initial = true) => useState(initial);

/* ──────────────── Buying Protection (2234:2195, pad 12/12/16/12) ──────────────── */

const PAYMENT_ICONS = [
  PaymnetsImages.visa,
  PaymnetsImages.amex,
  PaymnetsImages.mastercard,
  PaymnetsImages.maestro,
  PaymnetsImages.discover,
  PaymnetsImages.unionpay,
  PaymnetsImages.bitcoin,
  PaymnetsImages.jcb,
  PaymnetsImages.paypal,
  PaymnetsImages.diners,
];

const LearnMore = ({ onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.learnMore}>
    <Fit size={12} box={24} label="Learn More" fontFamily={fonts.medium} color={SHOWS.white} />
    <Glyph family={MS} name="chevron_right" size={24} color={SHOWS.white64} />
  </TouchableOpacity>
);

export const BuyingProtection = ({ onLearnMore }) => {
  const [open, setOpen] = useOpen();
  return (
    <View style={styles.block}>
      <BlockHeader
        icon="verified_user"
        title="Buying Protection"
        open={open}
        onToggle={() => setOpen((v) => !v)}
      />
      {open ? (
        <>
          {/* info pill: r12 · bronze 4% · pad 8 · gap 4 · 12 info · Regular 12 −3% bronze */}
          <View style={styles.infoPill}>
            <Glyph family={MS} name="info" size={12} color={BRONZE} />
            <CustomText
              label="Please keep all conversations within the platform to protect your purchases."
              fontSize={12}
              letterSpacing={-0.36}
              color={BRONZE}
              marginTop={capTop(12)}
              marginBottom={baseline(12)}
              containerStyle={styles.shrink}
            />
          </View>
          <View style={{ gap: 8 }}>
            <View style={styles.protectCard}>
              <CustomText
                label="Payment Protection"
                fontSize={16}
                fontFamily={fonts.medium}
                letterSpacing={-0.08}
                color={SHOWS.white}
                marginTop={capTop(16)}
                marginBottom={baseline(16)}
              />
              <CustomText
                label="Your payment won’t be available to creators until the episode has been delivered to you, or for a maximum of 2 weeks after the purchase date."
                fontSize={12}
                color={SHOWS.white}
                marginTop={16 + capTop(12)}
                marginBottom={baseline(12)}
              />
              <View style={{ marginTop: 16 }}>
                <LearnMore onPress={onLearnMore} />
              </View>
            </View>
            <View style={styles.protectCard}>
              <CustomText
                label="Multiple Payment Methods"
                fontSize={16}
                fontFamily={fonts.medium}
                letterSpacing={-0.08}
                color={SHOWS.white}
                marginTop={capTop(16)}
                marginBottom={baseline(16)}
              />
              <View style={styles.paymentGrid}>
                {PAYMENT_ICONS.map((icon, i) => (
                  <Image key={i} source={icon} style={styles.paymentIcon} resizeMode="contain" />
                ))}
              </View>
              <View style={{ marginTop: 16 }}>
                <LearnMore onPress={onLearnMore} />
              </View>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
};

/* ───────────────── Apply A Promo Code (2234:2404, pad 12/12/16/12) ───────────────── */

export const PromoCodeBlock = ({ promo, onPress }) => {
  const [open, setOpen] = useOpen();
  return (
    <View style={styles.block}>
      <BlockHeader
        icon="sell"
        iconGap={8}
        title="Apply A Promo Code"
        open={open}
        onToggle={() => setOpen((v) => !v)}
      />
      {open ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.promoCard}>
          {promo?.code ? (
            <View style={{ gap: 8 }}>
              <View style={styles.promoTag}>
                <Glyph family={MSF} name="sell" size={12} color={SHOWS.white} />
                <Fit
                  size={12}
                  box={16}
                  label={`-${promo.percentOff}%`}
                  fontFamily={fonts.medium}
                  letterSpacing={-0.24}
                  color={SHOWS.white}
                />
              </View>
              <CustomText
                label={promo.code}
                fontSize={16}
                fontFamily={fonts.medium}
                letterSpacing={-0.08}
                color={SHOWS.white}
                marginTop={capTop(16)}
                marginBottom={baseline(16)}
              />
            </View>
          ) : (
            <CustomText
              label="No promo code for this show yet"
              fontSize={16}
              fontFamily={fonts.medium}
              letterSpacing={-0.08}
              color={SHOWS.white48}
              marginTop={capTop(16)}
              marginBottom={baseline(16)}
            />
          )}
          <Glyph family={MS} name="chevron_right" size={24} color={SHOWS.white64} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

/* ──────────────── Ratings & Reviews (2234:2425, pad 12, gap 16) ──────────────── */

const RatingBar = ({ label, value }) => (
  <View style={styles.barRow}>
    <Fit size={12} box={16} label={label} fontFamily={fonts.medium} color={SHOWS.white} width={104} />
    <View style={[styles.row, { flex: 1, gap: 8 }]}>
      <View style={styles.barTrack}>
        <GlassFill fill={SHOWS.white16} />
        <View style={[styles.barFill, { width: `${Math.max(0, Math.min(1, value / 5)) * 100}%` }]} />
      </View>
      <View style={[styles.row, { width: 28, justifyContent: "center" }]}>
        <Fit size={14} box={16} label={String(Math.round(value))} fontFamily={fonts.medium} color={SHOWS.white64} />
        <Glyph family={MSF} name="star" size={16} color={SHOWS.white} />
      </View>
    </View>
  </View>
);

const FilterChip = ({ label, filled, left, right, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={[styles.filterChip, filled ? styles.filterChipFilled : styles.filterChipOutline]}
  >
    {filled ? <GlassFill fill={SHOWS.white04} /> : null}
    {left}
    <Fit size={14} box={28} label={label} fontFamily={fonts.medium} color={filled ? SHOWS.white : SHOWS.white64} />
    {right}
  </TouchableOpacity>
);

const Stars = ({ value, size, color }) => (
  <View style={styles.row}>
    {[0, 1, 2, 3, 4].map((i) => (
      <Glyph
        key={i}
        family={MSF}
        name="star"
        size={size}
        color={i < Math.round(value) ? color : SHOWS.white16}
      />
    ))}
  </View>
);

/** review card (2234:2546): 240 × 231 · r12 · stroke white 8% · pad 12 · gap 12 */
const ReviewCard = ({ review }) => {
  const user = review?.user || {};
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User";
  const images = (review?.images || []).slice(0, 3);
  return (
    <View style={styles.reviewCard}>
      <View style={{ gap: 8 }}>
        <View style={{ gap: 4 }}>
          <View style={[styles.row, { gap: 2 }]}>
            <Fit size={12} box={12} label={name} fontFamily={fonts.medium} color={SHOWS.white} containerStyle={styles.shrink} />
            <UserBadge user={user} size={12} />
          </View>
          <View style={styles.row}>
            <Fit size={12} box={12} label={String(review?.rating ?? 0)} fontFamily={fonts.medium} color={SHOWS.white64} width={12} />
            <Stars value={review?.rating || 0} size={12} color={STAR_YELLOW} />
          </View>
        </View>
        {review?.subtitle ? (
          <CustomText label={review.subtitle} fontSize={12} color={SHOWS.white64} marginTop={capTop(12)} marginBottom={baseline(12)} numberOfLines={1} />
        ) : null}
        {review?.text ? (
          <CustomText label={review.text} fontSize={12} color={SHOWS.white64} marginTop={capTop(12)} marginBottom={baseline(12)} numberOfLines={4} />
        ) : null}
      </View>
      {images.length ? (
        <View style={[styles.row, { gap: 4 }]}>
          {images.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.reviewImage} />
          ))}
        </View>
      ) : null}
      <View style={{ gap: 12 }}>
        <View style={[styles.row, { gap: 4, height: 14 }]}>
          <Fit size={10} box={7} label={String(review?.usefulCount || 0)} letterSpacing={-0.4} color={SHOWS.white64} />
          <Glyph family={MS} name="thumb_up" size={14} color={SHOWS.white64} />
          <Fit size={10} box={7} label="Useful" letterSpacing={-0.4} color={SHOWS.white64} />
        </View>
        <Fit size={10} box={7} label={review?.dateLabel || ""} letterSpacing={-0.4} color={SHOWS.white64} />
      </View>
    </View>
  );
};

export const RatingsReviews = ({ rating, reviews = [], onSeeAll }) => {
  const [open, setOpen] = useOpen();
  const [filter, setFilter] = useState("all");
  const average = Number(rating?.average) || 0;
  const count = Number(rating?.count) || 0;
  const breakdown = rating?.breakdown || [];
  const list = filter === "5" ? reviews.filter((r) => Math.round(r?.rating) === 5) : reviews;
  return (
    <View style={[styles.block, { paddingBottom: 12, gap: 16 }]}>
      <BlockHeader title="Ratings & Reviews" open={open} onToggle={() => setOpen((v) => !v)} />
      {open ? (
        <View style={{ gap: 32 }}>
          {/* overview: "5" Medium 64 · "/5" Medium 20 @64% · 8 · "(Based on N ratings)" */}
          <View style={{ gap: 12 }}>
            <View style={[styles.row, { gap: 8, alignItems: "flex-end" }]}>
              <View style={[styles.row, { alignItems: "flex-end" }]}>
                <CustomText
                  label={average ? String(Math.round(average * 10) / 10).replace(/\.0$/, "") : "0"}
                  fontSize={64}
                  fontFamily={fonts.medium}
                  color={SHOWS.white}
                  marginTop={capTop(64)}
                  marginBottom={baseline(64)}
                />
                <CustomText label="/5" fontSize={20} fontFamily={fonts.medium} color={SHOWS.white64} marginBottom={baseline(20)} />
              </View>
              <CustomText
                label={`(Based on ${formatCount(count)} rating${count === 1 ? "" : "s"})`}
                fontSize={12}
                fontFamily={fonts.medium}
                color={SHOWS.white64}
                marginBottom={baseline(12)}
              />
            </View>
            <View style={{ gap: 4 }}>
              {breakdown.map((b) => (
                <RatingBar key={b.label} label={b.label} value={Number(b.value) || 0} />
              ))}
            </View>
          </View>

          {/* customer reviews */}
          <View style={{ gap: 16 }}>
            <View style={{ gap: 12 }}>
              <View style={[styles.row, { justifyContent: "space-between", gap: 12 }]}>
                <Fit size={16} box={12} label="Customer reviews" fontFamily={fonts.semiBold} color={SHOWS.white} />
                <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll} style={[styles.row, { gap: 4 }]}>
                  <Fit size={12} box={12} label="See all" fontFamily={fonts.medium} color={SHOWS.white64} />
                  <Glyph family={MS} name="arrow_outward" size={12} color={SHOWS.white64} />
                </TouchableOpacity>
              </View>
              <Fit size={12} box={8} label={`(Total ${compact(count)} review${count === 1 ? "" : "s"})`} fontFamily={fonts.medium} color={SHOWS.white64} />
            </View>
            <View style={{ gap: 8 }}>
              <View style={[styles.row, { gap: 4 }]}>
                <FilterChip label="All" filled={filter === "all"} onPress={() => setFilter("all")} />
                <FilterChip
                  label="5"
                  filled={filter === "5"}
                  onPress={() => setFilter(filter === "5" ? "all" : "5")}
                  left={null}
                  right={
                    <View style={styles.row}>
                      <Glyph family={MSF} name="star" size={16} color={SHOWS.white} />
                      <Glyph family={MS} name="expand_more" size={14} color={SHOWS.white} />
                    </View>
                  }
                />
                <FilterChip
                  label="Most recent"
                  right={<Glyph family={MS} name="expand_more" size={14} color={SHOWS.white64} />}
                />
              </View>
              <View style={styles.row}>
                <FilterChip
                  label="Images only"
                  right={<Glyph family={MS} name="photo_camera" size={16} color={SHOWS.white64} />}
                />
              </View>
            </View>
            {list.length ? (
              <View style={[styles.row, { gap: 8, alignItems: "stretch" }]}>
                {list.slice(0, 3).map((r, i) => (
                  <ReviewCard key={r?._id || i} review={r} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyReviews}>
                <CustomText
                  label="No reviews yet"
                  fontSize={14}
                  fontFamily={fonts.medium}
                  color={SHOWS.white48}
                  textAlign="center"
                />
              </View>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
};

/* ─────────── "Instant Confirmation · Free Cancellation" line (2234:2694) ─────────── */

export const BottomNotes = ({ notes = ["Instant Access", "Watch Anywhere"] }) => (
  <View style={styles.notes}>
    {notes.map((n) => (
      <View key={n} style={[styles.row, { gap: 4 }]}>
        <Glyph family={MSF} name="check_circle" size={10} color="#4347FF" />
        <Fit size={12} box={10} label={n} fontFamily={fonts.medium} letterSpacing={-0.36} color={SHOWS.white} />
      </View>
    ))}
  </View>
);

export const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  shrink: { flexShrink: 1 },
  ratingRow: { height: 20, flexDirection: "row", alignItems: "center", gap: 4 },
  bestPill: {
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: GOLD_SOFT,
    justifyContent: "center",
  },
  block: {
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: SHOWS.section,
  },
  blockHeader: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(165, 122, 58, 0.04)",
  },
  protectCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DARK_STROKE_04,
  },
  learnMore: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  paymentGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentIcon: { width: 36, height: 24 },
  promoCard: {
    minHeight: 71,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STROKE_04,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  promoTag: {
    alignSelf: "flex-start",
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: SHOWS.green,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  barRow: { height: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  barTrack: { flex: 1, height: 4, borderRadius: 100, overflow: "hidden" },
  barFill: { height: 4, borderRadius: 100, backgroundColor: SHOWS.gold },
  filterChip: {
    height: 28,
    borderRadius: 100,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 10,
    paddingRight: 8,
  },
  filterChipFilled: {},
  filterChipOutline: { borderWidth: 1, borderColor: STROKE_04, paddingHorizontal: 8 },
  reviewCard: {
    width: 240,
    minHeight: 231,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STROKE_08,
    justifyContent: "space-between",
    gap: 12,
  },
  reviewImage: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#2E2E2E" },
  emptyReviews: {
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STROKE_08,
    alignItems: "center",
    justifyContent: "center",
  },
  notes: {
    height: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
