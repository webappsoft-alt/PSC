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
import { uploadAndGetUrl, uploadFileGetUrl } from "../../../utils/constants";
import ChatBubble from "./molecules/ChatBubble";
import ChatBubbleSkeleton from "./molecules/ChatBubbleSkeleton";
import ChatFooter from "./molecules/ChatFooter";
import ChatHeader from "./molecules/ChatHeader";
import AnimatedListItem from "../../../utils/AnimatedListItem";
import { useTheme } from "../../../contexts/ThemeContext";

const InboxScreen = ({ route }) => {
  const navigation = useNavigation();
  const { socket } = useSocket();
  const flatListRef = useRef(null);
  const { userData } = useSelector((state) => state.users);
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
  const cameraRef = useRef(null);

  const otherUser = route?.params?.otherUser || null;
  const recipientId = route?.params?.recipientId; // This is the user ID of the other person
  const recipientName = route?.params?.recipientName || "Chat";
  const conversationId = route?.params?.conversationId; // Optional, can be derived or passed

  const fetchMessages = async (loading) => {
    try {
      setLoading(loading);
      const idToUse = conversationId || recipientId;
      if (!idToUse) return;

      const res = await getMessages(idToUse);
      if (res?.data?.success) {
        setMessages(res.data.messages || []); // Ensure array

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
      const isForThisChat =
        (msg.senderId._id === recipientId && msg.receiverId === userId) ||
        (msg.senderId._id === userId && msg.receiverId === recipientId); // should ideally check conversationId

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
      socket.emit("typing:start", { participant_id: recipientId });
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing:stop", { participant_id: recipientId });
    }, 1500);

    setTypingTimeout(timeout);
  };

  const sendMessage = (type = "text", attachment = null) => {
    if (!socket) return;
    if (type === "text" && !inputText.trim()) return;

    const payload = {
      participant_id: recipientId,
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

  const handleMediaSelect = async (result) => {
    if (!result) return;
    setImageModal(false);

    const isVideo = result.mime.startsWith("video");
    const tempId = Date.now().toString();

    // Optimistic message
    const optimisticMsg = {
      _id: tempId,
      senderId: { _id: userId },
      receiverId: recipientId,
      content: "",
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
          participant_id: recipientId,
          content: "",
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

  const handleCapture = async (result) => {
    if (result) {
      await handleMediaSelect(result);
    }
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
          participant_id: recipientId,
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
      statusBarColor={isDark ? "rgba(38, 38, 38, 0.64)" : "rgba(255, 255, 255, 0.64)"}
      paddingHorizontal={10}
      headerUnScrollable={() => (
        <ChatHeader
          source={Images.user}
          title={recipientName}
          user={otherUser}
          location={
            otherUser?.location?.city &&
            `${otherUser?.location?.city}, ${otherUser?.location?.country}`
          }
          type={otherUser?.occupation?.jobTitle}
          status={otherUserTyping ? "Typing..." : ""} // Basic status
          onSettingsPress={() =>
            navigation.navigate("ConversationSettings", {
              recipientId,
              otherUser,
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
          onCameraPress={() => setImageModal(true)}
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
      {loading ? (
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
                    { participant_id: recipientId, content: "Hi 👋", type: "text" },
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
              return recipientName;
            };

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

            return (
              <ChatBubble
                item={item}
                userId={userId}
                isSender={isUserMessage(item)}
                repliedToMessage={repliedToMessage}
                onReply={(msg) => setReplyMessage(msg)}
                onReact={handleReaction}
              />
            );
          }}
        />
      )}
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
  contentContainer: {
    paddingBottom: 10,
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
