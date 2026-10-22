import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  DeviceEventEmitter,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
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
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

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

  const previewTitle =
    (Array.isArray(item?.description)
      ? item.description[0]
      : item?.description) ||
    username ||
    "Post";

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
      {/* Figma "Repost-options": 104 image r12 · gap 10 · title Medium 14/140%
          · "Post" Regular 14 @64% · date Regular 12 @64%, all centred */}
      <View style={styles.previewContainer}>
        <Image
          source={typeof postImage === "string" ? { uri: postImage } : postImage}
          style={[styles.previewImage, { backgroundColor: colors.surfaceAlt }]}
          resizeMode="cover"
        />
        <View style={styles.previewText}>
          <CustomText
            label={previewTitle}
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

      {/* Figma: row gap 24; item = 64 circle (white 4%, 24 icon) · 16 · label
          Medium 16 / 125% @64% */}
      <View style={styles.actionsRow}>
        <SheetAction
          icon="repeat"
          label="Repost"
          onPress={handleRepostAction}
          disabled={loading}
        />
        <SheetAction
          icon="chat"
          label="Respond"
          onPress={handleRespondAction}
        />
        <SheetAction icon="image" label="Use Media" onPress={handleUseMediaAction} />
      </View>
    </FloatingSheet>
  );
};

export const SheetAction = ({ icon, label, onPress, disabled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.actionItem, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name={icon}
          size={24}
          color={colors.text}
        />
      </View>
      <CustomText
        label={label}
        fontFamily={fonts.medium}
        fontSize={16}
        letterSpacing={-0.5}
        color={COLORS.gray64}
        textAlign="center"
      />
    </TouchableOpacity>
  );
};

export default RepostModal;

const styles = StyleSheet.create({
  // Figma inner: pad L12 T16 R12 B24
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
  // Figma: 64 circle → 16 → label (tight 11 box) ⇒ label centre 85.5 from top
  actionItem: { alignItems: "center", gap: 10, minWidth: 76 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
  },
});
