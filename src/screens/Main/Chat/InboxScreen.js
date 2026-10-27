import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { useSelector } from "react-redux";
import { Images } from "../../../assets/images";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useSocket } from "../../../components/SocketProvider";
import UploadImageCustom from "../../../components/UploadImageCustom";
import { getMessages } from "../../../services/ChatService";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { uploadAndGetUrl, uploadFileGetUrl } from "../../../utils/constants";
import {
  hasProfilePin,
  isConversationUnlocked,
} from "../../../utils/profileLock";
import ChatBubble from "./molecules/ChatBubble";
import ChatBubbleSkeleton from "./molecules/ChatBubbleSkeleton";
import ChatFooter from "./molecules/ChatFooter";
import ChatHeader from "./molecules/ChatHeader";
import GifPreviewSheet from "./molecules/GifPreviewSheet";
import PhotoSharingPreview from "./molecules/PhotoSharingPreview";
import { openCamera, openPicker } from "react-native-image-crop-picker";
import moment from "moment";
import AnimatedListItem from "../../../utils/AnimatedListItem";
import { useTheme } from "../../../contexts/ThemeContext";

/**
 * Figma Inbox_General-Default (2212:7108) dividers.
 * Date: 0.5 lines #828186 (right 50%) · 8 · chip 20 (r100 white 4%, pad
 * 0/4/0/8, gap 4: "MAR 12, 2025" Regular 12 #828186 + expand_more 12) · 8.
 * Info ("You matched with … on …", "… is not available at the moment"):
 * full-width lines · 8 · Regular / Medium 12 #828186.
 */
