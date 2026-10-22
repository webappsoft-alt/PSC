import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import FloatingSheet, {
  SheetOptionRow,
} from "../../../../components/FloatingSheet";
import { COLORS } from "../../../../utils/COLORS";

/**
 * Figma "More-options": glass sheet with option rows only (no header):
 * Send a message · View story · View profile · Remove Friend · Report this post.
 * Rows 48, gap 20 (centres 68 apart); icons filled @64%, report red.
 */
const SummaryMore = ({
  isVisible,
  onClose,
  onViewProfile,
  onViewStory,
  onSendMessage,
  onRemoveFriend,
  onReportPost,
  userId,
  isFollowing,
}) => {
  const { userData } = useSelector((state) => state.users);
  const isSelf = userData?._id === userId;

  return (
    <FloatingSheet visible={isVisible} onDismiss={onClose} header={<View />} gap={0}>
      <View style={styles.options}>
        {!isSelf ? (
          <SheetOptionRow
            icon="chat_bubble"
            iconFamily="MaterialSymbolsRoundedFilled"
            iconColor={COLORS.gray64}
            title="Send a message"
            onPress={onSendMessage}
          />
        ) : null}
        {onViewStory ? (
          <SheetOptionRow
            icon="visibility"
            iconFamily="MaterialSymbolsRoundedFilled"
            iconColor={COLORS.gray64}
            title="View story"
            onPress={onViewStory}
          />
        ) : null}
        <SheetOptionRow
          icon="visibility"
          iconFamily="MaterialSymbolsRoundedFilled"
          iconColor={COLORS.gray64}
          title="View profile"
          onPress={onViewProfile}
        />
        {!isSelf ? (
          <SheetOptionRow
            icon={isFollowing ? "person_remove" : "person_add"}
            iconFamily="MaterialSymbolsRoundedFilled"
            iconColor={COLORS.gray64}
            title={isFollowing ? "Remove Friend" : "Follow User"}
            onPress={onRemoveFriend}
          />
        ) : null}
        {!isSelf && onReportPost ? (
          <SheetOptionRow
            icon="error"
            iconFamily="MaterialSymbolsRoundedFilled"
            danger
            title="Report this post"
            subtitle="Reports are anonymous"
            onPress={onReportPost}
          />
        ) : null}
      </View>
    </FloatingSheet>
  );
};

export default SummaryMore;

const styles = StyleSheet.create({
  options: { gap: 20 },
});
