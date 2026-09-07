import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import { PNGIcons } from "../../../../assets/images/icons";
import fonts from "../../../../assets/fonts";
import { useTheme } from "../../../../contexts/ThemeContext";

const ExtrasCard = ({ onPress, type }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={{ width: "49%" }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[COLORS.black, type == "invite" ? "#007BFF" : "#A19375"]}
        locations={type == "invite" ? [0.76, 0.98] : [0.62, 0.98]}
        angle={type == "invite" ? 112 : 125}
        useAngle={true}
        style={[styles.card, { borderColor: colors.surfaceAlt }]}
      >
        {type == "invite" ? (
          <View>
            <Image source={PNGIcons.add_user} style={styles.addUser} />
          </View>
        ) : (
          <View style={styles.iconRow}>
            <Image source={PNGIcons.rewind} style={styles.icon} />
            <Image source={PNGIcons.star_blue} style={styles.icon} />
            <Image source={PNGIcons.blot} style={styles.icon} />
          </View>
        )}

        <View style={styles.container}>
          <CustomText textStyle={styles.title}>
            {type == "invite" ? "Invite Friends" : "Get Extras"}
          </CustomText>
          <CustomText textStyle={styles.subtitle}>
            {type == "invite"
              ? "Earn Benefits\n& more!"
              : "Super Likes, Boosts, Rewinds!"}
          </CustomText>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default ExtrasCard;

const styles = StyleSheet.create({
  card: {
    height: 120,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBg,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
    marginTop: 12,
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
    marginVertical: 8,
    marginHorizontal: 12,
  },
  title: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  subtitle: {
    color: COLORS.subtitle,
    fontSize: 14,
  },
  icon: {
    height: 28,
    width: 28,
    resizeMode: "contain",
  },
  addUser: {
    height: 24,
    width: 24,
    resizeMode: "contain",
    marginLeft: 12,
    marginTop: 12,
  },
});