const GRAY = "#828186";
const dayKey = (m) => moment(m?.createdAt || m?.timestamp).format("YYYY-MM-DD");
const dayLabel = (m) => {
  const d = moment(m?.createdAt || m?.timestamp);
  if (d.isSame(moment(), "day")) return "TODAY";
  if (d.isSame(moment().subtract(1, "day"), "day")) return "YESTERDAY";
  return d.format("MMM D, YYYY").toUpperCase();
};
const Lines = ({ children, bleed }) => (
  <View style={[dividerStyles.row, bleed && dividerStyles.bleed]}>
    <View style={[dividerStyles.line, dividerStyles.left]} />
    {children}
    <View style={[dividerStyles.line, dividerStyles.right]} />
  </View>
);
const DateDivider = ({ label }) => {
  const { isDark } = useTheme();
  return (
    <Lines>
      <View style={[dividerStyles.chip, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(18, 18, 18, 0.04)" }]}>
        <CustomText label={label} fontSize={12} color={GRAY} />
        <Icons family="MaterialSymbolsRounded" name="expand_more" size={12} color={GRAY} />
      </View>
    </Lines>
  );
};
const InfoDivider = ({ label, medium }) => (
  <Lines bleed>
    <CustomText label={label} fontSize={12} fontFamily={medium ? fonts.medium : fonts.regular} color={GRAY} textAlign="center" containerStyle={dividerStyles.text} />
  </Lines>
);
const dividerStyles = StyleSheet.create({
  row: {
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 4, // Messages pad 16 (bubbles sit at 12)
    marginBottom: 20,
  },
  bleed: {
    marginHorizontal: -12, // full screen width
  },
  line: {
    flex: 1,
    minWidth: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: GRAY,
  },
  left: {},
  right: {
    opacity: 0.5,
  },
  chip: {
    height: 20,
    borderRadius: 100,
    paddingLeft: 8,
    paddingRight: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  text: {
    flexShrink: 1,
  },
});

const InboxScreen = ({ route }) => {
  const navigation = useNavigation();
  const { socket } = useSocket();
  const flatListRef = useRef(null);
  const users = useSelector((state) => state.users);
  const userData = users?.userData;
  const userId = userData?._id;
  const isFocus = useIsFocused();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [replyMessage, setReplyMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [imageModal, setImageModal] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // Group / Circle welcome text, shown (centred) only to a new member
  const [welcome, setWelcome] = useState(null);
  // "Secure with PIN code": the chat stays hidden until the PIN is entered
  const [locked, setLocked] = useState(false);
  const [security, setSecurity] = useState({});
  const [themeColor, setThemeColor] = useState("");
  const [matchedAt, setMatchedAt] = useState(null);
  const [otherInfo, setOtherInfo] = useState(route?.params?.otherUser || null);
  const [recordSignal, setRecordSignal] = useState(0);
  const [scrolledUp, setScrolledUp] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null); // Photo-sharing-preview
  const [gifPreview, setGifPreview] = useState(null); // GIF-Preview
  const comingSoon = (what) => () => ToastMessage(`${what} is coming soon`);
  const pinShown = useRef(false);
  const cameraRef = useRef(null);

  const otherUser = route?.params?.otherUser || null;
  const recipientId = route?.params?.recipientId; // This is the user ID of the other person
  const recipientName = route?.params?.recipientName || "Chat";
  const conversationId = route?.params?.conversationId; // Optional, can be derived or passed
  // Group / Circle chat: messages go to the conversation, not one person
  const isGroup = !!route?.params?.isGroup && !!conversationId;
  const memberCount = route?.params?.memberCount;
  const target = isGroup
    ? { conversation_id: conversationId }
    : { participant_id: recipientId };
  const lockKey = conversationId || recipientId;

  // Same PIN as the profile selector (client). No PIN yet → define it first.
  const requirePin = () => {
    pinShown.current = true;
    navigation.navigate("PinVerification", {
      mode: hasProfilePin(users, userId) ? "enter" : "define",
      purpose: "unlock",
      accountId: userId,
      unlockId: lockKey,
    });
  };

  useEffect(() => {
    if (!isFocus || !locked) return;
    if (isConversationUnlocked(lockKey)) setLocked(false);
    else if (pinShown.current) navigation.goBack(); // left the PIN screen
  }, [isFocus]);

  const fetchMessages = async (loading) => {
    try {
      setLoading(loading);
      const idToUse = conversationId || recipientId;
      if (!idToUse) return;

      const res = await getMessages(idToUse);
      if (res?.data?.success) {
        setMessages(res.data.messages || []); // Ensure array
        const info = res.data.conversationInfo;
        setWelcome(info?.showWelcome ? info.initialMessage : null);
        setSecurity(info?.security || {});
        setThemeColor(info?.settings?.theme || "");
        setMatchedAt(info?.matchedAt || null);
        if (info?.other) setOtherInfo((o) => ({ ...(o || {}), ...info.other }));
        if (info?.settings?.pinLock && !isConversationUnlocked(lockKey)) {
          setLocked(true);
          if (!pinShown.current) requirePin();
        } else {
          setLocked(false);
        }

        // Emit read status for the latest message
        if (socket && res.data.messages?.length > 0) {
          socket.emit(
            "message:read",
            { messageId: res.data.messages[0]._id },
            (res) => {
              console.log("message:read response", res);
            },
          );
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
  }, [isFocus]);

  // --- Socket Listeners ---
  useEffect(() => {
    if (!socket) return;

    // A. New Message Received
    socket.on("new:message", (data) => {
      // Check if message belongs to this conversation
      // If using conversationId check: data.conversationId === conversationId
      // Or check sender/receiver:

      const msg = data.message;
      const isForThisChat = isGroup
        ? false // groups match on conversationId below
        : (msg.senderId._id === recipientId && msg.receiverId === userId) ||
          (msg.senderId._id === userId && msg.receiverId === recipientId);

      if (
        isForThisChat ||
        (conversationId && data.conversationId === conversationId)
      ) {
        setMessages((prev) => {
          // 1. Prevent exact duplicate by ID (already handled by callback)
          if (prev.find((m) => m._id === msg._id)) return prev;

          // 2. Handle optimistic replacement for sender
          const sId =
            typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
          if (sId === userId) {
            const placeholderIndex = prev.findIndex(
              (m) =>
                m.status === "sending" &&
                m.type === msg.type &&
                (msg.type === "text" ? m.content === msg.content : true),
            );

            if (placeholderIndex !== -1) {
              const updated = [...prev];
              updated[placeholderIndex] = msg;
              return updated;
            }
          }

          // 3. New message from other user or no placeholder found
          return [msg, ...prev];
        });
        flatListRef?.current?.scrollToOffset({ offset: 0, animated: true });

        // Mark as delivered/read immediately if we are here?
        // Let's emit 'read'
        socket.emit("message:read", { messageId: msg._id }, (res) => {
          console.log("message:read response", res);
        });
      }
    });

    // B. Message Reaction Update
    socket.on("message:reaction", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? {
                ...msg,
                reactions: data.reactions,
                reactionCount: data.reactionCount,
              }
            : msg,
        ),
      );
    });

    // C. Message Status Update
    socket.on("message:status", (data) => {
      fetchMessages(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? {
                ...msg,
                deliveryStatus: { ...msg.deliveryStatus, [data.status]: true },
              } // rudimentary status update
            : msg,
        ),
      );
    });

    // C2. Meeting accepted / declined (card updates for everyone)
    socket.on("meeting:status", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, meeting: data.meeting } : msg,
        ),
      );
    });

    // D. User Typing Status
    socket.on("user:typing", (data) => {
      if (data.userId === recipientId) {
        setOtherUserTyping(data.isTyping);
      }
    });

    return () => {
      socket.off("new:message");
      socket.off("message:reaction");
      socket.off("message:status");
      socket.off("meeting:status");
      socket.off("user:typing");
    };
  }, [socket, recipientId, conversationId, userId]);

  // --- Keyboard ---
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // --- Handlers ---

  const handleTyping = (text) => {
    setInputText(text);

    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      if (!isGroup) socket.emit("typing:start", { participant_id: recipientId });
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      setIsTyping(false);
      if (!isGroup) socket.emit("typing:stop", { participant_id: recipientId });
    }, 1500);

    setTypingTimeout(timeout);
  };

  const sendMessage = (type = "text", attachment = null) => {
    if (!socket) return;
    if (type === "text" && !inputText.trim()) return;

    const payload = {
      ...target,
      content: inputText,
      type: type,
      ...(attachment && { attachment }),
      ...(replyMessage && { replyTo: replyMessage._id }),
    };

    const tempId = Date.now().toString();
    const optimisticMsg = {
      _id: tempId,
      senderId: { _id: userId },
      receiverId: recipientId,
      content: inputText,
      type: type,
      status: "sending",
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...(attachment && { attachment }),
      ...(replyMessage && { replyTo: replyMessage }),
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    if (replyMessage) {
      socket.emit("reply:message", payload, (response) => {
        if (response.success && response.data) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? response.data : m)),
          );
          setReplyMessage(null);
        }
      });
    } else {
      socket.emit("send:message", payload, (response) => {
        if (response.success && response.data) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? response.data : m)),
          );
        }
      });
    }

    // Optimistic UI could be added here
    setInputText("");
    setReplyMessage(null);
  };

  // Picking from the camera / library opens the Photo-sharing-preview first
  const handleMediaSelect = (result) => {
    if (!result) return;
    setImageModal(false);
    if (String(result.mime || "").includes("gif")) setGifPreview(result);
    else setMediaPreview(result);
  };

  const pickFromLibrary = async () => {
    try {
      const picked = await openPicker({ mediaType: "any", cropping: false });
      if (picked?.path) handleMediaSelect(picked);
    } catch (e) {
      // cancelled
    }
  };

  // Figma: camera → Photo-sharing-preview (no intermediate sheet)
  const takePhoto = async () => {
    try {
      const shot = await openCamera({ mediaType: "any", cropping: false });
      if (shot?.path) handleMediaSelect(shot);
    } catch (e) {
      if (String(e?.message || "").toLowerCase().includes("permission")) {
        ToastMessage("Please allow camera access in Settings", "error");
      }
    }
  };

  const pickGif = async () => {
    try {
      const picked = await openPicker({ mediaType: "photo", cropping: false });
      if (!picked?.path) return;
      if (String(picked.mime || "").includes("gif")) setGifPreview(picked);
      else ToastMessage("Please pick a GIF", "error");
    } catch (e) {
      // cancelled
    }
  };

  const sendMedia = async (result, caption = "") => {
    if (!result) return;
    setMediaPreview(null);
    setGifPreview(null);

    const isVideo = result.mime.startsWith("video");
    const tempId = Date.now().toString();

    // Optimistic message
    const optimisticMsg = {
      _id: tempId,
      senderId: { _id: userId },
      receiverId: recipientId,
      content: caption,
      type: isVideo ? "file" : "image",
      attachment: { url: result.path },
      status: "sending",
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      setImgLoading(true);
      let url = "";
      if (isVideo) {
        const res = await uploadFileGetUrl(
          { localUri: result.path, name: result.filename || "video.mp4" },
          result.mime,
        );
        url = res?.file || res?.data?.fileUrl || res?.url; // Fallback to common patterns
      } else {
        url = await uploadAndGetUrl(result);
      }

      if (url) {
        // Send actual message
        const payload = {
          ...target,
          content: caption,
          type: isVideo ? "file" : "image",
          attachment: {
            url,
            filename: result.filename || result.path.split("/").pop(),
            mimetype: result.mime,
            size: result.size,
            ...(isVideo
              ? {}
              : { dimensions: { width: result.width, height: result.height } }),
          },
          ...(replyMessage && { replyTo: replyMessage._id }),
        };

        const eventName = replyMessage ? "reply:message" : "send:message";
        socket.emit(eventName, payload, (response) => {
          if (response.success && response.data) {
            setMessages((prev) =>
              prev.map((m) => (m._id === tempId ? response.data : m)),
            );
            setReplyMessage(null);
          }
        });
      }
    } catch (error) {
      console.error("Media upload error:", error);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setImgLoading(false);
    }
  };

  const handleCapture = (result) => {
    if (result) handleMediaSelect(result);
  };

  const handleAudioSend = async (audioPath, duration, size) => {
    console.log("duration---", duration);

    if (!audioPath) return;

    const tempId = Date.now().toString();
    const filename = audioPath.split("/").pop() || "audio.m4a";

    // Optimistic message
    const optimisticMsg = {
      _id: tempId,
      senderId: { _id: userId },
      receiverId: recipientId,
      content: "",
      type: "voice",
      attachment: { url: audioPath, duration },
      status: "sending",
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      // Upload audio file
      const res = await uploadFileGetUrl(
        { localUri: audioPath, name: filename },
        "audio/aac",
      );
      const url = res?.file || res?.data?.fileUrl || res?.url;

      if (url) {
        // Get file size if not provided
        let fileSize = size || 0;
        if (!fileSize) {
          try {
            const response = await fetch(audioPath);
            const blob = await response.blob();
            fileSize = blob.size;
          } catch (e) {
            console.log("Could not get audio file size:", e);
          }
        }

        // Send actual message
        const payload = {
          ...target,
          content: "",
          type: "voice",
          attachment: {
            url,
            filename,
            mimetype: "audio/aac",
            size: fileSize,
            duration: duration,
          },
          ...(replyMessage && { replyTo: replyMessage._id }),
        };

        const eventName = replyMessage ? "reply:message" : "send:message";
        socket.emit(eventName, payload, (response) => {
          console.log("response.success----", response);

          if (response.success && response.data) {
            setMessages((prev) =>
              prev.map((m) => (m._id === tempId ? response.data : m)),
            );
            setReplyMessage(null);
          }
        });
      }
    } catch (error) {
      console.error("Audio upload error:", error);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  const handleSend = () => {
    sendMessage("text");
  };

  const handleReaction = (messageId, emoji) => {
    if (!socket) return;
    socket.emit("react:message", { messageId, emoji });
    // Optimistic reaction update could be tricky with Map structure, wait for server response usually better or simple toggle
  };

  const isUserMessage = (msg) => {
    const sender =
      typeof msg?.senderId === "object" ? msg?.senderId?._id : msg?.senderId;
    return sender === userId;
  };

  return (
    <ScreenWrapper
      // the header paints the status bar area itself (Figma: one 104 block)
      translucent
      statusBarColor="transparent"
      paddingHorizontal={10}
      headerUnScrollable={() => (
        <ChatHeader
          title={
            isGroup
              ? recipientName
              : otherInfo?.firstName
              ? `${otherInfo.firstName}${otherInfo?.age ? `, ${otherInfo.age}` : ""}`
              : recipientName
          }
          subtitle={isGroup ? (memberCount ? `${memberCount} members` : undefined) : otherInfo?.occupation?.jobTitle}
          company={isGroup ? undefined : otherInfo?.occupation?.company}
          online={!isGroup && (otherInfo?.status === "online" || (otherInfo?.status === undefined && !!otherInfo?.isOnline))}
          onVoiceCall={comingSoon("Voice calling")}
          onVideoCall={comingSoon("Video calling")}
          onSettingsPress={() =>
            navigation.navigate("ConversationSettings", {
              recipientId,
              otherUser,
              conversationId: isGroup ? conversationId : undefined,
              isGroup,
              groupType: route?.params?.groupType,
              recipientName,
              groupPicture: route?.params?.groupPicture,
              memberCount,
            })
          }
        />
      )}
      footerUnScrollable={() => (
        <ChatFooter
          // item={item}
          setInputText={handleTyping}
          sendMessage={handleSend}
          inputText={inputText}
          replyMessage={replyMessage}
          onClearReply={() => setReplyMessage(null)}
          recipientName={recipientName}
          otherUserTyping={otherUserTyping}
          onCameraPress={takePhoto}
          onGalleryPress={pickFromLibrary}
          onGifPress={pickGif}
          typingName={isGroup ? "Someone" : otherInfo?.firstName || recipientName}
          recordSignal={recordSignal}
          showScrollDown={scrolledUp}
          onScrollDown={() => flatListRef?.current?.scrollToOffset({ offset: 0, animated: true })}
          onSchedulePress={() =>
            navigation.navigate("ScheduleMeeting", { target, recipientName })
          }
          onSendAudio={handleAudioSend}
          onSendAttachment={(file, type) => {
            // Upload first
            // uploadFile(file, type).then(res => sendMessage(type, res.data))
            // This needs implementation in ChatFooter to pick file
          }}
        />
      )}
    >
      {/* <ListHeader  title={recipientName}/> */}
      {loading || locked ? (
        <View style={{ flex: 1, paddingVertical: 14 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, index) => (
            <ChatBubbleSkeleton key={index} isSender={index % 2 === 0} />
          ))}
        </View>
      ) : (
        <FlatList
          inverted
          ref={flatListRef}
          data={messages}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, i) => item._id || i.toString()}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: keyboardHeight + 10 },
            messages.length === 0 && { flexGrow: 1 },
          ]}
          onScroll={(e) => setScrolledUp(e.nativeEvent.contentOffset.y > 200)}
          scrollEventThrottle={100}
          // inverted list: the footer sits at the top (above the oldest
          // message), the header at the bottom (below the latest).
          ListFooterComponent={
            messages.length > 0 ? (
              <View style={styles.intro}>
                {!!matchedAt && (
                  <InfoDivider label={`You matched with ${otherInfo?.firstName || recipientName} on ${moment(matchedAt).format("MMM D, YYYY")}`} />
                )}
                {!!welcome && (
                  <CustomText label={welcome} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.28} color={COLORS.gray64} textAlign="center" containerStyle={styles.welcome} />
                )}
                <DateDivider label={dayLabel(messages[messages.length - 1])} />
              </View>
            ) : null
          }
          ListHeaderComponent={
            !isGroup && ["dnd", "idle"].includes(otherInfo?.status) ? (
              <InfoDivider medium label={`${otherInfo?.firstName || recipientName} is not available at the moment`} />
            ) : null
          }
          ListEmptyComponent={
            // inverted list flips its children — flip back so it reads normally
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceAlt }]}>
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="waving_hand"
                  size={32}
                  color={COLORS.gray64}
                />
              </View>
              <CustomText
                label="No messages yet"
                fontSize={20}
                fontFamily={fonts.semiBold}
                letterSpacing={-0.5}
                color={colors.text}
                textAlign="center"
                marginTop={16}
              />
              <CustomText
                label={`Say hi to ${recipientName} and start the conversation.`}
                fontSize={14}
                color={COLORS.gray64}
                textAlign="center"
                marginTop={4}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (!socket) return;
                  socket.emit(
                    "send:message",
                    { ...target, content: "Hi 👋", type: "text" },
                    (response) => {
                      if (response?.success && response?.data) {
                        setMessages((prev) =>
                          prev.some((m) => m._id === response.data._id)
                            ? prev
                            : [response.data, ...prev],
                        );
                      }
                    },
                  );
                }}
                style={[styles.sayHi, { backgroundColor: colors.surfaceAlt }]}
              >
                <CustomText
                  label="Say hi 👋"
                  fontSize={14}
                  fontFamily={fonts.medium}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item, index }) => {
            const getSenderName = (msg) => {
              if (!msg) return "";
              const senderId =
                typeof msg.senderId === "object"
                  ? msg.senderId._id
                  : msg.senderId;
              if (senderId === userId) return "You";
              if (isGroup && typeof msg.senderId === "object") {
                return msg.senderId.firstName || "Member";
              }
              return recipientName;
            };
            // Name chip above the first received message of a run (list is
            // inverted → the older message is index + 1); date pill when the
            // day changes.
            const senderOf = (m) =>
              typeof m?.senderId === "object" ? m?.senderId?._id : m?.senderId;
            const older = messages[index + 1];
            const showSender = !isUserMessage(item) && senderOf(older) !== senderOf(item);
            const showDate = older && dayKey(older) !== dayKey(item);
            const sender = typeof item.senderId === "object" ? item.senderId : null;

            let repliedToMessage = null;
            if (item.replyTo && typeof item.replyTo === "object") {
              // Direct object from socket
              repliedToMessage = {
                content: item.replyTo.content,
                senderName: getSenderName(item.replyTo),
              };
            } else if (item.replyTo) {
              // ID from API or socket
              const parentMsg = messages.find((m) => m._id === item.replyTo);
              if (parentMsg) {
                repliedToMessage = {
                  content: parentMsg.content,
                  senderName: getSenderName(parentMsg),
                };
              }
            }

            const bubble = (
              <ChatBubble
                item={item}
                userId={userId}
                isSender={isUserMessage(item)}
                repliedToMessage={repliedToMessage}
                onReply={(msg) => setReplyMessage(msg)}
                onVoiceReply={(msg) => {
                  setReplyMessage(msg);
                  setRecordSignal((n) => n + 1);
                }}
                onReact={handleReaction}
                allowCopy={!security.blockCopying}
                themeColor={themeColor}
                senderSelfName={userData?.firstName}
                meetingWith={
                  isGroup
                    ? { name: recipientName, picture: route?.params?.groupPicture }
                    : {
                        name: otherInfo?.firstName || recipientName,
                        picture: otherInfo?.profile?.avatar,
                        color: otherInfo?.profile?.profileColor,
                      }
                }
                senderName={showSender ? (isGroup ? sender?.firstName || "Member" : otherUser?.firstName || recipientName) : null}
                senderColor={(isGroup ? sender?.profile?.profileColor : otherUser?.profile?.profileColor) || "#397050"}
                onReport={() => navigation.navigate("ReportChat", { user: sender || otherInfo, conversationId })}
                onMeetingStatus={(id, meeting) =>
                  setMessages((prev) =>
                    prev.map((m) => (m._id === id ? { ...m, meeting } : m)),
                  )
                }
              />
            );
            return showDate ? (
              <View>
                <DateDivider label={dayLabel(item)} />
                {bubble}
              </View>
            ) : (
              bubble
            );
          }}
        />
      )}
      <PhotoSharingPreview
        media={mediaPreview}
        onCancel={() => setMediaPreview(null)}
        onReplace={(next) => setMediaPreview(next)}
        onSend={(m, caption) => sendMedia(m, caption)}
      />
      <GifPreviewSheet
        visible={!!gifPreview}
        gif={gifPreview}
        onDismiss={() => setGifPreview(null)}
        onShare={() => sendMedia(gifPreview)}
      />
      <UploadImageCustom
        imageModal={imageModal}
        setImageModal={setImageModal}
        imgLoading={imgLoading}
        handleChange={handleMediaSelect}
        handleCapture={handleCapture}
        camera={cameraRef}
      />
    </ScreenWrapper>
  );
};

export default InboxScreen;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Figma: 40 under the header, 20 between items, bubbles 12 from the edges
  contentContainer: {
    paddingHorizontal: 2, // + ScreenWrapper 10 = 12
    paddingTop: 20,
    paddingBottom: 10,
  },
  intro: {
    paddingTop: 40,
  },
  welcome: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    transform: [{ scaleY: -1 }],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  sayHi: {
    marginTop: 24,
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  timeBox: {
    backgroundColor: isDark ? COLORS.primaryColor : colors.surfaceAlt,
    borderRadius: 100,
    marginBottom: 10,
    alignSelf: "center",
    paddingHorizontal: 8,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});
