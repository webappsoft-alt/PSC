import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import UploadChatModal from "./UploadChatModal";
import { Images } from "../../../../assets/images";
import AudioRecorder from "./AudioRecorder";
import { useTheme } from "../../../../contexts/ThemeContext";

const quickMessages = ["Hello, What's Up?", "I'm outside"];

const ChatFooter = ({
  inputText,
  setInputText,
  sendMessage,
  showChatFeatures = true,
  replyMessage,
  onClearReply,
  recipientName,
  otherUserTyping,
  onCameraPress,
  onSendAudio,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const inputFlexAnim = useRef(new Animated.Value(1)).current;
  const autoCloseRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShow = Keyboard.addListener(keyboardShowEvent, (event) => {
      setIsKeyboardVisible(true);
      if (Platform.OS === "ios") {
        Animated.timing(keyboardHeight, {
          duration: event.duration,
          toValue: event.endCoordinates.height,
          useNativeDriver: false,
        }).start();
      } else {
        keyboardHeight.setValue(event.endCoordinates.height);
      }
    });

    const keyboardHide = Keyboard.addListener(keyboardHideEvent, (event) => {
      setIsKeyboardVisible(false);
      if (Platform.OS === "ios") {
        Animated.timing(keyboardHeight, {
          duration: event.duration,
          toValue: 0,
          useNativeDriver: false,
        }).start();
      } else {
        keyboardHeight.setValue(0);
      }
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []);

  const pb = Platform.OS === "android" ? 20 : isKeyboardVisible ? 20 : 35;

  const closeActions = () => {
    if (autoCloseRef.current) {
      clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
    Animated.parallel([
      Animated.timing(actionsAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(inputFlexAnim, {
        toValue: 0.87,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => setActionsOpen(false));
  };

  const actionsOpacity = actionsAnim;
  const actionsScale = actionsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  const actionsTranslateY = actionsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });
  const actionsWidth = actionsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  return (
    <>
      {showChatFeatures && (
        <View>
          <View style={styles.row}>
            {otherUserTyping ? (
              <View style={styles.typeBox}>
                <View style={styles.dot} />
                <CustomText
                  fontSize={12}
                  label={`${recipientName} is typing`}
                />
              </View>
            ) : (
              <View />
            )}
          </View>
          <FlatList
            horizontal
            data={quickMessages}
            contentContainerStyle={{ paddingLeft: 12 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setInputText(item)}
                style={styles.quickMsg}
              >
                <CustomText
                  label={item}
                  lineHeight={14 * 1.4}
                  fontFamily={fonts.medium}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {replyMessage && (
        <View
          style={[styles.replyContainer, { borderColor: COLORS.buttonColor }]}
        >
          <View style={styles.replyContent}>
            <View style={styles.replyTextContainer}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Image
                  source={Images.Reply}
                  style={{ height: 16, width: 16 }}
                />

                <CustomText
                  label={`Replying to ${
                    replyMessage?.type == "text"
                      ? recipientName
                      : replyMessage?.type == "image"
                      ? "Image"
                      : replyMessage?.type == "voice"
                      ? "Voice"
                      : "Video"
                  }`}
                  fontFamily={fonts.medium}
                />

              </View>
              <CustomText
                label={`${
                  replyMessage?.type == "text"
                    ? replyMessage.content
                    : replyMessage?.type == "image"
                    ? "Image"
                    : replyMessage?.type == "voice"
                    ? "Voice message"
                    : "Video"
                }`}
                fontSize={12}
                color={colors.textSecondary}
                marginTop={4}
              />
            </View>
            <TouchableOpacity onPress={onClearReply} style={styles.closeReply}>
              <Icons
                name={"x"}
                size={16}
                color={colors.textSecondary}
                family={"Feather"}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Animated.View
        style={[
          styles.mainContainer,
          {
            paddingBottom: pb,
            marginBottom:
              Platform.OS === "android" && Platform.Version < 35
                ? 0
                : keyboardHeight,
          },
        ]}
      >
        <Animated.View style={[styles.inputContainer, { flex: inputFlexAnim }]}>
          {isRecording ? (
            <AudioRecorder
              ref={audioRecorderRef}
              onSend={async (path, duration, size) => {
                setIsRecording(false);
                if (onSendAudio) {
                  onSendAudio(path, duration, size);
                }
              }}
              onCancel={() => {
                setIsRecording(false);
              }}
            />
          ) : (
            <>
              <TextInput
                value={inputText}
                style={[styles.input]}
                placeholder="Type message"
                placeholderTextColor={colors.textSecondary}
                onChangeText={(text) => {
                  setInputText(text);
                  if (actionsOpen) closeActions();
                }}
              />
              <TouchableOpacity onPress={onCameraPress}>
                <Icons
                  size={20}
                  name={"camera"}
                  family={"Feather"}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginLeft: 15 }}
                onPress={() => setIsRecording(true)}
              >
                <Icons
                  size={18}
                  name={"mic"}
                  family={"Feather"}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {!isRecording && (
          <Animated.View
            style={[
              styles.actionsContainer,
              {
                opacity: actionsOpacity,
                width: actionsWidth,
                transform: [
                  { scale: actionsScale },
                  { translateY: actionsTranslateY },
                ],
              },
            ]}
            pointerEvents={actionsOpen ? "auto" : "none"}
          >
            <TouchableOpacity style={styles.actionBtn} onPress={closeActions}>
              <Icons
                size={18}
                name={"calendar"}
                family={"Feather"}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={closeActions}>
              <Icons
                size={18}
                name={"music"}
                family={"Feather"}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={closeActions}>
              <Icons
                size={18}
                name={"gif"}
                family={"MaterialIcons"}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        <TouchableOpacity
          onPress={
            isRecording
              ? () => audioRecorderRef.current?.stopAndSend?.()
              : sendMessage
          }
          style={styles.sendBtn}
          disabled={
            isRecording
              ? false
              : !inputText || inputText?.trim() === ""
          }
        >
          <Icons
            name={isRecording ? "arrow-up" : "arrow-right"}
            family={"Feather"}
            size={18}
          />
        </TouchableOpacity>
      </Animated.View>
      <UploadChatModal
        isVisible={visible}
        onDisable={() => setVisible(false)}
      />
    </>
  );
};

export default ChatFooter;

const createStyles = (colors, isDark) => StyleSheet.create({
  mainContainer: {
    padding: 12,
    width: "100%",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: isDark ? "#262626A3" : colors.card,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 25,
    marginRight: 8,
    backgroundColor: colors.background,
    paddingLeft: 12,
    paddingRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 8,
    color: colors.text,
    fontFamily: fonts.regular,
    justifyContent: "center",
    padding: 0,
  },

  sendBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
    backgroundColor: "#A19375",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    marginRight: 8,
    overflow: "hidden",
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white04,
  },
  dot: {
    backgroundColor: "#397050",
    width: 12,
    height: 12,
    borderRadius: 10,
  },
  typeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? COLORS.primaryColor : colors.surfaceAlt,
    borderRadius: 30,
    width: 180,
    columnGap: 5,
  },
  arrowDown: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white04,
    borderRadius: 50,
  },
  row: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  quickMsg: {
    backgroundColor: colors.white04,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
    padding: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  replyContainer: {
    backgroundColor: "rgba(161, 147, 117, 0.08)",
    borderLeftColor: COLORS.buttonColor,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: -8,
  },
  replyContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },

  replyTextContainer: {
    flex: 1,
  },
  closeReply: {
    padding: 4,
  },
});
