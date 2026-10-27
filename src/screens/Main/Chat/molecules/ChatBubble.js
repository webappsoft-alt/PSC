import moment from "moment";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Clipboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Video from "react-native-video";
import fonts from "../../../../assets/fonts";
import Blur from "../../../../components/Blur";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";
import { translateText } from "../../../../utils/translate";
import MeetingCard from "../meeting/MeetingCard";
import AudioPlayer from "./AudioPlayer";

/**
 * Figma Chat page "Inbox_General-Default" (2212:7108) message (same parts
 * as "Conversation" 2352:4801; received bubble white 12%, actions on every
 * received message, "Translate" #007BFF, meta lock icon):
 *  received — name chip 24 (r100 white 4%, pad 6/12/8/6 … 12 dot + Regular
 *  12 −2%) · 8 · bubble ≤280 (pad 16/12, r12, #FFFFFF, Medium 14 −2% lh125%
 *  #121212) · 8 · actions: chips 25 (r100 white 4%, pad 8/12, 12 icon · 4 ·
 *  Regular 12 −2%) Like / Reply / Copy / [translate] … 25 circle "seen" 14;
 *  translated: "Translate" Medium 12 #4347FF · "translated by" Regular 10
 *  @48% · "Google" Regular 12 @48%.
 *  sent — bubble ≤280 (pad 16/12, r12, white 4% + blur, white text), picture
 *  180 (pad 6, r12 white 4%, image 168 r6) · 10 · meta: done_all 12 ·
 *  "04:45 pm - Mar 12, 2025" Regular 12 −2% @48% · 1×12 white 16% · eye 12.
 */
const MAX_W = 280;

