import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const CreatorSummary = ({ isVisible, onClose, onMore, user }) => {
  const { colors, isDark } = useTheme();
  const naviagtion = useNavigation();
  const [tab, setTab] = useState(0);

  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Display Name";
  const username = user?.username || "username";
  const userAvatar = user?.profile?.avatar;
  const profileColor = user?.profile?.profileColor || COLORS.gray48;
  const isVerified = user?.role === "individual" || user?.role === "company"; // Base verification logic on role presence

  const location =
    user?.location?.city && user?.location?.country
      ? `${user.location.city}, ${user.location.country}`
      : user?.location?.city || user?.location?.country || null;

  const occupation = user?.occupation?.jobTitle || null;
  const company = user?.occupation?.company || null;

  const education = user?.education?.[0];
  const degree = education?.degree || null;
  const major = education?.primaryMajor || null;
  const school = education?.school || null;

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
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.16)"
            : "rgba(0, 0, 0, 0.12)",
        }}
      >
        <BlurView
          blurType={isDark ? "dark" : "light"}
          blurAmount={10}
          reducedTransparencyFallbackColor={isDark ? "#FFFFFF29" : "#00000010"}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]}
        />
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                onClose();
                setTimeout(() => {
                  naviagtion.navigate("UserProfile", { userId: user?._id });
                }, 600);
              }}
              style={styles.userSection}
            >
              {userAvatar ? (
                <ImageFast source={{ uri: userAvatar }} style={styles.avatar} />
              ) : (
                <View
                  style={[styles.avatar, { backgroundColor: profileColor }]}
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
                  {user?.role === "individual" && (
                    <Image
                      source={Images.verified}
                      style={styles.verifiedBadge}
                    />
                  )}
                  {user?.role === "company" && (
                    <Image
                      source={Images.grayStar}
                      style={styles.verifiedBadge}
                    />
                  )}
                </View>
                <CustomText
                  label={`${username}`}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              {/* <TouchableOpacity onPress={onMore} style={styles.iconButton}> */}
              <TouchableOpacity onPress={onMore}>
                <Image
                  source={Images.moreGray}
                  style={[styles.actionIcon, { tintColor: colors.text }]}
                />
              </TouchableOpacity>
              {/* </TouchableOpacity> */}
              <TouchableOpacity onPress={onClose}>
                <Image
                  source={Images.crossBg || Images.cross}
                  style={[styles.actionIcon, { tintColor: colors.text }]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            {/* Location */}
            {location && (
              <View style={styles.row}>
                <Image
                  source={Images.LocationPin}
                  style={[styles.smallIcon, { tintColor: "#007BFF" }]}
                />
                <CustomText
                  label={location}
                  color={"#007BFF"}
                  fontFamily={fonts.medium}
                />
              </View>
            )}

            {/* Work */}
            {occupation && company && (
              <View style={styles.row}>
                <Image
                  source={Images.suitcase}
                  style={[styles.smallIcon, { tintColor: colors.text }]}
                />
                {occupation && (
                  <CustomText
                    label={occupation}
                    fontFamily={fonts.medium}
                    fontSize={14}
                    color={colors.text}
                  />
                )}
                {occupation && company && (
                  <CustomText
                    label=" at "
                    fontFamily={fonts.medium}
                    fontSize={14}
                    color={colors.textSecondary}
                    style={{ marginHorizontal: 4 }}
                  />
                )}
                {company && (
                  <>
                    <Image
                      source={Images.company}
                      style={[
                        styles.smallIcon,
                        {
                          width: 14,
                          height: 14,
                          borderRadius: 99,
                          tintColor: colors.text,
                        },
                      ]}
                    />
                    <CustomText
                      label={company}
                      fontFamily={fonts.medium}
                      fontSize={14}
                      color={colors.text}
                    />
                  </>
                )}
              </View>
            )}

            {/* Education */}
            {degree && major && school && (
              <View style={styles.row}>
                <Image
                  source={Images.educationCap}
                  style={[styles.smallIcon, { tintColor: colors.text }]}
                />
                {degree && (
                  <CustomText
                    label={degree}
                    fontFamily={fonts.medium}
                    fontSize={14}
                    color={colors.text}
                  />
                )}
                {degree && major && (
                  <CustomText
                    label=" in "
                    fontFamily={fonts.medium}
                    fontSize={14}
                    color={colors.textSecondary}
                    style={{ marginHorizontal: 4 }}
                  />
                )}
                {major && (
                  <CustomText
                    label={major}
                    fontFamily={fonts.medium}
                    fontSize={14}
                    color={colors.text}
                  />
                )}
                {(degree || major) && school && (
                  <CustomText
                    label=" from "
                    fontFamily={fonts.medium}
                    fontSize={14}
                    color={colors.textSecondary}
                    style={{ marginHorizontal: 4 }}
                  />
                )}
                {school && (
                  <CustomText
                    label={school}
                    fontFamily={fonts.medium}
                    fontSize={14}
                    color={colors.text}
                  />
                )}
              </View>
            )}
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <CustomText
                label={user?.stats?.upvotes || "0"}
                fontFamily={fonts.medium}
                fontSize={18}
                color={colors.text}
              />
              <CustomText label="Likes" color={colors.textSecondary} />
            </View>
            <View style={styles.statItem}>
              <CustomText
                label={user?.postsCount || "0"}
                fontFamily={fonts.medium}
                fontSize={18}
                color={colors.text}
              />
              <CustomText label="Posts" color={colors.textSecondary} />
            </View>
            <View style={styles.statItem}>
              <CustomText
                label={user?.followersCount || "0"}
                fontFamily={fonts.medium}
                fontSize={18}
                color={colors.text}
              />
              <CustomText label="Followers" color={colors.textSecondary} />
            </View>
            <View style={styles.statItem}>
              <CustomText
                label={user?.subsCount || "0"}
                fontFamily={fonts.medium}
                fontSize={18}
                color={colors.text}
              />
              <CustomText label="Followings" color={colors.textSecondary} />
            </View>
          </View>

          {/* In Common Section */}
          {/* <View style={styles.inCommonContainer}>
            <CustomText
              label="In common"
              color={COLORS.gray48}
              marginRight={4}
            />
            <View style={styles.avatarsRow}>
              {[1, 2, 3].map((_, index) => (
                <ImageFast
                  key={index}
                  source={Images.person}
                  style={[
                    styles.commonAvatar,
                    { marginLeft: index > 0 ? -10 : 0, zIndex: 3 - index },
                  ]}
                />
              ))}
            </View>
          </View> */}

          {/* Bio Section */}
          <View style={styles.bioSection}>
            <CustomText
              label={user?.profile?.bio || user?.bio || "No bio available"}
              color={colors.textSecondary}
              fontSize={16}
            />
          </View>
        </View>
      </View>
    </CustomModal>
  );
};

export default CreatorSummary;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: COLORS.black, // Fallback or main background
    borderRadius: 28,
    width: "100%",
    alignSelf: "center",
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
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
    backgroundColor: COLORS.inputBg,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: {
    height: 32,
    width: 32,
  },
  detailsSection: {
    gap: 6,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
    marginRight: 8,
    tintColor: COLORS.white,
  },
  statsContainer: {
    flexDirection: "row",
    // justifyContent: "space-between",
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: "center",
    width: 73,
  },
  inCommonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  commonAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  bioSection: {
    marginBottom: 8,
  },
});
