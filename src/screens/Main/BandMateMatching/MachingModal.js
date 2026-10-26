import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSelector } from "react-redux";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { COLORS } from "../../../utils/COLORS";
import FloatingSheet from "../../../components/FloatingSheet";
import { GlassFill, capGap } from "./molecules/matchLayout";

/**
 * Figma › Matching › "It's-a-match" (5744:6113): card with the photo, black
 * 64%/32%/64% gradient, top shade and #007BFF glow from 61% down; pad 16,
 * sections 44 apart. Presented through the app's FloatingSheet like every
 * modal (backdrop blur, glass outline, spring-up).
 */
const CARD_PAD = 16;
const SECTION_GAP = 44;
const THUMB = 83.52;
// iOS draws a 44pt line's glyphs ~2.5pt higher in the 1.4 box than the
// Poppins metrics predict (measured on device, see MatchCard)
const BIG_TEXT_FIX = 2.5;

const imageOf = (u) =>
  u?.profile?.matchingImages?.[0] || u?.profile?.avatar || null;

const Thumb = ({ uri, color, name, verified }) => (
  <View style={styles.thumb}>
    {uri ? (
      <Image source={{ uri }} style={styles.thumbImage} />
    ) : (
      <View
        style={[styles.thumbImage, { backgroundColor: color || COLORS.gray48 }]}
      />
    )}
    <View style={styles.thumbName}>
      <CustomText
        label={name}
        fontSize={12}
        fontFamily={fonts.medium}
        color={COLORS.white}
        numberOfLines={1}
      />
      {verified && (
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name="verified_user"
          size={12}
          color="#0D72EA"
        />
      )}
    </View>
  </View>
);

const MatchingModal = ({ match, onClose }) => {
  const navigation = useNavigation();
  const { userData } = useSelector((state) => state.users);
  // keep the content while the modal fades out
  const [last, setLast] = useState(match);
  if (match && match !== last) setLast(match);
  const data = match || last;

  const profile = data?.profile;
  const matchType = data?.matchData?.matchType || "";
  const isSuper =
    data?.interactionType === "superlike" || matchType.includes("superlike");
  const name = profile?.firstName || "";
  const photo = imageOf(profile);
  const isVerified = !!profile?.profile?.isVerified;
  const roleLabel = profile?.role === "company" ? "COMPANY" : "INDIVIDUAL";

  const sayHi = () => {
    onClose?.();
    if (!profile?._id) return;
    navigation.navigate("InboxScreen", {
      conversationId: data?.matchData?.conversationId,
      recipientId: profile._id,
      recipientName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
      otherUser: profile,
    });
  };

  if (!data) return null;

  return (
    <FloatingSheet
      visible={!!match}
      onDismiss={onClose}
      gap={0}
      innerStyle={styles.sheetInner}
      header={
        <View style={styles.card}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor:
                    profile?.profile?.profileColor || COLORS.gray48,
                },
              ]}
            />
          )}
          {/* black 100% / 50% / 100% at 64% */}
          <LinearGradient
            colors={[
              "rgba(0, 0, 0, 0.64)",
              "rgba(0, 0, 0, 0.32)",
              "rgba(0, 0, 0, 0.64)",
            ]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* "Overlay top": #191414 shade over the first 79pt (0.8 × 0.7) */}
          <LinearGradient
            colors={["rgba(25, 20, 20, 0.56)", "rgba(25, 20, 20, 0)"]}
            style={styles.overlayTop}
          />
          {/* "Overlay bottom": #007BFF from 61% to 100% (21pt from the top) */}
          <LinearGradient
            colors={["rgba(0, 123, 255, 0)", "rgba(0, 123, 255, 1)"]}
            locations={[0.61, 1]}
            style={styles.overlayBottom}
          />

          {/* VERIFIED INDIVIDUAL */}
          <View style={styles.titles}>
            {isVerified && (
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="verified_user"
                size={24}
                color="#0D72EA"
              />
            )}
            <CustomText
              label={`${isVerified ? "VERIFIED " : ""}${roleLabel}`}
              fontSize={11}
              fontFamily={fonts.medium}
              color={COLORS.white}
            />
          </View>

          {/* badge · title · subtitle */}
          <View style={styles.hero}>
            {/* Figma 64pt frame. The Material Symbols line box is taller than
                the em and draws the glyph 6pt low (measured on device), so
                the icon sits in a fixed 64pt box, lifted 6 */}
            <View style={styles.badgeBox}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="verified"
                size={64}
                color="#007BFF"
                style={styles.badgeGlyph}
              />
            </View>
            <CustomText
              label={isSuper ? "Super like!" : "It’s a Match!"}
              fontSize={44}
              fontFamily={fonts.semiBold}
              letterSpacing={-0.88}
              color={COLORS.white}
              textAlign="center"
              marginTop={capGap(16, 0, 44) + BIG_TEXT_FIX}
            />
            <CustomText
              label={`You and ${name} can discuss now!`}
              fontSize={14}
              fontFamily={fonts.regular}
              color={COLORS.white}
              textAlign="center"
              marginTop={capGap(12, 44, 14) - BIG_TEXT_FIX}
            />
          </View>

          {/* You · them */}
          <View style={[styles.thumbs, { marginTop: capGap(SECTION_GAP, 14, 0) }]}>
            <Thumb
              uri={imageOf(userData)}
              color={userData?.profile?.profileColor}
              name="You"
              verified={!!userData?.profile?.isVerified}
            />
            <Thumb
              uri={imageOf(profile)}
              color={profile?.profile?.profileColor}
              name={name}
              verified={isVerified}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={sayHi}
              style={[styles.button, styles.buttonPrimary]}
            >
              <CustomText
                label="Say hi!"
                fontSize={18}
                fontFamily={fonts.medium}
                letterSpacing={-0.2}
                color="#000000"
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={[styles.button, styles.buttonSecondary]}
            >
              <GlassFill fill="rgba(255, 255, 255, 0.16)" blurAmount={32} />
              <CustomText
                label="Keep swiping"
                fontSize={18}
                fontFamily={fonts.medium}
                letterSpacing={-0.2}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      }
    />
  );
};

export default MatchingModal;

// the 12pt name row's 16.8 text box overhangs it by 2.4 at each end
const ROW12_OVERHANG = 2.4;

const styles = StyleSheet.create({
  // FloatingSheet glass shell: the card fills its inner (r28) edge to edge
  sheetInner: {
    padding: 0,
    backgroundColor: "transparent",
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    padding: CARD_PAD,
  },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 79,
  },
  overlayBottom: {
    position: "absolute",
    top: 21,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  titles: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hero: {
    marginTop: SECTION_GAP,
    alignItems: "center",
  },
  badgeBox: {
    width: 64,
    height: 64,
    alignItems: "center",
  },
  badgeGlyph: {
    marginTop: -6,
  },
  thumbs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
  },
  thumb: {
    width: THUMB,
    alignItems: "center",
  },
  thumbImage: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
  },
  thumbName: {
    marginTop: 6.4 - ROW12_OVERHANG,
    maxWidth: THUMB,
    flexDirection: "row",
    alignItems: "center",
    gap: 3.2,
  },
  buttons: {
    marginTop: SECTION_GAP - ROW12_OVERHANG,
    gap: 8,
  },
  button: {
    height: 56,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: COLORS.white,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: COLORS.white,
  },
});
