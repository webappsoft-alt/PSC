import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";

const SLIDER_WIDTH = 320;

const MultiRangeSlider = ({
  color,
  height,
  width,
  showValue = true,
  min = 0,
  max = 100,
  initialValues,
  onValuesChange: onValuesChangeProp,
  unit = "km",
}) => {
  const [range, setRange] = useState(initialValues || [min, max]);

  const onValuesChange = (values) => {
    setRange(values);
    if (onValuesChangeProp) onValuesChangeProp(values);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelsRow}>
        <CustomText
          fontFamily={fonts.medium}
          fontSize={13}
          label={`${range[0]} ${unit}`}
          color={COLORS.white}
        />
        <CustomText
          fontFamily={fonts.medium}
          fontSize={13}
          label={`${range[1]} ${unit}`}
          color={COLORS.white}
        />
      </View>
      <MultiSlider
        values={range}
        sliderLength={SLIDER_WIDTH}
        onValuesChange={onValuesChange}
        min={min}
        max={max}
        step={1}
        selectedStyle={{ backgroundColor: color ? color : COLORS.primaryColor }}
        unselectedStyle={{ backgroundColor: COLORS.lightGray }}
        trackStyle={{ height: 4, borderRadius: 3 }}
        markerStyle={{
          height: height || 18,
          width: width || 18,
          borderRadius: 99,
          backgroundColor: color ? color : COLORS.primaryColor,
          top: 2,
        }}
      />
    </View>
  );
};

export default MultiRangeSlider;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 8,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: SLIDER_WIDTH,
    marginBottom: 8,
  },
});
