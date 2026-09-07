import { BlurView } from "@react-native-community/blur";
import { useCallback } from "react";
import {
  Clipboard,
  Image,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
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
  const { colors, isDark } = useTheme();
  const postUrl = `${urlPrefix}${postId}`;
  const externalShareMessage =
    shareMessage || `Check out this post on Private Social Club: ${postUrl}`;

  const trackShare = async () => {
    if (!shouldTrackShare || !postId) return;
    await post(`posts/${postId}/repost`, {
      type: "share",
    });
  };

  const renderBackdrop = useCallback(
    () => (
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      >
        <BlurView
          pointerEvents="none"
          blurType={isDark ? "dark" : "light"}
          blurAmount={10}
          reducedTransparencyFallbackColor={isDark ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={[styles.backdropDim, { backgroundColor: isDark ? "rgba(0,0,0,0.64)" : "rgba(0,0,0,0.3)" }]} />
      </TouchableOpacity>
    ),
    [onClose, isDark],
  );

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
    <CustomModal
      isBlur
      isChange
      isVisible={isVisible}
      onDisable={onClose}
      customBackdrop={renderBackdrop()}
      reducedTransparencyFallbackColor="rgba(0,0,0,0.1)"
    >
      <View
        style={{
          margin: 10,
          borderRadius: 32,
          padding: 4,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.12)",
        }}
      >
        {/* Blur Layer */}
        <BlurView
          blurType={isDark ? "dark" : "light"}
          blurAmount={10}
          reducedTransparencyFallbackColor={isDark ? "#FFFFFF29" : "#00000010"}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]}
        />
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <CustomText
              label="What Do You Want To Do?"
              fontFamily={fonts.semiBold}
              fontSize={16}
              color={colors.text}
            />
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceAlt }]}>
              <Icons
                name="close"
                family="AntDesign"
                color={colors.text}
                size={16}
              />
            </TouchableOpacity>
          </View>

          {/* Post Preview */}
          <View style={styles.previewContainer}>
            <Image
              source={
                typeof postImage === "string" ? { uri: postImage } : postImage
              }
              style={styles.previewImage}
              resizeMode="cover"
            />
            <CustomText label="Post" fontFamily={fonts.medium} marginTop={12} color={colors.text} />
            <CustomText label={`By ${username}`} color={colors.textSecondary} />
            <CustomText label={date} color={colors.textSecondary} fontSize={12} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleShareToStory}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
                <Image source={Images.shareTo} style={[styles.icon, { tintColor: colors.text }]} />
              </View>
              <CustomText
                label="Share To"
                fontFamily={fonts.medium}
                fontSize={16}
                color={colors.textSecondary}
                marginTop={8}
              />
              <CustomText
                label="Story"
                fontFamily={fonts.medium}
                fontSize={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleCopyLink}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
                <Image source={Images.copy} style={[styles.icon, { tintColor: colors.text }]} />
              </View>
              <CustomText
                label="Copy Link"
                fontFamily={fonts.medium}
                fontSize={16}
                color={colors.textSecondary}
                marginTop={8}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleShareExternally}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
                <Image source={Images.shareUp} style={[styles.icon, { tintColor: colors.text }]} />
              </View>
              <CustomText
                label="Externally"
                fontFamily={fonts.medium}
                fontSize={16}
                color={colors.textSecondary}
                marginTop={8}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </CustomModal>
  );
};

export default ShareModal;

const styles = StyleSheet.create({
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.64)",
  },
  modalContainer: {
    backgroundColor: COLORS.black,
    borderRadius: 28,
    width: "100%",
    alignSelf: "center",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: COLORS.gray,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  actionItem: {
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    height: 32,
    width: 32,
  },
});
