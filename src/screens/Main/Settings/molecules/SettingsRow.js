import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, View } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import { SettingsIcon } from "./SettingsIcons";

const X = (fs) => Math.round(fs * 0.35 * 10) / 10;

/**
 * Figma Settings row (8336:8579): padding 12, gap 10 — 24 icon #A19375 @64% ·
 * column (title Medium 16 white · 12 · description Light 12 white 64%) ·
 * 24 `chevron` white 64%.
 */
const SettingsRow = ({ title, des, screen, icon, onPress }) => {
  const navigation = useNavigation();
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => (onPress ? onPress() : screen ? navigation.navigate(screen) : null)}
    >
      <SettingsIcon name={icon} size={24} color="#A19375" opacity={0.64} />
      <View style={styles.column}>
        <CustomText
          label={title}
          fontSize={16}
          fontFamily={fonts.medium}
          color="#FFFFFF"
          marginTop={-X(16)}
          marginBottom={-X(16)}
        />
        {!!des && (
          <CustomText
            label={des}
            fontSize={12}
            fontFamily={fonts.light}
            color="rgba(255, 255, 255, 0.64)"
            marginTop={-X(12)}
            marginBottom={-X(12)}
          />
        )}
      </View>
      <SettingsIcon name="chevron" size={24} color="#FFFFFF" opacity={0.64} />
    </Pressable>
  );
};

export default SettingsRow;

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  pressed: { opacity: 0.7 },
  column: { flex: 1, gap: 12 },
});
