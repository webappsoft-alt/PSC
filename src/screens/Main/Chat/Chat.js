import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import AccountSwitchSheet from "../../../components/AccountSwitchSheet";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import SearchInput from "../../../components/SearchInput";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useSocket } from "../../../components/SocketProvider";
import {
  getConversations,
  getMyMeetings,
  updateConversationFlags,
  updatePresence,
} from "../../../services/ChatService";
import MeetingRow from "./meeting/MeetingRow";
import { setUserData } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import ConversationBox from "./molecules/ConversationBox";
import ConversationBoxSkeleton from "./molecules/ConversationBoxSkeleton";
import InboxBottomBar, {
  INBOX_BAR_CONTENT_HEIGHT,
} from "./molecules/InboxBottomBar";
import {
  ChatOnlineStatusSheet,
  OnlineStatusSheet,
} from "./molecules/OnlineStatusSheets";
import StatusAvatar from "./molecules/StatusAvatar";
import AnimatedListItem from "../../../utils/AnimatedListItem";
import { useTheme } from "../../../contexts/ThemeContext";

/**
 * Figma `Main-Chat` (Chat page 2352:5157; Groups 7913:2507; Circles 7913:2696)
 * Header: pad 52(44+8)/12/8/12, gap 12
 *   Row 1 (40): avatar 40 (status dot + birthday badge) · gap 6 · chevron in a
 *     20 circle (white 4%) · gap 8 · "Inbox" SemiBold 32 −4%;
 *     right: search · calendar_month · photo_camera, 40 boxes, 24 icons @64%
 *   Row 2 (32): chips gap 4 — bag 40 · Chats · Matches +N · Requests +N
 *     (+N SemiBold 10 #37B874 inside the chip) — scrolls under the filter 40.
 * List: "ALL CHATS N" (34, pad 12, Medium 14 −4% @64% + white count), date
 *   rows "Today" / "Yesterday" / "22 Sep 2026" (34, pad 12, gap 6, 1px 4%
 *   line), 72pt rows with 1px 4% dividers inside each date group.
 * Client: Chats = 1 on 1 · Matches = liked each other · Requests = message
 * requests · bag = business chats · filter = Chat Online Status · avatar =
 * my Online Status · chevron = switch account. Bottom bar: 1 on 1 · Groups
 * (private, invite-only) · Circles (open, topic) — this screen renders all
 * three lists via `kind`.
 */

