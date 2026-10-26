import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { createThumbnail } from "react-native-create-thumbnail";
import RNFS from "react-native-fs";
import DatePicker from "react-native-date-picker";
import { openPicker } from "react-native-image-crop-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video from "react-native-video";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import FlagImage from "../../../components/FlagImage";
import Icons from "../../../components/Icons";
import UserBadge from "../../../components/UserBadge";
import MediaBottomBlur from "../../../components/MediaBottomBlur";
import { openPagerTab } from "../../../navigation/TabStack";
import {
  createEpisode,
  verifyEpisodeNumber,
} from "../../../services/showApi";
import { uploadAndGetUrl, uploadFileGetUrl } from "../../../utils/constants";
import { findCurrency } from "../../../utils/currencies";
import { PSC_TOPICS } from "../../../utils/feedTopics";
import { AGE_RATINGS, onShowPick } from "../../../utils/showPicks";
import { ToastMessage } from "../../../utils/ToastMessage";
import PeopleSelection from "../PublishPost/molecules/PeopleSelection";
import {
  BottomCTA,
  FieldBox,
  FormDivider,
  FormHeader,
  InfoLine,
  InputField,
  SectionTitle,
  SelectField,
  ToggleField,
} from "./molecules/ShowForm";
import { GlassFill, SHOWS, capGap, capTop } from "./molecules/showsLayout";

/**
 * Figma Shows › "Create-A-Show" (7580:13422) — "Create An Episode".
 * 375 wide, #121212, pad 116 (header 100 + 16) / 12 / 126; blocks 24 apart
 * with 1pt white 4% rules. Preview 351×197 (r20, 2pt white 4% inside
 * stroke, pad 4 → r16 image; top gradient + 36 delete circle, bottom
 * gradient + "Preview"); "3hr long maximum." / "Video too long"; "16:9
 * ratio" pill. General Details (fields 16 apart, info 6 below), Subscribers
 * only, Availability (chips + dates), Price, AI / Confirm / TOS toggles
 * (info 8 below), bottom "Submit Show".
 */
const MAX_VIDEO_SECONDS = 3 * 60 * 60; // "3hr long maximum."
const SYNOPSIS_MAX = 150;
const CREATOR_SHARE = 0.8; // "You keep as much as 80% of it"
const AVAILABILITY = [
  { label: "7-days", add: [7, "days"] },
  { label: "14-day", add: [14, "days"] },
  { label: "3 weeks", add: [3, "weeks"] },
  { label: "1 month", add: [1, "month"] },
];

// Figma preview: 343 × 189 image inside the 351 frame (2pt stroke + pad 2)
const PREVIEW_H = 189;

/** "file://" for local paths (createThumbnail / crop-picker return both). */
const fileUri = (p) =>
  !p ? "" : /^(file|https?|content|ph):\/\//.test(p) ? p : `file://${p}`;

/**
 * crop-picker's video can live in a temporary container that the thumbnail
 * generator can't open — copy it to the cache first (as CreateShort does),
 * then try 1s and, for very short clips, the first frame.
 */
