import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import AccountSwitchSheet from "../../../components/AccountSwitchSheet";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import SearchInput from "../../../components/SearchInput";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useSocket } from "../../../components/SocketProvider";
import {
  getConversations,
  updateConversationFlags,
} from "../../../services/ChatService";
import { ToastMessage } from "../../../utils/ToastMessage";
import { COLORS } from "../../../utils/COLORS";
import ConversationBox from "./molecules/ConversationBox";
import ConversationBoxSkeleton from "./molecules/ConversationBoxSkeleton";
import InboxBottomBar, {
  INBOX_BAR_CONTENT_HEIGHT,
} from "./molecules/InboxBottomBar";
import AnimatedListItem from "../../../utils/AnimatedListItem";
import { useTheme } from "../../../contexts/ThemeContext";

/**
 * Figma `Main-Chat` (Chat page, 2352:5157 / business state 7815:3751):
 * Header: paddingTop 52 (44 + 8) · paddingH 12 · paddingBottom 8 · row gap 12
 *   Row 1 (40): avatar 40 + gap 4 + chevron 24 (64%) · gap 12 · "Inbox" SemiBold 24
 *               right: 3 × 40 buttons, gap 6 — search 24 · photo_camera 24 · add 32
 *   Row 2 (32): gap 6, chips padH 12, radius 100
 *     bag 40 (business filter): off = #A19375 4% + gold icon, on = #A19375 + #121212 icon
 *     Chats / Matches: active white + #121212, else 1px white 4% border + 64% text
 *     Matches unread badge: 20 tall, pad 4/6, #EE1045, SemiBold 10 white, gap 4
 *     filter 42 pinned right
 * List starts 2pt under the header; section row 40 (pad 8/16) + 1px 4% lines.
 * Client rules: Chats = every conversation (1 on 1 now, groups later);
 * Matches = people who liked (= followed) each other; bag = business chats
 * (Pro users automatically, or marked in Conversation settings); filter opens
 * the online friends list; long-press pins a chat.
 */

const GOLD = "#A19375";

