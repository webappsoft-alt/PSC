import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  DeviceEventEmitter,
  Image,
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

const RepostModal = ({
  item,
  isVisible,
  onClose,
  postImage,
  username,
  date,
  onRepost,
  onRespond,
  onUseMedia,
}) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

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

  const handleRepostAction = async () => {
    if (loading) return;

    try {
      if (!item?._id) {
        ToastMessage("Post ID not found", "error");
        return;
      }

      onClose();
      ToastMessage("Reposting...", "info");
      setLoading(true);

      const payload = {
        description: item?.description || [],
        images: item?.images || [],
        size: item?.size || "1:1 ratio",
        topic: item?.topic,
        ageRating: item?.ageRating,
        mentions: item?.mentions || [],
        hashtags: item?.hashtags || [],
        location: item?.location,
        sponsoredBy: item?.sponsoredBy || [],
        availableTo: item?.availableTo || ["public"],
        privacy: item?.privacy,
        makeItContinuous: item?.makeItContinuous ?? true,
        parentPostId: item?._id,
      };

      const response = await post("posts", payload);

      if (response?.data?.success) {
        ToastMessage("Reposted successfully", "success");
        // Trigger refresh on Home screen
        DeviceEventEmitter.emit("uploadCompleted");

        // Call the onRepost prop if needed
        if (typeof onRepost === "function") {
          onRepost();
        }
      } else {
        const errorMsg =
          response?.data?.message || response?.message || "Failed to repost";
        ToastMessage(errorMsg, "error");
      }
    } catch (error) {
      console.error("Repost error:", error);
      ToastMessage("An error occurred during repost", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRespondAction = () => {
    onClose();
    navigation.navigate("CreatePost", {
      postData: item,
      parentPostId: item?._id,
    });
  };

  const handleUseMediaAction = () => {
    onClose();
    navigation.navigate("CreatePost", {
      postData: {
        images: item?.images || [],
      },
      parentPostId: item?._id,
    });
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
              style={[styles.actionItem, loading && { opacity: 0.5 }]}
              onPress={handleRepostAction}
              disabled={loading}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
                <Image source={Images.repostRepost} style={[styles.icon, { tintColor: colors.text }]} />
              </View>
              <CustomText
                label="Repost"
                fontFamily={fonts.medium}
                fontSize={16}
                color={colors.textSecondary}
                marginTop={8}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleRespondAction}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
                <Image source={Images.chatRepost} style={[styles.icon, { tintColor: colors.text }]} />
              </View>
              <CustomText
                label="Respond"
                fontFamily={fonts.medium}
                fontSize={16}
                color={colors.textSecondary}
                marginTop={8}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleUseMediaAction}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
                <Image source={Images.media} style={[styles.icon, { tintColor: colors.text }]} />
              </View>
              <CustomText
                label="Use Media"
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

export default RepostModal;

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
