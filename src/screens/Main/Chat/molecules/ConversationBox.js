import { useNavigation } from "@react-navigation/native";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";
import StatusAvatar from "./StatusAvatar";
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
  const groupMembers = item?.isGroup || item?.type === "group"
    ? (item?.participants || []).filter(
        (p) => p?._id && p._id !== userData?._id,
      )
    : [];
  const isCircle = item?.type === "circle";
  const isGroup = !isCircle && (item?.type === "group" || groupMembers.length > 1);
  const title =
    item?.name ||
    (isGroup
      ? groupMembers
          .map((p) => p?.firstName)
          .filter(Boolean)
          .join(", ")
      : `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim());
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

  // the group's own photo (Create a Group image), else its first letter
  const renderGroupPicture = (style) =>
    item?.picture ? (
      <ImageFast source={{ uri: item.picture }} style={style} resizeMode="cover" />
    ) : (
      <View style={[style, styles.initials, { backgroundColor: tint(0.08) }]}>
        <CustomText
          label={(title?.[0] || "?").toUpperCase()}
          fontSize={10}
          fontFamily={fonts.semiBold}
          color={colors.text}
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
      : item?.lastMessage?.type == "meeting"
      ? "📅 Meeting proposal"
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
        isGroup || isCircle
          ? navigation.navigate("InboxScreen", {
              conversationId: item?._id,
              isGroup: true,
              groupType: isCircle ? "circle" : "group",
              recipientName: title,
              groupPicture: item?.picture,
              memberCount: item?.memberCount,
            })
          : navigation.navigate("InboxScreen", {
              recipientId: otherUser?._id,
              recipientName: title,
              otherUser: otherUser
                ? { ...otherUser, status: item?.status, isOnline: item?.isOnline }
                : otherUser,
            })
      }
    >
      {isCircle ? (
        // Figma Main-Chat-Circles: square 48, radius 12
        item?.picture ? (
          <ImageFast source={{ uri: item.picture }} style={styles.circleAvatar} />
        ) : (
          <View style={[styles.circleAvatar, styles.initials, { backgroundColor: tint(0.08) }]}>
            <CustomText
              label={(title?.[0] || "?").toUpperCase()}
              fontSize={16}
              fontFamily={fonts.semiBold}
              color={colors.text}
            />
          </View>
        )
      ) : isGroup ? (
        // 2×2: me · friend 1 / friend 2 · group photo. With 1 friend the
        // group photo fills the whole bottom half.
        <View style={styles.groupGrid}>
          <View style={[styles.groupCell, styles.groupCell0]}>
            {renderAvatar(userData, styles.groupImage, 10)}
          </View>
          <View style={[styles.groupCell, styles.groupCell1]}>
            {renderAvatar(groupMembers[0], styles.groupImage, 10)}
          </View>
          {groupMembers.length > 1 ? (
            <>
              <View style={[styles.groupCell, styles.groupCell2]}>
                {renderAvatar(groupMembers[1], styles.groupImage, 10)}
              </View>
              <View style={[styles.groupCell, styles.groupCell3]}>
                {renderGroupPicture(styles.groupImage)}
              </View>
            </>
          ) : (
            <View style={[styles.groupCell, styles.groupHalf, styles.groupCell2, styles.groupCell3]}>
              {renderGroupPicture(styles.groupHalfImage)}
            </View>
          )}
        </View>
      ) : (
        <StatusAvatar
          user={otherUser}
          size={48}
          ring
          status={item?.status || (item?.isOnline ? "online" : "offline")}
          isBirthday={!!item?.isBirthday}
        />
      )}

      <View style={styles.textBox}>
        <View style={styles.nameRow}>
          {/* client: favorite (star) stands before the briefcase, same color & size */}
          {item?.isFavorite && (
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="star"
              size={12}
              color={GOLD}
            />
          )}
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
    circleAvatar: {
      width: 48,
      height: 48,
      borderRadius: 12,
    },
    groupImage: {
      width: 24,
      height: 24,
    },
    groupHalf: {
      width: 48,
    },
    groupHalfImage: {
      width: 48,
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
