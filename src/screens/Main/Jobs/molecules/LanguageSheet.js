import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import FlagImage from "../../../../components/FlagImage";
import FloatingSheet from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import { LANGUAGE_PROFICIENCIES, languageLabel, languageOf } from "../../../../utils/languages";
import { awaitPick } from "../../../../utils/pickerBus";
import { FieldBox, MSF, WHITE_64 } from "../../Career/molecules/CareerUI";
import { OptionList, SheetFooter } from "./JobOptionSheet";

/** Figma LANGUAGE field value: 12 round flag · 4 · "French (FR)" */
export const LanguageValue = ({ code, placeholder = "Select a language", onPress }) => {
  const lang = languageOf(code);
  return (
    <FieldBox
      chevronColor={WHITE_64}
      label="Language"
      value={languageLabel(lang)}
      placeholder={placeholder}
      leading={lang ? <FlagImage code={lang.flag} size={12} /> : null}
      valueRowGap={4}
      valueLetterSpacing={0}
      onPress={onPress}
    />
  );
};

/**
 * Figma "Language Proficiency" sheets (8265:9267 / 8265:9120): LANGUAGE
 * (→ the app Language screen, reused as a picker) + LANGUAGE PROFICIENCY
 * (→ the level list, same sheet) · Confirm. Used by Profile › Career
 * "Add a new Language".
 */
const LanguageSheet = ({ visible, onDismiss, value, onConfirm, onRemove, levels = LANGUAGE_PROFICIENCIES.filter((l) => l !== "Any") }) => {
  const navigation = useNavigation();
  const [draft, setDraft] = useState({ code: "", proficiency: "Elementary" });
  const [step, setStep] = useState(null);
  const [picking, setPicking] = useState(false);
  // the Language screen opens once the sheet has fully closed
  const openPicker = useRef(false);

  useEffect(() => {
    if (visible && !picking) {
      setDraft({ code: value?.code || "", proficiency: value?.proficiency || "Elementary" });
      setStep(null);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickLanguage = () => {
    setPicking(true);
    awaitPick("language", (lang) => {
      setDraft((d) => ({ ...d, code: lang.code }));
      setPicking(false);
    });
    openPicker.current = true;
  };

  // coming back without a pick (back button) shows the sheet again
  useEffect(() => {
    if (!picking) return undefined;
    const unsub = navigation.addListener("focus", () => setPicking(false));
    return unsub;
  }, [picking, navigation]);

  return (
    <FloatingSheet
      visible={visible && !picking}
      onDismiss={step ? () => setStep(null) : onDismiss}
      title="Language Proficiency"
      subtitle="Find all options below:"
      closeIconSize={16}
      closeIconColor="muted"
      subtitleTrim={-4.9}
      onClosed={() => {
        if (!openPicker.current) return;
        openPicker.current = false;
        navigation.navigate("Language", { pick: true, value: draft.code });
      }}
    >
      {step === "levels" ? (
        <>
          <OptionList options={levels} selected={draft.proficiency} onToggle={(v) => setDraft((d) => ({ ...d, proficiency: v }))} />
          <SheetFooter onConfirm={() => setStep(null)} />
        </>
      ) : (
        <>
          <View style={styles.fields}>
            <LanguageValue code={draft.code} onPress={pickLanguage} />
            <FieldBox
              chevronColor={WHITE_64}
              label="Language Proficiency"
              value={draft.proficiency}
              valueLetterSpacing={0}
              onPress={() => setStep("levels")}
            />
            {/* editing a saved language: same red bar as the job form's language removal */}
            {!!onRemove && (
              <TouchableOpacity activeOpacity={0.8} onPress={onRemove} style={styles.remove} accessibilityLabel="Remove language">
                <Icons family={MSF} name="delete_forever" size={20} color="#EE1045" />
              </TouchableOpacity>
            )}
          </View>
          <SheetFooter
            onConfirm={() => {
              const lang = languageOf(draft.code);
              if (!lang) return;
              onConfirm?.({ code: lang.code, name: lang.name, proficiency: draft.proficiency });
            }}
          />
        </>
      )}
    </FloatingSheet>
  );
};

export default LanguageSheet;

const styles = StyleSheet.create({
  fields: { gap: 8 },
  remove: { height: 32, borderRadius: 8, backgroundColor: "rgba(238, 16, 69, 0.16)", alignItems: "center", justifyContent: "center" },
});
