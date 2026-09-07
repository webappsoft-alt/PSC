import {Image, StyleSheet, TouchableOpacity, View} from "react-native";
import React from "react";
import { COLORS } from "../../../../utils/COLORS";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { PNGIcons } from "../../../../assets/images/icons";
import Icons from "../../../../components/Icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../../contexts/ThemeContext";
import Text from "../../../../components/ScaledText";

const EventName = ({ detail }) => {
  console.log("details---", detail);
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  return (
    <View style={[styles.container, styles.row]}>
      <View style={[styles.row, { flex: 1 }]}>
        {detail?.user?.profile?.avatar ? (
          <Image
            source={{ uri: detail?.user?.profile?.avatar }}
            style={styles.icon}
          />
        ) : (
          <View
            style={[
              styles.icon,
              { backgroundColor: detail?.user?.profile?.profileColor },
            ]}
          />
        )}
        <CustomText
          label={`${detail?.user?.firstName} ${detail?.user?.lastName}`}
          fontFamily={fonts.semiBold}
          fontSize={16}
          lineHeight={16 * 1.4}
          marginLeft={8}
          marginRight={6}
        />
        {detail?.user?.role === "pro" && (
          <Icons
            family="MaterialIcons"
            name="verified"
            size={16}
            color="#007BFF"
          />
        )}
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.msgIocn}
        onPress={() =>
          navigation.navigate("InboxScreen", {
            recipientId: detail?.user?._id,
            recipientName: `${detail?.user?.firstName} ${detail?.user?.lastName}`,
            otherUser: detail?.user,
          })
        }
      >
        <Image
          source={Images.chatRepost}
          style={{ height: 20, width: 20, resizeMode: "contain", tintColor: colors.text }}
        />
      </TouchableOpacity>
    </View>
  );
};

export default EventName;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  msgIocn: {
    height: 40,
    width: 40,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    height: 28,
    width: 28,
    // resizeMode: "contain",
    borderRadius: 99,
  },
});
