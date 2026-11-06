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
import { ToastMessage } from "../../../utils/ToastMessage";
import { CommunityDiscussion, RelatedRail } from "./molecules/CommunityDiscussion";
import DemographySection, { DEMOGRAPHY } from "./molecules/DemographyBars";
import DepartementSheet from "./molecules/DepartementSheet";
import {
  ElectionHero,
  ElectionTopBar,
  TABS,
  barHeight,
  heroHeight,
} from "./molecules/ElectionHeader";
import ElectionSkeleton from "./molecules/ElectionSkeleton";
import { ElectionInfo, SISummary, Schedule } from "./molecules/ElectionSummary";
import KeyFigures from "./molecules/KeyFigures";
import { PollingMapSection, TerritoryCard } from "./molecules/PollingMap";
import VoteEvolution from "./molecules/VoteEvolution";
import { EL, colorOf } from "./molecules/electionLayout";

/**
 * PSC special-edition election poll (Figma Poll-Detail-Page):
 *  · national view (8103:4259) — no `departement` param
 *  · département view (8127:6977) — `departement` = INSEE code ("75")
 * Data: GET elections/:id?departement=&range= (vote counts from PSC users;
 * SI Summary and Polling-map key points are AI data).
 */
const DEFAULT_RANGE = "1D"; // Figma: 1D selected

const ElectionDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const userData = useSelector((state) => state.users?.userData);
  const electionId = route.params?.electionId;
  const departement = route.params?.departement ? String(route.params.departement) : null;
  const isDep = !!departement;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setFailed] = useState(false);
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [tab, setTab] = useState(TABS[0]);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState({});
  const [sheet, setSheet] = useState(null); // { code, entry }
  const [sheetVisible, setSheetVisible] = useState(false);

  const scrollRef = useRef(null);
  const offsets = useRef({}).current;
  const mounted = useRef(true);
  const edge = useScrollEdgeBlur();

  // skeleton pulse (same timing as the Shows skeletons)
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

  const load = useCallback(
    async ({ silent, nextRange } = {}) => {
      if (!electionId) {
        setLoading(false);
        setFailed(true);
        return;
      }
      if (!silent) setLoading(true);
      setFailed(false);
      try {
        const params = { range: nextRange || range };
        if (departement) params.departement = departement;
        const res = await get(`elections/${electionId}`, params);
        const d = res?.data?.data;
        if (!mounted.current) return;
        if (d) {
          setData(d);
          setFollowing(!!d.isFollowing);
          setFollowersCount(Number(d.followersCount) || 0);
        } else if (!silent) setFailed(true);
      } catch (e) {
        if (!mounted.current) return;
        if (!silent) setFailed(true);
        ToastMessage(e?.message || "Could not load this election", "error");
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [electionId, departement, range],
  );

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
    // first load only; range changes go through changeRange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId, departement]);

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

  const results = useMemo(() => (Array.isArray(data?.results) ? data.results : []), [data?.results]);
  const territory = data?.territory || null;
  const leader = useMemo(
    () =>
      results.find((r) => String(r.optionId) === String(territory?.leaderOptionId)) || null,
    [results, territory?.leaderOptionId],
  );
  const hasVotes = Number(data?.totalVotes) > 0;
  const leaderColor = hasVotes && leader ? colorOf(leader) : EL.section;
  const placeName = territory?.name || "";
  const myId = userData?._id;

  /* ───────────── actions ───────────── */

  const changeRange = async (r) => {
    if (r === range || rangeLoading) return;
    setRange(r);
    setRangeLoading(true);
    await load({ silent: true, nextRange: r });
    if (mounted.current) setRangeLoading(false);
  };

  const toggleFollowTopic = async () => {
    const next = !following;
    setFollowing(next);
    setFollowersCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const res = await post(`elections/${electionId}/follow`);
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
      const body = { language: "French" };
      if (departement) body.departement = departement;
      const res = await post(`elections/${electionId}/summary/translate`, body);
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
      const body = departement ? { departement } : {};
      const res = await post(`elections/${electionId}/summary/listen`, body);
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

  const openDepartement = (code) => {
    setSheetVisible(false);
    navigation.push("ElectionDetail", { electionId, departement: code });
  };

  const onTab = (t) => {
    setTab(t);
    const y =
      t === "Demography" ? offsets.demography : t === "Candidates" ? offsets.candidates : 0;
    scrollRef.current?.scrollTo?.({
      y: Math.max(0, (Number(y) || 0) - (t === "Overview" ? 0 : barHeight(insets.top))),
      animated: true,
    });
  };

  const hero = heroHeight(insets.top, isDep);

  /* ───────────── loading / error ───────────── */

  if (!data && loading) {
    return (
      <View style={styles.page}>
        <ElectionSkeleton opacity={skeletonOpacity} heroHeight={hero} isDepartement={isDep} />
        <ElectionTopBar
          insetTop={insets.top}
          onBack={() => navigation.goBack()}
          isDepartement={isDep}
          visible={edge.headerVisible}
          placeName=""
          following={following}
          onFollow={() => {}}
        />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.page, styles.center]}>
        <CustomText
          label="This election isn't available"
          fontSize={16}
          fontFamily={fonts.medium}
          color={EL.white}
        />
        <CustomText
          label="Try again"
          fontSize={14}
          fontFamily={fonts.medium}
          color={EL.gold}
          marginTop={12}
          onPress={() => load()}
        />
        <ElectionTopBar
          insetTop={insets.top}
          onBack={() => navigation.goBack()}
          isDepartement={isDep}
          visible={edge.headerVisible}
          placeName=""
          following={following}
          onFollow={() => {}}
        />
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
          leaderColor={leaderColor}
          isDepartement={isDep}
          tab={tab}
          onTab={onTab}
        />

        {!isDep ? (
          <ElectionInfo election={{ ...data, followersCount }} />
        ) : null}

        <SISummary
          text={summaryText}
          results={results}
          playing={playing}
          audioLoading={audioLoading}
          onListen={listen}
          translated={!!translated}
          translating={translating}
          onTranslate={translate}
          showTranslateIcon={!isDep}
        />

        {isDep ? (
          <TerritoryCard
            territory={territory}
            results={results}
            electionTitle={data?.title}
            totalVotes={data?.totalVotes}
          />
        ) : (
          <>
            <Schedule schedule={data?.schedule} />
            <PollingMapSection
              keyPoints={data?.keyPoints}
              map={data?.map}
              results={results}
              onPressDepartement={(code, entry) => {
                setSheet({ code, entry });
                setSheetVisible(true);
              }}
            />
          </>
        )}

        <VoteEvolution
          results={results}
          totalVotes={data?.totalVotes}
          range={range}
          onRange={changeRange}
          trend={data?.trend}
          myVote={data?.myVote}
          loadingRange={rangeLoading}
          skeletonOpacity={skeletonOpacity}
          onLayout={(e) => {
            offsets.candidates = e.nativeEvent.layout.y;
          }}
        />

        <KeyFigures
          users={data?.keyFigures}
          followed={followedUsers}
          myId={myId}
          onOpen={openUser}
          onFollow={followUser}
        />

        {DEMOGRAPHY.map((d, i) => (
          <DemographySection
            key={d.key}
            title={d.title}
            subtitle={d.subtitle}
            segments={data?.demographics?.[d.key]}
            results={results}
            onLayout={
              i === 0
                ? (e) => {
                    offsets.demography = e.nativeEvent.layout.y;
                  }
                : undefined
            }
          />
        ))}

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
        <RelatedRail kind="shows" />
        <RelatedRail kind="jobs" />
      </Animated.ScrollView>

      <ElectionTopBar
        insetTop={insets.top}
        visible={edge.headerVisible}
        onBack={() => navigation.goBack()}
        isDepartement={isDep}
        placeName={placeName}
        following={following}
        onFollow={toggleFollowTopic}
        coverImage={data?.coverImage}
        leaderColor={leaderColor}
      />

      {!isDep ? (
        <DepartementSheet
          visible={sheetVisible}
          selection={sheet}
          results={results}
          electionTitle={data?.title}
          onClose={() => setSheetVisible(false)}
          onOpen={openDepartement}
        />
      ) : null}
    </View>
  );
};

export default ElectionDetail;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: EL.page },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  content: { gap: 1, backgroundColor: EL.page },
});
