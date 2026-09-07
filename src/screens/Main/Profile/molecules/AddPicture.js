import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import Blur from "../../../../components/Blur";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import ErrorComponent from "../../../../components/ErrorComponent";
import Header from "../../../../components/Header";
import ImageFast from "../../../../components/ImageFast";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import UploadImageCustom from "../../../../components/UploadImageCustom";
import { put } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import { uploadAndGetUrl } from "../../../../utils/constants";
import { ToastMessage } from "../../../../utils/ToastMessage";

const MAX_IMAGES = 4;

const AddPicture = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.users.userData);
  const CARD_SIZE = (width - 32) / 2;

  // Track images: array of URLs
  const [images, setImages] = useState(userData?.profile?.matchingImages || []);
  const [uploading, setUploading] = useState(new Array(MAX_IMAGES).fill(false));
  const [error, setError] = useState("");
  const [imageModal, setImageModal] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [cameraIndex, setCameraIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  const cameraRef = useRef(null);

  useEffect(() => {
    if (userData?.profile?.matchingImages) {
      setImages(userData.profile.matchingImages);
    }
  }, [userData]);

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

    try {
      setError("");
      const body = {
        profile: {
          matchingImages: filteredImages,
        },
      };

      const res = await put("user/profile", body);

      if (res?.data?.success) {
        dispatch(setUserData(res?.data?.data));
        ToastMessage("Photos updated successfully!", "success");
        navigation.navigate("TabStack", { screen: "Profile" });
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } catch (err) {
      console.log("Submit error:", err);
      setError("Something went wrong while saving.");
      ToastMessage("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      paddingHorizontal={12}
      headerUnScrollable={() => (
        <Header title={"Add Picture"} onBackPress={() => navigation.goBack()} />
      )}
      footerUnScrollable={() => (
        <View style={{ paddingHorizontal: 16 }}>
          <CustomButton
            title="Save Changes"
            onPress={submit}
            loading={loading}
            isBottom
          />
        </View>
      )}
    >
      <View style={styles.container}>
        <CustomText
          label="Add your pictures"
          fontFamily={fonts.semiBold}
          fontSize={20}
          marginTop={12}
          marginBottom={3}
          color={COLORS.white}
        />
        <CustomText
          label={`Add up to 4 pictures to stand out in the community. At least one image is required.`}
          color={COLORS.gray64}
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
                style={[styles.card, { width: CARD_SIZE, height: CARD_SIZE }]}
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
                    style={{ height: 88, width: 88 }}
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
          color={error ? "#EE1045" : COLORS.gray64}
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
    </ScreenWrapper>
  );
};

export default AddPicture;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.04)",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
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
