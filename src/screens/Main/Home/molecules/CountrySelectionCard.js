import { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import ErrorComponent from "../../../../components/ErrorComponent";

const CountrySelectionCard = () => {
  const [selectedCard, setSelectedCard] = useState(1);
  const data = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      <FlatList
        numColumns={2}
        data={data}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => {
          const isSelected = selectedCard === item;
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedCard(item)}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : styles.cardUnselected,
              ]}
            >
              <CustomText
                label={"United States"}
                fontSize={16}
                fontFamily={fonts.medium}
                color={isSelected ? "#000" : "#FFF"}
              />
              <View style={styles.flagContainer}>
                <Image source={Images.flag} style={styles.flagIcon} />
                <CustomText
                  label={"United States"}
                  fontSize={12}
                  color={
                    isSelected
                      ? "rgba(0, 0, 0, 0.64)"
                      : "rgba(255, 255, 255, 0.64)"
                  }
                />
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item, index) => index.toString()}
      />
      <View style={{ width: "96%" }}>
        <ErrorComponent
          errorTitle={
            "The national average savings account yield was 0.59 percent APY, according to Bankrate’s survey of institutions as of July 15. According to "
          }
          highlight={"Bankrate.com"}
          marginTop={8}
        />
      </View>
    </View>
  );
};

export default CountrySelectionCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 32,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 6, // gap of 6 between rows
  },
  card: {
    padding: 12,
    borderRadius: 12,
    width: "49%",
    borderWidth: 1,
    gap: 6,
  },
  cardUnselected: {
    borderColor: "rgba(255, 255, 255, 0.04)",
    backgroundColor: "transparent",
  },
  cardSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  flagContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  flagIcon: {
    height: 12,
    width: 12,
  },
});
