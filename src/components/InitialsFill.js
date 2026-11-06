import { StyleSheet, View } from "react-native";

import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";

/**
 * No-photo fallback used in avatar boxes: the user's initials ("Tayyab
 * Rajpoot" → "TR") on their profile colour — same look as the Inbox
 * StatusAvatar (SemiBold, #121212, 15pt on a 48pt avatar → size × 0.3125).
 * Fills its parent (absolute), so drop it into any avatar container.
 */
export const initialsOf = (user, fallbackName = "") => {
  const first = user?.firstName || "";
  const last = user?.lastName || "";
  let s = `${first[0] || ""}${last[0] || ""}`;
  if (!s) {
    const words = String(user?.username || fallbackName || "")
      .replace(/^@/, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    s = `${words[0]?.[0] || ""}${words[1]?.[0] || ""}`;
  }
  return s.toUpperCase() || "?";
};

const InitialsFill = ({ user, name, size = 24, backgroundColor }) => (
  <View
    pointerEvents="none"
    style={[
      StyleSheet.absoluteFill,
      styles.center,
      {
        backgroundColor:
          backgroundColor || user?.profile?.profileColor || "rgba(255, 255, 255, 0.16)",
      },
    ]}
  >
    <CustomText
      label={initialsOf(user, name)}
      fontSize={Math.max(5, Math.round(size * 0.3125))}
      fontFamily={fonts.semiBold}
      color={COLORS.primaryColor}
      numberOfLines={1}
    />
  </View>
);

export default InitialsFill;

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});
