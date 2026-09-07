import { StyleSheet, TouchableOpacity, Image, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";

import ImageFastViewer from "../../../../components/ImageFastViewer";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import TopTab from "../../../../components/TopTab";
import { useTheme } from "../../../../contexts/ThemeContext";

import { Images } from "../../../../assets/images";
import { COLORS } from "../../../../utils/COLORS";
import fonts from "../../../../assets/fonts";

export default function ProfileCard({
  isUser,
  name,
  jobTitle,
  company,
  location,
  followersCount,
  followingCount,
  tab,
  setTab,
  data,
  isFollowing,
  isFriend,
  onFollowPress,
  isRequested,
  showTopTab = true,
}) {
  const { colors } = useTheme();
  const userDataRedux = useSelector((state) => state.users.userData);
  const locationRedux = useSelector((state) => state.users.location);
  const navigation = useNavigation();
  const user = data || userDataRedux;

  return (
    <View style={styles.container}>
      <View style={[styles.row, { gap: 8, marginBottom: 16 }]}>
        {!user?.profile?.avatar ? (
          <View
            style={{
              borderRadius: 99,
              height: 28,
              width: 28,
              backgroundColor: user?.profile?.profileColor,
            }}
          />
        ) : (
          <ImageFastViewer
            isView
            profile
            user={user}
            isOtherUser={isUser}
            onFollowPress={onFollowPress}
            followText={
              isFriend
                ? "Friend"
                : isFollowing || user?.isRequestApproved === true
                ? "Following"
                : user?.isRequestApproved === false
                ? "Request Sent"
                : isRequested
                ? "Requested"
                : "Follow"
            }
            name={name}
            source={{ uri: user.profile.avatar }}
            style={styles.profileImage}
          />
        )}
        <CustomText
          label={name}
          fontFamily={fonts.semiBold}
          fontSize={24}
          textTransform={"capitalize"}
          color={colors.text}
        />
      </View>

      <View style={[[styles.row, { flexWrap: "wrap" }]]}>
        <Image
          source={Images.suitcase}
          style={[styles.icon, { tintColor: colors.textSecondary }]}
        />
        <CustomText
          label={`${jobTitle} at`}
          fontFamily={fonts.medium}
          color={colors.textSecondary}
        />
        <CustomText
          label={company}
          fontFamily={fonts.medium}
          color={colors.text}
        />
      </View>
      {user?.education?.length > 0 && (
        <View style={[styles.row, { marginTop: 2, flexWrap: "wrap" }]}>
          <Image
            source={Images.educationCap}
            style={[styles.icon, { tintColor: colors.textSecondary }]}
          />
          <CustomText
            label={user?.education?.[0]?.degree || "PHd"}
            fontFamily={fonts.medium}
            color={colors.text}
          />
          <CustomText
            label="in"
            fontFamily={fonts.medium}
            color={colors.textSecondary}
          />
          <CustomText
            label={user?.education?.[0]?.primaryMajor || "Technology"}
            fontFamily={fonts.medium}
            color={colors.text}
          />
          <CustomText
            label="from"
            fontFamily={fonts.medium}
            color={colors.textSecondary}
          />
          <CustomText
            label={user?.education?.[0]?.school || "MIT"}
            fontFamily={fonts.medium}
            color={colors.text}
          />
        </View>
      )}

      <View style={[styles.row, { marginTop: 2, flexWrap: "wrap" }]}>
        {locationRedux?.countryCode && (
          <Image
            source={{
              uri: `https://flagcdn.com/w40/${locationRedux.countryCode.toLowerCase()}.png`,
            }}
            style={[styles.icon]}
          />
        )}
        <CustomText
          label={
            locationRedux?.city
              ? `${locationRedux.city}, ${locationRedux.countryCode}`
              : location || "Geneva, CH"
          }
          fontFamily={fonts.medium}
          color="rgba(0, 123, 255, 1)"
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.6}
        style={[styles.row, { marginTop: 4 }]}
        onPress={() => navigation.navigate("SearchScreen", { tab: "people" })}
      >
        <CustomText
          label={Math.max(
            user?.stats?.followers?.length ?? followersCount ?? 0,
            0,
          )}
          fontFamily={fonts.medium}
          color={colors.text}
        />
        <CustomText
          label="Followers"
          fontFamily={fonts.medium}
          color={colors.textSecondary}
          marginRight={4}
        />
        <CustomText
          label={Math.max(
            user?.stats?.following?.length ?? followingCount ?? 0,
            0,
          )}
          fontFamily={fonts.medium}
          color={colors.text}
        />
        <CustomText
          label="Following"
          fontFamily={fonts.medium}
          color={colors.textSecondary}
          marginRight={4}
        />
        {/* <CustomText
          label="In Common"
          fontFamily={fonts.medium}
          color={COLORS.gray48}
          marginRight={4}
        /> */}
      </TouchableOpacity>

      <View style={[styles.row, { marginTop: 12 }]}>
        {/* {["Technology", "Design", "Development"].map((tag, index) => ( */}
        {user?.industry?.length > 0 &&
          user?.industry?.slice(0, 3)?.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tagContainer,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <CustomText
                label={item}
                fontFamily={fonts.medium}
                fontSize={12}
                color={colors.textSecondary}
                textTransform={"capitalize"}
              />
            </View>
          ))}
      </View>

      <CustomText
        onPress={() => !data && navigation.navigate("AccountInfo")}
        label={
          user?.profile?.bio
            ? user?.profile?.bio
            : data?._id !== userDataRedux?._id
            ? "No Bio Available"
            : "Add a bio...."
        }
        color={colors.textSecondary}
        fontSize={12}
        marginTop={10}
      />
      {isUser && (
        <View style={[styles.row, { marginTop: 16, marginBottom: 8 }]}>
          <CustomButton
            title={
              isFriend
                ? "Friend"
                : isFollowing || user?.isRequestApproved === true
                ? "Following"
                : user?.isRequestApproved === false
                ? "Request Sent"
                : isRequested
                ? "Requested"
                : "Follow"
            }
            width="49%"
            height={40}
            icon={
              isFollowing || isFriend || isRequested ? null : Images.plusBlack
            }
            justifyContent="flex-start"
            textMarginLeft={12}
            onPress={onFollowPress}
          />
          {/* <CustomButton
            title="Mention"
            width="49%"
            height={40}
            icon={Images.mention}
            backgroundColor={"rgba(161, 147, 117, 0.04)"}
            color={"rgba(161, 147, 117, 1)"}
            justifyContent="flex-start"
            textMarginLeft={12}
          /> */}
        </View>
      )}

      {showTopTab && (
        <TopTab
          rounded
          tab={tab}
          oval
          setTab={setTab}
          tabNames={[
            "Posts",
            "Reposts",
            ...(!isUser
              ? ["Mentions", "Media", "Replies", "Liked", "Saved"]
              : []),
          ]}
          paddingHorizontal={14}
          borderWidth={1}
          borderColor={colors.surfaceAlt}
          activeColor={"rgba(161, 147, 117, 0.08)"}
          ovalBg={"rgba(161, 147, 117, 0)"}
          marginTop={8}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profileImage: {
    height: 28,
    width: 28,
    borderRadius: 99,
  },
  icon: {
    height: 16,
    width: 16,
    borderRadius: 100,
  },
  tagContainer: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
});
