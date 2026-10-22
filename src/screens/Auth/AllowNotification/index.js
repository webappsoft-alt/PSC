import { useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { useNavigation } from "@react-navigation/native";

import Icons from "../../../components/Icons";
import PromptLayout, { PromptTexts } from "../../../components/Auth/PromptLayout";
import { RingButton, SoftButton, useAuthPalette } from "../../../components/Auth/AuthKit";
import { put } from "../../../services/ApiRequest";
import { getToken } from "../../../utils/constants";

const askPermission = async () => {
  try {
    if (Platform.OS === "android") {
      if (Platform.Version < 33) return true;
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return status === PermissionsAndroid.RESULTS.GRANTED;
    }
    const status = await messaging().requestPermission();
    return (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (e) {
    return false;
  }
};

/** Figma "Accept-notifications" (3098:5952). */
const AllowNotification = () => {
  const navigation = useNavigation();
  const p = useAuthPalette();
  const [loading, setLoading] = useState(null);

  const finish = async (push, key) => {
    setLoading(key);
    try {
      if (push) await getToken();
      await put("user/profile", { notificationPreferences: { push } });
    } catch (e) {
      // Preference only — never block the onboarding on it.
    }
    setLoading(null);
    navigation.navigate("ProfilePrivacy");
  };

  return (
    <PromptLayout
      variant="notif"
      actions={
        <>
          <RingButton
            title="Turn on notifications"
            loading={loading === "yes"}
            disabled={!!loading}
            onPress={async () => finish(await askPermission(), "yes")}
          />
          <SoftButton
            title="Maybe later"
            loading={loading === "no"}
            disabled={!!loading}
            onPress={() => finish(false, "no")}
          />
        </>
      }
    >
      <PromptTexts
        icon={
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="notifications_active"
            size={80}
            color={p.gold64}
          />
        }
        title="Instant notifications"
        body="Receive notifications directly on your phone whenever a new event occurs."
        note="Manage your notification in Settings anytime."
      />
    </PromptLayout>
  );
};

export default AllowNotification;
