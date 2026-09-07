import {
  StyleSheet,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import React, { useState } from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import Icons from "../../../../components/Icons";
import ToggleCard from "./ToggleCard";
import { useTheme } from "../../../../contexts/ThemeContext";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SettingAccordian = ({
  title,
  data = [],
  defaultExpanded = false,
  marginTop,
  marginBottom,
  marginHorizontal,
  backgroundColor,
  titleColor,
  titleFontSize = 16,
  arrowColor,
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View
      style={[
        styles.container,
        {
          marginTop,
          marginBottom,
          marginHorizontal,
          backgroundColor: backgroundColor || colors.surface,
          borderBottomWidth: 4,
          borderColor: colors.surfaceAlt,
        },
      ]}
    >
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleAccordion}
        activeOpacity={0.7}
      >
        <CustomText
          label={title || "General"}
          fontFamily={fonts.semiBold}
          fontSize={titleFontSize}
          color={titleColor || colors.text}
        />
        <Icons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          family="Feather"
          size={24}
          color={arrowColor || colors.iconMuted}
        />
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && data.length > 0 && (
        <View style={styles.content}>
          {data.map((item, index) => (
            <ToggleCard
              key={item.id || index}
              title={item.title}
              subtitle={item.subtitle}
              subtitleFontSize={14}
              value={item.value}
              setValue={item.setValue}
              bgColor={colors.surface}
              isBorder
                // marginBottom={index < data.length - 1 ? 8 : 0}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default SettingAccordian;

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  content: {
    // paddingBottom: 16,
  },
});
