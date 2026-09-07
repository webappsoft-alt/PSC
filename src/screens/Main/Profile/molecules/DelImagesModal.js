import { BlurView } from "@react-native-community/blur";
import moment from "moment";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";

const DelImagesModal = ({
  isVisible,
  onClose,
  selectedPosts = [],
  onDelete,
  onCancel,
  loading = false,
}) => {
  const { colors, themeMode } = useTheme();

  const renderPostItem = ({ item }) => {
    const isMediaTab = !!item?.media;
    const imageUri = isMediaTab ? item.media : item?.images?.[0] || item?.image;
    const caption = isMediaTab
      ? item.description?.[0] || ""
      : item?.description || "Post Caption";
    const date = isMediaTab
      ? moment(item.createdAt).format("DD MMM, YYYY")
      : item?.dateLabel || "12 July, 2025";

    return (
      <View style={styles.postItem}>
        <ImageFast
          source={{ uri: imageUri }}
          style={styles.postImage}
          resizeMode="cover"
        />
        <View style={styles.postInfo}>
          <CustomText
            label={
              caption.length > 30 ? caption.substring(0, 30) + "..." : caption
            }
            fontFamily={fonts.medium}
            numberOfLines={1}
          />
          <CustomText label="Post" color={colors.textSecondary} />
          <CustomText label={date} color={colors.textSecondary} />
        </View>
      </View>
    );
  };

  return (
    <CustomModal
      isBlur
      isVisible={isVisible}
      onDisable={onClose}
      reducedTransparencyFallbackColor="rgba(0,0,0,0.1)"
    >
      <View
        style={{
          margin: 10,
          borderRadius: 26,
          padding: 6,
          overflow: "hidden",
        }}
      >
        {/* Blur Layer */}
        <BlurView
          blurType={themeMode === "dark" ? "dark" : "light"}
          blurAmount={10}
          reducedTransparencyFallbackColor="#FFFFFF29"
          style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]}
        />
        <View
          style={[styles.modalContainer, { backgroundColor: colors.card }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <CustomText
              label={`Delete ${selectedPosts.length} Media`}
              fontFamily={fonts.semiBold}
              fontSize={24}
              color={colors.text}
            />
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surfaceAlt }]}
            >
              <Icons
                name="close"
                family="AntDesign"
                color={colors.text}
                size={16}
              />
            </TouchableOpacity>
          </View>

          {/* Note */}
          <CustomText
            label="*Note that you will lose all these media."
            color={colors.textSecondary}
            fontSize={14}
            marginBottom={18}
          />

          {/* Active Posts Section */}
          <CustomText
            label="ACTIVE POSTS"
            fontFamily={fonts.semiBold}
            color={colors.textSecondary}
            marginBottom={6}
          />

          <FlatList
            data={selectedPosts}
            renderItem={renderPostItem}
            keyExtractor={(item) => item._id}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            style={{ maxHeight: 300 }}
          />

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteButton, loading && { opacity: 0.7 }]}
            onPress={onDelete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <CustomText
                label="Delete These Media"
                fontFamily={fonts.semiBold}
                fontSize={16}
                color={COLORS.white}
              />
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.surfaceAlt }]}
            onPress={onCancel || onClose}
          >
            <CustomText
              label="Cancel"
              fontFamily={fonts.semiBold}
              fontSize={16}
              color={colors.text}
            />
          </TouchableOpacity>

          {/* Disclaimer */}
          <View style={styles.disclaimerRow}>
            <Icons
              name="information-circle-outline"
              family="Ionicons"
              color={colors.textSecondary}
              size={14}
            />
            <CustomText
              label="Deleting these Media now will be "
              color={colors.textSecondary}
              fontSize={12}
            />
            <CustomText
              label="definitive."
              fontFamily={fonts.medium}
              color={colors.text}
              fontSize={12}
            />
          </View>
        </View>
      </View>
    </CustomModal>
  );
};

export default DelImagesModal;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: COLORS.black,
    borderRadius: 24,
    width: "100%",
    alignSelf: "center",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  postItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  postImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.gray,
  },
  postInfo: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: COLORS.red1,
    paddingVertical: 16,
    borderRadius: 99,
    alignItems: "center",
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 16,
    borderRadius: 99,
    alignItems: "center",
    marginTop: 12,
  },
  disclaimerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 4,
  },
});
