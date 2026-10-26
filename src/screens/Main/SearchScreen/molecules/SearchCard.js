import { useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import UserBadge from "../../../../components/UserBadge";
import CustomText from "../../../../components/CustomText";
import Divider from "../../../../components/Divider";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const SearchCard = ({
  isChange,
  user,
  following,
  onFollow,
  onUnfollow,
  isRequestsTab,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
  item,
  onPress,
  isSelf, // the signed-in user's own row (e.g. in someone's followers list)
}) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  if (!user && isChange) return null;

  // Use item data if not in "change" (user search) mode
  const postTopic = item?.tag || "Topic";
  const postStats = item?.stats?.impressions || 0;
  const postDaily = item?.count || 0;
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <ImageFast
          source={
            isChange
              ? user?.profile?.avatar
                ? { uri: user.profile.avatar }
                : user?.profilePicture && { uri: user?.profilePicture }
              : Images.PostDemo
          }
          style={{
            height: 56,
            width: 56,
            borderRadius: isChange ? 99 : 12,
            backgroundColor:
              isChange &&
              !user?.profile?.avatar &&
              !user?.profilePicture &&
              user?.profile?.profileColor,
          }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={isChange && styles.row}>
            <CustomText
              label={
                isChange ? `${user?.firstName} ${user?.lastName}` : postTopic
              }
              fontFamily={fonts.medium}
              fontSize={14}
            />
            {isChange && (
              <View style={[styles.row, { gap: 2 }]}>
                {/* shield (verified blue / unverified grey) + Premium / Premium+ star */}
                <UserBadge user={user} />
                <View
                  style={[
                    styles.userContainer,
                    { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <CustomText
                    label={isChange ? `${user?.username}` : "12.5K posts"}
                    color={isDark ? COLORS.gray64 : colors.textSecondary}
                    fontSize={10}
                  />
                </View>
              </View>
            )}
          </View>
          <View style={styles.row}>
            {isChange && (
              <CustomText
                label={user?.occupation?.jobTitle}
                fontSize={12}
                color={isDark ? COLORS.gray64 : colors.textSecondary}
              />
            )}
            {isChange && (
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isDark
                      ? COLORS.gray64
                      : colors.textSecondary,
                  },
                ]}
              />
            )}

            <CustomText
              label={
                isChange ? `${user?.followersCount || 0}` : `${postStats} posts`
              }
              fontSize={isChange ? 10 : 12}
              color={isDark ? COLORS.gray64 : colors.textSecondary}
            />
            {isChange && (
              <Image
                source={Images.friendGray}
                style={[
                  styles.icon,
                  {
                    tintColor: colors.text,
                  },
                ]}
              />
            )}
          </View>
          {isChange ? (
            <View style={styles.row}>
              {user?.industry?.slice(0, 3).map((industry, index) => (
                <View style={styles.row} key={index}>
                  <CustomText
                    label={industry}
                    fontSize={10.2}
                    color={isDark ? COLORS.gray64 : colors.textSecondary}
                    textTransform={"capitalize"}
                  />
                  {index < 2 && (
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isDark
                            ? COLORS.gray64
                            : colors.textSecondary,
                        },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <CustomText
              label={`${postDaily} total posts`}
              fontSize={12}
              color={isDark ? COLORS.gray64 : colors.textSecondary}
            />
          )}
        </View>
        {isChange && isSelf ? null : isChange ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isRequestsTab ? (
              <>
                {isRejecting ? (
                  <ActivityIndicator size="small" color={COLORS.buttonColor} />
                ) : (
                  <ImageFast
                    removeLoading
                    onPress={() => onReject?.(user?._id, user?.firstName)}
                    source={Images.crossBg}
                    style={styles.actionIcon}
                  />
                )}
                {isAccepting ? (
                  <ActivityIndicator size="small" color={COLORS.buttonColor} />
                ) : (
                  <ImageFast
                    removeLoading
                    onPress={() => onAccept?.(user?._id, user?.firstName)}
                    source={Images.plusGrayBg}
                    style={styles.actionIcon}
                  />
                )}
              </>
            ) : (
              <>
                <ImageFast
                  removeLoading
                  onPress={() =>
                    navigation.navigate("InboxScreen", {
                      recipientId: user?._id,
                      recipientName: `${user?.firstName} ${user?.lastName}`,
                      otherUser: user,
                    })
                  }
                  source={Images.MyChat}
                  style={styles.messageIcon}
                />
                <ImageFast
                  removeLoading
                  onPress={() => {
                    if (following) {
                      onUnfollow?.(user?._id, user?.firstName);
                    } else {
                      onFollow?.(user?._id, user?.firstName);
                    }
                  }}
                  source={following ? Images.unFollowButton : Images.plusGrayBg}
                  style={styles.actionIcon}
                />
              </>
            )}
          </View>
        ) : (
          <Icons
            name={"chevron-forward-outline"}
            family={"Ionicons"}
            color={isDark ? COLORS.gray64 : colors.iconMuted}
            size={22}
          />
        )}
      </TouchableOpacity>
      <Divider marginVertical={8} />
    </>
  );
};

export default SearchCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  userContainer: {
    padding: 4,
    backgroundColor: COLORS.inputBg,
    borderRadius: 99,
    marginLeft: 2,
  },
  icon: {
    height: 12,
    width: 12,
  },
  dot: {
    height: 4,
    width: 4,
    backgroundColor: COLORS.gray64,
    borderRadius: 99,
    marginHorizontal: 4,
  },
  actionIcon: {
    height: 40,
    width: 40,
  },
  messageIcon: {
    height: 22,
    width: 22,
    marginRight: 4,
  },
});
