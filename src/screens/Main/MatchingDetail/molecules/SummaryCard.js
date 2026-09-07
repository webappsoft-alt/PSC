import {StyleSheet, View} from "react-native";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import Text from "../../../../components/ScaledText";

const SummaryCard = ({ match, inCommon, monthlyViews }) => {
  return (
    <>
      {/* <Divider /> */}
      <View style={styles.container}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#6DFF93" }]}>
              {match}%
            </Text>
            <Text style={styles.statLabel}>Match</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{inCommon}</Text>
            <Text style={styles.statLabel}>In Common</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{monthlyViews}</Text>
            <Text style={styles.statLabel}>Monthly Views</Text>
          </View>
        </View>
      </View>
      {/* <Divider /> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 18,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginBottom: 18,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: "#fff",
    marginBottom: -2,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.48)",
    fontFamily: fonts.regular,
  },
  divider: {
    width: 0.5,
    height: "65%",
    backgroundColor: "rgba(255, 255, 255, 0.48)",
    marginHorizontal: 10,
  },
});

export default SummaryCard;
