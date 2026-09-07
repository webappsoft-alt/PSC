import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { openPicker } from "react-native-image-crop-picker";
import Reanimated from "react-native-reanimated";
import { Camera, useCameraDevice } from "react-native-vision-camera";

import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import { ToastMessage } from "../utils/ToastMessage";
import { useIsForeground } from "../utils/UseIsForground";
import CustomButton from "./CustomButton";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import { useTheme } from "../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps();

const UploadImageCustom = ({
  images,
  camera,
  onDelete,
  imageModal,
  imgLoading,
  handleChange,
  handleCapture,
  setImageModal,
}) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const isForeground = useIsForeground();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [active, setActive] = useState(true);
  const [selected, setSelected] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isPermissionChecked, setIsPermissionChecked] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(false);

  const device = useCameraDevice("back");

  const isActive = isFocused && isForeground;

  const requestGalleryPermission = async () => {
    try {
      if (Platform.OS === "android") {
        if (Platform.Version >= 33) {
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          ]);
          const granted =
            result["android.permission.READ_MEDIA_IMAGES"] ===
              PermissionsAndroid.RESULTS.GRANTED ||
            result["android.permission.READ_MEDIA_VIDEO"] ===
              PermissionsAndroid.RESULTS.GRANTED;
          setHasGalleryPermission(granted);
          return granted;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          );
          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          setHasGalleryPermission(isGranted);
          return isGranted;
        }
      } else {
        // iOS doesn't need explicit permission request for CameraRoll
        setHasGalleryPermission(true);
        return true;
      }
    } catch (err) {
      console.warn("Gallery permission error:", err);
      setHasGalleryPermission(false);
      return false;
    }
  };

  const onPermissions = async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermission();
      const isGranted = cameraPermission === "granted";
      setHasPermission(isGranted);
      setIsPermissionChecked(true);
    } catch (error) {
      console.log("Permission check error:", error);
      setHasPermission(false);
      setIsPermissionChecked(true);
    }
  };

  const loadGalleryMedia = async () => {
    try {
      const hasPermission = await requestGalleryPermission();

      if (!hasPermission) {
        console.log("No gallery permission");
        return;
      }

      const result = await CameraRoll.getPhotos({
        first: 30,
        assetType: "Photos",
        include: ["filename", "fileSize", "playableDuration"],
      });

      console.log("Gallery media loaded:", result.edges.length);
      setGalleryMedia(result.edges);
    } catch (error) {
      console.log("Error loading gallery:", error);
      ToastMessage("Error loading gallery media", "error");
    }
  };

  useEffect(() => {
    if (imageModal) {
      loadGalleryMedia();
    }
  }, [imageModal]);

  const openSettings = async () => {
    try {
      if (Platform.OS === "ios") {
        const settingsUrl = "app-settings:";
        const canOpen = await Linking.canOpenURL(settingsUrl);
        if (canOpen) {
          await Linking.openURL(settingsUrl);
        } else {
          ToastMessage(
            "Unable to open settings. Please open them manually.",
            "error",
          );
        }
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      ToastMessage(
        "An unexpected error occurred while opening settings.",
        "error",
      );
    }
  };

  const handleGalleryItemPress = async (item) => {
    try {
      const mediaUri = item.node.image.uri;
      const mediaType = item.node.type;

      const result = {
        path: mediaUri,
        mime: mediaType.includes("video") ? "video/mp4" : "image/jpeg",
      };

      setImageModal(false);
      handleChange(result);
      setSelected(null);
    } catch (error) {
      console.log("Error selecting gallery item:", error);
    }
  };

  const openCameraFullScreen = () => {
    if (!hasPermission) {
      onPermissions();
      return;
    }
    setImageModal(false);
    navigation.navigate("CustomCameraScreen", {
      onCapture: (result) => {
        handleCapture(result);
      },
    });
  };

  const takePhotoFromLibrary = async () => {
    try {
      setImageModal(false);
      setTimeout(async () => {
        const result = await openPicker({
          mediaType: "any",
          quality: 0.8,
        });

        if (result.path) {
          handleChange(result);
        }
      }, 1000);
    } catch (error) {
      console.log("takePhotoFromLibrary error", error);
    }
  };

  const onError = useCallback((error) => {
    console.log("camera error==>>", error);
  }, []);

  useFocusEffect(
    useCallback(() => {
      onPermissions();
      setActive(true);

      return () => {
        setActive(false);
      };
    }, []),
  );

  let message = "";

  if (!isPermissionChecked) {
    message = "Loading camera...";
  } else if (!hasPermission) {
    message = "Please grant permission to use camera!";
  } else if (device == null) {
    message = "Please grant permission to use camera!";
  }

  return (
    <View>
      {/* Gallery and Options Modal */}
      <CustomModal
        isChange
        transparent={true}
        isVisible={imageModal}
        backgroundColor="transparent"
        onDisable={() => {
          setImageModal(false);
          setSelected(null);
        }}
      >
        <View style={styles.mainContainer}>
          <View style={styles.imagesContainer}>
            {message ? (
              <TouchableOpacity activeOpacity={0.6} onPress={openSettings}>
                <CustomText
                  width={100}
                  color={colors.text}
                  textAlign={"center"}
                  label={"Please grant permission to use camera!"}
                />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={openCameraFullScreen}
                  disabled={imgLoading}
                >
                  {imgLoading && (
                    <View style={styles.loader}>
                      <ActivityIndicator color={colors.text} size={"small"} />
                    </View>
                  )}
                  <Reanimated.View style={[styles.cameraBox]}>
                    <ReanimatedCamera
                      photo
                      ref={camera}
                      exposure={0}
                      device={device}
                      onError={onError}
                      enableZoomGesture
                      orientation="portrait"
                      enableHighQualityPhotos
                      isActive={isActive && active && imageModal}
                      style={StyleSheet.absoluteFill}
                      lowLightBoost={device.supportsLowLightBoost}
                    />
                  </Reanimated.View>
                </TouchableOpacity>
                <View style={styles.line} />
              </>
            )}
            <FlatList
              horizontal
              contentContainerStyle={{ paddingLeft: 13 }}
              showsHorizontalScrollIndicator={false}
              data={galleryMedia}
              keyExtractor={(item, index) => `gallery-${index}`}
              ListEmptyComponent={
                <View style={styles.emptyGallery}>
                  <CustomText
                    label={
                      hasGalleryPermission
                        ? "No media found"
                        : "Loading gallery..."
                    }
                    color="#888"
                    fontSize={12}
                  />
                </View>
              }
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => handleGalleryItemPress(item)}
                  style={[
                    { marginRight: 10 },
                    selected === index && styles.selected,
                  ]}
                >
                  <Image
                    source={{ uri: item.node.image.uri }}
                    style={styles.image}
                  />
                  {item.node.type.includes("video") && (
                    <View style={styles.videoIndicator}>
                      <CustomText label="▶" color="#fff" fontSize={20} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
          <CustomButton
            marginBottom={8}
            icon={Images.gallery}
            title={"Choose from Gallery"}
            onPress={takePhotoFromLibrary}
          />
          <CustomButton
            icon={Images.binWhite}
            color={COLORS.white}
            iconColor={COLORS.white}
            title={"Delete this Image"}
            backgroundColor={"#EE1045"}
            onPress={() => onDelete(selected)}
          />
        </View>
      </CustomModal>
    </View>
  );
};

export default UploadImageCustom;

const createStyles = (colors, isDark) => StyleSheet.create({
  mainContainer: {
    backgroundColor: colors.background,
    width: "100%",
    bottom: 0,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    padding: 14,
  },
  image: {
    height: 80,
    width: 80,
    borderRadius: 16,
  },
  cameraBox: {
    height: 80,
    width: 80,
    borderRadius: 16,
    overflow: "hidden",
  },
  loader: {
    height: 80,
    width: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: isDark ? "#0000009E" : "rgba(255, 255, 255, 0.6)",
    position: "absolute",
    zIndex: 2,
  },
  imagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  line: {
    height: 70,
    width: 1,
    marginLeft: 13,
    backgroundColor: colors.surfaceAlt,
  },
  selected: {
    borderWidth: 1,
    marginRight: 10,
    borderRadius: 16,
    borderColor: colors.text,
  },
  videoIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
  },
  emptyGallery: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
});
