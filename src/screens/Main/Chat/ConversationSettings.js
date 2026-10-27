import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import Blur from "../../../components/Blur";
import CustomSwitch from "../../../components/CustomSwitch";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { del, get, post } from "../../../services/ApiRequest";
import {
  deleteAllMessages,
  getConversationSettings,
  leaveGroup,
  updateConversationSettings,
} from "../../../services/ChatService";
import { ToastMessage } from "../../../utils/ToastMessage";
import CallOptionsSheet from "./molecules/CallOptionsSheet";
import { disappearLabel } from "./DisappearingMessages";
import ConfirmSheet from "./molecules/ConfirmSheet";

/**
 * Figma Chat page "Conversation-settings" (2212:5486, 375×2467), opened from
 * the chat header's tune button — 1 on 1 chats and Groups / Circles.
 *
 * Banner 375×375 (picture, FILL) · top overlay 132 (#121212 → transparent,
 * pad 52/12/12/12 gap 12): back 40 white 8% + arrow 20 @64% · gap 8 ·
 * "Display Name" SemiBold 24 −3%; tune 16 @64% + "Manage your conversation"
 * Medium 14 −3% @64%. Bottom overlay 72 (transparent → #121212) with a 48
 * white r12 QR (32 code). Content from 391 (banner + 16), pad 12, sections
 * 40 apart: title Medium 14 @48% (+ count white) · 16 · content.
 * Rows 16 apart, 1px white 8% dividers: icon 24 #A19375 · gap 8 · Medium 16
 * #F8F9FB (+ 12 auto_awesome + Medium 14 #828186 note) · gold switch 64×28
 * or chevron 32 @48%. Footer Regular 12 −1% @48%, "PSC" Medium white.
 *
 * Client: only the security logic is implemented (PRIVACY & SECURITY, all off
 * by default, enforced server-side); customization rows are UI only.
 */
const GOLD = "#A19375";
const NOTE = "#828186";
const RED = "#EE1045";
const BANNER = 375;

// Figma trims text to cap height; RN 1.4 line boxes add space above/below the
// glyphs. Offsets below are measured (Figma raster vs simulator, 3x):
//  Medium 14 title: cap → box bottom 14.67  → 16 gap becomes 26 − 14.67
const TITLE_TO_CONTENT = 26 - 14.67; // 11.33
const Section = ({ title, count, children, gap = TITLE_TO_CONTENT }) => {
  const { isDark } = useTheme();
  return (
    <View style={{ gap }}>
      <View style={styles.sectionTitle}>
        <CustomText
          label={title}
          fontSize={14}
          fontFamily={fonts.medium}
          color={
            isDark ? "rgba(255, 255, 255, 0.48)" : "rgba(18, 18, 18, 0.48)"
          }
        />
        {count !== undefined && count !== "" && (
          <CustomText
            label={String(count)}
            fontSize={14}
            fontFamily={fonts.medium}
          />
        )}
      </View>
      {children}
    </View>
  );
};

const Divider = () => {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(18, 18, 18, 0.08)",
        },
      ]}
    />
  );
};

