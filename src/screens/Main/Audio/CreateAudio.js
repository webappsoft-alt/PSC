import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setIsTabBarVisible } from "../../../store/reducer/playerSlice";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { pick, types } from "@react-native-documents/picker";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import CustomInputTextOnly from "../../../components/CustomInputTextOnly";
import CustomSwitch from "../../../components/CustomSwitch";
import FilterModal from "../../../components/CarFilterModal";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import UploadImageCustom from "../../../components/UploadImageCustom";
import { useUpload } from "../../../contexts/UploadContext";
import { post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import { uploadAndGetUrl, uploadFileGetUrl } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";

const topics = [
  { name: "Technology", image: Images.Topis1 },
  { name: "Politics", image: Images.Topis2 },
  { name: "Sports", image: Images.Topis3 },
  { name: "Music", image: Images.Topis4 },
  { name: "Entertainment", image: Images.Topis5 },
  { name: "Fashion", image: Images.Topis6 },
  { name: "Food", image: Images.Topis7 },
  { name: "Gaming", image: Images.Topis8 },
  { name: "Health", image: Images.Topis9 },
];

const ageLimt = [
  { name: "+14", subtitle: "14 years old or older" },
  { name: "+16", subtitle: "16 years old or older" },
  { name: "+18", subtitle: "18 years old or older" },
  { name: "+21", subtitle: "21 years old or older" },
];

const validateForm = (values) => {
  const errors = {};

  if (!values.title || values.title.trim() === "") {
    errors.title = "Title is required";
  } else if (values.title.length > 100) {
    errors.title = "Title cannot exceed 100 characters";
  }

  if (!values.audioUrl) {
    errors.audioUrl = "Audio file is required";
  }

  return errors;
};

const CreateAudio = () => {
  const navigation = useNavigation();
  const { startUpload, completeUpload, failUpload } = useUpload();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { colors } = useTheme();

  useEffect(() => {
    if (isFocused) {
      dispatch(setIsTabBarVisible(true));
    }
  }, [isFocused, dispatch]);

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isAgeLimitModalVisible, setIsAgeLimitModalVisible] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [topic, setTopic] = useState(null);
  const [ageRating, setAgeRating] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [currentHashtag, setCurrentHashtag] = useState("");
  const [tosConfirmation, setTosConfirmation] = useState(true);

  // Image state (optional cover image)
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageModal, setImageModal] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const camera = useRef(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickAudio = async () => {
    try {
      const [result] = await pick({
        type: [types.audio],
      });
      if (result) {
        setAudioFile(result);
        setAudioFileName(result.name || "Audio file");
        setAudioUploading(true);

        try {
          const audioType = result.type || "audio/mpeg";
          const audioPayload = {
            localUri: result.uri,
            name: result.name || `audio_${Date.now()}.mp3`,
            type: audioType,
          };
          const uploadRes = await uploadFileGetUrl(audioPayload, audioType);
          const uploadedUrl = uploadRes?.file || uploadRes?.url;

          if (uploadedUrl) {
            setAudioUrl(uploadedUrl);
            ToastMessage("Audio uploaded successfully", "success");
            setErrors((prev) => {
              const updated = { ...prev };
              delete updated.audioUrl;
              return updated;
            });
          } else {
            ToastMessage("Failed to upload audio", "error");
            setAudioFile(null);
            setAudioFileName("");
          }
        } catch (uploadErr) {
          console.log("Audio upload error:", uploadErr);
          ToastMessage("Failed to upload audio file", "error");
          setAudioFile(null);
          setAudioFileName("");
        } finally {
          setAudioUploading(false);
        }
      }
    } catch (error) {
      if (error?.code !== "E_PICKER_CANCELLED") {
        console.log("Audio pick error:", error);
        ToastMessage("Failed to pick audio file", "error");
      }
    }
  };

  const handleImageChange = async (file) => {
    if (file?.path) {
      try {
        setImgLoading(true);
        const mediaUrl = await uploadAndGetUrl(file);
        if (mediaUrl) {
          setUploadedImages([...uploadedImages, mediaUrl]);
          ToastMessage("Image uploaded successfully", "success");
        } else {
          ToastMessage("Failed to upload image", "error");
        }
        setImgLoading(false);
        setImageModal(false);
      } catch (error) {
        console.log("Image upload error:", error);
        setImgLoading(false);
        ToastMessage("Failed to upload image", "error");
      }
    }
  };

  const handleCapture = async (result) => {
    if (result) {
      await handleImageChange(result);
    }
  };

  const handleDeleteImage = (index) => {
    if (index !== null && index !== undefined) {
      const updatedImages = uploadedImages?.filter((_, i) => i !== index);
      setUploadedImages(updatedImages);
      setImageModal(false);
    }
  };

  const handleAddHashtag = () => {
    if (currentHashtag.trim()) {
      if (hashtags.length >= 3) {
        ToastMessage(
          "You can only add up to 3 tags. Remove a tag to add a new one.",
          "error",
        );
        return;
      }
      const tag = currentHashtag.trim().replace("#", "");
      if (!hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
      }
      setCurrentHashtag("");
    }
  };

  const handleRemoveHashtag = (index) => {
    const updatedHashtags = hashtags.filter((_, i) => i !== index);
    setHashtags(updatedHashtags);
  };

  const handleSubmit = async () => {
    try {
      const formValues = {
        title,
        audioUrl,
      };

      const validationErrors = validateForm(formValues);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        ToastMessage("Please fill all required fields", "error");
        return;
      }

      setErrors({});
      startUpload("audio", "Uploading your audio...");
      navigation.reset({
        index: 0,
        routes: [{ name: "TabStack" }],
      });

      const submitAudio = async () => {
        try {
          setIsSubmitting(true);

          const ageRatingNumber = ageRating
            ? parseInt(ageRating?.replace("+", ""))
            : undefined;

          const payload = {
            title: title.trim(),
            audio: audioUrl,
            ...(uploadedImages.length > 0 && { images: uploadedImages }),
            ...(topic?.name && { topic: topic.name }),
            ...(ageRatingNumber && { ageRating: ageRatingNumber }),
            ...(hashtags.length > 0 && { hashtags }),
            privacy: {
              TOS: tosConfirmation,
            },
          };

          const response = await post("radio", payload);

          if (response?.data?.success) {
            completeUpload("Audio post created successfully");
          } else {
            const errorMessage =
              response?.data?.message ||
              response?.message ||
              "Failed to create audio post";
            failUpload(errorMessage);
          }
        } catch (error) {
          console.error("Error submitting audio:", error);
          failUpload("Failed to create audio post. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      };

      submitAudio();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setIsSubmitting(false);
    }
  };

  // Real-time error clearing
  const clearError = (field) => {
    setErrors((prev) => {
      if (prev[field]) {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      }
      return prev;
    });
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title="Create Audio Post" />}
      footerUnScrollable={() => (
        <View
          style={{
            paddingHorizontal: 12,
            marginBottom: 20,
            paddingTop: 6,
            gap: 8,
          }}
        >
          <CustomButton
            title="Publish"
            color={COLORS.primaryColor}
            fontSize={16}
            fontFamily={fonts.medium}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={
              !title.trim() ||
              !audioUrl ||
              isSubmitting ||
              imgLoading ||
              audioUploading
            }
          />
        </View>
      )}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={styles.section}>
          <CustomInput
            withLabel="TITLE"
            height={60}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              clearError("title");
            }}
            placeholder="Enter audio title"
            error={errors.title}
          />
          {errors.title && (
            <ErrorComponent errorTitle={errors.title} color="#EE1045" />
          )}
        </View>

        {/* Audio File Picker */}
        <View style={styles.section}>
          <CustomText
            label="AUDIO FILE"
            fontSize={12}
            fontFamily={fonts.medium}
            color={colors.textSecondary}
            marginBottom={8}
          />
          <TouchableOpacity
            style={[styles.audioPicker, { backgroundColor: colors.surfaceAlt }]}
            onPress={handlePickAudio}
            disabled={audioUploading}
          >
            <View style={styles.audioPickerInner}>
              {audioUploading ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.buttonColor} />
                  <CustomText
                    label="Uploading audio..."
                    fontSize={14}
                    fontFamily={fonts.medium}
                    marginLeft={8}
                    color={COLORS.subtitle}
                  />
                </>
              ) : audioFile ? (
                <>
                  <Icons
                    family="MaterialIcons"
                    name="audiotrack"
                    size={24}
                    color={colors.text}
                  />
                  <CustomText
                    label={audioFileName}
                    fontSize={14}
                    fontFamily={fonts.medium}
                    marginLeft={8}
                    flex={1}
                    numberOfLines={2}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setAudioFile(null);
                      setAudioFileName("");
                      setAudioUrl(null);
                    }}
                    style={styles.removeAudio}
                  >
                    <Image
                      source={Images.crossGray}
                      style={{ height: 16, width: 16, tintColor: colors.text }}
                    />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Icons
                    family="MaterialIcons"
                    name="audio-file"
                    size={24}
                    color={colors.textSecondary}
                  />
                  <CustomText
                    label="Tap to select audio file"
                    fontSize={14}
                    color={colors.textSecondary}
                    marginLeft={8}
                  />
                  <Icons
                    family="Feather"
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </>
              )}
            </View>
          </TouchableOpacity>
          {errors.audioUrl && (
            <ErrorComponent errorTitle={errors.audioUrl} color="#EE1045" />
          )}
        </View>

        <Divider
          marginVertical={16}
          thickness={1}
          color={colors.surfaceAlt}
        />

        {/* Cover Image Section (Optional) */}
        <View style={styles.section}>
          <CustomText
            label="COVER IMAGE (OPTIONAL)"
            fontSize={12}
            fontFamily={fonts.medium}
            color={colors.textSecondary}
            marginBottom={8}
          />
          <View style={styles.imagesRow}>
            <TouchableOpacity
              style={[
                styles.addPic,
                {
                  width: 60,
                  height: 60,
                  marginTop: uploadedImages?.length === 0 ? 8 : 0,
                  borderColor: colors.surfaceAlt,
                },
              ]}
              onPress={() => setImageModal(true)}
              disabled={imgLoading}
            >
              <View style={[styles.innerborder, { borderColor: colors.surfaceAlt }]}>
                {imgLoading ? (
                  <View style={styles.uploadingIndicator}>
                    <ActivityIndicator
                      size="small"
                      color={COLORS.buttonColor}
                    />
                  </View>
                ) : (
                  <>
                    <Image
                      source={Images.camera1}
                      style={{
                        height: 20,
                        width: 20,
                        tintColor: colors.iconMuted,
                        alignSelf: "center",
                      }}
                    />
                    <CustomText
                      label="Add more"
                      fontSize={8}
                      color={colors.iconMuted}
                      marginTop={4}
                    />
                  </>
                )}
              </View>
            </TouchableOpacity>

            {uploadedImages?.length > 0 && (
              <View style={{ flexDirection: "row" }}>
                {uploadedImages.map((item, index) => (
                  <TouchableOpacity
                    key={`uploaded-${index}`}
                    onPress={() => setSelectedImageIndex(index)}
                    style={{
                      marginRight: 6,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor:
                        selectedImageIndex === index
                          ? colors.text
                          : colors.surfaceAlt,
                    }}
                  >
                    <ImageFast
                      source={{ uri: item }}
                      style={{
                        height: 64,
                        width: 64,
                        borderRadius: 12,
                      }}
                    />
                    <TouchableOpacity
                      style={styles.deleteImageBtn}
                      onPress={() => handleDeleteImage(index)}
                    >
                      <ImageFast
                        source={Images.delImage}
                        style={{ height: 14, width: 14 }}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <Divider
          marginVertical={16}
          thickness={1}
          color={colors.surfaceAlt}
        />

        {/* Topic */}
        <CustomInputTextOnly
          onPress={() => setIsFilterModalVisible(true)}
          withLabel="TOPIC"
          placeholder={topic?.name || "Select Topic"}
          value={topic?.name}
          Isicon
          error={errors.topic}
        />

        {/* Age Rating */}
        <CustomInputTextOnly
          onPress={() => setIsAgeLimitModalVisible(true)}
          withLabel="AGE RATING"
          placeholder="Select Age Rating"
          value={ageRating}
          Isicon
          error={errors.ageRating}
        />

        {/* Hashtags */}
        <View style={styles.hashtagInputContainer}>
          <View style={styles.hashtagInput}>
            <CustomInput
              value={currentHashtag}
              onChangeText={setCurrentHashtag}
              placeholder="Add hashtag"
              onSubmitEditing={handleAddHashtag}
              withLabel="HASHTAGS"
              returnKeyType="Enter"
            />
          </View>
        </View>

        {hashtags.length > 0 && (
          <View style={styles.hashtagsContainer}>
            {hashtags.map((tag, index) => (
              <View key={`hashtag-${index}`} style={styles.hashtagChip}>
                <CustomText
                  label={`#${tag}`}
                  color={colors.text}
                  fontSize={14}
                  fontFamily={fonts.medium}
                />
                <TouchableOpacity
                  onPress={() => handleRemoveHashtag(index)}
                  style={styles.removeHashtagButton}
                >
                  <Image source={Images.crossGray} style={[styles.closeIcon, { tintColor: colors.text }]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Divider
          marginVertical={16}
          thickness={1}
          color={colors.surfaceAlt}
        />

        {/* TOS Confirmation */}
        <View style={[styles.row, { marginBottom: 40, backgroundColor: colors.surfaceAlt }]}>
          <View style={{ width: "80%" }}>
            <CustomText
              fontSize={12}
              label="I HEREBY CONFIRM THE POST IS WITHIN TOS"
              fontFamily={fonts.medium}
              color={colors.textSecondary}
            />
            <CustomText
              label={tosConfirmation ? "Yes" : "No"}
              fontSize={16}
              color={colors.text}
            />
          </View>
          <CustomSwitch value={tosConfirmation} setValue={setTosConfirmation} />
        </View>
        {errors.tosConfirmation && (
          <ErrorComponent
            errorTitle={errors.tosConfirmation}
            color="#EE1045"
            marginBottom={16}
          />
        )}

        {/* Filter Modals */}
        <FilterModal
          isVisible={isFilterModalVisible}
          onDisable={() => setIsFilterModalVisible(false)}
          title="Select A Topic"
          subtitle="Select your filters"
          filters={topics}
          onItemPress={(item) => {
            setTopic(item);
            setIsFilterModalVisible(false);
          }}
        />
        <FilterModal
          isVisible={isAgeLimitModalVisible}
          onDisable={() => setIsAgeLimitModalVisible(false)}
          title="Select Age Limit"
          subtitle="Choose age restriction"
          filters={ageLimt}
          onItemPress={(item) => {
            const age = item?.name ?? item;
            setAgeRating(age);
            setIsAgeLimitModalVisible(false);
          }}
        />
        <UploadImageCustom
          images={uploadedImages}
          camera={camera}
          onDelete={handleDeleteImage}
          imageModal={imageModal}
          imgLoading={imgLoading}
          handleChange={handleImageChange}
          handleCapture={handleCapture}
          setImageModal={setImageModal}
        />

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default CreateAudio;

const styles = StyleSheet.create({
  section: {
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    height: 56,
  },
  audioPicker: {
    borderRadius: 12,
    padding: 16,
  },
  audioPickerInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  removeAudio: {
    padding: 4,
  },
  addPic: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 5,
  },
  innerborder: {
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: "dashed",
    height: 50,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  imagesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteImageBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: COLORS.red,
    borderRadius: 99,
    height: 20,
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingIndicator: {
    justifyContent: "center",
    alignItems: "center",
  },
  hashtagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hashtagInput: {
    flex: 1,
  },
  hashtagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  hashtagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A1937529",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  removeHashtagButton: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    width: 12,
    height: 12,
  },
});
