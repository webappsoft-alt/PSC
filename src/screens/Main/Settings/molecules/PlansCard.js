import React from "react";
import { StyleSheet, View, TouchableOpacity, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import fonts from "../../../../assets/fonts";

import Icons from "../../../../components/Icons";
import { Images } from "../../../../assets/images";

const PlansCard = ({ plan, onPress }) => {
  const isFree = plan === "Free Tier";

  const getImage = () => {
    if (plan === "Super Likes") return Images.superLikes;
    else if (plan === "Boosts") return Images.boosts;
    else if (plan === "Rewinds") return Images.rewinds;
  };

  const color =
    plan === "Super Likes"
      ? "#007BFF"
      : plan === "Boosts"
      ? "#575093"
      : plan === "Rewinds"
      ? "#FF4B4B"
      : "#7B64F4";

  const text =
    plan === "Super Likes"
      ? "Stand out with Super Likes and get much more chance to connect with other like minded profiles."
      : plan === "Boosts"
      ? "For an hour be the most reviewed profile in your category and get much more chance to connect with other like minded profiles."
      : "For an hour be the most reviewed profile in your category and get much more chance to connect with other like minded profiles.";

  const renderContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Image source={getImage()} style={{ height: 24, width: 24 }} />
          <CustomText
            label={plan}
            fontSize={34}
            fontFamily={fonts.medium}
            color={COLORS.white}
          />
        </View>
        {/* {plan === "Super Likes" ? (
          <View style={styles.freePlanBadge}>
            <Icons
              family={"Ionicons"}
              name={"checkmark"}
              size={12}
              color={"#121212"}
            />
            <CustomText
              label={"Active"}
              fontSize={10}
              fontFamily={fonts.medium}
              color={"#121212"}
            />
          </View>
        ) : (
          <></>
        )} */}
      </View>

      <CustomText label={text} fontSize={12} color={"#FFFFFFE0"} />
    </View>
  );

  if (isFree) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.cardColor }]}>
        {renderContent()}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.black, color]}
      locations={[0.79, 0.98]}
      angle={126}
      useAngle={true}
      style={[styles.container, { borderWidth: 1 }]}
    >
      {renderContent()}
    </LinearGradient>
  );
};

export default PlansCard;

const styles = StyleSheet.create({
  container: {
    height: 135,
    borderRadius: 12,
    borderColor: "#FFFFFF0A",
    marginTop: 10,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
    justifyContent: "space-evenly",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  bottomRow: {
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 6,
    height: 16,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    position: "absolute",
    top: 56,
    left: 16,
  },
  freePlanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
    paddingVertical: 5,
    paddingRight: 12,
    backgroundColor: COLORS.white,
    borderRadius: 100,
  },
});
