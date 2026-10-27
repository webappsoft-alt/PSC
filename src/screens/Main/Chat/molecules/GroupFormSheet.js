import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import FastImage from "react-native-fast-image";
import { openPicker } from "react-native-image-crop-picker";
import fonts from "../../../../assets/fonts";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { uploadAndGetUrl } from "../../../../utils/constants";
import { ToastMessage } from "../../../../utils/ToastMessage";
import { InfoLine, InputField, SelectField } from "../../TvShow/molecules/ShowForm";
import { TopicPicker } from "../../TvShow/SelectGenre";
import AnimatedDashedBorder from "../../../../components/Auth/AnimatedDashedBorder";

/**
 * Figma Chat page "Create-A-Group" (7921:3043) / "Create-A-Circle" (7924:9969)
 * on the app FloatingSheet (inner pad 12, gap 12):
 *   GROUP IMAGE (Medium 12 @64%) · 12 · 132 circle — empty: white 4% fill,
 *   2px dashed white 4% border, add 40 white; filled: photo + #121212 48%
 *   + edit 40 · 12 · "JPG, PNG, GIF." info
 *   GROUP TITLE field (56) · 6 · "Maximum characters n/50."
 *   GROUP DESCRIPTION field (160) · 6 · "Maximum characters n/500."
 *   Circle only: "Select A TOPIC" field + chevron · "Select the Category …"
 *   Continue — gold pill 48, Medium 17.14 #121212
 */
export const TITLE_MAX = 50;
export const DESCRIPTION_MAX = 500;
export const EMPTY_GROUP_FORM = { name: "", description: "", initialMessage: "", picture: "", pictureLocal: "", topic: "" };

