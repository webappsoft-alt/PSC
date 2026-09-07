import { StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomSwitch from "../../../../components/CustomSwitch";
import CustomText from "../../../../components/CustomText";
import ErrorComponent from "../../../../components/ErrorComponent";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";
const SwitchOption = ({
  value,
  setValue,
  lable = "DISABLE FRIENDLY?",
  error = "Offer accessibilty features for disable people.",
}) => {
  const { colors } = useTheme();
  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.surfaceAlt }]}>
        <View style={{ flex: 1 }}>
          <CustomText
            label={lable}
            fontFamily={fonts.medium}
            fontSize={12}
            textTransform={"uppercase"}
            lineHeight={12 * 1.4}
            color={colors.iconMuted}
          />
          <CustomText
            label={value ? "Yes" : "No"}
            color={colors.text}
            fontFamily={fonts.medium}
            fontSize={16}
            lineHeight={12 * 1.4}
            marginTop={5}
          />
        </View>
        <View style={{ alignSelf: "center" }}>
          <CustomSwitch value={value} setValue={setValue} />
        </View>
      </View>
      <ErrorComponent
        errorTitle={error}
        color={colors.iconMuted}
        marginBottom={8}
      />
    </>
  );
};

export default SwitchOption;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    flexDirection: "row",
    marginBottom: 8,
    height: 56,
  },
});
