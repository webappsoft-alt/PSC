import { StyleSheet, Image, View } from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import { Images } from "../../../../assets/images";
import fonts from "../../../../assets/fonts";

const MatchingHeader = () => {
  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: "space-between",
          paddingHorizontal: 6,
          marginBottom: 16,
        },
      ]}
    >
      <View style={{ marginLeft: 12 }}>
        <CustomText
          label={"Discover"}
          fontSize={32}
          fontFamily={fonts.semiBold}
        />
        <View style={styles.row}>
          <Image
            source={Images.locationUnderline}
            style={{ height: 12, width: 12, marginRight: 4 }}
          />
          <CustomText label={"Los Angeles, California"} />
        </View>
      </View>
      <View style={[styles.row, { gap: 8 }]}>
        <Image source={Images.matchingNoti} style={styles.filter} />
        <Image source={Images.filterOutline} style={styles.filter} />
      </View>
    </View>
  );
};

export default MatchingHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  filter: { height: 56, width: 56 },
});
