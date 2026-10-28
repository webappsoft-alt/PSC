import React, { useCallback, useEffect, useState } from "react";
import {Image,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { setIsTabBarVisible } from "../../store/reducer/playerSlice";

// Components
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import CustomInputTextOnly from "../../components/CustomInputTextOnly";
import CustomModalGooglePlaces from "../../components/CustomModalGooglePlaces";
import Header from "../../components/Header";
import ScreenWrapper, { ScreenHeaderSpacer } from "../../components/ScreenWrapper";
import Divider from "../../components/Divider";
import ErrorComponent from "../../components/ErrorComponent";
import Icons from "../../components/Icons";
import CustomSwitch from "../../components/CustomSwitch";
import CustomText from "../../components/CustomText";
import FilterModal from "../../components/CarFilterModal";
import CustomDropdown from "../../components/CustomDropdown";
import PeopleSelection from "../Main/PublishPost/molecules/PeopleSelection";
import { Images } from "../../assets/images";
import fonts from "../../assets/fonts";

// Contexts
import { useCreateCamera } from "../../contexts/CreateCameraContext";

// Services
import { createMeeting } from "../../services/videosdk";
import { COLORS } from "../../utils/COLORS";
import { useTheme } from "../../contexts/ThemeContext";
import Text from "../../components/ScaledText";

// Constants
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

const availableToOptions = [
  { name: "Public" },
  { name: "Private" },
  { name: "Premium" },
  { name: "PremiumPlus" },
];

const PublishLive = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  useEffect(() => {
    if (isFocused) {
      dispatch(setIsTabBarVisible(true));
    }
  }, [isFocused, dispatch]);
  const params = route.params || {};

  const insets = useSafeAreaInsets();
  const createCamera = useCreateCamera();

  const [loading, setLoading] = useState(false);

  // Form state
  const [liveTitle, setLiveTitle] = useState(params.liveTitleParam || "");
  const [liveCaption, setLiveCaption] = useState(params.liveCaptionParam || "");
  const [topic, setTopic] = useState(null);
  const [hashtags, setHashtags] = useState([]);
  const [currentHashtag, setCurrentHashtag] = useState("");
  const [location, setLocation] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [availableTo, setAvailableTo] = useState(["Public"]);
  const [confirmInfo, setConfirmInfo] = useState(
    params.liveConfirmInfoParam ? params.liveConfirmInfoParam === "true" : true,
  );
  const [tosConfirmed, setTosConfirmed] = useState(
    params.liveTosConfirmedParam
      ? params.liveTosConfirmedParam === "true"
      : true,
  );

  // Modal state
  const [isTopicModalVisible, setIsTopicModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isAvailableToModalVisible, setIsAvailableToModalVisible] =
    useState(false);
  const [isSelectionVisible, setIsSelectionVisible] = useState(false);
  const [selectionType, setSelectionType] = useState("collaborators");

  // Validation errors
  const [errors, setErrors] = useState({});

  const isFormValid =
    liveTitle?.trim()?.length > 0 &&
    liveCaption?.trim()?.length > 0 &&
    topic !== null &&
    hashtags.length > 0 &&
    location !== null &&
    availableTo.length > 0 &&
    confirmInfo &&
    tosConfirmed;

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    if (!liveTitle || liveTitle.trim() === "") {
      newErrors.title = "Title is required";
    }
    if (!liveCaption || liveCaption.trim() === "") {
      newErrors.caption = "Caption is required";
    }
    if (!topic) {
      newErrors.topic = "Topic is required";
    }
    if (hashtags.length === 0) {
      newErrors.hashtags = "Hashtags are required";
    }
    if (!location) {
      newErrors.location = "Location is required";
    }
    if (availableTo.length === 0) {
      newErrors.availableTo = "Available to is required";
    }
    if (!tosConfirmed) {
      newErrors.tos = "You must confirm TOS";
    }
    if (!confirmInfo) {
      newErrors.confirmInfo = "You must confirm the information";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLaunchLive = useCallback(async () => {
    try {
      if (!validateForm()) {
        return;
      }
      setLoading(true);

      const hashtagsPayload = hashtags.filter(Boolean);
      const sponsoredByPayload = sponsors.map((u) => u._id).filter(Boolean);
      const collaberationPayload = collaborators
        .map((u) => u._id)
        .filter(Boolean);

      const livePayload = {
        title: liveTitle,
        description: liveCaption,
        topic: topic?.name,
        hashtags: hashtagsPayload,
        mentions: [], // You can add mentions later if needed
        sponsoredBy: sponsoredByPayload,
        collaberation: collaberationPayload,
        availableTo: availableTo.map((item) => {
          if (item === "PremiumPlus") return "premiumPlus";
          return item.toLowerCase();
        }),
      };

      if (location) {
        livePayload.location = {
          type: "Point",
          coordinates: [
            Number(location?.longitude ?? -0.1278),
            Number(location?.latitude ?? 51.5074),
          ],
          city: location?.city || "London",
          country: location?.country || "UK",
          address: location?.address || "123 Main St",
        };
      }

      const roomRes = await createMeeting(livePayload);

      // console.log("roomResroomRes====>", roomRes);

      const meetingId =
        roomRes?.liveStream?.liveId || roomRes?.liveStream?.metadata?.roomId;

      createCamera?.setIsLiveMode(true);
      createCamera?.destroyCamera?.();
      createCamera?.setCameraReady(false);

      navigation.replace("LiveStreaming", {
        meetingId,
        liveStreamId: roomRes?.liveStream?._id,
        token: roomRes?.liveStream?.token,
        userName: "Host",
        liveTitle: liveTitle,
        liveTopic: topic?.name,
        liveCaption: liveCaption,
        liveLocation: location?.address || "",
        liveTosConfirmed: tosConfirmed ? "true" : "false",
        liveConfirmInfo: confirmInfo ? "true" : "false",
      });
    } catch (error) {
      console.error("Failed to launch live:", error);
    } finally {
      setLoading(false);
    }
  }, [
    liveTitle,
    liveCaption,
    topic,
    hashtags,
    sponsors,
    collaborators,
    availableTo,
    location,
    tosConfirmed,
    confirmInfo,
    createCamera,
    navigation,
  ]);

  const handleAddHashtag = () => {
    if (currentHashtag.trim()) {
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

  const handleLocationSelect = (locationData) => {
    setLocation({
      address: locationData?.address,
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      city: locationData?.city || "",
      country: locationData?.country || "",
    });
    setIsLocationModalVisible(false);
  };

  return (
    <ScreenWrapper
      headerBlur
      headerUnScrollable={() => <Header title="Launch A Live" />}
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
            title="Launch Live"
            onPress={handleLaunchLive}
            disabled={!isFormValid || loading}
            loading={loading}
          />
        </View>
      )}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* content starts below the floating blurred header */}
        <ScreenHeaderSpacer />
        {/* Title */}
        <CustomInput
          withLabel="TITLE"
          value={liveTitle}
          onChangeText={(text) => {
            setLiveTitle(text);
            if (text.trim() && errors.title) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.title;
                return newErrors;
              });
            }
          }}
          placeholder="Give your live a catchy name!"
          cardInfo={`${liveTitle.length}/35 characters.`}
          error={errors.title}
          marginTop={10}
        />

        {/* Caption */}
        <CustomInput
          withLabel="CAPTION"
          height={150}
          multiline
          marginTop={5}
          value={liveCaption}
          onChangeText={setLiveCaption}
          placeholder="Tell your followers what this live is about!"
          cardInfo={`${liveCaption.length}/150 characters.`}
        />

        <Divider marginVertical={18} color={colors.white04} thickness={1} />

        <CustomInputTextOnly
          onPress={() => setIsTopicModalVisible(true)}
          withLabel={"Topic"}
          placeholder={topic?.name || "Select Topic"}
          value={topic?.name}
          Isicon
          error={errors.topic}
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

        {/* Display Added Hashtags */}
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
                  <Image source={Images.crossGray} style={styles.closeIcon} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <CustomInputTextOnly
          onPress={() => setIsLocationModalVisible(true)}
          withLabel={"Location"}
          placeholder="Select Location"
          Isicon
          value={location?.address || ""}
          islocation
          iconSrc={Images.LocationArrow}
        />

        <CustomInputTextOnly
          collabNames={collaborators.map((u) => u.firstName)}
          placeholder={"Click to select the Collaborators"}
          icColabe
          Isicon
          withLabel={"In COLLABORATION With"}
          onPress={() => {
            setSelectionType("collaborators");
            setIsSelectionVisible(true);
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
            setIsSelectionVisible(true);
          }}
        />
        <ErrorComponent
          // color={COLORS.gray64}
          errorTitle={
            "Organization supporting financially or with resources in exchange for promotion."
          }
        />

        <Divider marginVertical={16} color={colors.white04} thickness={1} />

        {/* Available To */}
        <CustomDropdown
          withLabel="AVAILABLE TO"
          placeholder={
            availableTo.length > 0 ? availableTo.join(", ") : "Select options"
          }
          value={availableTo.length > 0 && availableTo.join(", ")}
          marginBottom={2}
          onPress={() => setIsAvailableToModalVisible(true)}
        />

        <Divider marginVertical={16} color={colors.white04} thickness={1} />

        {/* Confirm Info */}
        <View style={styles.row}>
          <View style={{ width: "80%" }}>
            <CustomText
              fontSize={12}
              label="CONFIRM ALL ABOVE INFORMATION"
              fontFamily={fonts.medium}
              color={colors.textSecondary}
            />
            <CustomText
              label={confirmInfo ? "Yes" : "No"}
              fontSize={16}
              color={colors.text}
            />
          </View>
          <CustomSwitch
            value={confirmInfo}
            setValue={(value) => {
              setConfirmInfo(value);
              if (value && errors.confirmInfo) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.confirmInfo;
                  return newErrors;
                });
              }
            }}
          />
        </View>
        {errors.confirmInfo && (
          <ErrorComponent
            errorTitle={errors.confirmInfo}
            color="#EE1045"
            marginBottom={8}
            marginTop={8}
          />
        )}

        <ErrorComponent
          errorTitle="Posting a live stream will avoid further complaints."
          marginTop={8}
        />

        {/* TOS */}
        <View style={[styles.row, { marginTop: 16 }]}>
          <View style={{ width: "80%" }}>
            <CustomText
              fontSize={12}
              label="I ACCEPT THE TOS"
              fontFamily={fonts.medium}
              color={colors.textSecondary}
            />
            <CustomText
              label={tosConfirmed ? "Yes" : "No"}
              fontSize={16}
              color={colors.text}
            />
          </View>
          <CustomSwitch
            value={tosConfirmed}
            setValue={(value) => {
              setTosConfirmed(value);
              if (value && errors.tos) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.tos;
                  return newErrors;
                });
              }
            }}
          />
        </View>
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          <Icons
            family="Feather"
            name="info"
            size={12}
            marginRight={4}
            color={colors.iconMuted}
            marginTop={1}
          />
          <Text
            style={{
              fontSize: 12,
              color: colors.iconMuted,
              flex: 1,
            }}
          >
            By publishing this{" "}
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.medium,
                color: colors.text,
              }}
            >
              Live
            </Text>{" "}
            you agree with{" "}
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.medium,
                color: colors.text,
              }}
            >
              PSC
            </Text>
            's Terms of Service. Any violation may get your account banned and
            you may be subject to further legal actions depending on the
            severity of the violation.
          </Text>
        </View>
        {errors.tos && (
          <ErrorComponent
            errorTitle={errors.tos}
            color="#EE1045"
            marginBottom={40}
            marginTop={8}
          />
        )}
        <View style={{ marginBottom: 52 }} />

        {/* Modals */}
        <CustomModalGooglePlaces
          isVisible={isLocationModalVisible}
          onClose={() => setIsLocationModalVisible(false)}
          onLocationSelect={handleLocationSelect}
        />

        <FilterModal
          isVisible={isTopicModalVisible}
          onDisable={() => setIsTopicModalVisible(false)}
          title="Select A Topic"
          subtitle="Select your filters"
          filters={topics}
          onItemPress={(item) => {
            setTopic(item);
            if (item && errors.topic) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.topic;
                return newErrors;
              });
            }
            setIsTopicModalVisible(false);
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
          isVisible={isSelectionVisible}
          onClose={() => setIsSelectionVisible(false)}
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
      </ScrollView>
    </ScreenWrapper>
  );
};

export default PublishLive;

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      backgroundColor: colors.white04,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      height: 56,
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
      tintColor: colors.text,
    },
  });