/** One settings row: switch (value/onChange) or chevron (onPress). */
// label Medium 16 cap → note Medium 14 cap: Figma 20, RN 21.7 → −1.7
// label → desc Regular 10 cap: Figma 19, RN 20.3 → −1.3
const NOTE_PULL = -1.7;
const DESC_PULL = -1.3;
const Row = ({
  icon,
  iconSize = 24,
  iconColor = GOLD,
  label,
  note,
  desc,
  value,
  onChange,
  onPress,
  disabled,
  dim,
}) => {
  const { colors, isDark } = useTheme();
  const chevronColor = isDark
    ? "rgba(255, 255, 255, 0.48)"
    : "rgba(18, 18, 18, 0.48)";
  const content = (
    <View style={[styles.row, dim && { opacity: 0.48 }]}>
      <View style={styles.rowLeft}>
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name={icon}
          size={iconSize}
          color={iconColor}
        />
        <View
          style={[
            styles.rowText,
            note ? styles.rowTextNote : desc ? styles.rowTextDesc : null,
          ]}
        >
          <CustomText
            label={label}
            fontSize={16}
            fontFamily={fonts.medium}
            color={isDark ? "#F8F9FB" : colors.text}
          />
          {!!note && (
            <View style={styles.noteRow}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="auto_awesome"
                size={12}
                color={GOLD}
              />
              <CustomText
                label={note}
                fontSize={14}
                fontFamily={fonts.medium}
                color={NOTE}
              />
            </View>
          )}
          {!!desc && (
            <CustomText
              label={desc}
              fontSize={10}
              color={NOTE}
              marginTop={DESC_PULL}
            />
          )}
        </View>
      </View>
      {onChange ? (
        // Figma toggle row is 28; the native switch box is 31 — let it overflow
        <View style={styles.switchSlot}>
          <CustomSwitch
            value={value}
            setValue={onChange}
            bgColor={GOLD}
            disabled={disabled}
          />
        </View>
      ) : (
        <Icons
          family="MaterialSymbolsRounded"
          name="chevron_right"
          size={32}
          color={chevronColor}
        />
      )}
    </View>
  );
  if (onChange && onPress) {
    // toggle row whose label opens a detail screen (Disappearing messages)
    return (
      <View style={[styles.row, dim && { opacity: 0.48 }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          style={styles.rowLeft}
        >
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name={icon}
            size={iconSize}
            color={iconColor}
          />
          <View style={[styles.rowText, note ? styles.rowTextNote : null]}>
            <CustomText
              label={label}
              fontSize={16}
              fontFamily={fonts.medium}
              color={isDark ? "#F8F9FB" : colors.text}
            />
            {!!note && (
              <View style={styles.noteRow}>
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="auto_awesome"
                  size={12}
                  color={GOLD}
                />
                <CustomText
                  label={note}
                  fontSize={14}
                  fontFamily={fonts.medium}
                  color={NOTE}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.switchSlot}>
          <CustomSwitch
            value={value}
            setValue={onChange}
            bgColor={GOLD}
            disabled={disabled}
          />
        </View>
      </View>
    );
  }
  return onChange ? (
    content
  ) : (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={disabled}>
      {content}
    </TouchableOpacity>
  );
};

/** ACTIONS / SHARED MEDIA tile: white 8% + blur, r8 */
const Tile = ({ icon, color, style, onPress }) => {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.tile, style]}
    >
      <Blur
        blurType={isDark ? "dark" : "xlight"}
        blurAmount={32}
        borderRadius={8}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.tileTint,
          !isDark && { backgroundColor: "rgba(18, 18, 18, 0.08)" },
        ]}
      />
      <Icons
        family="MaterialSymbolsRoundedFilled"
        name={icon}
        size={24}
        color={color || colors.text}
      />
    </TouchableOpacity>
  );
};

