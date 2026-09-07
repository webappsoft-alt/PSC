import { LiveStreamingView as LiveStreamingComponent } from "@/components/LiveStreamingView";
import { useCreateCamera } from "@/contexts/CreateCameraContext";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

export default function LiveStreamingRoute() {
  const params = useLocalSearchParams<{
    meetingId?: string;
    liveStreamId?: string;
    token?: string;
    userName?: string;
    liveTitle?: string;
    liveTopic?: string;
    liveCaption?: string;
    liveLocation?: string;
    liveTosConfirmed?: string;
    liveConfirmInfo?: string;
  }>();
  const createCamera = useCreateCamera();

  const meetingId = typeof params.meetingId === "string" ? params.meetingId : "";
  const token = typeof params.token === "string" ? params.token : "";
  const liveStreamId =
    typeof params.liveStreamId === "string" ? params.liveStreamId : undefined;
  const userName =
    typeof params.userName === "string" && params.userName.length > 0
      ? params.userName
      : "Host";

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
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#EE1045" size="large" />
      </View>
    );
  }

  return (
    <LiveStreamingComponent
      meetingId={meetingId}
      liveStreamId={liveStreamId}
      token={token}
      userName={userName}
      onBack={() => {
        releaseCreateCamera();
        router.replace({
          pathname: "/PublishStory/publish-story",
          params: {
            postType: "live",
            liveTitle:
              typeof params.liveTitle === "string" ? params.liveTitle : "",
            liveTopic:
              typeof params.liveTopic === "string" ? params.liveTopic : "",
            liveCaption:
              typeof params.liveCaption === "string" ? params.liveCaption : "",
            liveLocation:
              typeof params.liveLocation === "string" ? params.liveLocation : "",
            liveTosConfirmed:
              typeof params.liveTosConfirmed === "string"
                ? params.liveTosConfirmed
                : "false",
            liveConfirmInfo:
              typeof params.liveConfirmInfo === "string"
                ? params.liveConfirmInfo
                : "false",
          },
        });
      }}
      onStop={({ durationSeconds, totalViewers }) => {
        releaseCreateCamera();
        router.replace({
          pathname: "/LiveEndedScreen",
          params: {
            durationSeconds: String(durationSeconds),
            totalViewers: String(totalViewers),
          },
        });
      }}
    />
  );
}
