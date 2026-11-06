import { Fragment } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../../assets/fonts";
import {
  EL,
  Fit,
  GlassFill,
  Glyph,
  MS,
  MSF,
  Section,
  SectionTitle,
  formatK,
  userName,
} from "./electionLayout";
import InitialsFill from "../../../../components/InitialsFill";

/**
 * Figma Key Figures (8170:1616): pad 12 · gap 16; rows 40 (avatar 40 ·
 * 8 · name Medium 16 / −0.5 · 4 · category Regular 12 / −1% @48 · dot 3 ·
 * group 16 @48 · count Medium 10) · + 32 circle; 1pt white 4% dividers,
 * 12 apart. Client: "these are PSC accounts about them" (candidates +
 * French Republic) — not AI.
 */
const KeyFigureRow = ({ user, following, onPress, onFollow }) => {
  const uri = user?.profile?.avatar;
  const category = user?.profile?.category || user?.occupation || "";
  return (
    <View style={styles.row}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.left}>
        <View style={styles.avatar}>
          {uri ? (
                <FastImage source={{ uri }} style={StyleSheet.absoluteFill} />
              ) : (
                <InitialsFill user={user} size={40} />
              )}
        </View>
        <View style={styles.text}>
          <Fit
            size={16}
            box={11}
            label={userName(user)}
            fontFamily={fonts.medium}
            letterSpacing={-0.5}
            color={EL.white}
          />
          <View style={styles.meta}>
            {category ? (
              <>
                <Fit
                  size={12}
                  box={8}
                  label={category}
                  letterSpacing={-0.12}
                  color={EL.white48}
                  containerStyle={styles.shrink}
                />
                <View style={styles.dot} />
              </>
            ) : null}
            <View style={[styles.inline, { gap: 4 }]}>
              <Glyph family={MSF} name="group" size={16} color={EL.white48} />
              {/* Figma: one text "1.4k working" — count white, word @64 */}
              <Fit size={10} box={7} fontFamily={fonts.medium} letterSpacing={-0.1} color={EL.white}>
                {`${formatK(user?.followersCount)} `}
                <Text style={styles.followersWord}>followers</Text>
              </Fit>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {onFollow ? (
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={following}
          onPress={onFollow}
          style={styles.follow}
        >
          <GlassFill fill={EL.white04} />
          <Glyph family={MS} name={following ? "check" : "add"} size={16} color={EL.white} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const KeyFigures = ({ users, followed, myId, onOpen, onFollow }) => {
  const list = (Array.isArray(users) ? users : []).filter((u) => u?._id);
  if (!list.length) return null;
  return (
    <Section gap={16}>
      {/* Figma: fixed 12pt title box (cap centred) */}
      <SectionTitle label="Key Figures" box={12} />
      <View style={{ gap: 12 }}>
        {list.map((u, i) => (
          <Fragment key={String(u._id)}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <KeyFigureRow
              user={u}
              following={!!followed?.[String(u._id)]}
              onPress={() => onOpen?.(u)}
              onFollow={String(u._id) === String(myId) ? null : () => onFollow?.(u)}
            />
          </Fragment>
        ))}
      </View>
    </Section>
  );
};

export default KeyFigures;

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  row: { height: 40, flexDirection: "row", alignItems: "center", gap: 8 },
  left: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 40, height: 40, overflow: "hidden", backgroundColor: EL.white04 },
  text: { flex: 1, gap: 4 },
  meta: { height: 16, flexDirection: "row", alignItems: "center", gap: 4 },
  inline: { flexDirection: "row", alignItems: "center" },
  dot: { width: 3, height: 3, borderRadius: 100, backgroundColor: EL.white48 },
  follow: {
    width: 32,
    height: 32,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: EL.white04 },
  followersWord: { color: EL.white64 },
});
