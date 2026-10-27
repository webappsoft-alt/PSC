import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../assets/fonts";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useTheme } from "../../../contexts/ThemeContext";
import { getFriends } from "../../../services/ChatService";
import { COLORS } from "../../../utils/COLORS";
import ConversationBoxSkeleton from "./molecules/ConversationBoxSkeleton";
import Blur from "../../../components/Blur";
import UserBadge from "../../../components/UserBadge";

/**
 * Online Friends — Figma Chat page "Inbox-1-on-1" (3732:1704). Now the "New
 * chat" picker: opened from the Inbox "+" (start a 1 on 1 chat), with a back
 * button; the Inbox bottom bar is 1 on 1 · Groups · Circles.
 * Header: search bar 44 (r100, white 4%, pad 12/10/12/12, search 22 @64%,
 * Medium 14 @48% placeholder, clear "cancel" 22 @48%).
 * List block: #121212, pad 16/12, "ALL FRIENDS" Medium 14 @64%, gap 20;
 * rows 44, gap 8 around 1px white 4% lines. Row: ring 44 (pad 3, #1ED760
 * online / white 16% offline, photo 38) · gap 8 · name Medium 14 + verified /
 * award_star 14 #007BFF + username chip (18, pad 6, white 4%, Medium 10 @64%);
 * job Regular 12 @64% · 4pt dot · friends count + group 12. Message 40 circle
 * white 4%, chat 20 @64%. Screen #181818, 4pt under the header.
 */
const ONLINE = "#1ED760";
const BLUE = "#007BFF";