const ConversationSettings = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { colors, isDark, themeMode, toggleTheme } = useTheme();
  const { userData } = useSelector((state) => state.users);
  const otherUser = route?.params?.otherUser || null;
  const otherUserId = route?.params?.recipientId || otherUser?._id;
  const isGroup = !!route?.params?.isGroup && !!route?.params?.conversationId;
  const groupType = route?.params?.groupType === "circle" ? "circle" : "group";
  // the API takes the other user (1 on 1) or the Group / Circle id
  const settingsId = isGroup ? route.params.conversationId : otherUserId;

  const [data, setData] = useState(null); // null → no chat yet
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [callSheet, setCallSheet] = useState(null); // {top,left} when open
  const callRef = useRef(null);
  // Figma Remove-Friend / Successfully-Removed-Friend modals
  const [confirm, setConfirm] = useState(null); // { ...ConfirmSheet props }
  const [busy, setBusy] = useState(false);
  const closeConfirm = () => setConfirm(null);
  const run = (fn, done) => async () => {
    setBusy(true);
    try {
      await fn();
      setConfirm(done || null);
    } catch (e) {
      closeConfirm();
      ToastMessage(e?.message || "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  };
  const openCalls = () =>
    callRef.current?.measureInWindow((x, y, w, h) =>
      setCallSheet({ top: y + h + 4, left: x }),
    );

  // (re)load on focus: the Disappearing / Theme screens change settings too
  useEffect(() => {
    if (!settingsId || !isFocused) return;
    (async () => {
      try {
        const [res, status] = await Promise.all([
          getConversationSettings(settingsId),
          isGroup
            ? Promise.resolve(null)
            : get(`relationships/status/${otherUserId}`),
        ]);
        if (res?.data?.success) setData(res.data.data);
        const st = status?.data?.data || status?.data;
        setBlocked(!!st?.isBlocked);
      } catch (e) {
        console.log("Conversation settings load failed:", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, [settingsId, isFocused]);

  // optimistic update; roll back if the server refuses
  const save = async (patchBody, optimistic) => {
    if (!data) {
      ToastMessage("Send a message first to change chat settings", "error");
      return;
    }
    const before = data;
    setData((d) => optimistic(d));
    try {
      const res = await updateConversationSettings(settingsId, patchBody);
      if (res?.data?.success && res.data.data) setData(res.data.data);
      else throw new Error("failed");
    } catch (e) {
      setData(before);
      ToastMessage("Could not update this setting", "error");
    }
  };

  const setFlag = (key, value) =>
    save({ [key]: value }, (d) => ({
      ...d,
      [key === "favorite" ? "isFavorite" : "isBusiness"]: value,
    }));

  const setSetting = (key, value) =>
    save({ settings: { [key]: value } }, (d) => ({
      ...d,
      settings: { ...(d?.settings || {}), [key]: value },
    }));

  const s = data?.settings || {};
  const media = data?.sharedMedia || {};
  const name = isGroup
    ? route?.params?.recipientName ||
      data?.name ||
      (groupType === "circle" ? "Circle" : "Group")
    : `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim() ||
      "Display Name";
  const firstName = otherUser?.firstName || "this user";
  const picture = isGroup
    ? route?.params?.groupPicture || data?.picture
    : otherUser?.profile?.avatar;
  const industry = Array.isArray(otherUser?.niche) ? otherUser.niche : [];
  const comingSoon = (what) => () => ToastMessage(`${what} is coming soon`);

  const personCard = otherUser
    ? {
        name: name,
        subtitle: otherUser?.username
          ? `@${otherUser.username}`
          : otherUser?.email,
        picture: otherUser?.profile?.avatar,
      }
    : undefined;

  const block = () =>
    setConfirm({
      icon: "block",
      title: "Block This User",
      message: "They will not be able to match with you or send you messages.",
      person: personCard,
      confirmLabel: "Yes, Block User",
      onConfirm: run(
        async () => {
          await post(`relationships/block/${otherUserId}`);
          setBlocked(true);
        },
        {
          success: true,
          icon: "check_circle",
          title: "Successfully Blocked",
          message: `You’ve blocked ${firstName}`,
        },
      ),
    });

  // A match = you liked (followed) each other; removing it unfollows them.
  const removeMatch = () =>
    setConfirm({
      icon: "delete",
      title: "Remove This Friend",
      message: "Are you sure you want to remove this friend?",
      person: personCard,
      confirmLabel: "Yes, Remove Friend",
      onConfirm: run(
        async () => {
          await del(`relationships/unfollow/${otherUserId}`);
        },
        {
          success: true,
          icon: "check_circle",
          title: "Successful Removed",
          message: "You’ve successfully removed a Friend",
        },
      ),
    });

  const leave = () =>
    setConfirm({
      icon: "logout",
      title: `Leave This ${groupType === "circle" ? "Circle" : "Group"}`,
      message: `You will no longer receive messages from ${name}.`,
      confirmLabel: `Yes, Leave ${groupType === "circle" ? "Circle" : "Group"}`,
      onConfirm: run(async () => {
        const res = await leaveGroup(route.params.conversationId);
        if (!res?.data?.success)
          throw new Error(
            res?.data?.error || `Could not leave this ${groupType}`,
          );
        closeConfirm();
        navigation.popTo("Chat"); // back to the existing Inbox (v7 navigate would push a new one)
      }),
    });

  const deleteAll = () => {
    if (!data?.conversationId) {
      ToastMessage("There are no messages to delete yet", "error");
      return;
    }
    setConfirm({
      icon: "delete",
      title: "Delete All Messages",
      message: "They will be removed from this chat for you only.",
      confirmLabel: "Yes, Delete Messages",
      onConfirm: run(
        async () => {
          const res = await deleteAllMessages(data.conversationId);
          if (!res?.data?.success)
            throw new Error(
              res?.data?.error || "Could not delete the messages",
            );
        },
        {
          success: true,
          icon: "check_circle",
          title: "Messages Deleted",
          message: "All messages were removed for you",
        },
      ),
    });
  };

  // "Secure with PIN code" uses the same PIN as the profile selector: the
  // chat asks for it on open (InboxScreen) once this is on.
  const setPinLock = (v) => setSetting("pinLock", v);

  const tint64 = isDark
    ? "rgba(255, 255, 255, 0.64)"
    : "rgba(18, 18, 18, 0.64)";
  const white = isDark ? "#FFFFFF" : colors.text;
  const qrValue = isGroup
    ? `psc://${groupType}/${route.params.conversationId}`
    : `psc://user/${otherUserId}`;

  // Figma banner top overlay (pad 52/12/12/12): back · name · "Manage your
  // conversation". Pinned like every other PSC header — it stays while the
  // page scrolls; once the banner has scrolled away it turns solid #121212.
  const scrollY = useRef(new Animated.Value(0)).current;
  const solid = scrollY.interpolate({
    inputRange: [0, BANNER - 140, BANNER - 100],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });
  const fixedHeader = (
    <View
      style={[styles.fixedHeader, { paddingTop: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <LinearGradient
        pointerEvents="none"
        colors={["#121212", "rgba(18, 18, 18, 0)"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? "#121212" : colors.background,
            opacity: solid,
          },
        ]}
      />
      <View style={styles.titleRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Icons
            family="MaterialSymbolsRounded"
            name="chevron_left"
            size={22}
            color="rgba(255, 255, 255, 0.64)"
          />
        </TouchableOpacity>
        <CustomText
          label={name}
          fontSize={24}
          fontFamily={fonts.semiBold}
          letterSpacing={-0.72}
          color={isDark ? "#FFFFFF" : colors.text}
          numberOfLines={1}
          containerStyle={styles.shrink}
        />
      </View>
      <View style={styles.subtitle}>
        <Icons
          family="MaterialSymbolsRounded"
          name="tune"
          size={16}
          color="rgba(255, 255, 255, 0.64)"
        />
        <CustomText
          label="Manage your conversation"
          fontSize={14}
          fontFamily={fonts.medium}
          letterSpacing={-0.42}
          color="rgba(255, 255, 255, 0.64)"
        />
      </View>
    </View>
  );

  const banner = (
    <View style={styles.banner}>
      {picture ? (
        <FastImage
          source={{ uri: picture }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: otherUser?.profile?.profileColor || "#262626" },
          ]}
        />
      )}
      {/* bottom overlay: transparent → page colour, QR 48 centred */}
      <View style={styles.bannerBottom}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(18, 18, 18, 0)",
            isDark ? "#121212" : colors.background,
          ]}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            isGroup
              ? ToastMessage("Share this link to invite people", "success")
              : navigation.navigate("QrScreen", { user: otherUser })
          }
          style={styles.qr}
        >
          <QRCode
            value={qrValue}
            size={32}
            color="#121212"
            backgroundColor="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const content = (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={styles.content}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true },
      )}
    >
      {banner}

      <View style={styles.sections}>
        {industry.length > 0 && (
          <Section title="INDUSTRY" count={industry.length}>
            <View style={styles.chips}>
              {industry.map((t) => (
                <View
                  key={t}
                  style={[
                    styles.chip,
                    { backgroundColor: isDark ? "#313131" : colors.surfaceAlt },
                  ]}
                >
                  <CustomText
                    label={t}
                    fontSize={14}
                    fontFamily={fonts.medium}
                    color={colors.text}
                  />
                </View>
              ))}
            </View>
          </Section>
        )}

        {!isGroup && (
          <Section title="ACTIONS" count={3}>
            <View style={styles.actions}>
              <View ref={callRef} collapsable={false} style={styles.action}>
                <Tile
                  icon="call"
                  color={tint64}
                  style={styles.actionInner}
                  onPress={openCalls}
                />
              </View>
              <Tile
                icon="ios_share"
                color={tint64}
                style={styles.action}
                onPress={() =>
                  navigation.navigate("QrScreen", { user: otherUser })
                }
              />
              <Tile
                icon="block"
                color={RED}
                style={styles.action}
                onPress={blocked ? undefined : block}
              />
            </View>
          </Section>
        )}

        <Section title="SHARED MEDIA" count={loaded ? media.total || 0 : ""}>
          <View style={styles.tiles}>
            {["image", "videocam", "music_note", "link"].map((icon) => (
              <Tile key={icon} icon={icon} />
            ))}
          </View>
        </Section>

        <Section title="COMMUNICATION">
          <View style={styles.rows}>
            <Row
              icon="star"
              label="Mark as favorite"
              value={!!data?.isFavorite}
              onChange={(v) => setFlag("favorite", v)}
            />
            <Divider />
            <Row
              icon="work"
              label="Mark as business"
              value={!!data?.isBusiness}
              onChange={(v) => setFlag("business", v)}
            />
            <Divider />
            <Row
              icon="label"
              label="Add a label"
              onPress={comingSoon("Labels")}
            />
            <Divider />
            <Row
              icon="notifications_active"
              label="Notify only @mentions"
              value={false}
              onChange={comingSoon("Mention notifications")}
            />
            <Divider />
            <Row
              icon="schedule"
              label="Scheduled messages"
              onPress={comingSoon("Scheduled messages")}
            />
            <Divider />
            <Row
              icon="library_music"
              label="Custom sounds"
              onPress={comingSoon("Custom sounds")}
            />
            <Divider />
            <Row
              icon="mic"
              label="Allow voice messages"
              value={false}
              onChange={comingSoon("Voice message settings")}
            />
            <Divider />
            <Row
              icon="download_for_offline"
              label="Save media automatically"
              value={false}
              onChange={comingSoon("Automatic saving")}
            />
          </View>
        </Section>

        <Section title="PRIVACY & SECURITY">
          <View style={styles.rows}>
            <Row
              icon="link_off"
              label="Block sharing links"
              value={!!s.blockLinks}
              onChange={(v) => setSetting("blockLinks", v)}
            />
            <Divider />
            <Row
              icon="hide_image"
              label="Block sharing media"
              value={!!s.blockMedia}
              onChange={(v) => setSetting("blockMedia", v)}
            />
            <Divider />
            <Row
              icon="content_paste_off"
              label="Block copying"
              value={!!s.blockCopying}
              onChange={(v) => setSetting("blockCopying", v)}
            />
            <Divider />
            <Row
              icon="screenshot"
              label="Block screenshots"
              value={!!s.blockScreenshots}
              onChange={(v) => setSetting("blockScreenshots", v)}
            />
            <Divider />
            <Row
              icon="person_off"
              label="Don’t allow sharing contact"
              value={!!s.blockContacts}
              onChange={(v) => setSetting("blockContacts", v)}
            />
            <Divider />
            <Row
              icon="remove_done"
              label="Disable Read Status"
              note="Only with Silver"
              value={!!s.disableReadStatus}
              onChange={(v) => setSetting("disableReadStatus", v)}
            />
            <Divider />
            <Row
              icon="visibility_off"
              label="Hide last seen"
              note="Only with Silver"
              value={!!s.hideLastSeen}
              onChange={(v) => setSetting("hideLastSeen", v)}
            />
            <Divider />
            <Row
              icon="forward"
              label="Don’t allow forwarding"
              value={!!s.blockForwarding}
              onChange={(v) => setSetting("blockForwarding", v)}
            />
            <Divider />
            <Row
              icon="timelapse"
              label="Disappearing messages"
              note={
                s.disappearing
                  ? `Disappears ${disappearLabel(true, s.disappearAfter)
                      .toLowerCase()
                      .replace("on read", "after being read")}`
                  : "Disappears after being read"
              }
              value={!!s.disappearing}
              onChange={(v) => setSetting("disappearing", v)}
              onPress={() =>
                data
                  ? navigation.navigate("DisappearingMessages", {
                      settingsId,
                      enabled: !!s.disappearing,
                      value: s.disappearAfter || 0,
                    })
                  : ToastMessage(
                      "Send a message first to change chat settings",
                      "error",
                    )
              }
            />
            <Divider />
            <Row
              icon="password"
              label="Secure with PIN code"
              value={!!s.pinLock}
              onChange={setPinLock}
            />
            <Divider />
            <Row
              icon="delete"
              iconColor={RED}
              label="Delete All Messages"
              onPress={deleteAll}
            />
          </View>
        </Section>

        <Section title="APPEARANCE">
          <View style={styles.rows}>
            <Row
              icon="dark_mode"
              label="Dark Mode"
              value={themeMode === "dark"}
              onChange={() => toggleTheme()}
            />
            <Divider />
            <Row
              icon="brush"
              iconSize={32}
              label="Theme"
              note="Only with Silver"
              onPress={() =>
                data
                  ? navigation.navigate("ChatTheme", {
                      settingsId,
                      value: s.theme || "",
                    })
                  : ToastMessage(
                      "Send a message first to change chat settings",
                      "error",
                    )
              }
            />
          </View>
        </Section>

        {/* Figma: 24 (not 16) under this title → 34 from the title cap */}
        <Section title="ACCOUNT ACTIONS" gap={34 - 14.67}>
          <View style={styles.rows}>
            {isGroup ? (
              <Row
                icon="logout"
                iconColor={RED}
                label={`Leave this ${groupType}`}
                desc={`You can ${
                  groupType === "circle" ? "join" : "be invited"
                } again later`}
                onPress={leave}
              />
            ) : (
              <>
                <Row
                  icon="remove"
                  label="Remove match"
                  desc="Will still be able to match and send messages"
                  onPress={removeMatch}
                />
                <Divider />
                <Row
                  icon="block"
                  label="Block this user"
                  desc="Will not be able to match or send messages"
                  value={blocked}
                  disabled={blocked}
                  onChange={(v) => v && block()}
                />
                <Divider />
                <Row
                  icon="report"
                  label="Report this user"
                  desc="Will be reported not able to match nor send messages"
                  onPress={() =>
                    navigation.navigate("ReportChat", {
                      user: otherUser,
                      conversationId: data?.conversationId,
                    })
                  }
                />
              </>
            )}
          </View>
        </Section>
      </View>

      <CustomText
        textAlign="center"
        fontSize={12}
        letterSpacing={-0.12}
        color={isDark ? "rgba(255, 255, 255, 0.48)" : "rgba(18, 18, 18, 0.48)"}
      >
        {"We are constantly working on improving "}
        <Text style={{ fontFamily: fonts.medium, color: white }}>PSC</Text>
        {"’s experience for all of our users."}
      </CustomText>

      <ConfirmSheet
        visible={!!confirm}
        {...(confirm || {})}
        loading={busy}
        onDismiss={closeConfirm}
      />
      <CallOptionsSheet
        visible={!!callSheet}
        position={callSheet || undefined}
        onClose={() => setCallSheet(null)}
        onVoice={comingSoon("Voice calling")}
        onVideo={comingSoon("Video calling")}
      />
    </Animated.ScrollView>
  );

  return isDark ? (
    <LinearGradient colors={["#141416", "#000000"]} style={styles.screen}>
      {content}
      {fixedHeader}
    </LinearGradient>
  ) : (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {content}
      {fixedHeader}
    </View>
  );
};

export default ConversationSettings;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingBottom: 64,
    gap: 32,
  },
  banner: {
    height: BANNER,
    marginHorizontal: -0, // full bleed
    overflow: "hidden",
    justifyContent: "flex-end",
    // content starts 16 below the banner (Figma 391); the first section title
    // cap sits 4.93 into its RN box
    marginBottom: 16 - 4.93 - 32,
  },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  shrink: { flexShrink: 1 },
  // Figma row 16 tall (icon); the Medium 14 RN box is 19.6 → −1.8 each side
  subtitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginVertical: -1.8,
  },
  bannerBottom: {
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  qr: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  // Figma 40 from the previous block to the next title's cap (cap 4.93 in RN)
  sections: {
    paddingHorizontal: 12,
    gap: 40 - 4.93,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    height: 30,
    borderRadius: 16,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  action: {
    flex: 1,
    height: 48,
  },
  actionInner: {
    width: "100%",
    height: 48,
  },
  tiles: {
    flexDirection: "row",
    gap: 8,
  },
  tile: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  tileTint: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  rows: {
    gap: 16,
  },
  divider: {
    height: 1,
    borderRadius: 100,
  },
  row: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowText: {
    flex: 1,
  },
  // two-line rows: Figma 31 (note) / 26 (desc) tall; RN boxes are 40.3 / 35.1
  rowTextNote: {
    marginVertical: -4.65,
  },
  rowTextDesc: {
    marginVertical: -4.55,
  },
  switchSlot: {
    height: 28,
    justifyContent: "center",
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: NOTE_PULL,
  },
});
