import { StyleSheet, View } from "react-native";
import CustomInput from "./CustomInput";
import CustomSwitch from "./CustomSwitch";
import CustomText from "./CustomText";
import ErrorComponent from "./ErrorComponent";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";

const BookingOptionCard = ({
  label = "Gate",
  subTitle = "Define Plug Type",
  switchValue,
  setSwitchValue,
  borderBottomWidth = true,
  errorTitle,
  onChangeText,
  value,
  multiLine,
  input,
  withLabel,
  height,
}) => {
  return (
    <View
      style={[
        styles.mainContainer,
        { borderBottomWidth: borderBottomWidth && 1 },
      ]}
    >
      <View style={styles.row}>
        <View style={{ width: "80%" }}>
          <CustomText
            fontSize={16}
            label={label}
            lineHeight={16 * 1.4}
            fontFamily={fonts.medium}
          />
          <CustomText
            label={subTitle}
            fontSize={12}
            lineHeight={12 * 1.4}
            color={COLORS.subtitle}
          />
        </View>
        <CustomSwitch value={switchValue} setValue={setSwitchValue} />
      </View>

      <ErrorComponent
        errorTitle={errorTitle || "Most customers will pay extra for this."}
        marginBottom={input ? 8 : 4}
        color={COLORS.gray5}
      />
      {input && (
        <CustomInput
          value={value}
          onChangeText={onChangeText}
          multiline={multiLine}
          withLabel={withLabel}
          height={height}
        />
      )}
    </View>
  );
};

export default BookingOptionCard;

const styles = StyleSheet.create({
  mainContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    borderColor: COLORS.lightGray,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
