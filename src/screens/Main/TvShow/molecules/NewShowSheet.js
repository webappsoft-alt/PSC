import { useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import { openPicker } from "react-native-image-crop-picker";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import { uploadAndGetUrl } from "../../../../utils/constants";
import { SHOW_VISIBILITY } from "../../../../utils/showPicks";
import {
  FieldBox,
  InfoLine,
  InputField,
  SelectField,
  SheetButtons,
} from "./ShowForm";
import { GlassFill, SHOWS, capTop } from "./showsLayout";

/**
 * Figma Shows › "New-Show-Collection" (7580:13796 empty / 7580:13846 filled):
 * floating sheet "New Show" + "Organize your episodes into a Show.";
 * fields 8 apart: WORD LOGO (18:1 image, 214×40 r6 white 4% slot with a 20
 * add @64%) + info · SHOW NAME · VISIBLE TO › · SYNOPSIS (120) + "0/250
 * characters." (4 below); Cancel · Confirm (white 16% until a name is set,
 * then gold).
 */
export const SHOW_SYNOPSIS_MAX = 250;

const NewShowSheet = ({
  visible,
  draft,
  onChange,
  onDismiss,
  onVisibleToPress,
  onConfirm,
  saving,
}) => {
  const [logoUploading, setLogoUploading] = useState(false);
  const visibility =
    SHOW_VISIBILITY.find((o) => o.value === draft.visibleTo) || SHOW_VISIBILITY[0];
  const canConfirm = !!draft.showName.trim() && !logoUploading;

  const pickLogo = async () => {
    try {
      const image = await openPicker({
        mediaType: "photo",
        cropping: true,
        // Figma: "18:1 ratio only"
        width: 1800,
        height: 100,
      });
      if (!image?.path) return;
      onChange({ worldLogoLocal: image.path, worldLogo: "" });
      setLogoUploading(true);
      const url = await uploadAndGetUrl(image);
      if (url) onChange({ worldLogo: url });
      else onChange({ worldLogoLocal: "" });
    } catch (e) {
      // picker cancelled
    } finally {
      setLogoUploading(false);
    }
  };

  const logoUri = draft.worldLogo || draft.worldLogoLocal;

  return (
    <FloatingSheet
      visible={visible}
      onDismiss={onDismiss}
      title="New Show"
      subtitle="Organize your episodes into a Show."
    >
      <View style={styles.fields}>
        <View>
          <TouchableOpacity activeOpacity={0.8} onPress={pickLogo}>
            <FieldBox style={styles.logoField}>
              <View style={styles.logoLabel}>
                <CustomText
                  label="Word logo"
                  textTransform="uppercase"
                  fontSize={12}
                  fontFamily={fonts.medium}
                  color={SHOWS.white64}
                  marginTop={capTop(12)}
                />
              </View>
              <View style={[styles.logoSlot, logoUri && styles.logoSlotFilled]}>
                <GlassFill fill={SHOWS.white04} borderRadius={6} />
                {logoUri ? (
                  <FastImage
                    source={{ uri: logoUri }}
                    style={styles.logo}
                    resizeMode={FastImage.resizeMode.contain}
                  />
                ) : (
                  <Icons
                    family="MaterialSymbolsRounded"
                    name="add"
                    size={20}
                    color={SHOWS.white64}
                  />
                )}
                {logoUploading ? (
                  <ActivityIndicator
                    size="small"
                    color={SHOWS.white}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
              </View>
            </FieldBox>
          </TouchableOpacity>
          <InfoLine label="Align your word logo on the left. 18:1 ratio only." />
        </View>

        <InputField
          label="Show name"
          value={draft.showName}
          onChangeText={(showName) => onChange({ showName })}
          placeholder="American Glory"
          valueSize={16}
          maxLength={80}
        />

        <SelectField
          label="Visible to"
          value={visibility.title}
          valueSize={16}
          onPress={onVisibleToPress}
        />

        <View>
          <InputField
            label="Synopsis"
            value={draft.synopsis}
            onChangeText={(synopsis) =>
              onChange({ synopsis: synopsis.slice(0, SHOW_SYNOPSIS_MAX) })
            }
            placeholder="Playing music across America"
            valueSize={16}
            height={120}
            multiline
            maxLength={SHOW_SYNOPSIS_MAX}
          />
          <InfoLine
            label={`${draft.synopsis.length}/${SHOW_SYNOPSIS_MAX} characters.`}
            style={{ marginTop: 4 }}
          />
        </View>
      </View>

      <SheetButtons
        onCancel={onDismiss}
        onConfirm={onConfirm}
        disabled={!canConfirm}
        loading={saving}
      />
    </FloatingSheet>
  );
};

export default NewShowSheet;

const styles = StyleSheet.create({
  fields: {
    gap: 8,
  },
  logoField: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
    alignItems: "stretch",
  },
  logoLabel: {
    paddingTop: 4,
  },
  logoSlot: {
    flex: 1,
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  logoSlotFilled: {
    alignItems: "flex-start",
  },
  logo: {
    // Figma: word logo 32 tall inside the 214 × 40 slot (pad 4 / 8)
    alignSelf: "stretch",
    height: 32,
  },
});