const Chat = () => {
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("chats"); // "chats" | "matches"
  const [business, setBusiness] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [search, setSearch] = useState("");
  const { userData } = useSelector((state) => state.users);
  const { socket } = useSocket();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  // Figma uses white at 4/48/64% on #121212; mirror with #121212 in light mode
  const tint = (o) =>
    isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`;

  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState([]);
  const [matchesUnread, setMatchesUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accountsVisible, setAccountsVisible] = useState(false);

  // Only the newest request may update the list — older responses (previous
  // tab / previous search term) that arrive late are ignored.
  const requestIdRef = useRef(0);
  // latest tab + search for socket-triggered refreshes
  const queryRef = useRef({ tab, search: "" });
  queryRef.current = { tab, search: debouncedSearch };

  // wait until typing pauses before hitting the API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // tab / search changed → skeleton until the matching response arrives
  useEffect(() => {
    fetchConversations({ skeleton: true });
  }, [tab, debouncedSearch]);

  // coming back to the screen → refresh quietly (no skeleton flash)
  useEffect(() => {
    if (isFocus) fetchConversations({ skeleton: false });
  }, [isFocus]);

  useEffect(() => {
    if (!socket) return;
    const onNewMessage = (data) => {
      if (data) {
        fetchConversations({ skeleton: false });
      }
    };
    socket.on("new:message", onNewMessage);

    return () => {
      socket.off("new:message", onNewMessage);
    };
  }, [socket]);

  const fetchConversations = async ({ skeleton = false, pull = false } = {}) => {
    if (!userData?._id) {
      setLoading(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    const { tab: currentTab, search: currentSearch } = queryRef.current;
    if (skeleton) setLoading(true);
    if (pull) setRefreshing(true);
    try {
      const params = { limit: 50 };
      if (currentTab === "matches") params.isMatching = true;
      if (currentSearch) params.search = currentSearch;

      const res = await getConversations(userData._id, params);

      if (requestId !== requestIdRef.current) return; // stale response
      if (res?.data?.success) {
        setChatData(res.data.data || []);
        setMatchesUnread(Number(res.data.counts?.matchesUnread) || 0);
      }
    } catch (error) {
      console.log("Error fetching conversations:", error);
    } finally {
      if (requestId === requestIdRef.current) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  };

  // Client: long-press a chat to pin / unpin it
  const togglePin = async (item) => {
    if (!item?._id || item?.noConversation) return;
    const pinned = !item.isPinned;
    const apply = (value) =>
      setChatData((prev) =>
        prev.map((c) =>
          String(c?._id) === String(item._id) ? { ...c, isPinned: value } : c,
        ),
      );
    apply(pinned);
    try {
      const res = await updateConversationFlags(item._id, { pinned });
      if (!res?.data?.success) throw new Error("failed");
      ToastMessage(pinned ? "Chat pinned" : "Chat unpinned");
      fetchConversations({ skeleton: false });
    } catch (e) {
      apply(!pinned);
      ToastMessage("Could not update this chat", "error");
    }
  };

  const filtered = chatData.filter((c) => !business || !!c?.isBusiness);
  const pinnedChats = filtered.filter((c) => !!c?.isPinned);
  const otherChats = filtered.filter((c) => !c?.isPinned);
  const isSearching = search.trim().length > 0;
  // typed but debounce not fired yet → still "loading" for the user
  const showSkeleton = loading || search.trim() !== debouncedSearch;
  const bottomSpace = INBOX_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 16) + 16;

  const EmptyState = () => {
    let icon = "forum";
    let title = "No chats yet";
    let desc = "Start a conversation with your friends and matches.";
    let action = {
      label: "Start a chat",
      onPress: () => navigation.navigate("OnlineFriends"),
    };
    if (isSearching) {
      icon = "search";
      title = "No results";
      desc = `No chats match “${search.trim()}”. Try another name.`;
      action = { label: "Clear search", onPress: () => setSearch("") };
    } else if (business && chatData.length > 0) {
      icon = "work";
      title = "No business chats";
      desc = "Chats with Pro users, or ones you mark as business, show up here.";
      action = { label: "Show all chats", onPress: () => setBusiness(false) };
    } else if (tab === "matches") {
      icon = "favorite";
      title = "No matches yet";
      desc = "When you and someone like each other, they show up here.";
      action = {
        label: "Find matches",
        onPress: () => navigation.navigate("TabStack", { screen: "Matching" }),
      };
    }
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: tint(0.04) }]}>
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name={icon}
            size={32}
            color={tint(0.64)}
          />
        </View>
        <CustomText
          label={title}
          fontSize={20}
          fontFamily={fonts.semiBold}
          letterSpacing={-0.5}
          color={colors.text}
          textAlign="center"
          marginTop={16}
        />
        <CustomText
          label={desc}
          fontSize={14}
          color={tint(0.64)}
          textAlign="center"
          marginTop={4}
        />
        {action && (
          <CustomButton
            title={action.label}
            onPress={action.onPress}
            width={180}
            marginTop={24}
          />
        )}
      </View>
    );
  };

  const HeaderButton = ({ name, size = 24, onPress }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      style={styles.headerBtn}
    >
      <Icons
        family="MaterialSymbolsRoundedFilled"
        name={name}
        size={size}
        color={colors.text}
      />
    </TouchableOpacity>
  );

  const renderChip = (key, label) => {
    const active = tab === key;
    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.7}
        onPress={() => setTab(key)}
        style={[
          styles.chip,
          active
            ? { backgroundColor: isDark ? COLORS.white : COLORS.primaryColor }
            : { borderWidth: 1, borderColor: tint(0.04) },
        ]}
      >
        <CustomText
          label={label}
          fontSize={14}
          fontFamily={fonts.medium}
          color={
            active ? (isDark ? COLORS.primaryColor : COLORS.white) : tint(0.64)
          }
        />
      </TouchableOpacity>
    );
  };

  const SectionHeader = ({ icon, label, count, collapsible }) => (
    <>
      <TouchableOpacity
        onPress={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        disabled={!collapsible}
        style={styles.sectionHeader}
        activeOpacity={0.7}
      >
        <View style={styles.sectionLeft}>
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name={icon}
            size={16}
            color={colors.text}
          />
          <CustomText
            fontSize={16}
            label={label}
            fontFamily={fonts.medium}
            letterSpacing={-0.5}
            color={colors.text}
          />
          <CustomText
            fontSize={16}
            color={tint(0.64)}
            label={showSkeleton ? "" : String(count)}
            fontFamily={fonts.medium}
            letterSpacing={-0.5}
          />
        </View>
        {collapsible && (
          <Icons
            size={24}
            family="MaterialSymbolsRounded"
            name={isCollapsed ? "keyboard_arrow_right" : "keyboard_arrow_down"}
            color={tint(0.64)}
          />
        )}
      </TouchableOpacity>
      <View style={[styles.line, { backgroundColor: tint(0.04) }]} />
    </>
  );

  const renderList = (data, withEmpty) => (
    <FlatList
      data={data}
      scrollEnabled={false}
      keyExtractor={(item, i) => item?._id?.toString?.() || i.toString()}
      ItemSeparatorComponent={() => (
        <View style={[styles.line, { backgroundColor: tint(0.04) }]} />
      )}
      ListEmptyComponent={withEmpty ? <EmptyState /> : null}
      renderItem={({ item, index }) => (
        <AnimatedListItem index={index}>
          <ConversationBox item={item} onLongPress={togglePin} />
        </AnimatedListItem>
      )}
    />
  );

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchConversations({ pull: true })}
          tintColor={COLORS.buttonColor}
          colors={[COLORS.buttonColor]}
        />
      }
      headerUnScrollable={() => (
        <View style={styles.header}>
          {/* ───────── Row 1: avatar ⌄ · Inbox · search / camera / add ───────── */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.avatarWrap}
                // avatar + chevron → switch between the accounts on this device
                onPress={() => setAccountsVisible(true)}
              >
                {userData?.profile?.avatar ? (
                  <ImageFast
                    source={{ uri: userData.profile.avatar }}
                    style={styles.headerAvatar}
                  />
                ) : (
                  // no photo → initials on the profile colour (same as the rows)
                  <View
                    style={[
                      styles.headerAvatar,
                      styles.headerInitials,
                      {
                        backgroundColor:
                          userData?.profile?.profileColor || tint(0.08),
                      },
                    ]}
                  >
                    <CustomText
                      label={
                        `${userData?.firstName?.[0] || ""}${
                          userData?.lastName?.[0] || ""
                        }`.toUpperCase() || "?"
                      }
                      fontSize={14}
                      fontFamily={fonts.semiBold}
                      color={COLORS.primaryColor}
                    />
                  </View>
                )}
                <Icons
                  family="MaterialSymbolsRounded"
                  name="keyboard_arrow_down"
                  size={24}
                  color={tint(0.64)}
                />
              </TouchableOpacity>
              <CustomText
                label="Inbox"
                fontSize={24}
                fontFamily={fonts.semiBold}
                letterSpacing={-0.12}
                color={colors.text}
                numberOfLines={1}
              />
            </View>
            <View style={styles.headerRight}>
              <HeaderButton
                name={isSearchVisible ? "close" : "search"}
                onPress={() => {
                  if (isSearchVisible) {
                    setSearch("");
                  }
                  setIsSearchVisible(!isSearchVisible);
                }}
              />
              <HeaderButton
                name="photo_camera"
                onPress={() => navigation.navigate("CameraScreen")}
              />
              {/* new 1 on 1 chat: pick a friend (groups later) */}
              <HeaderButton
                name="add"
                size={32}
                onPress={() => navigation.navigate("OnlineFriends")}
              />
            </View>
          </View>

          {isSearchVisible && (
            <SearchInput
              placeholder="Search by name..."
              value={search}
              onChangeText={setSearch}
              autoFocus
              height={48}
              marginBottom={0}
              marginTop={0}
            />
          )}

          {/* ───────── Row 2: bag · Chats · Matches (+N) · filter ───────── */}
          <View style={styles.chipsRow}>
            <View style={styles.chipsLeft}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setBusiness((b) => !b)}
                // Figma: off = 1px white 4% border + 64% icon, on = #A19375 + #121212
                style={[
                  styles.iconChip,
                  business
                    ? { backgroundColor: GOLD }
                    : { borderWidth: 1, borderColor: tint(0.04) },
                ]}
              >
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="work"
                  size={16}
                  color={business ? COLORS.primaryColor : tint(0.64)}
                />
              </TouchableOpacity>
              {renderChip("chats", "Chats")}
              <View style={styles.matchesWrap}>
                {renderChip("matches", "Matches")}
                {matchesUnread > 0 && (
                  <View style={styles.matchesBadge}>
                    <CustomText
                      label={`+${matchesUnread > 99 ? 99 : matchesUnread}`}
                      fontSize={10}
                      fontFamily={fonts.semiBold}
                      color={COLORS.white}
                    />
                  </View>
                )}
              </View>
            </View>
            {/* Figma: filter opens the online friends list */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("OnlineFriends")}
              style={[
                styles.filterChip,
                { borderWidth: 1, borderColor: tint(0.04) },
              ]}
            >
              <Icons
                family="MaterialSymbolsRounded"
                name="filter_list"
                size={16}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      footerUnScrollable={() => <InboxBottomBar active="chat" />}
      scrollEnabled
    >
      <>
        {showSkeleton ? (
          <>
            <SectionHeader
              icon={tab === "matches" ? "favorite" : "forum"}
              label={tab === "matches" ? "All Matches" : "My Chats"}
              count={0}
            />
            {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
              <ConversationBoxSkeleton key={index} />
            ))}
          </>
        ) : (
          <>
            {pinnedChats.length > 0 && (
              <>
                <SectionHeader
                  icon="push_pin"
                  label="Pinned"
                  count={pinnedChats.length}
                />
                {renderList(pinnedChats, false)}
                <View style={[styles.line, { backgroundColor: tint(0.04) }]} />
              </>
            )}
            {/* Client: Matches is a single "All Matches" column */}
            <SectionHeader
              icon={tab === "matches" ? "favorite" : "forum"}
              label={tab === "matches" ? "All Matches" : "My Chats"}
              count={otherChats.length}
              collapsible
            />
            {!isCollapsed &&
              renderList(otherChats, pinnedChats.length === 0)}
          </>
        )}
        <View style={{ height: bottomSpace }} />

        <AccountSwitchSheet
          returnTo="Chat"
          visible={accountsVisible}
          onDismiss={() => setAccountsVisible(false)}
        />
      </>
    </ScreenWrapper>
  );
};

export default Chat;

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    header: {
      backgroundColor: colors.background,
      paddingTop: 8, // Figma 52 − 44pt status bar (ScreenWrapper pads the inset)
      paddingHorizontal: 12,
      paddingBottom: 8,
      gap: 12,
      marginBottom: 2, // list starts at 146, header ends at 144
    },
    headerRow: {
      height: 40,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatarWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 100,
    },
    headerInitials: {
      alignItems: "center",
      justifyContent: "center",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 100,
      alignItems: "center",
      justifyContent: "center",
    },
    chipsRow: {
      height: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
    },
    chipsLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    chip: {
      height: 32,
      borderRadius: 100,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    iconChip: {
      width: 40,
      height: 32,
      borderRadius: 100,
      alignItems: "center",
      justifyContent: "center",
    },
    filterChip: {
      width: 42,
      height: 32,
      borderRadius: 100,
      alignItems: "center",
      justifyContent: "center",
    },
    // Figma "Frame 29": Matches chip + badge, gap 4
    matchesWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    matchesBadge: {
      height: 20,
      minWidth: 32,
      borderRadius: 100,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.red1,
    },
    sectionHeader: {
      height: 40,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      paddingHorizontal: 16,
      gap: 8,
    },
    sectionLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    line: {
      height: 1,
      width: "100%",
    },
    empty: {
      alignItems: "center",
      paddingHorizontal: 32,
      paddingTop: 96,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 100,
      alignItems: "center",
      justifyContent: "center",
    },
  });
