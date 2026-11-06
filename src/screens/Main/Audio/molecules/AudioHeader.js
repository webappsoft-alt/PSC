import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import GlassBackButton from "../../../../components/GlassBackButton";
import ImageFast from "../../../../components/ImageFast";
import UserBadge from "../../../../components/UserBadge";
import {
  AUDIO,
  GlassFill,
  Glyph,
  MS,
  MSF,
  OpenAILogo,
  fitLine,
  formatCompact,
  getDisplayName,
  ls,
} from "./audioLayout";

/**
 * Figma "Header" of the Audio Post / Radio frames (pad 52 / 12 / 8 / 12,
 * gap 15): row 40 = back 40 (white 4% + blur 16, chevron_left 24 @64%) ·
 * 12 · avatar 32 (2pt ring inside, pad 4, photo 24) · 8 · name Medium 14
 * −0.5% + badge 14 (gap 4) over username / "Publishing as" Regular 14 @48%
 * (gap 6) · right: Follow 64 × 32 r8 white 4% + more 32 (detail) or an
 * expand_more 16 @64% chevron (recorder, opens the account switcher).
 * Below: listeners row 16 (detail) and the Open AI credit row 12.
 */
const AudioHeader = ({
  user,
  variant = "follow", // "follow" (detail) | "publishing" (recorder)
  onBack,
  onMore,
  onFollow,
  isOwner,
  isFollowing,
  onSwitchAccount,
  listeners, // { count, users } → listeners row (detail only)
  showCredit = false,
}) => {
  const insets = useSafeAreaInsets();
  const avatar = user?.profile?.avatar;
  // Figma: 2pt #007BFF ring (inside) on every Audio Post / Radio header
  const ring = AUDIO.blue;
  const fallback = user?.profile?.profileColor || AUDIO.surface;

  const identity = (
    <View style={styles.identity}>
      <View style={[styles.avatarRing, { borderColor: ring }]}>
        {avatar ? (
          <ImageFast source={{ uri: avatar }} style={styles.avatar} removeLoading />
        ) : (
          <View style={[styles.avatar, { backgroundColor: fallback }]} />
        )}
      </View>
      <View style={styles.names}>
        <View style={styles.nameRow}>
          <CustomText
            label={getDisplayName(user)}
            fontFamily={fonts.medium}
            fontSize={14}
            letterSpacing={ls(14, -0.5)}
            color={AUDIO.white}
            numberOfLines={1}
            marginTop={fitLine(14, 14)}
            marginBottom={fitLine(14, 14)}
            containerStyle={styles.shrink}
          />
          <UserBadge user={user} size={14} />
        </View>
        <CustomText
          label={variant === "publishing" ? "Publishing as" : user?.username || ""}
          fontFamily={fonts.regular}
          fontSize={14}
          letterSpacing={ls(14, -0.5)}
          color={AUDIO.white48}
          numberOfLines={1}
          marginTop={fitLine(14, 10)}
          marginBottom={fitLine(14, 10)}
        />
      </View>
      {variant === "publishing" ? (
        <Glyph family={MS} name="expand_more" size={16} color={AUDIO.white64} />
      ) : null}
    </View>
  );

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <GlassBackButton onPress={onBack} fill={AUDIO.white04} color={AUDIO.white} />

        {variant === "publishing" ? (
          <Pressable onPress={onSwitchAccount} style={styles.identityWrap}>
            {identity}
          </Pressable>
        ) : (
          <View style={[styles.identityWrap, styles.spaceBetween]}>
            {identity}
            <View style={styles.actions}>
              {!isOwner && !isFollowing ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onFollow}
                  style={styles.follow}
                >
                  <GlassFill borderRadius={8} fill={AUDIO.white04} />
                  <CustomText
                    label="Follow"
                    fontFamily={fonts.medium}
                    fontSize={14}
                    color={AUDIO.white}
                    marginTop={fitLine(14, 10)}
                    marginBottom={fitLine(14, 10)}
                  />
                </TouchableOpacity>
              ) : null}
              {/* already following → the feed's 36 × 32 how_to_reg button */}
              {!isOwner && isFollowing ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onFollow}
                  style={styles.following}
                >
                  <GlassFill borderRadius={8} fill={AUDIO.white04} />
                  <Glyph family={MSF} name="how_to_reg" size={16} color={AUDIO.white} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity activeOpacity={0.7} onPress={onMore} style={styles.more}>
                <GlassFill fill={AUDIO.white04} />
                <Glyph family={MS} name="more_vert" size={16} color={AUDIO.white64} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {listeners ? (
        <View style={styles.listeners}>
          {listeners.users?.length ? (
            <View style={styles.stack}>
              {listeners.users.slice(0, 3).map((u, i) => (
                <View
                  key={u?._id || i}
                  style={[styles.stackItem, i > 0 && styles.stackOverlap]}
                >
                  {u?.profile?.avatar ? (
                    <ImageFast
                      source={{ uri: u.profile.avatar }}
                      style={styles.stackAvatar}
                      removeLoading
                    />
                  ) : (
                    <View
                      style={[
                        styles.stackAvatar,
                        { backgroundColor: u?.profile?.profileColor || AUDIO.surface },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <CustomText
              label={`${formatCompact(listeners.count)} listener${
                listeners.count === 1 ? "" : "s"
              }`}
              fontFamily={fonts.medium}
              fontSize={12}
              letterSpacing={ls(12, -0.5)}
              color={AUDIO.white}
              marginTop={fitLine(12, 8)}
              marginBottom={fitLine(12, 8)}
            />
          </View>
        </View>
      ) : null}

      {showCredit ? <TranscriptCredit /> : null}
    </View>
  );
};

/** Figma "Frame 2085664209": Open AI mark 12 @64% · 4 · Medium 12 @64% */
export const TranscriptCredit = () => (
  <View style={styles.credit}>
    <OpenAILogo size={12} color={AUDIO.white64} />
    <CustomText
      label="Full transcript provided by Open AI."
      fontFamily={fonts.medium}
      fontSize={12}
      color={AUDIO.white64}
      marginTop={fitLine(12, 12)}
      marginBottom={fitLine(12, 12)}
    />
  </View>
);

export default AudioHeader;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 15,
  },
  topRow: { height: 40, flexDirection: "row", alignItems: "center", gap: 12 },
  identityWrap: { flex: 1, height: 32, flexDirection: "row", alignItems: "center" },
  spaceBetween: { justifyContent: "space-between" },
  identity: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  avatarRing: {
    width: 32,
    height: 32,
    borderRadius: 100,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 24, height: 24, borderRadius: 100 },
  names: { gap: 6, flexShrink: 1 },
  nameRow: { height: 14, flexDirection: "row", alignItems: "center", gap: 4 },
  shrink: { flexShrink: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  follow: {
    width: 64,
    height: 32,
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  following: {
    width: 36,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  more: {
    width: 32,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  listeners: { height: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  stack: { flexDirection: "row", alignItems: "center" },
  stackItem: { width: 16, height: 16, borderRadius: 100, overflow: "hidden" },
  stackOverlap: { marginLeft: -4 },
  stackAvatar: { width: 16, height: 16, borderRadius: 100 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 100, backgroundColor: AUDIO.red },
  credit: { height: 12, flexDirection: "row", alignItems: "center", gap: 4 },
});
