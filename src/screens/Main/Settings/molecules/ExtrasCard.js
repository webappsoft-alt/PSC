import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import fonts from "../../../../assets/fonts";
import { PNGIcons } from "../../../../assets/images/icons";
import CustomText from "../../../../components/CustomText";

const X = (fs) => Math.round(fs * 0.35 * 10) / 10;

/**
 * Figma Settings cards (2307:1632 / 2307:1612): 171.5 × 139 r12, 1pt white 4%
 * border, padding 24/12, gap 16 — 24pt icons (gap 4) · title (Get Extras
 * Medium 16 / Invite Friends Medium 14) · 12 · subtitle Regular 14 white 64%.
 * Get Extras: linear (0,0)→(1,1) #121212 64% → #A19375; Invite Friends:
 * (0.5,0)→(1,1) #121212 0–64% → #007BFF.
 */
const ExtrasCard = ({ onPress, type }) => {
  const invite = type === "invite";
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={invite ? ["#121212", "#121212", "#007BFF"] : ["#121212", "#A19375"]}
        locations={invite ? [0, 0.64, 1] : [0.64, 1]}
        start={invite ? { x: 0.5, y: 0 } : { x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {invite ? (
        <Image source={PNGIcons.add_user} style={styles.icon} />
      ) : (
        <View style={styles.iconRow}>
          <Image source={PNGIcons.rewind} style={styles.icon} />
          <Image source={PNGIcons.star_blue} style={styles.icon} />
          <Image source={PNGIcons.blot} style={styles.icon} />
        </View>
      )}
      <View style={styles.texts}>
        <CustomText
          label={invite ? "Invite Friends" : "Get Extras"}
          fontSize={invite ? 14 : 16}
          fontFamily={fonts.medium}
          color="#FFFFFF"
          marginTop={-X(invite ? 14 : 16)}
          marginBottom={-X(invite ? 14 : 16)}
        />
        <CustomText
          label={invite ? "Earn Benefits & more!" : "Super Likes, Boosts, Rewinds!"}
          fontSize={14}
          color="rgba(255, 255, 255, 0.64)"
          marginTop={-X(14)}
          marginBottom={-X(14)}
        />
      </View>
    </TouchableOpacity>
  );
};

export default ExtrasCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 139,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    paddingVertical: 24,
    paddingHorizontal: 12,
    gap: 16,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  icon: { width: 24, height: 24, resizeMode: "contain" },
  texts: { gap: 12 },
});
