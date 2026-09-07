import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import Icons from "../../../../components/Icons";
import { PNGIcons } from "../../../../assets/images/icons";
import { Images } from "../../../../assets/images";

const ReviewsHeader = ({
  totalReviews = "1.2k",
  onSeeAll = () => {},
  selectedFilter = "5",
  onFilterChange = () => {},
}) => {
  const Chip = ({
    children,
    active,
    onPress,
    icon,
    paddingHorizontal = 12,
  }) => (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive, { paddingHorizontal }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <CustomText
        label={children}
        fontSize={14}
        color={active ? COLORS.white : COLORS.gray64}
        fontFamily={fonts.medium}
      />
      {icon ? icon : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <CustomText
          label="Customer Reviews"
          fontSize={16}
          fontFamily={fonts.semiBold}
          color={COLORS.white}
        />
        <TouchableOpacity
          onPress={onSeeAll}
          activeOpacity={0.8}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <CustomText
            label="See all"
            fontSize={12}
            color={COLORS.gray64}
            fontFamily={fonts.medium}
          />
          <Image
            source={Images.trending}
            style={{ height: 12, width: 12, tintColor: COLORS.gray64 }}
          />
        </TouchableOpacity>
      </View>

      <CustomText
        label={`(Total ${totalReviews} reviews)`}
        fontSize={12}
        color={COLORS.gray64}
        fontFamily={fonts.medium}
        marginTop={2}
      />

      <View style={styles.chipsRow}>
        <Chip
          active={selectedFilter === "all"}
          onPress={() => onFilterChange("all")}
          paddingHorizontal={18}
        >
          All
        </Chip>

        <Chip
          active={selectedFilter === "5"}
          onPress={() => onFilterChange("5")}
          paddingHorizontal={16}
          icon={
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={Images.star}
                style={{ height: 16, width: 16, marginLeft: 2 }}
              />
              <Icons
                family={"Entypo"}
                name={"chevron-down"}
                color={COLORS.white}
                size={14}
              />
            </View>
          }
        >
          5
        </Chip>

        <Chip
          active={selectedFilter === "recent"}
          onPress={() => onFilterChange("recent")}
          icon={
            <Icons
              family={"Entypo"}
              name={"chevron-down"}
              color={COLORS.gray64}
              size={14}
              style={{ marginLeft: 4 }}
            />
          }
        >
          Most recent
        </Chip>

        <Chip
          active={selectedFilter === "images"}
          onPress={() => onFilterChange("images")}
          icon={
            <Image
              source={Images.camera_outline}
              style={{ height: 16, width: 16, marginLeft: 6 }}
            />
          }
        >
          Images only
        </Chip>
      </View>
    </View>
  );
};

export default ReviewsHeader;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: COLORS.black,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chipsRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",

    marginBottom: 6,
  },
  chipActive: {
    backgroundColor: COLORS.cardColor,
    borderWidth: 0,
  },
});
