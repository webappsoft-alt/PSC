import { StackActions, useNavigation } from "@react-navigation/native";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFastViewer from "../../../../components/ImageFastViewer";
import { useTheme } from "../../../../contexts/ThemeContext";
import moment from "moment";
import {
  accentA,
  formatProfileCount,
  getCountryCode,
  getProfileAccent,
  getProfileTier,
} from "../../../../utils/profileTier";
import { getOrientation, getProfileLabel } from "../../../../utils/political";

const MS = "MaterialSymbolsRounded";
const MSF = "MaterialSymbolsRoundedFilled";

/**
 * RN draws Poppins with a 1.4×fontSize line box (CustomText), Figma trims the
 * text box to the cap height (≈0.7×fontSize). Each side of an RN text box
 * therefore carries 0.35×fontSize of extra space that is taken out of the
 * Figma gaps below, so glyphs land where the Figma auto-layout puts them.
 *  - 14pt row next to a 16pt icon → RN row 19.6 vs Figma 16 → 1.8 per side
 *  - 22pt username in a 28pt row   → RN row 30.8 vs Figma 28 → 1.4 per side
 *  - 12pt bio                      → 4.2 per side
 */
const ROW_EXTRA = 1.8;
const BIO_EXTRA = 4.2;

/**
 * Figma layouts:
 *  own profile  → "Profile"          (padding 16/12, gaps 20/16, 28 avatar,
 *                                     follower avatars + inline counts)
 *  other user   → "Profile-Premium"  (padding 16/12, gaps 16/20, 28 avatar)
 *               → "Profile-Premium+" (padding 12, gaps 12, 40 avatar,
 *                                     follower avatars, white job title)
 *  Company      → category + "Founded on" rows instead of job / education
 */
const LAYOUTS = {
  own: { padTop: 16, avatar: 28, nameRowExtra: 1.4, gap: 16, outerGap: 20 },
  premium: { padTop: 16, avatar: 28, nameRowExtra: 1.4, gap: 16, outerGap: 20 },
  premiumPlus: { padTop: 12, avatar: 40, nameRowExtra: 0, gap: 12, outerGap: 12 },
};

export const getProfileCardLayout = (user, isOtherUser) => {
  if (!isOtherUser) return LAYOUTS.own;
  return getProfileTier(user).key === "premiumPlus"
    ? LAYOUTS.premiumPlus
    : LAYOUTS.premium;
};

