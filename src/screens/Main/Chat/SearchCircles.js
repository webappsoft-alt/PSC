import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useTheme } from "../../../contexts/ThemeContext";
import { joinCircle, searchCircles } from "../../../services/ChatService";
import { PSC_TOPICS } from "../../../utils/feedTopics";
import { ToastMessage } from "../../../utils/ToastMessage";
import CircleJoinSheet from "./molecules/CircleJoinSheet";
import ConversationBoxSkeleton from "./molecules/ConversationBoxSkeleton";

/**
 * Figma Chat page "Search-A-Circle" (7921:9328), from the Circles page search.
 * Header pad 56/12/8/12, gap 8: search bar 40 (r100 white 4%, pad 16/10,
 * search 20 @64%, "Search for Circles..." Medium 14 −1% @48%, cancel 20 @48%)
 * · 8 · close 40 circle white 4% (close 20 @64%); topic chips 32 (pad 8, r8,
 * white 4%, Bold Italic 14 −4% @64%; picked = white + #121212), gap 3.
 * Rows pad 16 gap 8 with 1px 4% lines: image 40 r12 · 8 · title Medium 16
 * −0.5 · 6 · topic Medium 14 @48% · dot 3 · group 16 + "1.4k members"
 * Medium 10 · forum 20 in a 40 white 4% circle; description Medium 10, 2 lines.
 * Joining shows the TOS sheet first; members open the Circle straight away.
 */
const formatCount = (n) =>
  n >= 1000000 ? `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}m` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n || 0);

const SearchCircles = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinTarget, setJoinTarget] = useState(null);
  const [joining, setJoining] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    (async () => {
      try {
        const res = await searchCircles({ search: query, topic });
        if (requestId !== requestIdRef.current) return;
        setCircles(res?.data?.data || []);
      } catch (e) {
        console.log("Error searching circles:", e);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    })();
  }, [query, topic]);

  const openCircle = (c) =>
    navigation.navigate("InboxScreen", {
      conversationId: c._id,
      isGroup: true,
      groupType: "circle",
      recipientName: c.name,
      groupPicture: c.picture,
      memberCount: c.memberCount,
    });

  const join = async () => {
    if (!joinTarget || joining) return;
    setJoining(true);
    try {
      const res = await joinCircle(joinTarget._id);
      const circle = res?.data?.data;
      if (!res?.data?.success || !circle) throw new Error("failed");
      setCircles((prev) => prev.map((c) => (String(c._id) === String(circle._id) ? circle : c)));
      setJoinTarget(null);
      ToastMessage(`You joined ${circle.name}`);
      openCircle(circle);
    } catch (e) {
      ToastMessage("Could not join this Circle", "error");
    } finally {
      setJoining(false);
    }
  };

  const renderItem = ({ item }) => {
    const onPress = () => (item.isMember ? openCircle(item) : setJoinTarget(item));
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
        <View style={styles.rowTop}>
          {item.picture ? (
            <FastImage source={{ uri: item.picture }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.center, { backgroundColor: tint(0.08) }]}>
              <CustomText label={(item.name?.[0] || "?").toUpperCase()} fontSize={16} fontFamily={fonts.semiBold} color={colors.text} />
            </View>
          )}
          <View style={styles.texts}>
            <CustomText label={item.name} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={colors.text} numberOfLines={1} />
            <View style={styles.meta}>
              {!!item.topic && (
                <CustomText label={item.topic} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.5} color={tint(0.48)} />
              )}
              {!!item.topic && <View style={[styles.dot, { backgroundColor: tint(0.48) }]} />}
              <Icons family="MaterialSymbolsRoundedFilled" name="group" size={16} color={tint(0.48)} />
              <CustomText label={`${formatCount(item.memberCount)} members`} fontSize={10} fontFamily={fonts.medium} letterSpacing={-0.05} color={colors.text} />
            </View>
          </View>
          <View style={[styles.action, { backgroundColor: tint(0.04) }]}>
            <Icons family="MaterialSymbolsRounded" name="forum" size={20} color={colors.text} />
          </View>
        </View>
        {!!item.description && (
          <CustomText label={item.description} fontSize={10} fontFamily={fonts.medium} letterSpacing={-0.05} color={colors.text} numberOfLines={2} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      headerUnScrollable={() => (
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.searchRow}>
            <View style={[styles.searchBar, { backgroundColor: tint(0.04) }]}>
              <Icons family="MaterialSymbolsRounded" name="search" size={20} color={tint(0.64)} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search for Circles..."
                placeholderTextColor={tint(0.48)}
                style={[styles.input, { color: colors.text }]}
                autoCorrect={false}
                autoFocus
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                  <Icons family="MaterialSymbolsRoundedFilled" name="cancel" size={20} color={tint(0.48)} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.close, { backgroundColor: tint(0.04) }]}>
              <Icons family="MaterialSymbolsRounded" name="close" size={20} color={tint(0.64)} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {PSC_TOPICS.map((t) => {
              const on = topic === t.name;
              return (
                <TouchableOpacity
                  key={t.name}
                  activeOpacity={0.7}
                  onPress={() => setTopic(on ? "" : t.name)}
                  style={[styles.chip, { backgroundColor: on ? (isDark ? "#FFFFFF" : "#121212") : tint(0.04) }]}
                >
                  <CustomText
                    label={t.name}
                    fontSize={14}
                    fontFamily={fonts.BoldItalic}
                    fontStyle="italic"
                    letterSpacing={-0.56}
                    color={on ? (isDark ? "#121212" : "#FFFFFF") : tint(0.64)}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
      scrollEnabled
    >
      {loading ? (
        [1, 2, 3, 4, 5].map((k) => <ConversationBoxSkeleton key={k} />)
      ) : (
        <FlatList
          data={circles}
          scrollEnabled={false}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={[styles.line, { backgroundColor: tint(0.04) }]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <CustomText label={query || topic ? "No Circles found" : "No Circles yet"} fontSize={16} fontFamily={fonts.semiBold} color={colors.text} textAlign="center" />
              <CustomText label="Create one from the + on the Circles tab." fontSize={14} color={tint(0.64)} textAlign="center" marginTop={4} />
            </View>
          }
        />
      )}
      <View style={{ height: 48 }} />
      <CircleJoinSheet
        visible={!!joinTarget}
        circle={joinTarget}
        joining={joining}
        onDismiss={() => setJoinTarget(null)}
        onJoin={join}
      />
    </ScreenWrapper>
  );
};

export default SearchCircles;

const styles = StyleSheet.create({
  header: {
    paddingTop: 12, // Figma 56 − 44pt status bar
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    letterSpacing: -0.14,
    paddingVertical: 0,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: {
    gap: 3,
    alignItems: "center",
  },
  chip: {
    height: 32,
    borderRadius: 8,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  row: {
    padding: 16,
    gap: 8,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 100,
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    height: 1,
  },
  empty: {
    alignItems: "center",
    paddingTop: 64,
    paddingHorizontal: 32,
  },
});
