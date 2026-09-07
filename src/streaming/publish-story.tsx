import Border from "@/components/Border";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomModalGooglePlaces from "@/components/CustomModalGooglePlaces";
import Header from "@/components/Header";
import InfoComponent from "@/components/InfoComponent";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { usePublishSelections } from "@/contexts/PublishSelectionContext";
import { useUploadProgress } from "@/contexts/UploadProgressContext";
import { useCreateCamera } from "@/contexts/CreateCameraContext";
import { post, put } from "@/services/ApiRequest";
import { uploadAndGetUrl, uploadFileGetUrl } from "@/utils/constants";
import { createMeeting } from "@/services/videosdk";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {DeviceEventEmitter,
  InteractionManager,
  ScrollView,
  StyleSheet,
  View} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import HashtagModal from "../../components/HashtagModal";
import OptionSelector from "../../components/OptionSelector";
import SelectionModal from "../../components/SelectionModal";
import StoryPreview from "../../components/StoryPreview";
import SwitchOption from "../../components/SwitchOption";
import ExpoIcons from "@/components/ExpoIcons";
import CustomText from "@/components/CustomText";
import BottomSheet from "@gorhom/bottom-sheet";
import MentionPeopleSheet from "@/components/MentionPeopleSheet";
import Text from "../components/ScaledText";
type SelectionType = "age" | "topic" | "visibleTo" | null;

interface TagItem {
  _id: string;
  tag: string;
}

const parseTextOverlayParam = (value?: string | string[]) => {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return undefined;
    }
  }
};

