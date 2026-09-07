import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewerStreamScreen from "../../components/ViewerStreamScreen";
import { useTheme } from "../../contexts/ThemeContext";
import { get } from "../../services/ApiRequest";

const unwrapLiveStreamPayload = (value) => {
  let payload = value?.data ?? value;

  for (let i = 0; i < 5; i += 1) {
    if (!payload || Array.isArray(payload) || typeof payload !== "object") {
      return payload;
    }
    if (payload.liveStream && typeof payload.liveStream === "object") {
      payload = payload.liveStream;
      continue;
    }
    if (payload.item && typeof payload.item === "object") {
      payload = payload.item;
      continue;
    }
    if (payload.data !== undefined) {
      payload = payload.data;
      continue;
    }
    return payload;
  }

  return payload;
};

const getMeetingIdFromItem = (item) =>
  item?.meetingId ||
  item?.metadata?.roomId ||
  item?.roomId ||
  item?.liveId ||
  "";

const getLiveStreamIdFromItem = (item) =>
  item?._id || item?.liveStreamId || item?.id || "";

export default function ViewStreamScreen() {
  const route = useRoute();
  const params = route.params || {};
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const routeItem = params.item;

  const routeItemParsed = React.useMemo(() => {
    if (!routeItem) return {};
    if (typeof routeItem !== "string") {
      const parsed =
        routeItem && typeof routeItem === "object"
          ? unwrapLiveStreamPayload(routeItem)
          : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    }
    try {
      const parsed = JSON.parse(routeItem);
      const normalized = unwrapLiveStreamPayload(parsed);
      return normalized && typeof normalized === "object" ? normalized : {};
    } catch {
      return {};
    }
  }, [routeItem]);

  const paramsLiveStreamId =
    params.liveStreamId && typeof params.liveStreamId === "object"
      ? getLiveStreamIdFromItem(params.liveStreamId)
      : params.liveStreamId;
  const routeLiveStreamId =
    paramsLiveStreamId || getLiveStreamIdFromItem(routeItemParsed);
  const [resolvedLiveItem, setResolvedLiveItem] = React.useState(null);

  React.useEffect(() => {
    if (!routeLiveStreamId || getMeetingIdFromItem(routeItemParsed)) return;

    let mounted = true;

    get(`live-stream/${routeLiveStreamId}`)
      .then((response) => {
        const normalized = unwrapLiveStreamPayload(response);
        if (mounted && normalized && typeof normalized === "object") {
          setResolvedLiveItem(normalized);
        }
      })
      .catch((error) => {
        console.log("Failed to fetch live stream", error);
      });

    return () => {
      mounted = false;
    };
  }, [routeItemParsed, routeLiveStreamId]);

  const item = React.useMemo(
    () => resolvedLiveItem || routeItemParsed || {},
    [resolvedLiveItem, routeItemParsed],
  );

  const itemMeetingId = getMeetingIdFromItem(item);
  const itemLiveStreamId = getLiveStreamIdFromItem(item);
  const routeMeetingId =
    params.meetingId && String(params.meetingId) !== String(itemLiveStreamId)
      ? params.meetingId
      : "";
  const meetingId = routeMeetingId || itemMeetingId || "";
  const userName =
    params.userName && params.userName.length > 0 ? params.userName : "Viewer";

  if (!meetingId) {
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
    <ViewerStreamScreen
      meetingId={meetingId}
      userName={userName}
      item={item}
      isTabBarVisible={false}
      safeAreaTopInset={insets.top}
    />
  );
}
