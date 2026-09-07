import { StyleSheet, View } from "react-native";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import ImageFast from "./ImageFast";

const CarCard = ({
  discountPercentage = "20%",
  price = "$0",
  eta = "/ ETA: 1:31 PM",
  fastestLabel = "Fastest",
  bestPriceLabel = "Best Price",
  rating = "3",
  carModel = "2021 BMW Hatchback",
  color = "Red",
  amenities = "+3 amenities",
  extraLuggage = "+£2 per extra luggage"
}) => {
  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <View style={{ position: "relative", width: 99, height: 99 }}>
          <ImageFast
            source={Images.placeholderImage}
            resizeMode="cover"
            style={styles.car}
          />
          <View style={styles.discount}>
            <ImageFast
              source={Images.Discount}
              resizeMode="contain"
              style={styles.DiscountIcon}
            />
            <CustomText
              label={discountPercentage}
              color={"#37B874"}
              fontFamily={fonts.medium}
              fontSize={10}
            />
          </View>
        </View>

        <View>
          <View style={styles.row}>
            <CustomText
              label={price}
              fontFamily={fonts.semiBold}
              fontSize={18}
              lineHeight={18 * 1.4}
            />
            <CustomText
              label={eta}
              fontFamily={fonts.regular}
              fontSize={14}
              lineHeight={14 * 1.4}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 4,
            }}
          >
            <View style={styles.flash}>
              <ImageFast
                source={Images.flash}
                resizeMode={"contain"}
                style={{ height: 12, width: 12 }}
              />
              <CustomText
                label={fastestLabel}
                fontFamily={fonts.medium}
                fontSize={10}
                color={"#4347FF"}
                lineHeight={10 * 1.4}
              />
            </View>
            <View style={styles.flashGreen}>
              <ImageFast
                source={Images.flashGreen}
                resizeMode={"contain"}
                style={{ height: 12, width: 12 }}
              />
              <CustomText
                label={bestPriceLabel}
                fontFamily={fonts.medium}
                fontSize={10}
                color={"#37B874"}
                lineHeight={10 * 1.4}
              />
            </View>
          </View>

          <View style={[styles.row, { gap: 4, marginTop: 3 }]}>
            <ImageFast
              source={Images.blackStar}
              resizeMode={"contain"}
              style={{ height: 12, width: 12 }}
            />
            <CustomText
              label={rating}
              fontFamily={fonts.regular}
              fontSize={14}
              lineHeight={18 * 1.4}
            />
            <CustomText
              label={"|"}
              fontFamily={fonts.regular}
              fontSize={18}
              color={"#12121229"}
              lineHeight={18 * 1.4}
            />
            <ImageFast
              source={Images.Nature}
              resizeMode={"contain"}
              style={{ height: 12, width: 12 }}
            />
            <CustomText
              label={carModel}
              fontFamily={fonts.regular}
              fontSize={14}
              lineHeight={14 * 1.4}
            />
          </View>
          <View style={[styles.row, { gap: 4 }]}>
            <ImageFast
              source={Images.RedCircle}
              resizeMode={"contain"}
              style={{ height: 16, width: 16 }}
            />
            <CustomText
              label={color}
              fontFamily={fonts.regular}
              fontSize={14}
              lineHeight={18 * 1.4}
            />
            <CustomText
              label={"|"}
              fontFamily={fonts.regular}
              fontSize={18}
              color={"#12121229"}
              lineHeight={18 * 1.4}
            />
            <ImageFast
              source={Images.Cycle}
              resizeMode={"contain"}
              style={{ height: 16, width: 16 }}
            />
            <ImageFast
              source={Images.tune}
              resizeMode={"contain"}
              style={{ height: 16, width: 16 }}
            />
            <ImageFast
              source={Images.playbutton}
              resizeMode={"contain"}
              style={{ height: 16, width: 16 }}
            />
            <CustomText
              label={amenities}
              fontFamily={fonts.regular}
              fontSize={12}
              color={COLORS.subtitle}
              lineHeight={12 * 1.4}
            />
          </View>
        </View>
      </View>

      <View style={[styles.row, { gap: 4, marginTop: 5 }]}>
        <ImageFast
          source={Images.infoButton}
          resizeMode={"contain"}
          style={{ height: 16, width: 16 }}
        />
        <CustomText
          label={"|"}
          fontFamily={fonts.regular}
          fontSize={18}
          color={"#12121229"}
          lineHeight={18 * 1.4}
        />
        <ImageFast
          source={Images.Tachi}
          resizeMode={"contain"}
          style={{ height: 16, width: 16 }}
        />
        <CustomText
          label={extraLuggage}
          fontFamily={fonts.regular}
          fontSize={12}
          color={COLORS.subtitle}
          lineHeight={12 * 1.4}
        />
      </View>
    </View>


    
  );
};

export default CarCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  mainContainer: {
    borderWidth: 1,
    borderColor: "#1212120A",
    borderRadius: 12,
    padding: 8,
    marginTop: 16,
  },

  car: {
    height: 99,
    width: 99,
    borderRadius: 8,
  },
  discount: {
    backgroundColor: "#37B87429",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    position: "absolute",
    top: 5,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },

  DiscountIcon: {
    height: 10,
    width: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  flash: {
    backgroundColor: "#4347FF29",
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 3,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
  },

  flashGreen: {
    backgroundColor: "#37B87429",
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 3,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
  },
});
