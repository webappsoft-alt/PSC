import { BlurView } from "@react-native-community/blur";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const SummaryMore = ({
  isVisible,
  onClose,
  onViewProfile,
  onSendMessage,
  onRemoveFriend,
  onReportPost,
  userId,
  isFollowing,
}) => {
  const { colors, isDark } = useTheme();
  const { userData } = useSelector((state) => state.users);

  const menuOptions = [
    ...(userData?._id !== userId
      ? [
          {
            id: "sendMessage",
            icon: Images.commentReply,
            label: "Send a message",
            onPress: onSendMessage,
            showArrow: true,
          },
        ]
      : []),

    {
      id: "viewProfile",
      icon: Images.commentEye,
      label: "View profile",
      onPress: onViewProfile,
      showArrow: true,
    },

    ...(userData?._id !== userId
      ? [
          {
            id: "removeFriend",
            icon: Images.commentFriend,
            label: isFollowing ? "Remove Friend" : "Follow User",
            onPress: onRemoveFriend,
            showArrow: true,
          },
        ]
      : []),
  ];

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
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.12)",
        }}
      >
        <BlurView
          blurType={isDark ? "dark" : "light"}
          blurAmount={10}
          reducedTransparencyFallbackColor={isDark ? "#FFFFFF29" : "#00000010"}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]}
        />
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Menu Options */}
          <View style={styles.optionsSection}>
            {menuOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionRow}
                onPress={option.onPress}
              >
                <View style={styles.optionLeft}>
                  <Image source={option.icon} style={[styles.optionIcon, { tintColor: colors.text }]} />
                  <View style={styles.optionTextContainer}>
                    <CustomText
                      label={option.label}
                      fontFamily={fonts.medium}
                      fontSize={15}
                      color={colors.text}
                    />
                  </View>
                </View>
                {option.showArrow && (
                  <Image
                    source={Images.forwardIcon}
                    style={[styles.forwardIcon, { tintColor: colors.iconMuted }]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Report Section */}
          {/* <TouchableOpacity style={styles.reportRow} onPress={onReportPost}>
            <View style={styles.reportLeft}>
              <Image source={Images.reportBg} style={styles.reportIcon} />
              <View>
                <CustomText
                  label="Report this post"
                  fontFamily={fonts.medium}
                  fontSize={15}
                  color="rgba(238, 16, 69, 1)"
                />
                <CustomText
                  label="Reports are anonymous"
                  color={"rgba(255, 255, 255, 0.64)"}
                  fontSize={14}
                  marginTop={2}
                />
              </View>
            </View>
            <Image source={Images.forwardIcon} style={styles.forwardIconRed} />
          </TouchableOpacity> */}
        </View>
      </View>
    </CustomModal>
  );
};

export default SummaryMore;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: COLORS.black,
    borderRadius: 28,
    width: "100%",
    alignSelf: "center",
    padding: 12,
    // paddingVertical: 1,
  },
  optionsSection: {
    gap: 4,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    height: 40,
    width: 40,
    tintColor: COLORS.white,
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  forwardIcon: {
    height: 24,
    width: 24,
    tintColor: "rgba(255, 255, 255, 0.64)",
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
