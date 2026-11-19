import { useNavigation } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet, {
  SheetCloseButton,
  SheetIconButton,
  SheetUserHeader,
} from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";

const LOCATION_BLUE = "#007BFF";

/**
 * Figma "Post-creator-summary": user header (32 avatar · ⋮ · ×) · info rows
 * (14 icon @64% + Medium 14; location blue, connectors @48%) · stats row
 * (Medium 18 / Regular 14 @64%) · "In common" + avatar stack · bio
 * (Regular 16 / 125% @64%). Figma inner gap 20 measured between CAP-HEIGHT
 * boxes (vertical trim): header 32 → info rows (14 tall, gap 8) → stats 29
 * (number cap 13 + label) → in-common 14 → bio. RN text boxes are 1.4 × font
 * with 0.35 × font above the caps (Poppins ascent 1.05 / cap 0.7), so with
 * the sheet gap 12: info +5 / rows 2.4 apart, stats −1, label −5, bio −2.5
 * after the stats (0 after in-common).
 */
const CreatorSummary = ({ isVisible, onClose, onMore, user }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Display Name";
  const username = user?.username || "username";

  const location =
    user?.location?.city && user?.location?.country
      ? `${user.location.city}, ${user.location.country}`
      : user?.location?.city || user?.location?.country || null;

  // Client: a company shows only when it was picked from the company
  // directory (current Career experience) — then with its logo before the
  // name. A typed-in company (occupation.company, e.g. "Sola") is not shown.
  const currentExp =
    (Array.isArray(user?.experiences) ? user.experiences : []).find(
      (e) => e?.current && e?.company,
    ) || null;
  const occupation = currentExp?.title || user?.occupation?.jobTitle || null;
  const company = currentExp ? currentExp.companyName || null : null;
  const companyLogo = currentExp?.companyLogo || null;
  const bio = (user?.profile?.bio || user?.bio || "").trim();

  const education = user?.education?.[0];
  const degree = education?.degree || null;
  const major = education?.primaryMajor || null;
  const school = education?.school || null;

  const inCommon = Array.isArray(user?.mutualFriends)
    ? user.mutualFriends.slice(0, 3)
    : [];

  const openProfile = () => {
    onClose();
    setTimeout(() => {
      navigation.navigate("UserProfile", { userId: user?._id });
    }, 600);
  };

  const Strong = ({ label }) => (
    <CustomText
      label={label}
      fontFamily={fonts.medium}
      fontSize={14}
      color={colors.text}
    />
  );
  const Muted = ({ label }) => (
    <CustomText
      label={label}
      fontFamily={fonts.medium}
      fontSize={14}
      color={COLORS.gray48}
    />
  );

  const stats = [
    { label: "Likes", value: user?.stats?.upvotes },
    { label: "Posts", value: user?.postsCount },
    { label: "Followers", value: user?.followersCount },
    { label: "Subs", value: user?.subsCount },
  ];

  return (
    <FloatingSheet
      visible={isVisible}
      onDismiss={onClose}
      gap={12}
      header={
        <SheetUserHeader
          avatar={user?.profile?.avatar}
          profileColor={user?.profile?.profileColor}
          displayName={displayName}
          username={username}
          role={user?.role}
          user={user}
          onPressUser={openProfile}
          right={
            <>
              <SheetIconButton name="more_vert" onPress={onMore} color="muted" />
              <SheetCloseButton onPress={onClose} color="muted" />
            </>
          }
        />
      }
    >
      {/* Info rows */}
      {(location || occupation || (degree && major && school)) && (
        <View style={styles.info}>
          {location ? (
            <View style={[styles.row, styles.infoRow]}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="location_on"
                size={14}
                color={LOCATION_BLUE}
              />
              <CustomText
                label={location}
                fontFamily={fonts.medium}
                fontSize={14}
                color={LOCATION_BLUE}
              />
            </View>
          ) : null}
          {occupation ? (
            <View style={[styles.row, styles.infoRow]}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="work"
                size={14}
                color={COLORS.gray64}
              />
              <Strong label={occupation} />
              {company ? (
                <>
                  <Muted label="at" />
                  {/* Figma: company logo 16 before the company name */}
                  {companyLogo ? (
                    <ImageFast source={{ uri: companyLogo }} style={styles.companyLogo} />
                  ) : null}
                  <Strong label={company} />
                </>
              ) : null}
            </View>
          ) : null}
          {degree && major && school ? (
            <View style={[styles.row, styles.infoRow]}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="school"
                size={14}
                color={COLORS.gray64}
              />
              <Strong label={degree} />
              <Muted label="in" />
              <Strong label={major} />
              <Muted label="from" />
              <Strong label={school} />
            </View>
          ) : null}
        </View>
      )}

      {/* Stats */}
      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <CustomText
              label={String(s.value ?? 0)}
              fontFamily={fonts.medium}
              fontSize={18}
              letterSpacing={-0.09}
              color={colors.text}
              textAlign="center"
            />
            <CustomText
              label={s.label}
              fontSize={14}
              letterSpacing={-0.07}
              color={COLORS.gray64}
              textAlign="center"
              // Figma: label cap top 161 = number cap bottom 155 + 6
              marginTop={-5}
            />
          </View>
        ))}
      </View>

      {/* In common */}
      {inCommon.length > 0 ? (
        <View style={styles.row}>
          <CustomText
            label="In common"
            fontSize={14}
            color={COLORS.gray48}
          />
          <View style={styles.avatars}>
            {inCommon.map((u, index) => (
              <ImageFast
                key={u?._id || index}
                source={{ uri: u?.profile?.avatar }}
                style={[
                  styles.commonAvatar,
                  {
                    marginLeft: index > 0 ? -5 : 0,
                    zIndex: 3 - index,
                    borderColor: colors.background,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* Bio — Figma: Regular 16 / 125% @64%, 20 below the previous block
          (tight boxes ⇒ first-line centre 30 below the stat labels) */}
      {/* no bio → nothing (client: never show "No bio available") */}
      {bio ? (
        <CustomText
          label={bio}
          fontSize={16}
          letterSpacing={-0.5}
          color={COLORS.gray64}
          numberOfLines={3}
          marginTop={inCommon.length > 0 ? 0 : -2.5}
        />
      ) : null}
    </FloatingSheet>
  );
};

export default CreatorSummary;

const styles = StyleSheet.create({
  // Figma: header bottom 44 → row 1 caps 66; rows 22 apart (14 + 8)
  // (measured on the Simulator: +3 / +1.6 / +4 over the computed values)
  info: { marginTop: 8, gap: 4 },
  infoRow: {},
  row: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  // Figma: info bottom 122 → number caps 142
  stats: { flexDirection: "row", gap: 8, marginTop: 3 },
  stat: { flex: 1, alignItems: "center" },
  avatars: { flexDirection: "row", alignItems: "center" },
  companyLogo: { width: 16, height: 16, borderRadius: 4 },
  // Figma: in-common avatars are 14 (row 14 tall), stacked
  commonAvatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
});
