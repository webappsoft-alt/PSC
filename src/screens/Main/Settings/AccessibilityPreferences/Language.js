import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FlagImage from "../../../../components/FlagImage";
import Header from "../../../../components/Header";
import Icons from "../../../../components/Icons";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { LANGUAGES, languageOf } from "../../../../utils/languages";
import { resolvePick } from "../../../../utils/pickerBus";
import { updateProfilePreference } from "../../../../utils/updateProfilePreference";

const WHITE_4 = "rgba(255, 255, 255, 0.04)";
const WHITE_32 = "rgba(255, 255, 255, 0.32)";
const WHITE_48 = "rgba(255, 255, 255, 0.48)";
const WHITE_64 = "rgba(255, 255, 255, 0.64)";
const GOLD = "#A19375";

/**
 * Figma Matching/Jobs › "App-language" (8276:9334). One screen for the app
 * language (Settings) and for picking a language (job offer / profile —
 * client: "re-use the same language screen"): pass `{ pick: true, value }`
 * and the pick comes back through utils/pickerBus ("language").
 * Body padding 12: `language` 16 white 48% + "Select your language" Regular
 * 14 −3% white 48% (gap 4) · 8 · list padding 14/0, rows split by 1pt white
 * 4% with 16 above and below: 16 round flag · 8 · name Medium 16 −0.5
 * (white 64%, white when picked) · 10 · native Regular 12 white 48% — 24
 * radio (white 32% / #A19375 checked).
 */
const Language = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const pickMode = !!route?.params?.pick;
  const [selected, setSelected] = useState(() =>
    pickMode ? languageOf(route?.params?.value)?.code || null : languageOf(userData?.profile?.language)?.code || "en",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pickMode && userData?.profile?.language) {
      const lang = languageOf(userData.profile.language);
      if (lang) setSelected(lang.code);
    }
  }, [userData?.profile?.language, pickMode]);

  const choose = async (lang) => {
    if (pickMode) {
      setSelected(lang.code);
      resolvePick("language", lang);
      navigation.goBack();
      return;
    }
    if (loading || selected === lang.code) return;
    setSelected(lang.code);
    setLoading(true);
    await updateProfilePreference(dispatch, userData, { language: lang.code }, "Language updated successfully");
    setLoading(false);
  };

  return (
    <ScreenWrapper headerUnScrollable={() => <Header title="Language" />} scrollEnabled paddingHorizontal={12}>
      <View style={styles.body}>
        <View style={styles.info}>
          <Icons family="MaterialSymbolsRounded" name="language" size={16} color={WHITE_48} />
          <CustomText label="Select your language" fontSize={14} letterSpacing={-0.42} color={WHITE_48} marginTop={(16 - 19.6) / 2} marginBottom={(16 - 19.6) / 2} />
        </View>
        <View style={styles.list}>
          {LANGUAGES.map((lang, i) => {
            const on = selected === lang.code;
            return (
              <View key={lang.code} style={styles.item}>
                {i > 0 && <View style={styles.separator} />}
                <TouchableOpacity activeOpacity={0.7} onPress={() => choose(lang)} style={styles.row}>
                  <View style={styles.column}>
                    <View style={styles.nameRow}>
                      <FlagImage code={lang.flag} size={16} />
                      <CustomText
                        label={lang.name}
                        fontSize={16}
                        letterSpacing={-0.5}
                        fontFamily={fonts.medium}
                        color={on ? "#FFFFFF" : WHITE_64}
                        numberOfLines={1}
                        marginTop={(16 - 22.4) / 2}
                        marginBottom={(16 - 22.4) / 2}
                      />
                    </View>
                    <CustomText
                      label={lang.native}
                      fontSize={12}
                      color={WHITE_48}
                      numberOfLines={1}
                      marginTop={(8 - 16.8) / 2}
                      marginBottom={(8 - 16.8) / 2}
                    />
                  </View>
                  <Icons
                    family="MaterialSymbolsRounded"
                    name={on ? "radio_button_checked" : "radio_button_unchecked"}
                    size={24}
                    color={on ? GOLD : WHITE_32}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Language;

const styles = StyleSheet.create({
  // Figma: header ends at 104, the info row starts at 128
  body: { paddingTop: 24, paddingBottom: 106, gap: 8 },
  info: { flexDirection: "row", alignItems: "center", gap: 4, height: 16 },
  list: { paddingVertical: 14, gap: 16 },
  item: { gap: 16 },
  separator: { height: 1, backgroundColor: WHITE_4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 54 },
  column: { flex: 1, gap: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 16 },
});
