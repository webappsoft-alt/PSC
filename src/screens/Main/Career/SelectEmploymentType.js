import { StackActions, useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { EMPLOYMENT_TYPES } from "../../../utils/career";
import { CareerHeader, INK, Radio, Separator, X } from "./molecules/CareerUI";

/** Figma Select-* row: 64 tall, padding 16, gap 12, Medium 16 −0.5 + 24 radio */
export const OptionRow = ({ label, selected, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
    <CustomText
      label={label}
      fontSize={16}
      letterSpacing={-0.5}
      fontFamily={fonts.medium}
      color="#FFFFFF"
      numberOfLines={1}
      marginTop={-X(16)}
      marginBottom={-X(16)}
      containerStyle={styles.grow}
    />
    <Radio selected={selected} />
  </TouchableOpacity>
);

/**
 * Figma Matching › "Select-Employment-Type" (8038:11703): header 100
 * (back + "Employment Type"), six 64pt rows split by 1px white 4%.
 */
const SelectEmploymentType = ({ route }) => {
  const navigation = useNavigation();
  const returnTo = route?.params?.returnTo || "AddExperience";
  const paramKey = route?.params?.paramKey || "pickedEmploymentType";
  const options = route?.params?.options || EMPLOYMENT_TYPES;
  const title = route?.params?.title || "Employment Type";
  const [value, setValue] = useState(route?.params?.value || "");

  const pick = (v) => {
    setValue(v);
    navigation.dispatch(StackActions.popTo(returnTo, { [paramKey]: v }, { merge: true }));
  };

  return (
    <ScreenWrapper
      scrollEnabled
      paddingHorizontal={0.1}
      backgroundColor={INK}
      headerUnScrollable={() => <CareerHeader title={title} />}
    >
      <View style={styles.list}>
        {options.map((o, i) => (
          <View key={o}>
            {i > 0 && <Separator />}
            <OptionRow label={o} selected={o === value} onPress={() => pick(o)} />
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
};

export default SelectEmploymentType;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  list: { paddingTop: 1, paddingBottom: 40 },
  row: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
