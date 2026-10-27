import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icons from "../../../components/Icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { createGroup } from "../../../services/ChatService";
import { ToastMessage } from "../../../utils/ToastMessage";
import Chat from "./Chat";
import GroupFormSheet from "./molecules/GroupFormSheet";
import InboxBottomBar, {
  INBOX_BAR_CONTENT_HEIGHT,
} from "./molecules/InboxBottomBar";

/**
 * Inbox host (route "Chat") — WhatsApp-style, per client:
 * 1 on 1 · Groups · Circles are swipeable pages; the bottom bar is drawn once
 * on top of them, so Home / Settings never move and only the active pill
 * glides between the centre icons as you swipe.
 *
 * A plain horizontal paging ScrollView (not react-native-pager-view): on iOS
 * pager-view 8 is a SwiftUI TabView that shifts its pages by the status-bar
 * inset, which pushed the Inbox header down.
 *
 * Figma "+" (Main-Chat "Background" 56 at 303,645): glass circle 56, pad 4,
 * #1E1E1E 64% + blur 16, 1px white 8%; add 24 @64%; 16 above the bar, 16 from
 * the right. Per page: 1 on 1 → New chat (friends picker) · Groups → Create a
 * Group (then invite friends) · Circles → Create a Circle.
 */
const PAGES = { chat: 0, groups: 1, circles: 2 };

const InboxPager = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [page, setPage] = useState(0);
  const [directTab, setDirectTab] = useState("chats");

  // 0 → 1 on 1, 1 → Groups, 2 → Circles (fractional while swiping)
  const progress = useMemo(
    () => Animated.divide(scrollX, Math.max(width, 1)),
    [scrollX, width],
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      }),
    [scrollX],
  );

  const goTo = useCallback(
    (key) => {
      const index = PAGES[key];
      if (index === undefined) return;
      setPage(index);
      scrollRef.current?.scrollTo?.({ x: index * width, animated: true });
    },
    [width],
  );

  // Groups / Circles headers show the same chips: tapping Chats / Matches /
  // Requests there opens the 1 on 1 page on that chip
  const openDirectTab = useCallback(
    (tab) => {
      setDirectTab(tab);
      goTo("chat");
    },
    [goTo],
  );

  const newChat = useCallback(() => navigation.navigate("OnlineFriends"), [navigation]);

  // Create a Group / Circle sheet
  const [formType, setFormType] = useState(null); // "group" | "circle" | null
  const [saving, setSaving] = useState(false);
  const openCreate = useCallback((type) => setFormType(type), []);

  const onFormContinue = async (form) => {
    if (form.type === "group") {
      // step 2: invite friends (creates the group on Continue there)
      setFormType(null);
      navigation.navigate("CreateGroupInvite", { form });
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const res = await createGroup(form);
      const circle = res?.data?.data;
      if (!res?.data?.success || !circle?._id) throw new Error(res?.data?.error || "failed");
      setFormType(null);
      ToastMessage(`${circle.name} created`);
      navigation.navigate("InboxScreen", {
        conversationId: circle._id,
        isGroup: true,
        groupType: "circle",
        recipientName: circle.name,
        groupPicture: circle.picture,
        memberCount: circle.memberCount,
      });
    } catch (e) {
      ToastMessage(e?.message && e.message !== "failed" ? e.message : "Could not create the Circle", "error");
    } finally {
      setSaving(false);
    }
  };

  const onFab = () =>
    page === 1 ? openCreate("group") : page === 2 ? openCreate("circle") : newChat();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / Math.max(width, 1)))
        }
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"
        style={styles.root}
        contentContainerStyle={styles.content}
      >
        <View style={{ width, height: "100%" }}>
          <Chat embedded kind="direct" tab={directTab} onTabChange={setDirectTab} onNewChat={newChat} />
        </View>
        <View style={{ width, height: "100%" }}>
          <Chat embedded kind="group" onTabChange={openDirectTab} onNewChat={newChat} onCreate={() => openCreate("group")} />
        </View>
        <View style={{ width, height: "100%" }}>
          <Chat embedded kind="circle" onTabChange={openDirectTab} onNewChat={newChat} onCreate={() => openCreate("circle")} />
        </View>
      </Animated.ScrollView>

      <View
        pointerEvents="box-none"
        style={[
          styles.fabWrap,
          { bottom: INBOX_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 16) + 16 },
        ]}
      >
        <TouchableOpacity activeOpacity={0.8} onPress={onFab} style={styles.fab}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={isDark ? "dark" : "light"}
            blurAmount={16}
            reducedTransparencyFallbackColor="#1E1E1E"
          />
          <View style={[StyleSheet.absoluteFill, styles.fabTint]} />
          <Icons
            family="MaterialSymbolsRounded"
            name="add"
            size={24}
            color={isDark ? "rgba(255, 255, 255, 0.64)" : "rgba(18, 18, 18, 0.64)"}
          />
        </TouchableOpacity>
      </View>

      <InboxBottomBar progress={progress} onSelect={goTo} />

      <GroupFormSheet
        visible={!!formType}
        type={formType || "group"}
        saving={saving}
        onDismiss={() => setFormType(null)}
        onContinue={onFormContinue}
      />
    </View>
  );
};

export default InboxPager;

const styles = StyleSheet.create({
  root: { flex: 1 },
  // pages stretch to the full height of the pager
  content: { alignItems: "stretch" },
  fabWrap: {
    position: "absolute",
    right: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  fabTint: {
    backgroundColor: "rgba(30, 30, 30, 0.64)",
  },
});
