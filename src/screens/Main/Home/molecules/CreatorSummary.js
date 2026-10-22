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
 * (16 icon + Medium 14/20; location blue, connectors @48%) · stats row
 * (Medium 18 / Regular 14 @64%) · "In common" + avatar stack · bio
 * (Regular 16 / 125% @64%). Figma inner gap 20 with tight text boxes
 * (info rows 14, stats 29, in-common 14); with RN 1.4 line boxes the same
 * centres come out as gap 12 (+5 before the info rows, −5 between a stat
 * number and its label).
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

  const occupation = user?.occupation?.jobTitle || null;
  const company = user?.occupation?.company || null;

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
          onPressUser={openProfile}
          right={
            <>
              <SheetIconButton name="more_vert" onPress={onMore} />
              <SheetCloseButton onPress={onClose} />
            </>
          }
        />
      }
    >
      {/* Info rows */}
      {(location || (occupation && company) || (degree && major && school)) && (
        <View style={styles.info}>
          {location ? (
            <View style={styles.row}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="location_on"
                size={16}
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
          {occupation && company ? (
            <View style={styles.row}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="work"
                size={16}
                color={colors.text}
              />
              <Strong label={occupation} />
              <Muted label="at" />
              <Strong label={company} />
            </View>
          ) : null}
          {degree && major && school ? (
            <View style={styles.row}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="school"
                size={16}
                color={colors.text}
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
      <CustomText
        label={user?.profile?.bio || user?.bio || "No bio available"}
        fontSize={16}
        letterSpacing={-0.5}
        color={COLORS.gray64}
        numberOfLines={3}
        marginTop={-3}
      />
    </FloatingSheet>
  );
};

export default CreatorSummary;

const styles = StyleSheet.create({
  // Figma: rows 14 tall, gap 8 → centres 22 apart; first centre 27 below header
  info: { gap: 2, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  // Figma: stats 20 below the info rows (number centre 6.5 into the block)
  stats: { flexDirection: "row", gap: 8, marginTop: -2 },
  stat: { flex: 1, alignItems: "center" },
  avatars: { flexDirection: "row", alignItems: "center" },
  // Figma: in-common avatars are 14 (row 14 tall), stacked
  commonAvatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
});
