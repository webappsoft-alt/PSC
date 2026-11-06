import { StackActions, useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import ScreenWrapper, { ScreenFlatList, ScreenHeaderSpacer } from "../../../components/ScreenWrapper";
import { get } from "../../../services/ApiRequest";
import { CloseCircle, HEADER_TOP_GAP, INK, SearchPill, Separator } from "./molecules/CareerUI";
import { OptionRow } from "./SelectEmploymentType";

// first suggestions before anyone typed (titles already used on PSC come first)
const DEFAULT_TITLES = [
  "Software Engineer",
  "Product Manager",
  "Marketing Manager",
  "Sales Manager",
  "Relationship Manager",
  "Designer",
  "Consultant",
  "Founder",
  "Musician",
  "Content Creator",
];

/**
 * Figma Matching › "Select-Job-Title" (8038:12285): header 104 (padding
 * 56/12/8, search pill 40 + close 40), 64pt option rows with a 24 radio.
 * Suggestions come from titles already on PSC (`career/job-titles`); typing
 * a new title offers it as the first row.
 */
const DEFAULT_DEGREES = [
  "High School Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "MBA",
  "PhD",
  "Associate Degree",
  "Certificate",
  "Apprenticeship (CFC)",
];

const SelectJobTitle = ({ route }) => {
  const navigation = useNavigation();
  const returnTo = route?.params?.returnTo || "AddExperience";
  const paramKey = route?.params?.paramKey || "pickedTitle";
  const isDegree = route?.params?.mode === "degree";
  const placeholder = route?.params?.placeholder || "Search a job title...";
  const defaults = isDegree ? DEFAULT_DEGREES : DEFAULT_TITLES;
  const [value, setValue] = useState(route?.params?.value || "");
  const [query, setQuery] = useState("");
  const [titles, setTitles] = useState([]);
  const reqRef = useRef(0);

  useEffect(() => {
    const id = ++reqRef.current;
    const t = setTimeout(async () => {
      try {
        const term = query.trim().toLowerCase();
        const base = defaults.filter((d) => !term || d.toLowerCase().includes(term));
        if (isDegree) {
          setTitles(base);
          return;
        }
        const res = await get(`career/job-titles?q=${encodeURIComponent(query.trim())}`);
        if (id !== reqRef.current) return;
        const fromApi = res?.data?.success ? res.data.data : [];
        setTitles([...fromApi, ...base.filter((d) => !fromApi.some((a) => a.toLowerCase() === d.toLowerCase()))]);
      } catch (e) {
        if (id === reqRef.current) setTitles(defaults);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, isDegree]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (v) => {
    setValue(v);
    navigation.dispatch(StackActions.popTo(returnTo, { [paramKey]: v }, { merge: true }));
  };

  const term = query.trim();
  const rows = [
    ...(term && !titles.some((t) => t.toLowerCase() === term.toLowerCase()) ? [term] : []),
    ...(value && !titles.includes(value) && value.toLowerCase() !== term.toLowerCase() ? [value] : []),
    ...titles,
  ];

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      scrollEnabled={false}
      headerBlur
      backgroundColor={INK}
      headerUnScrollable={() => (
        <View style={styles.header}>
          <SearchPill value={query} onChangeText={setQuery} placeholder={placeholder} autoFocus />
          <CloseCircle onPress={() => navigation.goBack()} />
        </View>
      )}
    >
      <ScreenFlatList
        data={rows}
        keyExtractor={(item) => item}
        ListHeaderComponent={<ScreenHeaderSpacer />}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => <OptionRow label={item} selected={item === value} onPress={() => pick(item)} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </ScreenWrapper>
  );
};

export default SelectJobTitle;

const styles = StyleSheet.create({
  header: {
    paddingTop: HEADER_TOP_GAP + 4,
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  list: { paddingBottom: 40 },
});
