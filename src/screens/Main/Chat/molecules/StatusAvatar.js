import { StyleSheet, Text, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";
import { PRESENCE } from "./OnlineStatusSheets";

/**
 * Avatar with the Figma `Main-Chat` badges (2352:5157):
 *  - status dot 12, 2px outside stroke #121212, at (S−12, S−12):
 *    idle #FF4D00, do-not-disturb #EE1045 (rows); the header also shows
 *    online / invisible for your own status
 *  - birthday badge 18, #262626 + 1.5px outside stroke, 🎂 16, at (S−18, 0)
 *  - rows: ring 48 (pad 3, photo 42) — #1ED760 when available, white 16% else
 */
const ONLINE_RING = "#1ED760";

const StatusAvatar = ({
  user,
  size = 48,
  ring = false,
  status, // "online" | "idle" | "dnd" | "offline" | "invisible"
  showAllStatuses = false, // header: always show my own status dot
  isBirthday = false,
  initialsSize = 15,
}) => {
  const { colors, isDark } = useTheme();
  const tint = (o) =>
    isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`;
  const stroke = colors.background;
  const uri = user?.profile?.avatar || user?.profilePicture;
  const photoSize = ring ? size - 6 : size;
  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "?";

  const dotColor = showAllStatuses
    ? PRESENCE[status]?.color
    : status === "idle" || status === "dnd"
    ? PRESENCE[status].color
    : null;
  // Figma rows: green ring while reachable (online / do not disturb)
  const ringColor = status === "online" || status === "dnd" ? ONLINE_RING : tint(0.16);

  const photo = uri ? (
    <ImageFast source={{ uri }} style={{ width: photoSize, height: photoSize, borderRadius: 100 }} />
  ) : (
    <View
      style={[
        styles.center,
        {
          width: photoSize,
          height: photoSize,
          borderRadius: 100,
          backgroundColor: user?.profile?.profileColor || tint(0.08),
        },
      ]}
    >
      <CustomText label={initials} fontSize={initialsSize} fontFamily={fonts.semiBold} color={COLORS.primaryColor} />
    </View>
  );

  return (
    <View style={{ width: size, height: size }}>
      {ring ? (
        <View style={[styles.ring, { width: size, height: size, backgroundColor: ringColor }]}>{photo}</View>
      ) : (
        photo
      )}
      {isBirthday && (
        // RN borders sit inside the box → grow by the Figma outside stroke
        <View
          style={[
            styles.center,
            styles.birthday,
            { left: size - 18 - 1.5, top: -1.5, borderColor: stroke },
          ]}
        >
          <Text style={styles.cake}>🎂</Text>
        </View>
      )}
      {!!dotColor && (
        <View
          style={[
            styles.dot,
            { left: size - 12 - 2, top: size - 12 - 2, backgroundColor: dotColor, borderColor: stroke },
          ]}
        />
      )}
    </View>
  );
};

export default StatusAvatar;

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    borderRadius: 100,
    padding: 3,
  },
  birthday: {
    position: "absolute",
    width: 21,
    height: 21,
    borderRadius: 100,
    borderWidth: 1.5,
    backgroundColor: "#262626",
  },
  cake: {
    fontSize: 11,
    textAlign: "center",
  },
  dot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 100,
    borderWidth: 2,
  },
});
