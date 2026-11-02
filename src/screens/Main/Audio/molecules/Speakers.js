import { StyleSheet, Text, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import UserBadge from "../../../../components/UserBadge";
import {
  AUDIO,
  GlassFill,
  Glyph,
  MSF,
  fitLine,
  getDisplayName,
  ls,
} from "./audioLayout";

const Photo = ({ user, size }) =>
  user?.profile?.avatar ? (
    <ImageFast
      source={{ uri: user.profile.avatar }}
      style={{ width: size, height: size, borderRadius: 100 }}
      removeLoading
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 100,
        backgroundColor: user?.profile?.profileColor || AUDIO.surface,
      }}
    />
  );

/**
 * Radio-Detail speakers (Figma "Frame 48096969", gap 8): 48 circles with a
 * 40 photo — the one on air white, the others white 16% + blur 16.
 */
export const RadioSpeakers = ({ users = [], activeId }) => (
  <View style={styles.speakers}>
    {users.map((u, i) => {
      const active = activeId ? u?._id === activeId : i === 0;
      return (
        <View key={u?._id || i} style={styles.speaker}>
          {active ? (
            <View style={[StyleSheet.absoluteFill, styles.activeFill]} />
          ) : (
            <GlassFill fill={AUDIO.white16} />
          )}
          <Photo user={u} size={40} />
        </View>
      );
    })}
  </View>
);

/**
 * Audio-Post-Detail speaker (Figma "Frame 48096969", 279 × 56, gap 8):
 * 56 white circle (pad 4, photo 48) · SPEAKING Regular 12 @48% + campaign
 * 14 · name Medium 12 −0.5% + badge 12 · username Regular 12 @48% ·
 * "<job> at <company>" Medium 12 white / " at " Regular @64% (gap 2).
 */
export const SpeakerCard = ({ user }) => {
  const job = user?.occupation?.jobTitle?.trim();
  const company = user?.occupation?.company?.trim();
  return (
    <View style={styles.card}>
      <View style={styles.cardPhoto}>
        <Photo user={user} size={48} />
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.row12}>
          <Small label="Speaking" color={AUDIO.white48} upper />
          <Glyph family={MSF} name="campaign" size={14} color={AUDIO.white} />
        </View>
        <View style={styles.row12}>
          <Small label={getDisplayName(user)} medium color={AUDIO.white} />
          <UserBadge user={user} size={12} />
        </View>
        <Small label={user?.username || ""} color={AUDIO.white48} />
        {job || company ? (
          <CustomText
            fontFamily={fonts.medium}
            fontSize={12}
            letterSpacing={ls(12, -0.5)}
            color={AUDIO.white}
            numberOfLines={1}
            marginTop={fitLine(12, 12)}
            marginBottom={fitLine(12, 12)}
          >
            {job || ""}
            {job && company ? <Text style={styles.at}> at </Text> : null}
            {company || ""}
          </CustomText>
        ) : null}
      </View>
    </View>
  );
};

const Small = ({ label, color, medium, upper }) => (
  <CustomText
    label={label}
    fontFamily={medium ? fonts.medium : fonts.regular}
    fontSize={12}
    letterSpacing={ls(12, -0.5)}
    color={color}
    textTransform={upper ? "uppercase" : undefined}
    numberOfLines={1}
    marginTop={fitLine(12, 12)}
    marginBottom={fitLine(12, 12)}
  />
);

const styles = StyleSheet.create({
  speakers: { height: 48, flexDirection: "row", alignItems: "center", gap: 8 },
  speaker: {
    width: 48,
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  activeFill: { backgroundColor: AUDIO.white, borderRadius: 100 },
  // Figma block is 279 wide (56 photo · 8 · 215 text) and centred, so the
  // photo sits 48 in from the edge — fixed here so a short name / job
  // doesn't shrink it into a small island in the middle of the panel
  card: {
    width: 279,
    maxWidth: "100%",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardPhoto: {
    width: 56,
    height: 56,
    borderRadius: 100,
    padding: 4,
    backgroundColor: AUDIO.white,
  },
  cardInfo: { flex: 1, gap: 2 },
  at: { fontFamily: fonts.regular, color: AUDIO.white64 },
  row12: { height: 12, flexDirection: "row", alignItems: "center", gap: 2 },
});
