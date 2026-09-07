import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  GestureResponderEvent,
  ScrollView,
  Image,
} from "react-native";

import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import Icons from "./Icons";
import { Images } from "../assets/images";

interface OptionSelectorProps {
  label?: string;
  value?: string;
  error?: boolean;
  disabled?: boolean;
  marginTop?: number;
  placeHolder?: string;
  marginBottom?: number;
  arrow?: "down" | "right";
  showSuccessColor?: boolean;
  textTransform?: string | any;
  renderValue?: () => React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
}

const OptionSelector = ({
  arrow = "right",
  placeHolder,
  label,
  onPress,
  value,
  textTransform,
  marginTop = 10,
  marginBottom = 0,
  renderValue,
  disabled = false,
}: OptionSelectorProps) => {
  const theme = {
    background: COLORS.black,
    cardBackground: COLORS.white16,
    text: COLORS.white,
    textSecondary: COLORS.gray,
    textTertiary: COLORS.gray2,
  };

  const iconName = arrow === "down" ? "chevron-down" : "chevron-right";

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.cardBackground, marginTop, marginBottom },
      ]}
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={{ flex: 1 }}>
        {label && (
          <CustomText
            label={label}
            color={theme.textSecondary}
            fontFamily="Poppins_500Medium"
            fontSize={12}
            textTransform="uppercase"
            lineHeight={12 * 1.4}
          />
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          {label === "Location" && (
            <Image
              source={Images.location}
              style={{ height: 16, width: 16 }}
              tintColor={value ? COLORS.blue : theme.textTertiary}
            />
          )}
          <View style={{ flex: 1 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center" }}
            >
              {renderValue && value ? (
                renderValue()
              ) : (
                <CustomText
                  fontSize={16}
                  marginTop={1}
                  numberOfLines={1}
                  lineHeight={16 * 1.4}
                  label={value || placeHolder}
                  textTransform={textTransform}
                  color={value ? theme.text : theme.textTertiary}
                  fontFamily={
                    value ? "Poppins_500Medium" : "Poppins_400Regular"
                  }
                />
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={{ alignSelf: "center" }}>
        <Icons
          family="Entypo"
          name={iconName}
          size={20}
          color={theme.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
};

export default OptionSelector;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
  },
});
