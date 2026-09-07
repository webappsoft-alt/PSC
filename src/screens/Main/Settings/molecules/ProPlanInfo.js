import { StyleSheet, View } from "react-native";
import CustomText from "../../../../components/CustomText";

const ProPlanInfo = () => {
  return (
    <View style={styles.container}>
      <CustomText
        label={
          "Match with industry professionals. Access a restricted circles of the top tier of music industry."
        }
        lineHeight={14 * 1.5}
      />
    </View>
  );
};

export default ProPlanInfo;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#C79D6D29",
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginTop: 20,
  },
});
