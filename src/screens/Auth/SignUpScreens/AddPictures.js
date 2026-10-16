import { useNavigation } from "@react-navigation/native";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import Blur from "../../../components/Blur";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import ImageFast from "../../../components/ImageFast";
import UploadImageCustom from "../../../components/UploadImageCustom";
import { put } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { uploadAndGetUrl } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const MAX_IMAGES = 4;

const AddPictures = forwardRef(
  (
    {
      currentIndex,
      setCurrentIndex,
      state,
      setState,
      setLoadingState,
      setBtnDisabled,
    },
    ref,
  ) => {
    const { colors, isDark } = useTheme();
    const { width } = useWindowDimensions();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const CARD_SIZE = (width - 32) / 2;

    // Track images: array of URLs
    const [images, setImages] = useState(state?.matchingImages || []);
    const [uploading, setUploading] = useState(
      new Array(MAX_IMAGES).fill(false),
    );
    const [error, setError] = useState("");

    useEffect(() => {
      const filteredImages = images.filter((img) => !!img);
      setBtnDisabled?.(filteredImages.length === 0);
    }, [images]);
    const [imageModal, setImageModal] = useState(false);
    const [imgLoading, setImgLoading] = useState(false);
    const [cameraIndex, setCameraIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    const cameraRef = useRef(null);

    const handleChange = async (pickedImage) => {
      if (!pickedImage?.path && !pickedImage?.uri) return;

      const localUri = pickedImage.path || pickedImage.uri;
      const file = {
        uri: localUri,
        type: pickedImage.mime || "image/jpeg",
        name: `profile_image_${cameraIndex}.jpg`,
      };

      try {
        setImgLoading(true);
        setUploading((prev) => {
          const updated = [...prev];
          updated[cameraIndex] = true;
          return updated;
        });

        const uploadedUrl = await uploadAndGetUrl(file);

        if (uploadedUrl) {
          setImages((prev) => {
            const updated = [...prev];
            updated[cameraIndex] = uploadedUrl;
            return updated;
          });
          setError("");
        } else {
          setError("Failed to upload image. Please try again.");
        }
      } catch (err) {
        console.log("Upload error:", err);
        setError("Error while uploading image.");
      } finally {
        setImgLoading(false);
        setUploading((prev) => {
          const updated = [...prev];
          updated[cameraIndex] = false;
          return updated;
        });
        setImageModal(false);
      }
    };

    const handleCapture = async (photo) => {
      try {
        if (photo) {
          handleChange(photo);
        } else if (cameraRef.current) {
          const capturedPhoto = await cameraRef.current.takePhoto({
            flash: "off",
          });
          if (capturedPhoto?.path) handleChange(capturedPhoto);
        }
      } catch (err) {
        console.log("Camera capture error:", err);
      }
    };

    const onDelete = (index) => {
      if (index === null || index === undefined) return;
      setImages((prev) => {
        const updated = [...prev];
        updated[index] = null; // Keep slots intact
        return updated;
      });
    };

    const submit = async () => {
      const filteredImages = images.filter((img) => !!img);

      if (filteredImages.length === 0) {
        setError("At least one image is required.");
        return;
      }

      setLoading(true);
      if (setLoadingState) setLoadingState(true);

      try {
        setError("");
        const body = {
          profile: {
            matchingImages: filteredImages,
          },
        };

        const res = await put("user/profile", body);

        if (res?.data?.success) {
          const userData = res?.data?.data;
          dispatch(setUserData(userData));
          setState({ ...state, matchingImages: filteredImages });
          ToastMessage("Photos uploaded successfully!", "success");

          if (
            userData?.role === "individual" &&
            userData?.profile?.isVerified === false
          ) {
            navigation.navigate("VerifyIdentity");
          } else {
            navigation.navigate("PersonalAds");
          }
        } else {
          setError("Failed to update profile. Please try again.");
        }
      } catch (err) {
        console.log("Submit error:", err);
        setError("Something went wrong while saving.");
        ToastMessage("Failed to update profile", "error");
      } finally {
        setLoading(false);
        if (setLoadingState) setLoadingState(false);
      }
    };

    const back = () => {
      setCurrentIndex(15);
    };

    useImperativeHandle(ref, () => ({ submit, back, isLoading: loading }));

    return (
      <View style={styles.container}>
        <CustomText
          label="Add your pictures"
          fontFamily={fonts.semiBold}
          fontSize={20}
          marginTop={12}
          marginBottom={3}
          color={isDark ? COLORS.white : colors.text}
        />
        <CustomText
          label={`Add up to 4 pictures to stand out in the community. At least one image is required.`}
          color={isDark ? COLORS.gray64 : colors.textSecondary}
          fontSize={12}
          marginBottom={12}
        />

        <View style={styles.grid}>
          {Array.from({ length: MAX_IMAGES }).map((_, index) => {
            const img = images[index];
            const isUploading = uploading[index];

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.card,
                  {
                    width: CARD_SIZE,
                    height: CARD_SIZE,
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : colors.surfaceAlt,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.04)" : colors.border,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setCameraIndex(index);
                  setImageModal(true);
                }}
                disabled={isUploading}
              >
                {img ? (
                  <>
                    <ImageFast
                      source={{ uri: img }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeOverlay}
                      onPress={() => onDelete(index)}
                      disabled={isUploading}
                    >
                      <Blur />
                      <ImageFast
                        source={Images.delImage}
                        style={{ height: 16, width: 16 }}
                      />
                    </TouchableOpacity>
                  </>
                ) : isUploading ? (
                  <ActivityIndicator size="large" color={COLORS.btnColor} />
                ) : (
                  <ImageFast
                    source={Images.plus48}
                    style={{
                      height: 88,
                      width: 88,
                    }}
                    tintColor={isDark ? undefined : colors.text}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <ErrorComponent
          errorTitle={
            error
              ? error
              : "Supported formats: .jpg, .png. Recommended ratio 1:1."
          }
          color={error ? "#EE1045" : (isDark ? COLORS.gray64 : colors.textSecondary)}
        />

        {imageModal && (
          <UploadImageCustom
            images={images}
            camera={cameraRef}
            onDelete={() => onDelete(cameraIndex)}
            imageModal={imageModal}
            imgLoading={imgLoading}
            handleChange={handleChange}
            handleCapture={handleCapture}
            setImageModal={setImageModal}
          />
        )}
      </View>
    );
  },
);

export default AddPictures;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    // justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  removeOverlay: {
    position: "absolute",
    overflow: "hidden",
    top: 8,
    right: 8,
    borderRadius: 99,
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
