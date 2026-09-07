import { StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import InfoCard from "./InfoCard";

const data = ["Blues", "Rock", "Soul"];

const MusicStyles = () => {
  return (
    <View style={{ paddingHorizontal: 8 }}>
      <CustomText
        label="Music style"
        fontFamily={fonts.medium}
        color={COLORS.white}
        fontSize={17}
        lineHeight={17 * 1.4}
        marginBottom={10}
      />

      <View style={styles.row}>
        {data.map((item, index) => (
          <InfoCard key={index} name={item} showIcon type="music" />
        ))}
      </View>
    </View>
  );
};

export default MusicStyles;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
});