const GroupFormSheet = ({ visible, type = "group", onDismiss, onContinue, saving }) => {
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const isCircle = type === "circle";
  const { height: screenH } = useWindowDimensions();
  const word = isCircle ? "Circle" : "Group";
  const [form, setForm] = useState(EMPTY_GROUP_FORM);
  const [uploading, setUploading] = useState(false);
  const [pickingTopic, setPickingTopic] = useState(false);
  // With the keyboard up the sheet must shrink (not slide off the top): the
  // fields scroll in what is left above the keyboard, Continue stays put.
  const [keyboardH, setKeyboardH] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow",
      (e) => setKeyboardH(Math.max(0, screenH - (e.endCoordinates?.screenY ?? screenH))),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardH(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [screenH]);
  // title 34 + gap 12 + Continue 48 + gap 12 + sheet padding/margins ≈ 230
  const fieldsMaxH = Math.max(160, Math.min(screenH * 0.62, screenH - keyboardH - 230));

  useEffect(() => {
    if (visible) {
      setForm(EMPTY_GROUP_FORM);
      setPickingTopic(false);
    }
  }, [visible, type]);

  const change = (patch) => setForm((f) => ({ ...f, ...patch }));

  const pickImage = async () => {
    try {
      const image = await openPicker({
        mediaType: "photo",
        cropping: true,
        width: 800,
        height: 800,
        cropperCircleOverlay: true, // Figma: 132 circle for both
      });
      if (!image?.path) return;
      change({ pictureLocal: image.path, picture: "" });
      setUploading(true);
      const url = await uploadAndGetUrl(image);
      if (url) change({ picture: url });
      else {
        change({ pictureLocal: "" });
        ToastMessage("Could not upload the image", "error");
      }
    } catch (e) {
      // picker cancelled
    } finally {
      setUploading(false);
    }
  };

  const imageUri = form.picture || form.pictureLocal;
  const canContinue =
    !!form.name.trim() && !uploading && (!isCircle || !!form.topic) && !saving;

  return (
    <FloatingSheet visible={visible} onDismiss={onDismiss} title={`Create a ${word}`} gap={12} closeIconSize={16} closeIconColor="muted">
      {/* fields scroll on small screens / with the keyboard; Continue stays */}
      <ScrollView
        style={{ maxHeight: fieldsMaxH }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      {/* ───────── image ───────── */}
      <View style={styles.imageBlock}>
        <CustomText
          label={`${word.toUpperCase()} IMAGE`}
          fontSize={12}
          fontFamily={fonts.medium}
          color={tint(0.64)}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={pickImage}
          style={[
            styles.imageSlot,
            { backgroundColor: tint(0.04) },
          ]}
        >
          {/* same travelling dashes as the Profile Selector "Add account" card */}
          {!imageUri && (
            <AnimatedDashedBorder color={tint(0.04)} borderRadius={100} strokeWidth={2} dashLength={8} gapLength={8} />
          )}
          {imageUri ? (
            <>
              <FastImage source={{ uri: imageUri }} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, styles.imageShade]} />
              <Icons family="MaterialSymbolsRoundedFilled" name="edit" size={40} color="#FFFFFF" />
            </>
          ) : (
            <Icons family="MaterialSymbolsRounded" name="add" size={40} color={colors.text} />
          )}
          {uploading && (
            <ActivityIndicator size="small" color="#FFFFFF" style={StyleSheet.absoluteFill} />
          )}
        </TouchableOpacity>
        <InfoLine label="JPG, PNG, GIF." />
      </View>

      {/* ───────── title ───────── */}
      <View style={styles.field}>
        <InputField
          label={`${word} title`}
          value={form.name}
          onChangeText={(name) => change({ name: name.slice(0, TITLE_MAX) })}
          placeholder="Marketing Team"
          valueSize={16}
          maxLength={TITLE_MAX}
        />
        <InfoLine label={`Maximum characters ${form.name.length}/${TITLE_MAX}.`} />
      </View>

      {/* ───────── description ───────── */}
      <View style={styles.field}>
        <InputField
          label={`${word} description`}
          value={form.description}
          onChangeText={(description) =>
            change({ description: description.slice(0, DESCRIPTION_MAX) })
          }
          placeholder="E.g. We are unveiling..."
          valueSize={16}
          height={160}
          multiline
          maxLength={DESCRIPTION_MAX}
        />
        <InfoLine label={`Maximum characters ${form.description.length}/${DESCRIPTION_MAX}.`} />
      </View>

      {/* ───────── welcome message (client): shown to every new member ───────── */}
      <View style={styles.field}>
        <InputField
          label="Welcome message"
          value={form.initialMessage}
          onChangeText={(initialMessage) =>
            change({ initialMessage: initialMessage.slice(0, DESCRIPTION_MAX) })
          }
          placeholder="E.g. Welcome! Introduce yourself..."
          valueSize={16}
          height={100}
          multiline
          maxLength={DESCRIPTION_MAX}
        />
        <InfoLine label={`Shown once to each new member. ${form.initialMessage.length}/${DESCRIPTION_MAX}.`} />
      </View>

      {/* ───────── Circle: topic ───────── */}
      {isCircle && (
        <View style={styles.field}>
          <SelectField
            label="Select A TOPIC"
            value={form.topic}
            placeholder="Technology"
            valueSize={16}
            onPress={() => setPickingTopic(true)}
          />
          <InfoLine label="Select the Category that suits your Circle." color="#828282" />
        </View>
      )}
      </ScrollView>

      <CustomButton
        title="Continue"
        height={48}
        loading={saving}
        disabled={!canContinue}
        onPress={() => {
          if (!form.name.trim()) {
            ToastMessage(`Give your ${word} a title`, "error");
            return;
          }
          onContinue?.({
            type,
            name: form.name.trim(),
            description: form.description.trim(),
            initialMessage: form.initialMessage.trim() || undefined,
            picture: form.picture || undefined,
            topic: isCircle ? form.topic : undefined,
          });
        }}
      />
      {/* Circle topic: the full-screen topic list used by Shows (Select-Genre) */}
      <Modal
        visible={visible && pickingTopic}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setPickingTopic(false)}
      >
        <TopicPicker
          single
          initial={form.topic ? [form.topic] : []}
          placeholder="Technology..."
          emptyLabel="No topic matches your search."
          onChange={(names) => change({ topic: names[0] || "" })}
          onClose={() => setPickingTopic(false)}
        />
      </Modal>
    </FloatingSheet>
  );
};

export default GroupFormSheet;

const styles = StyleSheet.create({
  scroll: {
    gap: 12,
  },
  imageBlock: {
    gap: 12,
  },
  imageSlot: {
    width: 132,
    height: 132,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imageShade: {
    backgroundColor: "rgba(18, 18, 18, 0.48)",
  },
  field: {
    gap: 6,
  },
  topicRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