const ChatBubble = ({
  isSender,
  item,
  onReply,
  onReact,
  repliedToMessage,
  userId,
  onMeetingStatus,
  allowCopy = true, // conversation settings › "Block copying"
  themeColor, // conversation settings › Theme (chat skin) for my bubbles
  senderName, // received: chip above the first message of a run
  senderColor,
  showActions = true, // received: Like / Reply / Copy row
  onSelect,
  onReport, // received: the 25 circle (report this message)
  onVoiceReply, // received: record_voice_over chip — reply with a voice note
  senderSelfName, // my first name (meta above my meeting card)
  meetingWith, // { name, picture, color } — who the meeting is with
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const isLiked = item?.reactions?.["❤️"]?.[userId];
  const translateX = useRef(new Animated.Value(0)).current;
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);
  const isMedia = ["image", "file", "video"].includes(item?.type);
  const isMeeting = item?.type === "meeting";
  const when = moment(item?.createdAt || item?.timestamp);

  const handlePanGesture = (event) => {
    const { translationX } = event.nativeEvent;
    if (translationX > 50) {
      onReply && onReply(item);
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    } else if (translationX > 0) {
      translateX.setValue(translationX);
    }
  };
  const handlePanStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    }
  };

  const copy = () => {
    if (item?.content) {
      Clipboard.setString(item.content);
      ToastMessage("Message copied to clipboard", "success");
    }
  };

  const translate = async () => {
    if (translated) {
      setTranslated(null);
      return;
    }
    if (!item?.content || translating) return;
    setTranslating(true);
    try {
      const t = await translateText(item.content);
      if (!t) throw new Error();
      setTranslated(t);
    } catch (e) {
      ToastMessage("Could not translate this message", "error");
    } finally {
      setTranslating(false);
    }
  };

  const textColor = isSender && themeColor ? "#FFFFFF" : colors.text;
  const bubbleBg = isSender ? themeColor || tint(0.04) : tint(0.12);

  const media = isMedia && (item.attachment?.url || item.attachment?.uri) && (
    <View style={[styles.mediaBox, { backgroundColor: tint(0.04) }]}>
      {item?.type === "image" ? (
        <ImageFast isView source={{ uri: item.attachment.url || item.attachment.uri }} style={styles.media} />
      ) : (
        <Video
          source={{ uri: item.attachment.url || item.attachment.uri }}
          style={styles.media}
          resizeMode="cover"
          controls
          muted
          playInBackground={false}
          playWhenInactive={false}
        />
      )}
      {item.status === "sending" && (
        <View style={styles.mediaLoading}>
          <ActivityIndicator color="#FFFFFF" size="small" />
        </View>
      )}
    </View>
  );

  // Figma 2212:6628: above a sent meeting card — done_all 12 · 1×8 #828186 ·
  // "TRAVIS   3:02 PM" Medium 10 #6B6B6B, right aligned, 8 above the card
  const meetingMeta = isMeeting && isSender && (
    <View style={styles.meetingMeta}>
      <Icons
        family="MaterialSymbolsRounded"
        name={item?.deliveryStatus?.delivered || item?.deliveryStatus?.read ? "done_all" : "done"}
        size={12}
        color={item?.deliveryStatus?.read ? "#A19375" : tint(0.48)}
      />
      <View style={styles.meetingSep} />
      <CustomText
        label={`${String(senderSelfName || "You").toUpperCase()}   ${when.format("h:mm A")}`}
        fontSize={10}
        fontFamily={fonts.medium}
        color="#6B6B6B"
      />
    </View>
  );

  const body = isMeeting ? (
    <View style={[styles.meetingWrap, !isSender && { alignItems: "flex-start" }]}>
      {meetingMeta}
      <MeetingCard item={item} isSender={isSender} onStatusChange={onMeetingStatus} withWho={meetingWith} />
    </View>
  ) : (
    <>
      {media}
      {item?.type === "voice" && (
        <AudioPlayer
          audioUri={item.attachment?.url}
          duration={item.attachment?.duration || 0}
          isPending={item.status === "sending"}
          isSender={isSender}
        />
      )}
      {(item?.type === "text" || (item?.type !== "voice" && !!item?.content)) && (
        <View style={[styles.bubble, { backgroundColor: bubbleBg }]}>
          {isSender && !themeColor && <Blur blurType={isDark ? "dark" : "xlight"} blurAmount={32} borderRadius={12} />}
          {repliedToMessage && (
            <View style={[styles.quote, { borderLeftColor: isSender ? "#A19375" : "#121212" }]}>
              <CustomText label={repliedToMessage.senderName || "User"} fontSize={12} fontFamily={fonts.medium} color={isSender ? "#A19375" : "#121212"} />
              <CustomText label={repliedToMessage.content || "📷 Media"} fontSize={12} color={isSender ? tint(0.64) : "rgba(18, 18, 18, 0.64)"} numberOfLines={2} />
            </View>
          )}
          <CustomText
            label={translated || item?.content}
            fontSize={14}
            fontFamily={fonts.medium}
            letterSpacing={-0.28}
            color={textColor}
          />
          {item?.reactions && Object.keys(item.reactions).length > 0 && (
            <View style={styles.reactions}>
              {Object.keys(item.reactions).map((emoji) => (
                <View key={emoji} style={[styles.reaction, { backgroundColor: tint(0.08) }]}>
                  <CustomText label={emoji} fontSize={10} />
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </>
  );

  const chip = (icon, label, onPress, active) => (
    <TouchableOpacity key={label || icon} activeOpacity={0.7} onPress={onPress} style={[styles.chip, { backgroundColor: tint(0.04) }, !label && styles.chipIcon]}>
      <Icons family={active ? "MaterialSymbolsRoundedFilled" : "MaterialSymbolsRounded"} name={icon} size={12} color={active ? COLORS.red1 : colors.text} />
      {!!label && <CustomText label={label} fontSize={12} letterSpacing={-0.24} color={colors.text} />}
    </TouchableOpacity>
  );

  return (
    <PanGestureHandler onGestureEvent={handlePanGesture} onHandlerStateChange={handlePanStateChange} activeOffsetX={[-20, 20]}>
      <Animated.View style={[styles.wrap, isSender ? styles.sent : styles.received, { transform: [{ translateX }] }]}>
        {!isSender && !!senderName && (
          <View style={[styles.nameChip, { backgroundColor: tint(0.04) }]}>
            <View style={[styles.dot, { backgroundColor: senderColor || "#397050" }]} />
            <CustomText label={senderName} fontSize={12} letterSpacing={-0.24} color={colors.text} />
          </View>
        )}

        <TouchableOpacity activeOpacity={0.9} onPress={() => onSelect?.(item)} disabled={isMeeting} style={isSender ? styles.sentGroup : styles.receivedGroup}>
          {body}
        </TouchableOpacity>

        {isSender && !isMeeting && (
          <View style={styles.meta}>
            {item.status === "sending" ? (
              <Icons family="MaterialSymbolsRounded" name="schedule" size={12} color={tint(0.48)} />
            ) : (
              <Icons
                family="MaterialSymbolsRounded"
                name={item?.deliveryStatus?.delivered || item?.deliveryStatus?.read ? "done_all" : "done"}
                size={12}
                color={item?.deliveryStatus?.read ? "#A19375" : tint(0.48)}
              />
            )}
            <CustomText label={`${when.format("hh:mm a")} - ${when.format("MMM D, YYYY")}`} fontSize={12} letterSpacing={-0.24} color={tint(0.48)} />
            <View style={[styles.sep, { backgroundColor: tint(0.16) }]} />
            <Icons family="MaterialSymbolsRounded" name="lock" size={12} color={tint(0.48)} />
          </View>
        )}

        {!isSender && !isMeeting && showActions && (
          <View style={styles.actions}>
            <View style={styles.chips}>
              {chip("favorite", "Like", () => onReact && onReact(item._id, "❤️"), isLiked)}
              {chip("reply", "Reply", () => onReply && onReply(item))}
              {allowCopy && item?.type !== "voice" && chip("content_copy", "Copy", copy)}
              {chip("record_voice_over", "", () => (onVoiceReply ? onVoiceReply(item) : onReply?.(item)))}
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => onReport?.(item)} style={[styles.seen, { backgroundColor: tint(0.04) }]}>
              <Icons family="MaterialSymbolsRounded" name="error" size={14} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {!isSender && item?.type === "text" && (
          <TouchableOpacity activeOpacity={0.7} onPress={translate} disabled={translating} style={styles.translatedRow}>
            <CustomText label={translated ? "Show original" : "Translate"} fontSize={12} fontFamily={fonts.medium} letterSpacing={-0.24} color="#007BFF" />
            {!!translated && <CustomText label="translated by" fontSize={10} letterSpacing={-0.2} color={tint(0.48)} />}
            {!!translated && <CustomText label="Google" fontSize={12} letterSpacing={-0.24} color={tint(0.48)} />}
            {translating && <ActivityIndicator size="small" color={tint(0.48)} />}
          </TouchableOpacity>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};

export default ChatBubble;

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    wrap: {
      marginBottom: 20, // Figma: messages 20 apart
    },
    sent: {
      alignItems: "flex-end",
    },
    received: {
      alignItems: "flex-start",
    },
    sentGroup: {
      alignItems: "flex-end",
      gap: 10,
    },
    receivedGroup: {
      alignItems: "flex-start",
      gap: 8,
    },
    nameChip: {
      height: 24,
      borderRadius: 100,
      paddingLeft: 6,
      paddingRight: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 8,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 100,
    },
    bubble: {
      maxWidth: MAX_W,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 12,
      overflow: "hidden",
    },
    quote: {
      borderLeftWidth: 2,
      paddingLeft: 8,
      marginBottom: 8,
      gap: 2,
    },
    mediaBox: {
      width: 180,
      height: 180,
      borderRadius: 12,
      padding: 6,
      overflow: "hidden",
    },
    media: {
      width: 168,
      height: 168,
      borderRadius: 6,
      overflow: "hidden",
    },
    mediaLoading: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 10,
    },
    sep: {
      width: 1,
      height: 12,
    },
    actions: {
      width: MAX_W,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 5,
      marginTop: 8,
    },
    chips: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexShrink: 1,
    },
    chip: {
      height: 25,
      borderRadius: 100,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    chipIcon: {
      paddingHorizontal: 8,
    },
    seen: {
      width: 25,
      height: 25,
      borderRadius: 100,
      alignItems: "center",
      justifyContent: "center",
    },
    translatedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
    },
    meetingWrap: {
      alignItems: "flex-end",
      gap: 8,
    },
    // Figma: 12 tall row, 8 above the card (text/icon boxes may overflow)
    meetingMeta: {
      height: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      overflow: "visible",
    },
    meetingSep: {
      width: 1,
      height: 8,
      borderRadius: 100,
      backgroundColor: "#828186",
    },
    reactions: {
      flexDirection: "row",
      gap: 4,
      marginTop: 6,
    },
    reaction: {
      borderRadius: 100,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
  });
