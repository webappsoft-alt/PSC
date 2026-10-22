import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import PromptLayout, { PromptTexts } from "../../../components/Auth/PromptLayout";
import { RingButton, SoftButton, useAuthPalette } from "../../../components/Auth/AuthKit";
import { put } from "../../../services/ApiRequest";

/** Figma "Allow-personalized-ads": switch 79 × 48, "Enhanced & tailored ads". */
const AdsSwitch = () => {
  const p = useAuthPalette();
  return (
    <View style={[styles.switch, { backgroundColor: p.gold64 }]}>
      <View style={[styles.knob, { backgroundColor: p.bg }]} />
    </View>
  );
};

const PersonalAds = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(null);

  const choose = async (allow, key) => {
    setLoading(key);
    try {
      await put("user/profile", { enhancedTailoredAds: allow });
    } catch (e) {
      // Preference only — never block the onboarding on it.
    }
    setLoading(null);
    navigation.navigate("AllowNotification");
  };

  return (
    <PromptLayout
      variant="ads"
      actions={
        <>
          <RingButton
            title="Continue"
            loading={loading === "yes"}
            disabled={!!loading}
            onPress={() => choose(true, "yes")}
          />
          <SoftButton
            title="Maybe Later"
            loading={loading === "no"}
            disabled={!!loading}
            onPress={() => choose(false, "no")}
          />
        </>
      }
    >
      <PromptTexts
        icon={<AdsSwitch />}
        title={"Enhanced &\ntailored ads"}
        body="We care about your privacy and want to maximize your chances of coming across products or services that appeal to you."
      />
    </PromptLayout>
  );
};

export default PersonalAds;

const styles = StyleSheet.create({
  switch: {
    width: 79,
    height: 48,
    borderRadius: 100,
    justifyContent: "center",
  },
  knob: {
    position: "absolute",
    right: 3,
    width: 41.8,
    height: 41.8,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4.6 },
    shadowOpacity: 0.15,
    shadowRadius: 6.2,
    elevation: 4,
  },
});
