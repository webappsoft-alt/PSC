import { BlurView } from "@react-native-community/blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import Blur from "../../../../components/Blur";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import AudioRecorder from "./AudioRecorder";

/**
 * Figma Chat page "Inbox_General-Default" footer — bar #262626 @64% + blur
 * 32, pad 12/12/34/12. Three states:
 *  idle (2212:6349): calendar · photos · GIF circles 44 #121212 (icons 22 /
 *    22 / 28 @64%), 6 apart · input #121212 r100 pad 16 "Type your
 *    message..." Regular 14 @48%
 *  focused, empty (2212:6567): input 48 #121212 r100 (pad 0/16/0/12, gap 8):
 *    add 24 @64% · "Type message" Regular 16 −1% @64% · photo_camera 24 ·
 *    6 · mic circle 44 #121212 (mic 22 white)
 *  typing (2212:7108): input 44 #121212 Regular 14 #F3F3F3 · 8 · send 44
 *    #A19375 + chevron_right 22 #1E1E1E
 * Above it: "Myles is typing..." Regular 14 #828186 (pad 16) and the 40
 * "scroll to latest" circle (white 8%, expand_more 20) at the right.
 */
const ChatFooter = ({
  inputText,
  setInputText,
  sendMessage,
  showChatFeatures = true,
  replyMessage,
  onClearReply,
  recipientName,
  otherUserTyping,
  typingName,
  onCameraPress,
  onGalleryPress,
  onGifPress,
  onSendAudio,
  onSchedulePress,
  showScrollDown,
  onScrollDown,
  recordSignal, // bump to start a voice recording (voice reply chip)
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const field = isDark ? "#121212" : colors.surfaceAlt;
  const [isRecording, setIsRecording] = useState(false);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const [focused, setFocused] = useState(false);
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const audioRecorderRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (recordSignal) setIsRecording(true);
  }, [recordSignal]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardShown(true);
      if (Platform.OS === "ios") {
        Animated.timing(keyboardHeight, { duration: event.duration, toValue: event.endCoordinates.height, useNativeDriver: false }).start();
      } else {
        keyboardHeight.setValue(event.endCoordinates.height);
      }
    });
    const hide = Keyboard.addListener(hideEvent, (event) => {
      setKeyboardShown(false);
      if (Platform.OS === "ios") {
        Animated.timing(keyboardHeight, { duration: event.duration, toValue: 0, useNativeDriver: false }).start();
      } else {
        keyboardHeight.setValue(0);
      }
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const bottomPad = keyboardShown ? 12 : Math.max(insets.bottom, 34);
  const hasText = !!inputText && inputText.trim() !== "";
  const state = isRecording ? "recording" : hasText ? "typing" : focused ? "focused" : "idle";

  const circle = (icon, size, onPress, color = tint(0.64), bg = field, filled) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.circle, { backgroundColor: bg }]}>
      <Icons family={filled ? "MaterialSymbolsRoundedFilled" : "MaterialSymbolsRounded"} name={icon} size={size} color={color} />
    </TouchableOpacity>
  );

  const input = (
    <TextInput
      ref={inputRef}
      value={inputText}
      style={[
        styles.textInput,
        state === "focused"
          ? { fontSize: 16, letterSpacing: -0.16 }
          : { fontSize: 14 },
        { color: isDark ? "#F3F3F3" : colors.text },
      ]}
      placeholder={state === "idle" ? "Type your message..." : "Type message"}
      placeholderTextColor={state === "idle" ? tint(0.48) : tint(0.64)}
      selectionColor="#A19375"
      onFocus={() => setFocused(true)}
      // let a tap on the mic / camera land before the bar switches back
      onBlur={() => setTimeout(() => setFocused(false), 200)}
      onChangeText={setInputText}
      multiline
    />
  );

  return (
    <>
      {showChatFeatures && (
        <View>
          {showScrollDown && (
            // floats over the messages like the inbox "+" FAB (InboxPager):
            // 56 blur circle, 1px white 8% border, #1E1E1E 64%, icon 24 @64%
            <View pointerEvents="box-none" style={styles.scrollRow}>
              <TouchableOpacity activeOpacity={0.8} onPress={onScrollDown} style={styles.scrollBtn}>
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType={isDark ? "dark" : "light"}
                  blurAmount={16}
                  reducedTransparencyFallbackColor="#1E1E1E"
                />
                <View style={[StyleSheet.absoluteFill, styles.scrollTint]} />
                <Icons family="MaterialSymbolsRounded" name="expand_more" size={24} color={tint(0.64)} />
              </TouchableOpacity>
            </View>
          )}
          {otherUserTyping && (
            <CustomText label={`${typingName || recipientName} is typing...`} fontSize={14} color="#828186" containerStyle={styles.typing} />
          )}
        </View>
      )}

      {replyMessage && (
        <View style={[styles.reply, { backgroundColor: tint(0.04), borderLeftColor: "#A19375" }]}>
          <View style={styles.flex}>
            <CustomText
              label={`Replying to ${replyMessage?.type === "text" ? recipientName : replyMessage?.type === "image" ? "Image" : replyMessage?.type === "voice" ? "Voice" : "Video"}`}
              fontSize={12}
              fontFamily={fonts.medium}
              color={colors.text}
            />
            <CustomText
              label={replyMessage?.type === "text" ? replyMessage.content : replyMessage?.type === "image" ? "Image" : replyMessage?.type === "voice" ? "Voice message" : "Video"}
              fontSize={12}
              color={tint(0.64)}
              numberOfLines={1}
            />
          </View>
          <TouchableOpacity onPress={onClearReply} hitSlop={8}>
            <Icons family="MaterialSymbolsRounded" name="close" size={16} color={tint(0.64)} />
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[
          styles.footer,
          {
            paddingBottom: bottomPad,
            marginBottom: Platform.OS === "android" && Platform.Version < 35 ? 0 : keyboardHeight,
            gap: state === "typing" ? 8 : 6,
          },
        ]}
      >
        <Blur blurType={isDark ? "dark" : "xlight"} blurAmount={32} borderRadius={0.01} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "rgba(38, 38, 38, 0.64)" : "rgba(255, 255, 255, 0.64)" }]} />

        {state === "recording" ? (
          <View style={[styles.field, styles.fieldFocused, { backgroundColor: field }]}>
            <AudioRecorder
              ref={audioRecorderRef}
              onSend={async (path, duration, size) => {
                setIsRecording(false);
                onSendAudio?.(path, duration, size);
              }}
              onCancel={() => setIsRecording(false)}
            />
          </View>
        ) : state === "idle" ? (
          <>
            {circle("calendar_today", 22, onSchedulePress)}
            {circle("photo_library", 22, onGalleryPress)}
            {circle("gif", 28, onGifPress)}
            <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={[styles.field, { backgroundColor: field }]}>
              {input}
            </TouchableOpacity>
          </>
        ) : state === "focused" ? (
          <View style={[styles.field, styles.fieldFocused, { backgroundColor: field }]}>
            <TouchableOpacity onPress={onGalleryPress} hitSlop={8}>
              <Icons family="MaterialSymbolsRounded" name="add" size={24} color={tint(0.64)} />
            </TouchableOpacity>
            {input}
            <TouchableOpacity onPress={onCameraPress} hitSlop={8}>
              <Icons family="MaterialSymbolsRounded" name="photo_camera" size={24} color={tint(0.64)} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.field, { backgroundColor: field }]}>{input}</View>
        )}

        {state === "focused" && circle("mic", 22, () => setIsRecording(true), colors.text, field, true)}
        {state === "recording" && circle("arrow_upward", 22, () => audioRecorderRef.current?.stopAndSend?.(), "#1E1E1E", "#A19375")}
        {state === "typing" && circle("chevron_right", 22, sendMessage, "#1E1E1E", "#A19375")}
      </Animated.View>
    </>
  );
};

export default ChatFooter;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // absolute: takes no row of its own, sits 16 above the bar, right 16
  scrollRow: {
    position: "absolute",
    right: 16,
    bottom: 16,
    zIndex: 10,
  },
  scrollTint: {
    backgroundColor: "rgba(30, 30, 30, 0.64)",
  },
  scrollBtn: {
    width: 56,
    height: 56,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  typing: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  reply: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    flex: 1,
    minHeight: 44,
    borderRadius: 100,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  fieldFocused: {
    minHeight: 48,
    paddingLeft: 12,
    paddingRight: 16,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.regular,
    paddingTop: 0,
    paddingBottom: 0,
    maxHeight: 96,
  },
});
