import { useNavigation } from "@react-navigation/native";
import {
  Clipboard,
  Image,
  ImageBackground,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";

import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import Blur from "../../../../components/Blur";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";

const ProfileHeader = ({
  isUser = false,
  isBack,
  name,
  isImage,
  onBannerPress,
  coverImage,
  user,
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  // console.log("user---", user);

  const userProfileLink = `psc://user/${user?._id}`;

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
    <TouchableOpacity activeOpacity={0.6} onPress={onBannerPress}>
      {!isUser ? (
        <ImageBackground
          source={coverImage ? { uri: coverImage } : null}
          resizeMode="cover"
          style={[styles.container, { backgroundColor: colors.surface }]}
        >
          <View style={styles.row}>
            {isBack && (
              <TouchableOpacity
                onPress={() =>
                  navigation.canGoBack()
                    ? navigation.goBack()
                    : navigation.reset({
                        index: 0,
                        routes: [{ name: "TabStack" }],
                      })
                }
                style={styles.backContainer}
              >
                <Blur />
                <ImageFast
                  source={Images.back}
                  style={[
                    styles.backIcon,
                    { tintColor: coverImage ? COLORS.white : colors.text },
                  ]}
                />
              </TouchableOpacity>
            )}
            <CustomText
              label={name}
              fontSize={20}
              color={coverImage ? COLORS.white : colors.text}
              fontFamily={fonts.semiBold}
              marginLeft={isBack ? 4 : 0}
            />
            {user?.profile?.isPro && user?.profile?.isVerified && (
              <Image source={Images.verified} style={styles.verifiedIcon} />
            )}
            {/* <Image source={Images.grayStar} style={styles.verifiedIcon} /> */}
          </View>
          <View style={[styles.row, { gap: 16, paddingHorizontal: 4 }]}>
            <ImageFast
              removeLoading
              source={Images.copy}
              style={[
                styles.iconRight1,
                { tintColor: coverImage ? COLORS.white : colors.text },
              ]}
              onPress={handleCopyLink}
            />
            <ImageFast
              removeLoading
              source={Images.share}
              style={[
                styles.iconRight1,
                { tintColor: coverImage ? COLORS.white : colors.text },
              ]}
              onPress={handleShareLink}
            />
            <ImageFast
              removeLoading
              source={Images.qr}
              style={[
                styles.iconRight1,
                { tintColor: coverImage ? COLORS.white : colors.text },
              ]}
              onPress={() => navigation.navigate("QrScreen", { user })}
            />
          </View>
        </ImageBackground>
      ) : (
        <ImageBackground
          source={coverImage ? { uri: coverImage } : null}
          resizeMode="cover"
          style={[
            styles.container,
            {
              borderBottomWidth: 1,
              borderColor: colors.surfaceAlt,
              height: isImage && 120,
              alignItems: "flex-end",
              borderRadius: 0.1,
              backgroundColor: colors.surface,
            },
          ]}
        >
          {coverImage && isImage && (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(0,0,0,0.4)",
              }}
            />
          )}
          <View style={styles.row}>
            <CustomText
              label={name || "Viktor Sola"}
              fontSize={20}
              color={coverImage ? COLORS.white : colors.text}
              fontFamily={fonts.semiBold}
              textTransform={"capitalize"}
              // onPress={onLogoutPress}
            />
            <Image source={Images.verified} style={styles.verifiedIcon} />
            {/* <Image source={Images.grayStar} style={styles.verifiedIcon} /> */}
          </View>
          <View style={[styles.row, { gap: 6, paddingHorizontal: 4 }]}>
            <Image
              // source={Images.profile1}
              style={[
                styles.iconRight,
                { tintColor: coverImage ? COLORS.white : colors.text },
              ]}
            />

            <TouchableOpacity onPress={() => navigation.navigate("QrScreen")}>
              <Image
                source={Images.profile2}
                style={[styles.iconRight, { tintColor: colors.text }]}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
              <Image
                source={Images.profile3}
                style={[
                  styles.iconRight,
                  {
                    tintColor: colors.text,
                  },
                ]}
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      )}
    </TouchableOpacity>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    height: 120,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 40,
  },
  verifiedIcon: {
    height: 14,
    width: 14,
  },
  iconRight1: {
    height: 24,
    width: 24,
  },
  iconRight: {
    height: 40,
    width: 40,
  },
  backIcon: {
    height: 24,
    width: 24,
  },
  backContainer: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
    overflow: "hidden",
  },
});
