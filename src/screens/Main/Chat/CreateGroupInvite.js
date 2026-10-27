import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../assets/fonts";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useTheme } from "../../../contexts/ThemeContext";
import { createGroup, getFriends } from "../../../services/ChatService";
import { ToastMessage } from "../../../utils/ToastMessage";
import ConversationBoxSkeleton from "./molecules/ConversationBoxSkeleton";
import StatusAvatar from "./molecules/StatusAvatar";

/**
 * Figma Chat page "Create-a-group-invite-friends" (7921:6426) — step 2 of
 * Create a Group (route param `form` = image / title / description).
 * Header pad 52/12/8/12: search bar 40 (r100 white 4%, pad 12/10/12/12,
 * search 20 @64%, Medium 14 @48% placeholder, cancel 20 @48%).
 * Block #121212 pad 16/12 gap 20 on #181818 (4 below the header):
 * "ALL FRIENDS N"; rows 44, gap 8 around 1px 4% lines: ring 44 (photo 38) ·
 * 8 · name Medium 14 + verified / award_star 14 #007BFF · username Regular 14
 * @64%; toggle 40 circle — off white 4% + add 20 white, on white + check
 * 20 #121212.
 * Footer (gradient #121212 0→100%, pad 12/12/34/12, gap 12): "N - names"
 * Regular 12 @64% · picked avatars 40 gap 6 · back 48 (white 4%, chevron
 * @64%) + Continue gold 48.
 */
const BLUE = "#007BFF";

// a group is 3+ people: you + at least 2 friends (1 friend = a 1 on 1 chat)
const MIN_INVITES = 2;

