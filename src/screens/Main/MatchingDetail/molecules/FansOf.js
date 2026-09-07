import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import { ArtistImgs } from "../../../../assets/images/artistImgs";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";

const artists = [
  { name: "Arctic Monkeys", img: ArtistImgs.img6 },
  { name: "Blur", img: ArtistImgs.img2 },
  { name: "Beastie Boys", img: ArtistImgs.img3 },
];

const FansOf = () => {
  return (
    <View style={styles.container}>
      <CustomText
        label="Fans of"
        fontFamily={fonts.medium}
        fontSize={17}
        color={COLORS.white}
        marginBottom={12}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {artists.map((artist, index) => (
          <TouchableOpacity key={index} activeOpacity={0.8}>
            <View style={styles.card}>
              <Image
                source={artist.img}
                style={styles.image}
                resizeMode="cover"
              />
              <CustomText
                label={artist.name}
                fontSize={12}
                color={COLORS.white}
                fontFamily={fonts.medium}
                textAlign="center"
                marginTop={8}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default FansOf;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  scrollContainer: {
    // paddingHorizontal: 8,
  },
  card: {
    alignItems: "center",
    marginRight: 12,
  },
  image: {
    width: 108,
    height: 108,
    borderRadius: 99,
  },
});
