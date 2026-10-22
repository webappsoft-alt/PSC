import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import CustomModal from "../../../components/CustomModal";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import PromptLayout from "../../../components/Auth/PromptLayout";
import {
  ModalButton,
  ModalCard,
  OptionRow,
  RingButton,
  SoftButton,
  belowBase,
  capTop,
  ls,
  textGap,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";
import fonts from "../../../assets/fonts";
import { put } from "../../../services/ApiRequest";
import {
  getCurrentLocation,
  requestLocationPermission,
} from "../../../utils/LocationUtils";

const OPTIONS = [
  { key: "public", title: "Public", subtitle: "Everyone" },
  {
    key: "private",
    title: "Private",
    subtitle: "Privately explore and enjoy the app.",
  },
];

/** Figma "Enable-Location" card. */
const EnableLocationModal = ({ visible, onDone }) => {
  const p = useAuthPalette();
  const [loading, setLoading] = useState(false);

  const allow = async () => {
    setLoading(true);
    try {
      const granted = await requestLocationPermission();
      // iOS shows its prompt on the first location request.
      if (granted && Platform.OS === "ios") {
        await getCurrentLocation().catch(() => null);
      }
    } catch (e) {}
    setLoading(false);
    onDone();
  };

  return (
    <CustomModal isVisible={visible} onDisable={onDone}>
      <ModalCard>
        <View style={styles.center}>
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="location_on"
            size={80}
            color={p.gold}
          />
          <CustomText
            label="Enable Location"
            fontSize={20}
            fontFamily={fonts.medium}
            letterSpacing={ls(-2, 20)}
            textAlign="center"
            color={p.text}
            marginTop={16 - capTop(20)}
          />
          <CustomText
            label="To be able to use services, we require permission to access your location"
            fontSize={14}
            letterSpacing={ls(-2, 14)}
            textAlign="center"
            color={p.t64}
            marginTop={textGap(12, 20, 14)}
          />
        </View>
        <View style={[styles.modalActions, { marginTop: 24 - belowBase(14) }]}>
          <ModalButton title="Continue" loading={loading} onPress={allow} />
          <ModalButton title="Maybe Later" variant="soft" onPress={onDone} />
        </View>
      </ModalCard>
    </CustomModal>
  );
};

/** Figma "Allow-personalized-ads" (2317:3228): Profile Privacy. */
const ProfilePrivacy = () => {
  const navigation = useNavigation();
  const p = useAuthPalette();
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(null);
  const [locationOpen, setLocationOpen] = useState(false);

  const save = async (privacy, key) => {
    setLoading(key);
    if (privacy) {
      try {
        await put("user/profile", { profilePrivacy: privacy });
      } catch (e) {}
    }
    setLoading(null);
    setLocationOpen(true);
  };

  const toWelcome = () => {
    setLocationOpen(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "WelcomeScreen", params: { fresh: true } }],
    });
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
            onPress={() => save(selected, "yes")}
          />
          <SoftButton
            title="Maybe Later"
            loading={loading === "no"}
            disabled={!!loading}
            onPress={() => save("", "no")}
          />
        </>
      }
    >
      <CustomText
        label="Profile Privacy"
        fontSize={18}
        fontFamily={fonts.semiBold}
        letterSpacing={ls(-2, 18)}
        color={p.text}
        marginTop={-capTop(18)}
      />
      <CustomText
        label="Choose who can see your profile."
        fontSize={14}
        letterSpacing={ls(-2, 14)}
        color={p.t64}
        marginTop={textGap(12, 18, 14)}
        marginBottom={16 - belowBase(14)}
      />
      <View style={styles.options}>
        {OPTIONS.map((o) => (
          <OptionRow
            key={o.key}
            title={o.title}
            subtitle={o.subtitle}
            selected={selected === o.key}
            onPress={() => setSelected(o.key)}
          />
        ))}
      </View>

      <EnableLocationModal visible={locationOpen} onDone={toWelcome} />
    </PromptLayout>
  );
};

export default ProfilePrivacy;

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
  },
  options: {
    gap: 8,
  },
  modalActions: {
    gap: 8,
  },
});
