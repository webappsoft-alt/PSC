import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { PNGIcons } from "../assets/images/icons";
import CustomButton from "./CustomButton";
import CustomText from "./CustomText";
import Icons from "./Icons";
import ImageFast from "./ImageFast";
import ScreenWrapper from "./ScreenWrapper";
import SearchInput from "./SearchInput";
import TopTab from "./TopTab";
import { COLORS } from "../utils/COLORS";
import CarFilterModal from "../screens/Main/VehicleMarketplace/CarFilterModal";

import MainCarCard from "../screens/Main/VehicleMarketplace/molecules/MainCarCard";
import BrowseAudience from "../screens/Main/VehicleMarketplace/molecules/BrowseAudience";
import GiftCard from "../screens/Main/VehicleMarketplace/molecules/GiftCard";
import SeeMoreCard from "../screens/Main/VehicleMarketplace/molecules/SeeMoreCard";
import TopCarCard from "../screens/Main/Rentals/molecules/TopCarCard";

const VehicleMarketplace = () => {
  const navigation = useNavigation();
  const categories = ["Cars", "Motorbikes", "Bicycles", "Sea", "Air"];

  const [tab, setTab] = useState(0);
  const [filterModal, setFilterModal] = useState(false);
  const [seeMoreSelected2, setSeeMoreSelected2] = useState(null);

  const vehicleTypes = [
    { id: 1, name: "Sedan", count: "1.25k" },
    { id: 2, name: "Hatchback", count: "1.25k" },
    { id: 3, name: "SUV", count: "1.25k" },
    { id: 4, name: "Coupe", count: "1.25k" },
    { id: 5, name: "Cross-Over", count: "1.25k" },
    { id: 6, name: "Luxury", count: "1.25k" },
    { id: 8, name: "Classic", count: "1.25k" },
    { id: 9, name: "Convertible", count: "1.25k" },
    { id: 10, name: "Minivan/Van", count: "1.25k" },
    { id: 11, name: "Pickup Truck", count: "1.25k" },
    { id: 12, name: "Toys", count: "1.25k" },
    { id: 9, name: "Convertible", count: "1.25k" },
  ];

  const categoriesImages = [
    Images.car,
    Images.motorbike,
    Images.bike,
    Images.boat,
    Images.PlaneGrey,
  ];

  const seeMoreItemsTwo = [
    {
      id: "two-1",
      image: PNGIcons.plus,
      title: "Have an interesting product?",
      subtitle: "Sell to thousands on Linkable.",
      tag: "Upgrade To Pro",
      forward: false,
    },
    {
      id: "two-2",
      image: Images.chatIcon,
      title: "Need to request a product",
      subtitle: "Even if not there, we can make it available to you.",
      tag: "Send a Request",
      forward: false,
    },
  ];
  const workItems = [
    {
      id: "two-1",
      image: PNGIcons.plus,
      title: "Add To Cart",
      subtitle: "SQuickly add your desired items to the shopping cart.",
      tag: "1",
    },
    {
      id: "two-2",
      image: PNGIcons.plus,
      title: "Add To Cart",
      subtitle: "SQuickly add your desired items to the shopping cart.",
      tag: "2",
    },
    {
      id: "two-3",
      image: PNGIcons.plus,
      title: "Add To Cart",
      subtitle: "SQuickly add your desired items to the shopping cart.",
      tag: "3",
    },
  ];

  return (
    <ScrollView>
      {/* Header with profile and location */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image source={Images.user} style={styles.profileImage} />
          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <CustomText label="Display Name" fontFamily={fonts.medium} />
              <ImageFast
                source={Images.check}
                style={{ height: 14, width: 14, marginLeft: 4 }}
                resizeMode={"contain"}
              />
              <ImageFast
                source={Images.verifyStar}
                style={{ height: 14, width: 14, marginLeft: 2 }}
                resizeMode={"contain"}
              />
            </View>
            <View style={styles.locationContainer}>
              <Icons family="MaterialIcons" name="location-pin" size={16} />
              <CustomText
                label="Geneva"
                color={COLORS.gray1}
                marginLeft={2}
                lineHeight={14 * 1.4}
              />
              <Icons
                family="Ionicons"
                name="chevron-down-outline"
                size={12}
                marginLeft={4}
              />
            </View>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <ImageFast
            loading={false}
            source={Images.QROutline}
            style={styles.outlineImage}
          />
          <ImageFast
            loading={false}
            source={Images.walletOutline}
            style={styles.outlineImage}
          />
          <ImageFast
            loading={false}
            source={Images.lineOutline}
            style={styles.outlineImage}
          />
        </View>
      </View>
      {/* Search Bar */}
      <View style={{ paddingHorizontal: 12 }}>
        <SearchInput placeholder="Eg. Shoes..." isChange isCross onPress={() => {}} />

        <TopTab
          rounded
          tab={tab}
          setTab={setTab}
          tabNames={categories}
          marginBottom={12}
          marginTop={10}
          images={categoriesImages}
        />

        {/* Vehicle Types Grid */}
        <FlatList
          numColumns={4}
          data={vehicleTypes}
          renderItem={({ item, index }) => (
            <TopCarCard name={item.name} count={item.count} />
          )}
          showsVerticalScrollIndicator={false}
        />

        <View
          style={[
            styles.nameContainer,
            { justifyContent: "space-between", marginVertical: 12 },
          ]}
        >
          <TouchableOpacity
            style={[styles.saveButton, { justifyContent: "center" }]}
          >
            <Image source={PNGIcons.fav} style={{ height: 16, width: 16 }} />
            <CustomText
              label={"Saved"}
              fontFamily={fonts.medium}
              marginTop={2}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { justifyContent: "center" }]}
          >
            <View style={styles.bagQuantity}>
              <CustomText
                label={"16"}
                color={COLORS.white}
                fontSize={8}
                lineHeight={8 * 1.4}
              />
            </View>
            <Image
              source={PNGIcons.bagDark}
              style={{ height: 16, width: 16 }}
            />
            <Image
              source={PNGIcons.bagwhite}
              style={{ height: 16, width: 16 }}
            />
            <CustomText
              label={"In Cart"}
              fontFamily={fonts.medium}
              marginTop={2}
              lineHeight={14 * 1.4}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[styles.nameContainer, { justifyContent: "space-between" }]}
        >
          <CustomButton
            title={"Following"}
            rightIcon={PNGIcons.follow}
            width="32%"
            backgroundColor={COLORS.lightGray}
            color={COLORS.primaryColor}
            fontSize={14}
            fontFamily={fonts.medium}
            height={32}
          />
          <View style={[styles.nameContainer, { gap: 6 }]}>
            <ImageFast
              source={PNGIcons.globeOutline}
              style={styles.outlineImage}
              loading={false}
              onPress={() => navigation.navigate("SliderFilter")}
            />
            <ImageFast
              onPress={() => setFilterModal(true)}
              source={PNGIcons.filterOutline}
              style={styles.outlineImage}
              loading={false}
            />
          </View>
        </View>

        <View style={styles.border} />
        <View style={styles.row}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <CustomText
              label={"Most Popular"}
              fontSize={18}
              fontFamily={fonts.medium}
              lineHeight={18 * 1.4}
            />
            <CustomText
              label={" Brands"}
              fontSize={18}
              fontFamily={fonts.medium}
              lineHeight={18 * 1.4}
              color={COLORS.darkPurple}
            />
          </View>

          <View style={styles.seeMore}>
            <CustomText
              label={"SEE MORE"}
              fontSize={12}
              lineHeight={12 * 1.4}
              fontFamily={fonts.semiBold}
            />
            <Image
              source={PNGIcons.forwardPurple}
              style={styles.forwardPurple}
            />
          </View>
        </View>

        <FlatList
          numColumns={3}
          data={vehicleTypes}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.6}
              key={index}
              style={styles.brandItem}
            >
              <ImageFast
                source={PNGIcons.wordpress}
                loading={false}
                style={{ height: 32, width: 32 }}
                resizeMode={"contain"}
              />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.border} />
      </View>
      {/* Categories */}
      <MainCarCard
        highlightText
        highlight={"Cars"}
        title={"Best of 2025"}
        titleTwo={"Top"}
        sub={"Top"}
        car
      />
      <MainCarCard
        threeText
        title={"Your Daily Update"}
        titleTwo={"About"}
        sub={"Electronics"}
        car
      />
      <MainCarCard title={"New Deals"} imgText />

      <SeeMoreCard
        title={"How Does It Work"}
        isChange
        isWork
        items={workItems}
      />

      <MainCarCard
        title={"New Deals"}
        isDealCardChange
        imgText
        marginTop={12}
      />
      <MainCarCard title={"New Deals"} car imgText />
      <MainCarCard title={"Everything at $1"} car imgText />
      <MainCarCard
        title={"Deals"}
        sub={"You Would Not Like To Miss!"}
        car
        imgTwoText
      />

      <MainCarCard
        title={"Top 10 in"}
        sub={"Asia"}
        isTextReverse
        car
        imgTwoText
        isTop
      />
      <MainCarCard
        title={"People from Jamaica"}
        sub={"Love These"}
        isTextReverse
        car
        imgTwoText
      />
      <MainCarCard title={"Your Friends Have Joined"} car />
      <MainCarCard
        title={"Exlusive products in"}
        sub={"Electronics"}
        isTextReverse
        car
        imgTwoText
        isImage={false}
      />
      <MainCarCard
        title={"Events driven by"}
        sub={"Men"}
        isTextReverse
        car
        imgTwoText
        isImage={false}
      />

      <SeeMoreCard title={"What Would You Like To See More?"} />

      <MainCarCard
        title={"Events driven by"}
        sub={"Women"}
        isTextReverse
        car
        imgTwoText
        isImage={false}
        marginTop={12}
      />
      <MainCarCard
        title={"Events joined by"}
        sub={"Nassir & 3 others"}
        isTextReverse
        car
        imgTwoText
        isImage={false}
      />

      <SeeMoreCard isBrand isChange title={"Famous Brands"} />

      <MainCarCard title={"Most Popular"} isProduct marginTop={12} />

      <GiftCard />

      <BrowseAudience />

      <SeeMoreCard
        isChange
        title={"You Make The Next Move."}
        items={seeMoreItemsTwo}
        selectedId={seeMoreSelected2}
        onChange={(item) => setSeeMoreSelected2(item?.id)}
      />

      <MainCarCard title={"Your Friends Have Joined"} car marginTop={12} />

      <CarFilterModal
        isVisible={filterModal}
        onItemPress={() => {
          setFilterModal(false),
            setTimeout(() => {
              navigation.navigate("VehicleFilters");
            }, 600);
        }}
        onDisable={() => setFilterModal(false)}
      />
    </ScrollView>
  );
};

export default VehicleMarketplace;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  profileInfo: {
    marginLeft: 12,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    width: "49%",
    gap: 4,
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  vehicleItem: {
    width: "23.5%",
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    marginRight: 6,
    marginBottom: 6,
  },
  vehicleImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },

  outlineImage: {
    height: 40,
    width: 40,
  },

  bagQuantity: {
    height: 16,
    width: 16,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.darkPurple,
  },
  border: {
    height: 2,
    backgroundColor: COLORS.lightGray,
    marginVertical: 12,
  },
  seeMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  forwardPurple: {
    height: 20,
    width: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  brandItem: {
    height: 40,
    width: "32%",
    padding: 10,
    backgroundColor: "#7d93be",
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
    marginBottom: 4,
  },
});
