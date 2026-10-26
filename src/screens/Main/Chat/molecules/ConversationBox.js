import { useNavigation } from "@react-navigation/native";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

/**
 * Inbox row — Figma `Main-Chat` (7815:3751):
 * 375×72 · padding 12/16 · gap 12 · centred.
 * Avatar 48: ring 3 (#1ED760 online, white 16% offline) around a 42 photo;
 * group = 2×2 grid of 24 tiles, outer corners 12.
 * Name row: [briefcase 12 #A19375 + gap 2 when business] Medium 16 −0.5.
 * Preview Medium 14 −0.5 @48%. Unread badge 24 #EE1045, SemiBold 12.
 */
const GOLD = "#A19375";
const ONLINE = "#1ED760";

const ConversationBox = ({ item, onLongPress }) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const { userData } = useSelector((state) => state.users);
  const otherUser = item?.otherUser;
  // Figma: name 100%, preview 48%, on #121212 (mirrored for light mode)
  const tint = (o) =>
    isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`;

  // Group conversation (backend flags participants > 2): 2×2 avatar grid
  const groupMembers = item?.isGroup
    ? (item?.participants || []).filter(
        (p) => p?._id && p._id !== userData?._id,
      )
    : [];
  const isGroup = groupMembers.length > 1;
  const title = isGroup
    ? groupMembers
        .map((p) => p?.firstName)
        .filter(Boolean)
        .join(", ")
    : `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim();
  const unread = Number(item?.unreadCount) || 0;

  // PSC users keep their photo in profile.avatar (backend sets a default)
  const avatarUri = (user) => user?.profile?.avatar || user?.profilePicture;
  const initials = (user) =>
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() ||
    "?";
  // photo, or the user's initials on their profile colour — never a stock face
  const renderAvatar = (user, style, fontSize, key) =>
    avatarUri(user) ? (
      <ImageFast key={key} source={{ uri: avatarUri(user) }} style={style} />
    ) : (
      <View
        key={key}
        style={[
          style,
          styles.initials,
          { backgroundColor: user?.profile?.profileColor || tint(0.08) },
        ]}
      >
        <CustomText
          label={initials(user)}
          fontSize={fontSize}
          fontFamily={fonts.semiBold}
          color={COLORS.primaryColor}
        />
      </View>
    );

  const preview =
    item?.lastMessage?.type == "voice"
      ? "🎤 Voice Message"
      : item?.lastMessage?.type == "image"
      ? "📷 Image"
      : item?.lastMessage?.type == "file"
      ? "📹 Video"
      : item?.lastMessage?.content || "No messages yet · Say hi 👋";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      delayLongPress={350}
      onLongPress={
        // a matched person without a chat yet has nothing to pin / mark
        item?.noConversation || !onLongPress ? undefined : () => onLongPress(item)
      }
      onPress={() =>
        navigation.navigate("InboxScreen", {
          recipientId: otherUser?._id,
          recipientName: title,
          otherUser,
        })
      }
    >
      {isGroup ? (
        <View style={styles.groupGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.groupCell, styles[`groupCell${i}`]]}>
              {renderAvatar(
                groupMembers[i % groupMembers.length],
                styles.groupImage,
                10,
              )}
            </View>
          ))}
        </View>
      ) : (
        <View
          style={[
            styles.ring,
            { backgroundColor: item?.isOnline ? ONLINE : tint(0.16) },
          ]}
        >
          {renderAvatar(otherUser, styles.avatar, 15)}
        </View>
      )}

      <View style={styles.textBox}>
        <View style={styles.nameRow}>
          {item?.isBusiness && (
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="work"
              size={12}
              color={GOLD}
            />
          )}
          <CustomText
            fontSize={16}
            label={title}
            fontFamily={fonts.medium}
            letterSpacing={-0.5}
            color={colors.text}
            numberOfLines={1}
            containerStyle={styles.shrink}
          />
        </View>
        <CustomText
          fontSize={14}
          color={tint(0.48)}
          fontFamily={fonts.medium}
          letterSpacing={-0.5}
          numberOfLines={1}
          marginTop={1.4}
          label={preview}
        />
      </View>

      {unread > 0 && (
        <View style={styles.badge}>
          <CustomText
            label={unread > 99 ? "99+" : String(unread)}
            fontSize={12}
            letterSpacing={-0.5}
            numberOfLines={1}
            color={COLORS.white}
            fontFamily={fonts.semiBold}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ConversationBox;

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 72,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 12,
    },
    // Figma "Frame 1329": 48 circle, padding 3, photo 42
    ring: {
      width: 48,
      height: 48,
      borderRadius: 100,
      padding: 3,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 100,
    },
    initials: {
      alignItems: "center",
      justifyContent: "center",
    },
    // Group: 48×48 grid of four 24×24 tiles, outer corners rounded 12
    groupGrid: {
      width: 48,
      height: 48,
      flexDirection: "row",
      flexWrap: "wrap",
    },
    groupCell: {
      width: 24,
      height: 24,
      overflow: "hidden",
    },
    groupImage: {
      width: 24,
      height: 24,
    },
    groupCell0: { borderTopLeftRadius: 12 },
    groupCell1: { borderTopRightRadius: 12 },
    groupCell2: { borderBottomLeftRadius: 12 },
    groupCell3: { borderBottomRightRadius: 12 },
    textBox: {
      flex: 1,
    },
    // Figma "Frame 2085664190": briefcase 12 · gap 2 · name
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    shrink: {
      flexShrink: 1,
    },
    // Figma: 24 circle #EE1045, SemiBold 12 white
    badge: {
      minWidth: 24,
      height: 24,
      borderRadius: 100,
      paddingHorizontal: 4,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.red1,
    },
  });