export default function ProfileCard({
  isUser, // true → someone else's profile
  name,
  jobTitle,
  company,
  location,
  followersCount,
  followingCount,
  data,
  isFollowing,
  isFriend,
  onFollowPress,
  isRequested,
}) {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const userDataRedux = useSelector((state) => state.users.userData);
  const locationRedux = useSelector((state) => state.users.location);
  const user = data || userDataRedux;
  const isOtherUser = !!isUser;

  const tier = getProfileTier(user);
  // accent: cover-derived (customised banner) or the tier's
  const accent = getProfileAccent(user);
  const layout = getProfileCardLayout(user, isOtherUser);
  const isPlus = layout === LAYOUTS.premiumPlus;
  // Figma: follower avatars + white job title on Premium+ and on my own profile
  const richRows = isPlus || !isOtherUser;
  const isCompany = user?.role === "company";
  const politicalValue = getProfileLabel(user);
  const politicalChip = getOrientation(politicalValue);

  const ink = (a) =>
    isDark ? `rgba(255, 255, 255, ${a})` : `rgba(18, 18, 18, ${a})`;
  const textColor = colors.text;
  const text48 = ink(0.48);
  const text64 = ink(0.64);
  const BLUE = "rgba(0, 123, 255, 1)";

  const followText = isFriend
    ? "Friend"
    : isFollowing || user?.isRequestApproved === true
    ? "Following"
    : user?.isRequestApproved === false
    ? "Request Sent"
    : isRequested
    ? "Requested"
    : "Follow";
  const isFollowState = followText === "Follow";
  const canMessage = followText === "Following" || followText === "Friend";

  // Location: own profile follows the device location (as before), other
  // profiles show the user's saved location.
  const ownCity = locationRedux?.city;
  const cityLabel = !isOtherUser && ownCity
    ? `${ownCity}, ${locationRedux?.countryCode || ""}`.replace(/, $/, "")
    : (() => {
        const city = user?.location?.city;
        const code = getCountryCode(user?.location?.country);
        if (city) return [city, code || user?.location?.country].filter(Boolean).join(", ");
        return location || "";
      })();
  const flagCode = (
    !isOtherUser && ownCity
      ? locationRedux?.countryCode
      : getCountryCode(user?.location?.country)
  )?.toLowerCase();

  const followers = Math.max(
    user?.stats?.followers?.length ?? followersCount ?? 0,
    0,
  );
  const following = Math.max(
    user?.stats?.following?.length ?? followingCount ?? 0,
    0,
  );
  const inCommon = Math.max(user?.inCommonCount ?? 0, 0);
  const followerPreviews = (user?.followerPreviews || []).slice(0, 3);

  const education = user?.education?.[0];
  const industries = (user?.industry || []).slice(0, 3);
  const bio = user?.profile?.bio
    ? user.profile.bio
    : isOtherUser
    ? "No Bio Available"
    : "Add a bio....";

  const handleMention = () =>
    navigation.navigate("CreatePost", { mentionUser: user });

  const handleMessage = () =>
    navigation.navigate("InboxScreen", {
      recipientId: user?._id,
      recipientName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      otherUser: user,
    });

  const renderAvatar = () => {
    const size = layout.avatar;
    if (!user?.profile?.avatar) {
      return (
        <View
          style={{
            borderRadius: 100,
            height: size,
            width: size,
            backgroundColor: user?.profile?.profileColor,
          }}
        />
      );
    }
    return (
      <ImageFastViewer
        isView
        profile
        user={user}
        isOtherUser={isOtherUser}
        onFollowPress={onFollowPress}
        followText={followText}
        name={name}
        source={{ uri: user.profile.avatar }}
        style={{ height: size, width: size, borderRadius: 100 }}
      />
    );
  };

  const Stat = ({ value, label, onPress }) => (
    <TouchableOpacity
      activeOpacity={0.6}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.statInline, { gap: isPlus ? 2 : 4 }]}
    >
      <CustomText label={value} fontFamily={fonts.medium} color={textColor} />
      <CustomText
        label={label}
        fontFamily={fonts.medium}
        color={text48}
        letterSpacing={isPlus ? -0.14 : 0}
      />
    </TouchableOpacity>
  );

  // Followers / Following → Search › People with that list's tab active
  // push (not navigate): a fresh Search screen even if one is already in the
  // stack, so it opens on this user's list and tab
  const openPeople = (peopleTab) =>
    navigation.dispatch(
      StackActions.push("SearchScreen", {
      tab: "people",
      peopleTab,
      // someone else's profile → their lists (backend checks privacy)
      userId: isOtherUser ? user?._id : undefined,
      }),
    );

  const hasJob = !!(jobTitle || company);
  // The industry entered at registration (free text) is what the company row
  // shows; the fixed Edit Profile category is only the fallback.
  const companyCategory =
    (Array.isArray(user?.industry) ? user.industry[0] : user?.industry) ||
    user?.profile?.category ||
    "";
  const foundedLabel = user?.foundingDate
    ? moment(user.foundingDate).format("D MMMM, YYYY")
    : "";
  const hasEducation = !!(
    education?.degree ||
    education?.primaryMajor ||
    education?.school
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: layout.padTop - layout.nameRowExtra,
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* Avatar + username */}
      <View style={[styles.nameRow, { minHeight: layout.avatar }]}>
        {renderAvatar()}
        <CustomText
          label={user?.username || name}
          fontFamily={fonts.semiBold}
          fontSize={22}
          letterSpacing={-0.22}
          color={textColor}
          numberOfLines={1}
          containerStyle={styles.grow}
        />
      </View>

      {/* Job · education · location · (other user) inline stats */}
      <View
        style={[
          styles.rows,
          { marginTop: layout.gap - layout.nameRowExtra - ROW_EXTRA },
        ]}
      >
        {isCompany ? (
          <>
            {/* Figma company profile: category + "Founded on" */}
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={isOtherUser || !!companyCategory}
              onPress={() => navigation.navigate("AccountInfo")}
              style={styles.infoRow}
            >
              <Icons family={MSF} name="category" size={16} color={text64} />
              <CustomText
                label={
                  companyCategory ||
                  (isOtherUser ? "No category added" : "Add your category")
                }
                fontFamily={fonts.medium}
                letterSpacing={-0.07}
                color={companyCategory ? textColor : text48}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={isOtherUser || !!foundedLabel}
              onPress={() => navigation.navigate("AccountInfo")}
              style={styles.infoRow}
            >
              <Icons family={MSF} name="calendar_month" size={16} color={text64} />
              {foundedLabel ? (
                <>
                  <CustomText label="Founded on" color={text48} />
                  <CustomText label={foundedLabel} fontFamily={fonts.medium} color={textColor} />
                </>
              ) : (
                <CustomText
                  label={isOtherUser ? "No founding date added" : "Add your founding date"}
                  fontFamily={fonts.medium}
                  color={text48}
                />
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
        <TouchableOpacity
              activeOpacity={0.6}
              disabled={isOtherUser || hasJob}
              onPress={() => navigation.navigate("AccountInfo")}
              style={styles.infoRow}
            >
              <Icons family={MSF} name="work" size={16} color={text64} />
              {hasJob ? (
                <>
                  {!!jobTitle && (
                    <CustomText
                      label={jobTitle}
                      fontFamily={fonts.medium}
                      color={richRows ? textColor : text48}
                    />
                  )}
                  {!!jobTitle && !!company && (
                    <CustomText label="at" fontFamily={fonts.medium} color={text48} />
                  )}
                  {!!company && (
                    <CustomText label={company} fontFamily={fonts.medium} color={textColor} />
                  )}
                </>
              ) : (
                <CustomText
                  label={isOtherUser ? "No occupation added" : "Add your occupation"}
                  fontFamily={fonts.medium}
                  color={text48}
                />
              )}
            </TouchableOpacity>
    
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={isOtherUser || hasEducation}
              onPress={() => navigation.navigate("AccountInfo")}
              style={styles.infoRow}
            >
              <Icons family={MSF} name="school" size={16} color={text64} />
              {hasEducation ? (
                <>
                  {!!education?.degree && (
                    <CustomText label={education.degree} fontFamily={fonts.medium} color={textColor} />
                  )}
                  {!!education?.primaryMajor && (
                    <>
                      {!!education?.degree && (
                        <CustomText label="in" fontFamily={fonts.medium} color={text48} />
                      )}
                      <CustomText
                        label={education.primaryMajor}
                        fontFamily={fonts.medium}
                        color={textColor}
                      />
                    </>
                  )}
                  {!!education?.school && (
                    <>
                      <CustomText label="from" fontFamily={fonts.medium} color={text48} />
                      <CustomText label={education.school} fontFamily={fonts.medium} color={textColor} />
                    </>
                  )}
                </>
              ) : (
                <CustomText
                  label={isOtherUser ? "No education added" : "Add your education"}
                  fontFamily={fonts.medium}
                  color={text48}
                />
              )}
            </TouchableOpacity>
          </>
        )}

        {!!cityLabel && (
          <View style={styles.infoRow}>
            {flagCode ? (
              <Image
                source={{ uri: `https://flagcdn.com/w40/${flagCode}.png` }}
                style={styles.flag}
              />
            ) : (
              <Icons family={MSF} name="location_on" size={16} color={BLUE} />
            )}
            <CustomText
              label={cityLabel}
              fontFamily={fonts.medium}
              color={BLUE}
              numberOfLines={1}
              containerStyle={styles.grow}
            />
          </View>
        )}

        <View style={[styles.infoRow, { gap: richRows ? 6 : 8 }]}>
          {richRows && followerPreviews.length > 0 && (
            <View style={styles.avatarStack}>
              {followerPreviews.length > 1 && (
                <View style={styles.avatarStackCol}>
                  {followerPreviews.slice(1, 3).map((p, i) => (
                    <PreviewAvatar key={p?._id || i} item={p} size={8} />
                  ))}
                </View>
              )}
              <PreviewAvatar item={followerPreviews[0]} size={16} />
            </View>
          )}
          <Stat
            value={formatProfileCount(followers)}
            label="Followers"
            onPress={() => openPeople("followers")}
          />
          <Stat
            value={formatProfileCount(following)}
            label="Following"
            onPress={() => openPeople("following")}
          />
          {/* "In Common" is about the viewer and this user — not on my own profile */}
          {isOtherUser && <Stat value={formatProfileCount(inCommon)} label="In Common" />}
        </View>
      </View>

      {/* Industry chips (other users) + PSC political label (Figma "Chips") */}
      {(isOtherUser && industries.length > 0) || politicalChip ? (
        <View style={[styles.chips, { marginTop: layout.gap - ROW_EXTRA }]}>
          {isOtherUser &&
            industries.map((item, index) => (
              <View key={`${item}-${index}`} style={[styles.chip, { backgroundColor: ink(0.04) }]}>
                <CustomText
                  label={item}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  color={text48}
                  textTransform={"capitalize"}
                />
              </View>
            ))}
          {politicalChip && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("PoliticalInformation", { value: politicalChip.value })
              }
              style={[styles.chip, styles.politicalChip, { backgroundColor: politicalChip.chipBg }]}
            >
              <CustomText
                label={politicalChip.label}
                fontFamily={fonts.medium}
                fontSize={12}
                color="#FFFFFF"
              />
              <Icons family={MS} name="info" size={12} color="rgba(255, 255, 255, 0.64)" />
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Bio — previous block ends in a 24/52pt box (no extra) or a text row */}
      <CustomText
        onPress={() => !isOtherUser && navigation.navigate("AccountInfo")}
        label={bio}
        color={text64}
        fontSize={12}
        marginTop={
          layout.gap -
          BIO_EXTRA -
          (!(isOtherUser && industries.length > 0) && !politicalChip ? ROW_EXTRA : 0)
        }
        marginBottom={isOtherUser ? 0 : -BIO_EXTRA}
      />

      {/* Other user: Follow / Following + Mention (+ message) */}
      {isOtherUser && (
        <View style={[styles.buttonsRow, { marginTop: layout.outerGap - BIO_EXTRA }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onFollowPress}
            style={[
              styles.button,
              styles.grow,
              { backgroundColor: accentA(accent, 1) },
              !isFollowState && { justifyContent: "center" },
            ]}
          >
            {isFollowState && (
              <Icons family={MS} name="add" size={24} color="#121212" />
            )}
            <CustomText
              label={followText}
              fontFamily={fonts.medium}
              fontSize={16}
              letterSpacing={-0.5}
              color="#121212"
              textAlign={isFollowState ? "left" : "center"}
              containerStyle={isFollowState ? styles.grow : null}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleMention}
            style={[styles.button, styles.grow, { backgroundColor: accentA(accent, 0.04) }]}
          >
            <Icons family={MS} name="alternate_email" size={16} color={accentA(accent, 1)} />
            <CustomText
              label="Mention"
              fontFamily={fonts.medium}
              fontSize={16}
              letterSpacing={-0.5}
              color={accentA(accent, 1)}
            />
          </TouchableOpacity>

          {canMessage && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleMessage}
              style={[styles.messageButton, { backgroundColor: accentA(accent, 0.04) }]}
            >
              <Icons family={MSF} name="forum" size={16} color={accentA(accent, 1)} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const PreviewAvatar = ({ item, size }) =>
  item?.profile?.avatar ? (
    <Image
      source={{ uri: item.profile.avatar }}
      style={{ width: size, height: size, borderRadius: 100 }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 100,
        backgroundColor: item?.profile?.profileColor || "#262626",
      }}
    />
  );

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
  grow: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rows: {
    gap: 6 - 2 * ROW_EXTRA,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  flag: {
    width: 14,
    height: 14,
    borderRadius: 100,
  },
  statInline: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  avatarStackCol: {
    gap: 1,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  politicalChip: {
    flexDirection: "row",
    gap: 2,
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  button: {
    // Figma: 40pt, padding 12 — the 12 vertical is Figma's trimmed text box;
    // RN's 22.4pt line box needs the full height, so only pad horizontally.
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
