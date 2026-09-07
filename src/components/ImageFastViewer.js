import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";

import CustomText from "./CustomText";
import { Modal, Clipboard, Share } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ToastMessage } from "../utils/ToastMessage";

import { BlurView } from "@react-native-community/blur";
import { Images } from "../assets/images";
import fonts from "../assets/fonts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const ImageFastViewer = ({
  source,
  style,
  resizeMode,
  isView,
  loading,
  children,
  onPress,
  hitSlop,
  removeLoading,
  tintColor,
  profile,
  name,
  profileTitle = "Profile",
  user,
  isOtherUser,
  followText = "Follow",
  onFollowPress,
}) => {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isViewModal, setIsViewModal] = useState(false);

  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleCopyLink = () => {
    if (!user?._id) return;
    const userProfileLink = `psc://user/${user._id}`;
    Clipboard.setString(userProfileLink);
    ToastMessage("Link copied to clipboard", "success");
    setIsViewModal(false);
  };

  const handleShareLink = async () => {
    if (!user?._id) return;
    const userProfileLink = `psc://user/${user._id}`;
    try {
      await Share.share({
        message: `Check out my profile on Private Social Club: ${userProfileLink}`,
        url: userProfileLink,
      });
      setIsViewModal(false);
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const handleQrPress = () => {
    setIsViewModal(false);
    navigation.navigate("QrScreen", { user });
  };

  const SkeletonLoader = () => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }, [animatedValue]);

    const interpolatedBackground = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["#e0e0e0", "#c0c0e0"],
    });

    return (
      <Animated.View
        style={[styles.skeleton, { backgroundColor: interpolatedBackground }]}
      />
    );
  };

  const renderProfileModalContent = () => (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.backButton}
          onPress={() => setIsViewModal(false)}
        >
          <BlurView
            blurType="light"
            blurAmount={16}
            style={styles.blurBackground}
          />
          <Image source={Images.back} style={styles.backIcon} />
        </TouchableOpacity>

        <CustomText
          style={styles.headerTitle}
          fontSize={20}
          fontFamily={fonts.semiBold}
          label={profileTitle}
        />

        <View style={styles.backButton} />
      </View>

      {/* Center Image */}
      <View style={styles.centerContent}>
        <FastImage
          onLoadStart={() => setIsImageLoading(true)}
          onLoadEnd={() => setIsImageLoading(false)}
          source={source}
          resizeMode="cover"
          style={styles.profileImage}
        />

        {name && (
          <CustomText
            style={styles.profileName}
            fontSize={24}
            fontFamily={fonts.semiBold}
            label={name}
            marginTop={16}
          />
        )}
      </View>

      {/* Bottom Icons */}
      <View
        style={[
          styles.bottomSection,
          {
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.iconsContainer}>
          {isOtherUser && (
            <TouchableOpacity style={styles.iconButton} onPress={onFollowPress}>
              <Image source={Images.profileFollow} style={styles.icon} />
              <CustomText label={followText} fontFamily={fonts.medium} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.iconButton} onPress={handleQrPress}>
            <Image source={Images.profileQr} style={styles.icon} />
            <CustomText label={"QR Code"} fontFamily={fonts.medium} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleCopyLink}>
            <Image source={Images.profileCopy} style={styles.icon} />
            <CustomText label={"Copy"} fontFamily={fonts.medium} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleShareLink}>
            <Image source={Images.profileShare} style={styles.icon} />
            <CustomText label={"Share"} fontFamily={fonts.medium} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      hitSlop={hitSlop}
      onPress={isView ? () => setIsViewModal(true) : onPress}
      activeOpacity={0.6}
      disabled={!isView && !onPress}
      style={style}
    >
      {isViewModal && (
        <Modal
          visible={isViewModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsViewModal(false)}
        >
          <BlurView style={styles.modalBlur} blurType="light" blurAmount={20}>
            {renderProfileModalContent()}
          </BlurView>
        </Modal>
      )}
      <FastImage
        onLoadStart={removeLoading ? undefined : () => setIsImageLoading(true)}
        onLoadEnd={removeLoading ? undefined : () => setIsImageLoading(false)}
        source={source}
        resizeMode={resizeMode}
        style={[
          { width: "100%", height: "100%", borderRadius: 99 },
          tintColor && { tintColor },
        ]}
      >
        {children}
      </FastImage>
      {(loading || isImageLoading) && (
        <View style={styles.loaderContainer}>
          <SkeletonLoader />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modalBlur: {
    flex: 1,
  },
  loaderContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  skeleton: {
    width: "100%",
    height: "100%",
  },

  // Modal Layout
  modalContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "space-between",
    paddingHorizontal: 20,
    // paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  backIcon: {
    width: 28,
    height: 28,
    tintColor: "#fff",
  },
  headerTitle: {
    color: "#000",
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },

  // Center Content
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: "#f5f5f5",
  },
  profileName: {
    color: "#000",
    marginTop: 16,
  },

  // Bottom Section
  bottomSection: {
    // paddingBottom: Platform.OS === "ios" ? 40 : 20,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iconsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
  },
  iconButton: {
    // width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  icon: {
    width: 56,
    height: 56,
    marginBottom: 8,
  },
});

export default ImageFastViewer;
