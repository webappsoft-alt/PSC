import { useNavigation } from "@react-navigation/native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import CustomText from "./CustomText";
import ImageFast from "./ImageFast";

import Card from "../screens/Main/Home/molecules/Card";
import ImageCard from "../screens/Main/Home/molecules/ImageCard";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { PNGIcons } from "../assets/images/icons";
import { COLORS } from "../utils/COLORS";
import { FlatList } from "react-native-gesture-handler";

const HomeSheet = ({
  onWareHousePress,
  onShippingPress,
  actionClick,
  onMarketplacePress,
  ParkingMapPress,
  onTripPress,
}) => {
  const navigation = useNavigation();

  const quickAction = [
    { text: "Home", image: Images.quickaction4 },
    { text: "Hotel", image: PNGIcons.hotel },
    { text: "Work", image: Images.quickaction3 },
    { text: "Gym", image: Images.quickaction1 },
    { text: "Emergency", image: Images.quickaction2 },
  ];
  return (
    <View style={styles.bottomSheetContainer}>
      <View style={styles.content}>
        <View style={styles.cardContainer}>
          <Card
            title="People"
            icon={PNGIcons.car1}
            backgroundColor="#1212120A"
            height={120}
            onCardPress={onTripPress}
          />
          <Card
            title="Goods"
            icon={PNGIcons.car2}
            backgroundColor="#1212120A"
            onCardPress={onTripPress}
            height={120}
          />
          <Card
            title="Deliveries"
            icon={PNGIcons.car3}
            backgroundColor="#1212120A"
            onCardPress={onTripPress}
            height={120}
          />
        </View>

        <CustomText
          label="Quick Actions"
          fontFamily={fonts.semiBold}
          fontSize={16}
          marginTop={16}
          marginBottom={12}
          lineHeight={19}
        />

        <View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={quickAction}
            renderItem={({ item, index: i }) => (
              <View style={{ marginRight: 5 }}>
                <TouchableOpacity
                  onPress={actionClick}
                  key={i}
                  style={styles.quickAction}
                >
                  <ImageFast
                    source={item?.image}
                    resizeMode={"contain"}
                    style={{ height: 24, width: 24 }}
                    removeLoading
                  />
                </TouchableOpacity>
                <CustomText
                  label={item.text}
                  fontSize={11}
                  lineHeight={11 * 1.4}
                  textAlign={"center"}
                  marginTop={8}
                />
              </View>
            )}
          />
        </View>

        <CustomText
          label="Drive."
          fontFamily={fonts.semiBold}
          fontSize={16}
          marginTop={16}
          marginBottom={12}
          lineHeight={19}
        />
        <View style={styles.row}>
          <ImageCard width="49%" title="Learning" title1="Learn To Drive" />
          <ImageCard
            backgroundImage={Images.homeSheetImg}
            width="49%"
            title="Experiences"
            title1="Group Trips"
          />
        </View>
        <CustomText
          label="Shipping"
          fontFamily={fonts.semiBold}
          fontSize={16}
          marginTop={24}
          marginBottom={12}
          lineHeight={19}
        />
        <View style={styles.cardContainer}>
          <Card
            title1="Small"
            title="Items"
            icon={PNGIcons.box1}
            backgroundColor="#1212120A"
            height={120}
            onCardPress={onShippingPress}
          />
          <Card
            title1="Big"
            title="Items"
            icon={PNGIcons.box2}
            backgroundColor="#1212120A"
            height={120}
            onCardPress={onShippingPress}
          />
          <Card
            title="Outs"
            icon={PNGIcons.box3}
            backgroundColor="#1212120A"
            height={120}
            onCardPress={onShippingPress}
          />
        </View>
        <CustomText
          label="Buy your next Vehicle"
          fontFamily={fonts.semiBold}
          fontSize={16}
          marginTop={24}
          marginBottom={12}
          lineHeight={19}
        />
        <View style={styles.cardContainer}>
          <ImageCard
            onPress={onMarketplacePress}
            backgroundImage={Images.homeSheetImg2}
            width="100%"
            title="Marketplace"
            title1="New & Resell"
          />
        </View>

        <CustomText
          label="Parkings & Tours"
          fontFamily={fonts.semiBold}
          fontSize={16}
          marginTop={16}
          marginBottom={12}
          lineHeight={19}
        />
        <View style={styles.row}>
          <ImageCard
            backgroundImage={Images.homeSheetImg3}
            onPress={ParkingMapPress}
            width="32%"
            title="move."
            title1="Parkings"
          />
          <ImageCard
            backgroundImage={Images.homeSheetImg4}
            width="66%"
            title="move."
            title1="Sight Seeings"
            onPress={onMarketplacePress}
          />
        </View>
        <CustomText
          label="Rentals"
          fontFamily={fonts.semiBold}
          fontSize={24}
          marginTop={12}
          marginBottom={12}
          lineHeight={24 * 1.4}
        />
        <View style={styles.row}>
          {[
            "E-Scooters",
            "Bikes",
            "Motorbike",
            "Cars",
            "Limo, Vans",
            "Supercars",
            "Boats",
            "Helis",
            "Planes",
          ].map((item) => (
            <ImageCard
              backgroundImage={
                item == "Cars" ? Images.homeSheetImg5 : PNGIcons.bg1
              }
              onPress={() => navigation.navigate("RrentalMap")}
              key={item}
              width="32%"
              title={item}
              marginBottom={7}
            />
          ))}
        </View>
        <CustomText
          label="Warehouses"
          fontSize={16}
          marginTop={12}
          marginBottom={8}
          lineHeight={16 * 1.4}
          fontFamily={fonts.semiBold}
        />
        <TouchableOpacity activeOpacity={0.7} onPress={onWareHousePress}>
          <ImageFast
            resizeMode={"stretch"}
            style={styles.warehouse}
            source={Images.warehouseHome}
          />
        </TouchableOpacity>
        <CustomText
          label="Activities"
          fontFamily={fonts.semiBold}
          fontSize={16}
          lineHeight={16 * 1.4}
          marginTop={12}
          marginBottom={8}
        />
        <View style={styles.row}>
          {[
            "Stadium",
            "Monuments",
            "Water Park",
            "Stadium",
            "Limo, Vans",
            "Supercars",
            "Boats",
            "Helis",
            "Planes",
          ].map((item, i) => (
            <ImageCard
              backgroundImage={i == 3 ? Images.homeSheetImg5 : PNGIcons.bg1}
              onPress={() => navigation.navigate("VehicleMarketplace")}
              key={i}
              width="32%"
              title={item}
              marginBottom={7}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default HomeSheet;

const styles = StyleSheet.create({
  bottomSheetContainer: {
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 12,
    paddingTop: 0,
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  quickAction: {
    backgroundColor: "#1212120A",
    padding: 12,
    borderRadius: 12,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    width: 70,
  },
  warehouse: {
    height: 110,
  },
});
