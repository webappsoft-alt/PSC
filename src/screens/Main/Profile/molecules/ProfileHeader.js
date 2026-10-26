import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Clipboard,
  Image,
  ImageBackground,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import fonts from "../../../../assets/fonts";
import Blur from "../../../../components/Blur";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";
import { getProfileTier } from "../../../../utils/profileTier";
import { ToastMessage } from "../../../../utils/ToastMessage";

const MS = "MaterialSymbolsRounded";
const MSF = "MaterialSymbolsRoundedFilled";

/**
 * Figma Profile header (375×104 @ 44pt status bar, auto-layout V
 * padding 52/12/12/12): one 40pt row, padding-left 8, space-between.
 * Left: name (Poppins SemiBold 20, white) + 14pt badges, gap 4.
 * Right: 40×40 icon boxes with 24pt filled glyphs, gap 6.
 *
 * Background per subscription:
 *  - regular  → #121212 @ 64% + background blur 32
 *  - premium  → radial-gradient #121212 64% → #9AAAC0 100%
 *  - premium+ → radial-gradient #121212 64% → #A19375 100%
 *  - cover    → cover image + the same radial (inner stop #121212 @ 56%)
 * Figma gradientTransform [[0.298,0.213,0.488],[-0.291,0.193,0.599]],
 * inverted for SVG's objectBoundingBox space.
 */
// Inverse of the Figma transform (gradient space → normalized box space).
const RADIAL_INV = [1.6138, 2.4327, -1.782, 2.4887, 0.2801, -2.677];

/**
 * Drawn in userSpaceOnUse (real points from onLayout): react-native-svg does
 * not combine gradientTransform with objectBoundingBox units reliably, which
 * left the header plain black. The normalized inverse is scaled by the box
 * size: x' = W·(A·x + C·y + E), y' = H·(B·x + D·y + F).
 */
const TierGradient = ({ id, color, innerOpacity = 1 }) => {
  const [size, setSize] = useState(null);
  const [A, B, C, D, E, F] = RADIAL_INV;
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width && height && (width !== size?.w || height !== size?.h)) {
          setSize({ w: width, h: height });
        }
      }}
    >
      {size && (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <RadialGradient
              id={id}
              cx={0.5}
              cy={0.5}
              r={0.5}
              fx={0.5}
              fy={0.5}
              gradientUnits="userSpaceOnUse"
              gradientTransform={`matrix(${A * size.w} ${B * size.h} ${C * size.w} ${D * size.h} ${E * size.w} ${F * size.h})`}
            >
              <Stop offset="0.64" stopColor="#121212" stopOpacity={innerOpacity} />
              <Stop offset="1" stopColor={color} stopOpacity={1} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill={`url(#${id})`} />
        </Svg>
      )}
    </View>
  );
};

const HeaderIcon = ({ name, onPress, color, disabled }) => (
  <TouchableOpacity
    activeOpacity={0.6}
    onPress={onPress}
    disabled={disabled}
    style={styles.iconBox}
  >
    <Icons family={MSF} name={name} size={24} color={color} />
  </TouchableOpacity>
);

/** Pulsing placeholder (same 0.3 → 0.7 pulse as ProfileCardSkeleton). */
const SkeletonBlock = ({ style, color }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[{ backgroundColor: color, opacity }, style]} />;
};