const CreateGroupInvite = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const form = route?.params?.form || {};

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState([]); // user objects, in pick order
  const [saving, setSaving] = useState(false);
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
        const res = await getFriends(query);
        if (requestId !== requestIdRef.current) return;
        setFriends(res?.data?.data?.users || []);
      } catch (e) {
        console.log("Error fetching friends:", e);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    })();
  }, [query]);

  const isPicked = (u) => picked.some((p) => String(p._id) === String(u._id));
  const toggle = (u) =>
    setPicked((prev) =>
      isPicked(u) ? prev.filter((p) => String(p._id) !== String(u._id)) : [...prev, u],
    );

  const submit = async () => {
    if (picked.length < MIN_INVITES) {
      ToastMessage(`Invite at least ${MIN_INVITES} friends`, "error");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const res = await createGroup({
        type: "group",
        name: form.name,
        description: form.description,
        initialMessage: form.initialMessage,
        picture: form.picture,
        members: picked.map((u) => u._id),
      });
      const group = res?.data?.data;
      if (!res?.data?.success || !group?._id) throw new Error(res?.data?.error || "failed");
      ToastMessage(`${group.name} created`);
      // open the new group (replaces this step; Back returns to the Inbox)
      navigation.replace("InboxScreen", {
        conversationId: group._id,
        isGroup: true,
        groupType: "group",
        recipientName: group.name,
        groupPicture: group.picture,
        memberCount: group.memberCount,
      });
    } catch (e) {
      ToastMessage(e?.message && e.message !== "failed" ? e.message : "Could not create the group", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }) => {
    const name = `${item?.firstName || ""} ${item?.lastName || ""}`.trim() || item?.username;
    const on = isPicked(item);
    const isPro = item?.profile?.isPro || item?.role === "individual" || item?.role === "company";
    return (
      <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={() => toggle(item)}>
        <View style={styles.rowLeft}>
          <StatusAvatar user={item} size={44} ring status={item?.status || (item?.isOnline ? "online" : "offline")} />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <CustomText label={name} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.07} color={colors.text} numberOfLines={1} containerStyle={styles.shrink} />
              {item?.profile?.isVerified && (
                <Icons family="MaterialSymbolsRoundedFilled" name="verified" size={14} color={BLUE} />
              )}
              {isPro && <Icons family="MaterialSymbolsRoundedFilled" name="award_star" size={14} color={BLUE} />}
            </View>
            {!!item?.username && (
              <CustomText label={item.username} fontSize={14} letterSpacing={-0.07} color={tint(0.64)} numberOfLines={1} />
            )}
          </View>
        </View>
        <View style={[styles.toggle, { backgroundColor: on ? "#FFFFFF" : tint(0.04) }]}>
          <Icons
            family="MaterialSymbolsRounded"
            name={on ? "check" : "add"}
            size={20}
            color={on ? "#121212" : colors.text}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const footerBottom = Math.max(insets.bottom, 34);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#181818" : colors.background }}>
      <ScreenWrapper
        paddingHorizontal={0.1}
        backgroundColor={isDark ? "#181818" : colors.background}
        headerUnScrollable={() => (
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <View style={[styles.searchBar, { backgroundColor: tint(0.04) }]}>
              <Icons family="MaterialSymbolsRounded" name="search" size={20} color={tint(0.64)} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name..."
                placeholderTextColor={tint(0.48)}
                style={[styles.input, { color: colors.text }]}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                  <Icons family="MaterialSymbolsRoundedFilled" name="cancel" size={20} color={tint(0.48)} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        scrollEnabled
      >
        <View style={[styles.block, { backgroundColor: colors.background }]}>
          <View style={styles.titleRow}>
            <CustomText label="ALL FRIENDS" fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.07} color={tint(0.64)} />
            <CustomText label={loading ? "" : String(friends.length)} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.56} color={colors.text} />
          </View>
          {loading ? (
            <View style={{ marginHorizontal: -12 }}>
              {[1, 2, 3, 4, 5].map((k) => <ConversationBoxSkeleton key={k} />)}
            </View>
          ) : (
            <FlatList
              data={friends}
              scrollEnabled={false}
              keyExtractor={(item, i) => String(item?._id || i)}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={[styles.line, { backgroundColor: tint(0.04) }]} />}
              ListEmptyComponent={
                <CustomText
                  label={query ? "No friends match this name." : "Friends are people you follow who follow you back."}
                  fontSize={14}
                  color={tint(0.64)}
                  textAlign="center"
                  marginTop={24}
                />
              }
            />
          )}
        </View>
        <View style={{ height: 200 }} />
      </ScreenWrapper>

      {/* ───────── footer: picked friends + back / Continue ───────── */}
      <View pointerEvents="box-none" style={[styles.footer, { paddingBottom: footerBottom }]}>
        <LinearGradient
          pointerEvents="none"
          colors={[`${colors.background}00`, colors.background]}
          style={StyleSheet.absoluteFill}
        />
        {picked.length > 0 && (
          <View style={styles.pickedBlock}>
            <CustomText
              label={`${picked.length} - ${picked.map((u) => u.firstName || u.username).join(", ")}`}
              fontSize={12}
              letterSpacing={-0.24}
              color={tint(0.64)}
              numberOfLines={1}
            />
            <View style={styles.pickedRow}>
              {picked.slice(0, 7).map((u) => {
                const uri = u?.profile?.avatar || u?.profilePicture;
                return uri ? (
                  <FastImage key={String(u._id)} source={{ uri }} style={styles.pickedAvatar} />
                ) : (
                  <View key={String(u._id)} style={[styles.pickedAvatar, styles.center, { backgroundColor: u?.profile?.profileColor || tint(0.08) }]}>
                    <CustomText label={`${u?.firstName?.[0] || ""}${u?.lastName?.[0] || ""}`.toUpperCase() || "?"} fontSize={13} fontFamily={fonts.semiBold} color="#121212" />
                  </View>
                );
              })}
            </View>
          </View>
        )}
        <View style={styles.buttons}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: tint(0.04) }]}>
            <Icons family="MaterialSymbolsRounded" name="chevron_left" size={27} color={tint(0.64)} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <CustomButton title="Continue" height={48} loading={saving} disabled={saving || picked.length < MIN_INVITES} onPress={submit} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default CreateGroupInvite;

const styles = StyleSheet.create({
  header: {
    paddingTop: 8, // Figma 52 − 44pt status bar
    paddingHorizontal: 12,
    paddingBottom: 8,
    marginBottom: 4,
  },
  searchBar: {
    height: 40,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 12,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    paddingVertical: 0,
  },
  block: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shrink: {
    flexShrink: 1,
  },
  toggle: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    height: 1,
    marginVertical: 8,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  pickedBlock: {
    gap: 12,
  },
  pickedRow: {
    flexDirection: "row",
    gap: 6,
  },
  pickedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 100,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
