import { StyleSheet, View, TouchableOpacity, Image } from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";

const LineupCard = ({ data = [] }) => {
  return (
    <View style={styles.grid}>
      {data.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: item.img }}
              style={styles.artistImage}
              resizeMode="cover"
            />
          </View>

          <CustomText
            label={item.name}
            fontSize={12}
            color={COLORS.white}
            fontFamily={fonts.medium}
            textAlign="center"
            marginTop={4}
            numberOfLines={2}
          />
        </View>
      ))}
    </View>
  );
};

export default LineupCard;

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    marginTop: 10,
  },
  card: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 12,
  },
  imageWrapper: {
    borderRadius: 100,
    overflow: "hidden",
    height: 108,
    width: 108,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardColor,
  },
  artistImage: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
  },
});
