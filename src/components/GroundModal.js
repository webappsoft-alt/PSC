import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import CustomModal from "./CustomModal";

import { useState } from "react";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { PNGIcons } from "../assets/images/icons";
import { COLORS } from "../utils/COLORS";
import AuthFooter from "./Auth/AuthFooter";
import CarCard from "./CarCard";
import CustomText from "./CustomText";
import Divider from "./Divider";
import ImageFast from "./ImageFast";
import TopTab from "./TopTab";
import TopTabWithBG from "./TopTabWithBG";

const { width, height } = Dimensions.get("window");

const GroundModal = ({ isVisible, onDisable, onPress, title, actionClick }) => {
  const [Pref, setPref] = useState(false);
  const [Tab, setTab] = useState("Ground");
  const [FunctionTabs, setFunctionTabs] = useState("Best Price");
  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View style={[styles.mainContainer, { maxHeight: height * 0.7 }]}>
        <TouchableOpacity onPress={onPress} style={styles.dismissIcon}>
          <Image source={PNGIcons.cross} style={{ width: 24, height: 24 }} />
        </TouchableOpacity>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TopTabWithBG
            tab={Tab}
            paddingVertical={12}
            paddingHorizontal={12}
            tabNames={["Ground", "Sea", "Air"]}
            setTab={setTab}
            marginVertical={0.1}
            marginTop={12}
          />
          <CustomText
            marginTop={20}
            label={"Carouge"}
            fontFamily={fonts.semiBold}
            lineHeight={24 * 1.4}
            fontSize={24}
          />
          <CustomText
            label={"4 steps until Lausanne"}
            fontFamily={fonts.medium}
            lineHeight={16 * 1.4}
            fontSize={16}
            marginBottom={20}
            color={COLORS.subtitle}
          />

          <Divider marginVertical={0.1} />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <CustomText
              label={"53 km/"}
              fontFamily={fonts.semiBold}
              lineHeight={18 * 1.4}
              fontSize={18}
              color={COLORS.black}
            />
            <CustomText
              label={"33 miles"}
              fontFamily={fonts.semiBold}
              lineHeight={18 * 1.4}
              fontSize={18}
              color={COLORS.subtitle}
            />
          </View>

          <View style={[styles.row, { gap: 3 }]}>
            <CustomText
              label={"Departure: July 14, 2025"}
              fontFamily={fonts.medium}
              lineHeight={14 * 1.4}
              fontSize={14}
              color={COLORS.subtitle}
            />
            <View style={styles.dot}></View>
            <CustomText
              label={"12:15"}
              fontFamily={fonts.medium}
              lineHeight={14 * 1.4}
              fontSize={14}
              color={COLORS.subtitle}
            />
          </View>

          <View style={[styles.row, { gap: 3 }]}>
            <CustomText
              label={"ETA: July 14, 2025"}
              fontFamily={fonts.medium}
              lineHeight={14 * 1.4}
              fontSize={14}
              color={COLORS.subtitle}
            />
            <View style={styles.dot}></View>
            <CustomText
              label={"13:45"}
              fontFamily={fonts.medium}
              lineHeight={14 * 1.4}
              fontSize={14}
              color={COLORS.subtitle}
            />
          </View>
          <Divider marginVertical={12} />
          <TopTab
            tab={FunctionTabs}
            setTab={setFunctionTabs}
            paddingHorizontal={12}
            paddingVertical={8}
            height={"auto"}
            rounded
            tabNames={["Best Price", "Nearest", "Best Rated", "Most Recent"]}
          />

          <CustomText
            label={"Cars"}
            marginTop={20}
            fontFamily={fonts.bold}
            lineHeight={24 * 1.4}
            fontSize={24}
            color={COLORS.black}
          />
          <View style={[styles.row, { gap: 3 }]}>
            <CustomText
              label={"Standard"}
              fontFamily={fonts.medium}
              lineHeight={16 * 1.4}
              fontSize={16}
              color={COLORS.subtitle}
            />
            <ImageFast
              source={Images.blackUser}
              resizeMode={"contain"}
              style={styles.userIcon}
            />
            <CustomText
              label={"4"}
              fontFamily={fonts.medium}
              lineHeight={16 * 1.4}
              fontSize={16}
              color={COLORS.subtitle}
            />
          </View>

          <FlatList
            data={[
              {
                discountPercentage: "20%",
                price: "$0",
                eta: "/ ETA: 1:31 PM",
                fastestLabel: "Fastest",
                bestPriceLabel: "Best Price",
                rating: "4.5",
                carModel: "2021 BMW Hatchback",
                color: "Red",
                amenities: "+3 amenities",
                extraLuggage: "+£2 per extra luggage",
              },
              {
                discountPercentage: "15%",
                price: "$5",
                eta: "/ ETA: 1:45 PM",
                fastestLabel: "Fast",
                bestPriceLabel: "Good Price",
                rating: "4.2",
                carModel: "2020 Audi A4",
                color: "Blue",
                amenities: "+2 amenities",
                extraLuggage: "+£3 per extra luggage",
              },
              {
                discountPercentage: "10%",
                price: "$8",
                eta: "/ ETA: 2:00 PM",
                fastestLabel: "Standard",
                bestPriceLabel: "Fair Price",
                rating: "4.0",
                carModel: "2019 Mercedes C-Class",
                color: "Black",
                amenities: "+4 amenities",
                extraLuggage: "+£1 per extra luggage",
              },
              {
                discountPercentage: "25%",
                price: "$3",
                eta: "/ ETA: 1:50 PM",
                fastestLabel: "Quick",
                bestPriceLabel: "Great Deal",
                rating: "3.8",
                carModel: "2022 Toyota Camry",
                color: "White",
                amenities: "+1 amenities",
                extraLuggage: "+£2 per extra luggage",
              },
              {
                discountPercentage: "5%",
                price: "$12",
                eta: "/ ETA: 2:15 PM",
                fastestLabel: "Luxury",
                bestPriceLabel: "Premium",
                rating: "4.8",
                carModel: "2023 Tesla Model S",
                color: "Silver",
                amenities: "+5 amenities",
                extraLuggage: "+£4 per extra luggage",
              },
            ]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={{ marginLeft: index == 0 ? 0 : 10 }}>
                <CarCard
                  discountPercentage={item.discountPercentage}
                  price={item.price}
                  eta={item.eta}
                  fastestLabel={item.fastestLabel}
                  bestPriceLabel={item.bestPriceLabel}
                  rating={item.rating}
                  carModel={item.carModel}
                  color={item.color}
                  amenities={item.amenities}
                  extraLuggage={item.extraLuggage}
                />
              </TouchableOpacity>
            )}
          />

          <View style={[styles.row, { gap: 3, marginTop: 24 }]}>
            <CustomText
              label={"Large"}
              fontFamily={fonts.medium}
              lineHeight={16 * 1.4}
              fontSize={16}
              color={COLORS.subtitle}
            />
            <ImageFast
              source={Images.blackUser}
              resizeMode={"contain"}
              style={styles.userIcon}
            />
            <CustomText
              label={"6"}
              fontFamily={fonts.medium}
              lineHeight={16 * 1.4}
              fontSize={16}
              color={COLORS.subtitle}
            />
          </View>

          <FlatList
            data={[
              {
                discountPercentage: "30%",
                price: "$15",
                eta: "/ ETA: 1:40 PM",
                fastestLabel: "Express",
                bestPriceLabel: "Best Value",
                rating: "4.6",
                carModel: "2021 BMW X5",
                color: "Gray",
                amenities: "+6 amenities",
                extraLuggage: "+£3 per extra luggage",
              },
              {
                discountPercentage: "18%",
                price: "$20",
                eta: "/ ETA: 1:55 PM",
                fastestLabel: "Comfort",
                bestPriceLabel: "Premium",
                rating: "4.4",
                carModel: "2020 Audi Q7",
                color: "Brown",
                amenities: "+7 amenities",
                extraLuggage: "+£2 per extra luggage",
              },
              {
                discountPercentage: "22%",
                price: "$18",
                eta: "/ ETA: 2:10 PM",
                fastestLabel: "Spacious",
                bestPriceLabel: "Good Deal",
                rating: "4.3",
                carModel: "2019 Mercedes GLE",
                color: "Green",
                amenities: "+5 amenities",
                extraLuggage: "+£4 per extra luggage",
              },
              {
                discountPercentage: "12%",
                price: "$25",
                eta: "/ ETA: 1:35 PM",
                fastestLabel: "Luxury",
                bestPriceLabel: "Elite",
                rating: "4.9",
                carModel: "2023 Range Rover",
                color: "Black",
                amenities: "+8 amenities",
                extraLuggage: "+£5 per extra luggage",
              },
              {
                discountPercentage: "8%",
                price: "$22",
                eta: "/ ETA: 2:05 PM",
                fastestLabel: "Premium",
                bestPriceLabel: "High-End",
                rating: "4.7",
                carModel: "2022 Volvo XC90",
                color: "Blue",
                amenities: "+6 amenities",
                extraLuggage: "+£3 per extra luggage",
              },
            ]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={{ marginLeft: index == 0 ? 0 : 10 }}>
                <CarCard
                  discountPercentage={item.discountPercentage}
                  price={item.price}
                  eta={item.eta}
                  fastestLabel={item.fastestLabel}
                  bestPriceLabel={item.bestPriceLabel}
                  rating={item.rating}
                  carModel={item.carModel}
                  color={item.color}
                  amenities={item.amenities}
                  extraLuggage={item.extraLuggage}
                />
              </TouchableOpacity>
            )}
          />

          <AuthFooter marginTop={40} />
        </ScrollView>
      </View>
    </CustomModal>
  );
};

export default GroundModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  icon: {
    height: 32,
    width: 32,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  dismissIcon: {
    height: 48,
    width: 48,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lightGray,
    position: "absolute",
    top: -60,
    left: "8%",
    transform: [{ translateX: -24 }],
  },

  dot: {
    backgroundColor: "#12121229",
    height: 3,
    width: 3,
    borderRadius: 100,
  },

  userIcon: {
    width: 14,
    height: 14,
  },
});
