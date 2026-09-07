import { StyleSheet, View, TouchableOpacity, Image } from "react-native";
import React from "react";
import { COLORS } from "../../../../utils/COLORS";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import Icons from "../../../../components/Icons";
import { Images } from "../../../../assets/images";
import { useTheme } from "../../../../contexts/ThemeContext";

const RatingOverview = ({
  name = "Alté–Rèbè Festival",
  rating = 4.7,
  reviews = "1.2k",
  tags = ["Pop", "Dancehall"],
  discount = "-20%",
  stock = "Less than 5 left!",
  isBest = true,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card}>
      {/* <View style={styles.discount}>
        <CustomText
          label={discount}
          fontSize={16}
          fontFamily={fonts.medium}
          color={COLORS.black}
        />
      </View> */}
      {/* <View style={styles.topRow}>
        <View style={styles.ratingRow}>
          {[...Array(5)].map((_, i) => (
            <Image
              source={Images.star}
              style={{ height: 20, width: 20, resizeMode: "contain" }}
            />
          ))}

          <CustomText
            label={` ${rating}`}
            fontSize={16}
            fontFamily={fonts.semiBold}
            color={COLORS.gray64}
          />

          <CustomText
            label={` (${reviews} reviews)`}
            fontSize={12}
            color={COLORS.gray64}
            fontFamily={fonts.medium}
          />

          {isBest && (
            <View style={styles.bestTag}>
              <CustomText
                label="Best"
                fontSize={12}
                fontFamily={fonts.medium}
                color={COLORS.btnColor}
              />
            </View>
          )}
        </View>
      </View> */}

      {/* <View style={styles.tagRow}>
        {tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <CustomText label={tag} fontSize={12} color={COLORS.white} />
          </View>
        ))}

        {tags.length > 3 && (
          <View style={styles.moreTag}>
            <CustomText
              label={`+${tags.length - 3} more`}
              fontSize={12}
              color={COLORS.white}
            />
          </View>
        )}
      </View> */}

      <CustomText
        label={name}
        fontSize={24}
        fontFamily={fonts.semiBold}
        color={colors.text}
        style={styles.title}
      />
      <View style={styles.stock}>
        <CustomText
          label={stock}
          fontSize={12}
          fontFamily={fonts.medium}
          color={COLORS.buttonColor}
        />
      </View>
    </TouchableOpacity>
  );
};

export default RatingOverview;
const createStyles = (colors, isDark) => StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginTop: 8,
    marginVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 18,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  bestTag: {
    backgroundColor: "#A1937529",
    marginLeft: 6,
    borderRadius: 4,
    paddingHorizontal: 3,
  },

  discount: {
    backgroundColor: COLORS.btnColor,
    height: 56,
    width: 56,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    right: 0,
    position: "absolute",
    top: 3,
  },

  tagRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 6,
    marginBottom: 12,
  },

  tag: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  title: {
    marginTop: 10,
  },

  stock: {
    marginTop: 4,
    backgroundColor: "#A193750A",
    alignSelf: "flex-start",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  moreTag: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