const PublishStory: React.FC = () => {
  const params = useLocalSearchParams<{
    mediaUri?: string;
    mediaType?: "image" | "video";
    duration?: string;
    postType?: string;
    editData?: string;
    startTime?: string;
    endTime?: string;
    textOverlay?: string;
    liveTitle?: string;
    liveTopic?: string;
    liveCaption?: string;
    liveLocation?: string;
    liveTosConfirmed?: string;
    liveConfirmInfo?: string;
  }>();

  const {
    mediaUri,
    mediaType,
    duration,
    postType,
    editData,
    startTime,
    endTime,
    textOverlay,
    liveTitle: liveTitleParam,
    liveTopic: liveTopicParam,
    liveCaption: liveCaptionParam,
    liveLocation: liveLocationParam,
    liveTosConfirmed: liveTosConfirmedParam,
    liveConfirmInfo: liveConfirmInfoParam,
  } = params;
  const isEdit = !!editData;

  const insets = useSafeAreaInsets();
  const { isDarkMode } = useApp();
  const {
    selectedCollaborators,
    selectedSponsor,
    clearPublishSelections,
    setSelectedCollaborators,
    setSelectedSponsor,
  } = usePublishSelections();
  const {
    setIsStoryUploading,
    setIsStoryUploaded,
    setIsPostUploaded,
    setIsPostUploading,
  } = useUploadProgress();
  const createCamera = useCreateCamera();
  const [loading, setLoading] = useState(false);
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [locationDetail, setLocationDeatil] = useState<object | any>(null);
  const [hashtags, setHashtags] = useState<TagItem[]>([]);
  const [isHashtagModalVisible, setIsHashtagModalVisible] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const [ageRating, setAgeRating] = useState<string | null>(null);
  const [visibleTo, setVisibleTo] = useState<string | null>(null);
  const [containsAI, setContainsAI] = useState(false);
  const [canReact, setCanReact] = useState(true);
  const [canShare, setCanShare] = useState(true);
  const [tosConfirmed, setTosConfirmed] = useState(false);
  const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<SelectionType>(null);
  const [canComment, setCanComment] = useState(true);
  const [liveTitle, setLiveTitle] = useState("");
  const [confirmInfo, setConfirmInfo] = useState(false);
  const previewCaptureRef = useRef<View>(null);
  const parsedTextOverlay = parseTextOverlayParam(textOverlay);
  const [mentions, setMentions] = useState<string[]>([]);
  const mentionSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (editData) {
      try {
        const data = JSON.parse(editData);

        setStoryText(data?.description || "");
        setTopic(data?.topic || null);
        setAgeRating(data?.ageRating ? `${data.ageRating}+` : null);
        const visibleValue = Array.isArray(data?.availableTo)
          ? data?.availableTo[0]
          : data?.availableTo;

        setVisibleTo(visibleValue || null);
        setContainsAI(data?.isAI || false);
        setCanReact(data?.canReact ?? true);
        setCanShare(data?.canShare ?? true);
        setCanComment(data?.canComment ?? true);
        if (data?.location?.city || data?.location?.address) {
          setLocation(data.location.city || data.location.address);
          setLocationDeatil(data.location);
        }
        if (data?.hashtags) {
          setHashtags(
            data.hashtags.map((tag: string, index: number) => ({
              _id: index.toString(),
              tag,
            })),
          );
        }
        if (data?.mentions) {
          setMentions(data.mentions);
        }
        if (data?.collaberation) {
          const collaborators = data?.collaberation?.map((user: any) => ({
            _id: user?._id,
            name: user?.name,
            pro: user?.profile?.isPro,
            verified: user?.profile?.isVerified,
          }));
          setSelectedCollaborators(collaborators);
        }
        if (data?.sponsoredBy) {
          const sponsor = data?.sponsoredBy?.map((user: any) => ({
            _id: user?._id,
            name: user?.name,
            pro: user?.profile?.isPro,
            verified: user?.profile?.isVerified,
          }));
          setSelectedSponsor(sponsor);
        }
        setTosConfirmed(true); // Since it was already published
      } catch (error) {
        console.log("Failed to parse editData:", error);
      }
    }
  }, [editData]);

  // Restore live draft when returning from LiveStreaming back to Launch A Live screen.
  useEffect(() => {
    if (postType !== "live" || editData) return;
    if (typeof liveTitleParam === "string") setLiveTitle(liveTitleParam);
    if (typeof liveTopicParam === "string" && liveTopicParam)
      setTopic(liveTopicParam);
    if (typeof liveCaptionParam === "string") setStoryText(liveCaptionParam);
    if (typeof liveLocationParam === "string" && liveLocationParam)
      setLocation(liveLocationParam);
    if (typeof liveTosConfirmedParam === "string") {
      setTosConfirmed(liveTosConfirmedParam === "true");
    }
    if (typeof liveConfirmInfoParam === "string") {
      setConfirmInfo(liveConfirmInfoParam === "true");
    }
  }, [
    postType,
    editData,
    liveTitleParam,
    liveTopicParam,
    liveCaptionParam,
    liveLocationParam,
    liveTosConfirmedParam,
    liveConfirmInfoParam,
  ]);

  const openSelectionModal = (type: SelectionType) => {
    setSelectionType(type);
    setIsSelectionModalVisible(true);
  };

  const closeSelectionModal = () => {
    setIsSelectionModalVisible(false);
    setSelectionType(null);
  };
  const handleSelection = (value: string) => {
    switch (selectionType) {
      case "topic":
        setTopic(value);
        break;
      case "age":
        setAgeRating(value);
        break;
      case "visibleTo":
        setVisibleTo(value);
        break;
    }
  };

  const handlePublishStory = useCallback(async () => {
    let mediaUriToUpload = mediaUri;

    // Capture overlay while this screen is still mounted — replace("/(tabs)") unmounts it.
    if (
      mediaType === "image" &&
      parsedTextOverlay &&
      previewCaptureRef.current
    ) {
      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
        const compositedImageUri = await captureRef(previewCaptureRef.current, {
          format: "png",
          quality: 1,
          result: "tmpfile",
        });
        if (compositedImageUri) {
          mediaUriToUpload = compositedImageUri;
        }
      } catch (error) {
        console.error("Preview compose capture failed:", error);
      }
    }

    if (!isEdit) {
      if (postType === "reel") {
        setIsPostUploaded(false);
        setIsPostUploading(true);
      } else {
        setIsStoryUploaded(false);
        setIsStoryUploading(true);
      }
      createCamera?.resetCaptureStateRef.current?.();
      router.back();
      requestAnimationFrame(() => {
        DeviceEventEmitter.emit("RETURN_TO_HOME_AFTER_PUBLISH");
      });

      // Let the tab transition, home layout, and gestures run before heavy upload + JSON work.
      await Promise.race([
        new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => resolve());
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 500)),
      ]);
    } else {
      setLoading(true);
    }

    try {
      let uploadedUrl: string | null = null;

      const data = isEdit && editData ? JSON.parse(editData) : null;

      try {
        if (mediaUriToUpload && !mediaUriToUpload.startsWith("http")) {
          if (mediaType === "image") {
            uploadedUrl = await uploadAndGetUrl({ path: mediaUriToUpload });
          } else {
            const uploadRes = await uploadFileGetUrl(
              { localUri: mediaUriToUpload, name: "story-video.mp4" },
              "video/mp4",
            );

            uploadedUrl =
              uploadRes?.file ||
              uploadRes?.url ||
              uploadRes?.image ||
              (typeof uploadRes === "string" ? uploadRes : null);
          }
        } else {
          uploadedUrl = mediaUriToUpload || null;
        }
      } catch (error) {
        console.log("Media upload failed:", error);
        // Optional: show toast / alert here
        uploadedUrl = mediaUriToUpload || mediaUri || null;
      }

      const normalizedCaption = String(storyText ?? "").trim();
      const normalizedContainsAI = Boolean(containsAI);
      const normalizedLocationAddress =
        (locationDetail?.address as string | undefined) ||
        (typeof location === "string" ? location : undefined) ||
        (location as any)?.address ||
        (locationDetail?.city as string | undefined) ||
        (locationDetail?.country as string | undefined) ||
        "";

      const payload: any = {
        ...(hashtags?.length ? { hashtags: hashtags.map((i) => i?.tag) } : {}),
        ...(location ? { location } : {}),
        ...(topic ? { topic } : {}),
        ...(ageRating ? { ageRating: Number(ageRating.replace("+", "")) } : {}),
        ...(visibleTo
          ? {
              availableTo:
                postType === "reel"
                  ? [visibleTo.toLowerCase()]
                  : visibleTo.toLowerCase(),
            }
          : {}),
        ...(selectedCollaborators?.length
          ? { collaberation: selectedCollaborators?.map((c) => c._id) }
          : {}),
        ...(selectedSponsor?.length
          ? { sponsoredBy: selectedSponsor?.map((c) => c._id) }
          : {}),
        ...(mentions?.length ? { mentions } : {}),
        canReact,
        canShare,
        canComment,
        isAI: normalizedContainsAI,
        caption: normalizedCaption,
        ...(parsedTextOverlay ? { textOverlay: parsedTextOverlay } : {}),
        ...(startTime ? { startTime: Number(startTime) } : {}),
        ...(endTime ? { endTime: Number(endTime) } : {}),
      };

      if (location || normalizedLocationAddress) {
        payload.location = {
          type: "Point",
          coordinates: [
            Number(locationDetail?.longitude) || 0,
            Number(locationDetail?.latitude) || 0,
          ],
          city: locationDetail?.city || normalizedLocationAddress,
          country: locationDetail?.country || normalizedLocationAddress,
          address: normalizedLocationAddress,
        };
      }
      if (postType === "reel") {
        payload.description = normalizedCaption;
      }
      if (postType === "reel") {
        if (mediaType === "video") {
          payload.video = uploadedUrl;
        } else if (mediaType === "image") {
          payload.image = [uploadedUrl];
        }
        if (parsedTextOverlay) {
          payload.textOverlay = parsedTextOverlay;
        }
      } else {
        payload.media = {
          url: uploadedUrl,
          type: mediaType,
          ...(mediaType === "video" && duration
            ? { duration: Number(duration) }
            : {}),
          ...(parsedTextOverlay ? { textOverlay: parsedTextOverlay } : {}),
        };
      }

      let endPoint = postType === "reel" ? "posts" : "stories";

      const res = isEdit
        ? await put(`${endPoint}/${data?._id}`, payload)
        : await post(endPoint, payload);

      if (res?.data?.success) {
        if (!isEdit) {
          if (postType === "reel") {
            setIsPostUploading(false);
            setIsPostUploaded(true);
          } else {
            setIsStoryUploading(false);
            setIsStoryUploaded(true);
          }
        }
        clearPublishSelections();

        if (isEdit) {
          router.back();
        }
      }
    } catch (error) {
      console.error("CRITICAL ERROR inside handlePublishStory:", error);
      clearPublishSelections();
    } finally {
      setLoading(false);
      if (!isEdit) {
        setIsStoryUploading(false);
        setIsPostUploading(false);
      }
    }
  }, [
    ageRating,
    canComment,
    canReact,
    canShare,
    containsAI,
    duration,
    editData,
    endTime,
    hashtags,
    isEdit,
    location,
    locationDetail,
    mediaType,
    mediaUri,
    postType,
    selectedCollaborators,
    selectedSponsor,
    clearPublishSelections,
    startTime,
    storyText,
    parsedTextOverlay,
    topic,
    createCamera,
  ]);
  const handleLaunchLive = useCallback(async () => {
    try {
      setLoading(true);
      const hashtagsPayload = (hashtags || [])
        .map((t: any) => t?.tag)
        .filter(Boolean);
      const sponsoredByPayload = (selectedSponsor || [])
        .map((c: any) => c?._id)
        .filter(Boolean);
      const collaberationPayload = (selectedCollaborators || [])
        .map((c: any) => c?._id)
        .filter(Boolean);
      const livePayload: any = {
        ...(liveTitle ? { title: liveTitle } : {}),
        ...(storyText ? { description: storyText } : {}),
        ...(topic ? { topic } : {}),
        ...(hashtagsPayload.length ? { hashtags: hashtagsPayload } : {}),
        ...(sponsoredByPayload.length
          ? { sponsoredBy: sponsoredByPayload }
          : {}),
        ...(collaberationPayload.length
          ? { collaberation: collaberationPayload }
          : {}),
        ...(mentions?.length ? { mentions } : {}),
        ...(visibleTo
          ? { availableTo: [String(visibleTo).toLowerCase()] }
          : {}),
      };

      if (locationDetail) {
        livePayload.location = {
          type: "Point",
          coordinates: [
            Number(locationDetail?.longitude ?? -0.1278),
            Number(locationDetail?.latitude ?? 51.5074),
          ],
          city: locationDetail?.city || locationDetail?.address || "London",
          country: locationDetail?.country || locationDetail?.address || "UK",
          address: locationDetail?.address || "123 Main St",
        };
      }

      const roomRes: any = await createMeeting(livePayload);
      const meetingId =
        roomRes?.liveStream?.liveId || roomRes?.liveStream?.metadata?.roomId;
      // Navigate to LiveStreamingView
      // We rely on the parent (tabs/create) or a layout to handle the LiveStreamingView display
      // or we can navigate to a specific route if it exists.
      // Based on create.tsx, it renders LiveStreamingView conditionally.
      // So we might need to go back with the meeting config or use a global state.

      // However, the user said "livestreaming wali screen pe navigate karo".
      // Let's assume we can push to a live stream route or pass back.
      // For now, I'll use router.push with room info.

      createCamera?.setIsLiveMode(true);
      createCamera?.destroyCamera?.();
      createCamera?.setCameraReady(false);

      router.replace({
        pathname: "/LiveStreamingView",
        params: {
          meetingId,
          liveStreamId: roomRes?.liveStream?._id,
          token: roomRes?.liveStream?.token,
          userName: "Host",
          liveTitle: liveTitle || "",
          liveTopic: topic || "",
          liveCaption: storyText || "",
          liveLocation: location || "",
          liveTosConfirmed: tosConfirmed ? "true" : "false",
          liveConfirmInfo: confirmInfo ? "true" : "false",
        },
      });
    } catch (error) {
      console.error("Failed to launch live:", error);
    } finally {
      setLoading(false);
    }
  }, [
    liveTitle,
    topic,
    tosConfirmed,
    confirmInfo,
    hashtags,
    selectedSponsor,
    selectedCollaborators,
    visibleTo,
    locationDetail,
    storyText,
    createCamera,
  ]);

  const heading =
    postType === "reel" ? "Reel" : postType === "live" ? "Live" : "Story";
  const isPublishDisabled =
    postType === "live"
      ? !liveTitle || !topic || !tosConfirmed || !confirmInfo
      : !mediaUri || !topic || !tosConfirmed;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Header
        title={postType === "live" ? "Launch A Live" : "Publish a " + heading}
      />

      <ScrollView
        style={[styles.container]}
        showsVerticalScrollIndicator={false}
      >
        {postType !== "live" && (
          <View ref={previewCaptureRef} collapsable={false}>
            <StoryPreview
              aspectRatio={aspectRatio}
              images={[{ uri: mediaUri || "", type: mediaType || "image" }]}
              textOverlay={parsedTextOverlay}
            />
          </View>
        )}

        {postType === "live" && (
          <>
            <CustomInput
              withLabel="TITLE"
              value={liveTitle}
              onChangeText={setLiveTitle}
              placeholder="Give your live a catchy name!"
              cardInfo={`${liveTitle.length}/35 characters.`}
              marginBottom={5}
              marginTop={10}
            />
          </>
        )}

        <CustomInput
          withLabel={postType === "live" ? "CAPTION" : "WHAT’S HAPPENING"}
          height={postType === "live" ? 150 : 150}
          multiline
          marginTop={5}
          value={storyText}
          onChangeText={(text) => {
            setStoryText(text);
            if (text.endsWith("@")) {
              mentionSheetRef.current?.snapToIndex(1);
            }
          }}
          placeholder={
            postType === "live"
              ? "Tell your followers what this live is about!"
              : `Describe what’s going on in your ${heading}!`
          }
          cardInfo={`${storyText.length}/${postType === "live" ? 150 : 500} characters.`}
          marginBottom={5}
        />

        <Border marginVertical={10} marginTop={15} />

        <OptionSelector
          label="Location"
          placeHolder="Select location"
          value={location ?? undefined}
          onPress={() => setIsLocationModalVisible(true)}
        />

        <OptionSelector
          label="Topic"
          placeHolder="Select topic"
          value={topic ?? undefined}
          onPress={() => openSelectionModal("topic")}
        />

        <OptionSelector
          label="Add tags"
          placeHolder="#sports"
          marginBottom={5}
          onPress={() => setIsHashtagModalVisible(true)}
          value={hashtags.map((tag) => `#${tag.tag}`).join(", ")}
        />

        <InfoComponent text="Helps you get more reach." />
        <OptionSelector
          label="In collaboration with"
          marginBottom={5}
          marginTop={5}
          placeHolder="Select collaborators"
          value={selectedCollaborators.map((c) => c.name).join(", ")}
          onPress={() =>
            router.push({
              pathname: "/select-people",
              params: { type: "collaborator", title: "Select Collaborators" },
            })
          }
          renderValue={() => (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              {selectedCollaborators.map((user, index) => (
                <View key={user._id} style={styles.row}>
                  <CustomText
                    fontSize={16}
                    label={user.name}
                    lineHeight={16 * 1.4}
                    fontFamily="Poppins_500Medium"
                    color={theme.text}
                  />

                  {user.pro ? (
                    <ExpoIcons
                      size={14}
                      name="shield-check"
                      color="#007BFF"
                      family="MaterialCommunityIcons"
                    />
                  ) : user.verified ? (
                    <ExpoIcons
                      size={14}
                      name="verified"
                      color="#007BFF"
                      family="MaterialIcons"
                    />
                  ) : null}
                  {index !== selectedCollaborators?.length - 1 && (
                    <CustomText
                      label={","}
                      fontSize={16}
                      lineHeight={16 * 1.4}
                      fontFamily="Poppins_500Medium"
                      color={theme.text}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        />

        <InfoComponent text="Person working together on the same project or content." />

        <OptionSelector
          label="Sponsored by"
          placeHolder="Select sponsor"
          marginBottom={5}
          marginTop={5}
          value={selectedSponsor?.map((s) => s.name).join(", ")}
          onPress={() =>
            router.push({
              pathname: "/select-people",
              params: { type: "sponsor", title: "Select Sponsor" },
            })
          }
          renderValue={() => (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              {selectedSponsor.map((user, index) => (
                <View key={user._id} style={styles.row}>
                  <CustomText
                    fontSize={16}
                    label={user.name}
                    lineHeight={16 * 1.4}
                    fontFamily="Poppins_500Medium"
                    color={theme.text}
                  />

                  {user.pro ? (
                    <ExpoIcons
                      size={14}
                      name="shield-check"
                      color="#007BFF"
                      family="MaterialCommunityIcons"
                    />
                  ) : user.verified ? (
                    <ExpoIcons
                      size={14}
                      name="verified"
                      color="#007BFF"
                      family="MaterialIcons"
                    />
                  ) : null}
                  {index !== selectedSponsor?.length - 1 && (
                    <CustomText
                      label={","}
                      fontSize={16}
                      lineHeight={16 * 1.4}
                      fontFamily="Poppins_500Medium"
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        />

        <InfoComponent text="Organization supporting financially or with resources in exchange for promotion." />

        <Border marginVertical={12} />
        {postType != "live" ? (
          <View style={{ gap: 8 }}>
            <SwitchOption
              label="does it contain AI"
              value={containsAI}
              setValue={setContainsAI}
            />

            <SwitchOption
              label={postType === "reel" ? "can like" : "can react"}
              value={canReact}
              setValue={setCanReact}
            />
            {postType === "reel" && (
              <SwitchOption
                label={"can comment"}
                value={canComment}
                setValue={setCanComment}
              />
            )}

            <SwitchOption
              label="can share"
              value={canShare}
              setValue={setCanShare}
              marginBottom={3}
            />
          </View>
        ) : null}

        <OptionSelector
          marginTop={5}
          label="Age rating"
          placeHolder="Select age rating"
          value={ageRating ?? undefined}
          onPress={() => openSelectionModal("age")}
        />

        <OptionSelector
          label="Available to"
          placeHolder="Select audience"
          value={visibleTo ?? undefined}
          onPress={() => openSelectionModal("visibleTo")}
          textTransform="capitalize"
          marginBottom={10}
        />

        {postType === "live" && (
          <>
            <Border marginTop={8} marginBottom={16} />
            <SwitchOption
              label="CONFIRM ALL ABOVE INFORMATIONS"
              value={confirmInfo}
              setValue={setConfirmInfo}
              info="Posting a fair product will avoid further complaints."
            />
          </>
        )}
        <View style={{ marginTop: 13 }}></View>
        <SwitchOption
          label={
            postType === "live"
              ? "I ACCEPT THE TOS"
              : "I HEREBY CONFIRM THE POST IS WITHIN TOS"
          }
          value={tosConfirmed}
          setValue={setTosConfirmed}
          info={
            postType === "live" ? (
              <Text
                style={{
                  flex: 1,
                  fontSize: 12,
                  lineHeight: 12 * 1.4,
                  color: theme.textSecondary,
                  fontFamily: "Poppins_400Regular",
                }}
              >
                By publishing this{" "}
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.text,
                    fontFamily: "Poppins_500Medium",
                  }}
                >
                  Live
                </Text>{" "}
                you agree with{" "}
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.text,
                    fontFamily: "Poppins_500Medium",
                  }}
                >
                  Viral
                </Text>
                &apos;s Terms of Service. Any violation may get your account
                banned and you may be subject to further legal actions depending
                on the severity of the violation.
              </Text>
            ) : undefined
          }
        />
      </ScrollView>

      <View
        style={{
          marginHorizontal: 16,
          marginBottom: insets.bottom + 5,
          marginTop: 12,
        }}
      >
        <CustomButton
          title={
            postType === "live" ? "Launch Live" : isEdit ? "Update" : "Publish"
          }
          loading={loading}
          onPress={postType === "live" ? handleLaunchLive : handlePublishStory}
          disabled={isPublishDisabled || loading}
          indicatorColor={isDarkMode ? "#121212" : "#fff"}
        />
      </View>

      <SelectionModal
        isVisible={isSelectionModalVisible}
        type={selectionType ?? "topic"}
        selected={
          selectionType === "topic"
            ? (topic ?? undefined)
            : selectionType === "age"
              ? (ageRating ?? undefined)
              : (visibleTo ?? undefined)
        }
        onSelection={handleSelection}
        onModalClose={closeSelectionModal}
      />
      <HashtagModal
        onChange={setHashtags}
        selectedTags={hashtags}
        isVisible={isHashtagModalVisible}
        onClose={() => setIsHashtagModalVisible(false)}
      />
      <CustomModalGooglePlaces
        isVisible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onLocationSelect={(place) => {
          setLocationDeatil(place);
          setLocation(place?.name || place?.address || "");
          setIsLocationModalVisible(false);
        }}
      />
      <MentionPeopleSheet
        sheetRef={mentionSheetRef}
        onSelectPerson={(person) => {
          setMentions((prev) => {
            if (!prev.includes(person._id!)) {
              return [...prev, person._id!];
            }
            return prev;
          });
          setStoryText((prev) => {
            const lastAt = prev.lastIndexOf("@");
            if (lastAt !== -1) {
              return prev.slice(0, lastAt) + `@${person.username} `;
            }
            return prev + `@${person.username} `;
          });
          mentionSheetRef.current?.close();
        }}
      />
    </View>
  );
};

export default PublishStory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
