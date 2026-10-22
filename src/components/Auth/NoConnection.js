import { BackHandler, Linking, Platform, StyleSheet, View } from "react-native";

import Icons from "../Icons";
import PromptLayout, { PromptTexts } from "./PromptLayout";
import { RingButton, SoftButton, useAuthPalette } from "./AuthKit";

const openWifiSettings = async () => {
  try {
    if (Platform.OS === "android") {
      await Linking.sendIntent("android.settings.WIFI_SETTINGS");
    } else {
      await Linking.openSettings();
    }
  } catch (e) {
    Linking.openSettings().catch(() => {});
  }
};

/**
 * Figma "No Connection" (2249:7696). Rendered over the app while the device
 * is offline, so the navigation state survives a dropped connection.
 * iOS apps cannot close themselves, so "Close The App" re-checks there.
 */
const NoConnection = ({ onRetry }) => {
  const p = useAuthPalette();
  return (
    <View style={StyleSheet.absoluteFill}>
      <PromptLayout
        variant="notif"
        actions={
          <>
            <RingButton title="Try connect to Wi-Fi" onPress={openWifiSettings} />
            <SoftButton
              title="Close The App"
              onPress={() =>
                Platform.OS === "android" ? BackHandler.exitApp() : onRetry?.()
              }
            />
          </>
        }
      >
        <PromptTexts
          icon={
            <View style={[styles.iconCircle, { backgroundColor: p.t04 }]}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="signal_wifi_bad"
                size={40}
                color={p.gold64}
              />
            </View>
          }
          title="No Connection"
          body="It seems that you have no internet connexion"
          note="Try connecting your device to a wi-fi point or use data."
        />
      </PromptLayout>
    </View>
  );
};

export default NoConnection;

const styles = StyleSheet.create({
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
