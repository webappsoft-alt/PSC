import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SoundPlayer from "react-native-sound-player";
import { useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import useScrollEdgeBlur from "../../../hooks/useScrollEdgeBlur";
import { openPagerTab } from "../../../navigation/TabStack";
import { get, post } from "../../../services/ApiRequest";
import { POLITICAL_ORIENTATIONS } from "../../../utils/political";
import { ToastMessage } from "../../../utils/ToastMessage";
import { CommunityDiscussion, RelatedRail } from "../Election/molecules/CommunityDiscussion";
import DemographySection, { DEMOGRAPHY } from "../Election/molecules/DemographyBars";
import {
  ElectionHero,
  ElectionTopBar,
  barHeight,
  heroHeight,
} from "../Election/molecules/ElectionHeader";
import ElectionSkeleton from "../Election/molecules/ElectionSkeleton";
import { ElectionInfo, SISummary } from "../Election/molecules/ElectionSummary";
import KeyFigures from "../Election/molecules/KeyFigures";
import {
  BulletList,
  EL,
  GlassFill,
  Section,
  Txt,
  toTitle,
  userName,
} from "../Election/molecules/electionLayout";

/**
 * PSC topic hub (Figma Matching › "Job-Listing" 8005:8412) — the SI
 * editorial page a topic post opens. Same building blocks as the election
 * page: hero + tabs, sources · title · tags, SI Summary, Key points, facts,
 * Key Figures, Community Discussion, demography bars, Related Shows / Jobs.
 * Data: GET topics/:id.
 *
 * Demography bars split the PSC users who engaged with the topic post by
 * political leaning (spectrum 0 Radical Left … 4 Radical Right), in the
 * app's political-spectrum colours; undetermined users stay on the track.
 */
const TABS = ["Summary", "Context", "People", "Timeline", "Coverage"];

// spectrum key → the political dot colours of Political Information / chips
const SPECTRUM_COLORS = POLITICAL_ORIENTATIONS.map((o) => [o.value, o.dot]);

/* ───────────── Key points (8030:9423): pad 12 · gap 12 · Medium 14 ───────────── */

const KeyPoints = ({ points, onLayout }) => (
  <Section gap={12} onLayout={onLayout}>
    <Txt size={14} label="Key points" fontFamily={fonts.medium} color={EL.white} />
    <BulletList items={points} />
  </Section>
);

/* ─────── Facts (8030:9438): pad 12 · rows gap 8 · tiles 42 pad 8 gap 10 r8 white 4% ─────── */

const FactTile = ({ fact }) => (
  <View style={styles.fact}>
    <GlassFill fill={EL.white04} borderRadius={8} />
    {/* Figma: label and value are TITLE case */}
    <Txt size={12} label={toTitle(fact?.label)} color={EL.white64} numberOfLines={1} />
    <Txt
      size={12}
      label={toTitle(fact?.value)}
      fontFamily={fonts.medium}
      letterSpacing={-0.12}
      color={EL.white}
      numberOfLines={1}
    />
  </View>
);

const Facts = ({ facts, onLayout }) => {
  const rows = [];
  for (let i = 0; i < facts.length; i += 2) rows.push(facts.slice(i, i + 2));
  return (
    <Section gap={8} onLayout={onLayout}>
      {rows.map((row, r) => (
        <View key={r} style={styles.factRow}>
          {row.map((f, i) => (
            <FactTile key={`${r}-${i}-${f?.label}`} fact={f} />
          ))}
          {row.length === 1 ? <View style={styles.flex} /> : null}
        </View>
      ))}
    </Section>
  );
};

/* ─────────────────────────── screen ─────────────────────────── */

const TopicDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const userData = useSelector((state) => state.users?.userData);
  const rawId = route.params?.topicId;
  const topicId = rawId && typeof rawId === "object" ? rawId._id : rawId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState(TABS[0]);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState({});

  const scrollRef = useRef(null);
  const offsets = useRef({}).current;
  const mounted = useRef(true);
  const edge = useScrollEdgeBlur();

  // skeleton pulse (same timing as the Shows / election skeletons)
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const skeletonOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  const load = useCallback(async () => {
    if (!topicId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const res = await get(`topics/${topicId}`);
      const d = res?.data?.data;
      if (!mounted.current) return;
      if (d) {
        setData(d);
        setFollowing(!!d.isFollowing);
        setFollowersCount(Number(d.followersCount) || 0);
      } else setNotFound(true);
    } catch (e) {
      if (!mounted.current) return;
      if (e?.status === 404 || e?.response?.status === 404) setNotFound(true);
      ToastMessage(e?.message || "Could not load this topic", "error");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  // SI Summary audio: stop it when the page goes away / finishes
  useEffect(() => {
    let sub = null;
    try {
      sub = SoundPlayer.addEventListener("FinishedPlaying", () => {
        if (mounted.current) setPlaying(false);
      });
    } catch (e) {
      sub = null;
    }
    return () => {
      try {
        sub?.remove?.();
        SoundPlayer.stop();
      } catch (e) {
        // nothing playing
      }
    };
  }, []);

  const myId = userData?._id;
  const keyFigures = useMemo(
    () => (Array.isArray(data?.keyFigures) ? data.keyFigures.filter((u) => u?._id) : []),
    [data?.keyFigures],
  );
  // key figures named in the summary get their avatar inline (as candidates do)
  const summaryPeople = useMemo(
    () => keyFigures.map((u) => ({ name: userName(u), user: u, color: EL.white16 })),
    [keyFigures],
  );
  const keyPoints = useMemo(
    () =>
      (Array.isArray(data?.keyPoints) ? data.keyPoints : [])
        .filter((p) => typeof p === "string" && p.trim())
        .map((p) => p.trim()),
    [data?.keyPoints],
  );
  const facts = useMemo(
    () =>
      (Array.isArray(data?.facts) ? data.facts : []).filter(
        (f) => f && (f.label || f.value),
      ),
    [data?.facts],
  );

  /* ───────────── actions ───────────── */

  const toggleFollowTopic = async () => {
    if (!topicId) return;
    const next = !following;
    setFollowing(next);
    setFollowersCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const res = await post(`topics/${topicId}/follow`);
      const d = res?.data?.data;
      if (d && mounted.current) {
        setFollowing(!!d.isFollowing);
        setFollowersCount(Number(d.followersCount) || 0);
      }
    } catch (e) {
      if (!mounted.current) return;
      setFollowing(!next);
      setFollowersCount((c) => Math.max(0, c + (next ? -1 : 1)));
      ToastMessage(e?.message || "Could not follow this topic", "error");
    }
  };

  const translate = async () => {
    if (translated) {
      setTranslated(null);
      return;
    }
    setTranslating(true);
    try {
      const res = await post(`topics/${topicId}/summary/translate`, { language: "French" });
      const text = res?.data?.data?.text;
      if (text && mounted.current) setTranslated(text);
      else if (!text) ToastMessage("Translation is not available right now", "info");
    } catch (e) {
      ToastMessage(e?.message || "Translation is not available right now", "error");
    } finally {
      if (mounted.current) setTranslating(false);
    }
  };

  const listen = async () => {
    if (playing) {
      try {
        SoundPlayer.stop();
      } catch (e) {
        // already stopped
      }
      setPlaying(false);
      return;
    }
    setAudioLoading(true);
    try {
      const res = await post(`topics/${topicId}/summary/listen`);
      const url = res?.data?.data?.audioUrl;
      if (!url) {
        ToastMessage("Listening is not available right now", "info");
        return;
      }
      SoundPlayer.playUrl(url);
      if (mounted.current) setPlaying(true);
    } catch (e) {
      ToastMessage(e?.message || "Listening is not available right now", "error");
    } finally {
      if (mounted.current) setAudioLoading(false);
    }
  };

  const followUser = async (user) => {
    const id = user?._id ? String(user._id) : null;
    if (!id || followedUsers[id]) return;
    setFollowedUsers((m) => ({ ...m, [id]: true }));
    try {
      const res = await post(`relationships/follow/${id}`);
      if (res?.data?.success || res?.status === 200) {
        ToastMessage(`You are now following ${user.firstName || user.username || ""}`.trim(), "success");
      }
    } catch (e) {
      setFollowedUsers((m) => ({ ...m, [id]: false }));
      ToastMessage(e?.message || "Could not follow this account", "error");
    }
  };

  const openUser = (user) => {
    if (!user?._id) return;
    if (String(user._id) === String(myId)) {
      navigation.goBack();
      openPagerTab("Profile");
      return;
    }
    navigation.navigate("UserProfile", { userId: user._id });
  };

  /**
   * Timeline / Coverage have no designed sections yet: the tabs scroll to the
   * closest existing ones (Timeline → Key points, Coverage → sources row).
   */
  const onTab = (t) => {
    setTab(t);
    const context = offsets.keyPoints ?? offsets.facts;
    const y =
      t === "Context" || t === "Timeline"
        ? context
        : t === "People"
        ? offsets.keyFigures
        : t === "Coverage"
        ? offsets.info
        : 0;
    if (t !== "Summary" && y == null) return;
    scrollRef.current?.scrollTo?.({
      y: t === "Summary" ? 0 : Math.max(0, (Number(y) || 0) - barHeight(insets.top)),
      animated: true,
    });
  };

  const hero = heroHeight(insets.top, false);

  const topBar = (onFollow) => (
    <ElectionTopBar
      insetTop={insets.top}
      visible={edge.headerVisible}
      onBack={() => navigation.goBack()}
      isDepartement={false}
      placeName=""
      following={following}
      onFollow={onFollow}
      coverImage={data?.coverImage}
    />
  );

  /* ───────────── loading / error ───────────── */

  if (!data && loading) {
    return (
      <View style={styles.page}>
        <ElectionSkeleton opacity={skeletonOpacity} heroHeight={hero} variant="topic" />
        {topBar(() => {})}
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.page, styles.center]}>
        <CustomText
          label={notFound ? "This topic isn't available" : "Could not load this topic"}
          fontSize={16}
          fontFamily={fonts.medium}
          color={EL.white}
          textAlign="center"
        />
        {topicId ? (
          <CustomText
            label="Try again"
            fontSize={14}
            fontFamily={fonts.medium}
            color={EL.gold}
            marginTop={12}
            onPress={() => load()}
          />
        ) : null}
        {topBar(() => {})}
      </View>
    );
  }

  const summaryText = translated || data?.summary?.text || "";
  const community = data?.communityPost || null;
  const communityAuthor =
    community?.userId && typeof community.userId === "object" ? community.userId : null;

  return (
    <View style={styles.page}>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        {...edge.scrollProps()}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      >
        <ElectionHero
          insetTop={insets.top}
          coverImage={data?.coverImage}
          isDepartement={false}
          tabs={TABS}
          tab={tab}
          onTab={onTab}
        />

        {/* "24 Sources" has no designed destination yet: static */}
        <View
          onLayout={(e) => {
            offsets.info = e.nativeEvent.layout.y;
          }}
        >
          <ElectionInfo election={{ ...data, followersCount }} />
        </View>

        {data?.summary?.text ? (
          <SISummary
            text={summaryText}
            results={summaryPeople}
            playing={playing}
            audioLoading={audioLoading}
            onListen={listen}
            translated={!!translated}
            translating={translating}
            onTranslate={translate}
          />
        ) : null}

        {keyPoints.length ? (
          <KeyPoints
            points={keyPoints}
            onLayout={(e) => {
              offsets.keyPoints = e.nativeEvent.layout.y;
            }}
          />
        ) : null}

        {facts.length ? (
          <Facts
            facts={facts}
            onLayout={(e) => {
              offsets.facts = e.nativeEvent.layout.y;
            }}
          />
        ) : null}

        {keyFigures.length ? (
          <View
            onLayout={(e) => {
              offsets.keyFigures = e.nativeEvent.layout.y;
            }}
          >
            <KeyFigures
              users={keyFigures}
              followed={followedUsers}
              myId={myId}
              onOpen={openUser}
              onFollow={followUser}
            />
          </View>
        ) : null}

        <CommunityDiscussion
          post={community}
          myId={myId}
          following={!!(communityAuthor?._id && followedUsers[String(communityAuthor._id)])}
          onOpen={() =>
            community?._id && navigation.navigate("DetailPageWithId", { postId: community._id })
          }
          onOpenUser={() => openUser(communityAuthor)}
          onFollow={() => followUser(communityAuthor)}
        />

        {DEMOGRAPHY.map((d) => (
          <DemographySection
            key={d.key}
            title={d.title}
            subtitle={d.subtitle}
            segments={data?.demographics?.[d.key]}
            splitKey="key"
            colors={SPECTRUM_COLORS}
            emptyLabel="No engagement yet."
          />
        ))}

        <RelatedRail kind="shows" />
        <RelatedRail kind="jobs" />
      </Animated.ScrollView>

      {topBar(toggleFollowTopic)}
    </View>
  );
};

export default TopicDetail;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: EL.page },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  content: { gap: 1, backgroundColor: EL.page },
  flex: { flex: 1 },
  factRow: { flexDirection: "row", gap: 8 },
  fact: {
    flex: 1,
    padding: 8,
    gap: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
});
