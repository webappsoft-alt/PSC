import { BlurView } from "@react-native-community/blur";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import UploadImageCustom from "../../../../components/UploadImageCustom";
import { useTheme } from "../../../../contexts/ThemeContext";
import { put } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import { uploadAndGetUrl } from "../../../../utils/constants";
import { ToastMessage } from "../../../../utils/ToastMessage";

const BannerModal = ({ isVisible, onClose, user, onHidePress }) => {
  const dispatch = useDispatch();
  const { colors, themeMode } = useTheme();
  const [imageModal, setImageModal] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const cameraRef = useRef(null);

  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Display Name";
  const username = user?.username || "username";
  const userImage = user?.profile?.avatar;
  const coverImage = user?.profile?.cover;

  const handleMediaSelect = async (result) => {
    if (!result) return;
    setImageModal(false);

    try {
      setImgLoading(true);
      const url = await uploadAndGetUrl(result);

      if (url) {
        const payload = {
          profile: {
            cover: url,
          },
        };

        const response = await put("user/profile", payload);
        if (response?.data?.success) {
          dispatch(setUserData(response.data.data));
          ToastMessage("Banner updated successfully", "success");
        } else {
          ToastMessage("Failed to update banner", "error");
        }
      }
    } catch (error) {
      console.error("Banner upload error:", error);
      ToastMessage("An error occurred while uploading banner", "error");
    } finally {
      setImgLoading(false);
    }
  };

  const handleCapture = async (result) => {
    if (result) {
      await handleMediaSelect(result);
    }
  };

  const isHidden = user?.profile?.hideCover === false;

  const handleToggleBanner = async () => {
    try {
      setImgLoading(true);
      const payload = {
        profile: {
          hideCover: isHidden ? true : false,
        },
      };

      const response = await put("user/profile", payload);
      if (response?.data?.success) {
        dispatch(setUserData(response.data.data));
        ToastMessage(
          isHidden ? "Banner shown successfully" : "Banner hidden successfully",
          "success",
        );
        onClose();
      } else {
        ToastMessage("Failed to update banner visibility", "error");
      }
    } catch (error) {
      console.error("Toggle banner error:", error);
      ToastMessage("An error occurred", "error");
    } finally {
      setImgLoading(false);
    }
  };

  const handleDeleteBanner = async () => {
    try {
      setImgLoading(true);
      const payload = {
        profile: {
          cover: "",
        },
      };

      const response = await put("user/profile", payload);
      if (response?.data?.success) {
        dispatch(setUserData(response.data.data));
        ToastMessage("Banner deleted successfully", "success");
        onClose();
      } else {
        ToastMessage("Failed to delete banner", "error");
      }
    } catch (error) {
      console.error("Delete banner error:", error);
      ToastMessage("An error occurred while deleting banner", "error");
    } finally {
      setImgLoading(false);
    }
  };

  return (
    <CustomModal
      isBlur
      isChange
      isVisible={isVisible}
      onDisable={onClose}
      reducedTransparencyFallbackColor="rgba(0,0,0,0.1)"
    >
      <View
        style={{
          margin: 10,
          borderRadius: 32,
          padding: 4,
          borderWidth: 1,
          overflow: "hidden",
          borderColor: colors.surfaceAlt,
        }}
      >
        {/* Blur Layer */}
        <BlurView
          blurType={themeMode === "dark" ? "dark" : "light"}
          blurAmount={10}
          reducedTransparencyFallbackColor="#FFFFFF29"
          style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]}
        />
        <View
          style={[styles.modalContainer, { backgroundColor: colors.card }]}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.userSection}>
              {userImage ? (
                <ImageFast source={{ uri: userImage }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: user?.profile?.profileColor,
                    },
                  ]}
                />
              )}

              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <CustomText
                    label={displayName}
                    fontFamily={fonts.medium}
                    fontSize={16}
                  />
                  {user?.role === "individual" && (
                    <ImageFast
                      source={Images.verified}
                      style={styles.verifiedBadge}
                    />
                  )}
                  {user?.role === "company" && (
                    <ImageFast
                      source={Images.grayStar}
                      style={styles.verifiedBadge}
                    />
                  )}
                </View>
                <CustomText
                  label={`${username}`}
                  color={colors.textSecondary}
                  fontSize={14}
                />
              </View>
            </View>
            <View style={styles.headerActions}>
              <ImageFast
                onPress={onClose}
                source={Images.crossBg || Images.cross}
                style={[styles.actionIcon, { tintColor: colors.text }]}
              />
            </View>
          </View>

          {imgLoading ? (
            <View
              style={[
                styles.bannerPlaceholder,
                styles.loaderContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <ActivityIndicator color={colors.text} size="large" />
            </View>
          ) : coverImage ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setImageModal(true)}
            >
              {/* <View style={styles.bannerText}>
                <CustomText label={"Change Cover"} />
              </View> */}

              <ImageFast source={{ uri: coverImage }} style={styles.banner} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setImageModal(true)}
              style={[
                styles.dashedContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceAlt,
                },
              ]}
            >
              <ImageFast
                source={Images.plusRed || Images.plus}
                style={[styles.plusIcon, { tintColor: colors.textSecondary }]}
              />
              <CustomText
                label="Upload Banner"
                color={colors.textSecondary}
                fontSize={14}
                marginTop={8}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleToggleBanner}
            style={styles.optionRow}
          >
            <View style={styles.optionLeft}>
              <ImageFast
                source={Images.hideBg}
                style={[styles.optionIcon, { tintColor: colors.text }]}
              />
              <View style={styles.optionTextContainer}>
                <CustomText
                  label={isHidden ? "Show this banner" : "Hide this banner"}
                  fontFamily={fonts.medium}
                  fontSize={15}
                />
                <CustomText
                  label={isHidden ? "Show User’s banner" : "Hide User’s banner"}
                  color={colors.textSecondary}
                  fontSize={14}
                  marginTop={2}
                />
              </View>
            </View>
            <Image
              source={Images.forwardIcon}
              style={[styles.forwardIcon, { tintColor: colors.iconMuted }]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteBanner}
            style={styles.reportRow}
          >
            <View style={styles.reportLeft}>
              <ImageFast source={Images.reportBg} style={styles.reportIcon} />
              <View>
                <CustomText
                  label="Delete this Banner"
                  fontFamily={fonts.medium}
                  fontSize={15}
                />
                <CustomText
                  label="Remove Banner"
                  color={colors.textSecondary}
                  fontSize={14}
                  marginTop={2}
                />
              </View>
            </View>
            <Image
              source={Images.forwardIcon}
              style={[styles.forwardIcon, { tintColor: colors.iconMuted }]}
            />
          </TouchableOpacity>
        </View>
      </View>
      <UploadImageCustom
        imageModal={imageModal}
        setImageModal={setImageModal}
        imgLoading={imgLoading}
        handleChange={handleMediaSelect}
        handleCapture={handleCapture}
        camera={cameraRef}
        onCameraOpen={onClose}
      />
    </CustomModal>
  );
};

export default BannerModal;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: COLORS.black,
    borderRadius: 28,
    width: "100%",
    alignSelf: "center",
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    height: 32,
    width: 32,
    borderRadius: 99,
    // backgroundColor: COLORS.inputBg,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifiedBadge: {
    height: 18,
    width: 18,
    tintColor: COLORS.blue,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionIcon: {
    height: 32,
    width: 32,
    tintColor: COLORS.white,
  },
  banner: {
    height: 120,
    width: "100%",
    borderRadius: 12,
    marginVertical: 20,
  },
  bannerPlaceholder: {
    height: 120,
    width: "100%",
    borderRadius: 12,
    marginVertical: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  dashedContainer: {
    height: 120,
    width: "100%",
    borderRadius: 12,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  plusIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.gray2,
  },
  reportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  reportLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reportIcon: {
    height: 40,
    width: 40,
    tintColor: "rgba(238, 16, 69, 1)",
    marginRight: 12,
  },
  forwardIcon: {
    height: 24,
    width: 24,
    tintColor: "rgba(255, 255, 255, 0.64)",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    height: 40,
    width: 40,
    tintColor: COLORS.white,
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
});
