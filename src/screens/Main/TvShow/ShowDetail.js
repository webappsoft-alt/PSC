import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BlurView } from "@react-native-community/blur";
import {
  Animated,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import UserBadge from "../../../components/UserBadge";
import { openPagerTab } from "../../../navigation/TabStack";
import { fetchShow, toggleSaveShow } from "../../../services/showApi";
import { findCurrency } from "../../../utils/currencies";
import { ToastMessage } from "../../../utils/ToastMessage";
import ShareModal from "../Home/molecules/ShareModal";
import EpisodeOverlay from "./molecules/EpisodeOverlay";
import { Avatar, ImageLabels, SaveButton } from "./molecules/ShowCards";
import {
  BottomNotes,
  BuyingProtection,
  PromoCodeBlock,
  RatingRow,
  RatingsReviews,
} from "./molecules/ShowDetailBlocks";
import ShowDetailSkeleton from "./molecules/ShowDetailSkeleton";
import useEpisodePurchase from "./molecules/useEpisodePurchase";
import {
  GlassFill,
  Glyph,
  SHOWS,
  baseline,
  capGap,
  capTop,
  fitLine,
} from "./molecules/showsLayout";

/**
 * Figma › Shows › "SHOW DETAIL PAGE" (Event-Detail-Page 2234:1887).
 * #262626 page, #121212 blocks 4pt apart, 375 hero under a 100pt header
 * (#121212 64% → 0), fixed bottom bar. Event-only blocks of that frame
 * (ratings, buying protection, promo code, reviews, ticket notes) are left
 * out; the rest is mapped to the show's latest episode.
 */
const MS = "MaterialSymbolsRounded";
const MSF = "MaterialSymbolsRoundedFilled";
const BLOCK_GAP = 4;
const RAIL_CARD_W = 240;
const TABS = ["Overview", "Episodes", "Cast"]; // design only for now

const priceLabel = (price) => {
  const amount = Number(price?.amount) || 0;
  if (amount <= 0) return "";
  const cur = findCurrency(price?.currency);
  return `${cur?.symbol || "$"}${amount.toFixed(2)}`;
};

const creatorName = (u) =>
  `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || u?.username || "";

const durationLabel = (seconds) => {
  const s = Math.round(Number(seconds) || 0);
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${Math.max(m, 1)}m`;
};

/* ─────────────────────────── header (2234:2705) ─────────────────────────── */

const HeaderButton = ({ icon, size = 20, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.headerButton}>
    <GlassFill fill={SHOWS.white16} />
    <Glyph family={MS} name={icon} size={size} color={SHOWS.white} />
  </TouchableOpacity>
);

/* ─────────────────────────── one-line helpers ───────────────────────────── */

/** text whose cap height is centred in a Figma row of `box` pt */
const Fit = ({ size, box, ...props }) => (
  <CustomText
    fontSize={size}
    marginTop={fitLine(size, box)}
    marginBottom={fitLine(size, box)}
    numberOfLines={1}
    {...props}
  />
);

const Dot = () => <View style={styles.dot} />;

/* ─────────────────────── rail card (2234:2597, 240 wide) ─────────────────── */

