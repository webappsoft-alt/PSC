import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import FlagImage from "../../../components/FlagImage";
import { CURRENCIES } from "../../../utils/currencies";
import {
  AGE_RATINGS,
  SHOW_VISIBILITY,
  emitShowPick,
} from "../../../utils/showPicks";
import { FormHeader, ListRow, Radio } from "./molecules/ShowForm";
import { SHOWS, baseline, capGap, capTop } from "./molecules/showsLayout";

/**
 * Figma Shows › "Select-Category" (7580:13699) — "Age Rating": #262626 page,
 * header (status bar + 56), #121212 list 1pt below it. 64pt rows, pad 16:
 * title Medium 16 −2% white · 8 · subtitle Medium 14 −0.5px @48%; 24 radio
 * (gold when picked, white 16% otherwise). The same screen serves the New
 * Show "Visible To" options.
 */
const KINDS = {
  ageRating: { title: "Age Rating", options: AGE_RATINGS, key: "ageRating" },
  visibleTo: { title: "Visible To", options: SHOW_VISIBILITY, key: "visibleTo" },
  // Create An Episode › Price › Currency (Figma flag 17 × 12 before the name)
  currency: {
    title: "Currency",
    key: "currency",
    options: CURRENCIES.map((c) => ({
      value: c.id,
      title: c.title,
      subtitle: c.id,
      flag: c.flag,
    })),
  },
};

const ShowOptionPicker = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const kind = KINDS[route?.params?.kind] || KINDS.ageRating;
  const selected = route?.params?.value;

  const pick = (value) => {
    emitShowPick({ [kind.key]: value });
    navigation.goBack();
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 56 + 1,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={styles.list}>
          {kind.options.map((option, index) => (
            <ListRow
              key={String(option.value)}
              onPress={() => pick(option.value)}
              last={index === kind.options.length - 1}
            >
              {option.flag ? (
                <FlagImage code={option.flag} width={17} height={12} />
              ) : null}
              <View style={styles.texts}>
                <CustomText
                  label={option.title}
                  fontSize={16}
                  fontFamily={fonts.medium}
                  letterSpacing={-0.32}
                  color={SHOWS.white}
                  marginTop={capTop(16)}
                />
                <CustomText
                  label={option.subtitle}
                  fontSize={14}
                  fontFamily={fonts.medium}
                  letterSpacing={-0.5}
                  color={SHOWS.white48}
                  marginTop={capGap(8, 16, 14)}
                  marginBottom={baseline(14)}
                />
              </View>
              <Radio checked={option.value === selected} />
            </ListRow>
          ))}
        </View>
      </ScrollView>
      <FormHeader title={kind.title} onBack={() => navigation.goBack()} />
    </View>
  );
};

export default ShowOptionPicker;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: SHOWS.page,
  },
  list: {
    backgroundColor: SHOWS.section,
  },
  texts: {
    flex: 1,
  },
});
