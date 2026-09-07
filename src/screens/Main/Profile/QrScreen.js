import { Clipboard, Share, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSelector } from "react-redux";

import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";

import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { PNGIcons } from "../../../assets/images/icons";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";

const QrScreen = ({ route }) => {
  const { colors, isDark } = useTheme();
  const { userData } = useSelector((state) => state.users);

  const user = route?.params?.user;

  const [localUser, setLocalUser] = useState(user || userData);

  const userProfileLink = `psc://user/${localUser?._id}`;
  const userWebLink = `https://psc.sola-group.ch/user/${localUser?._id}`;

  const handleCopyLink = () => {
    Clipboard.setString(userProfileLink);
    ToastMessage("Link copied to clipboard", "success");
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Check out my profile on Private Social Club: ${userProfileLink}`,
        url: userProfileLink,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  return (
    <ScreenWrapper headerUnScrollable={() => <Header title="Qr Code" />}>
      <CustomText
        label={localUser?.firstName + " " + localUser?.lastName}
        fontFamily={fonts.semiBold}
        fontSize={24}
        lineHeight={24 * 1.4}
        alignSelf={"center"}
        marginTop={18}
      />

      <View style={[styles.usernamePill, { backgroundColor: isDark ? COLORS.white16 : colors.surfaceAlt }]}>
        <CustomText
          label={localUser?.email}
          fontSize={12}
          color={isDark ? COLORS.white : colors.textSecondary}
        />
        <ImageFast
          removeLoading
          source={Images.copy}
          onPress={handleCopyLink}
          tintColor={isDark ? undefined : colors.textSecondary}
          style={{ width: 14, height: 14, marginLeft: 6 }}
        />
      </View>

      <View style={[styles.imgBg, { backgroundColor: isDark ? COLORS.white16 : colors.surfaceAlt }]}>
        {localUser?.profile?.avatar ? (
          <ImageFast
            source={
              localUser?.profile?.avatar
                ? { uri: localUser?.profile?.avatar }
                : Images.person
            }
            style={styles.userImage}
          />
        ) : (
          <View
            style={[
              styles.userImage,
              { backgroundColor: localUser?.profile?.profileColor },
            ]}
          />
        )}
        <View style={styles.qrBg}>
          <QRCode value={userWebLink.toString()} size={156} />
        </View>
      </View>

      <View style={styles.footer}>
        <ImageFast
          removeLoading
          source={PNGIcons.copyLink}
          style={styles.icon}
          onPress={handleCopyLink}
        />
        <ImageFast
          removeLoading
          source={PNGIcons.shareBg}
          style={styles.icon}
          onPress={handleShareLink}
        />
        {/* <ImageFast
          removeLoading
          source={PNGIcons.chatBg}
          style={styles.icon}
          onPress={() =>
            navigation.navigate("InboxScreen", {
              recipientId: userData?._id,
              recipientName: userData?.first_name + " " + userData?.sur_name,
              profileImage: userData?.profile?.publicAvatar,
            })
          }
        /> */}
      </View>
    </ScreenWrapper>
  );
};

export default QrScreen;

const styles = StyleSheet.create({
  imgBg: {
    padding: 12,
    backgroundColor: COLORS.white16,
    borderRadius: 32,
    gap: 8,
    alignSelf: "center",
  },
  userImage: {
    height: 216,
    width: 216,
    borderRadius: 24,
  },
  qrBg: {
    height: 216,
    width: 216,
    borderRadius: 24,
    padding: 26,
    backgroundColor: COLORS.white,
  },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  icon: {
    height: 48,
    width: 48,
  },
  usernamePill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white16,
    height: 28,
    borderRadius: 99,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 24,
  },
});