// `embedded`: page 1 of InboxPager (the shared bottom bar lives there)
const OnlineFriends = ({ embedded = false }) => {
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const tint = (o) =>
    isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`;

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isFocus) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    (async () => {
      try {
        const res = await getFriends(query);
        if (requestId !== requestIdRef.current) return;
        const users = res?.data?.data?.users || [];
        // online first, server order (A→Z) otherwise
        setFriends(
          users
            .map((u, i) => ({ u, i }))
            .sort((a, b) => (b.u.isOnline ? 1 : 0) - (a.u.isOnline ? 1 : 0) || a.i - b.i)
            .map(({ u }) => u),
        );
      } catch (e) {
        console.log("Error fetching friends:", e);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    })();
  }, [query, isFocus]);

  const openChat = (user) =>
    navigation.navigate("InboxScreen", {
      recipientId: user?._id,
      recipientName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      otherUser: user,
    });

  const renderAvatar = (user) => {
    const uri = user?.profile?.avatar || user?.profilePicture;
    return uri ? (
      <ImageFast source={{ uri }} style={styles.photo} />
    ) : (
      <View
        style={[
          styles.photo,
          styles.center,
          { backgroundColor: user?.profile?.profileColor || tint(0.08) },
        ]}
      >
        <CustomText
          label={
            `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() ||
            "?"
          }
          fontSize={13}
          fontFamily={fonts.semiBold}
          color={COLORS.primaryColor}
        />
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const name = `${item?.firstName || ""} ${item?.lastName || ""}`.trim();
    const job = item?.occupation?.jobTitle;
    const friendsCount = Array.isArray(item?.stats?.friends)
      ? item.stats.friends.length
      : null;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.row}
        onPress={() =>
          navigation.navigate("UserProfile", { userId: item?._id })
        }
      >
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.ring,
              { backgroundColor: item?.isOnline ? ONLINE : tint(0.16) },
            ]}
          >
            {renderAvatar(item)}
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <CustomText
                label={name || item?.username || "User"}
                fontSize={14}
                fontFamily={fonts.medium}
                letterSpacing={-0.07}
                color={colors.text}
                numberOfLines={1}
                containerStyle={styles.shrink}
              />
              <UserBadge user={item} style={styles.badges} />
              {!!item?.username && (
                <View style={[styles.usernameChip, { backgroundColor: tint(0.04) }]}>
                  <CustomText
                    label={item.username}
                    fontSize={10}
                    fontFamily={fonts.medium}
                    color={tint(0.64)}
                    numberOfLines={1}
                  />
                </View>
              )}
            </View>
            {(!!job || friendsCount !== null) && (
              <View style={styles.subRow}>
                {!!job && (
                  <CustomText
                    label={job}
                    fontSize={12}
                    letterSpacing={-0.06}
                    color={tint(0.64)}
                    numberOfLines={1}
                    containerStyle={styles.shrink}
                  />
                )}
                {!!job && friendsCount !== null && (
                  <View style={[styles.dot, { backgroundColor: tint(0.64) }]} />
                )}
                {friendsCount !== null && (
                  <>
                    <CustomText
                      label={String(friendsCount)}
                      fontSize={12}
                      color={tint(0.64)}
                    />
                    <Icons
                      family="MaterialSymbolsRoundedFilled"
                      name="group"
                      size={12}
                      color={tint(0.64)}
                    />
                  </>
                )}
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openChat(item)}
          style={[styles.messageBtn, { backgroundColor: tint(0.04) }]}
        >
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="chat"
            size={20}
            color={tint(0.64)}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      headerUnScrollable={() => (
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              // Figma: 4pt #181818 strip between the header and the list
              borderBottomColor: isDark ? "#181818" : colors.surfaceAlt,
            },
          ]}
        >
          <View style={styles.headerRow}>
          {/* New chat picker (Inbox "+"): same back button as the app Header */}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => navigation.goBack()}
            // Figma Inbox-1-on-1: 40 circle white 4%, chevron_left 24 @64%
            style={[styles.back, { backgroundColor: tint(0.04) }]}
          >
            <Icons
              name="chevron_left"
              family="MaterialSymbolsRounded"
              size={24}
              color={tint(0.64)}
            />
          </TouchableOpacity>
          <View style={[styles.searchBar, { backgroundColor: tint(0.04) }]}>
            <Icons
              family="MaterialSymbolsRounded"
              name="search"
              size={22}
              color={tint(0.64)}
            />
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
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="cancel"
                  size={22}
                  color={tint(0.48)}
                />
              </TouchableOpacity>
            )}
          </View>
          </View>
        </View>
      )}
      scrollEnabled
    >
      <View style={[styles.block, { backgroundColor: colors.background }]}>
        <CustomText
          label="ALL FRIENDS"
          fontSize={14}
          fontFamily={fonts.medium}
          letterSpacing={-0.07}
          color={tint(0.64)}
        />
        {loading ? (
          <View style={{ marginHorizontal: -12 }}>
            {[1, 2, 3, 4, 5].map((k) => (
              <ConversationBoxSkeleton key={k} />
            ))}
          </View>
        ) : (
          <FlatList
            data={friends}
            scrollEnabled={false}
            keyExtractor={(item, i) => String(item?._id || i)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => (
              <View style={[styles.line, { backgroundColor: tint(0.04) }]} />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <CustomText
                  label={query ? "No friends match this name" : "No friends yet"}
                  fontSize={16}
                  fontFamily={fonts.semiBold}
                  color={colors.text}
                  textAlign="center"
                />
                <CustomText
                  label={
                    query
                      ? "Try another name."
                      : "When you and someone follow each other, they show up here."
                  }
                  fontSize={14}
                  color={tint(0.64)}
                  textAlign="center"
                  marginTop={4}
                />
                {!query && (
                  <CustomButton
                    title="Find people"
                    onPress={() => navigation.navigate("SearchScreen")}
                    width={180}
                    marginTop={20}
                  />
                )}
              </View>
            }
          />
        )}
      </View>
      <View
        style={{
          height: Math.max(insets.bottom, 16) + 16,
        }}
      />
    </ScreenWrapper>
  );
};

export default OnlineFriends;

const styles = StyleSheet.create({
  header: {
    paddingTop: 8, // Figma 52 − 44pt status bar
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flex: 1,
    height: 44,
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
  ring: {
    width: 44,
    height: 44,
    borderRadius: 100,
    padding: 3,
  },
  photo: {
    width: 38,
    height: 38,
    borderRadius: 100,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  usernameChip: {
    height: 18,
    borderRadius: 100,
    paddingHorizontal: 6,
    justifyContent: "center",
    flexShrink: 1,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 100,
  },
  shrink: {
    flexShrink: 1,
  },
  messageBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  // Figma: rows 8pt above/below each 1px line
  line: {
    height: 1,
    marginVertical: 8,
  },
  empty: {
    alignItems: "center",
    paddingTop: 48,
  },
});
