import { StyleSheet, View } from "react-native";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import ImageFast from "./ImageFast";

const ProfileCard = ({
  name = "Viktor Sola",
  rating = "4.7",
  distance = "475km",
  rides = "428 Rides",
  carColor = "Red",
  carModel = "2025 BMW Serie 3",
  profileImage = Images.placeholderUser,
  colorIcon = Images.RedCircle,
}) => {
  return (
    <View style={styles.profileCard}>
      <ImageFast
        source={profileImage}
        style={{ width: 56, height: 56 }}
      />
      <View>
        <CustomText
          label={name}
          color={COLORS.black}
          fontFamily={fonts.medium}
          fontSize={16}
          lineHeight={16 * 1.4}
        />
        <View>
          <View style={[styles.row, { gap: 4, marginTop: 2 }]}>
            <ImageFast
              source={colorIcon}
              style={{ width: 16, height: 16 }}
            />
            <CustomText
              label={carColor}
              color={COLORS.black}
              fontFamily={fonts.medium}
              fontSize={12}
              lineHeight={12 * 1.4}
            />
            <View style={styles.dot}></View>
            <CustomText
              label={carModel}
              color={COLORS.black}
              fontFamily={fonts.medium}
              fontSize={12}
              lineHeight={12 * 1.4}
            />
          </View>
          <View style={[styles.row, { gap: 4, marginTop: 2 }]}>
            <View style={[
              styles.row,
              {
                backgroundColor: '#1212120A',
                paddingLeft: 2,
                paddingRight: 4,
                borderRadius: 4
              }
            ]}>
              <ImageFast
                source={Images.blackStar}
                style={{ width: 16, height: 16 }}
              />
              <CustomText
                label={rating}
                color={COLORS.subtitle}
                fontFamily={fonts.medium}
                fontSize={12}
                lineHeight={12 * 1.4}
              />
            </View>
            <View style={styles.dot}></View>
            <CustomText
              label={distance}
              color={COLORS.subtitle}
              fontFamily={fonts.medium}
              fontSize={12}
              lineHeight={12 * 1.4}
            />
            <View style={styles.dot}></View>
            <CustomText
              label={rides}
              color={COLORS.subtitle}
              fontFamily={fonts.medium}
              fontSize={12}
              lineHeight={12 * 1.4}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProfileCard;

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    backgroundColor: "#12121229",
    height: 3,
    width: 3,
    borderRadius: 100,
  },
});