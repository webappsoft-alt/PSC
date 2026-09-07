import { BlurView } from "@react-native-community/blur";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const CommentOption = ({
  isVisible,
  onClose,
  displayName = "Display Name",
  username = "username",
  userImage = null,
  profileColor,
  commentText = "Comments goes here.",
  isVerified = true,
  userData,
  commentUserId,
  onPinComment,
  onReply,
  onViewProfile,
  onSendMessage,
  onHideComment,
  onHideUserComments,
  onRemoveFriend,
  onReportComment,
  onEditComment,
  onWhoCanInteract,
  onDeleteComment,
  isPinned,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  // Check if the logged-in user is the comment author
  const isOwner = userData?._id === commentUserId;
  // Menu options for comment owner
  const ownerOptions = [
    {
      id: "pin",
      icon: Images.commentPin,
      label: isPinned ? "Unpin comment" : "Pin comment",
      subtitle: isPinned ? "Remove from top" : "Show at the top",
      onPress: onPinComment,
      showArrow: true,
    },
    {
      id: "edit",
      icon: Images.commentEdit,
      label: "Edit comment",
      subtitle: "Better your comment",
      onPress: onEditComment,
      showArrow: true,
    },
    {
      id: "delete",
      icon: Images.hideBg,
      label: "Delete comment",
      subtitle: "Cannot recover after deletion",
      onPress: onDeleteComment,
      showArrow: true,
      isRed: true,
    },
  ];

  // Menu options for other users
  const otherUserOptions = [
    // {
    //   id: "pin",
    //   icon: Images.commentPin, // Replace with pin icon
    //   label: isPinned ? "Unpin comment" : "Pin comment",
    //   onPress: onPinComment,
    //   showArrow: true,
    // },
    {
      id: "reply",
      icon: Images.commentReply,
      label: "Reply",
      onPress: onReply,
      showArrow: true,
    },
    {
      id: "viewProfile",
      icon: Images.commentEye, // Replace with eye/profile icon
      label: "View profile",
      onPress: onViewProfile,
      showArrow: true,
    },
    {
      id: "sendMessage",
      icon: Images.commentReply, // Replace with message icon
      label: "Send a message",
      onPress: onSendMessage,
      showArrow: true,
    },
    {
      id: "hideComment",
      icon: Images.hideBg, // Replace with hide icon
      label: "Hide this comment",
      subtitle: "Hide User's comment",
      onPress: onHideComment,
      showArrow: true,
    },
    {
      id: "hideUserComments",
      icon: Images.hideBg, // Replace with hide icon
      label: "Hide User's comments",
      subtitle: "Hide future comments",
      onPress: onHideUserComments,
      showArrow: true,
    },
    {
      id: "removeFriend",
      icon: Images.commentFriend, // Replace with remove friend icon
      label: "Remove Friend",
      onPress: onRemoveFriend,
      showArrow: true,
    },
  ];

  // Select options based on ownership
  const menuOptions = isOwner ? ownerOptions : otherUserOptions;

  return (
    <CustomModal
      isBlur
      isChange
      isVisible={isVisible}
      onDisable={onClose}
      reducedTransparencyFallbackColor="rgba(0,0,0,0.1)"
    >
      <View
        style={{
          margin: 10,
          borderRadius: 32,
          padding: 4,
          borderWidth: 1,
          overflow: "hidden",
          borderColor: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.12)",
        }}
      >
        <BlurView
          blurType={isDark ? "dark" : "light"}
          blurAmount={10}
          reducedTransparencyFallbackColor={isDark ? "#FFFFFF29" : "#00000010"}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]}
        />
        <View style={styles.modalContainer}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.userSection}>
              {typeof userImage === "string" && userImage ? (
                <ImageFast source={{ uri: userImage }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: profileColor || colors.surfaceAlt },
                  ]}
                />
              )}
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <CustomText
                    label={displayName}
                    fontFamily={fonts.medium}
                    fontSize={16}
                    color={colors.text}
                  />
                  {isVerified && (
                    <Image
                      source={Images.verified}
                      style={styles.verifiedBadge}
                    />
                  )}
                </View>
                <CustomText
                  label={`${username}`}
                  color={colors.textSecondary}
                  fontSize={14}
                />
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Image
                source={Images.crossBg || Images.cross}
                style={styles.closeIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Comment Text */}
          <View style={styles.commentSection}>
            <CustomText
              label={commentText}
              color={colors.textSecondary}
              fontSize={14}
              marginTop={12}
            />
          </View>

          {/* Menu Options */}
          <View style={styles.optionsSection}>
            {menuOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionRow}
                onPress={option.onPress}
              >
                <View style={option.isRed ? styles.reportLeft : styles.optionLeft}>
                  <Image
                    source={option.icon}
                    style={[
                      styles.optionIcon,
                      option.isRed && { tintColor: "rgba(238, 16, 69, 1)" },
                    ]}
                  />
                  <View style={styles.optionTextContainer}>
                    <CustomText
                      label={option.label}
                      fontFamily={fonts.medium}
                      fontSize={15}
                      color={
                        option.isRed ? "rgba(238, 16, 69, 1)" : colors.text
                      }
                    />
                    {option.subtitle && (
                      <CustomText
                        label={option.subtitle}
                        color={colors.textSecondary}
                        fontSize={14}
                        marginTop={2}
                      />
                    )}
                  </View>
                </View>
                {option.showArrow && (
                  <Image
                    source={Images.forwardIcon}
                    style={[
                      styles.forwardIcon,
                      option.isRed && { tintColor: "rgba(238, 16, 69, 1)" },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Report Section */}

          {!isOwner && (
            <TouchableOpacity
              style={styles.reportRow}
              onPress={onReportComment}
            >
              <View style={styles.reportLeft}>
                <Image source={Images.reportBg} style={styles.reportIcon} />
                <View>
                  <CustomText
                    label="Report this comment"
                    fontFamily={fonts.medium}
                    fontSize={15}
                    color="rgba(238, 16, 69, 1)"
                  />
                  <CustomText
                    label="Reports are anonymous"
                    color={colors.textSecondary}
                    fontSize={14}
                    marginTop={2}
                  />
                </View>
              </View>
              <Image
                source={Images.forwardIcon}
                style={styles.forwardIconRed}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </CustomModal>
  );
};

export default CommentOption;

const createStyles = (colors, isDark) => StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 28,
    width: "100%",
    alignSelf: "center",
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifiedBadge: {
    height: 18,
    width: 18,
    tintColor: COLORS.blue,
  },
  closeButton: {
    padding: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
  },
  closeIcon: {
    height: 32,
    width: 32,
    tintColor: colors.text,
  },
  commentSection: {
    marginTop: 8,
  },
  optionsSection: {
    marginTop: 16,
    gap: 4,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    height: 40,
    width: 40,
    tintColor: colors.text,
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  forwardIcon: {
    height: 24,
    width: 24,
    tintColor: colors.iconMuted,
  },
  forwardIconRed: {
    height: 24,
    width: 24,
    tintColor: "rgba(238, 16, 69, 1)",
  },
  reportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  reportLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reportIcon: {
    height: 40,
    width: 40,
    tintColor: "rgba(238, 16, 69, 1)",
    marginRight: 12,
  },
});
