import { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { getProfileTier } from "../utils/profileTier";
import Icons from "./Icons";
import ImageFast from "./ImageFast";

/**
 * Badges next to a user's name (client badge set):
 *  · shield — verified → blue filled verified_user (#007BFF),
 *             unverified → grey outline verified_user
 *  · Premium → silver PSC star, Premium+ → gold PSC star, shown INSTEAD of
 *    the shield (a premium account is already verified)
 * The blue "verified" rosette is not used anywhere in PSC.
 *  · verified employer → the primary employer's logo at the end (client:
 *    only when the employment is verified; backend profile.employer)
 */
export const isVerifiedUser = (user) =>
  !!(user?.profile?.isVerified ?? user?.isVerified);

const UserBadge = ({
  user,
  // flag-only sources (live meta, saved accounts) can pass these instead
  verified: verifiedProp,
  accountType,
  size = 14,
  mutedColor = "rgba(255, 255, 255, 0.64)",
  // false → no grey outline shield for unverified users (nothing is shown)
  showUnverified = true,
  // false → hide the employer logo (e.g. inside the company's own header)
  showEmployer = true,
  style,
}) => {
  const verified =
    verifiedProp !== undefined ? !!verifiedProp : isVerifiedUser(user);
  const tier = getProfileTier(
    accountType !== undefined ? { accountType } : user,
  );
  const employerLogo = showEmployer ? user?.profile?.employer?.logo : null;
  if (!tier.star && !verified && !showUnverified && !employerLogo) return null;
  return (
    <View style={[styles.row, style]}>
      {/* Premium / Premium+ accounts are already verified, so the tier
          star replaces the shield rather than sitting beside it. */}
      {tier.star ? (
        <Image source={tier.star} style={{ width: size, height: size, resizeMode: "contain" }} />
      ) : verified || showUnverified ? (
        <Icons
          family={verified ? "MaterialSymbolsRoundedFilled" : "MaterialSymbolsRounded"}
          name="verified_user"
          size={size}
          color={verified ? "#007BFF" : mutedColor}
        />
      ) : null}
      {!!employerLogo && (
        <View style={[styles.employer, { width: size, height: size, borderRadius: Math.round(size * 0.25) }]}>
          <ImageFast source={{ uri: employerLogo }} style={{ width: size, height: size }} resizeMode="contain" />
        </View>
      )}
    </View>
  );
};

export default memo(UserBadge);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  employer: { backgroundColor: "#FFFFFF", overflow: "hidden", alignItems: "center", justifyContent: "center" },
});
