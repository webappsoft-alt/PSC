import { BlurView } from "@react-native-community/blur";
import { useState } from "react";
import { Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const EditModal = ({
  isVisible,
  onClose,
  displayName = "Display Name",
  username = "username",
  userImage = Images.person,
  postCaption = [],
  isOwner = false,
  onEditPress,
  onReschedulePress,
  onDeletePress,
  onHidePost,
  onHideUserPosts,
  user,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [selectedOption, setSelectedOption] = useState(null);

  const userAvatar = user?.profile?.avatar;
  const profileColor = user?.profile?.profileColor || COLORS.gray48;

  // Owner options data
  const ownerOptions = [
    {
      id: "edit",
      icon: Images.editBg || Images.edit,
      title: "Edit Post",
      subtitle: "Fine tune before publishing",
      onPress: onEditPress,
    },
    {
      id: "reschedule",
      icon: Images.clockBg || Images.clock,
      title: "Reschedule",
      subtitle: "Edit date & time",
      onPress: onReschedulePress,
    },
    // {
    //   id: "publish",
    //   icon: Images.checkBg || Images.check,
    //   title: "Publish Now",
    //   subtitle: "You're ready to go!",
    //   onPress: onPublishPress,
    // },
    // {
    //   id: "interact",
    //   icon: Images.handBg || Images.hand,
    //   title: "Who can interact?",
    //   subtitle: "Manage your audience",
    //   onPress: onInteractionPress,
    // },
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
          borderWidth: 1,
          overflow: "hidden",
          borderColor: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.12)",
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
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.userSection}>
              {userAvatar ? (
                <ImageFast source={{ uri: userAvatar }} style={styles.avatar} />
              ) : (
                <View
                  style={[styles.avatar, { backgroundColor: profileColor }]}
                />
              )}
              <View style={styles.userInfo}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <CustomText
                    label={displayName}
                    fontFamily={fonts.medium}
                    fontSize={16}
                    color={colors.text}
                  />
                  {user?.role === "individual" && (
                    <Image
                      source={Images.verified}
                      style={{ width: 14, height: 14, marginLeft: 4 }}
                    />
                  )}
                  {user?.role === "company" && (
                    <Image
                      source={Images.grayStar}
                      style={{ width: 14, height: 14, marginLeft: 4 }}
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

          {/* Post Caption */}
          <View style={[styles.captionSection, { borderBottomColor: colors.surfaceAlt }]}>
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}
            >
              {(postCaption[0] || "Caption goes here.")
                .split(/(@\w+)/g)
                .map((part, index) => {
                  const isMention = part.startsWith("@");
                  return (
                    <CustomText
                      key={index}
                      label={isMention ? part.slice(1) : part}
                      color={isMention ? colors.text : colors.textSecondary}
                      fontSize={14}
                    />
                  );
                })}
            </View>
          </View>

          {isOwner ? (
            /* Owner Options */
            <View style={styles.optionsSection}>
              {ownerOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionRow}
                  onPress={option.onPress}
                >
                  <View style={styles.optionLeft}>
                    <Image source={option.icon} style={styles.optionIcon} />
                    <View>
                      <CustomText
                        label={option.title}
                        fontFamily={fonts.medium}
                        fontSize={14}
                        color={colors.text}
                      />
                      <CustomText
                        label={option.subtitle}
                        color={colors.textSecondary}
                        fontSize={14}
                      />
                    </View>
                  </View>
                  <Image
                    source={Images.forwardIcon}
                    style={styles.forwardIcon}
                  />
                </TouchableOpacity>
              ))}

              {/* Delete Post - Red */}
              <TouchableOpacity
                style={styles.reportRow}
                onPress={onDeletePress}
              >
                <View style={styles.reportLeft}>
                  <Image source={Images.reportBg} style={styles.reportIcon} />
                  <View>
                    <CustomText
                      label="Delete post"
                      fontFamily={fonts.medium}
                      fontSize={15}
                      color="rgba(238, 16, 69, 1)"
                    />
                    <CustomText
                      label="Cannot recover after deletion"
                      color={colors.textSecondary}
                      fontSize={14}
                    />
                  </View>
                </View>
                <Image source={Images.forwardIcon} style={styles.forwardIcon} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Non-Owner Options */
            <>
              <View style={styles.optionsSection}>
                {/* Hide this post option */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    setSelectedOption("hidePost");
                    onHidePost && onHidePost();
                    onClose();
                  }}
                >
                  <View style={styles.optionLeft}>
                    <Image
                      source={Images.hideBg || Images.hide}
                      style={styles.optionIcon}
                    />
                    <View>
                      <CustomText
                        label="Hide this post"
                        fontFamily={fonts.medium}
                        fontSize={14}
                        color={colors.text}
                      />
                      <CustomText
                        label="Hide User's post"
                        color={colors.textSecondary}
                        fontSize={14}
                      />
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      { borderColor: colors.iconMuted },
                      selectedOption === "hidePost" &&
                        styles.radioButtonSelected,
                    ]}
                  >
                    {selectedOption === "hidePost" && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Hide User's posts option */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    setSelectedOption("hideUser");
                    onHideUserPosts && onHideUserPosts();
                    onClose();
                  }}
                >
                  <View style={styles.optionLeft}>
                    <Image
                      source={Images.hideBg || Images.hide}
                      style={styles.optionIcon}
                    />
                    <View>
                      <CustomText
                        label="Hide User's posts"
                        fontFamily={fonts.medium}
                        fontSize={14}
                        color={colors.text}
                      />
                      <CustomText
                        label="Hide User's future posts"
                        color={colors.textSecondary}
                        fontSize={14}
                      />
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      { borderColor: colors.iconMuted },
                      selectedOption === "hideUser" &&
                        styles.radioButtonSelected,
                    ]}
                  >
                    {selectedOption === "hideUser" && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Report Section */}
              <TouchableOpacity
                style={styles.reportRow}
                onPress={() => {
                  Alert.alert(
                    "Report Post",
                    "this post will be hidden and reported to admin",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Confirm",
                        onPress: () => {
                          onHidePost && onHidePost();
                          onClose();
                        },
                      },
                    ],
                  );
                }}
              >
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
                      color={colors.textSecondary}
                      fontSize={14}
                    />
                  </View>
                </View>
                <Image source={Images.forwardIcon} style={styles.forwardIcon} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </CustomModal>
  );
};

export default EditModal;

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
  captionSection: {
    marginTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  optionsSection: {
    marginTop: 16,
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
    tintColor: colors.text,
    marginRight: 8,
  },
  radioButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.iconMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    // borderColor: COLORS.buttonColor,
    // backgroundColor: COLORS.white,
  },
  radioButtonInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: COLORS.buttonColor,
  },
  reportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
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
    marginRight: 8,
  },
  forwardIcon: {
    height: 24,
    width: 24,
    tintColor: colors.iconMuted,
  },
});
