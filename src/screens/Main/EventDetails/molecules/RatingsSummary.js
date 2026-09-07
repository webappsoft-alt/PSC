import React from "react";
import { View, StyleSheet, Image, Dimensions } from "react-native";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import { Images } from "../../../../assets/images";
import Icons from "../../../../components/Icons";

const { width } = Dimensions.get("window");
const BAR_MAX_WIDTH = width - 180;

const RatingsSummary = ({
  overallRating = 5,
  basedOn = "95 ratings",
  categories = [
    { key: "Location", value: 0.7, stars: 5 },
    { key: "Crowd", value: 0.6, stars: 4 },
    { key: "Line-Up", value: 0.55, stars: 3 },
    { key: "Cleanliness", value: 0.65, stars: 2 },
    { key: "Recommend", value: 0.6, stars: 1 },
  ],
}) => {
  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <CustomText
          label="Ratings & Reviews"
          fontSize={16}
          fontFamily={fonts.semiBold}
          color={COLORS.white}
        />
        <Icons
          family={"Entypo"}
          name={"chevron-down"}
          color={COLORS.gray64}
          size={22}
        />
      </View>

      <View style={styles.bigRating}>
        <CustomText
          label={`${overallRating}`}
          fontSize={64}
          fontFamily={fonts.medium}
          color={COLORS.white}
          lineHeight={64 * 1.3}
        />

        <View style={styles.smallRatingRow}>
          <CustomText
            label={`/5`}
            fontSize={20}
            fontFamily={fonts.medium}
            color={COLORS.gray64}
          />
          <CustomText
            label={`  (Based of ${basedOn})`}
            fontSize={12}
            fontFamily={fonts.medium}
            color={COLORS.gray64}
            marginTop={6}
          />
        </View>
      </View>
      <View style={[styles.row, { marginTop: -10 }]}>
        <View style={styles.barsColumn}>
          {categories.map((cat) => (
            <View key={cat.key} style={styles.barRow}>
              <View style={{ width: 104 }}>
                <CustomText
                  label={cat.key}
                  fontSize={12}
                  fontFamily={fonts.medium}
                  color={COLORS.white}
                />
              </View>

              <View style={styles.barWrap}>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: Math.max(6, BAR_MAX_WIDTH * cat.value) },
                    ]}
                  />
                </View>
                <View style={styles.starWrap}>
                  <CustomText
                    label={`${cat.stars}`}
                    fontSize={14}
                    fontFamily={fonts.medium}
                    color={COLORS.gray64}
                    marginRight={3}
                  />
                  <Image
                    source={Images.star}
                    style={{ width: 16, height: 16, resizeMode: "contain" }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default RatingsSummary;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: COLORS.black,
  },
  header: {
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bigRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallRatingRow: {
    flexDirection: "row",
    marginTop: 18,
  },
  barsColumn: {
    flex: 1,

    justifyContent: "center",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  barLabel: {
    width: 78,
  },
  barWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  barBg: {
    height: 4,
    flex: 1,
    backgroundColor: "#FFFFFF29",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: COLORS.btnColor, // goldish from screenshot
  },
  starWrap: {
    width: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
