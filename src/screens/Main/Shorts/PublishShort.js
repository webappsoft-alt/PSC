import { CommonActions, useIsFocused, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setIsTabBarVisible } from "../../../store/reducer/playerSlice";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Video from "react-native-video";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import Blur from "../../../components/Blur";
import FilterModal from "../../../components/CarFilterModal";
import CustomButton from "../../../components/CustomButton";
import CustomDatePicker from "../../../components/CustomDatePicker";
import CustomDropdown from "../../../components/CustomDropdown";
import CustomInput from "../../../components/CustomInput";
import CustomInputTextOnly from "../../../components/CustomInputTextOnly";
import CustomModalGooglePlaces from "../../../components/CustomModalGooglePlaces";
import CustomSwitch from "../../../components/CustomSwitch";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import ImageFast from "../../../components/ImageFast";
import Icons from "../../../components/Icons";
import ProgressiveBlur from "../../../components/ProgressiveBlur";
import ScreenWrapper, { ScreenHeaderSpacer } from "../../../components/ScreenWrapper";
import UploadImageCustom from "../../../components/UploadImageCustom";
import { useUpload } from "../../../contexts/UploadContext";
import { post, put } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { uploadAndGetUrl, uploadFileGetUrl } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import PeopleSelection from "../PublishPost/molecules/PeopleSelection";
import { useTheme } from "../../../contexts/ThemeContext";

// Validation function
const validateForm = (values) => {
  const errors = {};

  // Description
  if (!values.description || values.description.trim() === "") {
    errors.description = "Description is required";
  } else if (values.description.length > 250) {
    errors.description = "Description cannot exceed 250 characters";
  }

  // Size
  if (!values.size) {
    errors.size = "Image size is required";
  }

  // Images
  if (!values.images || values.images.length === 0) {
    errors.images = "At least one image is required";
  }

  // Topic
  if (!values.topic) {
    errors.topic = "Topic is required";
  }

  // Age Rating
  if (!values.ageRating) {
    errors.ageRating = "Age rating is required";
  }

  // Content Rating
  if (!values.contentRating) {
    errors.contentRating = "Content visibility is required";
  }

  // Location
  if (!values.location) {
    errors.location = "Location is required";
  } else if (
    !values.location.address ||
    !values.location.latitude ||
    !values.location.longitude
  ) {
    errors.location = "Complete location details are required";
  }

  // Available To
  if (!values.availableTo || values.availableTo.length === 0) {
    errors.availableTo = "At least one availability option is required";
  }

  // TOS Confirmation
  if (!values.tosConfirmation) {
    errors.tosConfirmation = "You must confirm the post is within TOS";
  }

  return errors;
};

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

const Rating = [
  { name: "Public" },
  { name: "Followers" },
  { name: "BFFs" },
  { name: "Private" },
];

// Permission fields array for rendering
const permissionFields = [
  { key: "canUpvote", label: "CAN UPVOTE?" },
  { key: "canComment", label: "CAN COMMENT?" },
  { key: "canRepost", label: "CAN REPOST?" },
  { key: "canShare", label: "CAN SHARE" },
  { key: "canSave", label: "CAN SAVE?" },
];

// Available To options for FilterModal
const availableToOptions = [
  { name: "Public" },
  { name: "Private" },
  { name: "Premium" },
  { name: "PremiumPlus" },
];