const makeThumbnail = async (path) => {
  let source = fileUri(path);
  try {
    const ext = (path.split(".").pop() || "mp4").split("?")[0];
    const dest = `${RNFS.CachesDirectoryPath}/episode_${Date.now()}.${ext}`;
    await RNFS.copyFile(path.replace(/^file:\/\//, ""), dest);
    source = `file://${dest}`;
  } catch (e) {
    // keep the original path
  }
  for (const timeStamp of [1000, 0]) {
    try {
      const res = await createThumbnail({ url: source, timeStamp });
      if (res?.path) return fileUri(res.path);
    } catch (e) {
      // try the next frame
    }
  }
  return "";
};

const isPositiveInt = (v) => /^\d+$/.test(String(v).trim()) && Number(v) >= 1;
const dateLabel = (d) => moment(d).format("MMM D, YYYY");
const timeLabel = (d) => moment(d).format("hh:mm A");
const userName = (u) =>
  `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || u?.username || "";

const CreateEpisode = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  // 351 frame (12 page pad each side) − 2pt stroke − 2pt pad on each side
  const previewWidth = windowWidth - 24 - 8;

  // media
  const [video, setVideo] = useState(null); // { path, mime, duration }
  const [thumb, setThumb] = useState("");
  const [videoError, setVideoError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef(null); // Promise<{ preview, cover }>
  const uploadSession = useRef(0);

  // general details
  const [show, setShow] = useState(null);
  const [title, setTitle] = useState("");
  const [season, setSeason] = useState("");
  const [episode, setEpisode] = useState("");
  const [numberTaken, setNumberTaken] = useState(false);
  const [genres, setGenres] = useState([]);
  // Select-Genre drag order of the topic rows (kept while the form is open)
  const [genreOrder, setGenreOrder] = useState(() => PSC_TOPICS.map((t) => t.name));
  const [synopsis, setSynopsis] = useState("");
  const [cast, setCast] = useState([]);
  const [castVisible, setCastVisible] = useState(false);
  const [ageRating, setAgeRating] = useState(18);

  // settings
  const [subscribersOnly, setSubscribersOnly] = useState(false);
  const [availability, setAvailability] = useState(AVAILABILITY[0].label);
  const [start, setStart] = useState(() => moment().startOf("minute").toDate());
  const [end, setEnd] = useState(() =>
    moment().startOf("minute").add(7, "days").toDate(),
  );
  const [picker, setPicker] = useState(null); // { field: "start"|"end", mode }
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [containsAI, setContainsAI] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [tos, setTos] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // picker screens → this form
  useEffect(
    () =>
      onShowPick((pick) => {
        if (pick?.show) setShow(pick.show);
        if (pick?.genres) setGenres(pick.genres);
        if (pick?.genreOrder) setGenreOrder(pick.genreOrder);
        if (pick?.ageRating) setAgeRating(pick.ageRating);
        if (pick?.currency) setCurrency(pick.currency);
        if (pick?.removedShowId) {
          setShow((s) => (s?._id === pick.removedShowId ? null : s));
        }
      }),
    [],
  );

  // season + episode must be free in the chosen show
  useEffect(() => {
    setNumberTaken(false);
    if (!show?._id || !isPositiveInt(season) || !isPositiveInt(episode)) {
      return undefined;
    }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await verifyEpisodeNumber(show._id, season, episode);
        if (alive) setNumberTaken(res?.data?.data?.available === false);
      } catch (e) {
        // checked again by the server on submit
      }
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [show?._id, season, episode]);

  /* ───────────────────────── video ───────────────────────── */

  const startUpload = (picked, thumbPath) => {
    const session = ++uploadSession.current;
    setUploading(true);
    const promise = (async () => {
      const [videoRes, coverUrl] = await Promise.all([
        uploadFileGetUrl(
          { localUri: picked.path, name: `episode-${Date.now()}.mp4` },
          picked.mime || "video/mp4",
        ),
        thumbPath
          ? uploadAndGetUrl({ path: thumbPath, type: "image/jpeg", name: "cover.jpg" })
          : Promise.resolve(""),
      ]);
      const preview =
        videoRes?.file ||
        videoRes?.url ||
        videoRes?.image ||
        (typeof videoRes === "string" ? videoRes : "");
      return { preview, cover: coverUrl || "" };
    })();
    uploadRef.current = promise;
    promise
      .catch(() => null)
      .finally(() => {
        if (session === uploadSession.current) setUploading(false);
      });
  };

  const pickVideo = async () => {
    try {
      const picked = await openPicker({ mediaType: "video" });
      if (!picked?.path) return;
      // crop-picker reports the duration in ms
      const seconds = (picked.duration || 0) / 1000;
      if (seconds > MAX_VIDEO_SECONDS) {
        setVideoError(true);
        return;
      }
      setVideoError(false);
      setVideo({ path: picked.path, mime: picked.mime, duration: seconds });
      setThumb("");
      const thumbPath = await makeThumbnail(picked.path);
      setThumb(thumbPath);
      startUpload(picked, thumbPath);
    } catch (e) {
      // picker cancelled
    }
  };

  const removeVideo = () => {
    uploadSession.current += 1;
    uploadRef.current = null;
    setUploading(false);
    setVideo(null);
    setThumb("");
    setVideoError(false);
  };

  /* ─────────────────────── availability ───────────────────── */

  const pickAvailability = (option) => {
    const from = moment().startOf("minute");
    setAvailability(option.label);
    setStart(from.toDate());
    setEnd(from.clone().add(option.add[0], option.add[1]).toDate());
  };

  const onPickDate = (date) => {
    const field = picker?.field;
    setPicker(null);
    if (!field) return;
    setAvailability(null); // a custom window
    if (field === "start") {
      setStart(date);
      if (moment(end).isBefore(date)) setEnd(moment(date).add(7, "days").toDate());
    } else {
      setEnd(date);
    }
  };

  /* ───────────────────────── submit ───────────────────────── */

  const priceNumber = Number(price) || 0;
  const keep = (priceNumber * CREATOR_SHARE).toFixed(2);
  const cur = findCurrency(currency);

  const missing = useMemo(() => {
    if (!video) return "Add the episode video";
    if (!show?._id) return "Select a show";
    if (!title.trim()) return "Add the episode title";
    if (!isPositiveInt(season)) return "Enter the season number";
    if (!isPositiveInt(episode)) return "Enter the episode number";
    if (numberTaken) return "This show already has that episode number";
    if (!genres.length) return "Pick at least one genre";
    if (!moment(end).isAfter(start)) return "The ending date must be after the starting date";
    if (!confirmed) return "Confirm all the above information";
    if (!tos) return "Accept the Terms of Service";
    return null;
  }, [video, show, title, season, episode, numberTaken, genres, start, end, confirmed, tos]);

  const submit = async () => {
    if (missing) {
      ToastMessage(missing, "error");
      return;
    }
    setSubmitting(true);
    try {
      const media = await uploadRef.current?.catch(() => null);
      if (!media?.preview) {
        ToastMessage("The video could not be uploaded. Please pick it again.", "error");
        return;
      }
      const body = {
        title: title.trim(),
        preview: media.preview,
        cover: media.cover,
        durationSeconds: Math.round(video?.duration || 0),
        seasonNumber: Number(season),
        episodeNumber: Number(episode),
        genres,
        synopsis: synopsis.trim(),
        cast: cast.map((u) => u?._id).filter(Boolean),
        ageRating,
        isSubscribersOnly: subscribersOnly,
        availability: {
          startDate: moment(start).format("YYYY-MM-DD"),
          startTime: moment(start).format("HH:mm"),
          endDate: moment(end).format("YYYY-MM-DD"),
          endTime: moment(end).format("HH:mm"),
        },
        price: { currency: cur.id, amount: priceNumber },
        isAi: containsAI,
      };
      const res = await createEpisode(show._id, body);
      if (res?.data?.success) {
        ToastMessage("Episode published", "success");
        navigation.goBack();
        // land on the Shows tab, which refreshes on focus
        setTimeout(() => openPagerTab("Shows"), 300);
      }
    } catch (e) {
      ToastMessage(e?.message || "Could not publish the episode", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const ageLabel =
    AGE_RATINGS.find((a) => a.value === ageRating)?.title || `+${ageRating}`;

  return (
    <View style={styles.page}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 56 + 16,
            paddingHorizontal: 12,
            paddingBottom: Math.max(insets.bottom, 12) + 56 + 36,
            gap: 24,
          }}
        >
          {/* ───────── Preview ───────── */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={video ? undefined : pickVideo}
            style={styles.previewFrame}
          >
            <View style={styles.preview}>
              {video ? (
                <>
                  {thumb ? (
                    <Image
                      source={{ uri: thumb }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : (
                    // no frame yet (or the generator failed): the video's own
                    // first frame
                    <Video
                      source={{ uri: fileUri(video.path) }}
                      paused
                      muted
                      resizeMode="cover"
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  {/* Figma: top frame 52 — progressive blur 16 → 0 + #121212
                      linear @16%; bottom frame 42 — blur 0 → 16 + linear */}
                  <MediaBottomBlur
                    edge="top"
                    uri={thumb}
                    isVideo={!thumb}
                    width={previewWidth}
                    mediaHeight={PREVIEW_H}
                    height={52}
                    blurRadius={16}
                    borderBottomLeftRadius={16}
                    borderBottomRightRadius={16}
                    tint="18, 18, 18"
                  />
                  <MediaBottomBlur
                    uri={thumb}
                    isVideo={!thumb}
                    width={previewWidth}
                    mediaHeight={PREVIEW_H}
                    height={42}
                    blurRadius={16}
                    borderBottomLeftRadius={16}
                    borderBottomRightRadius={16}
                    tint="18, 18, 18"
                  />
                  <View pointerEvents="none" style={styles.previewBottom}>
                    <CustomText
                      label="Preview"
                      fontSize={14}
                      fontFamily={fonts.medium}
                      color={SHOWS.white}
                    />
                  </View>
                  {/* 36 glass circle: white 16% fill + 1pt white 16% inside
                      stroke on a blur 16, 20 delete_forever */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={removeVideo}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.previewDelete}
                  >
                    <GlassFill fill={SHOWS.white16} blurAmount={16} />
                    <Icons
                      family="MaterialSymbolsRoundedFilled"
                      name="delete_forever"
                      size={20}
                      color={SHOWS.white}
                    />
                  </TouchableOpacity>
                  {uploading ? (
                    <View pointerEvents="none" style={styles.previewLoading}>
                      <ActivityIndicator color={SHOWS.white} />
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  <GlassFill fill={SHOWS.white04} borderRadius={16} />
                  <Icons
                    family="MaterialSymbolsRounded"
                    name="add"
                    size={48}
                    color={SHOWS.white48}
                  />
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* preview notes (centred) + 16:9 pill — 24 below the preview */}
          <View style={styles.previewNotes}>
            <InfoLine center label="3hr long maximum." style={{ marginTop: 0 }} />
            {videoError ? (
              <InfoLine
                center
                icon="cancel"
                iconSize={14}
                color={SHOWS.red}
                label="Video too long"
                style={{ marginTop: 8 }}
              />
            ) : null}
            <View style={styles.ratioPill}>
              <CustomText
                label="16:9 ratio"
                fontSize={14}
                fontFamily={fonts.medium}
                color={SHOWS.section}
              />
            </View>
          </View>

          <FormDivider />

          {/* ───────── General Details ───────── */}
          <View style={styles.block16}>
            <SectionTitle
              label="General Details"
              subtitle="Viral-exposure for your content & brand."
            />
            <SelectField
              label="Show"
              value={show?.showName}
              placeholder="Select or create a show"
              onPress={() =>
                navigation.navigate("SelectShow", { selectedId: show?._id })
              }
            />
            <View>
              <InputField
                label="Episode title"
                value={title}
                onChangeText={setTitle}
                placeholder="When times flies"
                maxLength={120}
              />
              <InfoLine label="Don’t put e.g. “E1 - S1”" />
            </View>
            <View style={styles.pair}>
              <View style={styles.flex}>
                <InputField
                  label="Season number"
                  value={season}
                  onChangeText={(v) => setSeason(v.replace(/[^\d]/g, ""))}
                  placeholder="1"
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <InfoLine label="Enter a number" />
              </View>
              <View style={styles.flex}>
                <InputField
                  label="Episode number"
                  value={episode}
                  onChangeText={(v) => setEpisode(v.replace(/[^\d]/g, ""))}
                  placeholder="1"
                  keyboardType="number-pad"
                  maxLength={4}
                />
                {numberTaken ? (
                  <InfoLine
                    icon="cancel"
                    color={SHOWS.red}
                    label="Already in this season"
                  />
                ) : (
                  <InfoLine label="Enter a number" />
                )}
              </View>
            </View>
            <View>
              <SelectField
                label="Genre(s)"
                value={genres.join(", ")}
                placeholder="Pick up to 3"
                onPress={() =>
                  navigation.navigate("SelectGenre", { genres, order: genreOrder })
                }
              />
              <InfoLine label="Helps you get more reach. Up to 3." />
            </View>
            <View>
              <InputField
                label="Synopsis"
                value={synopsis}
                onChangeText={(v) => setSynopsis(v.slice(0, SYNOPSIS_MAX))}
                placeholder="Tell viewers what this episode is about"
                height={178}
                multiline
                maxLength={SYNOPSIS_MAX}
              />
              <InfoLine label={`${synopsis.length}/${SYNOPSIS_MAX} characters.`} />
            </View>
            <View>
              <SelectField
                label="Cast"
                placeholder="Add people"
                value={cast.length ? " " : ""}
                valueNode={
                  cast.length ? (
                    <View style={styles.castRow}>
                      {cast.map((u, i) => (
                        <View key={u?._id || i} style={styles.castItem}>
                          <CustomText
                            label={`${i > 0 ? ", " : ""}${userName(u)}`}
                            fontSize={14}
                            fontFamily={fonts.medium}
                            color={SHOWS.white}
                            numberOfLines={1}
                          />
                          {/* verified blue shield or Premium / Premium+ star;
                              unverified cast show just the name */}
                          <UserBadge user={u} showUnverified={false} />
                        </View>
                      ))}
                    </View>
                  ) : null
                }
                onPress={() => setCastVisible(true)}
              />
              <InfoLine label="Person working together on the same project or content." />
            </View>
            <View>
              <SelectField
                label="Age rating"
                value={ageLabel}
                onPress={() =>
                  navigation.navigate("ShowOptionPicker", {
                    kind: "ageRating",
                    value: ageRating,
                  })
                }
              />
              <InfoLine
                multiline
                color={SHOWS.white48}
                label="You can’t select a minimum age below 18 globally, 20 in Thailand, and 21 in Indonesia."
              />
            </View>
          </View>

          <FormDivider />

          <View>
            <ToggleField
              label="Make it subscribers only?"
              value={subscribersOnly}
              onValueChange={setSubscribersOnly}
              valueSize={16}
            />
            <InfoLine
              color={SHOWS.white48}
              label="Episodes will be permanently available for subscribers."
            />
          </View>

          <FormDivider />

          {/* ───────── Availability ───────── */}
          <View style={styles.block16}>
            <SectionTitle label="Availability" />
            <View style={styles.chips}>
              {AVAILABILITY.map((option) => {
                const active = availability === option.label;
                return (
                  <TouchableOpacity
                    key={option.label}
                    activeOpacity={0.7}
                    onPress={() => pickAvailability(option)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    {!active ? <GlassFill fill={SHOWS.white04} /> : null}
                    <CustomText
                      label={option.label}
                      fontSize={12}
                      fontFamily={fonts.medium}
                      color={active ? SHOWS.section : SHOWS.white64}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <InfoLine
              color={SHOWS.white48}
              label="Episodes will be available only for a limited time."
              style={{ marginTop: 0 }}
            />
            <View style={styles.dates}>
              <View style={styles.pair8}>
                <DateField
                  label="Starting date"
                  icon="event"
                  value={dateLabel(start)}
                  flex={189}
                  onPress={() => setPicker({ field: "start", mode: "date" })}
                />
                <DateField
                  label="Time"
                  icon="schedule"
                  value={timeLabel(start)}
                  flex={154}
                  onPress={() => setPicker({ field: "start", mode: "time" })}
                />
              </View>
              <View style={styles.pair8}>
                <DateField
                  label="Ending date"
                  icon="event"
                  value={dateLabel(end)}
                  flex={189}
                  onPress={() => setPicker({ field: "end", mode: "date" })}
                />
                <DateField
                  label="Time"
                  icon="schedule"
                  value={timeLabel(end)}
                  flex={154}
                  onPress={() => setPicker({ field: "end", mode: "time" })}
                />
              </View>
            </View>
          </View>

          <FormDivider />

          {/* ───────── Price ───────── */}
          <View style={styles.block20}>
            <SectionTitle label="Price" />
            <View style={styles.block8}>
              <SelectField
                label="Currency"
                value={cur.title}
                valueSize={16}
                onPress={() =>
                  navigation.navigate("ShowOptionPicker", {
                    kind: "currency",
                    value: cur.id,
                  })
                }
                valueNode={
                  <View style={styles.currency}>
                    {/* Figma: 17 × 12 flag image · 8 · Medium 16 */}
                    <FlagImage code={cur.flag} width={17} height={12} />
                    <CustomText
                      label={cur.title}
                      fontSize={16}
                      fontFamily={fonts.medium}
                      color={SHOWS.white}
                    />
                  </View>
                }
              />
              <InputField
                label="Price"
                value={price ? `${cur.symbol}${price}` : ""}
                onChangeText={(v) => {
                  const clean = v.replace(/[^\d.]/g, "");
                  const [whole, ...rest] = clean.split(".");
                  setPrice(rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole);
                }}
                placeholder={`${cur.symbol}0.00 (free)`}
                valueSize={16}
                keyboardType="decimal-pad"
              />
              <InfoLine
                label={`You keep as much as 80% of it, therefore ${cur.symbol}${keep}/unit.`}
                style={{ marginTop: 0 }}
              />
            </View>
          </View>

          <FormDivider />

          {/* ───────── Toggles ───────── */}
          <View style={styles.block16}>
            <View>
              <ToggleField
                label="Does it contain AI?"
                value={containsAI}
                onValueChange={setContainsAI}
              />
              <InfoLine
                color={SHOWS.white48}
                label="If your ad was alternated or enhanced with AI."
                style={{ marginTop: 8 }}
              />
            </View>
            <View>
              <ToggleField
                label="Confirm all above informations"
                value={confirmed}
                onValueChange={setConfirmed}
              />
              <InfoLine
                color={SHOWS.white48}
                label="Posting a fair product will avoid further complaints."
                style={{ marginTop: 8 }}
              />
            </View>
            <View>
              <ToggleField label="I accept the TOS" value={tos} onValueChange={setTos} />
              <InfoLine
                multiline
                color={SHOWS.white48}
                style={{ marginTop: 8 }}
                parts={[
                  { text: "By publishing this " },
                  { text: "Show", strong: true },
                  { text: " you agree with " },
                  { text: "PSC", strong: true },
                  {
                    text: "’s Terms of Service. Any violation may get your account banned and you may be subject to further legal actions depending on the severity of the violation.",
                  },
                ]}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FormHeader title="Create An Episode" onBack={() => navigation.goBack()} />
      <BottomCTA label="Submit Show" onPress={submit} loading={submitting} />

      <DatePicker
        modal
        open={!!picker}
        mode={picker?.mode || "date"}
        date={picker?.field === "end" ? end : start}
        minimumDate={picker?.field === "end" ? start : undefined}
        theme="dark"
        buttonColor={SHOWS.gold}
        confirmButtonColor={SHOWS.gold}
        onConfirm={onPickDate}
        onCancel={() => setPicker(null)}
      />

      <PeopleSelection
        isVisible={castVisible}
        onClose={() => setCastVisible(false)}
        selectionType="collaborators"
        initialSelected={cast}
        onConfirm={(users) => setCast(users || [])}
      />
    </View>
  );
};

/** STARTING DATE / TIME box: label + 16 icon @64% · 4 · Medium 14. */
const DateField = ({ label, icon, value, onPress, flex }) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ flex }}>
    <FieldBox>
      <View style={styles.flex}>
        <CustomText
          label={label}
          textTransform="uppercase"
          fontSize={12}
          fontFamily={fonts.medium}
          color={SHOWS.white64}
          marginTop={capTop(12)}
        />
        {/* label cap → 16pt icon row at 18 (cap-trimmed label is 8) */}
        <View style={[styles.dateRow, { marginTop: capGap(10, 12, 0) }]}>
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name={icon}
            size={16}
            color={SHOWS.white64}
          />
          <CustomText
            label={value}
            fontSize={14}
            fontFamily={fonts.medium}
            color={SHOWS.white}
            numberOfLines={1}
          />
        </View>
      </View>
    </FieldBox>
  </TouchableOpacity>
);

export default CreateEpisode;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: SHOWS.section,
  },
  previewFrame: {
    height: 197,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: SHOWS.white04,
    padding: 2, // + 2pt inside stroke = Figma pad 4
  },
  preview: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SHOWS.section,
  },
  previewDelete: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: SHOWS.white16,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18, 18, 18, 0.32)",
  },
  previewNotes: {
    alignItems: "center",
  },
  ratioPill: {
    marginTop: 24,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 100,
    backgroundColor: SHOWS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  block8: {
    gap: 8,
  },
  block16: {
    gap: 16,
  },
  block20: {
    gap: 20,
  },
  pair: {
    flexDirection: "row",
    gap: 8,
  },
  pair8: {
    flexDirection: "row",
    gap: 8,
  },
  dates: {
    gap: 8,
  },
  dateRow: {
    height: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chips: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: SHOWS.white,
    borderWidth: 1,
    borderColor: "rgba(18, 18, 18, 0.04)",
  },
  castRow: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  castItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  currency: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
