import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { openPicker } from "react-native-image-crop-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video from "react-native-video";
import fonts from "../../../../assets/fonts";
import Blur from "../../../../components/Blur";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";

/**
 * Figma Chat page "Photo-sharing-preview" (2352:5078): the picked photo /
 * video full screen (blurred copy behind), header pad 56/16/8/16 (#121212
 * @64% + blur): back 40 (#121212 8%, chevron 20) · 12 · "Cancel" Medium 32
 * −2%. Footer (gradient → #121212, pad 12/12/34/12, gap 10): 48 circle white
 * 16% + blur with add_photo_alternate 24 (pick another) · input 293×48 r100
 * white 4% + 1px white 4% ("Type message" Medium 16 −1% @48%) · send 24.
 */
const PhotoSharingPreview = ({ media, onCancel, onSend, onReplace }) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [caption, setCaption] = useState("");
  useEffect(() => {
    if (media) setCaption("");
  }, [media]);
  if (!media) return null;
  const isVideo = String(media.mime || "").startsWith("video");
  // local file from the picker / camera (RN Image needs the file:// scheme)
  const uri = String(media.path || "").startsWith("file://") || String(media.path || "").startsWith("http")
    ? media.path
    : `file://${media.path}`;

  const pickAnother = async () => {
    try {
      const next = await openPicker({ mediaType: "any", cropping: false });
      if (next?.path) onReplace?.(next);
    } catch (e) {
      // cancelled
    }
  };

  return (
    <Modal visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.screen}>
        {isVideo ? (
          <Video source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" controls paused={false} repeat />
        ) : (
          <>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Blur blurType="dark" blurAmount={32} borderRadius={0.01} />
            <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          </>
        )}

        {/* header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Blur blurType="dark" blurAmount={32} borderRadius={0.01} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(18, 18, 18, 0.64)" }]} />
          <View style={styles.headerRow}>
            <TouchableOpacity activeOpacity={0.7} onPress={onCancel} style={styles.back}>
              <Icons family="MaterialSymbolsRounded" name="chevron_left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <CustomText label="Cancel" fontSize={32} fontFamily={fonts.medium} letterSpacing={-0.64} color="#FFFFFF" onPress={onCancel} />
          </View>
        </View>

        {/* footer */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.footerWrap}>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 34) }]}>
            <LinearGradient pointerEvents="none" colors={["rgba(18, 18, 18, 0)", "#121212"]} style={StyleSheet.absoluteFill} />
            <TouchableOpacity activeOpacity={0.7} onPress={pickAnother} style={styles.add}>
              <Blur blurType="dark" blurAmount={32} borderRadius={100} />
              <Icons family="MaterialSymbolsRounded" name="refresh" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.input}>
              <Blur blurType="dark" blurAmount={32} borderRadius={100} />
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Type message"
                placeholderTextColor="rgba(255, 255, 255, 0.48)"
                selectionColor="#A19375"
                style={styles.textInput}
              />
              <TouchableOpacity activeOpacity={0.7} onPress={() => onSend?.(media, caption.trim())} hitSlop={8}>
                <Icons family="MaterialSymbolsRounded" name="send" size={24} color="rgba(255, 255, 255, 0.48)" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default PhotoSharingPreview;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
    overflow: "hidden",
  },
  headerRow: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: "rgba(18, 18, 18, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  footerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  add: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    letterSpacing: -0.16,
    color: "#FFFFFF",
    paddingVertical: 0,
  },
});