const PublishShort = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { startUpload, completeUpload, failUpload } = useUpload();
  const { colors } = useTheme();

  useEffect(() => {
    if (isFocused) {
      dispatch(setIsTabBarVisible(true));
    }
  }, [isFocused, dispatch]);
  const videoUriFromParams = route?.params?.videoUri;
  const videoDuration = route?.params?.duration;
  const startTime = route?.params?.startTime || 0;
  const endTime = route?.params?.endTime || 0;
  const videoRef = useRef(null);

  // console.log("videoDuration----", videoDuration);

  // Check if we're in edit mode
  const editMode = route?.params?.editMode || false;
  const existingPost = route?.params?.postData || null;
  const parentPostId = route?.params?.parentPostId || null;

  // Helper function to transform API data for edit mode
  const transformPostDataForEdit = (postData) => {
    if (!postData) return null;

    const transformed = { ...postData };

    // Transform age rating from number to "+XX" format
    if (typeof postData.ageRating === "number") {
      transformed.ageRating = `+${postData.ageRating}`;
    }

    // Transform availableTo from API format to display format
    if (
      Array.isArray(postData.availableTo) &&
      postData.availableTo.length > 0
    ) {
      transformed.availableTo = postData.availableTo.map((value) => {
        // Convert "premiumPlus" to "PremiumPlus", others capitalize first letter
        if (value === "premiumPlus") return "PremiumPlus";
        return value.charAt(0).toUpperCase() + value.slice(1);
      });
    }

    // Transform startDate from object to Date
    if (postData.startDate && typeof postData.startDate === "object") {
      const { date, time } = postData.startDate;
      transformed.startDate =
        date && date.trim() !== "" ? new Date(`${date}T00:00:00`) : null;
      transformed.startTime =
        time && time.trim() !== "" ? new Date(`2000-01-01T${time}:00`) : null;
    }

    // Transform endDate from object to Date
    if (postData.endDate && typeof postData.endDate === "object") {
      const { date, time } = postData.endDate;
      transformed.endDate =
        date && date.trim() !== "" ? new Date(`${date}T00:00:00`) : null;
      transformed.endTime =
        time && time.trim() !== "" ? new Date(`2000-01-01T${time}:00`) : null;
    }

    // Transform privacy back to permissions
    if (postData.privacy) {
      transformed.permissions = {
        canUpvote: postData.privacy.upvote ?? false,
        canComment: postData.privacy.comment ?? false,
        canRepost: postData.privacy.repost ?? false,
        canShare: postData.privacy.share ?? false,
        canSave: postData.privacy.save ?? false,
      };
      transformed.tosConfirmation = postData.privacy.TOS ?? false;
    }

    // Map mentions to collaborators and sponsors
    transformed.collaborators =
      postData.mentionBy || postData.mentions || postData.collaborators || [];
    transformed.sponsors = postData.sponsors || postData.sponsoredBy || [];

    // Handle topic object mapping
    if (typeof postData.topic === "string") {
      const foundTopic = topics.find((t) => t.name === postData.topic);
      if (foundTopic) {
        transformed.topic = foundTopic;
      }
    }

    // Transform location if coordinates is an array
    if (postData.location && Array.isArray(postData.location.coordinates)) {
      transformed.location = {
        address: postData.location.address,
        latitude: postData.location.coordinates[1],
        longitude: postData.location.coordinates[0],
        city: postData.location.city || "",
        country: postData.location.country || "",
      };
    }

    // Transform description if it's an array
    if (Array.isArray(postData.description)) {
      transformed.description = postData.description[0] || "";
      if (postData.description.length > 1) {
        transformed.threads = postData.description.slice(1).map((desc) => ({
          description: desc,
          id: Math.random().toString(36).substr(2, 9),
        }));
      }
    }

    return transformed;
  };

  const transformedPost =
    editMode || parentPostId
      ? transformPostDataForEdit(existingPost)
      : existingPost;

  const [HandleImageSelect, setHandleImageSelect] = useState(null);
  const [isAddStepModal, setIsAddStepModal] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isAgeLimitModalVisible, setIsAgeLimitModalVisible] = useState(false);
  const [isContentRatingModalVisible, setIsContentRatingModalVisible] =
    useState(false);
  const [isAvailableToModalVisible, setIsAvailableToModalVisible] =
    useState(false);
  const [currentHashtag, setCurrentHashtag] = useState("");

  const [uploadedImages, setUploadedImages] = useState(
    transformedPost?.images || [],
  );
  const [uploadedMediaTypes, setUploadedMediaTypes] = useState(
    transformedPost?.images?.map(() => "image") || [],
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageModal, setImageModal] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const camera = useRef(null);

  // Form state
  const [description, setDescription] = useState(
    transformedPost?.description || "",
  );
  const [size, setSize] = useState(transformedPost?.size || "1:1 ratio");
  const [images, setImages] = useState(uploadedImages);
  const [topic, setTopic] = useState(transformedPost?.topic || null);
  const [ageRating, setAgeRating] = useState(transformedPost?.ageRating || "");
  const [hashtags, setHashtags] = useState(transformedPost?.hashtags || []);
  const [contentRating, setContentRating] = useState(
    transformedPost?.contentRating || "Public",
  );
  const [location, setLocation] = useState(transformedPost?.location || null);
  const [collaborators, setCollaborators] = useState(
    transformedPost?.collaborators || [],
  );
  const [sponsors, setSponsors] = useState(transformedPost?.sponsors || []);
  const [startDate, setStartDate] = useState(
    transformedPost?.startDate || null,
  );
  const [availableTo, setAvailableTo] = useState(
    transformedPost?.availableTo || ["Public"],
  );
  const [permissions, setPermissions] = useState(
    transformedPost?.permissions || {
      canUpvote: true,
      canComment: true,
      canRepost: true,
      canShare: true,
      canSave: true,
    },
  );
  const [tosConfirmation, setTosConfirmation] = useState(
    transformedPost?.tosConfirmation ?? true,
  );
  const [makeItContinuous, setMakeItContinuous] = useState(
    transformedPost?.makeItContinuous ?? true,
  );

  const [videoUrl, setVideoUrl] = useState(null);
  const [mutedVideos, setMutedVideos] = useState({});

  // Toggle mute for current video
  const toggleMute = useCallback(() => {
    setMutedVideos((prev) => ({
      ...prev,
      [selectedImageIndex]: !prev[selectedImageIndex],
    }));
  }, [selectedImageIndex]);

  // Get mute state for current video
  const isCurrentVideoMuted = () => {
    return mutedVideos[selectedImageIndex] || false;
  };

  useEffect(() => {
    if (videoUriFromParams) {
      setUploadedImages([videoUriFromParams]);
      setUploadedMediaTypes(["video"]);
      setImages([videoUriFromParams]);
    }
  }, [videoUriFromParams]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      videoRef.current?.pause();
    });
    return () => {
      videoRef.current?.pause();
      unsubscribe();
    };
  }, [navigation]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // People Selection State
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [selectionType, setSelectionType] = useState("collaborators");

  const navigateToHome = () => {
    try {
      // Step 1: Pehle MainStack ko reset karo TabStack pe
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "TabStack",
              // TabStack ke andar Home tab select karo
              state: {
                index: 0,
                routes: [{ name: "Home" }],
              },
            },
          ],
        }),
      );
    } catch (e) {
      // Fallback: agar reset kaam nahi kare

      navigation.navigate("TabStack", {
        screen: "Home",
      });
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form
      const formValues = {
        description,
        size,
        images: uploadedImages,
        topic,
        ageRating,
        hashtags,
        contentRating,
        location,
        availableTo,
        permissions,
        tosConfirmation,
      };

      const validationErrors = validateForm(formValues);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        console.log("Form Errors:", validationErrors);
        ToastMessage("Please fill all required fields", "error");
        return;
      }

      setErrors({});

      // If in edit mode, we still wait for navigation because it's an update
      if (editMode) {
        setIsSubmitting(true);
      } else {
        // Create mode - instant navigation
        startUpload("post", "Uploading your Short...");
        navigateToHome();
      }

      // Helper function to handle the actual submission logic
      const submitPost = async () => {
        try {
          setIsSubmitting(true);

          // Extract age rating number
          const ageRatingNumber = parseInt(ageRating?.replace("+", ""));

          // Transform availableTo to lowercase/camelCase array
          const availableToArray = availableTo.map((item) => {
            // Convert "PremiumPlus" to "premiumPlus", others to lowercase
            if (item === "PremiumPlus") return "premiumPlus";
            return item.toLowerCase();
          });

          // Prepare API payload matching the required structure
          const payload = {
            description: [description],
            video: uploadedImages[0],
            duration: videoDuration,
            size,
            topic: topic?.name,
            ageRating: ageRatingNumber,
            type: "reel",
            mentions: collaborators.map((u) =>
              typeof u === "string" ? u : u?._id || u?.id,
            ),
            hashtags,
            location: {
              type: "Point",
              coordinates: [location?.longitude || 0, location?.latitude || 0],
              city: location?.city || "",
              country: location?.country || "",
              address: location?.address || "",
            },
            sponsoredBy: sponsors.map((u) =>
              typeof u === "string" ? u : u?._id || u?.id,
            ),
            availableTo: availableToArray,
            privacy: {
              upvote: permissions.canUpvote,
              comment: permissions.canComment,
              repost: permissions.canRepost,
              share: permissions.canShare,
              save: permissions.canSave,
              TOS: tosConfirmation,
            },
            makeItContinuous: makeItContinuous,
            ...(parentPostId && { parentPostId }),
          };
          console.log("formm---", payload);

          if (editMode && (existingPost?._id || existingPost?.id)) {
            // Edit mode - update existing post
            const response = await put(
              `posts/${existingPost._id || existingPost.id}`,
              payload,
            );
            console.log("Update Response:", response);

            if (response?.data?.success) {
              ToastMessage("Post updated successfully", "success");
              navigation.goBack();
            } else {
              const errorMessage =
                response?.data?.message ||
                response?.message ||
                "Failed to update post";
              console.error("Update failed:", response);
              ToastMessage(errorMessage, "error");
            }
          } else {
            // Handle image/video uploads if needed (e.g. videoUri from previous screen)
            let finalizedImages = [...uploadedImages];
            if (
              videoUriFromParams &&
              videoUriFromParams.startsWith("file://")
            ) {
              const videoFile = {
                localUri: videoUriFromParams,
                name: `video_${Date.now()}.mp4`,
                type: "video/mp4",
              };
              const uploadRes = await uploadFileGetUrl(videoFile, "video/mp4");
              const uploadedUrl = uploadRes?.file || uploadRes?.url;
              if (uploadedUrl) {
                finalizedImages = [uploadedUrl];
                payload.images = finalizedImages;
              } else {
                throw new Error("Video upload failed");
              }
            }

            // Create mode - create new post
            const response = await post("posts", payload);
            console.log("Create Response:", response);

            if (response?.data?.success) {
              completeUpload("Post created successfully");
            } else {
              const errorMessage =
                response?.data?.message ||
                response?.message ||
                "Failed to create post";
              console.error("Create failed:", response);
              failUpload(errorMessage);
            }
          }
        } catch (error) {
          console.error("Error submitting post:", error);
          if (editMode) {
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              "Failed to submit post";
            ToastMessage(errorMessage, "error");
          } else {
            failUpload("Failed to create post. Please try again.");
          }
        } finally {
          setIsSubmitting(false);
        }
      };

      // Execute submission in background
      submitPost();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = async (locationData) => {
    // Save the selected location with all required fields
    setLocation({
      address: locationData?.address,
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      city: locationData?.city || "",
      country: locationData?.country || "",
    });
    setIsAddStepModal(false);
  };

  const handleAddHashtag = () => {
    if (currentHashtag.trim()) {
      // Check if already have 3 tags
      if (hashtags.length >= 3) {
        ToastMessage(
          "You can only add up to 3 tags. Remove a tag to add a new one.",
          "error",
        );
        return;
      }

      // Remove '#' if user added it, we'll add it when displaying
      const tag = currentHashtag.trim().replace("#", "");

      // Check if hashtag already exists
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

  // Image/Video upload handlers
  const handleImageChange = async (file) => {
    if (file?.path) {
      try {
        setImgLoading(true);
        // Detect if file is a video based on mime type or file extension
        const isVideo =
          file?.mime?.startsWith("video/") ||
          file?.type?.startsWith("video/") ||
          file?.path?.match(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i);

        let mediaUrl;

        if (isVideo) {
          // Upload video using uploadFileGetUrl
          const videoType = file?.mime || file?.type || "video/mp4";
          const videoFile = {
            localUri: file?.path,
            name: file?.filename || file?.name || `video_${Date.now()}.mp4`,
            type: videoType,
          };

          const response = await uploadFileGetUrl(videoFile, videoType);
          mediaUrl = response?.file || response?.url;

          if (mediaUrl) {
            ToastMessage("Video uploaded successfully", "success");
          }
        } else {
          // Upload image using uploadAndGetUrl
          mediaUrl = await uploadAndGetUrl(file);

          if (mediaUrl) {
            ToastMessage("Image uploaded successfully", "success");
          }
        }

        if (mediaUrl) {
          const newImages = [...uploadedImages, mediaUrl];
          const newMediaTypes = [
            ...uploadedMediaTypes,
            isVideo ? "video" : "image",
          ];
          setUploadedImages(newImages);
          setUploadedMediaTypes(newMediaTypes);
          setImages(newImages); // Sync with form state
          setSelectedImageIndex(uploadedImages.length); // Select the newly added media
        } else {
          ToastMessage(
            `Failed to upload ${isVideo ? "video" : "image"}`,
            "error",
          );
        }

        setImgLoading(false);
        setImageModal(false);
      } catch (error) {
        console.log("Media upload error:", error);
        setImgLoading(false);
        ToastMessage("Failed to upload media", "error");
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
      const updatedMediaTypes = uploadedMediaTypes?.filter(
        (_, i) => i !== index,
      );
      setUploadedImages(updatedImages);
      setUploadedMediaTypes(updatedMediaTypes);
      setImages(updatedImages); // Sync with form state

      // Adjust selected index if needed
      if (selectedImageIndex >= updatedImages?.length) {
        setSelectedImageIndex(Math.max(0, updatedImages.length - 1));
      }
      setImageModal(false);
    }
  };

  // Calculate aspect ratio based on selected size
  const getAspectRatioStyle = () => {
    const containerWidth = 358; // Approximate width based on padding
    let height;

    switch (size) {
      case "1:1 ratio":
        height = containerWidth; // Square
        break;
      case "4:5 ratio":
        height = (containerWidth * 5) / 4; // Portrait
        break;
      case "16:9 ratio":
        height = (containerWidth * 9) / 16; // Landscape
        break;
      default:
        height = containerWidth;
    }

    return { height };
  };

  // Log validation errors for debugging
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Form Validation Errors:", errors);
    }
  }, [errors]);

  // Real-time error clearing: when a field becomes valid, remove its error
  useEffect(() => {
    setErrors((prevErrors) => {
      const updated = { ...prevErrors };
      let changed = false;

      if (
        updated.description &&
        description.trim() !== "" &&
        description.length <= 250
      ) {
        delete updated.description;
        changed = true;
      }
      if (updated.size && size) {
        delete updated.size;
        changed = true;
      }
      if (updated.images && uploadedImages.length > 0) {
        delete updated.images;
        changed = true;
      }
      if (updated.topic && topic) {
        delete updated.topic;
        changed = true;
      }
      if (updated.ageRating && ageRating) {
        delete updated.ageRating;
        changed = true;
      }
      if (updated.contentRating && contentRating) {
        delete updated.contentRating;
        changed = true;
      }
      if (
        updated.location &&
        location?.address &&
        location?.latitude &&
        location?.longitude
      ) {
        delete updated.location;
        changed = true;
      }
      if (updated.availableTo && availableTo.length > 0) {
        delete updated.availableTo;
        changed = true;
      }
      if (updated.tosConfirmation && tosConfirmation) {
        delete updated.tosConfirmation;
        changed = true;
      }

      return changed ? updated : prevErrors;
    });
  }, [
    description,
    size,
    uploadedImages,
    topic,
    ageRating,
    contentRating,
    location,
    availableTo,
    tosConfirmation,
  ]);

  const screenWidth = Dimensions.get("window").width;
  const [scrollOffset, setScrollOffset] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setScrollOffset(contentOffsetX);
    const index = Math.round(contentOffsetX / (screenWidth - 32));
    setCarouselIndex(index);
    setSelectedImageIndex(index);
  };

  const getBorderRadiusStyle = (index) => {
    const cardWidth = screenWidth - 32;
    const scrollProgress = scrollOffset / cardWidth;
    const currentIndex = Math.round(scrollProgress);
    const isScrolling = Math.abs(scrollProgress - currentIndex) > 0.01;

    if (!isScrolling) {
      return {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
      };
    }

    if (index === Math.floor(scrollProgress)) {
      return {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 0,
      };
    } else if (index === Math.ceil(scrollProgress)) {
      return {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 16,
      };
    }

    return {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    };
  };

  return (
    <ScreenWrapper
      headerBlur
      headerUnScrollable={() => (
        <Header
          title={editMode ? "Edit Reel" : "Publish Reel"}
          rightIcon={
            <Image source={Images.thread} style={{ height: 40, width: 40 }} />
          }
        />
      )}
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
            title={editMode ? "Update Post" : "Publish"}
            color={COLORS.primaryColor}
            fontSize={16}
            fontFamily={fonts.medium}
            onPress={handleSubmit}
            loading={isSubmitting || imgLoading}
            disabled={isSubmitting || imgLoading}
          />

          {/* <CustomButton
              title={"cancel"}
              color={COLORS.white}
              fontSize={16}
              backgroundColor={"#FFFFFF0A"}
              fontFamily={fonts.medium}
              onPress={() => {
                navigation.goBack();
              }}
            /> */}
        </View>
      )}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* starts below the floating blurred header */}
        <ScreenHeaderSpacer />
        {uploadedImages?.length > 0 && (
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={screenWidth - 32}
              snapToAlignment="center"
              disableIntervalMomentum={true}
              style={{ borderRadius: 16, overflow: "hidden" }}
            >
              {uploadedImages.map((imageUri, index) => (
                <View
                  key={index}
                  style={{
                    width: screenWidth - 32,
                    height: getAspectRatioStyle().height,
                  }}
                >
                  {uploadedMediaTypes[index] === "video" ? (
                    <Video
                      ref={index === carouselIndex ? videoRef : null}
                      source={{ uri: imageUri }}
                      style={[
                        styles.post,
                        getAspectRatioStyle(),
                        getBorderRadiusStyle(index),
                      ]}
                      controls={false}
                      resizeMode="cover"
                      paused={index !== carouselIndex}
                      repeat={true}
                      muted={mutedVideos[index] || false}
                      onLoad={(data) => {
                        if (startTime > 0 && index === carouselIndex) {
                          videoRef.current?.seek(startTime);
                        }
                      }}
                      onProgress={(data) => {
                        if (
                          endTime > 0 &&
                          data.currentTime >= endTime &&
                          index === carouselIndex
                        ) {
                          videoRef.current?.seek(startTime);
                        }
                      }}
                    />
                  ) : (
                    <ImageFast
                      source={{ uri: imageUri }}
                      style={[
                        styles.post,
                        getAspectRatioStyle(),
                        getBorderRadiusStyle(index),
                      ]}
                    />
                  )}

                  <View
                    style={styles.topBlurContainer}
                    pointerEvents="none"
                  >
                    <ProgressiveBlur
                      intensity={80}
                      direction="top"
                      tint="dark"
                      height={80}
                      imageUri={imageUri}
                      style={{
                        borderTopLeftRadius: getBorderRadiusStyle(index).borderTopLeftRadius,
                        borderTopRightRadius: getBorderRadiusStyle(index).borderTopRightRadius,
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      }}
                    />
                  </View>

                  <View
                    style={styles.bottomBlurContainer}
                    pointerEvents="none"
                  >
                    <ProgressiveBlur
                      intensity={80}
                      direction="bottom"
                      tint="dark"
                      height={80}
                      imageUri={imageUri}
                      style={{
                        borderBottomLeftRadius: getBorderRadiusStyle(index).borderBottomLeftRadius,
                        borderBottomRightRadius: getBorderRadiusStyle(index).borderBottomRightRadius,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                      }}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            {uploadedMediaTypes[carouselIndex] === "video" && (
              <TouchableOpacity
                onPress={toggleMute}
                style={[styles.muteButton, { zIndex: 99 }]}
              >
                <Blur />
                <Icons
                  name={isCurrentVideoMuted() ? "volume-up" : "volume-off"}
                  family={"MaterialIcons"}
                  size={16}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            )}

            {!videoUriFromParams && (
              <TouchableOpacity
                style={[styles.CrossIcon, { zIndex: 99 }]}
                onPress={() => handleDeleteImage(carouselIndex)}
              >
                <Blur />
                <ImageFast
                  resizeMode={"contain"}
                  source={Images.delImage}
                  style={styles.icon}
                />
              </TouchableOpacity>
            )}

            {uploadedImages?.length > 1 && (
              <View
                style={[
                  styles.rowSwipper,
                  { position: "absolute", bottom: 16, overflow: "hidden", zIndex: 99 },
                ]}
              >
                <Blur
                  blurType="light"
                  blurAmount={12}
                  borderRadius={8}
                  reducedTransparencyFallbackColor="transparent"
                />
                {uploadedImages?.map((_, idx) => (
                  <View
                    key={`indicator-${idx}`}
                    style={[
                      styles.indicator,
                      idx === carouselIndex
                        ? styles.activeIndicator
                        : styles.inactiveIndicator,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {uploadedImages?.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginVertical: 16,
            }}
          >
            {["1:1 ratio", "4:5 ratio", "16:9 ratio"].map((item, index) => {
              const isSelected = size === item;
              return (
                <TouchableOpacity
                  key={`ratio-${index}`}
                  onPress={() => setSize(item)}
                  style={[
                    styles.ratio,
                    { backgroundColor: isSelected ? colors.text : colors.surface },
                    isSelected && styles.selected,
                  ]}
                >
                  <CustomText
                    label={item}
                    fontSize={14}
                    fontFamily={fonts.medium}
                    color={isSelected ? colors.background : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {errors.size && (
          <ErrorComponent errorTitle={errors.size} color="#EE1045" />
        )}

        {/* Image Upload Section */}
        {!videoUriFromParams && (
          <View style={styles.itemCard}>
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
                    <>
                      <View style={styles.uploadingIndicator}>
                        <ActivityIndicator
                          size="small"
                          color={COLORS.buttonColor}
                        />
                      </View>
                    </>
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
                <FlatList
                  data={uploadedImages}
                  keyExtractor={(item, idx) => `uploaded-${idx}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() => setSelectedImageIndex(index)}
                      style={[
                        {
                          marginRight: 6,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor:
                            selectedImageIndex === index
                              ? colors.text
                              : colors.surfaceAlt,
                        },
                      ]}
                    >
                      <ImageFast
                        source={{ uri: item }}
                        style={{
                          height: 64,
                          width: 64,
                          borderRadius: 12,
                        }}
                      />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        )}

        {/* Image upload validation error */}
        {!videoUriFromParams &&
          uploadedImages?.length === 0 &&
          errors.images && (
            <ErrorComponent
              errorTitle="At least one image is required"
              color="#EE1045"
              marginTop={8}
            />
          )}

        <Divider
          marginVertical={16}
          thickness={1}
          color={colors.surfaceAlt}
        />

        {/* Description Section */}
        <View style={styles.threadContainer}>
          <View>
            <CustomInput
              multiline
              withLabel={"WHAT'S HAPPENING"}
              height={220}
              value={description}
              onChangeText={setDescription}
              placeholder="What's on your mind?"
              error={errors.description}
              publishPost
              enableMentionHighlight
            />
            <ErrorComponent
              errorTitle={`${description?.length}/250 characters.`}
              color={description?.length > 250 ? "#EE1045" : colors.textSecondary}
            />
          </View>
        </View>

        <Divider
          marginVertical={16}
          thickness={1}
          color={colors.surfaceAlt}
        />

        <View style={[styles.row, { marginTop: 16, backgroundColor: colors.surfaceAlt }]}>
          <View style={{ width: "80%" }}>
            <CustomText
              fontSize={12}
              label={"MAKE IT CONTINOUS"}
              fontFamily={fonts.medium}
              color={colors.textSecondary}
            />
            <CustomText
              label={makeItContinuous ? "Yes" : "No"}
              fontSize={16}
              color={colors.text}
            />
          </View>
          <CustomSwitch
            value={makeItContinuous}
            setValue={setMakeItContinuous}
          />
        </View>
        <ErrorComponent
          errorTitle={"One single collage that links all media together."}
          marginTop={6}
        />
        <Divider
          marginVertical={18}
          color={colors.surfaceAlt}
          thickness={1}
        />

        <CustomInputTextOnly
          onPress={() => setIsFilterModalVisible(true)}
          withLabel={"Topic"}
          placeholder={topic?.name || "Select Topic"}
          value={topic?.name}
          Isicon
          error={errors.topic}
        />
        <CustomInputTextOnly
          onPress={() => setIsAgeLimitModalVisible(true)}
          withLabel={"AGE RATING"}
          placeholder="Select Age Rating"
          value={ageRating}
          Isicon
          error={errors.ageRating}
        />

        {/* Hashtags Section */}
        <View style={styles.hashtagInputContainer}>
          <View style={styles.hashtagInput}>
            <CustomInput
              value={currentHashtag}
              onChangeText={setCurrentHashtag}
              placeholder="Add hashtag"
              onSubmitEditing={handleAddHashtag}
              withLabel={"Hashtags"}
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

        <CustomInputTextOnly
          onPress={() => setIsAddStepModal(true)}
          withLabel={"Location"}
          placeholder="Select Location"
          Isicon
          value={location?.address || ""}
          islocation
          iconSrc={Images.LocationArrow}
          error={errors.location}
        />

        <CustomInputTextOnly
          collabNames={collaborators.map((u) => u.firstName)}
          placeholder={"Click to select the Collaborators"}
          icColabe
          Isicon
          withLabel={"In COLLABORATION With"}
          onPress={() => {
            setSelectionType("collaborators");
            setSelectionVisible(true);
          }}
        />
        <ErrorComponent
          errorTitle={"Person working together on the same project or content."}
        />
        <CustomInputTextOnly
          collabNames={sponsors.map((u) => u.firstName)}
          icColabe
          placeholder={"Click to select the Sponsors"}
          marginTop={8}
          Isicon
          withLabel={"SPONSORED BY"}
          onPress={() => {
            setSelectionType("sponsors");
            setSelectionVisible(true);
          }}
        />
        <ErrorComponent
          errorTitle={
            "Organization supporting financially or with resources in exchange for promotion."
          }
        />

        {errors.startDate || errors.endDate ? (
          <ErrorComponent
            errorTitle={errors.startDate || errors.endDate}
            color="#EE1045"
            marginTop={4}
          />
        ) : null}
        <Divider
          marginVertical={16}
          thickness={1}
          color={colors.surfaceAlt}
        />

        <CustomDropdown
          withLabel={"AVAILABLE TO"}
          placeholder={
            availableTo.length > 0 ? availableTo.join(", ") : "Select options"
          }
          value={availableTo.length > 0 && availableTo.join(", ")}
          marginBottom={8}
          onPress={() => setIsAvailableToModalVisible(true)}
        />
        {errors.availableTo && <ErrorComponent error={errors.availableTo} />}

        {permissionFields.map((field, idx) => (
          <View
            style={[styles.row, idx > 0 && { marginTop: 8 }, { backgroundColor: colors.surfaceAlt }]}
            key={field.key}
          >
            <View style={{ width: "80%" }}>
              <CustomText
                fontSize={12}
                label={field.label}
                lineHeight={16 * 1.4}
                fontFamily={fonts.medium}
                color={colors.textSecondary}
              />
              <CustomText
                label={permissions[field.key] ? "Yes" : "No"}
                fontSize={16}
                lineHeight={12 * 1.4}
                color={colors.text}
              />
            </View>
            <CustomSwitch
              value={permissions[field.key]}
              setValue={(value) =>
                setPermissions({ ...permissions, [field.key]: value })
              }
            />
          </View>
        ))}

        <Divider
          marginVertical={16}
          thickness={1}
          color={colors.surfaceAlt}
        />

        <View style={[styles.row, { marginBottom: 40, backgroundColor: colors.surfaceAlt }]}>
          <View style={{ width: "80%" }}>
            <CustomText
              fontSize={12}
              label={"I HEREBY CONFIRM THE POST IS WITHIN TOS"}
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

        <CustomModalGooglePlaces
          isVisible={isAddStepModal}
          onClose={() => setIsAddStepModal(false)}
          onLocationSelect={handleLocationSelect}
        />
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

        <FilterModal
          isVisible={isContentRatingModalVisible}
          onDisable={() => setIsContentRatingModalVisible(false)}
          title="Select Visibility"
          subtitle="Who can view this post"
          filters={Rating}
          onItemPress={(item) => {
            const rating = item?.name ?? item;
            setContentRating(rating);
            setIsContentRatingModalVisible(false);
          }}
        />
        <FilterModal
          isVisible={isAvailableToModalVisible}
          onDisable={() => setIsAvailableToModalVisible(false)}
          title="Available To"
          subtitle="Select who can access"
          filters={availableToOptions}
          multiSelect={true}
          selectedItems={availableTo}
          onConfirm={(selectedItems) => {
            setAvailableTo(selectedItems);
          }}
        />

        <PeopleSelection
          isVisible={selectionVisible}
          onClose={() => setSelectionVisible(false)}
          selectionType={selectionType}
          initialSelected={
            selectionType === "collaborators" ? collaborators : sponsors
          }
          onConfirm={(selectedUsers) => {
            if (selectionType === "collaborators") {
              setCollaborators(selectedUsers);
            } else {
              setSponsors(selectedUsers);
            }
          }}
        />

        {/* Image Upload Modal */}
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
      </ScrollView>
    </ScreenWrapper>
  );
};

export default PublishShort;

const styles = StyleSheet.create({
  imageContainer: {
    borderWidth: 2,
    borderColor: "#FFFFFF0A",
    borderRadius: 20,
    padding: 4,
    position: "relative",
    marginTop: 8,
    overflow: "hidden",
  },

  itemCard: {},
  imagesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    height: 56,
  },
  post: {
    borderRadius: 16,
    width: "100%",
    resizeMode: "cover",
    overflow: "hidden",
  },
  topBlurContainer: {
    position: "absolute",
    top: 0,
    left: -15,
    right: 0,
    overflow: "hidden",
    zIndex: 1,
    width: "106%",
  },
  bottomBlurContainer: {
    position: "absolute",
    bottom: 0,
    left: -15,
    right: 0,
    overflow: "hidden",
    zIndex: 1,
    width: "106%",
  },
  blurView: {
    height: 68,
    position: "absolute",
    top: 5,
    width: "100%",
    left: 5,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    opacity: 0.8,
  },
  gradient: {
    height: 68,
    position: "absolute",
    top: 5,
    left: 5,
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  addPic: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 5,
  },

  blurViewend: {
    height: 68,
    position: "absolute",
    width: "100%",
    bottom: 5,
    left: 5,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    opacity: 0.8,
  },
  gradientend: {
    height: 68,
    position: "absolute",
    bottom: 5,
    width: "100%",
    left: 5,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
  },

  muteButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    paddingHorizontal: 10,
    height: 32,
    width: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 99,
    overflow: "hidden",
    zIndex: 100,
  },

  CrossIcon: {
    position: "absolute",
    overflow: "hidden",
    top: 16,
    right: 16,
    borderRadius: 100,
    height: 36,
    width: 36,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
    // borderWidth: 1,
    // borderColor: "rgba(255, 255, 255, 0.16)",
  },

  blurViewIcon: {
    overflow: "hidden",
    borderRadius: 100,
  },
  icon: {
    width: 20,
    height: 20,
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

  ratio: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginRight: 8,
    height: 32,
    paddingHorizontal: 10,
  },

  selected: {
    paddingHorizontal: 10,
    height: 32,
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    height: 32,
    width: 32,
    borderRadius: 99,
    backgroundColor: COLORS.inputBg,
  },
  userInfo: {
    marginLeft: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedIcon: {
    height: 14,
    width: 14,
    marginLeft: 4,
  },
  moreIcon: {
    height: 32,
    width: 32,
    marginLeft: 8,
  },
  wrapper: {
    gap: 4,
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  cardBg: {
    backgroundColor: COLORS.inputBg,
    padding: 10,
    borderRadius: 99,
  },
  rowSwipper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginVertical: 8,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF29",
    padding: 4,
    borderRadius: 100,
    overflow: "hidden",
  },
  rowButtons: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "space-between",
    gap: 6,
    paddingVertical: 4,
  },
  indicator: {
    height: 6,
    borderRadius: 100,
  },
  activeWidth: {
    width: 32,
    height: 8,
  },
  activeIndicator: {
    width: 32,
    backgroundColor: COLORS.white,
    height: 8,
  },
  inactiveIndicator: {
    width: 8,
    height: 8,
    backgroundColor: "#FFFFFF7A",
  },

  rowflex: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Hashtag Styles
  hashtagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hashtagInput: {
    flex: 1,
  },
  addHashtagButton: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    height: 48,
    width: 48,
    marginBottom: 8,
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
  uploadingIndicator: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Thread Styles
  threadContainer: {
    marginBottom: 0,
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  dotContainer: {
    alignItems: "center",
    marginRight: 12,
    paddingTop: 0,
    width: 16,
  },
  endDotContainer: {
    alignItems: "center",
    marginRight: 12,
    paddingTop: 0,
    marginTop: -2,
    width: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white16,
    zIndex: 1,
  },
  verticalLine: {
    width: 2,
    backgroundColor: COLORS.white16,
    flex: 1,
    marginTop: -8, // Pull up to connect with dot center/bottom
    marginBottom: -8, // Push down to connect with next dot
    zIndex: 0,
    minHeight: 240,
  },
  threadContent: {
    flex: 1,
    paddingBottom: 16,
  },
  removeThreadButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 4,
  },
  removeThreadIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.subtitle,
  },
});