const RailCard = ({ show, onPress }) => {
  const ep = show?.latestEpisode;
  const price = priceLabel(ep?.price);
  const watched = show?.watchedBy;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.railCard}>
      {/* image 240×135 r12 · #121212 32% · pad 8 · avatar 20 / save 32 white 16% */}
      <View style={styles.railImage}>
        {show?.cover ? (
          <FastImage source={{ uri: show.cover }} style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={[StyleSheet.absoluteFill, styles.railShade]} />
        <View style={styles.railImageTop}>
          <Avatar
            uri={show?.creator?.avatar}
            color={show?.creator?.profileColor}
            size={20}
          />
          <SaveButton show={show} fill={SHOWS.white16} />
        </View>
        <ImageLabels
          discount={show?.discountPercent}
          sponsored={show?.sponsored}
          pillFill={SHOWS.white16}
        />
      </View>

      {/* text block: rows 12 / 12 / 12 / 12 / 14 · MATCH 16, 4 apart, 8 below image */}
      <View style={styles.railText}>
        <View style={styles.railRow}>
          {show?.isNew ? (
            <View style={styles.newTagSmall}>
              <Fit
                size={8}
                box={12}
                label="NEW"
                fontFamily={fonts.semiBold}
                letterSpacing={-0.04}
                color={SHOWS.green}
              />
            </View>
          ) : null}
          <Fit
            size={14}
            box={12}
            label={show?.showName}
            fontFamily={fonts.medium}
            color={SHOWS.white}
            containerStyle={styles.shrink}
          />
        </View>
        {show?.topic ? (
          <View style={[styles.railRow, { gap: 2 }]}>
            <Glyph family={MSF} name="sell" size={12} color={SHOWS.white} />
            <Fit
              size={12}
              box={12}
              label={show.topic}
              fontFamily={fonts.medium}
              letterSpacing={-0.36}
              color={SHOWS.white}
              containerStyle={styles.shrink}
            />
          </View>
        ) : null}
        {ep ? (
          <View style={[styles.railRow, { gap: 2 }]}>
            <Glyph family={MSF} name="event" size={12} color={SHOWS.white} />
            <Fit
              size={12}
              box={12}
              label={`S${ep.seasonNumber}, E${ep.episodeNumber}`}
              letterSpacing={-0.48}
              color={SHOWS.white64}
            />
          </View>
        ) : null}
        <View style={styles.railRow}>
          <Fit
            size={12}
            box={12}
            label={price || "Free"}
            fontFamily={fonts.medium}
            letterSpacing={-0.36}
            color={SHOWS.green}
          />
          <View style={styles.railDivider} />
          <View style={[styles.railRow, { gap: 2 }]}>
            <Glyph family={MSF} name="movie" size={12} color={SHOWS.white} />
            <Fit
              size={12}
              box={12}
              label={`${show?.totalEpisodes || 0} episode${show?.totalEpisodes === 1 ? "" : "s"}`}
              fontFamily={fonts.medium}
              letterSpacing={-0.36}
              color={SHOWS.white}
            />
          </View>
        </View>
        {watched ? (
          <View style={[styles.railRow, { height: 14 }]}>
            <Avatar uri={watched.avatar} color={watched.profileColor} size={14} />
            <View style={[styles.railRow, { gap: 2 }, styles.shrink]}>
              <Fit
                size={12}
                box={8}
                label={watched.name}
                fontFamily={fonts.medium}
                letterSpacing={-0.36}
                color={SHOWS.white}
                containerStyle={styles.shrink}
              />
              {watched.others > 0 ? (
                <Fit
                  size={12}
                  box={8}
                  label={`& ${watched.others} other${watched.others > 1 ? "s" : ""}`}
                  letterSpacing={-0.48}
                  color={SHOWS.white64}
                />
              ) : null}
            </View>
          </View>
        ) : null}
        {show?.match ? (
          <View style={styles.matchSmall}>
            <Fit
              size={10}
              box={16}
              label={`${show.match}% MATCH`}
              fontFamily={fonts.semiBold}
              letterSpacing={-0.05}
              color={SHOWS.green}
            />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

/** "You Might Also Like" / "Others Have Also Watched" (2234:2587): pad 12, gap 12 */
const Rail = ({ title, shows, onPressShow }) => {
  const [open, setOpen] = useState(true);
  if (!shows?.length) return null;
  return (
    <View style={styles.rail}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setOpen((v) => !v)}
        style={styles.railHeader}
      >
        <View style={[styles.row, { gap: 4 }, styles.shrink]}>
          <Fit
            size={16}
            box={20}
            label={title}
            fontFamily={fonts.semiBold}
            color={SHOWS.white}
            containerStyle={styles.shrink}
          />
          {shows.some((s) => s?.sponsored) ? (
            <View style={styles.sponsoredChip}>
              <GlassFill fill={SHOWS.white08} borderRadius={6} />
              <Fit size={12} box={12} label="Sponsored" fontFamily={fonts.medium} color={SHOWS.white64} />
            </View>
          ) : null}
        </View>
        <Glyph
          family={MS}
          name={open ? "expand_more" : "chevron_right"}
          size={24}
          color={SHOWS.white64}
        />
      </TouchableOpacity>
      {open ? (
        <FlatList
          horizontal
          data={shows}
          keyExtractor={(item, i) => String(item?._id || i)}
          renderItem={({ item }) => (
            <RailCard show={item} onPress={() => onPressShow(item)} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railList}
        />
      ) : null}
    </View>
  );
};

/* ──────────────────────────────── screen ──────────────────────────────── */

const ShowDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const userData = useSelector((state) => state.users.userData);
  const showId = route.params?.showId;

  const [show, setShow] = useState(route.params?.preview || null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState(TABS[0]);
  const [saved, setSaved] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [barHeight, setBarHeight] = useState(124);
  const [player, setPlayer] = useState(null); // { startIndex, origin }
  const heroRef = useRef(null);
  const { width: windowWidth } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { buy, buying } = useEpisodePurchase();

  const load = useCallback(async ({ silent } = {}) => {
    if (!showId) return;
    if (!silent) setLoading(true);
    setFailed(false);
    try {
      const res = await fetchShow(showId);
      const data = res?.data?.data;
      if (data) {
        setShow(data);
        setSaved(!!data.isSaved);
      } else setFailed(true);
    } catch (e) {
      setFailed(true);
      ToastMessage(e?.message || "Could not load this show", "error");
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    load();
  }, [load]);

  const episodes = useMemo(
    () =>
      [...(show?.episodes || [])].sort(
        (a, b) =>
          a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber,
      ),
    [show?.episodes],
  );
  // the page is about the latest episode (Figma "About This Episode")
  const episode = episodes.length ? episodes[episodes.length - 1] : null;
  // Watch Now resumes the last watched episode, else starts the latest
  const startEpisodeIndex = useMemo(() => {
    const resumeId = show?.continueWatching?.episodeId
      ? String(show.continueWatching.episodeId)
      : null;
    const i = resumeId ? episodes.findIndex((e) => String(e._id) === resumeId) : -1;
    return i >= 0 ? i : Math.max(0, episodes.length - 1);
  }, [episodes, show?.continueWatching?.episodeId]);
  const creator = show?.userId && typeof show.userId === "object" ? show.userId : null;
  const cover = episode?.cover || show?.coverImage || show?.cover || "";
  const price = priceLabel(episode?.price);
  const subscribersOnly =
    !!episode?.isSubscribersOnly || (show?.availableTo || []).includes("subscribers");
  const needsPurchase = !!price && !episode?.isPurchased;
  const isOwner = !!show?.isOwner || (creator?._id && creator._id === userData?._id);
  const genres = episode?.genres?.length ? episode.genres : show?.genres || [];
  const endDate = episode?.availability?.endDate;

  const openCreator = () => {
    if (!creator?._id) return;
    if (creator._id === userData?._id) {
      navigation.goBack();
      openPagerTab("Profile");
      return;
    }
    navigation.navigate("UserProfile", { userId: creator._id });
  };

  const messageCreator = () =>
    navigation.navigate("InboxScreen", {
      recipientId: creator?._id,
      recipientName: creatorName(creator),
      otherUser: creator,
    });

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      const res = await toggleSaveShow(show._id);
      if (res?.data?.success) setSaved(!!res.data.data?.saved);
    } catch (e) {
      setSaved(!next);
      ToastMessage(e?.message || "Could not save this show", "error");
    }
  };

  const showAvailability = () => {
    const start = episode?.availability?.startDate;
    if (!start && !endDate) {
      ToastMessage("This episode has no availability window", "info");
      return;
    }
    const from = start ? moment(start).format("MMM D, YYYY") : "now";
    const to = endDate ? moment(endDate).format("MMM D, YYYY") : "no end date";
    ToastMessage(`Available ${from} – ${to}`, "info");
  };

  const openPlayer = (index = startEpisodeIndex) => {
    if (!episodes.length) return;
    const open = (origin) => setPlayer({ startIndex: index, origin });
    if (heroRef.current?.measureInWindow) {
      heroRef.current.measureInWindow((x, y, w, h) =>
        open({ x, y, width: w, height: h }),
      );
    } else open(null);
  };

  const buyEpisode = async () => {
    if (!episode) return;
    const ok = await buy(show._id, episode._id);
    if (ok) {
      await load({ silent: true });
      openPlayer(episodes.length - 1);
    }
  };

  // "Buy Now" on the bar for a paid episode the viewer doesn't own; otherwise Watch Now
  const watch = () => {
    if (needsPurchase && !isOwner) {
      buyEpisode();
      return;
    }
    openPlayer();
  };

  const openShow = (item) => navigation.push("ShowDetail", { showId: item._id, preview: null });

  const headerHeight = insets.top + 8 + 40 + 8; // Figma 100 = 44 + 56

  if (!show && loading) {
    return (
      <View style={styles.page}>
        <ShowDetailSkeleton />
        <View style={[styles.header, { height: headerHeight, paddingTop: insets.top + 8 }]}>
          <HeaderButton icon="chevron_left" size={24} onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  if (!show && failed) {
    return (
      <View style={[styles.page, styles.center, { paddingHorizontal: 24 }]}>
        <CustomText
          label="This show isn't available"
          fontSize={16}
          fontFamily={fonts.medium}
          color={SHOWS.white}
        />
        <CustomText
          label="Try again"
          fontSize={14}
          fontFamily={fonts.medium}
          color={SHOWS.gold}
          marginTop={12}
          onPress={load}
        />
      </View>
    );
  }

  const seLabel = episode ? `S${episode.seasonNumber}, E${episode.episodeNumber}` : "";
  const barMeta = [
    episode?.availability?.startDate
      ? moment(episode.availability.startDate).calendar(null, {
          sameDay: "[Today] h:mm A",
          nextDay: "[Tomorrow] h:mm A",
          lastDay: "[Yesterday] h:mm A",
          nextWeek: "ddd h:mm A",
          lastWeek: "MMM D",
          sameElse: "MMM D, YYYY",
        })
      : "",
    durationLabel(episode?.durationSeconds),
    episode?.ageRating ? `${episode.ageRating}+` : "",
  ].filter(Boolean);

  return (
    <View style={styles.page}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        contentContainerStyle={{ gap: BLOCK_GAP, paddingBottom: barHeight + BLOCK_GAP }}
      >
        {/* hero 375 × 375 */}
        <View ref={heroRef} collapsable={false} style={styles.hero}>
          {cover ? (
            <FastImage source={{ uri: cover }} style={StyleSheet.absoluteFill} />
          ) : null}
        </View>

        {/* creator row (2234:1889): 52 · pad 6/12 · avatar 28 · 8 · name SemiBold 16 + badge 16 (2) · chat 40 */}
        {creator ? (
          <View style={styles.creatorRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openCreator}
              style={styles.creatorLeft}
            >
              <Avatar
                uri={creator?.profile?.avatar}
                color={creator?.profile?.profileColor}
                size={28}
              />
              <View style={[styles.row, { gap: 2 }, styles.shrink]}>
                <Fit
                  size={16}
                  box={16}
                  label={creatorName(creator)}
                  fontFamily={fonts.semiBold}
                  color={SHOWS.white}
                  textTransform="capitalize"
                  containerStyle={styles.shrink}
                />
                <UserBadge user={creator} size={16} />
              </View>
            </TouchableOpacity>
            {!isOwner ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={messageCreator}
                style={styles.chatButton}
              >
                <GlassFill fill={SHOWS.white04} />
                <Glyph family={MS} name="forum" size={20} color={SHOWS.white} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Subscribe / Buy This Episode (2234:2107): 53 · pad 8/12 · gap 6 · chips 37 r100 */}
        {!isOwner && (subscribersOnly || needsPurchase) ? (
          <View style={styles.buyRow}>
            {subscribersOnly ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate("Plans")}
                style={[styles.buyChip, { backgroundColor: SHOWS.white }]}
              >
                <CustomText
                  label="Subscribe"
                  fontSize={12}
                  fontFamily={fonts.medium}
                  color={SHOWS.section}
                  marginTop={capTop(12)}
                />
                <CustomText
                  label="Premium"
                  fontSize={10}
                  color="rgba(18, 18, 18, 0.48)"
                  marginTop={capGap(6, 12, 10)}
                  marginBottom={baseline(10)}
                />
              </TouchableOpacity>
            ) : null}
            {needsPurchase ? (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={buying}
                onPress={buyEpisode}
                style={styles.buyChip}
              >
                <GlassFill fill={SHOWS.white08} />
                <CustomText
                  label="Buy This Episode"
                  fontSize={12}
                  fontFamily={fonts.medium}
                  color={SHOWS.white}
                  marginTop={capTop(12)}
                />
                <CustomText
                  label={price}
                  fontSize={10}
                  color={SHOWS.white48}
                  marginTop={capGap(6, 12, 10)}
                  marginBottom={baseline(10)}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* tabs (2234:1903): 48 · pad 6/12 · chips 28 r100 pad 10 · gap 6 — design only */}
        <View style={styles.tabsRow}>
          {TABS.map((t) => {
            const active = t === tab;
            return (
              <TouchableOpacity
                key={t}
                activeOpacity={0.8}
                onPress={() => setTab(t)}
                style={[styles.tab, active && { backgroundColor: SHOWS.white }]}
              >
                {!active ? <GlassFill fill={SHOWS.white08} /> : null}
                <Fit
                  size={12}
                  box={8}
                  label={t}
                  fontFamily={active ? fonts.medium : fonts.regular}
                  color={active ? SHOWS.section : SHOWS.white48}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* info (2234:1913): pad 12 · genres 24 · 12 · title SemiBold 24 · 12 · pill 24 */}
        <View style={styles.info}>
          <RatingRow rating={show?.rating} />
          {genres.length ? (
            <View style={[styles.genres, { marginTop: 8 }]}>
              {genres.map((g) => (
                <View key={g} style={styles.genreChip}>
                  <GlassFill fill={SHOWS.white04} />
                  <Fit
                    size={12}
                    box={8}
                    label={g}
                    fontFamily={fonts.medium}
                    letterSpacing={-0.06}
                    color={SHOWS.white}
                    textTransform="capitalize"
                  />
                </View>
              ))}
            </View>
          ) : null}
          <CustomText
            label={episode?.title || show?.showName || ""}
            fontSize={24}
            fontFamily={fonts.semiBold}
            letterSpacing={-0.48}
            color={SHOWS.white}
            marginTop={12 + capTop(24)}
            marginBottom={baseline(24)}
          />
          {subscribersOnly || endDate ? (
            <View style={[styles.goldPill, { marginTop: 12 }]}>
              <GlassFill fill="rgba(161, 147, 117, 0.04)" />
              <Fit
                size={12}
                box={8}
                label={
                  endDate
                    ? `Available until ${moment(endDate).format("MMM D")}`
                    : "Subscribers only"
                }
                fontFamily={fonts.medium}
                letterSpacing={-0.06}
                color={SHOWS.gold}
              />
            </View>
          ) : null}
        </View>

        {/* About This Episode (2234:1998): pad 16/12 · SemiBold 22 · 12 · Medium 14 @64% */}
        {episode?.synopsis || show?.synopsis ? (
          <View style={styles.about}>
            <CustomText
              label="About This Episode"
              fontSize={22}
              fontFamily={fonts.semiBold}
              color={SHOWS.white}
              marginTop={capTop(22)}
            />
            <CustomText
              label={episode?.synopsis || show?.synopsis}
              fontSize={14}
              fontFamily={fonts.medium}
              color={SHOWS.white64}
              marginTop={capGap(12, 22, 14)}
              marginBottom={baseline(14)}
            />
          </View>
        ) : null}

        <BuyingProtection
          onLearnMore={() => ToastMessage("Buying protection applies to every PSC purchase", "info")}
        />
        <PromoCodeBlock
          promo={show?.promo}
          onPress={() =>
            ToastMessage(
              show?.promo?.code ? "Promo code applied at checkout" : "Check back for promo codes",
              "info",
            )
          }
        />
        <RatingsReviews
          rating={show?.rating}
          reviews={show?.reviews}
          onSeeAll={() => ToastMessage("Reviews are coming soon", "info")}
        />
        <Rail title="You Might Also Like" shows={show?.similar} onPressShow={openShow} />
        <Rail
          title="Others Have Also Watched"
          shows={show?.alsoWatched}
          onPressShow={openShow}
        />
      </Animated.ScrollView>

      {/* header (2234:2705): 100 · pad 52/12/8 · #121212 64% → 0 over the
          hero; once the page scrolls under it, the same chrome as the Shows
          feed header fades in (blur 16 + #121212 64%) so content never
          shows through */}
      <View style={[styles.header, { height: headerHeight, paddingTop: insets.top + 8 }]}>
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(18, 18, 18, 0.64)", "rgba(18, 18, 18, 0)"]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: scrollY.interpolate({
                inputRange: [
                  Math.max(0, windowWidth - headerHeight - 48),
                  Math.max(1, windowWidth - headerHeight),
                ],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={16}
            overlayColor="transparent"
            reducedTransparencyFallbackColor={SHOWS.section}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(18, 18, 18, 0.64)" }]} />
        </Animated.View>
        <HeaderButton icon="chevron_left" size={24} onPress={() => navigation.goBack()} />
        <Fit
          size={20}
          box={14}
          label={show?.showName || ""}
          fontFamily={fonts.semiBold}
          letterSpacing={-0.1}
          color={SHOWS.white}
          textTransform="capitalize"
          containerStyle={styles.headerTitle}
        />
        <View style={styles.headerRight}>
          <HeaderButton icon="search" onPress={() => navigation.navigate("SearchScreen")} />
          <HeaderButton icon="ios_share" onPress={() => setShareVisible(true)} />
        </View>
      </View>

      {/* bottom bar (2234:2660): pad 8/12/34 · gap 6 · meta 12 · buttons 48 */}
      <View
        onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}
        style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        {seLabel ? (
          <View style={styles.barMeta}>
            <Glyph family={MSF} name="schedule" size={12} color={SHOWS.white} />
            <View style={[styles.row, { gap: 4 }, styles.shrink]}>
              <Fit
                size={10}
                box={7}
                label={seLabel}
                fontFamily={fonts.medium}
                letterSpacing={-0.3}
                color={SHOWS.white}
              />
              {barMeta.map((m) => (
                <View key={m} style={[styles.row, { gap: 4 }]}>
                  <Dot />
                  <Fit
                    size={10}
                    box={7}
                    label={m}
                    letterSpacing={-0.4}
                    color={SHOWS.white64}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <View style={styles.barButtons}>
          <TouchableOpacity activeOpacity={0.7} onPress={toggleSave} style={styles.barCircle}>
            <GlassFill fill={SHOWS.white04} />
            <Glyph
              family={saved ? MSF : MS}
              name="favorite"
              size={24}
              color={SHOWS.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={watch}
            disabled={!episode || buying}
            style={[styles.watch, !episode && { opacity: 0.48 }]}
          >
            <CustomText
              label={needsPurchase && !isOwner ? `Buy Now · ${price}` : "Watch Now"}
              fontSize={16}
              fontFamily={fonts.medium}
              color={SHOWS.section}
              textAlign="center"
              numberOfLines={1}
              marginTop={capTop(16)}
            />
            <CustomText
              label={
                buying
                  ? "Opening payment…"
                  : episode
                  ? `Season ${episode.seasonNumber} · Episode ${episode.episodeNumber}`
                  : "No episodes yet"
              }
              fontSize={12}
              fontFamily={fonts.medium}
              color={SHOWS.section}
              textAlign="center"
              numberOfLines={1}
              marginTop={capGap(6, 16, 12)}
              marginBottom={baseline(12)}
            />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={showAvailability} style={styles.barCircle}>
            <GlassFill fill={SHOWS.white04} />
            <Glyph family={MS} name="event" size={24} color={SHOWS.white} />
          </TouchableOpacity>
        </View>
        <BottomNotes />
      </View>

      {player ? (
        <EpisodeOverlay
          episodes={episodes}
          startIndex={player.startIndex}
          origin={player.origin}
          show={show}
          initialThumbnailUri={cover}
          onClose={() => {
            setPlayer(null);
            load({ silent: true });
          }}
          onEpisodeUnlocked={() => load({ silent: true })}
        />
      ) : null}

      <ShareModal
        isVisible={shareVisible}
        onClose={() => setShareVisible(false)}
        postImage={cover}
        username={show?.showName}
        postId={show?._id}
        urlPrefix="psc://show/"
        shouldTrackShare={false}
        shareMessage={`Watch ${show?.showName || "this show"} on Private Social Club: psc://show/${show?._id}`}
      />
    </View>
  );
};

export default ShowDetail;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: SHOWS.page,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  shrink: {
    flexShrink: 1,
  },
  hero: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: SHOWS.section,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creatorRow: {
    height: 52,
    paddingHorizontal: 12,
    backgroundColor: SHOWS.section,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 32,
  },
  creatorLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  buyRow: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: SHOWS.section,
    flexDirection: "row",
    gap: 6,
  },
  buyChip: {
    flex: 1,
    height: 37,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsRow: {
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: SHOWS.section,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tab: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: 12,
    backgroundColor: SHOWS.section,
  },
  genres: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  genreChip: {
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  goldPill: {
    alignSelf: "flex-start",
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  about: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: SHOWS.section,
  },
  rail: {
    paddingVertical: 12,
    backgroundColor: SHOWS.section,
    gap: 12,
  },
  railHeader: {
    height: 24,
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  sponsoredChip: {
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 6,
    overflow: "hidden",
    justifyContent: "center",
  },
  railList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  railCard: {
    width: RAIL_CARD_W,
    gap: 8,
  },
  railImage: {
    width: RAIL_CARD_W,
    height: 135,
    borderRadius: 12,
    overflow: "hidden",
    padding: 8,
    justifyContent: "space-between",
    backgroundColor: SHOWS.white04,
  },
  railShade: {
    backgroundColor: "rgba(18, 18, 18, 0.32)",
  },
  railImageTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  railText: {
    gap: 4,
  },
  railRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newTagSmall: {
    paddingHorizontal: 8 / 3,
    borderRadius: 8 / 3,
    backgroundColor: SHOWS.greenSoft,
  },
  railDivider: {
    width: 1,
    height: 12,
    borderRadius: 100,
    backgroundColor: SHOWS.white16,
  },
  matchSmall: {
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: SHOWS.greenSoft,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 100,
    backgroundColor: SHOWS.white16,
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    paddingHorizontal: 12,
    gap: 6,
    backgroundColor: SHOWS.section,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  barMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  barButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  barCircle: {
    width: 48,
    height: 48,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  watch: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    paddingHorizontal: 12,
    backgroundColor: SHOWS.gold,
    justifyContent: "center",
  },
});