const ProfileHeader = ({
  isUser = false, // true → the signed-in user's own profile
  isBack,
  name,
  onBannerPress,
  coverImage,
  user,
  loading = false, // other user's profile still loading → skeleton
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const tier = getProfileTier(user);
  const isVerified = !!user?.profile?.isVerified;

  const hasTierBg = !!tier.headerColor;
  // Dark header (gradient / cover) always carries white content.
  const onDarkBg = hasTierBg || !!coverImage || isDark;
  const contentColor = onDarkBg ? COLORS.white : colors.text;
  const mutedColor = onDarkBg
    ? "rgba(255, 255, 255, 0.64)"
    : "rgba(18, 18, 18, 0.64)";

  const userProfileLink = `psc://user/${user?._id}`;

  const handleCopyLink = () => {
    Clipboard.setString(userProfileLink);
    ToastMessage("Link copied to clipboard", "success");
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Check out this profile on Private Social Club: ${userProfileLink}`,
        url: userProfileLink,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const handleBack = () =>
    navigation.canGoBack()
      ? navigation.goBack()
      : navigation.reset({ index: 0, routes: [{ name: "TabStack" }] });

  const gradientId = `profileHeader-${tier.key}-${coverImage ? "c" : "n"}`;

  const background = coverImage ? (
    <>
      <ImageBackground
        source={{ uri: coverImage }}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      {hasTierBg ? (
        <TierGradient id={gradientId} color={tier.headerColor} innerOpacity={0.56} />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(18, 18, 18, 0.56)" },
          ]}
        />
      )}
    </>
  ) : hasTierBg ? (
    <TierGradient id={gradientId} color={tier.headerColor} />
  ) : (
    <>
      {/* opacity = blur: #121212 @ 64% + 32 background blur */}
      <Blur
        blurType={isDark ? "dark" : "xlight"}
        blurAmount={32}
        borderRadius={0.1}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(18, 18, 18, 0.64)"
              : "rgba(250, 250, 250, 0.64)",
          },
        ]}
      />
    </>
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
        },
      ]}
    >
      {background}
      <View style={styles.row}>
        <View style={styles.nameRow}>
          {isBack && (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={handleBack}
              style={[styles.backButton, { backgroundColor: colors.surfaceAlt }]}
            >
              <Blur blurType={isDark ? "dark" : "xlight"} borderRadius={100} />
              <Icons family={MS} name="chevron_left" size={26} color={mutedColor} />
            </TouchableOpacity>
          )}
          {loading ? (
            <SkeletonBlock color={colors.surfaceAlt} style={styles.nameSkeleton} />
          ) : (
            <>
            <CustomText
              label={name?.trim() || ""}
              fontSize={20}
              fontFamily={fonts.semiBold}
              color={contentColor}
              textTransform={"capitalize"}
              numberOfLines={1}
              containerStyle={styles.nameContainer}
            />
            {/* Premium/Premium+ → tier star only (already verified);
                otherwise blue filled shield if verified, grey outline if not */}
            {tier.star ? (
              <Image source={tier.star} style={styles.badge} />
            ) : (
              <Icons
                family={isVerified ? MSF : MS}
                name="verified_user"
                size={14}
                color={isVerified ? "rgba(0, 123, 255, 1)" : mutedColor}
              />
            )}
            </>
          )}
        </View>

        <View style={styles.actions}>
          {loading ? (
            [0, 1, 2].map((i) => (
              <View key={i} style={styles.iconBox}>
                <SkeletonBlock color={colors.surfaceAlt} style={styles.iconSkeleton} />
              </View>
            ))
          ) : isUser ? (
            <>
              <HeaderIcon
                name="palette"
                color={contentColor}
                onPress={onBannerPress}
              />
              <HeaderIcon name="analytics" color={contentColor} disabled />
              <HeaderIcon
                name="settings"
                color={contentColor}
                onPress={() => navigation.navigate("Settings")}
              />
            </>
          ) : (
            <>
              <HeaderIcon
                name="content_copy"
                color={contentColor}
                onPress={handleCopyLink}
              />
              <HeaderIcon
                name="qr_code"
                color={contentColor}
                onPress={() => navigation.navigate("QrScreen", { user })}
              />
              <HeaderIcon
                name="share"
                color={contentColor}
                onPress={handleShareLink}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    overflow: "hidden",
  },
  row: {
    height: 40,
    paddingLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 8,
  },
  nameContainer: {
    flexShrink: 1,
  },
  nameSkeleton: {
    width: 140,
    height: 20,
    borderRadius: 4,
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 99,
  },
  badge: {
    width: 14,
    height: 14,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginLeft: -8,
    marginRight: 4,
  },
});
