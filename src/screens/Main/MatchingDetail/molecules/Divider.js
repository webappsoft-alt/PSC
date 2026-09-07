import { StyleSheet, View } from "react-native";

const Divider = () => {
  return <View style={styles.conatiner} />;
};

export default Divider;

const styles = StyleSheet.create({
  conatiner: {
    height: 1,
    backgroundColor: "#262626",
    marginBottom: 18,
    overflow: "hidden",
  },
});
