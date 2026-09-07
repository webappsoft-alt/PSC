import { Image, StyleSheet, View } from "react-native";
import React from "react";
import InfoCard from "./InfoCard";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";

const data = [
  { name: "Bass", level: "Beginner" },
  { name: "Guitar", level: "Intermediate" },
  { name: "Piano", level: "Legend" },
  { name: "Voice", level: "Advanced" },
];

const Levels = () => {
  return (
    <View style={{ paddingHorizontal: 8 }}>
      {data.map((item, index) => (
        <>
          <CustomText
            label={item?.name}
            fontFamily={fonts.medium}
            color={COLORS.white}
            fontSize={17}
            lineHeight={17 * 1.4}
            marginBottom={10}
          />
          <InfoCard key={index} name={item.level} marginBottom={16} />
        </>
      ))}
    </View>
  );
};

export default Levels;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
});
