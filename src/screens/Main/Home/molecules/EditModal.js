import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import CustomText from "../../../../components/CustomText";
import FloatingSheet, {
  SheetCloseButton,
  SheetOptionRow,
  SheetUserHeader,
} from "../../../../components/FloatingSheet";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";

/**
 * Figma "Post-more-options" (other user's post) and
 * "Schedule-post-more-options" (own post):
 * glass sheet · user header (32 avatar) · caption (Regular 16 / 125% @64%)
 * · 1px line · option rows (48, gap 6).
 */
const EditModal = ({
  isVisible,
  onClose,
  displayName = "Display Name",
  username = "username",
  postCaption = [],
  isOwner = false,
  onEditPress,
  onReschedulePress,
  onDeletePress,
  onHidePost,
  onHideUserPosts,
  user,
}) => {
  const { colors } = useTheme();
  const [selectedOption, setSelectedOption] = useState(null);

  const captionRaw = Array.isArray(postCaption)
    ? postCaption[0]
    : postCaption;
  const caption = captionRaw || "Caption goes here.";

  const handleReport = () => {
    Alert.alert(
      "Report Post",
      "this post will be hidden and reported to admin",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            onHidePost && onHidePost();
            onClose();
          },
        },
      ],
    );
  };

  return (
    <FloatingSheet
      visible={isVisible}
      onDismiss={onClose}
      // Figma inner gap 20 with tight text boxes: caption centre 41.5 below the
      // header centre, line 25.5 below that, options 20 below the line.
      gap={14}
      header={
        <SheetUserHeader
          avatar={user?.profile?.avatar}
          profileColor={user?.profile?.profileColor}
          displayName={displayName}
          username={username}
          role={user?.role}
          right={<SheetCloseButton onPress={onClose} />}
        />
      }
    >
      {/* Figma: caption Regular 16 / 125% / −0.5px @64%, 2 lines max */}
      <CustomText
        label={caption}
        fontSize={16}
        letterSpacing={-0.5}
        color={COLORS.gray64}
        numberOfLines={2}
      />
      <View style={[styles.divider, { backgroundColor: colors.surfaceAlt }]} />

      <View style={styles.options}>
        {isOwner ? (
          <>
            <SheetOptionRow
              icon="edit"
              iconFamily="MaterialSymbolsRoundedFilled"
              title="Edit Post"
              subtitle="Fine tune before publishing"
              onPress={onEditPress}
            />
            <SheetOptionRow
              icon="schedule"
              title="Reschedule"
              subtitle="Edit date & time"
              onPress={onReschedulePress}
            />
            <SheetOptionRow
              icon="error"
              iconFamily="MaterialSymbolsRoundedFilled"
              danger
              title="Delete post"
              subtitle="Cannot recover after deletion"
              onPress={onDeletePress}
            />
          </>
        ) : (
          <>
            <SheetOptionRow
              icon="visibility_off"
              iconFamily="MaterialSymbolsRoundedFilled"
              title="Hide this post"
              subtitle="Hide User's post"
              trailing="radio"
              selected={selectedOption === "hidePost"}
              onPress={() => {
                setSelectedOption("hidePost");
                onHidePost && onHidePost();
                onClose();
              }}
            />
            <SheetOptionRow
              icon="visibility_off"
              iconFamily="MaterialSymbolsRoundedFilled"
              title="Hide User's posts"
              subtitle="Hide User's future posts"
              trailing="radio"
              selected={selectedOption === "hideUser"}
              onPress={() => {
                setSelectedOption("hideUser");
                onHideUserPosts && onHideUserPosts();
                onClose();
              }}
            />
            <SheetOptionRow
              icon="error"
              iconFamily="MaterialSymbolsRoundedFilled"
              danger
              title="Report this post"
              subtitle="Reports are anonymous"
              onPress={handleReport}
            />
          </>
        )}
      </View>
    </FloatingSheet>
  );
};

export default EditModal;

const styles = StyleSheet.create({
  divider: { height: 1, width: "100%", marginTop: 1 },
  options: { gap: 6, marginTop: 6 },
});
