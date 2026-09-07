import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import CustomText from "./CustomText";
import ImageFast from "./ImageFast";

import { addDurationToNow, formatPrice } from "../utils/constants";
import { calculateRoadDistanceAndTime } from "../utils/LocationUtils";
import { setTotalDuration } from "../store/reducer/usersSlice";
import { COLORS } from "../utils/COLORS";
import { Images } from "../assets/images";
import fonts from "../assets/fonts";

const TripCard = ({
  marginTop,
  marginLeft,
  isSelected,
  onPress,
  width = 320,
  mainImageStyle,
  item,
  totalDistance,
  setTotalPrice,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  // Price calculation function
  const [finalPriceResult, setFinalPriceResult] = useState("");
  const [originalPriceResult, setOriginalPriceResult] = useState("");
  const [calculatedTime, setCalculatedTime] = useState("0 min");

  const currentLocation = useSelector((state) => state.users.location);
  const calculatePrice = () => {
    const currentDate = new Date();
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

    const currentHour = currentDate.getHours();
    const isNight = currentHour >= 18 || currentHour < 6;

    let pricePerKm = 0;

    if (isWeekend && isNight) {
      pricePerKm =
        totalDistance <= 10
          ? item?.GeneralPricing?.ppkmless10kmWeekendNight || 0
          : item?.GeneralPricing?.ppkmgrater10kmWeekendNight || 0;
    } else if (isWeekend) {
      pricePerKm =
        totalDistance <= 10
          ? item?.GeneralPricing?.ppkmless10kmWeekend || 0
          : item?.GeneralPricing?.ppkmgrater10kmWeekend || 0;
    } else if (isNight) {
      pricePerKm =
        totalDistance <= 10
          ? item?.GeneralPricing?.ppkmless10kmNight || 0
          : item?.GeneralPricing?.ppkmgrater10kmNight || 0;
    } else {
      pricePerKm =
        totalDistance <= 10
          ? item?.GeneralPricing?.ppkmless10km || 0
          : item?.GeneralPricing?.ppkmgrater10km || 0;
    }

    const distancePrice = totalDistance * pricePerKm;
    const finalPrice =
      (item?.GeneralPricing?.basePrice || 0) + distancePrice || 0;
    const originalDistancePrice =
      totalDistance * (item?.GeneralPricing?.ppkmless10km || 0) || 0;
    const originalPrice =
      (item?.GeneralPricing?.basePrice || 0) + originalDistancePrice || 0;

    const validFinalPrice = isNaN(finalPrice) ? 0 : Math.round(finalPrice);
    const validOriginalPrice = isNaN(originalPrice)
      ? 0
      : Math.round(originalPrice);

    setFinalPriceResult(validFinalPrice || 0);
    setOriginalPriceResult(validOriginalPrice || 0);
    setTotalPrice?.(validFinalPrice || 0);
  };

  // Calculate distance and time between current location and driver location
  const calculateDistanceAndTimeFromDriver = async () => {
    if (currentLocation && item?.user?.location) {
      // Check if coordinates are valid numbers
      const fromLat = parseFloat(
        item.user.location.lat || item.user.location.latitude
      );
      const fromLon = parseFloat(
        item.user.location.long || item.user.location.longitude
      );
      const toLat = parseFloat(currentLocation.latitude);
      const toLon = parseFloat(currentLocation.longitude);
      // Check if all coordinates are valid numbers
      if (
        !isNaN(fromLat) &&
        !isNaN(fromLon) &&
        !isNaN(toLat) &&
        !isNaN(toLon)
      ) {
        try {
          const result = await calculateRoadDistanceAndTime(
            { lat: fromLat, long: fromLon },
            { latitude: toLat, longitude: toLon },
            { mode: "driving", units: "metric" }
          );
          setCalculatedTime(result.timeString || "0 min");
        } catch (error) {
          console.error("Error calculating road distance/time:", error);
          setCalculatedTime("0 min");
        }
      } else {
        setCalculatedTime("0 min");
      }
    } else {
      setCalculatedTime("0 min");
    }
  };

  useEffect(() => {
    calculatePrice();
  }, [item?.GeneralPricing?.basePrice, totalDistance]);

  useEffect(() => {
    calculateDistanceAndTimeFromDriver();
  }, [currentLocation, item?.user?.location]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        onPress?.();
        dispatch(setTotalDuration(calculatedTime));
      }}
      disabled={!onPress}
      style={[
        styles.tipContainer,
        {
          marginTop,
          marginLeft,
          borderWidth: isSelected ? 2 : 1,
          width,
        },
        { borderColor: isSelected ? COLORS.primaryColor : "#1212120A" },
      ]}
    >
      {isSelected ? (
        <TouchableOpacity
          activeOpacity={0.9}
          style={{
            position: "absolute",
            alignSelf: "center",
            zIndex: 1000,
            top: 95,
          }}
          onPress={() =>
            navigation.navigate("Equipments", {
              Comfort: item?.Comfort,
              Exterior: item?.Exterior,
              Accessibility: item?.Accessibility,
            })
          }
        >
          <Image
            source={Images.ViewIcon}
            style={{
              height: 56,
              width: 56,
              resizeMode: "contain",
            }}
          />
        </TouchableOpacity>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <CustomText
            label={`$${formatPrice(finalPriceResult || 0)}`}
            color="#37B874"
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
          />
          <CustomText
            label={`$${formatPrice(originalPriceResult || 0)}`}
            color="#1212127A"
            fontFamily={fonts.semiBold}
            textDecorationLine={"line-through"}
            fontSize={14}
            lineHeight={14 * 1.4}
            marginLeft={3}
          />
        </View>
        <View style={[styles.rowItem, { gap: 4 }]}>
          <CustomText
            label={addDurationToNow(calculatedTime)}
            color={COLORS.black}
            fontFamily={fonts.medium}
            fontSize={16}
            lineHeight={16 * 1.4}
          />
          <View style={styles.dot} />
          <CustomText
            label={`${calculatedTime} away`}
            color="#121212A3"
            fontSize={14}
            textTransform="none"
            lineHeight={14 * 1.4}
          />
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <View style={styles.dot1} />

        <Image
          source={Images.CarBrand}
          style={{ height: 14, width: 14, resizeMode: "contain" }}
        />
        <View style={styles.flash}>
          <Image
            source={Images.FlashWhite}
            style={{ height: 10, width: 10, resizeMode: "contain" }}
          />
        </View>
        <CustomText
          label={item?.brand}
          color={COLORS.subtitle}
          fontFamily={fonts.medium}
          fontSize={14}
          lineHeight={14 * 1.4}
        />
      </View>
      <ImageFast
        source={
          item?.vehicleImages?.[0]
            ? { uri: item?.vehicleImages?.[0] }
            : Images.carModal3d1
        }
        resizeMode="contain"
        style={mainImageStyle || { width: 266, height: 126 }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <View style={styles.badge}>
          <Image
            source={Images.StartWhite}
            style={{ width: 15, height: 15, resizeMode: "contain" }}
          />
          <CustomText
            label="Top"
            color={COLORS.white}
            fontFamily={fonts.semiBold}
            fontSize={14}
            lineHeight={14 * 1.4}
          />
        </View>
        <View style={styles.badge2}>
          <Image
            source={Images.FlashWhite}
            style={{ width: 15, height: 15, resizeMode: "contain" }}
          />
          <CustomText
            label="Fastest"
            color={COLORS.white}
            fontFamily={fonts.semiBold}
            fontSize={14}
            lineHeight={14 * 1.4}
          />
        </View>
        <View style={styles.badge3}>
          <Image
            source={Images.DollerCard}
            style={{ width: 15, height: 15, resizeMode: "contain" }}
          />
          <CustomText
            label="Best Price"
            color={COLORS.white}
            fontFamily={fonts.semiBold}
            fontSize={14}
            lineHeight={14 * 1.4}
          />
        </View>
      </View>

      <View style={[styles.rowItem, { gap: 4, marginTop: 5 }]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#4347FF",
            borderRadius: 100,
            padding: 2,
          }}
        >
          <Image
            source={Images.DisabledWhite}
            style={{ height: 16, width: 16, resizeMode: "contain" }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FEC887",
            borderRadius: 100,
            padding: 2,
          }}
        >
          <Image
            source={Images.Pet}
            style={{ height: 16, width: 16, resizeMode: "contain" }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#37B874",
            borderRadius: 100,
            padding: 5,
          }}
        >
          <Image
            source={Images.EatDrink}
            style={{ height: 12, width: 12, resizeMode: "contain" }}
          />
        </View>
        <CustomText
          label={`+4`}
          fontFamily={fonts.regular}
          fontSize={14}
          color={COLORS.subtitle}
          lineHeight={14 * 1.4}
        />
        <CustomText
          label="|"
          fontFamily={fonts.regular}
          fontSize={18}
          color={"#12121229"}
          lineHeight={18 * 1.4}
        />
        <Image
          source={Images.Tachi}
          style={{ height: 16, width: 16, resizeMode: "contain" }}
        />
        <CustomText
          label={`${item?.GeneralPricing?.Luggage?.extraStartingFrom || 0}`}
          fontFamily={fonts.medium}
          fontSize={14}
          color={COLORS.black}
          lineHeight={14 * 1.4}
        />
        <CustomText
          label={`+£${
            item?.GeneralPricing?.Luggage?.price || 0
          } per extra luggage`}
          fontFamily={fonts.regular}
          fontSize={12}
          color={COLORS.subtitle}
          lineHeight={12 * 1.4}
        />
        <Image
          source={Images.InfoGrey}
          resizeMode={"contain"}
          style={{ height: 16, width: 16 }}
        />
      </View>
    </TouchableOpacity>
  );
};

export default TripCard;

const styles = StyleSheet.create({
  flash: {
    backgroundColor: "#37B874",
    flexDirection: "row",
    alignItems: "center",
    width: 14,
    height: 14,
    padding: 2,
    justifyContent: "center",
    borderRadius: 2,
  },

  badge: {
    backgroundColor: "#A57A3A",
    paddingRight: 6,
    paddingLeft: 4,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 4,
  },
  badge2: {
    backgroundColor: "#4347FF",
    paddingRight: 6,
    paddingLeft: 4,
    paddingVertical: 4,
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
    borderRadius: 4,
  },
  badge3: {
    backgroundColor: "#37B874",
    paddingRight: 6,
    paddingLeft: 7,
    flexDirection: "row",
    paddingVertical: 4,
    gap: 3,
    alignItems: "center",
    borderRadius: 4,
  },

  rowItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    backgroundColor: "#1212127A",
    width: 4,
    height: 4,
    borderRadius: 100,
  },
  dot1: {
    width: 6,
    height: 6,
    borderRadius: 100,
    backgroundColor: COLORS.black,
  },

  tipContainer: {
    borderWidth: 1,
    borderColor: "#1212120A",
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
  },
});
