import React from "react";
import { StyleSheet, View } from "react-native";
import CustomSwitch from "@/components/CustomSwitch";
import CustomText from "@/components/CustomText";
import { COLORS } from "../utils/COLORS";
import InfoComponent from "@/components/InfoComponent";

interface SwitchOptionProps {
  value: boolean;
  setValue: (value: boolean) => void;

  label?: string;
  info?: string | React.ReactNode;
  error?: string;
  errorMarginBottom?: number;
  marginBottom?: number;
}

const SwitchOption: React.FC<SwitchOptionProps> = ({
  value,
  setValue,
  label = "DISABLE FRIENDLY?",
  info,
  error,
  errorMarginBottom,
  marginBottom,
}) => {
  const theme = {
    background: COLORS.black,
    cardBackground: COLORS.white16,
    text: COLORS.white,
    textSecondary: COLORS.gray,
    textTertiary: COLORS.gray2,
  };

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.cardBackground, marginBottom },
        ]}
      >
        <View style={{ flex: 1 }}>
          <CustomText
            label={label}
            fontFamily="Poppins_500Medium"
            fontSize={12}
            textTransform="uppercase"
            color={theme.textSecondary}
          />
          <CustomText
            fontSize={16}
            label={value ? "Yes" : "No"}
            fontFamily="Poppins_500Medium"
          />
        </View>

        <View style={{ alignSelf: "center" }}>
          <CustomSwitch value={value} setValue={setValue} />
        </View>
      </View>

      {info != null && info !== "" && (
        <InfoComponent
          marginTop={5}
          text={typeof info === "string" ? info : undefined}
        >
          {typeof info !== "string" ? info : null}
        </InfoComponent>
      )}
      {error && (
        <InfoComponent
          marginTop={8}
          color="#FF3B30"
          text={"* " + error}
          marginBottom={errorMarginBottom || 0}
        />
      )}
    </>
  );
};

export default SwitchOption;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    height: 56,
  },
});
