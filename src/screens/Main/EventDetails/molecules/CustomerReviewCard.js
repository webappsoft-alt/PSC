import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import { Images } from "../../../../assets/images";
import RatingsSummary from "./RatingsSummary";
import ReviewsHeader from "./ReviewsHeader";

const CustomerReviewCard = ({
  name,
  rating,
  variant,
  review,
  images = [],
  likes,
  date,
}) => {
  return (
    <>
      <RatingsSummary />
      <ReviewsHeader />
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <CustomText
            label={name}
            fontSize={12}
            fontFamily={fonts.semiBold}
            color={COLORS.white}
          />

          <View style={styles.ratingRow}>
            <CustomText
              label={rating}
              fontSize={12}
              fontFamily={fonts.medium}
              color={COLORS.white}
            />
            <Image source={Images.star} style={styles.star} />
          </View>
        </View>

        <CustomText
          label={variant}
          fontSize={12}
          color={COLORS.gray64}
          style={{ marginTop: 4 }}
        />

        <CustomText
          label={review}
          fontSize={12}
          color={COLORS.gray64}
          style={styles.reviewText}
        />

        <View style={styles.imagesRow}>
          {images?.length > 0
            ? images
                .slice(0, 3)
                .map((img, index) => (
                  <Image key={index} source={img} style={styles.reviewImage} />
                ))
            : [1, 2, 3].map(() => <View style={styles.placeholderImage} />)}
        </View>

        <View style={styles.footerRow}>
          <View style={styles.likeRow}>
            <CustomText
              label={likes}
              fontSize={13}
              color={COLORS.gray64}
              fontFamily={fonts.medium}
            />
            <Icons
              family={"MaterialCommunityIcons"}
              name="thumb-up-outline"
              size={14}
              color={COLORS.gray64}
              style={{ marginLeft: 5 }}
            />
            <CustomText
              label="Useful"
              fontSize={13}
              color={COLORS.gray64}
              fontFamily={fonts.medium}
              textStyle={{ marginLeft: 4 }}
            />
          </View>

          <CustomText
            label={date}
            fontSize={12}
            color={COLORS.gray64}
            fontFamily={fonts.medium}
          />
        </View>
      </View>
    </>
  );
};

export default CustomerReviewCard;

const styles = StyleSheet.create({
  card: {
    borderColor: COLORS.inputBg,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    width: 240,
    marginHorizontal: 12,
    marginTop: 6,
  },

  headerRow: {},

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 1,
  },

  star: {
    height: 12,
    width: 12,
    marginLeft: 4,
    resizeMode: "contain",
    tintColor: "#FBBC05",
  },

  reviewText: {
    marginTop: 8,
    lineHeight: 20,
  },

  imagesRow: {
    flexDirection: "row",
    marginVertical: 12,
    gap: 4,
  },

  reviewImage: {
    height: 48,
    width: 48,
    borderRadius: 10,
    backgroundColor: "#2E2E2E",
  },
  placeholderImage: {
    height: 48,
    width: 48,
    borderRadius: 12,
    backgroundColor: "#2E2E2E",
  },
  footerRow: {},

  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
});
