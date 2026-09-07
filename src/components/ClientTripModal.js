import { Dimensions, StyleSheet, View } from "react-native";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import CustomProgressBar from "./CustomProgressBar";
import Divider from "./Divider";
import ImageFast from "./ImageFast";
import ProfileCard from "./ProfileCard";

const { width, height } = Dimensions.get("window");

const ClientTripModal = ({
  isVisible,
  onDisable,
  onPress,
  title,
  actionClick,
}) => {
  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View styles={styles.container}>
        <View style={styles.greeBanner}>
          <ImageFast
            source={Images.WhiteDiscount}
            style={{ width: 14, height: 14 }}
          />
          <CustomText
            label={"Save by using move+"}
            color={COLORS.white}
            fontFamily={fonts.regular}
            fontSize={14}
          />
        </View>

        <View style={styles.mainContainer}>
          <View style={styles.borderText}>
            <CustomText
              label={"SI0123MG"}
              color={COLORS.black}
              fontFamily={fonts.semiBold}
              fontSize={22}
              lineHeight={22 * 1.4}
            />
          </View>
          <ProfileCard
            name="Viktor Sola"
            rating="4.7"
            distance="475km"
            rides="428 Rides"
            carColor="Red"
            carModel="2025 BMW Serie 3"
            profileImage={Images.placeholderUser}
            colorIcon={Images.RedCircle}
          />

          <Divider thickness={4} marginVertical={16}/>
          
          <CustomProgressBar
            duration={10000}
            leftLabel="5 MIN MARGIN"
            centerLabel="ON-TIME"
            rightLabel="5 MIN MARGIN"
            progressColor="#37B874"
            backgroundColor="#E5E5E5"
            carColor="#4A4A4A"
          />
        </View>
      </View>
    </CustomModal>
  );
};

export default ClientTripModal;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
  },
  mainContainer: {
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  greeBanner: {
    backgroundColor: "#37B874",
    width: "100%",
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    gap: 4,
  },
  borderText: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#1212120A",
    width: 130,
    paddingHorizontal: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },

  icon: {
    height: 32,
    width: 32,
  },
});
