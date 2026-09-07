import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useCreateCamera } from "../../contexts/CreateCameraContext";
import { useTheme } from "../../contexts/ThemeContext";
import LiveStreamingView from "../../components/LiveStreamingView";

export default function LiveStreamingScreen({ navigation: navProp }) {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params || {};
  const createCamera = useCreateCamera();
  const { colors } = useTheme();

  const meetingId = params.meetingId || "";
  const token = params.token || "";
  const liveStreamId = params.liveStreamId;
  const userName =
    params.userName && params.userName.length > 0 ? params.userName : "Host";

  const releaseCreateCamera = React.useCallback(() => {
    createCamera?.setIsLiveMode(false);
    createCamera?.destroyCamera?.();
    createCamera?.setCameraReady(false);
  }, [createCamera]);

  if (!meetingId || !token) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#EE1045" size="large" />
      </View>
    );
  }

  return (
    <LiveStreamingView
      meetingId={meetingId}
      liveStreamId={liveStreamId}
      token={token}
      userName={userName}
      onBack={() => {
        releaseCreateCamera();
        navigation.replace("PublishLive", {
          postType: "live",
          liveTitle: params.liveTitle || "",
          liveTopic: params.liveTopic || "",
          liveCaption: params.liveCaption || "",
          liveLocation: params.liveLocation || "",
          liveTosConfirmed: params.liveTosConfirmed ? "true" : "false",
          liveConfirmInfo: params.liveConfirmInfo ? "true" : "false",
        });
      }}
      liveTitle={params.liveTitle || ""}
      liveCaption={params.liveCaption || ""}
      liveTopic={params.liveTopic || ""}
      liveLocation={params.liveLocation || ""}
      onStop={({ durationSeconds, totalViewers }) => {
        releaseCreateCamera();
        navigation.replace("LiveEnded", {
          durationSeconds: String(durationSeconds),
          totalViewers: String(totalViewers),
        });
      }}
    />
  );
}
