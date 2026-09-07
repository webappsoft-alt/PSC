import { useNavigation } from "@react-navigation/native";
import { Image, StyleSheet, View } from "react-native";
import { Images } from "../../../../assets/images";
import ImageFast from "../../../../components/ImageFast";
import SearchInput from "../../../../components/SearchInput";

const SearchRow = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.mainContainer}>
      <SearchInput isHi placeholder={"Hey! What’s new...?"} width={"63%"} />
      <View style={styles.row}>
        <ImageFast
          removeLoading
          onPress={() => navigation.navigate("SearchScreen")}
          source={Images.camera}
          style={styles.icon}
        />
        <Image source={Images.todo} style={styles.icon} />
        <Image source={Images.mic} style={styles.icon} />
      </View>
    </View>
  );
};

export default SearchRow;

const styles = StyleSheet.create({
  mainContainer: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    height: 40,
    width: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
