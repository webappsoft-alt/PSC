import moment from "moment";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Image,
  ActivityIndicator,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { useState, useRef } from "react";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";

import { ToastMessage } from "../../../../utils/ToastMessage";
import { Clipboard } from "react-native";
import Video from "react-native-video";
import AudioPlayer from "./AudioPlayer";
import Blur from "../../../../components/Blur";
import { useTheme } from "../../../../contexts/ThemeContext";

const ChatBubble = ({
  isSender,
  item,
  onReply,
  onReact,
  repliedToMessage,
  userId,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const isLiked = item?.reactions?.["❤️"]?.[userId];
  const bg = isSender
    ? isDark
      ? "#FFFFFF0A"
      : colors.surfaceAlt
    : isDark
    ? "#FFFFFF1F"
    : colors.white04;
  const messageTime = moment(item.createdAt).format("h:mm A");
  const translateX = useRef(new Animated.Value(0)).current;
  const [showReply, setShowReply] = useState(false);

  const Actions = [
    {
      name: "like",
      image: isLiked ? Images.likeChat : Images.ChatLike,
      onPress: () => onReact && onReact(item._id, "❤️"),
      tintColor: isLiked ? COLORS.red1 : colors.text,
    },
    {
      name: "Reply",
      image: Images.Reply,
      onPress: () => onReply && onReply(item),
    },
    ...(item?.type == "text"
      ? [
          {
            name: "Copy",
            image: Images.CopytoClipBorad,
            onPress: () => {
              if (item?.content) {
                Clipboard.setString(item.content);
                ToastMessage("Message copied to clipboard", "success");
              }
            },
          },
        ]
      : []),
  ];

  const handlePanGesture = (event) => {
    const { translationX } = event.nativeEvent;

    if (translationX > 50 && !showReply) {
      setShowReply(true);
      onReply && onReply(item);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else if (translationX < -50 && showReply) {
      setShowReply(false);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      translateX.setValue(translationX);
    }
  };

  const handlePanStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // When gesture ends, spring back to original position
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View
      style={[
        styles.mainContainer,
        isSender ? styles.sender : styles.receiver,

        { transform: [{ translateX }] },
      ]}
    >
      <View
        style={[
          styles.messageContainer,
          {
            backgroundColor: bg,
            paddingHorizontal:
              item?.type === "image" || item?.type === "file" ? 0 : 12,
            paddingVertical:
              item?.type === "image" || item?.type === "file" ? 0 : 16,
          },
        ]}
      >
        {repliedToMessage && (
          <View style={styles.repliedMessageContainer}>
            <View style={styles.repliedIndicator} />
            <View style={styles.repliedContent}>
              <CustomText
                label={repliedToMessage.senderName || "User"}
                fontSize={12}
                fontFamily={fonts.semiBold}
                color={COLORS.buttonColor}
              />
              <CustomText
                label={
                  repliedToMessage?.content
                    ? repliedToMessage.content
                    : "📷 Media"
                }
                fontSize={11}
                color={colors.textSecondary}
                numberOfLines={2}
              />
            </View>
          </View>
        )}
        {(item?.type === "image" ||
          item?.type === "video" ||
          item?.type === "file") &&
          (item.attachment?.url || item.attachment?.uri) && (
            <>
              {item?.type === "image" ? (
                <View style={[styles.imageWrapper]}>
                  <Blur blurType="dark" />
                  <ImageFast
                    isView
                    source={{ uri: item.attachment.url || item.attachment.uri }}
                    style={{
                      width: 168,
                      height: 168,
                      borderRadius: 6,
                    }}
                  />
                  {item.status === "sending" && (
                    <View style={styles.imageLoadingOverlay}>
                      <ActivityIndicator color={COLORS.white} size="small" />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.imageWrapper}>
                  <Blur blurType="dark" />

                  <Video
                    source={{ uri: item.attachment.url || item.attachment.uri }}
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                    resizeMode="cover"
                    controls={true}
                    muted
                    playInBackground={false}
                    playWhenInactive={false}
                  />
                </View>
              )}
            </>
          )}

        {item?.type === "voice" && (
          <AudioPlayer
            audioUri={item.attachment?.url}
            duration={item.attachment?.duration || 0}
            isPending={item.status === "sending"}
            isSender={isSender}
          />
        )}

        {item?.type === "text" && (
          <CustomText
            label={item?.content}
            lineHeight={14 * 1.4}
            fontFamily={fonts.medium}
            color={colors.text}
          />
        )}

        {/* Reaction Display placeholder */}
        {item?.reactions && Object.keys(item.reactions).length > 0 && (
          <View style={styles.reactionsWrapper}>
            {Object?.keys(item?.reactions)?.map((emoji, index) => (
              <View key={index} style={styles.reactionBubble}>
                <CustomText label={emoji} fontSize={10} />
              </View>
            ))}
          </View>
        )}
      </View>

      {!isSender && (
        <View style={styles.row}>
          {Actions?.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              style={[
                styles.iconContainer,
                {
                  paddingVertical: index == 4 ? 6 : 8,
                  paddingHorizontal: index == 4 ? 6 : 12,
                },
              ]}
            >
              <Image
                source={action.image}
                tintColor={action.tintColor || colors.text}
                style={[
                  index == 4
                    ? styles.icon2
                    : index == 0 && isLiked
                    ? styles.iconLike
                    : styles.icon,
                  { tintColor: action.tintColor || colors.text },
                ]}
              />
              {action?.name?.length > 0 && (
                <CustomText
                  label={action?.name}
                  fontSize={12}
                  fontFamily={fonts.regular}
                  color={colors.text}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isSender && (
        <View style={styles.row}>
          <CustomText
            fontSize={12}
            lineHeight={14 * 1.4}
            alignSelf={"flex-end"}
            color={colors.textSecondary}
            label={moment(item.createdAt || item.timestamp).format("h:mm A")}
          />
          <View style={styles.line} />
          {item.status === "sending" ? (
            <Icons name="time-outline" color={"#A19375"} />
          ) : item?.deliveryStatus?.read ? (
            <Icons name={"checkmark-done-sharp"} color={"#4dabf5"} />
          ) : (
            <Icons name={"checkmark-done-sharp"} color={"#A19375"} />
          )}
        </View>
      )}
    </Animated.View>
  );
};

export default ChatBubble;

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    mainContainer: {
      marginBottom: 10,
      alignItems: "flex-end",
    },
    imageWrapper: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      overflow: "hidden",
      padding: 4,
    },
    imageLoadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 12,
    },
    messageContainer: {
      borderRadius: 12,
      justifyContent: "center",

      maxWidth: "80%",
    },
    sender: {
      alignItems: "flex-end",
      alignSelf: "flex-end",
    },
    receiver: {
      alignItems: "flex-start",
      alignSelf: "flex-start",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: 5,
      marginTop: 7,
    },
    line: {
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.16)" : colors.border,
      width: 1,
      height: 12,
    },
    icon: {
      height: 12,
      width: 12,
    },
    iconLike: {
      height: 15,
      width: 15,
    },
    icon2: {
      height: 16,
      width: 16,
    },
    iconContainer: {
      backgroundColor: colors.white04,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: 100,
    },
    repliedMessageContainer: {
      flexDirection: "row",
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.03)",
      borderRadius: 8,
      marginBottom: 8,
      overflow: "hidden",
    },
    repliedIndicator: {
      width: 4,
      backgroundColor: COLORS.buttonColor,
    },
    repliedContent: {
      padding: 8,
    },
    reactionsWrapper: {
      position: "absolute",
      bottom: -10,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
    },
    reactionBubble: {
      backgroundColor: isDark ? "#1A1A1A" : colors.background,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : colors.border,
      marginLeft: -4,
    },
  });
