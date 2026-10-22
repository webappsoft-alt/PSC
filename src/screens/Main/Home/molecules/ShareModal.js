import { Clipboard, Image, Share, StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import { SheetAction } from "./RepostModal";
import { post } from "../../../../services/ApiRequest";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";
import { useTheme } from "../../../../contexts/ThemeContext";

const ShareModal = ({
  isVisible,
  onClose,
  postImage,
  username,
  date,
  onShareToStory,
  onCopyLink,
  onShareExternally,
  postId,
  urlPrefix = "psc://post/",
  shouldTrackShare = true,
  shareMessage,
}) => {
  const { colors } = useTheme();
  const postUrl = `${urlPrefix}${postId}`;
  const externalShareMessage =
    shareMessage || `Check out this post on Private Social Club: ${postUrl}`;

  const trackShare = async () => {
    if (!shouldTrackShare || !postId) return;
    await post(`posts/${postId}/repost`, {
      type: "share",
    });
  };

  const handleCopyLink = async () => {
    onClose();
    ToastMessage("Copying link...", "info");
    try {
      await trackShare();
      Clipboard.setString(postUrl);
      ToastMessage("Link copied to clipboard", "success");
      if (onCopyLink) onCopyLink();
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const handleShareToStory = () => {
    onClose();
    ToastMessage("Sharing to story...", "info");
    if (onShareToStory) onShareToStory();
  };

  const handleShareExternally = async () => {
    onClose();
    ToastMessage("Opening share menu...", "info");
    try {
      await trackShare();
      Clipboard.setString(postUrl);
      const result = await Share.share({
        message: externalShareMessage,
        url: postUrl,
      });
      if (onShareExternally) onShareExternally(result);
    } catch (error) {
      console.error("Error sharing externally:", error);
    }
  };

  return (
    <FloatingSheet
      visible={isVisible}
      onDismiss={onClose}
      title="What Do You Want To Do?"
      titleSize="sm"
      // Figma: header 56 (pad 12) → content pad T16 → preview … gap 32 … actions
      // → pad B24; with RN line boxes (1.4) the same centres need 28 / 18.
      gap={28}
      innerStyle={styles.inner}
    >
      {/* Same layout as Figma "Repost-options" */}
      <View style={styles.previewContainer}>
        <Image
          source={typeof postImage === "string" ? { uri: postImage } : postImage}
          style={[styles.previewImage, { backgroundColor: colors.surfaceAlt }]}
          resizeMode="cover"
        />
        <View style={styles.previewText}>
          <CustomText
            label={username || "Post"}
            fontFamily={fonts.medium}
            fontSize={14}
            letterSpacing={-0.07}
            color={colors.text}
            textAlign="center"
            numberOfLines={1}
          />
          <CustomText
            label="Post"
            fontSize={14}
            letterSpacing={-0.07}
            color={COLORS.gray64}
            textAlign="center"
          />
          <CustomText
            label={date}
            fontSize={12}
            letterSpacing={-0.06}
            color={COLORS.gray64}
            textAlign="center"
            marginTop={-1}
          />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <SheetAction icon="auto_stories" label="Story" onPress={handleShareToStory} />
        <SheetAction icon="link" label="Copy Link" onPress={handleCopyLink} />
        <SheetAction icon="ios_share" label="Externally" onPress={handleShareExternally} />
      </View>
    </FloatingSheet>
  );
};

export default ShareModal;

const styles = StyleSheet.create({
  inner: { paddingTop: 12, paddingBottom: 18 },
  // Figma: image → 12 → text column (gap 8, tight boxes) ⇒ centres at 17/35/52
  previewContainer: { alignItems: "center", gap: 6 },
  previewImage: { width: 104, height: 104, borderRadius: 12 },
  previewText: { alignItems: "center" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
});