const GOLD = "#A19375";
const COUNT_GREEN = "#37B874";
const LIST_LABEL = {
  chats: "ALL CHATS",
  matches: "ALL MATCHES",
  requests: "ALL REQUESTS",
  group: "ALL GROUPS",
  circle: "ALL CIRCLES",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dayLabel = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// `embedded`: a page of InboxPager (shared bottom bar + "+" button there).
// `kind`: "direct" (1 on 1 with the Chats / Matches / Requests chips),
// "group" or "circle". `tab` / `onTabChange` let the pager keep the chip
// state of the 1 on 1 page (Groups / Circles pages jump back to it).
const Chat = ({
  embedded = false,
  kind = "direct",
  tab: tabProp,
  onTabChange,
  onNewChat,
  onCreate, // Groups / Circles page: open Create a Group / Circle
}) => {
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const [localTab, setLocalTab] = useState("chats"); // chats | matches | requests
  const tab = kind === "direct" ? tabProp || localTab : "chats";
  const setTab = (t) => (onTabChange ? onTabChange(t) : setLocalTab(t));
  const [business, setBusiness] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [search, setSearch] = useState("");
  const { userData } = useSelector((state) => state.users);
  const { socket } = useSocket();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  // Figma uses white at 4/48/64% on #121212; mirror with #121212 in light mode
  const tint = (o) =>
    isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`;
  const icon64 = tint(0.64);

  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState([]);
  const [counts, setCounts] = useState({ matchesUnread: 0, requestsUnread: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accountsVisible, setAccountsVisible] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);
  // Figma Main-Chat-Meeting: the calendar button toggles the list into my
  // meetings (button turns white; rows = name · time · location · bell)
  const [meetingsMode, setMeetingsMode] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const loadMeetings = async () => {
    setMeetingsLoading(true);
    try {
      const res = await getMyMeetings();
      setMeetings(res?.data?.data || []);
    } catch (e) {
      console.log("Error loading meetings:", e);
    } finally {
      setMeetingsLoading(false);
    }
  };
  const [filterVisible, setFilterVisible] = useState(false);

  const newChat = () =>
    onNewChat ? onNewChat() : navigation.navigate("OnlineFriends");

  // Only the newest request may update the list — older responses (previous
  // tab / previous search term) that arrive late are ignored.
  const requestIdRef = useRef(0);
  const queryRef = useRef({ tab, search: "" });
  queryRef.current = { tab, search: debouncedSearch };

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
      if (data) fetchConversations({ skeleton: false });
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
      const params = { limit: 50, kind };
      if (kind === "direct" && currentTab === "matches") params.isMatching = true;
      if (kind === "direct" && currentTab === "requests") params.isRequest = true;
      if (currentSearch) params.search = currentSearch;

      const res = await getConversations(userData._id, params);

      if (requestId !== requestIdRef.current) return; // stale response
      if (res?.data?.success) {
        setChatData(res.data.data || []);
        setCounts({
          matchesUnread: Number(res.data.counts?.matchesUnread) || 0,
          requestsUnread: Number(res.data.counts?.requestsUnread) || 0,
        });
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

  // my own status (avatar → Online Status)
  const myPresence = userData?.presence || "online";
  const changePresence = async (presence) => {
    if (presence === myPresence) return;
    const before = userData;
    dispatch(setUserData({ ...userData, presence }));
    try {
      const res = await updatePresence(presence);
      if (!res?.data?.success) throw new Error("failed");
    } catch (e) {
      dispatch(setUserData(before));
      ToastMessage("Could not update your status", "error");
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

  const filtered = chatData
    .filter((c) => !business || !!c?.isBusiness)
    .filter((c) => !onlineOnly || !!c?.isOnline);
  const pinnedChats = filtered.filter((c) => !!c?.isPinned);
  const otherChats = filtered.filter((c) => !c?.isPinned);
  // date groups (server order is most recent first)
  const groups = [];
  for (const c of otherChats) {
    const label =
      dayLabel(c?.lastMessage?.createdAt || c?.lastActivity) ||
      (c?.noConversation ? "New Matches" : "Earlier");
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(c);
    else groups.push({ label, items: [c] });
  }
  const isSearching = search.trim().length > 0;
  const showSkeleton = loading || search.trim() !== debouncedSearch;
  // bar + the floating "+" (56 + 16) on every page
  const bottomSpace = INBOX_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 16) + 16 + 72;

  const EmptyState = () => {
    let icon = "forum";
    let title = "No chats yet";
    let desc = "Start a conversation with your friends and matches.";
    let action = { label: "Start a chat", onPress: newChat };
    if (isSearching) {
      icon = "search";
      title = "No results";
      desc = `Nothing matches “${search.trim()}”. Try another name.`;
      action = { label: "Clear search", onPress: () => setSearch("") };
    } else if (business && chatData.length > 0) {
      icon = "work";
      title = "No business chats";
      desc = "Chats with Pro users, or ones you mark as business, show up here.";
      action = { label: "Show all chats", onPress: () => setBusiness(false) };
    } else if (onlineOnly && chatData.length > 0) {
      icon = "filter_list";
      title = "Nobody online";
      desc = "None of these chats are online right now.";
      action = { label: "Show everyone", onPress: () => setOnlineOnly(false) };
    } else if (kind === "group") {
      icon = "groups";
      title = "No groups yet";
      desc = "Create a private group and invite your friends, or wait for an invite.";
      action = onCreate ? { label: "Create a Group", onPress: onCreate } : null;
    } else if (kind === "circle") {
      icon = "campaign";
      title = "No circles yet";
      desc = "Join a Circle to talk about a topic, or create your own.";
      action = { label: "Discover Circles", onPress: () => navigation.navigate("SearchCircles") };
    } else if (tab === "matches") {
      icon = "favorite";
      title = "No matches yet";
      desc = "When you and someone like each other, they show up here.";
      action = {
        label: "Find matches",
        onPress: () => navigation.navigate("TabStack", { screen: "Matching" }),
      };
    } else if (tab === "requests") {
      icon = "mark_chat_unread";
      title = "No requests";
      desc = "Messages from people you don't know yet show up here.";
      action = null;
    }
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: tint(0.04) }]}>
          <Icons family="MaterialSymbolsRoundedFilled" name={icon} size={32} color={icon64} />
        </View>
        <CustomText label={title} fontSize={20} fontFamily={fonts.semiBold} letterSpacing={-0.5} color={colors.text} textAlign="center" marginTop={16} />
        <CustomText label={desc} fontSize={14} color={icon64} textAlign="center" marginTop={4} />
        {action && (
          <CustomButton title={action.label} onPress={action.onPress} width={180} marginTop={24} />
        )}
      </View>
    );
  };

  const HeaderButton = ({ name, onPress }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={!onPress} style={styles.headerBtn}>
      <Icons family="MaterialSymbolsRoundedFilled" name={name} size={24} color={icon64} />
    </TouchableOpacity>
  );

  // Chats / Matches / Requests — on the Groups / Circles pages they jump back
  // to the 1 on 1 page with that chip (the header is the same on all three)
  const renderChip = (key, label, count) => {
    // Figma Main-Chat-Groups / -Circles show the current chip ("Chats") active too
    const active = tab === key;
    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.7}
        onPress={() => setTab(key)}
        style={[
          styles.chip,
          { gap: key === "matches" ? 2 : 4 },
          active
            ? { backgroundColor: isDark ? COLORS.white : COLORS.primaryColor }
            : { borderWidth: 1, borderColor: tint(0.04) },
        ]}
      >
        <CustomText
          label={label}
          fontSize={14}
          fontFamily={fonts.medium}
          color={active ? (isDark ? COLORS.primaryColor : COLORS.white) : icon64}
        />
        {count > 0 && (
          <CustomText
            label={`+${count > 99 ? 99 : count}`}
            fontSize={10}
            fontFamily={fonts.semiBold}
            color={COUNT_GREEN}
          />
        )}
      </TouchableOpacity>
    );
  };

  const ListLabel = ({ label, count }) => (
    <View style={styles.listLabel}>
      <CustomText label={label} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.56} color={icon64} />
      <CustomText label={showSkeleton ? "" : String(count)} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.56} color={colors.text} />
    </View>
  );

  const DateRow = ({ label }) => (
    <View style={styles.dateRow}>
      <CustomText label={label} fontSize={14} fontFamily={fonts.medium} color={icon64} />
      <View style={[styles.dateLine, { backgroundColor: tint(0.04) }]} />
    </View>
  );

  const renderRows = (data) => (
    <FlatList
      data={data}
      scrollEnabled={false}
      keyExtractor={(item, i) => item?._id?.toString?.() || i.toString()}
      ItemSeparatorComponent={() => <View style={[styles.line, { backgroundColor: tint(0.04) }]} />}
      renderItem={({ item, index }) => (
        <AnimatedListItem index={index}>
          <ConversationBox item={item} onLongPress={togglePin} />
        </AnimatedListItem>
      )}
    />
  );

  const listKey = kind === "direct" ? tab : kind;

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
          {/* ───────── Row 1: avatar ⌄ · Inbox · search / calendar / camera ───────── */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarWrap}>
                {/* avatar → my Online Status */}
                <TouchableOpacity activeOpacity={0.7} onPress={() => setStatusVisible(true)}>
                  <StatusAvatar
                    user={userData}
                    size={40}
                    status={myPresence}
                    showAllStatuses
                    isBirthday={(() => {
                      const d = userData?.dob ? new Date(userData.dob) : null;
                      const n = new Date();
                      return !!d && !Number.isNaN(d.getTime()) && d.getUTCDate() === n.getUTCDate() && d.getUTCMonth() === n.getUTCMonth();
                    })()}
                    initialsSize={14}
                  />
                </TouchableOpacity>
                {/* chevron → switch account */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={8}
                  onPress={() => setAccountsVisible(true)}
                  style={[styles.chevron, { backgroundColor: tint(0.04) }]}
                >
                  <Icons family="MaterialSymbolsRounded" name="keyboard_arrow_down" size={16} color={icon64} />
                </TouchableOpacity>
              </View>
              <CustomText label="Inbox" fontSize={32} fontFamily={fonts.semiBold} letterSpacing={-1.28} color={colors.text} numberOfLines={1} />
            </View>
            <View style={styles.headerRight}>
              {/* Circles: search finds Circles to join (Figma Search-A-Circle) */}
              <HeaderButton
                name={isSearchVisible ? "close" : "search"}
                onPress={() => {
                  if (kind === "circle") {
                    navigation.navigate("SearchCircles");
                    return;
                  }
                  if (isSearchVisible) setSearch("");
                  setIsSearchVisible(!isSearchVisible);
                }}
              />
              {/* all my meetings (client) — toggles the list below */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const next = !meetingsMode;
                  setMeetingsMode(next);
                  if (next) loadMeetings();
                }}
                style={[styles.headerBtn, meetingsMode && { backgroundColor: isDark ? "#FFFFFF" : "#121212" }]}
              >
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="calendar_month"
                  size={24}
                  color={meetingsMode ? (isDark ? "#121212" : "#FFFFFF") : icon64}
                />
              </TouchableOpacity>
              <HeaderButton name="photo_camera" onPress={() => navigation.navigate("CameraScreen")} />
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

          {/* ───────── Row 2: bag · Chats · Matches · Requests | filter ───────── */}
          <View style={styles.chipsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContent}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setBusiness((b) => !b)}
                // Figma: off = 1px white 4% border + 64% icon, on = #A19375 + #121212
                style={[
                  styles.iconChip,
                  business ? { backgroundColor: GOLD } : { borderWidth: 1, borderColor: tint(0.04) },
                ]}
              >
                <Icons family="MaterialSymbolsRoundedFilled" name="work" size={16} color={business ? COLORS.primaryColor : icon64} />
              </TouchableOpacity>
              {renderChip("chats", "Chats", 0)}
              {renderChip("matches", "Matches", counts.matchesUnread)}
              {renderChip("requests", "Requests", counts.requestsUnread)}
            </ScrollView>
            {/* filter → Chat Online Status; sits over the scrolling chips */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setFilterVisible(true)}
              style={[
                styles.filterChip,
                onlineOnly
                  ? { backgroundColor: isDark ? COLORS.white : COLORS.primaryColor }
                  : { backgroundColor: colors.background, borderWidth: 1, borderColor: tint(0.04) },
              ]}
            >
              <Icons
                family="MaterialSymbolsRounded"
                name="filter_list"
                size={16}
                color={onlineOnly ? (isDark ? COLORS.primaryColor : COLORS.white) : colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      footerUnScrollable={() => (embedded ? null : <InboxBottomBar active="chat" />)}
      scrollEnabled
    >
      <>
        {meetingsMode ? (
          <>
            <ListLabel label="ALL MEETINGS" count={meetingsLoading ? "" : meetings.length} />
            {meetingsLoading ? (
              [1, 2, 3, 4].map((k) => <ConversationBoxSkeleton key={k} />)
            ) : meetings.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIcon, { backgroundColor: tint(0.04) }]}>
                  <Icons family="MaterialSymbolsRoundedFilled" name="calendar_month" size={32} color={icon64} />
                </View>
                <CustomText label="No meetings yet" fontSize={20} fontFamily={fonts.semiBold} letterSpacing={-0.5} color={colors.text} textAlign="center" marginTop={16} />
                <CustomText label="Schedule one from the calendar button inside any chat." fontSize={14} color={icon64} textAlign="center" marginTop={4} />
              </View>
            ) : (
              (() => {
                const groupsM = [];
                for (const r of meetings) {
                  const label = dayLabel(r?.meeting?.startsAt) || "Later";
                  const last = groupsM[groupsM.length - 1];
                  if (last && last.label === label) last.items.push(r);
                  else groupsM.push({ label, items: [r] });
                }
                return groupsM.map((g, i) => (
                  <Fragment key={`m-${g.label}-${i}`}>
                    <DateRow label={g.label} />
                    <FlatList
                      data={g.items}
                      scrollEnabled={false}
                      keyExtractor={(r) => String(r._id)}
                      ItemSeparatorComponent={() => <View style={[styles.line, { backgroundColor: tint(0.04) }]} />}
                      renderItem={({ item: r }) => <MeetingRow row={r} />}
                    />
                  </Fragment>
                ));
              })()
            )}
          </>
        ) : showSkeleton ? (
          <>
            <ListLabel label={LIST_LABEL[listKey]} count={0} />
            {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
              <ConversationBoxSkeleton key={index} />
            ))}
          </>
        ) : (
          <>
            {pinnedChats.length > 0 && (
              <>
                <ListLabel label="PINNED" count={pinnedChats.length} />
                {renderRows(pinnedChats)}
              </>
            )}
            <ListLabel label={LIST_LABEL[listKey]} count={otherChats.length} />
            {groups.length === 0 && pinnedChats.length === 0 ? (
              <EmptyState />
            ) : (
              groups.map((g, i) => (
                <Fragment key={`${g.label}-${i}`}>
                  <DateRow label={g.label} />
                  {renderRows(g.items)}
                </Fragment>
              ))
            )}
          </>
        )}
        <View style={{ height: bottomSpace }} />

        <AccountSwitchSheet returnTo="Chat" visible={accountsVisible} onDismiss={() => setAccountsVisible(false)} />
        <OnlineStatusSheet
          visible={statusVisible}
          onDismiss={() => setStatusVisible(false)}
          value={myPresence}
          onSelect={changePresence}
        />
        <ChatOnlineStatusSheet
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          onlineOnly={onlineOnly}
          onChange={setOnlineOnly}
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
      gap: 8,
    },
    avatarWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    chevron: {
      width: 20,
      height: 20,
      borderRadius: 100,
      alignItems: "center",
      justifyContent: "center",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
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
      justifyContent: "center",
    },
    chipsContent: {
      gap: 4,
      alignItems: "center",
      paddingRight: 48, // scroll the last chip clear of the filter
    },
    chip: {
      height: 32,
      flexDirection: "row",
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
      position: "absolute",
      right: 0,
      width: 40,
      height: 32,
      borderRadius: 100,
      alignItems: "center",
      justifyContent: "center",
    },
    // Figma "ALL CHATS 4": 34 tall, pad 12, gap 4
    listLabel: {
      minHeight: 34,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      gap: 4,
    },
    // Figma date row: 34 tall, pad 12, gap 6, 1px white 4% line
    dateRow: {
      minHeight: 34,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      gap: 6,
    },
    dateLine: {
      flex: 1,
      height: 1,
    },
    line: {
      height: 1,
      width: "100%",
    },
    empty: {
      alignItems: "center",
      paddingHorizontal: 32,
      paddingTop: 80,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 100,
      alignItems: "center",
      justifyContent: "center",
    },
  });
