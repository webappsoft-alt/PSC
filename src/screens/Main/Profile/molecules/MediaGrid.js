import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";

const { width } = Dimensions.get("window");
const IMAGE_SIZE = width / 3;

const MediaGrid = ({
  mediaData = [],
  onDeletePress,
  onImagePress,
  marginBottom,
  onEditModeChange,
  onSelectionChange,
}) => {
  const { colors } = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setSelectedItems([]);
    }
  };

  const toggleSelection = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleDeletePress = () => {
    const selectedPosts = mediaData.filter((item) =>
      selectedItems.includes(item.id),
    );
    onDeletePress?.(selectedPosts);
  };

  // Notify parent of edit mode and selection changes
  useEffect(() => {
    onEditModeChange?.(isEditMode);
  }, [isEditMode]);

  useEffect(() => {
    onSelectionChange?.(selectedItems, handleDeletePress);
  }, [selectedItems]);

  const renderItem = ({ item, index }) => {
    const isSelected = selectedItems.includes(item.id);
    const imageUri = item.uri;

    return (
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() =>
          isEditMode ? toggleSelection(item.id) : onImagePress?.(item)
        }
        activeOpacity={0.8}
      >
        <ImageFast
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Overlay icons (pin, eye, etc.) */}
        {item.isPinned && (
          <View style={styles.iconBadge}>
            <Image source={Images.pin} style={styles.smallIcon} />
          </View>
        )}

        {item.isFeatured && (
          <View style={[styles.iconBadge, { left: 36 }]}>
            <Image source={Images.star} style={styles.smallIcon} />
          </View>
        )}

        {/* Bottom info overlay */}
        {item.likesCount !== undefined && (
          <View style={styles.bottomOverlay}>
            <View style={styles.statRow}>
              <Image source={Images.heart} style={styles.statIcon} />
              <CustomText
                label={item.likesCount || 0}
                fontSize={12}
                color={COLORS.white}
              />
            </View>
            <View style={styles.statRow}>
              <Image source={Images.chat} style={styles.statIcon} />
              <CustomText
                label={item.commentsCount || 0}
                fontSize={12}
                color={COLORS.white}
              />
            </View>
          </View>
        )}

        {item.createdAt && (
          <View style={styles.dateOverlay}>
            <CustomText
              label={item.dateLabel || "10 Sept, 2025"}
              fontSize={10}
              color={COLORS.white}
            />
          </View>
        )}

        {item.isNew && (
          <View style={styles.newBadge}>
            <CustomText label="NEW" fontSize={10} fontFamily={fonts.bold} />
          </View>
        )}

        {isEditMode && (
          <View style={styles.radioContainer}>
            <View style={[!isSelected && styles.radioOuter]}>
              {isSelected && (
                <Icons
                  name="checkmark-circle"
                  family="Ionicons"
                  size={26}
                  color={COLORS.white}
                />
              )}
            </View>
          </View>
        )}

        {/* Hidden overlay */}
        {item.isHidden && (
          <View style={styles.hiddenOverlay}>
            <Image source={Images.hideBg} style={styles.hiddenIcon} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { marginBottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={Images.mostRecent}
            style={{ height: 20, width: 20, tintColor: colors.text }}
          />
          <CustomText label="Most Recent" fontFamily={fonts.medium} />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleEditMode}>
            <Image
              source={Images.edit}
              style={[
                styles.headerIcon,
                { tintColor: isEditMode ? colors.textSecondary : colors.text },
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={Images.gridProfile}
              style={[styles.headerIcon, { tintColor: colors.text }]}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={Images.lock}
              style={[styles.headerIcon, { tintColor: colors.text }]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={mediaData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CustomText
              label="No Media Found"
              color={colors.textSecondary}
              fontSize={16}
              textAlign={"center"}
            />
          </View>
        }
      />
    </View>
  );
};

export default MediaGrid;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.white,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  iconBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
  smallIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.white,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 24,
    left: 8,
    flexDirection: "row",
    gap: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statIcon: {
    width: 12,
    height: 12,
    tintColor: COLORS.white,
  },
  dateOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
  },
  newBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  radioContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    // borderColor: COLORS.buttonColor,
    // backgroundColor: COLORS.white,
  },
  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  hiddenIcon: {
    width: 40,
    height: 40,
    tintColor: COLORS.gray2,
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.gray64,
    height: 52,
    width: 52,
    borderRadius: 99,
    position: "absolute",
    bottom: 8,
    right: "50%",
    left: "50%",
    transform: [{ translateX: -26 }, { translateY: -26 }],
  },
  deleteInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    height: 40,
    width: 40,
    borderRadius: 99,
  },
  deleteIcon: {
    width: 20,
    height: 20,
  },
  emptyContainer: {
    marginTop: 60,
    justifyContent: "center",
    alignItems: "center",
  },
});
