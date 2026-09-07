import ViewerStreamScreen from "./ViewerStreamScreen";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ViewStreamRoute() {
  const params = useLocalSearchParams<{
    meetingId?: string;
    userName?: string;
    item?: string;
  }>();
  const insets = useSafeAreaInsets();

  const meetingId =
    typeof params.meetingId === "string" ? params.meetingId : "";
  const userName =
    typeof params.userName === "string" && params.userName.length > 0
      ? params.userName
      : "Viewer";

  const item = React.useMemo(() => {
    if (typeof params.item !== "string" || !params.item) return {};
    try {
      const parsed = JSON.parse(params.item);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, [params.item]);

  if (!meetingId) {
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
    <ViewerStreamScreen
      meetingId={meetingId}
      userName={userName}
      item={item}
      isTabBarVisible={false}
      safeAreaTopInset={insets.top}
    />
  );
}
