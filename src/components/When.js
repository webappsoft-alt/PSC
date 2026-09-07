import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import Icons from "./Icons";
import ImageFast from "./ImageFast";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { PNGIcons } from "../assets/images/icons";
import { COLORS } from "../utils/COLORS";

const { height } = Dimensions.get("window");

const deliveries = [
  {
    id: 1,
    title: "Book Instantly",
    desc: "Book a Chauffeur instlantly to get you where you need to be.",
    price: 15,
    image: Images.package,
  },
  {
    id: 2,
    title: "Book hourly",
    desc: "Book an hour-long trip and make as much stops as you need. Recommended for shopping or sightseeing",
    price: 25,
    image: Images.package,
  },
  {
    id: 3,
    title: "Reserve for later",
    desc: "Schedule trips in advance for you or with your friends on a specific date and time.",
    price: 25,
    image: Images.package,
  },
  {
    id: 4,
    title: "Shared Tips",
    desc: "Cars, buses, boats, airplanes tickets. Find trips near your pick-up location and your drop-off location. Share the trip with your friends or other users on a specific date and time.",
    price: 45,
    image: Images.package,
  },
];

const When = ({ isVisible, onDisable, onPress, onCardPress }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onCardPress}
      style={styles.card}
    >
      <View style={{ width: "90%" }}>
        <View style={styles.top}>
          <View style={styles.leftIcon}>
            <ImageFast
              source={item.image}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>
          <CustomText
            label={item.title}
            color={COLORS.black}
            fontSize={16}
            lineHeight={16 * 1.4}
            fontFamily={fonts.medium}
            marginLeft={12}
          />
        </View>

        <CustomText
          label={item.desc}
          color={COLORS.subtitle}
          lineHeight={14 * 1.4}
          fontSize={14}
          fontFamily={fonts.semiBold}
        />

        <CustomText
          label={`From $${item.price}`}
          color={COLORS.black}
          fontSize={16}
          fontFamily={fonts.medium}
          lineHeight={16 * 1.4}
          marginTop={12}
        />
      </View>
      <Icons
        name={"chevron-right"}
        family={"Feather"}
        size={24}
        color={COLORS.subtitle}
      />
    </TouchableOpacity>
  );

  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View style={styles.container}>
        <CustomText
          label={"When"}
          color={COLORS.black}
          fontSize={24}
          fontFamily={fonts.semiBold}
          marginBottom={16}
        />
        <TouchableOpacity onPress={onPress} style={styles.dismissIcon}>
          <Image source={PNGIcons.cross} style={{ width: 24, height: 24 }} />
        </TouchableOpacity>
        <FlatList
          data={deliveries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </CustomModal>
  );
};

export default When;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,    maxHeight: height * 0.8,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftIcon: {
    backgroundColor: COLORS.lowPurple,
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  icon: {
    width: 20,
    height: 20,
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
    left: "50%",
    transform: [{ translateX: -24 }],
  },
});
