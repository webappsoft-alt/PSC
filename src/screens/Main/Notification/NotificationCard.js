import moment from "moment";
import { StyleSheet, Image, TouchableOpacity, View } from "react-native";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import { useTheme } from "../../../contexts/ThemeContext";
import { COLORS } from "../../../utils/COLORS";

const NotificationCard = ({ item, onPress }) => {
  const { colors, isDark } = useTheme();
  const sender = item?.sender || {};
  const profile = sender?.profile || {};
  const username = item?.title || "Notification";
  const desc = item?.message || "";
  const time = moment(item?.createdAt).fromNow();
  const avatar = profile?.avatar;
  const profileColor = profile?.profileColor || COLORS.gray48;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? "#FFFFFF0A" : colors.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={[styles.avatarWrap, { backgroundColor: profileColor }]}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={[styles.avatar]} />
            ) : (
              <Icons
                name="user"
                family="Feather"
                size={20}
                color={colors.text}
              />
            )}
          </View>
          <CustomText
            label={username}
            fontFamily={fonts.medium}
            fontSize={16}
            lineHeight={16 * 1.4}
            color={colors.text}
          />
        </View>

        {/* Additional Info Below */}
        <CustomText
          label={desc}
          color={colors.textSecondary}
          marginTop={8}
          fontFamily={fonts.medium}
        />
        <CustomText
          label={time}
          fontSize={12}
          color={colors.textSecondary}
          fontFamily={fonts.medium}
        />
      </View>

      <Icons
        name="chevron-right"
        family="Feather"
        size={20}
        color={colors.iconMuted}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    // borderWidth: 1,
    marginHorizontal: 12,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: COLORS.low,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 99,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  arrow: {
    marginLeft: 8,
  },
});

export default NotificationCard;
